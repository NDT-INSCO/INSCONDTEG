import { createHash, generateKeyPairSync, randomBytes, sign } from 'node:crypto';
import { isoCBOR } from '@simplewebauthn/server/helpers';
import type { PublicKeyCredentialCreationOptionsJSON, PublicKeyCredentialRequestOptionsJSON } from '@simplewebauthn/server';

function hash(data: string | Uint8Array) { return createHash('sha256').update(data).digest(); }

/** A local test authenticator owns its own random key; the app receives only valid WebAuthn proofs. */
export function authenticator(siteOrigin: string) {
  const elliptic = generateKeyPairSync('ec', { namedCurve: 'prime256v1' });
  const jwk = elliptic.publicKey.export({ format: 'jwk' });
  const rawID = randomBytes(32);
  const id = rawID.toString('base64url');
  let counter = 0;
  function clientData(type: string, challenge: string, origin: string) {
    return Buffer.from(JSON.stringify({ type, challenge, origin, crossOrigin: false }));
  }
  return {
    id,
    registration(options: PublicKeyCredentialCreationOptionsJSON, verified = true) {
      const data = clientData('webauthn.create', options.challenge, siteOrigin);
      const cose = isoCBOR.encode(new Map<number, number | Uint8Array>([
        [1, 2], [3, -7], [-1, 1], [-2, Buffer.from(jwk.x!, 'base64url')], [-3, Buffer.from(jwk.y!, 'base64url')],
      ]));
      const idLength = Buffer.alloc(2);
      idLength.writeUInt16BE(rawID.length);
      const authData = Buffer.concat([
        hash(options.rp.id!), Buffer.from([verified ? 0x45 : 0x41]), Buffer.alloc(4), Buffer.alloc(16), idLength, rawID, cose,
      ]);
      const attestation = isoCBOR.encode(new Map<string, unknown>([['fmt', 'none'], ['attStmt', new Map()], ['authData', authData]]));
      return {
        id, rawId: id, type: 'public-key', clientExtensionResults: {},
        response: { clientDataJSON: data.toString('base64url'), attestationObject: Buffer.from(attestation).toString('base64url') },
      };
    },
    assertion(options: PublicKeyCredentialRequestOptionsJSON, userHandle: string, { verified = true, origin = siteOrigin }: { verified?: boolean; origin?: string } = {}) {
      const data = clientData('webauthn.get', options.challenge, origin);
      const signCount = Buffer.alloc(4);
      signCount.writeUInt32BE(++counter);
      const authData = Buffer.concat([hash(options.rpId!), Buffer.from([verified ? 0x05 : 0x01]), signCount]);
      const signature = sign('sha256', Buffer.concat([authData, hash(data)]), elliptic.privateKey);
      return {
        id, rawId: id, type: 'public-key', clientExtensionResults: {},
        response: { clientDataJSON: data.toString('base64url'), authenticatorData: authData.toString('base64url'), signature: signature.toString('base64url'), userHandle },
      };
    },
  };
}
