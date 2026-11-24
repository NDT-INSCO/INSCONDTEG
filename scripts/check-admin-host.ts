import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ADMIN_API, INSCO_PAGES_ORIGIN, PAGES_ADMIN_API } from '../src/admin/contract';
import { FACTORY_DRAFT_PATH } from '../src/admin/factory';
import { approvedPagesAdminOrigin, INSCO_PAGES_ADMIN_API_URL } from '../src/admin/pages';
import { externalAdminLink, OFFICIAL_PAGES_ADMIN_URL } from '../src/admin/public';

const help = {
  invalid_url: 'Use a canonical HTTPS admin host with no credentials, query or subpath. For --pages-api use the Netlify production origin without #admin.',
  redirect: 'The dashboard request was redirected. Check the canonical production address and deployment protection.',
  missing_api: 'The admin API was not found. Deploy the hosted build and its /api/admin routes, not the static Pages build.',
  not_configured: 'Check Production ADMIN_ORIGIN, ADMIN_PASSWORD, ADMIN_STATE_KEY and the libSQL database URL/token (and ADMIN_PAGES_ENABLED=true for Pages). Redeploy after saving them.',
  origin_not_allowed: 'Use the same production origin as ADMIN_ORIGIN, not a deployment preview or an alias.',
  storage_error: 'Check the libSQL database URL, scoped read/write token and database availability.',
  unsafe_response: 'The signed-out API response must not be cached or set a cookie. Do not link the portal yet.',
  cors: 'The Pages API must handle preflight, accept only the official Pages origin, and never allow cross-site cookies.',
  unexpected_response: 'Expected HTTP 401 with a JSON signed_out error. Check the API route and protection before linking the portal.',
  unreachable: 'Could not reach the admin API. Check the HTTPS address and connection, then try again.',
};

type AdminHostCheck = { code: 'ready'; portal: string } | { code: keyof typeof help; status?: number };
const headerValues = (response: Response, header: string) => response.headers.get(header)?.toLowerCase().split(',').map(value => value.trim()) ?? [];
const noStore = (response: Response) => headerValues(response, 'Cache-Control').includes('no-store') && !response.headers.has('Set-Cookie');
const pagesCors = (response: Response) => response.headers.get('Access-Control-Allow-Origin') === INSCO_PAGES_ORIGIN
  && !response.headers.has('Access-Control-Allow-Credentials') && headerValues(response, 'Vary').includes('origin');

/** Readiness only: no credentials, redirect following, or requests to the login route. */
export async function checkAdminHost(raw: string, request = fetch): Promise<AdminHostCheck> {
  const portal = externalAdminLink(raw);
  if (!portal || new URL(portal).pathname !== '/') return { code: 'invalid_url' };

  return checkSignedOut(portal, `${ADMIN_API}/dashboard`, request);
}

function probe(url: string, request: typeof fetch, init: RequestInit): Promise<Response> {
  return request(url, { credentials: 'omit', cache: 'no-store', redirect: 'manual', signal: AbortSignal.timeout(10_000), ...init });
}

async function checkSignedOut(portal: string, path: string, request: typeof fetch, pages = false, method = 'GET'): Promise<AdminHostCheck> {
  try {
    const response = await probe(new URL(path, portal).href, request, {
      method,
      headers: {
        Accept: 'application/json', ...(pages ? { Origin: INSCO_PAGES_ORIGIN } : {}),
        ...(method === 'POST' ? { 'Content-Type': 'application/json' } : {}),
      },
      ...(method === 'POST' ? { body: '{}' } : {}),
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
        if (!noStore(response)) return { code: 'unsafe_response', status };
        if (pages && !pagesCors(response)) return { code: 'cors', status };
        return { code: 'ready', portal };
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

/** No password, session, publication, or generation: check the Pages transport contract. */
export async function checkPagesAdminHost(raw: string, request = fetch): Promise<AdminHostCheck> {
  const origin = approvedPagesAdminOrigin(raw);
  if (!origin) return { code: 'invalid_url' };
  const path = `${PAGES_ADMIN_API}/dashboard`;
  const signedOut = await checkSignedOut(origin, path, request, true);
  if (signedOut.code !== 'ready') return signedOut;
  try {
    const preflight = await probe(`${origin}${PAGES_ADMIN_API}/announcement`, request, {
      method: 'OPTIONS', headers: {
        Origin: INSCO_PAGES_ORIGIN, 'Access-Control-Request-Method': 'PUT',
        'Access-Control-Request-Headers': 'authorization,content-type',
      },
    });
    await preflight.body?.cancel().catch(() => {});
    const methods = headerValues(preflight, 'Access-Control-Allow-Methods');
    const headers = headerValues(preflight, 'Access-Control-Allow-Headers');
    if (preflight.status !== 204 || !pagesCors(preflight) || !noStore(preflight)
      || !methods.includes('put') || methods.includes('*') || headers.includes('*')
      || !['authorization', 'content-type'].every(header => headers.includes(header))) {
      return { code: 'cors', status: preflight.status };
    }
    const refused = await probe(`${origin}${path}`, request, { method: 'GET', headers: { Origin: 'https://unrelated.example' } });
    await refused.body?.cancel().catch(() => {});
    if (refused.status !== 403 || refused.headers.has('Access-Control-Allow-Origin')
      || refused.headers.has('Access-Control-Allow-Credentials') || !noStore(refused)) {
      return { code: 'cors', status: refused.status };
    }
  } catch {
    return { code: 'unreachable' };
  }
  return checkSignedOut(origin, `${PAGES_ADMIN_API}${FACTORY_DRAFT_PATH}`, request, true, 'POST');
}

async function main(args: string[]) {
  const mode = args[0];
  const pagesApi = mode === '--pages-api';
  const helpRequested = args.length === 1 && ['--help', '-h'].includes(mode);
  if (args.length !== (pagesApi ? 2 : 1) || helpRequested) {
    console.log('Usage: npm run admin:check -- https://your-admin-host.example');
    console.log('Check a new Pages API: npm run admin:check -- --pages-api https://your-production-site.netlify.app');
    console.log('Check the currently configured INSCO Pages destination: npm run admin:check -- --pages-default');
    return helpRequested ? 0 : 2;
  }
  const pagesDefault = mode === '--pages-default';
  const override = process.env.VITE_ADMIN_PORTAL_URL?.trim();
  if (pagesDefault && override === 'off') {
    console.log('The Pages admin entry is explicitly disabled; no host requested.');
    return 0;
  }
  const defaultPagesApi = process.env.VITE_PAGES_ADMIN_API_URL?.trim() || INSCO_PAGES_ADMIN_API_URL;
  const pages = pagesApi || (pagesDefault && !override && Boolean(defaultPagesApi) && defaultPagesApi !== 'off');
  const result = pages ? await checkPagesAdminHost(pagesApi ? args[1] : defaultPagesApi)
    : await checkAdminHost(pagesDefault ? override || OFFICIAL_PAGES_ADMIN_URL : mode);
  if (result.code !== 'ready') {
    console.error(`✗ ${result.code}${result.status ? ` (HTTP ${result.status})` : ''}: ${help[result.code]}`);
    return result.code === 'invalid_url' ? 2 : 1;
  }
  console.log(`✓ ${result.portal} — signed-out ${pages ? 'Pages API and preflight checks passed' : 'API check passed'} (HTTP 401, signed_out).`);
  console.log(pages
    ? 'Test the Pages build with an isolated login, quotes, announcements, Factory and passkey before enabling production.'
    : 'Test sign-in and sign-out on that host before publishing the link on Pages.');
  return 0;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  process.exitCode = await main(process.argv.slice(2));
}
