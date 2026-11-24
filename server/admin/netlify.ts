import { isIP } from 'node:net';
import type { Context } from '@netlify/types';
import serverlessHttp from 'serverless-http';
import { createHostedOperationsHandler, HOSTED_RESPONSE_HEADERS } from './hosted.js';
import { httpOrigin } from './router.js';

interface BridgeResponse {
  statusCode: number;
  headers: Record<string, string>;
  cookies: string[];
  body: string;
}

// The largest JSON endpoint is the RFQ (96 KiB). Express applies its own
// smaller limits on password and passkey requests.
const MAX_BODY_BYTES = 96 * 1024;

export function createNetlifyHandler(env: NodeJS.ProcessEnv) {
  const origin = httpOrigin(env.ADMIN_ORIGIN?.trim());
  const pagesAdmin = env.ADMIN_PAGES_ENABLED === 'true';
  const dispatch = serverlessHttp(createHostedOperationsHandler(env, false, { pagesAdmin }), { binary: false });

  return async (request: Request, context: Pick<Context, 'deploy' | 'ip'>): Promise<Response> => {
    const head = request.method === 'HEAD';
    const errorResponse = (status: number, error: string) => new Response(head ? null : JSON.stringify({ error }), {
      status, headers: { ...HOSTED_RESPONSE_HEADERS, 'Content-Type': 'application/json' },
    });

    // Deploy Preview, branch builds, and old versions must not reuse live
    // credentials or connect to the production database, even if misconfigured.
    if (context.deploy.context !== 'production' || !context.deploy.published || !origin?.startsWith('https://')) {
      return errorResponse(503, 'not_configured');
    }
    const url = new URL(request.url);
    if (url.origin !== origin) return errorResponse(403, 'origin_not_allowed');

    if (Number(request.headers.get('content-length')) > MAX_BODY_BYTES) return errorResponse(413, 'invalid_request');
    // Keep only the headers used by the application. The bridge derives
    // content-length from the copied bytes and req.ip from platform metadata.
    const headers: Record<string, string> = { host: url.host };
    for (const name of ['content-type', 'cookie', 'origin', 'authorization', 'access-control-request-method', 'access-control-request-headers']) {
      const value = request.headers.get(name);
      if (value !== null) headers[name] = value;
    }
    try {
      const body = request.body ? Buffer.from(await request.arrayBuffer()) : undefined;
      if (body && body.length > MAX_BODY_BYTES) return errorResponse(413, 'invalid_request');
      const result = await dispatch({
        version: '2.0',
        rawPath: url.pathname,
        rawQueryString: url.search.slice(1),
        headers,
        body,
        requestContext: { http: { method: request.method, sourceIp: isIP(context.ip) ? context.ip : undefined } },
      }, {}) as BridgeResponse;
      const responseHeaders = new Headers(result.headers);
      for (const cookie of result.cookies) responseHeaders.append('Set-Cookie', cookie);
      const noBody = head || [204, 205, 304].includes(result.statusCode);
      return new Response(noBody ? null : result.body, { status: result.statusCode, headers: responseHeaders });
    } catch {
      // Do not log requests or exception details that could contain secrets.
      console.error('[admin] Could not complete the Netlify function request.');
      return errorResponse(503, 'storage_error');
    }
  };
}
