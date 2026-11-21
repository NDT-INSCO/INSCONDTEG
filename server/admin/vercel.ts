import { createHostedOperationsHandler } from './hosted.js';

export function createVercelHandler(env: NodeJS.ProcessEnv) {
  // Vercel overwrites the forwarding header at its edge, rather than trusting client values.
  return createHostedOperationsHandler(env, 1);
}
