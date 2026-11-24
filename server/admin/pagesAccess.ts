import type { RequestHandler } from 'express';
import { INSCO_PAGES_ORIGIN } from '../../src/admin/contract.js';
import { fail } from './http.js';

const METHODS = ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE'];
const HEADERS = ['authorization', 'content-type'];

/** Transport restriction only. Every private route still verifies its server-side session. */
export function pagesAdminAccess(enabled: boolean): RequestHandler {
  return (req, res, next) => {
    if (!enabled) return fail(res, 404, 'not_found');
    res.vary('Origin');
    if (req.get('origin') !== INSCO_PAGES_ORIGIN) return fail(res, 403, 'origin_not_allowed');

    if (req.method === 'OPTIONS') {
      res.vary('Access-Control-Request-Method');
      res.vary('Access-Control-Request-Headers');
      const method = req.get('Access-Control-Request-Method') ?? '';
      const headers = (req.get('Access-Control-Request-Headers') ?? '').toLowerCase().split(',').map(h => h.trim()).filter(Boolean);
      if (!METHODS.includes(method) || !headers.every(name => HEADERS.includes(name))) {
        return fail(res, 403, 'origin_not_allowed');
      }
      res.set({
        'Access-Control-Allow-Origin': INSCO_PAGES_ORIGIN,
        'Access-Control-Allow-Methods': METHODS.join(', '),
        'Access-Control-Allow-Headers': 'Authorization, Content-Type',
        'Access-Control-Max-Age': '300',
      });
      res.status(204).end();
      return;
    }
    res.set({ 'Access-Control-Allow-Origin': INSCO_PAGES_ORIGIN, 'Access-Control-Expose-Headers': 'Retry-After' });
    if (!METHODS.includes(req.method)) return fail(res, 405, 'invalid_request');
    next();
  };
}
