/**
 * MAVIE PRODUCT CATALOG
 *
 * This is the single source of truth for every garment MAVIE can recommend.
 * The LLM never invents clothing — it selects product ids from this list.
 *
 * Field notes:
 *   body_area    upper | lower | full | feet | accessory  (drives Apparel VTO routing)
 *   versatility  0-100  how many different contexts this piece works in
 *   maintenance  0-100  care burden: dry-clean, delicate fabric, ironing
 *   hex          used to render the product visual + coordinate makeup
 */

const item = (id, name, category, body_area, price, hex, color, style_tags, occasion_tags, fit, season, versatility, maintenance) => ({
  id,
  name,
  category,
  subcategory: category,
  body_area,
  price,
  currency: 'INR',
  hex,
  colors: [color],
  style_tags,
  occasion_tags,
  fit,
  season,
  versatility,
  maintenance,
  image_url: null,
  product_url: `https://example.com/mavie/product/${id}`,
  available: true,
});

export const catalog = [
  // ─────────────────────────── TOPS ───────────────────────────
  item('top-101', 'Ivory Satin Blouse', 'top', 'upper', 799, '#F2E9DC', 'ivory', ['feminine', 'minimal', 'elegant'], ['interview', 'office', 'date', 'college'], 'relaxed', 'all', 88, 55),
  item('top-102', 'Powder Blue Shirt', 'top', 'upper', 699, '#C8D6E5', 'powder blue', ['minimal', 'classic', 'fresh'], ['office', 'college', 'casual'], 'regular', 'all', 85, 25),
  item('top-103', 'Black Fitted Top', 'top', 'upper', 599, '#1F1B19', 'black', ['minimal', 'sleek', 'modern'], ['date', 'dinner', 'party', 'casual'], 'fitted', 'all', 92, 20),
  item('top-104', 'Cream Knit Top', 'top', 'upper', 899, '#EDE3D4', 'cream', ['soft', 'comfort', 'minimal'], ['casual', 'college', 'travel'], 'relaxed', 'winter', 80, 40),
  item('top-105', 'Rose Wrap Blouse', 'top', 'upper', 949, '#D9A0A6', 'dusty rose', ['feminine', 'romantic', 'soft'], ['date', 'brunch', 'wedding'], 'regular', 'all', 62, 45),
  item('top-106', 'Crisp White Shirt', 'top', 'upper', 899, '#FBFAF7', 'white', ['classic', 'sharp', 'minimal'], ['interview', 'office', 'formal'], 'regular', 'all', 95, 45),
  item('top-107', 'Sage Linen Shirt', 'top', 'upper', 1099, '#A8B49A', 'sage', ['relaxed', 'natural', 'minimal'], ['casual', 'travel', 'brunch'], 'oversized', 'summer', 74, 50),
  item('top-108', 'Charcoal Ribbed Tee', 'top', 'upper', 499, '#3F3B38', 'charcoal', ['minimal', 'comfort', 'everyday'], ['casual', 'college', 'travel'], 'fitted', 'all', 94, 12),
  item('top-109', 'Champagne Silk Camisole', 'top', 'upper', 1199, '#E3CDA4', 'champagne', ['elegant', 'feminine', 'luxe'], ['dinner', 'party', 'wedding'], 'fitted', 'all', 48, 78),
  item('top-110', 'Navy Structured Top', 'top', 'upper', 849, '#2C3A4F', 'navy', ['structured', 'professional', 'minimal'], ['interview', 'office', 'formal'], 'fitted', 'all', 82, 35),
  item('top-111', 'Blush Puff-Sleeve Blouse', 'top', 'upper', 999, '#E8D3D1', 'blush', ['feminine', 'romantic', 'statement'], ['date', 'brunch', 'party'], 'relaxed', 'all', 55, 50),
  item('top-112', 'Oat Oversized Sweater', 'top', 'upper', 1299, '#D9CDBB', 'oat', ['comfort', 'cosy', 'relaxed'], ['casual', 'travel', 'college'], 'oversized', 'winter', 72, 55),
  item('top-113', 'Deep Burgundy Blouse', 'top', 'upper', 1049, '#6E2C3A', 'burgundy', ['bold', 'elegant', 'rich'], ['dinner', 'party', 'wedding'], 'regular', 'winter', 58, 55),
  item('top-114', 'Stone Boxy Shirt', 'top', 'upper', 799, '#CFC6B8', 'stone', ['minimal', 'relaxed', 'modern'], ['casual', 'office', 'travel'], 'oversized', 'all', 86, 25),

  // ────────────────────────── BOTTOMS ─────────────────────────
  item('bot-201', 'Beige Wide-Leg Trousers', 'bottom', 'lower', 999, '#D7C6AC', 'beige', ['minimal', 'elegant', 'comfort'], ['interview', 'office', 'college', 'date'], 'wide', 'all', 90, 35),
  item('bot-202', 'Black Tailored Trousers', 'bottom', 'lower', 1099, '#211D1B', 'black', ['classic', 'professional', 'sharp'], ['interview', 'office', 'formal', 'dinner'], 'straight', 'all', 96, 45),
  item('bot-203', 'Dark Denim Straight Jeans', 'bottom', 'lower', 899, '#33455E', 'indigo', ['casual', 'everyday', 'classic'], ['casual', 'college', 'travel', 'brunch'], 'straight', 'all', 95, 15),
  item('bot-204', 'White Tailored Pants', 'bottom', 'lower', 1199, '#F7F4EE', 'white', ['clean', 'elegant', 'minimal'], ['brunch', 'wedding', 'office'], 'straight', 'summer', 60, 70),
  item('bot-205', 'Charcoal Pencil Skirt', 'bottom', 'lower', 949, '#403A36', 'charcoal', ['professional', 'structured', 'classic'], ['interview', 'office', 'formal'], 'fitted', 'all', 70, 50),
  item('bot-206', 'Olive Utility Trousers', 'bottom', 'lower', 1049, '#6B7355', 'olive', ['relaxed', 'practical', 'modern'], ['casual', 'travel', 'college'], 'relaxed', 'all', 78, 20),
  item('bot-207', 'Camel Pleated Trousers', 'bottom', 'lower', 1299, '#B8946A', 'camel', ['elegant', 'warm', 'refined'], ['office', 'dinner', 'brunch'], 'wide', 'winter', 72, 55),
  item('bot-208', 'Light Wash Mom Jeans', 'bottom', 'lower', 849, '#8FA5C0', 'light denim', ['casual', 'relaxed', 'youthful'], ['casual', 'college', 'travel'], 'relaxed', 'summer', 84, 15),
  item('bot-209', 'Black Midi Skirt', 'bottom', 'lower', 899, '#1E1A18', 'black', ['minimal', 'feminine', 'versatile'], ['date', 'office', 'dinner', 'casual'], 'a-line', 'all', 88, 35),
  item('bot-210', 'Ecru Linen Trousers', 'bottom', 'lower', 1149, '#E4DBC9', 'ecru', ['relaxed', 'natural', 'airy'], ['travel', 'brunch', 'casual'], 'wide', 'summer', 68, 55),
  item('bot-211', 'Navy Straight Trousers', 'bottom', 'lower', 1049, '#2B3648', 'navy', ['professional', 'classic', 'minimal'], ['interview', 'office', 'formal'], 'straight', 'all', 87, 40),
  item('bot-212', 'Chocolate Wide Trousers', 'bottom', 'lower', 1199, '#4A3729', 'chocolate', ['warm', 'elegant', 'modern'], ['office', 'dinner', 'date'], 'wide', 'winter', 76, 45),

  // ────────────────────────── DRESSES ─────────────────────────
  item('drs-301', 'Black Midi Dress', 'dress', 'full', 1699, '#1C1917', 'black', ['minimal', 'elegant', 'timeless'], ['dinner', 'date', 'party', 'formal'], 'a-line', 'all', 90, 45),
  item('drs-302', 'Rose Midi Dress', 'dress', 'full', 1899, '#C98B94', 'dusty rose', ['feminine', 'romantic', 'soft'], ['wedding', 'date', 'brunch', 'party'], 'a-line', 'summer', 58, 55),
  item('drs-303', 'Burgundy Occasion Dress', 'dress', 'full', 2199, '#6B2233', 'burgundy', ['bold', 'statement', 'luxe'], ['wedding', 'party', 'dinner'], 'fitted', 'winter', 38, 80),
  item('drs-304', 'Ivory Slip Dress', 'dress', 'full', 1799, '#F4EDE1', 'ivory', ['minimal', 'elegant', 'sleek'], ['dinner', 'date', 'party'], 'fitted', 'summer', 52, 70),
  item('drs-305', 'Navy Shirt Dress', 'dress', 'full', 1599, '#2A3550', 'navy', ['classic', 'practical', 'minimal'], ['office', 'college', 'casual', 'travel'], 'relaxed', 'all', 86, 30),
  item('drs-306', 'Sage Wrap Dress', 'dress', 'full', 1749, '#9EAE93', 'sage', ['feminine', 'natural', 'soft'], ['brunch', 'date', 'wedding'], 'wrap', 'summer', 64, 45),
  item('drs-307', 'Charcoal Column Dress', 'dress', 'full', 1999, '#3B3633', 'charcoal', ['professional', 'structured', 'sleek'], ['formal', 'office', 'dinner'], 'fitted', 'all', 68, 60),
  item('drs-308', 'Blush Tiered Dress', 'dress', 'full', 1849, '#E5CFCB', 'blush', ['romantic', 'feminine', 'statement'], ['wedding', 'party', 'brunch'], 'relaxed', 'summer', 42, 60),
  item('drs-309', 'Espresso Knit Dress', 'dress', 'full', 1699, '#3A2C24', 'espresso', ['comfort', 'minimal', 'warm'], ['casual', 'office', 'date', 'travel'], 'fitted', 'winter', 82, 40),
  item('drs-310', 'Emerald Satin Dress', 'dress', 'full', 2399, '#1F5245', 'emerald', ['bold', 'luxe', 'statement'], ['party', 'wedding', 'dinner'], 'fitted', 'all', 34, 85),
  item('drs-311', 'Stone Linen Midi', 'dress', 'full', 1549, '#D2C8B6', 'stone', ['relaxed', 'natural', 'airy'], ['travel', 'brunch', 'casual'], 'relaxed', 'summer', 70, 50),
  item('drs-312', 'Powder Blue A-Line Dress', 'dress', 'full', 1649, '#BFD0E0', 'powder blue', ['soft', 'fresh', 'feminine'], ['brunch', 'college', 'date'], 'a-line', 'summer', 60, 40),

  // ───────────────────────── OUTERWEAR ────────────────────────
  item('out-401', 'Minimal Beige Blazer', 'outerwear', 'upper', 999, '#CDBBA0', 'beige', ['structured', 'professional', 'minimal'], ['interview', 'office', 'formal', 'dinner'], 'regular', 'all', 90, 55),
  item('out-402', 'Black Structured Blazer', 'outerwear', 'upper', 1499, '#232019', 'black', ['sharp', 'professional', 'classic'], ['interview', 'office', 'formal'], 'fitted', 'all', 93, 60),
  item('out-403', 'Camel Wool Coat', 'outerwear', 'upper', 2899, '#B08D62', 'camel', ['elegant', 'timeless', 'luxe'], ['office', 'dinner', 'travel'], 'oversized', 'winter', 76, 80),
  item('out-404', 'Cream Cropped Cardigan', 'outerwear', 'upper', 1099, '#EAE0CF', 'cream', ['soft', 'comfort', 'feminine'], ['casual', 'college', 'brunch'], 'fitted', 'all', 84, 45),
  item('out-405', 'Denim Jacket', 'outerwear', 'upper', 1399, '#5C7290', 'denim', ['casual', 'everyday', 'classic'], ['casual', 'college', 'travel'], 'regular', 'all', 88, 20),
  item('out-406', 'Charcoal Trench', 'outerwear', 'upper', 2699, '#4A4540', 'charcoal', ['classic', 'structured', 'refined'], ['office', 'travel', 'formal'], 'regular', 'winter', 74, 70),

  // ─────────────────────────── SHOES ──────────────────────────
  item('shoe-501', 'Neutral Block Heels', 'shoes', 'feet', 1299, '#D6C3AC', 'nude', ['elegant', 'comfort', 'minimal'], ['interview', 'office', 'wedding', 'dinner'], 'regular', 'all', 88, 30),
  item('shoe-502', 'Black Pointed Flats', 'shoes', 'feet', 999, '#201C1A', 'black', ['minimal', 'comfort', 'classic'], ['office', 'college', 'casual', 'interview'], 'regular', 'all', 94, 25),
  item('shoe-503', 'White Leather Sneakers', 'shoes', 'feet', 1599, '#F5F3EE', 'white', ['casual', 'comfort', 'modern'], ['casual', 'college', 'travel', 'brunch'], 'regular', 'all', 92, 35),
  item('shoe-504', 'Tan Ankle Boots', 'shoes', 'feet', 2199, '#9C7550', 'tan', ['warm', 'structured', 'classic'], ['casual', 'office', 'travel'], 'regular', 'winter', 80, 45),
  item('shoe-505', 'Rose Strappy Heels', 'shoes', 'feet', 1499, '#CE97A0', 'dusty rose', ['feminine', 'statement', 'elegant'], ['wedding', 'party', 'date'], 'regular', 'all', 44, 40),
  item('shoe-506', 'Espresso Loafers', 'shoes', 'feet', 1799, '#3E2F26', 'espresso', ['classic', 'comfort', 'refined'], ['office', 'college', 'interview'], 'regular', 'all', 86, 35),
  item('shoe-507', 'Beige Woven Sandals', 'shoes', 'feet', 899, '#DCCDB4', 'beige', ['relaxed', 'natural', 'comfort'], ['casual', 'travel', 'brunch'], 'regular', 'summer', 66, 20),
  item('shoe-508', 'Black Heeled Boots', 'shoes', 'feet', 2399, '#1D1917', 'black', ['sleek', 'bold', 'modern'], ['party', 'dinner', 'date'], 'regular', 'winter', 62, 45),

  // ──────────────────────── ACCESSORIES ───────────────────────
  item('acc-601', 'Minimal Gold Earrings', 'accessory', 'accessory', 399, '#D9BE84', 'gold', ['minimal', 'elegant', 'everyday'], ['interview', 'office', 'date', 'wedding', 'casual'], 'regular', 'all', 96, 10),
  item('acc-602', 'Structured Tote Bag', 'accessory', 'accessory', 1899, '#4B3A2C', 'espresso', ['professional', 'structured', 'classic'], ['interview', 'office', 'travel'], 'regular', 'all', 90, 30),
  item('acc-603', 'Pearl Drop Earrings', 'accessory', 'accessory', 599, '#EFE7DA', 'pearl', ['feminine', 'elegant', 'romantic'], ['wedding', 'dinner', 'date'], 'regular', 'all', 62, 15),
  item('acc-604', 'Slim Leather Belt', 'accessory', 'accessory', 699, '#3B2E24', 'brown', ['minimal', 'classic', 'refined'], ['office', 'casual', 'interview'], 'regular', 'all', 88, 20),
  item('acc-605', 'Soft Blush Scarf', 'accessory', 'accessory', 549, '#E7D2CF', 'blush', ['soft', 'feminine', 'layering'], ['travel', 'casual', 'brunch'], 'regular', 'winter', 70, 35),
  item('acc-606', 'Gold Chain Necklace', 'accessory', 'accessory', 749, '#D6BA85', 'gold', ['minimal', 'elegant', 'modern'], ['date', 'dinner', 'office', 'party'], 'regular', 'all', 90, 15),
  item('acc-607', 'Compact Crossbody Bag', 'accessory', 'accessory', 1299, '#201C1A', 'black', ['minimal', 'practical', 'modern'], ['casual', 'travel', 'college', 'date'], 'regular', 'all', 92, 20),
  item('acc-608', 'Champagne Clutch', 'accessory', 'accessory', 1099, '#E0CBA2', 'champagne', ['elegant', 'statement', 'luxe'], ['wedding', 'party', 'dinner'], 'regular', 'all', 40, 30),
];

