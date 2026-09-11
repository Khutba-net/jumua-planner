"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import PasswordStrength, { isPasswordValid } from "@/app/components/PasswordStrength";

const tr = {
  en: {
    title: "Create your account",
    subtitle: "Get started with Khutba in seconds",
    google: "Continue with Google",
    or: "or",
    name: "Full name",
    namePlaceholder: "Enter your full name",
    email: "Email",
    emailPlaceholder: "you@example.com",
    password: "Password",
    passPlaceholder: "At least 8 characters",
    creating: "Creating account...",
    create: "Create Account",
    hasAccount: "Already have an account?",
    signIn: "Sign in",
    fallbackError: "Something went wrong. Please try again.",
  },
  ar: {
    title: "أنشئ حسابك",
    subtitle: "ابدأ مع جمعة بلانر في ثوانٍ",
    google: "المتابعة مع جوجل",
    or: "أو",
    name: "الاسم الكامل",
    namePlaceholder: "أدخل اسمك الكامل",
    email: "البريد الإلكتروني",
    emailPlaceholder: "you@example.com",
    password: "كلمة المرور",
    passPlaceholder: "٨ أحرف على الأقل",
    creating: "جاري إنشاء الحساب...",
    create: "إنشاء حساب",
    hasAccount: "لديك حساب بالفعل؟",
    signIn: "تسجيل الدخول",
    fallbackError: "حدث خطأ. يرجى المحاولة مرة أخرى.",
  },
};

export default function SignupPage() {
  const [lang, setLang] = useState<"en" | "ar">("en");
  const c = tr[lang];
  const isAr = lang === "ar";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem("jp_lang");
    if (saved === "ar") setLang("ar");
  }, []);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (!isPasswordValid(password)) {
      setError(isAr ? "كلمة المرور لا تستوفي جميع المتطلبات" : "Password doesn't meet all requirements");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Signup failed");
        setLoading(false);
        return;
      }
      window.location.href = "/auth/verify-email";
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

        <form onSubmit={handleSignup} className="flex flex-col gap-5">
          <div>
            <label className="text-xs font-semibold text-ink/50 block mb-2">{c.name}</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={c.namePlaceholder}
              required
              className="w-full px-4 py-3 rounded-lg border border-line bg-white text-ink placeholder:text-ink/25 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all text-sm"
            />
          </div>

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
            <label className="text-xs font-semibold text-ink/50 block mb-2">{c.password}</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={c.passPlaceholder}
              required
              minLength={8}
              className="w-full px-4 py-3 rounded-lg border border-line bg-white text-ink placeholder:text-ink/25 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all text-sm"
            />
            <PasswordStrength password={password} lang={lang} />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-full bg-primary text-white font-bold text-sm hover:bg-secondary shadow-md hover:shadow-lg transition-all active:scale-[0.98] disabled:opacity-50 mt-1"
          >
            {loading ? c.creating : c.create}
          </button>
        </form>

        <p className="text-center text-sm text-ink/40 mt-8">
          {c.hasAccount}{" "}
          <Link href="/auth/login" className="text-primary font-semibold hover:underline">
            {c.signIn}
          </Link>
        </p>
      </div>
    </div>
  );
}
