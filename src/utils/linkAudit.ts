/**
 * Structural link audit for the NDE-Ed reading anchors and any other external
 * reference list.
 *
 * Structural checks run offline and deterministically, so CI can enforce them on
 * every push. Reachability checks are separate (they need the network) and are
 * reported, never guessed.
 */

export interface AuditableLink {
  id: string;
  title: string;
  url: string;
  publisher?: string;
}

export interface LinkAuditIssue {
  id: string;
  url: string;
  severity: 'error' | 'warning';
  code:
    | 'invalid-url'
    | 'not-https'
    | 'unexpected-host'
    | 'duplicate-url'
    | 'duplicate-id'
    | 'missing-title'
    | 'suspicious-path'
    | 'placeholder';
  message: string;
}

export interface LinkAuditResult {
  total: number;
  hosts: Record<string, number>;
  issues: LinkAuditIssue[];
  /** True when no error-severity issue was found. */
  ok: boolean;
}

const ALLOWED_HOSTS = new Set(['www.nde-ed.org', 'nde-ed.org', 'www.asnt.org', 'asnt.org']);
const PLACEHOLDER = /(example\.com|localhost|127\.0\.0\.1|TODO|TBD|xxx)/i;

export function auditLinks(links: AuditableLink[], allowedHosts: Set<string> = ALLOWED_HOSTS): LinkAuditResult {
  const issues: LinkAuditIssue[] = [];
  const seenUrls = new Map<string, string>();
  const seenIds = new Set<string>();
  const hosts: Record<string, number> = {};

  for (const link of links) {
    const base = { id: link.id, url: link.url };

    if (!link.id || seenIds.has(link.id)) {
      issues.push({ ...base, severity: 'error', code: 'duplicate-id', message: `duplicate or empty source id: ${link.id}` });
    }
    seenIds.add(link.id);

    if (!link.title || link.title.trim().length < 4) {
      issues.push({ ...base, severity: 'warning', code: 'missing-title', message: 'source title is missing or too short' });
    }

    let parsed: URL | null = null;
    try {
      parsed = new URL(link.url);
    } catch {
      issues.push({ ...base, severity: 'error', code: 'invalid-url', message: 'not an absolute URL' });
      continue;
    }

    if (parsed.protocol !== 'https:') {
      issues.push({ ...base, severity: 'error', code: 'not-https', message: `expected https, found ${parsed.protocol}` });
    }

    const host = parsed.hostname.toLowerCase();
    hosts[host] = (hosts[host] || 0) + 1;
    if (!allowedHosts.has(host)) {
      issues.push({ ...base, severity: 'error', code: 'unexpected-host', message: `host ${host} is not in the reviewed allowlist` });
    }

    if (PLACEHOLDER.test(link.url) || PLACEHOLDER.test(link.title)) {
      issues.push({ ...base, severity: 'error', code: 'placeholder', message: 'placeholder link left in the data' });
    }

    const normalised = `${parsed.hostname}${parsed.pathname}`.toLowerCase().replace(/\/$/, '');
    const previous = seenUrls.get(normalised);
    if (previous) {
      issues.push({ ...base, severity: 'error', code: 'duplicate-url', message: `same URL already used by ${previous}` });
    } else {
      seenUrls.set(normalised, link.id);
    }

    // nde-ed.org serves `.xhtml`; a `.html` sibling is usually a typo.
    if (host.endsWith('nde-ed.org') && /\.html?$/i.test(parsed.pathname)) {
      issues.push({ ...base, severity: 'warning', code: 'suspicious-path', message: 'nde-ed.org pages normally end in .xhtml' });
    }
    if (parsed.pathname.length > 1 && parsed.pathname.endsWith('/')) {
      issues.push({ ...base, severity: 'warning', code: 'suspicious-path', message: 'trailing slash may not resolve on this host' });
    }
  }

  return {
    total: links.length,
    hosts,
    issues,
    ok: !issues.some(issue => issue.severity === 'error'),
  };
}

export interface ReachabilityResult {
  id: string;
  url: string;
  status: number | 'timeout' | 'error';
  ok: boolean;
  location?: string;
}

export function summariseReachability(results: ReachabilityResult[]) {
  const failed = results.filter(result => !result.ok);
  return {
    checked: results.length,
    reachable: results.length - failed.length,
    failed,
    ok: failed.length === 0,
  };
}
