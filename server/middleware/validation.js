import { z } from 'zod';

/** Validate a request body against a Zod schema, or fail with a readable 400. */
export const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({
      error: 'invalid_request',
      message: 'Some details were missing or malformed.',
      issues: result.error.issues.map((i) => ({ path: i.path.join('.'), message: i.message })),
    });
  }
  req.body = result.data;
  next();
};

const constraintsSchema = z.object({
  occasion: z.string().optional(),
  formality: z.string().optional(),
  goal: z.array(z.string()).optional(),
  budget: z.number().nullable().optional(),
  comfort_priority: z.number().min(0).max(1).optional(),
  style_preferences: z.array(z.string()).optional(),
  avoided_colors: z.array(z.string()).optional(),
  summary: z.string().optional(),
  raw_input: z.string().optional(),
  source: z.string().optional(),
}).passthrough();

export const schemas = {
  parseContext: z.object({
    text: z.string().min(3, 'Tell MAVIE a little more about the moment.').max(1000),
  }),

  compose: z.object({
    constraints: constraintsSchema,
    guest: z.boolean().optional(),
  }),

  vtoClothes: z.object({
    userImage: z.string().nullable().optional(),
    lookId: z.string().optional(),
    items: z.array(z.object({ id: z.string() }).passthrough()).min(1),
  }),

  vtoMakeup: z.object({
    userImage: z.string().nullable().optional(),
    makeup: z.object({}).passthrough(),
  }),

  decide: z.object({
    items: z.array(z.object({ id: z.string() }).passthrough()).min(1),
    constraints: constraintsSchema,
    matchScores: z.object({}).passthrough().optional(),
    guest: z.boolean().optional(),
  }),

  closetItem: z.object({
    category: z.string(),
    color: z.string().optional(),
    colors: z.array(z.string()).optional(),
    name: z.string().optional(),
    hex: z.string().optional(),
    style_tags: z.array(z.string()).optional(),
    image_url: z.string().nullable().optional(),
  }),

  feedback: z.object({
    feedback_type: z.enum(['love', 'not_me', 'too_expensive', 'too_uncomfortable', 'too_bold']),
    look_id: z.string().optional(),
    style_tags: z.array(z.string()).optional(),
  }),

  productAnalyse: z.object({
    imageBase64: z.string().min(20, 'That image did not come through.'),
    price: z.number().positive().nullable().optional(),
  }),

  productDecide: z.object({
    product: z.object({ id: z.string(), category: z.string() }).passthrough(),
    constraints: constraintsSchema.optional().default({}),
    guest: z.boolean().optional(),
  }),

  skin: z.object({
    imageUrl: z.string().nullable().optional(),
    imageBase64: z.string().nullable().optional(),
    guest: z.boolean().optional(),
  }),
};

/**
 * Validate AI output too — not just user input.
 * An LLM returning a malformed shape should never reach the decision engine.
 */
export const safeParseAI = (schema, value, fallback) => {
  const result = schema.safeParse(value);
  return result.success ? result.data : fallback;
};
