"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

const tr = {
  en: {
    welcome: "Welcome back",
    subtitle: "Sign in to continue planning your khutbahs",
    google: "Continue with Google",
    or: "or",
    email: "Email",
    password: "Password",
    forgot: "Forgot password?",
    emailPlaceholder: "you@example.com",
    passPlaceholder: "Enter your password",
    signing: "Signing in...",
    signIn: "Sign In",
    noAccount: "Don't have an account?",
    createOne: "Create one",
    fallbackError: "Something went wrong. Please try again.",
  },
  ar: {
    welcome: "مرحباً بعودتك",
    subtitle: "سجّل دخولك لمتابعة تخطيط خطبك",
    google: "المتابعة مع جوجل",
    or: "أو",
    email: "البريد الإلكتروني",
    password: "كلمة المرور",
    forgot: "نسيت كلمة المرور؟",
    emailPlaceholder: "you@example.com",
    passPlaceholder: "أدخل كلمة المرور",
    signing: "جاري تسجيل الدخول...",
    signIn: "تسجيل الدخول",
    noAccount: "ليس لديك حساب؟",
    createOne: "أنشئ حساباً",
    fallbackError: "حدث خطأ. يرجى المحاولة مرة أخرى.",
  },
};

export default function LoginPage() {
  const [lang, setLang] = useState<"en" | "ar">("en");
  const c = tr[lang];
  const isAr = lang === "ar";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem("jp_lang");
    if (saved === "ar") setLang("ar");
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Login failed");
        setLoading(false);
        return;
      }
      window.location.href = data.user?.onboarding_complete ? "/dashboard" : "/setup";
    } catch {
      setError(c.fallbackError);
      setLoading(false);
    }
  };

  return (
    <div dir={isAr ? "rtl" : "ltr"} className={`min-h-screen bg-surface flex flex-col items-center justify-center px-5 py-10 md:py-16 ${isAr ? "font-arabic" : ""}`}>
      <div className="w-full max-w-[460px]">
        {/* Logo + lang toggle */}
        <div className="text-center mb-8 md:mb-10">
          <div className="flex items-center justify-center gap-4 mb-4">
            <Link href="/" className="inline-flex items-center gap-2">
              <svg width="24" height="24" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="1" y="1" width="11" height="11" rx="2" fill="#00666d" opacity="0.9"/>
                <rect x="16" y="1" width="11" height="11" rx="2" fill="#00666d" opacity="0.6"/>
                <rect x="1" y="16" width="11" height="11" rx="2" fill="#00666d" opacity="0.6"/>
                <rect x="16" y="16" width="11" height="11" rx="2" fill="#C4A35A" opacity="0.8"/>
              </svg>
              <span className="text-xl font-bold text-primary tracking-tight">JumuaPlanner</span>
            </Link>
          </div>
          <button
            onClick={() => { const next = isAr ? "en" : "ar"; setLang(next); localStorage.setItem("jp_lang", next); }}
            className="text-xs text-primary/60 hover:text-primary font-semibold transition-colors"
          >
            {isAr ? "English" : "العربية"}
          </button>
        </div>

        <h1 className="text-2xl md:text-3xl font-bold text-ink text-center mb-1.5 tracking-tight">
          {c.welcome}
        </h1>
        <p className="text-ink/40 text-center mb-8 text-sm">
          {c.subtitle}
        </p>

        <button
          type="button"
          className="w-full py-3.5 rounded-full border border-line bg-white text-ink font-semibold text-sm hover:bg-surface transition-all flex items-center justify-center gap-3"
        >
          <svg width="18" height="18" viewBox="0 0 18 18">
            <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
            <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
            <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
            <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
          </svg>
          {c.google}
        </button>

        <div className="flex items-center gap-3 my-5">
          <div className="flex-1 h-px bg-line" />
          <span className="text-[10px] text-ink/30 font-semibold uppercase tracking-wider">{c.or}</span>
          <div className="flex-1 h-px bg-line" />
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="flex flex-col gap-5">
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

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-ink/50">{c.password}</label>
              <button type="button" className="text-xs text-primary font-semibold hover:underline">
                {c.forgot}
              </button>
            </div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={c.passPlaceholder}
              required
              className="w-full px-4 py-3 rounded-lg border border-line bg-white text-ink placeholder:text-ink/25 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all text-sm"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-full bg-primary text-white font-bold text-sm hover:bg-secondary shadow-md hover:shadow-lg transition-all active:scale-[0.98] disabled:opacity-50 mt-1"
          >
            {loading ? c.signing : c.signIn}
          </button>
        </form>

        <p className="text-center text-sm text-ink/40 mt-8">
          {c.noAccount}{" "}
          <Link href="/auth/signup" className="text-primary font-semibold hover:underline">
            {c.createOne}
          </Link>
        </p>
      </div>
    </div>
  );
}
