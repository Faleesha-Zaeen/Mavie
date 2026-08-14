/**
 * Record and verify the demo path.
 *
 *   npm run demo:record     (server must be running)
 *
 * Walks the exact sequence a judge will see, populates the disk cache from any
 * live API calls, and asserts the run lands on WAIT and then BUY. If the
 * assertions fail the demo is not safe, so this exits non-zero rather than
 * quietly passing.
 */

import 'dotenv/config';
import zlib from 'node:zlib';
import { DEMO_SCENARIO, DEMO_SELECT_CATEGORY, DEMO_PHOTO_SIZE, DEMO_PHOTO_URL, DEMO_FOUND_ITEM, demoPhoto } from '../data/demo.js';

const BASE = `http://localhost:${process.env.PORT || 5000}/api`;

const ok = (s) => console.log(`\x1b[32m✓\x1b[0m ${s}`);
const bad = (s) => console.log(`\x1b[31m✗\x1b[0m ${s}`);
const step = (n, s) => console.log(`\n\x1b[2m${n}.\x1b[0m ${s}`);

async function post(path, body) {
  const res = await fetch(BASE + path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`${path} → ${res.status} ${data.message || ''}`);
  return data;
}

/** Encode the generated demo portrait as a PNG data URL. */
function demoPhotoDataUrl() {
  const { width: W, height: H } = DEMO_PHOTO_SIZE;
  const raw = demoPhoto();
  const table = [...Array(256)].map((_, n) => {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1;
    return c >>> 0;
  });
  const crc = (buf) => {
    let c = 0xFFFFFFFF;
    for (const b of buf) c = table[(c ^ b) & 0xFF] ^ (c >>> 8);
    return (c ^ 0xFFFFFFFF) >>> 0;
  };
  const chunk = (type, data) => {
    const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
    const td = Buffer.concat([Buffer.from(type), data]);
    const cr = Buffer.alloc(4); cr.writeUInt32BE(crc(td));
    return Buffer.concat([len, td, cr]);
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(W, 0); ihdr.writeUInt32BE(H, 4); ihdr[8] = 8; ihdr[9] = 2;
  const png = Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ]);
  return `data:image/png;base64,${png.toString('base64')}`;
}

console.log('\n  💗 MAVIE · recording the demo path\n');

let failures = 0;
const expect = (cond, msg) => { if (cond) ok(msg); else { bad(msg); failures++; } };

/* 1 ── seed ─────────────────────────────────────────────────────────── */
step(1, 'Seeding demo profile and closet');
const seeded = await post('/demo/seed', {});
expect(seeded.closet_size >= 6, `closet seeded with ${seeded.closet_size} pieces`);

/* 2 ── skin ─────────────────────────────────────────────────────────── */
step(2, 'Skin analysis on the demo photo');
const photo = demoPhotoDataUrl();
const { beauty } = await post('/skin/analyze', { imageUrl: DEMO_PHOTO_URL });
expect(beauty?.mocked === false || beauty?.cached, `${beauty?.mocked ? 'MOCKED' : 'LIVE'} — ${beauty?.headline} (finish: ${beauty?.preferred_finish})`);

/* 3 ── context ──────────────────────────────────────────────────────── */
step(3, 'Parsing the moment');
const { constraints } = await post('/context/parse', { text: DEMO_SCENARIO });
expect(constraints.budget > 0 && constraints.budget <= 200, `budget read as $${constraints.budget}`);
expect(Boolean(constraints.occasion), `occasion: ${constraints.occasion}`);

/* 4 ── looks ────────────────────────────────────────────────────────── */
step(4, 'Composing looks');
const { looks } = await post('/outfits/compose', { constraints });
expect(looks.length === 3, `${looks.length} looks composed`);
looks.forEach((l) => console.log(`     ${l.scores.overall}%  ${l.name} — $${l.total} — ${l.items.map((i) => i.name).join(' + ')}`));
// She picks the dress, not necessarily MAVIE's top-scoring look — which is what
// people actually do, and is what makes the WAIT land.
const pick = looks.find((l) => l.items.some((i) => i.category === DEMO_SELECT_CATEGORY)) || looks[0];
expect(Boolean(pick.items.some((i) => i.category === 'dress')), `she chooses: ${pick.name} — ${pick.items.map((i) => i.name).join(' + ')}`);
expect(Boolean(pick.makeup?.finish), `makeup coordinated: ${pick.makeup?.name} (${pick.makeup?.finish})`);

/* 5 ── try-on ───────────────────────────────────────────────────────── */
step(5, 'Virtual try-on');
const { result: vto } = await post('/vto/clothes', { userImage: photo, items: pick.items.map((i) => ({ id: i.id })) });
expect(Boolean(vto.result_url || vto.composite), vto.result_url ? 'photoreal try-on' : 'local composite preview');

/* 6 ── aftermath on MAVIE's own pick ────────────────────────────────── */
step(6, "Aftermath on MAVIE's own pick");
const decision = await post('/decision/analyze', {
  items: pick.items.map((i) => ({ id: i.id })),
  constraints,
  matchScores: pick.scores,
});
console.log(`     versatility ${decision.metrics.versatility}% · rewear ${decision.metrics.rewear_potential}%`);
expect(
  decision.verdict === 'BUY',
  `MAVIE stands behind what it composed (${decision.verdict}, confidence ${decision.buy_confidence})`,
);

/* 6b ── the piece she saw online ────────────────────────────────────── */
// The WAIT belongs here. The composer only builds looks it can defend, so
// forcing a regrettable one would mean tuning the scoring until it lies. A
// piece the user brings in herself has passed through no such filter.
step('6b', 'She sees something online and asks MAVIE about it');
console.log(`     ${DEMO_FOUND_ITEM.name} — $${DEMO_FOUND_ITEM.price}`);
const found = await post('/product/buy-confidence', { product: DEMO_FOUND_ITEM, constraints });
found.panel.skeptic.forEach((c) => console.log(`     SKEPTIC [${c.basis}] ${c.claim}`));
expect(found.verdict === 'WAIT', `verdict is WAIT (got ${found.verdict}, confidence ${found.buy_confidence})`);
expect(found.metrics.versatility < 50, `low versatility drives it: ${found.metrics.versatility}%`);

/* 7 ── alternative ──────────────────────────────────────────────────── */
step(7, 'Better alternative');
const alternatives = found.alternatives || [];
expect(alternatives.length > 0, `${alternatives.length} alternatives offered`);
const alt = alternatives[0];
console.log(`     ${alt.name} — $${alt.price} — ${alt.why}`);

const altDecision = await post('/product/buy-confidence', { product: alt, constraints });
expect(altDecision.verdict === 'BUY', `alternative verdict is BUY (got ${altDecision.verdict}, confidence ${altDecision.buy_confidence})`);

/* ── result ──────────────────────────────────────────────────────────── */
const { cache } = await post('/demo/seed', {});
console.log(`\n  cache: ${cache.entries} recorded responses ${JSON.stringify(cache.byNamespace)}`);

if (failures) {
  console.log(`\n\x1b[31m  ${failures} assertion(s) failed — the demo path is NOT safe.\x1b[0m\n`);
  process.exit(1);
}
console.log('\n\x1b[32m  Demo path verified: 3 looks → try-on → WAIT → alternative → BUY\x1b[0m\n');
