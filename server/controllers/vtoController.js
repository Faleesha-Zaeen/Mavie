import { tryOnClothes, tryOnFound } from '../services/youcam/clothesService.js';
import { findItem } from '../data/catalog.js';

/** Map a product's own shape onto the three categories cloth-v4 accepts. */
const CATEGORY_FOR = {
  dress: 'full_body', top: 'upper_body', outerwear: 'upper_body', bottom: 'lower_body',
};
const CATEGORY_FOR_AREA = { full: 'full_body', upper: 'upper_body', lower: 'lower_body' };

/**
 * Try-on for a piece from the "found this online" flow. Seeing it on yourself
 * before the verdict is the natural order — the verdict is about whether to
 * buy it, and looking at it is part of deciding.
 */
export async function found(req, res, next) {
  try {
    const { userImage, garmentImage, product = {} } = req.body;

    if (!garmentImage) {
      return res.status(422).json({
        error: 'no_garment_image',
        message: 'MAVIE needs the photo of the piece to try it on.',
      });
    }

    const category = CATEGORY_FOR[product.category]
      || CATEGORY_FOR_AREA[product.body_area]
      || 'upper_body';

    const result = await tryOnFound({ userImage, garmentImage, category, name: product.name });
    res.json({ result });
  } catch (err) {
    next(err);
  }
}

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
