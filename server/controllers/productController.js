import { analyseProductImage } from '../services/ai/productVision.js';
import { decide, findAlternatives } from '../services/decision/verdictService.js';
import { scoreLook } from '../services/decision/scoringService.js';
import { store } from '../store.js';

/** Screenshot → structured product. */
export async function analyse(req, res, next) {
  try {
    const { imageBase64, price = null } = req.body;
    const product = await analyseProductImage({ imageBase64, statedPrice: price });
    res.json({ product });
  } catch (err) {
    next(err);
  }
}

/**
 * Buy Confidence for a product MAVIE never curated.
 *
 * Deliberately the SAME decision engine as a catalog look — that is the whole
 * point. A piece from Instagram gets judged on the same evidence as a piece
 * MAVIE recommended itself.
 */
export async function buyConfidence(req, res, next) {
  try {
    const { product, constraints = {}, guest } = req.body;
    const profile = store.getProfile();
    const closet = store.closet();

    const items = [product];
    const match = scoreLook({ items, constraints, profile, closet });
    const result = await decide({ items, constraints, profile, closet, matchScores: match });

    // Suggest catalog pieces in the same category that carry less decision risk.
    const alternatives = result.verdict === 'BUY'
      ? []
      : findAlternatives({ items, constraints, limit: 3 });

    if (!guest) {
      store.saveDecision({
        id: `decision-${Date.now()}`,
        items: [product.id],
        verdict: result.verdict,
        buy_confidence: result.buy_confidence,
        regret_risk: result.regret_risk,
        created_at: new Date().toISOString(),
      });
    }

    res.json({ ...result, match, alternatives });
  } catch (err) {
    next(err);
  }
}
