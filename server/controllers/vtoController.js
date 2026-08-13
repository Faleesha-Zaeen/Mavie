import { tryOnClothes } from '../services/youcam/clothesService.js';
import { findItem } from '../data/catalog.js';

export async function clothes(req, res, next) {
  try {
    const { userImage, items = [] } = req.body;
    // Always resolve against the catalog — never trust client-supplied garment data.
    const resolved = items.map((i) => findItem(i.id)).filter(Boolean);

    if (!resolved.length) {
      return res.status(422).json({
        error: 'unknown_items',
        message: "MAVIE couldn't find those pieces in the catalog.",
      });
    }

    const result = await tryOnClothes({ userImage, items: resolved });
    res.json({ result });
  } catch (err) {
    next(err);
  }
}
