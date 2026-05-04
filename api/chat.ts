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

const SYSTEM_PROMPT = `You are JillJill's assistant on the JillJill landing page.

JillJill is India's first ad-funded water bottle company. Brands pay to put their
campaign on the bottle label; consumers get the bottle free or at low cost; ₹1
from every bottle funds clean water wells across rural India.

Pricing tiers:
- Starter: 1,000 bottles, single city, basic analytics, 4-week campaign
- Business: 25,000 bottles, single city + multi-location, full analytics, 8-week
- Enterprise: 50,000+ bottles, nationwide, custom campaign

Distribution channels: smart vending machines, authorized agents, partnerships
in metros, tech parks, transit hubs, gyms, hospitals, colleges across India.

YOUR JOB:
- Answer prospect questions warmly and concretely.
- Use the pricing tiers above. Never invent numbers.
- This is a pre-launch venture — do NOT claim "10 lakh bottles distributed" or
  any other historical scale; we're a young team building from the ground up.
- When the visitor shows buying interest (asks "how do I buy", "what's next",
  mentions a budget, or asks for a quote), invite them to fill the contact form
  on the page (you can mention "the contact form below" or "the Send my brief
  button").
- Stay on-topic: JillJill, ad-funded bottles, B2B campaigns, the social-impact
  mission. Politely redirect off-topic chat back to JillJill.
- Never collect PII inside the chat. If the visitor offers their email/phone,
  thank them and ask them to use the contact form so it goes to the right place.
- Keep responses under 100 words unless the question genuinely needs more.`;

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
