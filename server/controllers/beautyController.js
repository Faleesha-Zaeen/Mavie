import { analyseSkin } from '../services/youcam/skinService.js';
import { recommendMakeup } from '../services/ai/makeupService.js';
import { tryOnMakeup } from '../services/youcam/makeupService.js';
import { store } from '../store.js';

export async function skin(req, res, next) {
  try {
    const { imageUrl, imageBase64, guest } = req.body;
    const profile = await analyseSkin({ imageUrl, imageBase64 });

    // Guest Mode: analyse, show, store nothing.
    if (!guest) {
      store.updateProfile(store.DEMO_USER, {
        beauty: {
          preferred_finish: profile.preferred_finish,
          intensity: profile.intensity,
          direction: profile.direction,
        },
      });
    }

    res.json({ beauty: profile, stored: !guest });
  } catch (err) {
    next(err);
  }
}

export function makeupRecommend(req, res, next) {
  try {
    const { constraints = {}, items = [] } = req.body || {};
    res.json({ makeup: recommendMakeup(constraints, store.getProfile(), items) });
  } catch (err) {
    next(err);
  }
}

export async function makeupVTO(req, res, next) {
  try {
    const result = await tryOnMakeup({ userImage: req.body.userImage, makeup: req.body.makeup });
    res.json({ result });
  } catch (err) {
    next(err);
  }
}
