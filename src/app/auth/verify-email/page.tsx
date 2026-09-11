"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function VerifyEmailPage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resent, setResent] = useState(false);
  const [resending, setResending] = useState(false);

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Verification failed");
        return;
      }
      router.push("/setup");
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    setResending(true);
    setResent(false);
    try {
      await fetch("/api/auth/resend-verification", { method: "POST" });
      setResent(true);
    } catch {
      setError("Failed to resend code");
    } finally {
      setResending(false);
    }
  }

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2">
            <span className="text-2xl font-black text-primary tracking-tight">Khutba</span>
          </Link>
        </div>

        <div className="bg-white border border-line rounded-2xl p-8 shadow-sm">
          <div className="text-center mb-6">
            <span className="material-symbols-outlined text-4xl text-primary mb-2 block">mark_email_read</span>
            <h1 className="text-xl font-bold text-ink">Verify your email</h1>
            <p className="text-sm text-mute mt-2">
              We sent a 6-digit code to your email. Enter it below to verify your account.
            </p>
          </div>

          <form onSubmit={handleVerify} className="flex flex-col gap-4">
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/[^a-zA-Z0-9]/g, "").slice(0, 6))}
              placeholder="Enter code"
              maxLength={6}
              autoFocus
              className="text-center text-2xl font-bold tracking-[8px] text-ink border border-line rounded-xl px-4 py-3 outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all placeholder:text-mute/30 placeholder:tracking-normal placeholder:text-base placeholder:font-normal"
            />

            {error && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded-lg">{error}</p>
            )}

            <button
              type="submit"
              disabled={code.length < 6 || loading}
              className="w-full bg-primary text-white font-semibold py-3 rounded-xl hover:bg-secondary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Verifying..." : "Verify Email"}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={handleResend}
              disabled={resending}
              className="text-sm text-primary hover:text-secondary transition-colors disabled:opacity-50"
            >
              {resending ? "Sending..." : "Resend code"}
            </button>
            {resent && (
              <p className="text-xs text-green-600 mt-2">New code sent! Check your inbox.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
