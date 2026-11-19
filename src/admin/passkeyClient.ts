import { browserSupportsWebAuthn, startAuthentication, startRegistration, WebAuthnAbortService, WebAuthnError } from '@simplewebauthn/browser';
import { adminClient, AdminApiError } from './client';

export function passkeyBrowser(): 'ready' | 'embedded' | 'unsupported' {
  if (typeof window === 'undefined') return 'unsupported';
  if (window.top !== window) return 'embedded';
  return window.isSecureContext && browserSupportsWebAuthn() ? 'ready' : 'unsupported';
}

function ensureActive(signal: AbortSignal) {
  if (signal.aborted) throw new DOMException('Cancelled', 'AbortError');
}

async function withDevice<T>(signal: AbortSignal, prompt: () => Promise<T>): Promise<T> {
  ensureActive(signal);
  const cancel = () => WebAuthnAbortService.cancelCeremony();
  signal.addEventListener('abort', cancel, { once: true });
  try {
    return await prompt();
  } catch (error) {
    ensureActive(signal);
    if (error instanceof WebAuthnError && error.code === 'ERROR_AUTHENTICATOR_PREVIOUSLY_REGISTERED') {
      throw new AdminApiError('passkey_exists');
    }
    throw new AdminApiError('passkey_prompt_failed');
  } finally {
    signal.removeEventListener('abort', cancel);
  }
}

export async function signInWithPasskey(signal: AbortSignal) {
  if (passkeyBrowser() !== 'ready') throw new AdminApiError('passkey_browser');
  const optionsJSON = await adminClient.passkeyAuthOptions(signal);
  const response = await withDevice(signal, () => startAuthentication({ optionsJSON }));
  ensureActive(signal);
  await adminClient.passkeyAuthVerify(response, signal);
}

export async function enrollPasskey(label: string, signal: AbortSignal) {
  if (passkeyBrowser() !== 'ready') throw new AdminApiError('passkey_browser');
  const optionsJSON = await adminClient.passkeyRegisterOptions(label, signal);
  const response = await withDevice(signal, () => startRegistration({ optionsJSON }));
  ensureActive(signal);
  return adminClient.passkeyRegisterVerify(response, signal);
}
