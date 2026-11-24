/** Owner-run Firebase Admin utility to grant or revoke the private-book claim. */
import { getPrivateKnowledgeServices } from '../server/ai/privateKnowledge.js';

async function main() {
  const target = process.argv[2]?.trim();
  if (!target) throw new Error('Pass a Firebase Auth UID (or email) as the first argument.');
  const services = getPrivateKnowledgeServices();
  if (!services) throw new Error('INSCO_PRIVATE_KNOWLEDGE_SERVICE_ACCOUNT is not configured.');
  const revoke = process.argv.includes('--revoke');
  const user = target.includes('@') ? await services.auth.getUserByEmail(target) : await services.auth.getUser(target);
  const claims = { ...(user.customClaims ?? {}) };
  if (revoke) delete claims.inscoKnowledgeAccess;
  else claims.inscoKnowledgeAccess = true;
  await services.auth.setCustomUserClaims(user.uid, claims);
  console.log(revoke ? 'Private knowledge access revoked.' : 'Private knowledge access granted. The user must refresh/sign in to receive a new ID token.');
}

void main().catch(error => {
  console.error(error instanceof Error ? error.message : 'Could not update private knowledge access.');
  process.exitCode = 1;
});
