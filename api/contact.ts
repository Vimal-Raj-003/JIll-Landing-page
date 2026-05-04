import { z } from 'zod';
import nodemailer from 'nodemailer';
import { getCache } from '@vercel/functions';

export const config = { runtime: 'nodejs', maxDuration: 60 };

const Schema = z.object({
  company: z.string().min(1).max(120),
  name: z.string().min(1).max(80),
  email: z.string().email().max(160),
  phone: z.string().min(7).max(20),
  city: z.string().min(1).max(60),
  package: z.enum(['starter', 'business', 'enterprise', 'not_sure']),
  quantity: z.coerce.number().int().min(1).max(10_000_000),
  message: z.string().min(1).max(2000),
  website: z.string().max(0).optional(), // honeypot — must be empty
});

type Payload = z.infer<typeof Schema>;

export async function POST(request: Request): Promise<Response> {
  // 1. Parse + validate
  let payload: Payload;
  try {
    payload = Schema.parse(await request.json());
  } catch {
    return Response.json({ ok: false, error: 'Invalid form data' }, { status: 400 });
  }

  // 2. Honeypot tripped — pretend success silently
  if (payload.website && payload.website.length > 0) {
    return Response.json({ ok: true });
  }

  // 3. Vercel BotID gate (header set by Vercel platform when BotID is enabled)
  const botIdHeader = request.headers.get('x-vercel-botid-verification');
  if (botIdHeader === 'block') {
    return Response.json({ ok: false, error: 'Bot detected' }, { status: 403 });
  }

  // 4. Rate limit per IP (3 / 10 min)
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  const cache = getCache();
  const rlKey = `ratelimit:contact:${ip}`;
  const current = ((await cache.get(rlKey)) as number | null) ?? 0;
  if (current >= 3) {
    return Response.json(
      { ok: false, error: 'Too many submissions — please try again in a few minutes.' },
      { status: 429 }
    );
  }
  await cache.set(rlKey, current + 1, { ttl: 600 });

  // 5. Send email via Zoho SMTP
  const { ZOHO_USER, ZOHO_PASS, ZOHO_FROM, ZOHO_TO } = process.env;
  if (!ZOHO_USER || !ZOHO_PASS || !ZOHO_FROM || !ZOHO_TO) {
    console.error('Missing Zoho env vars');
    return Response.json(
      { ok: false, error: 'Mail service not configured. Please email vimal@vimsenterprise.com directly.' },
      { status: 500 }
    );
  }

  // Try multiple Zoho host/port combos — vimsenterprise.com may be on the
  // .com or .in data center, with TLS on either 465 (SSL) or 587 (STARTTLS).
  const SMTP_CONFIGS = [
    { host: 'smtppro.zoho.in',  port: 465, secure: true  },
    { host: 'smtppro.zoho.com', port: 465, secure: true  },
    { host: 'smtp.zoho.in',     port: 465, secure: true  },
    { host: 'smtp.zoho.com',    port: 465, secure: true  },
    { host: 'smtppro.zoho.in',  port: 587, secure: false },
    { host: 'smtppro.zoho.com', port: 587, secure: false },
  ];

  let lastError: unknown = null;
  let sent = false;

  for (const cfg of SMTP_CONFIGS) {
    const transporter = nodemailer.createTransport({
      ...cfg,
      auth: { user: ZOHO_USER.trim(), pass: ZOHO_PASS.trim() },
      connectionTimeout: 5_000,
      greetingTimeout: 5_000,
      socketTimeout: 5_000,
    });
    try {
      await Promise.race([
        transporter.sendMail({
          from: ZOHO_FROM,
          to: ZOHO_TO,
          replyTo: payload.email,
          subject: `[JillJill Lead] ${payload.company} — ${payload.package}`,
          text: formatPlain(payload, ip),
          html: formatHtml(payload, ip),
        }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('overall timeout')), 6_000)),
      ]);
      console.log('SMTP succeeded via', cfg.host, cfg.port);
      sent = true;
      break;
    } catch (error) {
      const err = error as { code?: string; response?: string };
      console.log('SMTP failed via', cfg.host, cfg.port, '->', err?.code, err?.response);
      lastError = error;
    }
  }

  if (!sent) {
    console.error('All SMTP configs failed. Last error:', lastError);
    return Response.json(
      {
        ok: false,
        error: 'We could not send your message right now. Please email vimal@vimsenterprise.com directly.',
      },
      { status: 502 }
    );
  }

  return Response.json({ ok: true });
}

function formatPlain(p: Payload, ip: string): string {
  return [
    `New JillJill lead — ${new Date().toISOString()}`,
    ``,
    `Company:   ${p.company}`,
    `Name:      ${p.name}`,
    `Email:     ${p.email}`,
    `Phone:     ${p.phone}`,
    `City:      ${p.city}`,
    `Package:   ${p.package}`,
    `Quantity:  ${p.quantity}`,
    ``,
    `Message:`,
    p.message,
    ``,
    `--`,
    `Source IP: ${ip}`,
  ].join('\n');
}

function formatHtml(p: Payload, ip: string): string {
  const esc = (s: string) =>
    s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
  const messageHtml = esc(p.message).replace(/\n/g, '<br>');
  return `
<!DOCTYPE html>
<html><body style="font-family:-apple-system,Segoe UI,sans-serif;color:#111;">
  <h2 style="color:#F4B400;margin-bottom:8px;">New JillJill Lead</h2>
  <p style="color:#666;font-size:13px;margin-top:0;">${new Date().toISOString()}</p>
  <table cellpadding="6" style="border-collapse:collapse;font-size:14px;">
    <tr><td><strong>Company</strong></td><td>${esc(p.company)}</td></tr>
    <tr><td><strong>Name</strong></td><td>${esc(p.name)}</td></tr>
    <tr><td><strong>Email</strong></td><td><a href="mailto:${esc(p.email)}">${esc(p.email)}</a></td></tr>
    <tr><td><strong>Phone</strong></td><td><a href="tel:${esc(p.phone)}">${esc(p.phone)}</a></td></tr>
    <tr><td><strong>City</strong></td><td>${esc(p.city)}</td></tr>
    <tr><td><strong>Package</strong></td><td>${esc(p.package)}</td></tr>
    <tr><td><strong>Quantity</strong></td><td>${p.quantity.toLocaleString('en-IN')}</td></tr>
  </table>
  <h3 style="margin-top:24px;">Message</h3>
  <p style="white-space:pre-wrap;border-left:3px solid #F4B400;padding-left:12px;color:#333;">${messageHtml}</p>
  <hr style="margin-top:32px;border:none;border-top:1px solid #eee;">
  <p style="color:#888;font-size:12px;">Source IP: ${esc(ip)}</p>
</body></html>`;
}
