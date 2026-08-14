/**
 * Discover the real API surface from the vendor's published sitemap.
 *
 *   npm run discover
 *
 * The documentation is a client-rendered SPA, so its content cannot be scraped
 * — but its sitemap lists one URL per documented endpoint, with the path
 * JSON-Pointer encoded (~1 for /). That gives the exact method, path and
 * version for every API, which is far more reliable than guessing names.
 *
 * This is how the Apparel VTO path was found: it lives under /s2s/v2.0/,
 * not the /s2s/v1.0/ namespace used by skin analysis.
 */

import { resilientFetch } from '../services/youcam/client.js';

const decode = (s) => decodeURIComponent(s).replace(/~1/g, '/');

const res = await resilientFetch('https://docs.perfectcorp.com/sitemap.xml', {
  method: 'GET',
  headers: { 'User-Agent': 'Mozilla/5.0' },
});
const xml = await res.text();
const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);

const endpoints = urls
  .map((u) => u.match(/reference\/([^/]+)\/([^/]+)\/paths\/(.+)\/(get|post|put|delete)$/))
  .filter(Boolean)
  .map((m) => ({ api: m[1], version: m[2], path: decode(m[3]), method: m[4].toUpperCase() }));

console.log(`\n  ${urls.length} documented pages · ${endpoints.length} endpoints\n`);

const group = (label, test) => {
  const rows = endpoints.filter((e) => test(e));
  if (!rows.length) return;
  console.log(`  ${label}`);
  rows
    .sort((a, b) => a.path.localeCompare(b.path))
    .forEach((e) => console.log(`    ${e.method.padEnd(5)} ${e.path.padEnd(48)} ${e.api} ${e.version}`));
  console.log('');
};

const filter = process.argv[2];
if (filter) {
  group(`matching "${filter}"`, (e) => new RegExp(filter, 'i').test(e.api + e.path));
} else {
  group('SKIN ANALYSIS', (e) => /skin_analysis/.test(e.api));
  group('APPAREL / CLOTHES', (e) => /^ai_clothes/.test(e.api));
  group('MAKEUP', (e) => /makeup|look_vto/.test(e.api));
  console.log(`  ${new Set(endpoints.map((e) => e.api)).size} distinct APIs documented.`);
  console.log('  Pass a filter to see others, e.g. npm run discover -- earrings\n');
}
