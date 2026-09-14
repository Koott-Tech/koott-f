import { NextResponse } from 'next/server';

/**
 * Contact form relay.
 *
 * Sends the enquiry on by email when RESEND_API_KEY is configured. When it is
 * not, this returns 501 with a clear message rather than pretending the message
 * was delivered — a contact form that silently drops enquiries is worse than one
 * that says it is not wired up.
 *
 * The attachment is intentionally not relayed yet; only its filename is passed
 * through, so the reply can ask for it.
 */

const TO = process.env.CONTACT_TO || 'admin@koott.in';
const FROM = process.env.RESEND_FROM || process.env.RESEND_FROM_EMAIL;

function clean(v, max = 2000) {
  return typeof v === 'string' ? v.trim().slice(0, max) : '';
}

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: 'Invalid request body.' }, { status: 400 });
  }

  const name = clean(body.name, 120);
  const email = clean(body.email, 200);
  const phone = clean(body.phone, 40);
  const reason = clean(body.reason, 80);
  const position = clean(body.position, 80);
  const message = clean(body.message, 5000);
  const fileName = clean(body.fileName, 200);

  if (!name || !email || !phone || !message) {
    return NextResponse.json(
      { message: 'Name, phone, email and message are all required.' },
      { status: 400 }
    );
  }
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return NextResponse.json({ message: 'That email address looks incomplete.' }, { status: 400 });
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey || !FROM) {
    console.warn('[api/contact] enquiry received but no mail transport is configured:', { name, email, reason });
    return NextResponse.json(
      { message: 'Contact delivery is not configured yet. Please email admin@koott.in directly.' },
      { status: 501 }
    );
  }

  const lines = [
    `Name: ${name}`,
    `Phone: ${phone}`,
    `Email: ${email}`,
    reason && `Reason: ${reason}`,
    position && `Position: ${position}`,
    fileName && `Attachment named: ${fileName} (not transmitted)`,
    '',
    message,
  ].filter(Boolean);

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: FROM,
        to: [TO],
        reply_to: email,
        subject: `Website enquiry — ${reason || 'General'} — ${name}`,
        text: lines.join('\n'),
      }),
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => '');
      console.error('[api/contact] resend rejected the message:', res.status, detail.slice(0, 300));
      return NextResponse.json({ message: 'We couldn’t send that just now.' }, { status: 502 });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[api/contact]', err);
    return NextResponse.json({ message: 'We couldn’t send that just now.' }, { status: 502 });
  }
}
