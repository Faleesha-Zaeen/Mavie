/**
 * MAVIE PRODUCT CATALOG
 *
 * The single source of truth for every garment MAVIE can recommend. The LLM
 * never invents clothing — it selects ids from this list.
 *
 * Curated for COMBINATIONS, not for individually pretty pieces. A catalog of
 * sixty beige-and-black items produces three looks that are visually the same
 * look, which undermines the whole "three versions of you" premise. So the
 * palette deliberately carries red, emerald, olive, burgundy, floral and denim,
 * and the styles span clean-minimal through preppy, feminine, streetwear and
 * edgy.
 *
 * Each garment carries ATTRIBUTES rather than a hard-coded purpose. A black
 * ribbed top is tagged for casual, college, date, dinner AND party, so the
 * engine can reason its way to hundreds of outfits instead of replaying a
 * static mapping.
 *
 * Field notes:
 *   body_area    upper | lower | full | feet | accessory  (drives Apparel VTO routing)
 *   formality    casual | smart-casual | business | semi-formal | formal
 *   versatility  0-100  how many different contexts this piece works in
 *   maintenance  0-100  care burden: dry-clean, delicate fabric, ironing
 *   hex          renders the product visual and coordinates the makeup palette
 *
 * Honest gaps, deliberately untagged so MAVIE never claims coverage it lacks:
 * no ethnic or traditional wear, no rain-proof outerwear or footwear, no
 * athleisure or activewear, no swimwear.
 */

const item = (
  id, name, category, body_area, price, hex, color,
  { material, formality, fit, season, style_tags, occasion_tags, versatility, maintenance },
) => ({
  id,
  name,
  category,
  subcategory: category,
  body_area,
  price,
  currency: 'USD',
  hex,
  colors: [color],
  material,
  formality,
  fit,
  season,
  style_tags,
  occasion_tags,
  versatility,
  maintenance,
  image_url: null,
  product_url: `https://example.com/mavie/product/${id}`,
  available: true,
});