/**
 * MAVIE BEAUTY CATALOG
 * Same architecture as garments — real products with structured metadata.
 */
const beauty = (id, name, brand, category, price, hex, shade, finish, tags) => ({
  id, name, brand, category, price, currency: 'INR', hex, shade, finish, tags,
  image_url: null,
  product_url: `https://example.com/mavie/beauty/${id}`,
  available: true,
});

export const beautyCatalog = [
  beauty('bty-701', 'Weightless Skin Tint', 'Mavie Essentials', 'foundation', 899, '#E4C4A8', 'Natural', 'natural', ['lightweight', 'everyday', 'natural']),
  beauty('bty-702', 'Luminous Serum Foundation', 'Mavie Essentials', 'foundation', 1299, '#E0BFA2', 'Warm Beige', 'luminous', ['glow', 'medium-coverage', 'dewy']),
  beauty('bty-703', 'Soft Focus Concealer', 'Mavie Essentials', 'concealer', 649, '#EBCDB4', 'Light Warm', 'natural', ['brightening', 'under-eye']),
  beauty('bty-704', 'Muted Peach Blush', 'Mavie Essentials', 'blush', 549, '#E2A38C', 'Muted Peach', 'satin', ['soft', 'natural', 'warm']),
  beauty('bty-705', 'Dusty Rose Blush', 'Mavie Essentials', 'blush', 549, '#C98B94', 'Dusty Rose', 'matte', ['feminine', 'soft', 'cool']),
  beauty('bty-706', 'Warm Bronzing Powder', 'Mavie Essentials', 'bronzer', 749, '#B08760', 'Warm Sand', 'matte', ['warmth', 'sculpting']),
  beauty('bty-707', 'Soft Contour Stick', 'Mavie Essentials', 'contour', 699, '#9C7B62', 'Cool Taupe', 'matte', ['sculpting', 'definition']),
  beauty('bty-708', 'Champagne Highlighter', 'Mavie Essentials', 'highlight', 699, '#E9D6B0', 'Champagne', 'luminous', ['glow', 'soft-focus']),
  beauty('bty-709', 'Soft Brown Eyeshadow Quad', 'Mavie Essentials', 'eyeshadow', 999, '#8B6A52', 'Soft Brown', 'satin', ['neutral', 'everyday', 'soft']),
  beauty('bty-710', 'Smoked Plum Eyeshadow Duo', 'Mavie Essentials', 'eyeshadow', 899, '#6E4A55', 'Smoked Plum', 'shimmer', ['bold', 'evening', 'defined']),
  beauty('bty-711', 'Fine Line Eyeliner', 'Mavie Essentials', 'eyeliner', 499, '#241E1B', 'Soft Black', 'matte', ['definition', 'precise']),
  beauty('bty-712', 'Volumising Mascara', 'Mavie Essentials', 'mascara', 649, '#1E1A18', 'Black', 'natural', ['lift', 'everyday']),
  beauty('bty-713', 'Rose Nude Lipstick', 'Mavie Essentials', 'lip', 599, '#C4837F', 'Rose Nude', 'satin', ['nude', 'feminine', 'everyday']),
  beauty('bty-714', 'Berry Nude Lipstick', 'Mavie Essentials', 'lip', 599, '#9E5560', 'Berry Nude', 'matte', ['defined', 'evening']),
  beauty('bty-715', 'Clear Glossy Balm', 'Mavie Essentials', 'lip', 449, '#E8C9C2', 'Sheer', 'gloss', ['fresh', 'minimal', 'everyday']),
];

export const CATEGORIES = ['top', 'bottom', 'dress', 'outerwear', 'shoes', 'accessory'];

export const findItem = (id) =>
  catalog.find((c) => c.id === id) || beautyCatalog.find((b) => b.id === id) || null;
