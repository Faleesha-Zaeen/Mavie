/**
 * Full endpoint sweep.
 *
 *   npm run test:all                      (server must be running)
 *   npm run test:all -- ./my-photo.jpg    (also exercises skin + try-on on a real face)
 *
 * Hits every route in sequence and asserts something meaningful about each
 * response rather than just checking for a 200 — a mocked skin analysis and a
 * live one both return 200, and only one of them means the integration works.
 */

import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';

const BASE = `http://localhost:${process.env.PORT || 5000}/api`;

const OK = '\x1b[32m✓\x1b[0m';
const NO = '\x1b[31m✗\x1b[0m';
const SKIP = '\x1b[2m·\x1b[0m';
let failures = 0;

const check = (cond, name, detail = '') => {
  console.log(`  ${cond ? OK : NO} ${name.padEnd(34)} \x1b[2m${detail}\x1b[0m`);
  if (!cond) failures++;
};
const skip = (name, why) => console.log(`  ${SKIP} ${name.padEnd(34)} \x1b[2m${why}\x1b[0m`);
const head = (s) => console.log(`\n\x1b[2m${s}\x1b[0m`);

const req = async (method, p, body) => {
  const res = await fetch(BASE + p, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  return { status: res.status, data: await res.json().catch(() => ({})) };
};
const get = (p) => req('GET', p);
const post = (p, b) => req('POST', p, b);

/* Optional real photo, passed as an argument. */
const photoArg = process.argv[2];
let photo = null;
if (photoArg) {
  const file = path.resolve(photoArg);
  if (fs.existsSync(file)) {
    const ext = path.extname(file).toLowerCase() === '.png' ? 'png' : 'jpeg';
    photo = `data:image/${ext};base64,${fs.readFileSync(file).toString('base64')}`;
    console.log(`\n  using photo: ${path.basename(file)} (${Math.round(fs.statSync(file).size / 1024)} KB)`);
  } else {
    console.log(`\n  \x1b[31mphoto not found: ${file}\x1b[0m`);
  }
}

console.log('\n  💗 MAVIE · full sweep');

/* ── infrastructure ──────────────────────────────────────────────────── */
head('Infrastructure');
const health = await get('/health');
check(health.status === 200, 'GET /health', JSON.stringify(health.data.integrations));
check(health.data.integrations?.database === 'supabase', 'database persists', health.data.integrations?.database);

const cat = await get('/catalog');
check(cat.data.items?.length === 60, 'GET /catalog', `${cat.data.items?.length} garments, ${cat.data.beauty?.length} beauty`);
check(cat.data.items?.every((i) => i.price > 0 && i.hex && i.occasion_tags?.length), 'catalog metadata complete');

/* ── demo seed ───────────────────────────────────────────────────────── */
head('Demo');

// The seed REPLACES the closet, so running the sweep against a live instance
// used to leave the demo's six pieces sitting in a real wardrobe with no
// indication of where they came from. Snapshot first, restore at the end.
const before = (await get('/closet')).data.items || [];

const seed = await post('/demo/seed', {});
check(seed.data.seeded, 'POST /demo/seed', `${seed.data.closet_size} closet pieces`);

/* ── skin ────────────────────────────────────────────────────────────── */
head('Beauty');
const skinBody = photo ? { imageBase64: photo, guest: true } : { imageUrl: 'https://plugins-media.makeupar.com/strapi/assets/skin_analysis_01_5b5defd339.png', guest: true };
const skin = await post('/skin/analyze', skinBody);
const b = skin.data.beauty;
check(skin.status === 200 && b?.preferred_finish, 'POST /skin/analyze', b?.headline);
check(b?.mocked === false, 'skin analysis is LIVE', b?.mocked ? 'FELL BACK TO MOCK' : `scores: ${Object.keys(b?.raw || {}).length} concerns`);
if (b?.raw) console.log(`      \x1b[2m${JSON.stringify(b.raw)}\x1b[0m`);

const makeup = await post('/makeup/recommend', { constraints: { occasion: 'interview', goal: ['professional'] }, items: [], beauty: b });
check(makeup.data.makeup?.finish, 'POST /makeup/recommend', makeup.data.makeup?.name);
check(makeup.data.makeup?.finish_source === 'skin_analysis', 'makeup driven by skin analysis (guest mode)', makeup.data.makeup?.finish_source);

/* ── context and looks ───────────────────────────────────────────────── */
head('Styling');
const ctxStart = Date.now();
const ctx = await post('/context/parse', { text: 'I have a job interview tomorrow. Professional but feminine, comfortable. My budget is $150.' });
const c = ctx.data.constraints;
check(c?.occasion === 'interview', 'POST /context/parse', `${c?.occasion}, $${c?.budget}, ${Date.now() - ctxStart}ms`);
check(c?.budget === 150, 'budget parsed correctly', `$${c?.budget}`);
check(Date.now() - ctxStart < 20000, 'context parse under 20s', `${Date.now() - ctxStart}ms`);

const looks = await post('/outfits/compose', { constraints: c, beauty: b });
check(looks.data.looks?.length === 3, 'POST /outfits/compose', `${looks.data.looks?.length} looks`);
const pick = looks.data.looks?.[0];
check(pick?.total <= c.budget, 'looks respect budget', `$${pick?.total} of $${c.budget}`);
check(pick?.makeup?.provenance, 'skin→makeup→outfit chain present');
looks.data.looks?.forEach((l) => console.log(`      \x1b[2m${l.scores.overall}%  ${l.name} — $${l.total}\x1b[0m`));

const score = await post('/looks/score', { items: pick.items.map((i) => ({ id: i.id })), constraints: c });
check(score.data.scores?.overall > 0, 'POST /looks/score', `${score.data.scores?.overall}%`);
const compare = await post('/looks/compare', { looks: looks.data.looks });
check(compare.data.winner, 'POST /looks/compare', `winner ${compare.data.winner}`);

/* ── try-on ──────────────────────────────────────────────────────────── */
head('Virtual try-on');
if (photo) {
  const vto = await post('/vto/clothes', { userImage: photo, items: pick.items.map((i) => ({ id: i.id })) });
  const r = vto.data.result;
  check(vto.status === 200, 'POST /vto/clothes', r?.result_url ? 'photoreal' : `composite (${r?.reason})`);
  if (r?.mocked) console.log(`      \x1b[2m${r.message}\x1b[0m`);
} else {
  skip('POST /vto/clothes', 'pass a photo to exercise this');
}

/* ── decision ────────────────────────────────────────────────────────── */
head('Decision');
const dec = await post('/decision/analyze', { items: pick.items.map((i) => ({ id: i.id })), constraints: c, matchScores: pick.scores });
check(['BUY', 'WAIT', 'SKIP'].includes(dec.data.verdict), 'POST /decision/analyze', `${dec.data.verdict} · confidence ${dec.data.buy_confidence}`);
check(dec.data.panel?.stylist?.length && dec.data.panel?.skeptic?.length, 'both agents produced claims',
  `${dec.data.panel?.stylist?.length} for, ${dec.data.panel?.skeptic?.length} against`);
check(dec.data.panel?.debate?.every((t) => t.basis && t.basis.length < 30), 'every claim cites a real field');
check(!/₹|rupee/i.test(JSON.stringify(dec.data.panel)), 'currency is USD throughout');
dec.data.panel?.skeptic?.forEach((s) => console.log(`      \x1b[2mSKEPTIC [${s.basis}] ${s.claim.slice(0, 78)}\x1b[0m`));

const alts = await post('/alternatives', { items: pick.items.map((i) => ({ id: i.id })), constraints: c });
check(Array.isArray(alts.data.alternatives), 'POST /alternatives', `${alts.data.alternatives?.length} offered`);
check((alts.data.alternatives || []).every((a) => !c.budget || a.price <= c.budget), 'alternatives respect budget');

/* ── found-it flow ───────────────────────────────────────────────────── */
head('Found this online');
if (photo) {
  const prod = await post('/product/analyze', { imageBase64: photo, price: 89 });
  check(prod.data.product?.category, 'POST /product/analyze', `${prod.data.product?.name} (confidence ${prod.data.product?.confidence})`);
  const buy = await post('/product/buy-confidence', { product: prod.data.product, constraints: c });
  check(['BUY', 'WAIT', 'SKIP'].includes(buy.data.verdict), 'POST /product/buy-confidence', `${buy.data.verdict} · ${buy.data.buy_confidence}%`);
} else {
  skip('POST /product/analyze', 'pass a photo to exercise this');
}

/* ── closet, trip, saved ─────────────────────────────────────────────── */
head('Closet · Trip · Saved');
const closet = await get('/closet');
check(closet.data.items?.length > 0, 'GET /closet', `${closet.data.items?.length} items`);
const analysis = await post('/closet/analyze', {});
check(analysis.status === 200, 'POST /closet/analyze', `${analysis.data.duplicates?.length} duplicate groups`);
const styled = await post('/closet/style', { constraints: c });
check(styled.status === 200 || styled.status === 422, 'POST /closet/style', styled.data.looks ? `${styled.data.looks.length} looks` : styled.data.message);

const trip = await post('/trip/plan', { text: 'Four days in Lisbon, walking around plus one nice dinner', budget: 250 });
check(trip.data.trip?.outfits?.length > 0, 'POST /trip/plan', `${trip.data.trip?.days} days, ${trip.data.trip?.stats?.pieces} pieces, ${trip.data.trip?.stats?.wears_per_piece}x each`);

const save = await post('/looks/save', pick);
check(save.data.saved, 'POST /looks/save');
const saved = await get('/looks/saved');
check(saved.data.looks?.length > 0, 'GET /looks/saved', `${saved.data.looks?.length} saved`);

const fb = await post('/feedback', { feedback_type: 'love', look_id: pick.id });
check(fb.data.recorded, 'POST /feedback');

/* ── privacy ─────────────────────────────────────────────────────────── */
head('Profile & privacy');
const prof = await get('/profile');
check(prof.data.profile?.style_dna?.length, 'GET /profile', prof.data.profile?.style_dna?.join(', '));

/* ── put the closet back the way we found it ─────────────────────────── */
if (before.length) {
  await fetch(`${BASE}/closet`, { method: 'DELETE' });
  for (const item of before) {
    await post('/closet/upload', {
      category: item.category,
      color: item.color,
      colors: item.colors,
      hex: item.hex,
      name: item.name,
      style_tags: item.style_tags,
      // Only a real uploaded photo is restored; a borrowed catalog stand-in
      // is re-derived on read and would otherwise be baked in as if it were
      // the user's own photograph.
      image_url: item.image_is_representative ? null : item.image_url || null,
    });
  }
  console.log(`\n  \x1b[2mrestored ${before.length} closet piece(s) from before the sweep\x1b[0m`);
}

/* ── result ──────────────────────────────────────────────────────────── */
console.log('');
if (failures) console.log(`\x1b[31m  ${failures} check(s) failed\x1b[0m\n`);
else console.log('\x1b[32m  All checks passed\x1b[0m\n');
process.exit(failures ? 1 : 0);
