/**
 * Vercel deployment helper —
 * The site auto-deploys via GitHub Actions on push to `main`.
 * This utility is for manual checks from the admin panel.
 */

export interface DeployStatus {
  state: 'READY' | 'BUILDING' | 'ERROR' | 'QUEUED' | 'CANCELED';
  url?: string;
  createdAt?: string;
}

/**
 * Check if the site is running on Vercel (preview deployments)
 */
export function isVercelEnvironment(): boolean {
  return typeof window !== 'undefined' && window.location.hostname.includes('vercel.app');
}

/**
 * Get deployment info from Vercel API (requires token in env)
 * This is called from server.ts, not directly from browser for security.
 */
export async function getDeploymentStatus(deploymentId: string, token: string): Promise<DeployStatus | null> {
  try {
    const res = await fetch(`https://api.vercel.com/v13/deployments/${deploymentId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return null;
    const data = await res.json() as { readyState: DeployStatus['state']; url: string; createdAt: number };
    return {
      state: data.readyState,
      url: data.url,
      createdAt: new Date(data.createdAt).toISOString(),
    };
  } catch {
    return null;
  }
}

/**
 * Trigger a redeploy via Deploy Hook (if configured)
 */
export async function triggerRedeploy(hookUrl: string): Promise<boolean> {
  try {
    const res = await fetch(hookUrl, { method: 'POST' });
    return res.ok;
  } catch {
    return false;
  }
}
