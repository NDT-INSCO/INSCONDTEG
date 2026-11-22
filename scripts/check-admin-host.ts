import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ADMIN_API } from '../src/admin/contract';
import { externalAdminLink } from '../src/admin/public';

const help = {
  invalid_url: 'Use the canonical HTTPS admin origin (optionally with #admin), not a Pages URL or a URL with credentials, a query or a subpath.',
  redirect: 'The dashboard request was redirected. Check the canonical production address and deployment protection.',
  missing_api: 'The admin API was not found. Deploy the hosted build and its /api/admin routes, not the static Pages build.',
  not_configured: 'Check Production ADMIN_ORIGIN, ADMIN_PASSWORD, ADMIN_STATE_KEY and the libSQL database URL/token. Redeploy after saving them.',
  origin_not_allowed: 'Use the same production origin as ADMIN_ORIGIN, not a deployment preview or an alias.',
  storage_error: 'Check the libSQL database URL, scoped read/write token and database availability.',
  unsafe_response: 'The signed-out API response must not be cached or set a cookie. Do not link the portal yet.',
  unexpected_response: 'Expected HTTP 401 with a JSON signed_out error. Check the API route and protection before linking the portal.',
  unreachable: 'Could not reach the admin API. Check the HTTPS address and connection, then try again.',
};

type AdminHostCheck = { code: 'ready'; portal: string } | { code: keyof typeof help; status?: number };

/** Readiness only: no credentials, redirect following, or requests to the login route. */
export async function checkAdminHost(raw: string, request = fetch): Promise<AdminHostCheck> {
  const portal = externalAdminLink(raw);
  if (!portal || new URL(portal).pathname !== '/') return { code: 'invalid_url' };

  try {
    const response = await request(new URL(`${ADMIN_API}/dashboard`, portal).href, {
      method: 'GET', credentials: 'omit', cache: 'no-store', redirect: 'manual',
      headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(10_000),
    });
    const { status } = response;
    try {
      if (status >= 300 && status < 400) return { code: 'redirect', status };
      if (status === 404) return { code: 'missing_api', status };
      const contentType = response.headers.get('content-type')?.split(';', 1)[0].trim().toLowerCase();
      // Never read or print a success payload from a private endpoint without a session.
      if (![401, 403, 500, 503].includes(status) || contentType !== 'application/json') {
        return { code: 'unexpected_response', status };
      }
      let code: unknown;
      try {
        const data = await response.json();
        code = data?.error;
      } catch {
        return { code: 'unexpected_response', status };
      }
      if (status === 401 && code === 'signed_out') {
        const cache = response.headers.get('cache-control')?.toLowerCase().split(',').map(value => value.trim());
        return cache?.includes('no-store') && !response.headers.has('set-cookie')
          ? { code: 'ready', portal }
          : { code: 'unsafe_response', status };
      }
      if (status === 403 && code === 'origin_not_allowed') return { code, status };
      if (status === 503 && code === 'not_configured') return { code, status };
      if ((status === 500 || status === 503) && code === 'storage_error') return { code, status };
      return { code: 'unexpected_response', status };
    } finally {
      if (!response.bodyUsed) await response.body?.cancel().catch(() => {});
    }
  } catch {
    // Exception messages may include sensitive details; report only our classification.
    return { code: 'unreachable' };
  }
}

async function main(args: string[]) {
  if (args.length !== 1 || args[0] === '--help' || args[0] === '-h') {
    console.log('Usage: npm run admin:check -- https://your-admin-host.example');
    return args.length === 1 ? 0 : 2;
  }
  const result = await checkAdminHost(args[0]);
  if (result.code !== 'ready') {
    console.error(`✗ ${result.code}${result.status ? ` (HTTP ${result.status})` : ''}: ${help[result.code]}`);
    return result.code === 'invalid_url' ? 2 : 1;
  }
  console.log(`✓ ${result.portal} — signed-out API check passed (HTTP 401, signed_out).`);
  console.log('Test sign-in and sign-out on that host before setting VITE_ADMIN_PORTAL_URL on Pages.');
  return 0;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  process.exitCode = await main(process.argv.slice(2));
}
