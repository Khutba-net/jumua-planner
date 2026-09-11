import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3100";

function baseHtml(content: string) {
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>
  body { margin:0; padding:0; background:#f8f7f5; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif; color:#1a2a2c; }
  .wrap { max-width:560px; margin:0 auto; padding:40px 24px; }
  .card { background:#fff; border:1px solid #e8e6e1; border-radius:12px; padding:32px; }
  .logo { font-size:20px; font-weight:700; color:#00666d; letter-spacing:-0.3px; margin-bottom:24px; }
  h1 { font-size:22px; font-weight:700; margin:0 0 12px; color:#1a2a2c; }
  p { font-size:15px; line-height:1.6; margin:0 0 16px; color:#3d4f51; }
  .btn { display:inline-block; background:#00666d; color:#fff !important; text-decoration:none; font-size:14px; font-weight:600; padding:12px 28px; border-radius:8px; margin:8px 0 16px; }
  .muted { font-size:13px; color:#8a9a9c; }
  .footer { text-align:center; padding:24px; font-size:12px; color:#8a9a9c; }
  .footer a { color:#00666d; text-decoration:none; }
  .code { font-size:28px; font-weight:700; letter-spacing:4px; color:#00666d; background:#f0f9f9; padding:12px 24px; border-radius:8px; display:inline-block; margin:8px 0 16px; }
</style></head><body>
<div class="wrap">
  <div class="card">
    <div class="logo">Khutba</div>
    ${content}
  </div>
  <div class="footer">
    <p>&copy; ${new Date().getFullYear()} Khutba &middot; <a href="${APP_URL}">khutba.net</a></p>
    <p><a href="${APP_URL}/privacy">Privacy</a> &middot; <a href="${APP_URL}/terms">Terms</a></p>
  </div>
</div>
</body></html>`;
}

const templates: Record<string, string> = {
  verification: baseHtml(`
    <h1>Verify your email</h1>
    <p>Assalamu alaykom Ahmed,</p>
    <p>Enter this verification code to confirm your email address:</p>
    <div class="code">A49FF4</div>
    <p class="muted">This code expires in 24 hours. If you didn't create an account, you can safely ignore this.</p>
  `),
  "password-reset": baseHtml(`
    <h1>Reset your password</h1>
    <p>Assalamu alaykom Ahmed,</p>
    <p>We received a request to reset your password. Click the button below to choose a new one:</p>
    <p><a href="${APP_URL}/auth/reset-password?token=demo" class="btn">Reset Password</a></p>
    <p class="muted">This link expires in 1 hour. If you didn't request this, you can safely ignore this email.</p>
  `),
  invitation: baseHtml(`
    <h1>You've been invited!</h1>
    <p>Assalamu alaykom,</p>
    <p><strong>Imam Abdullah</strong> has invited you to join <strong>Al-Noor Islamic Center — Downtown Mosque</strong> on Khutba — a platform for planning coherent, year-long khutbah series.</p>
    <p><a href="${APP_URL}/invite/abc123" class="btn">Accept Invitation</a></p>
    <p class="muted">This invitation expires in 30 days.</p>
  `),
  reminder: baseHtml(`
    <h1>Friday Khutbah Reminder</h1>
    <p>Assalamu alaykom Ahmed,</p>
    <p>Your upcoming khutbah is scheduled for <strong>Friday, September 12, 2026</strong>:</p>
    <p style="font-size:18px;font-weight:600;color:#1a2a2c;margin:16px 0;">"The Power of Patience in Times of Trial"</p>
    <p><a href="${APP_URL}/sermons" class="btn">View Sermon</a></p>
    <p class="muted">May Allah grant you clarity and sincerity in your delivery.</p>
  `),
  assignment: baseHtml(`
    <h1>New Sermon Assignment</h1>
    <p>Assalamu alaykom Ahmed,</p>
    <p>You have been assigned a khutbah:</p>
    <p style="font-size:18px;font-weight:600;color:#1a2a2c;margin:16px 0;">"Gratitude as a Path to Contentment"</p>
    <p><strong>Date:</strong> Friday, September 19, 2026<br><strong>Mosque:</strong> Al-Noor Islamic Center</p>
    <p><a href="${APP_URL}/sermons" class="btn">View Assignment</a></p>
  `),
  "approval-request": baseHtml(`
    <h1>Review Requested</h1>
    <p>Assalamu alaykom Imam Abdullah,</p>
    <p><strong>Ahmed</strong> has submitted a sermon for your review:</p>
    <p style="font-size:18px;font-weight:600;color:#1a2a2c;margin:16px 0;">"The Power of Patience in Times of Trial"</p>
    <p><a href="${APP_URL}/sermons/demo/edit" class="btn">Review Sermon</a></p>
  `),
  approved: baseHtml(`
    <h1>Sermon Approved</h1>
    <p>Assalamu alaykom Ahmed,</p>
    <p>Your sermon <strong>"The Power of Patience in Times of Trial"</strong> has been approved.</p>
    <p style="background:#f8f7f5;border-left:3px solid #00666d;padding:12px 16px;margin:16px 0;font-size:14px;color:#3d4f51;">Excellent work, jazakallahu khairan. The references are well-chosen and the structure flows naturally.</p>
    <p><a href="${APP_URL}/sermons" class="btn">View Sermon</a></p>
  `),
  revision: baseHtml(`
    <h1>Sermon Needs Revision</h1>
    <p>Assalamu alaykom Ahmed,</p>
    <p>Your sermon <strong>"The Power of Patience in Times of Trial"</strong> has been needs revision.</p>
    <p style="background:#f8f7f5;border-left:3px solid #00666d;padding:12px 16px;margin:16px 0;font-size:14px;color:#3d4f51;">Please add more Quranic references in the second section and consider shortening the introduction.</p>
    <p><a href="${APP_URL}/sermons" class="btn">View Sermon</a></p>
  `),
};

export async function GET(req: Request) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not available in production" }, { status: 403 });
  }

  const url = new URL(req.url);
  const template = url.searchParams.get("t");

  if (!template || !templates[template]) {
    const list = Object.keys(templates).map((t) => `<a href="?t=${t}" style="display:block;padding:8px 0;color:#00666d;font-size:16px;">${t}</a>`).join("");
    return new NextResponse(
      `<!DOCTYPE html><html><head><title>Email Previews</title><style>body{font-family:sans-serif;max-width:400px;margin:40px auto;padding:20px;}h1{color:#1a2a2c;}</style></head><body><h1>Email Templates</h1>${list}</body></html>`,
      { headers: { "content-type": "text/html" } }
    );
  }

  return new NextResponse(templates[template], {
    headers: { "content-type": "text/html" },
  });
}
