// src/services/ai/prompts.ts
// Centralized prompt templates for all AI tools. Keep prompts DRY and tunable.

// ---------- System prompts per tool ----------

export const SYSTEM_PROMPTS = {
  customerReply:
    "You are a professional ecommerce customer service assistant. Write concise, on-brand replies. Always output ONLY the reply text — no labels, no quotes, no markdown fences, no apologies or meta-commentary. Keep replies 2-4 sentences. Use the requested tone. Match the requested language exactly.",

  productDescription:
    "You are an expert ecommerce copywriter. Write benefit-focused listings that convert. Follow the requested format EXACTLY using the labels TITLE/SHORT/LONG/KEYWORDS on their own lines. Do not use markdown fences. Write one specific value per label — never combine labels. Aim for scannable, emotional copy.",

  reviewReply:
    "You are a customer service expert for ecommerce. Write empathetic, professional public replies to negative reviews. Acknowledge the issue sincerely, apologize without making excuses, state the resolution concretely, and invite the customer to continue privately. Keep under 150 words. No hashtags, no emojis unless requested, no markdown.",

  seoOptimizer:
    "You are an ecommerce SEO expert. Optimize listings for search ranking on the requested platform. Follow the requested format EXACTLY using the labels TITLES, DESCRIPTION, TAGS, TIPS on their own lines. Use proven SEO patterns: front-load keywords in titles, include 1-2 power words, stay within platform length limits.",

  whatsappReply:
    "You write WhatsApp business messages. Output 3 distinct variants per scenario using the format 'VARIANT 1: ...---VARIANT 2: ...---VARIANT 3: ...'. Each variant must be under 100 words, feel natural (not formal), and include a soft call-to-action. No markdown, no emojis unless requested.",
};

// ---------- User prompt builders ----------

export interface CustomerReplyInput {
  message: string;
  scenario: string;
  tone: string;
  language: string;
}

export function buildCustomerReplyPrompt(input: CustomerReplyInput): string {
  return `Write a customer service reply with these parameters:
- Scenario: ${input.scenario}
- Tone: ${input.tone.toLowerCase()}
- Language: ${input.language}
- Customer's message: "${input.message}"

Reply (plain text, no labels, no quotes):`;
}

export interface ProductDescInput {
  productName: string;
  features: string;
  platform: string;
  language: string;
  tone: string;
}

export function buildProductDescPrompt(input: ProductDescInput): string {
  return `Generate a product listing optimized for ${input.platform}.

PRODUCT: ${input.productName}
KEY FEATURES: ${input.features || "(none provided)"}
TONE: ${input.tone.toLowerCase()}
LANGUAGE: ${input.language}

Output format (plain text, no markdown, no code fences — labels on their own line, value after the colon):
TITLE: [compelling title under 100 chars, front-load main keyword]
SHORT: [1-2 sentence hook that creates desire, mentions main benefit]
LONG: [3-5 sentences covering: who it's for, top 3 features, what makes it different, call to action]
KEYWORDS: [comma-separated, 8-12 keywords buyers would search]`;
}

export interface ReviewReplyInput {
  review: string;
  issueType: string;
  resolution: string;
}

export function buildReviewReplyPrompt(input: ReviewReplyInput): string {
  return `Respond to this negative customer review.

REVIEW: "${input.review}"
ISSUE TYPE: ${input.issueType}
RESOLUTION WE'RE OFFERING: ${input.resolution}

Write a public reply that:
1. Acknowledges their frustration sincerely (1 sentence)
2. Apologizes briefly without making excuses (1 sentence)
3. States the concrete resolution (1 sentence)
4. Invites them to continue privately via DM/email (1 sentence)
5. Closes warmly with brand name placeholder

Keep it under 150 words. Professional but human. Output ONLY the reply text, no preamble.`;
}

export interface SEOInput {
  currentTitle: string;
  currentDesc: string;
  platform: string;
  language: string;
}

export function buildSEOPrompt(input: SEOInput): string {
  return `Optimize this product listing for ${input.platform} search.

CURRENT TITLE: "${input.currentTitle}"
CURRENT DESCRIPTION: "${input.currentDesc || "(empty)"}"
LANGUAGE: ${input.language}

For ${input.platform} specifically, apply best practices:
- Title: ${input.platform === "Amazon" ? "under 200 chars, brand+product+key feature" : "under 100 chars, keyword front-load"}
- Description: lead with benefit, scannable
- Tags: ${input.platform === "Amazon" ? "mix of long-tail + short" : "high-volume search keywords"}

Output (plain text, no markdown — labels on their own lines):
TITLES:
1. [title option 1]
2. [title option 2]
3. [title option 3]
DESCRIPTION: [2-3 sentences, lead with benefit, naturally include 3-5 main keywords]
TAGS: [comma-separated, 8-12 items]
TIPS: [2 platform-specific tips for ranking this category]`;
}

export interface WhatsAppInput {
  trigger: string;
  businessName: string;
  product: string;
  language: string;
  tone: string;
  includePricing: boolean;
  includeCTA: boolean;
}

export function buildWhatsAppPrompt(input: WhatsAppInput): string {
  const cta = input.includeCTA ? "End each message with a soft call-to-action (e.g., 'Just reply here if you have questions!')." : "Don't add a call-to-action.";
  const pricing = input.includePricing ? "May include pricing info if relevant." : "Don't mention specific prices.";
  return `Generate 3 WhatsApp Business auto-reply variants.

BUSINESS NAME: ${input.businessName || "[Your Business]"}
PRODUCTS/SERVICES: ${input.product || "[Your Products]"}
LANGUAGE: ${input.language}
TONE: ${input.tone.toLowerCase()}
TRIGGER SCENARIO: ${input.trigger}

Requirements for each variant:
- Under 100 words
- Feel natural, not formal/robotic
- Use business name naturally, not as a greeting every time
- ${cta}
- ${pricing}

Output format (plain text, no markdown):
VARIANT 1: [message 1]
---
VARIANT 2: [message 2]
---
VARIANT 3: [message 3]`;
}

// ---------- Temperature presets ----------

export const TEMPERATURES = {
  customerReply: 0.7,   // some creativity for natural replies
  productDescription: 0.85,  // more creative for marketing copy
  reviewReply: 0.55,  // more focused, professional tone
  seoOptimizer: 0.65,  // balanced: creative but not random
  whatsappReply: 0.8,  // varied variants
};

export const MAX_TOKENS = {
  customerReply: 300,
  productDescription: 700,
  reviewReply: 400,
  seoOptimizer: 800,
  whatsappReply: 900,
};
