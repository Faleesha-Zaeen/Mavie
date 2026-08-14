/**
 * Find the right Perfect Corp host.
 *
 *   npm run find:youcam
 *
 * Separates two very different problems:
 *   DNS fails      → the hostname does not exist (wrong base URL)
 *   DNS ok, no TCP → the host exists but something is blocking you
 */

import 'dotenv/config';
import dns from 'node:dns/promises';

const ok = (s) => `\x1b[32m✓\x1b[0m ${s}`;
const bad = (s) => `\x1b[31m✗\x1b[0m ${s}`;
const warn = (s) => `\x1b[33m!\x1b[0m ${s}`;

const HOSTS = [
  // makeupar.com — confirmed reachable, this is where the AI API portal lives
  'yce.makeupar.com',
  'api.makeupar.com',
  'yce-api.makeupar.com',
  // perfectcorp.com — documented S2S hosts
  'yce-api-01.perfectcorp.com',
  'yce-api-02.perfectcorp.com',
  'yce-api.perfectcorp.com',
  'api.perfectcorp.com',
  'openapi.perfectcorp.com',
  'docs.perfectcorp.com',
  'www.perfectcorp.com',
];

console.log('\n  💗 MAVIE · finding the Perfect Corp host\n');

/* ── Baseline: is general internet + DNS working at all? ─────────────── */
try {
  await dns.lookup('www.google.com');
  console.log(ok('DNS works (resolved google.com)'));
} catch {
  console.log(bad('DNS is not working at all — this is a local network problem.'));
  process.exit(1);
}

try {
  const ctl = new AbortController();
  setTimeout(() => ctl.abort(), 8000);
  await fetch('https://www.google.com', { signal: ctl.signal });
  console.log(ok('Outbound HTTPS works (reached google.com)\n'));
} catch {
  console.log(warn('Cannot reach google.com over HTTPS — check proxy/firewall.\n'));
}

/* ── Probe each candidate host ───────────────────────────────────────── */
let anyResolved = false;
let anyReachable = false;

for (const host of HOSTS) {
  let ip = null;
  try {
    ({ address: ip } = await dns.lookup(host));
    anyResolved = true;
  } catch {
    console.log(bad(`${host.padEnd(32)} DNS: does not resolve`));
    continue;
  }

  try {
    const ctl = new AbortController();
    setTimeout(() => ctl.abort(), 8000);
    const res = await fetch(`https://${host}`, { signal: ctl.signal });
    anyReachable = true;
    console.log(ok(`${host.padEnd(32)} DNS ${ip} · HTTPS ${res.status}`));
  } catch (err) {
    const why = err.cause?.code || err.name;
    console.log(warn(`${host.padEnd(32)} DNS ${ip} · but no connection (${why})`));
  }
}

/* ── Verdict ─────────────────────────────────────────────────────────── */
console.log('');

if (anyReachable) {
  console.log(ok('At least one host is reachable.'));
  console.log('  Set YOUCAM_API_BASE in server/.env to the reachable https:// host above.');
} else if (anyResolved) {
  console.log(warn('Hosts resolve but nothing connects.'));
  console.log('  The servers exist, so something is blocking you:');
  console.log('    · college/office wifi filtering  → try a phone hotspot');
  console.log('    · antivirus or firewall          → allow node.exe');
  console.log('    · VPN                            → turn it off and retry');
} else {
  console.log(bad('No Perfect Corp host resolves at all.'));
  console.log('  The base URL is likely wrong. Log in to the Perfect Corp console');
  console.log('  and copy the exact API base URL from their documentation.');
}

console.log('\n  Put the reachable host above into YOUCAM_API_BASE.\n');
