import { createHmac, timingSafeEqual } from 'node:crypto';

const TASK_ID = /^[A-Za-z0-9_-]{1,200}$/;
const RECEIPT = /^v1\.(\d{13})\.([A-Za-z0-9_-]{43})$/;
const TTL_MS = 60 * 60_000;

/** A task ID is a locator, not authorization to read account data with our key. */
export function createManusTaskReceipts(env: NodeJS.ProcessEnv, now = Date.now) {
  const apiKey = env.MANUS_API_KEY?.trim();
  // Domain separation: never send the provider key or a value usable as that key.
  const signingKey = apiKey && createHmac('sha256', apiKey).update('insco:manus:task-receipt:v1').digest();
  const sign = (taskId: string, until: number) => signingKey
    ? createHmac('sha256', signingKey).update(JSON.stringify([taskId, until])).digest('base64url')
    : null;
  return {
    issue(taskId: string): string | null {
      if (!TASK_ID.test(taskId)) return null;
      const until = now() + TTL_MS;
      const mac = sign(taskId, until);
      return mac ? `v1.${until}.${mac}` : null;
    },
    allows(taskId: string, receipt: string | undefined): boolean {
      if (!TASK_ID.test(taskId) || !receipt || receipt.length > 64) return false;
      const parts = RECEIPT.exec(receipt);
      if (!parts) return false;
      const until = Number(parts[1]);
      if (until <= now()) return false;
      const mac = sign(taskId, until);
      return Boolean(mac && timingSafeEqual(Buffer.from(mac), Buffer.from(parts[2])));
    },
  };
}
