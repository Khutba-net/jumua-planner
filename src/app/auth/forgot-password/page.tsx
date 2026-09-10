"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

const tr = {
  en: {
    title: "Reset your password",
    subtitle: "Enter your email and we'll send you a reset link",
    email: "Email",
    emailPlaceholder: "you@example.com",
    submit: "Send Reset Link",
    sending: "Sending...",
    backToLogin: "Back to Sign In",
    successTitle: "Check your email",
    successMsg: "If an account with that email exists, we've sent a password reset link.",
    fallbackError: "Something went wrong. Please try again.",
  },
  ar: {
    title: "إعادة تعيين كلمة المرور",
    subtitle: "أدخل بريدك الإلكتروني وسنرسل لك رابط إعادة التعيين",
    email: "البريد الإلكتروني",
    emailPlaceholder: "you@example.com",
    submit: "إرسال رابط إعادة التعيين",
    sending: "جاري الإرسال...",
    backToLogin: "العودة لتسجيل الدخول",
    successTitle: "تحقق من بريدك",
    successMsg: "إذا كان هناك حساب بهذا البريد الإلكتروني، فقد أرسلنا رابط إعادة تعيين كلمة المرور.",
    fallbackError: "حدث خطأ. يرجى المحاولة مرة أخرى.",
  },
};

export default function ForgotPasswordPage() {
  const [lang, setLang] = useState<"en" | "ar">("en");
  const c = tr[lang];
  const isAr = lang === "ar";

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [devUrl, setDevUrl] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem("jp_lang");
    if (saved === "ar") setLang("ar");
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || c.fallbackError);
        setLoading(false);
        return;
      }
      setSuccess(true);
      if (data.dev_reset_url) setDevUrl(data.dev_reset_url);
    } catch {
      setError(c.fallbackError);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div dir={isAr ? "rtl" : "ltr"} className={`min-h-screen bg-surface flex flex-col items-center justify-center px-5 py-10 md:py-16 ${isAr ? "font-arabic" : ""}`}>
      <div className="w-full max-w-[460px]">
        <div className="text-center mb-8 md:mb-10">
          <div className="flex items-center justify-center gap-4 mb-4">
            <Link href="/" className="inline-flex items-center gap-2">
              <svg width="24" height="24" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="1" y="1" width="11" height="11" rx="2" fill="#00666d" opacity="0.9"/>
                <rect x="16" y="1" width="11" height="11" rx="2" fill="#00666d" opacity="0.6"/>
                <rect x="1" y="16" width="11" height="11" rx="2" fill="#00666d" opacity="0.6"/>
                <rect x="16" y="16" width="11" height="11" rx="2" fill="#C4A35A" opacity="0.8"/>
              </svg>
              <span className="text-xl font-bold text-primary tracking-tight">Khutba</span>
            </Link>
          </div>
          <button
            onClick={() => { const next = isAr ? "en" : "ar"; setLang(next); localStorage.setItem("jp_lang", next); }}
            className="text-xs text-primary/60 hover:text-primary font-semibold transition-colors"
          >
            {isAr ? "English" : "العربية"}
          </button>
        </div>

        {success ? (
          <div className="text-center">
            <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-5">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#00666d" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-ink mb-2">{c.successTitle}</h1>
            <p className="text-ink/50 text-sm mb-6">{c.successMsg}</p>
            {devUrl && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6 text-left">
                <p className="text-xs font-semibold text-amber-700 mb-1">Dev Mode - Reset Link:</p>
                <a href={devUrl} className="text-xs text-primary break-all hover:underline">{devUrl}</a>
              </div>
            )}
            <Link href="/auth/login" className="text-primary font-semibold text-sm hover:underline">
              {c.backToLogin}
            </Link>
          </div>
        ) : (
          <>
            <h1 className="text-2xl md:text-3xl font-bold text-ink text-center mb-1.5 tracking-tight">
              {c.title}
            </h1>
            <p className="text-ink/40 text-center mb-8 text-sm">
              {c.subtitle}
            </p>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-lg mb-4">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              <div>
                <label className="text-xs font-semibold text-ink/50 block mb-2">{c.email}</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={c.emailPlaceholder}
                  required
                  className="w-full px-4 py-3 rounded-lg border border-line bg-white text-ink placeholder:text-ink/25 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all text-sm"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-full bg-primary text-white font-bold text-sm hover:bg-secondary shadow-md hover:shadow-lg transition-all active:scale-[0.98] disabled:opacity-50 mt-1"
              >
                {loading ? c.sending : c.submit}
              </button>
            </form>

            <p className="text-center text-sm text-ink/40 mt-8">
              <Link href="/auth/login" className="text-primary font-semibold hover:underline">
                {c.backToLogin}
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
