/**
 * Link monitor for the external reading anchors.
 *
 *   npm run links:check          structural audit only (offline, deterministic)
 *   npm run links:check:online   structural audit + reachability (needs network)
 *
 * Structural failures exit 1 so CI can gate on them. Reachability failures also
 * exit 1 in `--online` mode, but that mode is meant for a scheduled workflow, not
 * for every push: a site being briefly unavailable should not block a merge.
 */
import { NDE_ED_SOURCES } from '../src/data/ndeEd/sources';
import { auditLinks, summariseReachability, ReachabilityResult } from '../src/utils/linkAudit';

const online = process.argv.includes('--online');
const timeoutMs = Number(process.env.LINK_TIMEOUT_MS || 15000);

const links = NDE_ED_SOURCES.map(source => ({
  id: source.id,
  title: source.title,
  url: source.url,
  publisher: source.publisher,
}));

const audit = auditLinks(links);

console.log(`Link audit: ${audit.total} sources`);
console.log(`Hosts: ${Object.entries(audit.hosts).map(([host, count]) => `${host} (${count})`).join(', ')}`);

if (audit.issues.length === 0) {
  console.log('✓ Structure: no issues');
} else {
  for (const issue of audit.issues) {
    const tag = issue.severity === 'error' ? '✗' : '!';
    console.log(`  ${tag} [${issue.code}] ${issue.id} — ${issue.message}`);
  }
}

if (!audit.ok) {
  console.error('\nLink structure failed. Fix the errors above.');
  process.exit(1);
}

if (!online) {
  console.log('✓ Structure check passed (reachability skipped; use --online)');
  process.exit(0);
}

async function check(link: { id: string; url: string }): Promise<ReachabilityResult> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    // Prefer HEAD; fall back to GET because some servers reject HEAD.
    let response = await fetch(link.url, { method: 'HEAD', signal: controller.signal, redirect: 'follow' });
    if (response.status === 405 || response.status === 403) {
      response = await fetch(link.url, { method: 'GET', signal: controller.signal, redirect: 'follow', headers: { range: 'bytes=0-1024' } });
    }
    return {
      id: link.id,
      url: link.url,
      status: response.status,
      ok: response.status >= 200 && response.status < 400,
      location: response.redirected ? response.url : undefined,
    };
  } catch (error) {
    const aborted = error instanceof Error && error.name === 'AbortError';
    return {
      id: link.id,
      url: link.url,
      status: aborted ? 'timeout' : 'error',
      ok: false,
    };
  } finally {
    clearTimeout(timer);
  }
}

const results: ReachabilityResult[] = [];
const queue = [...links];
const workers = Array.from({ length: 4 }, async () => {
  for (;;) {
    const next = queue.shift();
    if (!next) return;
    results.push(await check(next));
  }
});

await Promise.all(workers);

const reach = summariseReachability(results);

// If nothing at all answered, this is the environment, not the links.
const noResponses = results.every(result => result.status === 'error' || result.status === 'timeout');
if (noResponses && results.length > 0) {
  console.error('\nNo HTTP response from any anchor. This looks like a blocked or offline network, not broken links.');
  console.error('Re-run where outbound HTTPS is available (the scheduled workflow does this).');
  process.exit(2);
}

console.log(`\nReachability: ${reach.reachable}/${reach.checked} reachable`);
for (const failure of reach.failed) {
  console.log(`  ✗ ${failure.id} — ${failure.status} — ${failure.url}`);
}

if (!reach.ok) {
  console.error('\nSome anchors are unreachable. Review them before relying on the reading list.');
  process.exit(1);
}

console.log('✓ All anchors reachable');
