import { Router } from 'express';
import rateLimit from 'express-rate-limit';

import * as context from '../controllers/contextController.js';
import * as catalog from '../controllers/catalogController.js';
import * as beauty from '../controllers/beautyController.js';
import * as vto from '../controllers/vtoController.js';
import * as decision from '../controllers/decisionController.js';
import * as closet from '../controllers/closetController.js';
import * as product from '../controllers/productController.js';
import * as trip from '../controllers/tripController.js';
import * as demo from '../controllers/demoController.js';

import { validate, schemas } from '../middleware/validation.js';
import { hasCredentials } from '../services/youcam/client.js';
import { activeProvider } from '../services/ai/llm.js';

const router = Router();

/** AI and VTO calls are expensive — rate limit them separately. */
const heavy = rateLimit({
  windowMs: 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'rate_limited', message: 'Give MAVIE a moment to catch up.' },
});

router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'mavie-api',
    integrations: {
      youcam: hasCredentials() ? 'live' : 'mocked',
      llm: activeProvider(),
      database: process.env.SUPABASE_URL ? 'supabase' : 'in-memory',
    },
  });
});

// ─── Context & profile ───────────────────────────────────────────────
router.post('/context/parse', heavy, validate(schemas.parseContext), context.parse);
router.get('/profile', context.getProfile);
router.post('/profile', context.updateProfile);
router.delete('/profile', context.deleteProfile);

// ─── Beauty ──────────────────────────────────────────────────────────
router.post('/skin/analyze', heavy, validate(schemas.skin), beauty.skin);
router.post('/makeup/recommend', beauty.makeupRecommend);
router.post('/makeup/try-on', heavy, validate(schemas.vtoMakeup), beauty.makeupVTO);

// ─── Catalog & looks ─────────────────────────────────────────────────
router.get('/catalog', catalog.list);
router.post('/catalog/search', catalog.search);
router.post('/outfits/compose', heavy, validate(schemas.compose), catalog.compose);
router.post('/looks/score', catalog.score);
router.post('/looks/compare', catalog.compare);
router.post('/looks/save', catalog.saveLook);
router.get('/looks/saved', catalog.savedLooks);

// ─── Virtual try-on ──────────────────────────────────────────────────
router.post('/vto/clothes', heavy, validate(schemas.vtoClothes), vto.clothes);

// ─── Decision intelligence ───────────────────────────────────────────
router.post('/decision/analyze', heavy, validate(schemas.decide), decision.analyse);
router.post('/decision/verdict', heavy, validate(schemas.decide), decision.analyse);
router.post('/alternatives', decision.alternatives);
router.post('/feedback', validate(schemas.feedback), decision.feedback);

// ─── "I found this online" ───────────────────────────────────────────
router.post('/product/analyze', heavy, validate(schemas.productAnalyse), product.analyse);
router.post('/product/buy-confidence', heavy, validate(schemas.productDecide), product.buyConfidence);

// ─── Demo path ───────────────────────────────────────────────────────
router.post('/demo/seed', demo.seed);

// ─── Trip Mode ───────────────────────────────────────────────────────
router.post('/trip/plan', heavy, validate(schemas.trip), trip.plan);

// ─── Closet ──────────────────────────────────────────────────────────
router.get('/closet', closet.list);
router.post('/closet/upload', validate(schemas.closetItem), closet.add);
router.delete('/closet/:id', closet.remove);
router.post('/closet/analyze', closet.analyse);
router.post('/closet/style', closet.style);

export default router;
