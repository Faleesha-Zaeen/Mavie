import { planTrip } from '../services/catalog/tripService.js';
import { store } from '../store.js';

export async function plan(req, res, next) {
  try {
    const { text, budget = null } = req.body;
    const trip = await planTrip({
      text,
      profile: store.getProfile(),
      closet: store.closet(),
      budget,
    });
    res.json({ trip });
  } catch (err) {
    next(err);
  }
}
