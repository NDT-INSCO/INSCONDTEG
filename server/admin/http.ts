import express, { type Request, type RequestHandler, type Response } from 'express';
import { isAdminToken } from '../../src/admin/contract.js';

export function fail(res: Response, status: number, error: string) {
  res.status(status).json({ error });
}

/** Express 4 forwards synchronous errors, but needs an explicit async boundary. */
export function runAsync(handler: (req: Request, res: Response, next: (error?: unknown) => void) => Promise<void>): RequestHandler {
  return (req, res, next) => { void handler(req, res, next).catch(next); };
}

export function clientAddress(req: Request) {
  return req.ip ?? req.socket.remoteAddress ?? 'unknown';
}

export function readJsonBody(limit = '4kb'): RequestHandler[] {
  return [
    (req, res, next) => {
      if (!req.is('application/json')) return fail(res, 415, 'invalid_request');
      next();
    },
    express.json({ limit }),
  ];
}

/** Both session and ceremony cookies hold opaque, server-generated 32-byte tokens. */
export function readTokenCookie(req: Request, name: string): string | undefined {
  const prefix = `${name}=`;
  const value = req.get('cookie')?.split(';').map(pair => pair.trim()).find(pair => pair.startsWith(prefix))?.slice(prefix.length);
  return isAdminToken(value) ? value : undefined;
}
