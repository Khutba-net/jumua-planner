import { NextRequest, NextResponse } from "next/server";
import { getUserId, AuthError } from "@/lib/auth";
import { queryOne } from "@/lib/db";
import { Resend } from "resend";
import { logger } from "@/lib/logger";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(1).max(200),
  email: z.string().email().max(200),
  orgName: z.string().min(1).max(200),
  mosqueCount: z.string().max(50),
  message: z.string().min(1).max(2000),
});

export async function POST(req: NextRequest) {
  let userId: string | null = null;
  try {
    userId = await getUserId({ skipSubscriptionCheck: true });
  } catch {
    // allow unauthenticated contact too
  }

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const { name, email, orgName, mosqueCount, message } = parsed.data;

  let accountType = "unknown";
  if (userId) {
    const user = await queryOne<{ account_type: string }>(
      "SELECT account_type FROM users WHERE id = $1",
      [userId]
    );
    accountType = user?.account_type || "unknown";
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  const supportEmail = "support@khutba.net";

  await resend.emails.send({
    from: process.env.EMAIL_FROM || "Khutba <onboarding@resend.dev>",
    to: supportEmail,
    replyTo: email,
    subject: `Institution Inquiry — ${orgName}`,
    html: `
      <h2>Institution Plan Inquiry</h2>
      <table style="border-collapse:collapse;font-family:sans-serif;font-size:14px;">
        <tr><td style="padding:6px 12px;font-weight:bold;">Name</td><td style="padding:6px 12px;">${esc(name)}</td></tr>
        <tr><td style="padding:6px 12px;font-weight:bold;">Email</td><td style="padding:6px 12px;">${esc(email)}</td></tr>
        <tr><td style="padding:6px 12px;font-weight:bold;">Organization</td><td style="padding:6px 12px;">${esc(orgName)}</td></tr>
        <tr><td style="padding:6px 12px;font-weight:bold;">Mosques</td><td style="padding:6px 12px;">${esc(mosqueCount)}</td></tr>
        <tr><td style="padding:6px 12px;font-weight:bold;">Account Type</td><td style="padding:6px 12px;">${accountType}</td></tr>
        <tr><td style="padding:6px 12px;font-weight:bold;">User ID</td><td style="padding:6px 12px;">${userId || "not logged in"}</td></tr>
      </table>
      <h3>Message</h3>
      <p style="white-space:pre-wrap;font-size:14px;">${esc(message)}</p>
    `,
  });

  logger.info("Institution inquiry sent", { email, orgName });

  return NextResponse.json({ ok: true });
}

function esc(str: string): string {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
