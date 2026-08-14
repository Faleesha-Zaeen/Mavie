import { store } from '../store.js';
import { DEMO_PROFILE, DEMO_CLOSET, DEMO_SCENARIO, DEMO_STEPS } from '../data/demo.js';
import { stats } from '../services/cache.js';

/** Reset to the seeded demo state so a run is identical every time. */
export function seed(req, res, next) {
  try {
    const { profile, closet } = store.seedDemo(DEMO_PROFILE, DEMO_CLOSET);
    res.json({
      seeded: true,
      scenario: DEMO_SCENARIO,
      steps: DEMO_STEPS,
      profile,
      closet_size: closet.length,
      cache: stats(),
    });
  } catch (err) {
    next(err);
  }
}