export const catalog = [
  /* ─────────────────────────── TOPS · 1–15 ─────────────────────────── */
  item('top-101', 'White Oversized Button-Down Shirt', 'top', 'upper', 38, '#FBFAF7', 'white', {
    material: 'cotton', formality: 'smart-casual', fit: 'oversized', season: 'all',
    style_tags: ['classic', 'minimal', 'preppy', 'clean'],
    occasion_tags: ['office', 'interview', 'college', 'casual', 'brunch', 'travel'],
    versatility: 96, maintenance: 40,
  }),
  item('top-102', 'Black Fitted Ribbed Top', 'top', 'upper', 24, '#1F1B19', 'black', {
    material: 'jersey', formality: 'casual', fit: 'fitted', season: 'all',
    style_tags: ['minimal', 'sleek', 'edgy', 'everyday'],
    occasion_tags: ['casual', 'college', 'date', 'dinner', 'party', 'office'],
    versatility: 97, maintenance: 12,
  }),
  item('top-103', 'Baby Blue Cropped Shirt', 'top', 'upper', 32, '#BCD4E6', 'baby blue', {
    material: 'cotton', formality: 'casual', fit: 'cropped', season: 'summer',
    style_tags: ['fresh', 'preppy', 'gen-z', 'soft'],
    occasion_tags: ['college', 'casual', 'brunch', 'date'],
    versatility: 72, maintenance: 25,
  }),
  item('top-104', 'Burgundy Satin Blouse', 'top', 'upper', 44, '#6E2C3A', 'burgundy', {
    material: 'satin', formality: 'semi-formal', fit: 'regular', season: 'all',
    style_tags: ['elegant', 'rich', 'feminine'],
    occasion_tags: ['dinner', 'party', 'wedding', 'office', 'date'],
    versatility: 66, maintenance: 62,
  }),
  item('top-105', 'Cream Knit Polo Top', 'top', 'upper', 36, '#EDE3D4', 'cream', {
    material: 'knit', formality: 'smart-casual', fit: 'regular', season: 'all',
    style_tags: ['preppy', 'classic', 'clean', 'quiet-luxury'],
    occasion_tags: ['college', 'office', 'brunch', 'casual', 'travel'],
    versatility: 84, maintenance: 38,
  }),
  item('top-106', 'Sage Green Linen Shirt', 'top', 'upper', 42, '#A8B49A', 'sage', {
    material: 'linen', formality: 'casual', fit: 'relaxed', season: 'summer',
    style_tags: ['natural', 'relaxed', 'coastal', 'minimal'],
    occasion_tags: ['casual', 'travel', 'brunch', 'college'],
    versatility: 76, maintenance: 48,
  }),
  item('top-107', 'Black Off-Shoulder Top', 'top', 'upper', 34, '#211D1B', 'black', {
    material: 'jersey', formality: 'semi-formal', fit: 'fitted', season: 'all',
    style_tags: ['feminine', 'romantic', 'evening'],
    occasion_tags: ['date', 'dinner', 'party', 'wedding'],
    versatility: 58, maintenance: 30,
  }),
  item('top-108', 'White Ribbed Tank Top', 'top', 'upper', 18, '#F7F4EE', 'white', {
    material: 'jersey', formality: 'casual', fit: 'fitted', season: 'summer',
    style_tags: ['minimal', 'clean', 'everyday', 'model-off-duty'],
    occasion_tags: ['casual', 'college', 'travel', 'brunch', 'date'],
    versatility: 92, maintenance: 12,
  }),
  item('top-109', 'Cherry Red Crop Top', 'top', 'upper', 26, '#B8232F', 'red', {
    material: 'jersey', formality: 'casual', fit: 'cropped', season: 'summer',
    style_tags: ['bold', 'gen-z', 'statement', 'playful'],
    occasion_tags: ['party', 'college', 'casual', 'date'],
    versatility: 58, maintenance: 18,
  }),
  item('top-110', 'Blue Striped Relaxed Shirt', 'top', 'upper', 36, '#7E9FC4', 'blue stripe', {
    material: 'cotton', formality: 'smart-casual', fit: 'relaxed', season: 'all',
    style_tags: ['preppy', 'classic', 'coastal', 'casual-chic'],
    occasion_tags: ['casual', 'college', 'brunch', 'office', 'travel'],
    versatility: 82, maintenance: 32,
  }),
  item('top-111', 'Chocolate Brown Halter Top', 'top', 'upper', 30, '#5A4030', 'chocolate', {
    material: 'jersey', formality: 'semi-formal', fit: 'fitted', season: 'summer',
    style_tags: ['sleek', 'evening', 'model-off-duty'],
    occasion_tags: ['date', 'dinner', 'party', 'travel'],
    versatility: 60, maintenance: 24,
  }),
  item('top-112', 'Heather Grey Oversized Sweatshirt', 'top', 'upper', 40, '#9A9A96', 'grey', {
    material: 'cotton', formality: 'casual', fit: 'oversized', season: 'winter',
    style_tags: ['streetwear', 'cosy', 'gen-z', 'comfort'],
    occasion_tags: ['casual', 'college', 'travel'],
    versatility: 74, maintenance: 15,
  }),
  item('top-113', 'Soft Pink Puff-Sleeve Blouse', 'top', 'upper', 38, '#E7C3C8', 'pink', {
    material: 'cotton', formality: 'smart-casual', fit: 'relaxed', season: 'all',
    style_tags: ['feminine', 'romantic', 'coquette', 'soft'],
    occasion_tags: ['brunch', 'date', 'college', 'party', 'wedding'],
    versatility: 66, maintenance: 45,
  }),
  item('top-114', 'Black One-Shoulder Top', 'top', 'upper', 36, '#1D1917', 'black', {
    material: 'jersey', formality: 'semi-formal', fit: 'fitted', season: 'all',
    style_tags: ['sleek', 'statement', 'evening', 'edgy'],
    occasion_tags: ['party', 'dinner', 'date', 'wedding'],
    versatility: 54, maintenance: 28,
  }),
  item('top-115', 'Ivory Satin Camisole', 'top', 'upper', 32, '#F2E9DC', 'ivory', {
    material: 'satin', formality: 'semi-formal', fit: 'fitted', season: 'all',
    style_tags: ['elegant', 'feminine', 'quiet-luxury', 'minimal'],
    occasion_tags: ['dinner', 'date', 'party', 'wedding', 'office'],
    versatility: 74, maintenance: 58,
  }),

  /* ────────────────────────── BOTTOMS · 16–27 ───────────────────────── */
  item('bot-201', 'Dark Indigo Straight-Leg Jeans', 'bottom', 'lower', 46, '#33455E', 'indigo', {
    material: 'denim', formality: 'casual', fit: 'straight', season: 'all',
    style_tags: ['classic', 'everyday', 'casual-chic'],
    occasion_tags: ['casual', 'college', 'travel', 'brunch', 'date', 'party'],
    versatility: 96, maintenance: 14,
  }),
  item('bot-202', 'Light Wash Wide-Leg Jeans', 'bottom', 'lower', 44, '#9DB3CC', 'light denim', {
    material: 'denim', formality: 'casual', fit: 'wide', season: 'summer',
    style_tags: ['gen-z', 'relaxed', 'streetwear'],
    occasion_tags: ['casual', 'college', 'travel', 'brunch'],
    versatility: 84, maintenance: 16,
  }),
  item('bot-203', 'Black High-Waisted Trousers', 'bottom', 'lower', 49, '#211D1B', 'black', {
    material: 'twill', formality: 'business', fit: 'straight', season: 'all',
    style_tags: ['classic', 'professional', 'minimal', 'quiet-luxury'],
    occasion_tags: ['interview', 'office', 'formal', 'dinner', 'party', 'date'],
    versatility: 96, maintenance: 42,
  }),
  item('bot-204', 'Beige Wide-Leg Trousers', 'bottom', 'lower', 45, '#D7C6AC', 'beige', {
    material: 'twill', formality: 'smart-casual', fit: 'wide', season: 'all',
    style_tags: ['minimal', 'elegant', 'clean', 'quiet-luxury'],
    occasion_tags: ['office', 'interview', 'college', 'brunch', 'date', 'travel'],
    versatility: 90, maintenance: 36,
  }),
  item('bot-205', 'Charcoal Tailored Trousers', 'bottom', 'lower', 52, '#403A36', 'charcoal', {
    material: 'wool-blend', formality: 'business', fit: 'straight', season: 'all',
    style_tags: ['professional', 'structured', 'classic'],
    occasion_tags: ['interview', 'office', 'formal', 'dinner'],
    versatility: 82, maintenance: 52,
  }),
  item('bot-206', 'Olive Green Cargo Pants', 'bottom', 'lower', 46, '#6B7355', 'olive', {
    material: 'cotton', formality: 'casual', fit: 'relaxed', season: 'all',
    style_tags: ['streetwear', 'gen-z', 'utility', 'edgy'],
    occasion_tags: ['casual', 'college', 'travel'],
    versatility: 76, maintenance: 18,
  }),
  item('bot-207', 'Black Denim Mini Skirt', 'bottom', 'lower', 34, '#232019', 'black', {
    material: 'denim', formality: 'casual', fit: 'fitted', season: 'all',
    style_tags: ['edgy', 'gen-z', 'youthful'],
    occasion_tags: ['party', 'college', 'casual', 'date'],
    versatility: 68, maintenance: 18,
  }),
  item('bot-208', 'Blue Denim Midi Skirt', 'bottom', 'lower', 40, '#7391B5', 'blue denim', {
    material: 'denim', formality: 'casual', fit: 'a-line', season: 'summer',
    style_tags: ['casual-chic', 'feminine', 'gen-z'],
    occasion_tags: ['casual', 'college', 'brunch', 'travel', 'date'],
    versatility: 78, maintenance: 20,
  }),
  item('bot-209', 'Black Pleated Midi Skirt', 'bottom', 'lower', 42, '#1E1A18', 'black', {
    material: 'polyester', formality: 'smart-casual', fit: 'a-line', season: 'all',
    style_tags: ['preppy', 'feminine', 'classic', 'minimal'],
    occasion_tags: ['office', 'college', 'date', 'dinner', 'party', 'wedding'],
    versatility: 88, maintenance: 40,
  }),
  item('bot-210', 'White Linen Wide-Leg Pants', 'bottom', 'lower', 48, '#F4F0E7', 'white', {
    material: 'linen', formality: 'smart-casual', fit: 'wide', season: 'summer',
    style_tags: ['coastal', 'clean', 'relaxed', 'resort'],
    occasion_tags: ['travel', 'brunch', 'casual', 'wedding'],
    versatility: 66, maintenance: 62,
  }),
  item('bot-211', 'Chocolate Brown Relaxed Trousers', 'bottom', 'lower', 47, '#4A3729', 'chocolate', {
    material: 'twill', formality: 'smart-casual', fit: 'relaxed', season: 'winter',
    style_tags: ['warm', 'quiet-luxury', 'modern'],
    occasion_tags: ['office', 'dinner', 'date', 'casual', 'travel'],
    versatility: 80, maintenance: 40,
  }),
  item('bot-212', 'Heather Grey Jogger Pants', 'bottom', 'lower', 36, '#8E8E8A', 'grey', {
    material: 'cotton', formality: 'casual', fit: 'relaxed', season: 'winter',
    style_tags: ['comfort', 'streetwear', 'cosy'],
    occasion_tags: ['casual', 'travel', 'college'],
    versatility: 62, maintenance: 14,
  }),

  /* ────────────────────────── DRESSES · 28–39 ───────────────────────── */
  item('drs-301', 'Little Black Midi Dress', 'dress', 'full', 75, '#1C1917', 'black', {
    material: 'jersey', formality: 'semi-formal', fit: 'fitted', season: 'all',
    style_tags: ['classic', 'timeless', 'elegant', 'minimal'],
    occasion_tags: ['dinner', 'date', 'party', 'formal', 'wedding', 'office'],
    versatility: 90, maintenance: 42,
  }),
  item('drs-302', 'Red Satin Slip Dress', 'dress', 'full', 82, '#A81F2D', 'red', {
    material: 'satin', formality: 'semi-formal', fit: 'fitted', season: 'all',
    style_tags: ['bold', 'statement', 'evening', 'luxe'],
    occasion_tags: ['party', 'dinner', 'date'],
    versatility: 44, maintenance: 72,
  }),
  item('drs-303', 'Emerald Green Wrap Midi Dress', 'dress', 'full', 86, '#1F5245', 'emerald', {
    material: 'jersey', formality: 'semi-formal', fit: 'wrap', season: 'all',
    style_tags: ['elegant', 'feminine', 'rich'],
    occasion_tags: ['wedding', 'dinner', 'party', 'office', 'date'],
    versatility: 70, maintenance: 45,
  }),
  item('drs-304', 'Powder Blue A-Line Midi Dress', 'dress', 'full', 72, '#BFD0E0', 'powder blue', {
    material: 'cotton', formality: 'smart-casual', fit: 'a-line', season: 'summer',
    style_tags: ['soft', 'fresh', 'feminine', 'preppy'],
    occasion_tags: ['brunch', 'college', 'date', 'wedding', 'travel'],
    versatility: 68, maintenance: 38,
  }),
  item('drs-305', 'Floral Print Summer Midi Dress', 'dress', 'full', 76, '#C2748B', 'floral', {
    material: 'cotton', formality: 'smart-casual', fit: 'fitted', season: 'summer',
    style_tags: ['romantic', 'feminine', 'coquette', 'playful'],
    occasion_tags: ['brunch', 'date', 'wedding', 'travel', 'party'],
    versatility: 66, maintenance: 42,
  }),
  item('drs-306', 'Black Fitted Mini Party Dress', 'dress', 'full', 68, '#232019', 'black', {
    material: 'jersey', formality: 'semi-formal', fit: 'fitted', season: 'all',
    style_tags: ['edgy', 'statement', 'evening', 'gen-z'],
    occasion_tags: ['party', 'date', 'dinner'],
    versatility: 50, maintenance: 34,
  }),
  item('drs-307', 'Burgundy Velvet Evening Dress', 'dress', 'full', 98, '#5E2233', 'burgundy', {
    material: 'velvet', formality: 'formal', fit: 'fitted', season: 'winter',
    style_tags: ['luxe', 'statement', 'elegant'],
    occasion_tags: ['formal', 'wedding', 'party'],
    versatility: 34, maintenance: 84,
  }),
  item('drs-308', 'White Linen Sundress', 'dress', 'full', 64, '#F5F1E8', 'white', {
    material: 'linen', formality: 'casual', fit: 'relaxed', season: 'summer',
    style_tags: ['coastal', 'clean', 'relaxed', 'resort'],
    occasion_tags: ['travel', 'brunch', 'casual', 'date'],
    versatility: 64, maintenance: 55,
  }),
  item('drs-309', 'Sage Green Flowing Maxi Dress', 'dress', 'full', 80, '#9EAE93', 'sage', {
    material: 'chiffon', formality: 'smart-casual', fit: 'relaxed', season: 'summer',
    style_tags: ['boho', 'natural', 'feminine', 'resort'],
    occasion_tags: ['wedding', 'travel', 'brunch', 'dinner'],
    versatility: 58, maintenance: 50,
  }),
  item('drs-310', 'Blush Pink Tiered Midi Dress', 'dress', 'full', 78, '#E5CFCB', 'blush', {
    material: 'cotton', formality: 'smart-casual', fit: 'relaxed', season: 'summer',
    style_tags: ['romantic', 'feminine', 'coquette'],
    occasion_tags: ['wedding', 'brunch', 'party', 'date'],
    versatility: 52, maintenance: 48,
  }),
  item('drs-311', 'Navy Blue Shirt Dress', 'dress', 'full', 70, '#2A3550', 'navy', {
    material: 'cotton', formality: 'smart-casual', fit: 'relaxed', season: 'all',
    style_tags: ['classic', 'practical', 'minimal', 'preppy'],
    occasion_tags: ['office', 'college', 'casual', 'travel', 'brunch'],
    versatility: 88, maintenance: 32,
  }),
  item('drs-312', 'Chocolate Brown Knit Midi Dress', 'dress', 'full', 74, '#4A3729', 'chocolate', {
    material: 'knit', formality: 'smart-casual', fit: 'fitted', season: 'winter',
    style_tags: ['quiet-luxury', 'minimal', 'warm', 'model-off-duty'],
    occasion_tags: ['casual', 'office', 'date', 'dinner', 'travel'],
    versatility: 84, maintenance: 38,
  }),

  /* ───────────────────────── OUTERWEAR · 40–47 ──────────────────────── */
  item('out-401', 'Black Oversized Blazer', 'outerwear', 'upper', 78, '#232019', 'black', {
    material: 'twill', formality: 'business', fit: 'oversized', season: 'all',
    style_tags: ['sharp', 'professional', 'model-off-duty', 'edgy'],
    occasion_tags: ['interview', 'office', 'formal', 'dinner', 'party', 'college'],
    versatility: 94, maintenance: 55,
  }),
  item('out-402', 'Beige Tailored Blazer', 'outerwear', 'upper', 72, '#CDBBA0', 'beige', {
    material: 'twill', formality: 'business', fit: 'regular', season: 'all',
    style_tags: ['structured', 'professional', 'quiet-luxury', 'minimal'],
    occasion_tags: ['interview', 'office', 'brunch', 'wedding', 'dinner'],
    versatility: 88, maintenance: 55,
  }),
  item('out-403', 'Blue Denim Jacket', 'outerwear', 'upper', 62, '#5C7290', 'denim', {
    material: 'denim', formality: 'casual', fit: 'regular', season: 'all',
    style_tags: ['classic', 'casual-chic', 'gen-z'],
    occasion_tags: ['casual', 'college', 'travel', 'brunch'],
    versatility: 86, maintenance: 18,
  }),
  item('out-404', 'Black Cropped Leather Jacket', 'outerwear', 'upper', 110, '#1A1715', 'black', {
    material: 'leather', formality: 'casual', fit: 'fitted', season: 'winter',
    style_tags: ['edgy', 'streetwear', 'statement', 'rock'],
    occasion_tags: ['party', 'casual', 'date', 'college', 'dinner'],
    versatility: 76, maintenance: 48,
  }),
  item('out-405', 'Camel Wool Coat', 'outerwear', 'upper', 148, '#B08D62', 'camel', {
    material: 'wool', formality: 'smart-casual', fit: 'oversized', season: 'winter',
    style_tags: ['timeless', 'quiet-luxury', 'elegant'],
    occasion_tags: ['office', 'dinner', 'travel', 'date', 'formal'],
    versatility: 78, maintenance: 78,
  }),
  item('out-406', 'Olive Green Utility Jacket', 'outerwear', 'upper', 68, '#5F6B4E', 'olive', {
    material: 'cotton', formality: 'casual', fit: 'relaxed', season: 'all',
    style_tags: ['utility', 'streetwear', 'practical'],
    occasion_tags: ['casual', 'travel', 'college'],
    versatility: 74, maintenance: 24,
  }),
  item('out-407', 'Cream Cropped Knit Cardigan', 'outerwear', 'upper', 52, '#EAE0CF', 'cream', {
    material: 'knit', formality: 'casual', fit: 'fitted', season: 'all',
    style_tags: ['soft', 'feminine', 'preppy', 'coquette'],
    occasion_tags: ['casual', 'college', 'brunch', 'date'],
    versatility: 82, maintenance: 42,
  }),
  item('out-408', 'Charcoal Oversized Zip Hoodie', 'outerwear', 'upper', 56, '#454341', 'charcoal', {
    material: 'cotton', formality: 'casual', fit: 'oversized', season: 'winter',
    style_tags: ['streetwear', 'gen-z', 'comfort', 'cosy'],
    occasion_tags: ['casual', 'college', 'travel'],
    versatility: 70, maintenance: 15,
  }),

  /* ─────────────────────────── SHOES · 48–55 ────────────────────────── */
  item('shoe-501', 'White Leather Sneakers', 'shoes', 'feet', 68, '#F5F3EE', 'white', {
    material: 'leather', formality: 'casual', fit: 'regular', season: 'all',
    style_tags: ['clean', 'modern', 'comfort', 'everyday'],
    occasion_tags: ['casual', 'college', 'travel', 'brunch', 'office'],
    versatility: 94, maintenance: 34,
  }),
  item('shoe-502', 'Black Ballet Flats', 'shoes', 'feet', 46, '#201C1A', 'black', {
    material: 'leather', formality: 'smart-casual', fit: 'regular', season: 'all',
    style_tags: ['minimal', 'feminine', 'classic', 'clean-girl'],
    occasion_tags: ['office', 'college', 'casual', 'interview', 'date', 'brunch'],
    versatility: 92, maintenance: 26,
  }),
  item('shoe-503', 'Black Pointed-Toe Pumps', 'shoes', 'feet', 74, '#1D1917', 'black', {
    material: 'leather', formality: 'business', fit: 'regular', season: 'all',
    style_tags: ['sharp', 'professional', 'classic', 'elegant'],
    occasion_tags: ['interview', 'office', 'formal', 'dinner', 'party', 'wedding'],
    versatility: 80, maintenance: 36,
  }),
  item('shoe-504', 'Nude Block-Heel Shoes', 'shoes', 'feet', 62, '#D6C3AC', 'nude', {
    material: 'leather', formality: 'semi-formal', fit: 'regular', season: 'all',
    style_tags: ['elegant', 'comfort', 'minimal'],
    occasion_tags: ['wedding', 'office', 'dinner', 'interview', 'brunch'],
    versatility: 84, maintenance: 30,
  }),
  item('shoe-505', 'Brown Leather Ankle Boots', 'shoes', 'feet', 96, '#6E4B2F', 'brown', {
    material: 'leather', formality: 'casual', fit: 'regular', season: 'winter',
    style_tags: ['warm', 'classic', 'structured'],
    occasion_tags: ['casual', 'college', 'travel', 'office', 'date'],
    versatility: 86, maintenance: 44,
  }),
  item('shoe-506', 'Black Knee-High Boots', 'shoes', 'feet', 118, '#1D1917', 'black', {
    material: 'leather', formality: 'smart-casual', fit: 'regular', season: 'winter',
    style_tags: ['edgy', 'statement', 'sleek'],
    occasion_tags: ['party', 'dinner', 'date', 'casual'],
    versatility: 64, maintenance: 48,
  }),
  item('shoe-507', 'Tan Strappy Flat Sandals', 'shoes', 'feet', 40, '#B98B60', 'tan', {
    material: 'leather', formality: 'casual', fit: 'regular', season: 'summer',
    style_tags: ['relaxed', 'resort', 'comfort', 'coastal'],
    occasion_tags: ['travel', 'brunch', 'casual', 'wedding'],
    versatility: 70, maintenance: 20,
  }),
  item('shoe-508', 'Chunky Black Sneakers', 'shoes', 'feet', 82, '#232019', 'black', {
    material: 'leather', formality: 'casual', fit: 'regular', season: 'all',
    style_tags: ['streetwear', 'gen-z', 'edgy', 'comfort'],
    occasion_tags: ['casual', 'college', 'travel'],
    versatility: 72, maintenance: 26,
  }),

  /* ──────────────────────── ACCESSORIES · 56–60 ─────────────────────── */
  item('acc-601', 'Black Structured Shoulder Bag', 'accessory', 'accessory', 88, '#201C1A', 'black', {
    material: 'leather', formality: 'business', fit: 'regular', season: 'all',
    style_tags: ['structured', 'professional', 'classic', 'minimal'],
    occasion_tags: ['interview', 'office', 'dinner', 'travel', 'date'],
    versatility: 92, maintenance: 28,
  }),
  item('acc-602', 'Brown Leather Crossbody Bag', 'accessory', 'accessory', 64, '#6B4A32', 'brown', {
    material: 'leather', formality: 'casual', fit: 'regular', season: 'all',
    style_tags: ['practical', 'casual-chic', 'warm'],
    occasion_tags: ['casual', 'college', 'travel', 'brunch', 'date'],
    versatility: 90, maintenance: 24,
  }),
  item('acc-603', 'Champagne Satin Evening Clutch', 'accessory', 'accessory', 48, '#E0CBA2', 'champagne', {
    material: 'satin', formality: 'formal', fit: 'regular', season: 'all',
    style_tags: ['elegant', 'statement', 'luxe'],
    occasion_tags: ['wedding', 'party', 'formal', 'dinner'],
    versatility: 40, maintenance: 34,
  }),
  item('acc-604', 'Gold Layered Necklace', 'accessory', 'accessory', 34, '#D6BA85', 'gold', {
    material: 'metal', formality: 'casual', fit: 'regular', season: 'all',
    style_tags: ['minimal', 'clean-girl', 'elegant', 'everyday'],
    occasion_tags: ['casual', 'college', 'date', 'dinner', 'office', 'party', 'wedding'],
    versatility: 96, maintenance: 12,
  }),
  item('acc-605', 'Black Slim Leather Belt', 'accessory', 'accessory', 30, '#1F1B19', 'black', {
    material: 'leather', formality: 'smart-casual', fit: 'regular', season: 'all',
    style_tags: ['minimal', 'classic', 'refined'],
    occasion_tags: ['office', 'casual', 'interview', 'college', 'date'],
    versatility: 88, maintenance: 18,
  }),
];

