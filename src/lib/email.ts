import { Resend } from "resend";

let _resend: Resend | null = null;
function getResend() {
  if (!_resend) _resend = new Resend(process.env.RESEND_API_KEY);
  return _resend;
}

const FROM = process.env.EMAIL_FROM || "Khutba <onboarding@resend.dev>";
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
  .btn:hover { background:#005258; }
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

export async function sendPasswordReset(email: string, name: string, resetUrl: string) {
  return getResend().emails.send({
    from: FROM,
    to: email,
    subject: "Reset your Khutba password",
    html: baseHtml(`
      <h1>Reset your password</h1>
      <p>Assalamu alaykom ${name},</p>
      <p>We received a request to reset your password. Click the button below to choose a new one:</p>
      <p><a href="${resetUrl}" class="btn">Reset Password</a></p>
      <p class="muted">This link expires in 1 hour. If you didn't request this, you can safely ignore this email.</p>
      <p class="muted" style="margin-top:16px;word-break:break-all">Or copy this link: ${resetUrl}</p>
    `),
  });
}

export async function sendWelcome(email: string, name: string, verifyUrl: string) {
  return getResend().emails.send({
    from: FROM,
    to: email,
    subject: "Welcome to Khutba — verify your email",
    html: baseHtml(`
      <h1>Welcome to Khutba!</h1>
      <p>Assalamu alaykom ${name},</p>
      <p>Thank you for joining Khutba. Please verify your email address to get started:</p>
      <p><a href="${verifyUrl}" class="btn">Verify Email</a></p>
      <p class="muted">This link expires in 24 hours.</p>
      <p class="muted" style="margin-top:16px;word-break:break-all">Or copy this link: ${verifyUrl}</p>
    `),
  });
}

export async function sendInvitation(email: string, inviterName: string, orgName: string, inviteUrl: string) {
  return getResend().emails.send({
    from: FROM,
    to: email,
    subject: `You're invited to join ${orgName} on Khutba`,
    html: baseHtml(`
      <h1>You've been invited!</h1>
      <p>Assalamu alaykom,</p>
      <p><strong>${inviterName}</strong> has invited you to join <strong>${orgName}</strong> on Khutba — a platform for planning coherent, year-long khutbah series.</p>
      <p><a href="${inviteUrl}" class="btn">Accept Invitation</a></p>
      <p class="muted">This invitation expires in 30 days.</p>
      <p class="muted" style="margin-top:16px;word-break:break-all">Or copy this link: ${inviteUrl}</p>
    `),
  });
}

export async function sendSermonReminder(email: string, name: string, sermonTitle: string, date: string) {
  return getResend().emails.send({
    from: FROM,
    to: email,
    subject: `Reminder: "${sermonTitle}" this Friday`,
    html: baseHtml(`
      <h1>Friday Khutbah Reminder</h1>
      <p>Assalamu alaykom ${name},</p>
      <p>Your upcoming khutbah is scheduled for <strong>${date}</strong>:</p>
      <p style="font-size:18px;font-weight:600;color:#1a2a2c;margin:16px 0;">"${sermonTitle}"</p>
      <p><a href="${APP_URL}/sermons" class="btn">View Sermon</a></p>
      <p class="muted">May Allah grant you clarity and sincerity in your delivery.</p>
    `),
  });
}

export async function sendAssignmentNotification(email: string, name: string, sermonTitle: string, date: string, mosqueName: string) {
  return getResend().emails.send({
    from: FROM,
    to: email,
    subject: `New assignment: "${sermonTitle}" at ${mosqueName}`,
    html: baseHtml(`
      <h1>New Sermon Assignment</h1>
      <p>Assalamu alaykom ${name},</p>
      <p>You have been assigned a khutbah:</p>
      <p style="font-size:18px;font-weight:600;color:#1a2a2c;margin:16px 0;">"${sermonTitle}"</p>
      <p><strong>Date:</strong> ${date}<br><strong>Mosque:</strong> ${mosqueName}</p>
      <p><a href="${APP_URL}/sermons" class="btn">View Assignment</a></p>
    `),
  });
}

export async function sendApprovalRequest(email: string, adminName: string, khatibName: string, sermonTitle: string, reviewUrl: string) {
  return getResend().emails.send({
    from: FROM,
    to: email,
    subject: `Sermon review requested: "${sermonTitle}"`,
    html: baseHtml(`
      <h1>Review Requested</h1>
      <p>Assalamu alaykom ${adminName},</p>
      <p><strong>${khatibName}</strong> has submitted a sermon for your review:</p>
      <p style="font-size:18px;font-weight:600;color:#1a2a2c;margin:16px 0;">"${sermonTitle}"</p>
      <p><a href="${reviewUrl}" class="btn">Review Sermon</a></p>
    `),
  });
}

export async function sendApprovalResult(email: string, name: string, sermonTitle: string, approved: boolean, feedback?: string) {
  const status = approved ? "approved" : "needs revision";
  return getResend().emails.send({
    from: FROM,
    to: email,
    subject: `Sermon ${status}: "${sermonTitle}"`,
    html: baseHtml(`
      <h1>Sermon ${approved ? "Approved" : "Needs Revision"}</h1>
      <p>Assalamu alaykom ${name},</p>
      <p>Your sermon <strong>"${sermonTitle}"</strong> has been ${status}.</p>
      ${feedback ? `<p style="background:#f8f7f5;border-left:3px solid #00666d;padding:12px 16px;margin:16px 0;font-size:14px;color:#3d4f51;">${feedback}</p>` : ""}
      <p><a href="${APP_URL}/sermons" class="btn">View Sermon</a></p>
    `),
  });
}

export async function sendEmailVerification(email: string, name: string, code: string) {
  return getResend().emails.send({
    from: FROM,
    to: email,
    subject: `${code} — Verify your Khutba email`,
    html: baseHtml(`
      <h1>Verify your email</h1>
      <p>Assalamu alaykom ${name},</p>
      <p>Enter this verification code to confirm your email address:</p>
      <div class="code">${code}</div>
      <p class="muted">This code expires in 24 hours. If you didn't create an account, you can safely ignore this.</p>
    `),
  });
}
