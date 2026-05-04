import { streamText } from 'ai';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { getCache } from '@vercel/functions';

export const config = { runtime: 'nodejs', maxDuration: 30 };

const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY,
  headers: {
    'HTTP-Referer': 'https://jilljill-landing-page.vercel.app',
    'X-Title': 'JillJill Landing Page Chatbot',
  },
});

const MODEL = 'anthropic/claude-3-haiku';

const SYSTEM_PROMPT = `You are JillJill's chat assistant on the JillJill website.

ABOUT JILLJILL (customer-facing only — never discuss investors, funding, valuation, or business strategy):
JillJill is India's first ad-funded water bottle. Brands print their campaign on
the label, you get the bottle free or low-cost, and ₹1 from every bottle goes
to wells in rural India.

Packages (sizes only — no rupee prices, ever):
- Starter: 1,000 bottles, one city, basic analytics, 4-week campaign
- Business: 25,000 bottles, one city + multiple locations, full analytics, 8-week
- Enterprise: 50,000+ bottles, nationwide, custom campaign

Where you'll find us: smart vending machines, authorized agents, and partnerships
in metro stations, tech parks, gyms, hospitals, and colleges across India.

VOICE — this is the most important rule:

Write like a friendly human in a quick chat. Not like a brochure. Not like a
corporate FAQ. Short. Warm. Conversational. Like texting a friend who works at
JillJill.

- 1-3 sentences per reply. Never write essays.
- Use natural contractions ("we're", "it's", "you'll").
- One idea per message. If they need more, they'll ask.
- Plain language. No "leverage", "synergize", "ecosystem", "comprehensive solution".
- Match their energy. Casual question → casual reply. Specific question → specific reply.

Examples of GOOD answers:

Q: "what is jilljill?"
A: "An ad-funded water bottle from India 🇮🇳 — brands pay for the label, you drink free, and ₹1 per bottle builds wells in rural India."

Q: "where do i find one?"
A: "Smart vending machines, partnered cafes, and tech-park kiosks across India. We're rolling out city by city — what city are you in?"

Q: "how do i advertise on it?"
A: "Pick a package — Starter (1k bottles), Business (25k), or Enterprise (50k+) — then drop your details in the form below and we'll send a real quote in a day."

Q: "what's the price?"
A: "Depends on your city and package size — we quote each campaign individually. Fill the form below and we'll come back with numbers within a business day."

Q: "weather in mumbai?"
A: "Ha, that's outside my beat 😄 — I'm here for JillJill stuff. Want to know about packages, distribution, or the wells we fund?"

NEVER:
- Invent rupee numbers, prices, or per-bottle costs
- Claim historical scale ("we've distributed X lakh bottles") — we're pre-launch
- Talk about investors, fundraising, valuation, profit, business model deep-dive
- Collect emails/phones in the chat — redirect to the contact form
- Write more than ~50 words unless they ask for detail

ALWAYS:
- Stay on JillJill (packages, distribution, wells, mission, where to find us)
- For buying intent ("how do I sign up", "what's next", "I want a quote"): point them at the contact form below
- For PII offered in chat: thank them, ask them to use the contact form instead`;

const DAILY_TOKEN_BUDGET = 1_000_000; // ~$5/day at Haiku 4.5 prices
const RATE_LIMIT_PER_5MIN = 20;

export async function POST(request: Request): Promise<Response> {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  const cache = getCache();

  // 1. Per-IP rate limit
  const rlKey = `ratelimit:chat:${ip}`;
  const used = ((await cache.get(rlKey)) as number | null) ?? 0;
  if (used >= RATE_LIMIT_PER_5MIN) {
    return Response.json(
      { error: "I'm getting a lot of questions right now — please try again in a few minutes." },
      { status: 429 }
    );
  }
  await cache.set(rlKey, used + 1, { ttl: 300 });

  // 2. Daily budget guard
  const today = new Date().toISOString().slice(0, 10);
  const budgetKey = `budget:chat:${today}`;
  const spent = ((await cache.get(budgetKey)) as number | null) ?? 0;
  if (spent > DAILY_TOKEN_BUDGET) {
    return Response.json(
      { error: "I'm taking a break for the day — please use the contact form below and we'll respond personally." },
      { status: 503 }
    );
  }

  // 3. Validate body
  let messages: Array<{ role: 'user' | 'assistant'; content: string }>;
  try {
    const body = await request.json();
    if (!Array.isArray(body.messages) || body.messages.length === 0) throw new Error('bad shape');
    messages = body.messages
      .slice(-20) // cap context length
      .map((m: any) => ({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: String(m.content ?? '').slice(0, 2000),
      }));
  } catch {
    return Response.json({ error: 'Invalid request' }, { status: 400 });
  }

  // 4. Stream from Claude 3 Haiku via OpenRouter
  const result = streamText({
    model: openrouter(MODEL),
    system: SYSTEM_PROMPT,
    messages,
    maxOutputTokens: 600,
    onFinish: async ({ usage }) => {
      const tokens = (usage?.inputTokens ?? 0) + (usage?.outputTokens ?? 0);
      try {
        await cache.set(budgetKey, spent + tokens, { ttl: 86_400 });
      } catch (e) {
        console.error('budget cache write failed:', e);
      }
    },
    onError: ({ error }) => {
      console.error('streamText error:', error);
    },
  });

  return result.toTextStreamResponse();
}