/**
 * MAVIE BEAUTY CATALOG
 * Same architecture as garments — real products with structured metadata.
 */
const beauty = (id, name, brand, category, price, hex, shade, finish, tags) => ({
  id, name, brand, category, price, currency: 'USD', hex, shade, finish, tags,
  image_url: null,
  product_url: `https://example.com/mavie/beauty/${id}`,
  available: true,
});

export const beautyCatalog = [
  beauty('bty-701', 'Weightless Skin Tint', 'Mavie Essentials', 'foundation', 32, '#E4C4A8', 'Natural', 'natural', ['lightweight', 'everyday', 'natural']),
  beauty('bty-702', 'Luminous Serum Foundation', 'Mavie Essentials', 'foundation', 46, '#E0BFA2', 'Warm Beige', 'luminous', ['glow', 'medium-coverage', 'dewy']),
  beauty('bty-703', 'Soft Focus Concealer', 'Mavie Essentials', 'concealer', 24, '#EBCDB4', 'Light Warm', 'natural', ['brightening', 'under-eye']),
  beauty('bty-704', 'Muted Peach Blush', 'Mavie Essentials', 'blush', 22, '#E2A38C', 'Muted Peach', 'satin', ['soft', 'natural', 'warm']),
  beauty('bty-705', 'Dusty Rose Blush', 'Mavie Essentials', 'blush', 22, '#C98B94', 'Dusty Rose', 'matte', ['feminine', 'soft', 'cool']),
  beauty('bty-706', 'Warm Bronzing Powder', 'Mavie Essentials', 'bronzer', 28, '#B08760', 'Warm Sand', 'matte', ['warmth', 'sculpting']),
  beauty('bty-707', 'Soft Contour Stick', 'Mavie Essentials', 'contour', 26, '#9C7B62', 'Cool Taupe', 'matte', ['sculpting', 'definition']),
  beauty('bty-708', 'Champagne Highlighter', 'Mavie Essentials', 'highlight', 26, '#E9D6B0', 'Champagne', 'luminous', ['glow', 'soft-focus']),
  beauty('bty-709', 'Soft Brown Eyeshadow Quad', 'Mavie Essentials', 'eyeshadow', 36, '#8B6A52', 'Soft Brown', 'satin', ['neutral', 'everyday', 'soft']),
  beauty('bty-710', 'Smoked Plum Eyeshadow Duo', 'Mavie Essentials', 'eyeshadow', 32, '#6E4A55', 'Smoked Plum', 'shimmer', ['bold', 'evening', 'defined']),
  beauty('bty-711', 'Fine Line Eyeliner', 'Mavie Essentials', 'eyeliner', 18, '#241E1B', 'Soft Black', 'matte', ['definition', 'precise']),
  beauty('bty-712', 'Volumising Mascara', 'Mavie Essentials', 'mascara', 24, '#1E1A18', 'Black', 'natural', ['lift', 'everyday']),
  beauty('bty-713', 'Rose Nude Lipstick', 'Mavie Essentials', 'lip', 22, '#C4837F', 'Rose Nude', 'satin', ['nude', 'feminine', 'everyday']),
  beauty('bty-714', 'Berry Nude Lipstick', 'Mavie Essentials', 'lip', 22, '#9E5560', 'Berry Nude', 'matte', ['defined', 'evening']),
  beauty('bty-715', 'Clear Glossy Balm', 'Mavie Essentials', 'lip', 16, '#E8C9C2', 'Sheer', 'gloss', ['fresh', 'minimal', 'everyday']),
];

/**
 * Attach real photography when it has been generated.
 *
 * Kept in a separate generated file so the catalog stays hand-authored and
 * readable, and so re-importing images never rewrites product metadata.
 */
try {
  const { createRequire } = await import('node:module');
  const images = createRequire(import.meta.url)('./catalog-images.json');
  catalog.forEach((item) => {
    const img = images[item.id];
    if (!img) return;
    item.image_url = img.url;
    item.image_alt = img.alt;
    if (img.photographer) {
      item.image_credit = { name: img.photographer, url: img.photographer_url, source: img.source };
    }
  });
} catch {
  // No photography yet — the drawn studio rendering is used instead.
}

export const CATEGORIES = ['top', 'bottom', 'dress', 'outerwear', 'shoes', 'accessory'];

export const findItem = (id) =>
  catalog.find((c) => c.id === id) || beautyCatalog.find((b) => b.id === id) || null;
