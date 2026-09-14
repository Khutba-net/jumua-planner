"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

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
    tryDemo: "Try Demo",
    demoHint: "Explore the app with a pre-configured demo account",
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
    tryDemo: "تجربة العرض",
    demoHint: "استكشف التطبيق بحساب تجريبي جاهز",
  },
};

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const searchParams = useSearchParams();
  const inviteCode = searchParams.get("invite") || "";
  const mosqueInviteCode = searchParams.get("mosque_invite") || "";
  const hasInvite = !!inviteCode || !!mosqueInviteCode;

  const [lang, setLang] = useState<"en" | "ar">("en");
  const c = tr[lang];
  const isAr = lang === "ar";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);
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
        body: JSON.stringify({ email, password, invite_code: inviteCode || undefined, mosque_invite_code: mosqueInviteCode || undefined }),
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

  const handleDemo = async () => {
    setDemoLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "ahmed@example.com", password: "demo1234" }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Demo login failed");
        setDemoLoading(false);
        return;
      }
      window.location.href = data.user?.onboarding_complete ? "/dashboard" : "/setup";
    } catch {
      setError(c.fallbackError);
      setDemoLoading(false);
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

        {hasInvite && (
          <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 mb-6 text-center">
            <span className="material-symbols-outlined text-primary text-2xl mb-1">{mosqueInviteCode ? "mosque" : "group_add"}</span>
            <p className="text-sm text-ink/70 font-medium">
              {isAr ? "سجّل دخولك لقبول الدعوة" : "Sign in to accept your invitation"}
            </p>
          </div>
        )}

        <h1 className="text-2xl md:text-3xl font-bold text-ink text-center mb-1.5 tracking-tight">
          {hasInvite ? (isAr ? "تسجيل الدخول للانضمام" : "Sign in to join") : c.welcome}
        </h1>
        <p className="text-ink/40 text-center mb-8 text-sm">
          {hasInvite ? (isAr ? "سجّل دخولك بحسابك الحالي لقبول الدعوة" : "Sign in with your existing account to accept the invite") : c.subtitle}
        </p>


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
              <Link href="/auth/forgot-password" className="text-xs text-primary/60 hover:text-primary font-semibold transition-colors">
                {c.forgot}
              </Link>
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

        <div className="mt-6 flex items-center gap-3">
          <div className="flex-1 h-px bg-line" />
          <span className="text-xs text-ink/30 font-medium">{c.or}</span>
          <div className="flex-1 h-px bg-line" />
        </div>

        <button
          onClick={handleDemo}
          disabled={demoLoading}
          className="w-full mt-4 py-3 rounded-full border-2 border-primary/20 text-primary font-bold text-sm hover:bg-primary/5 transition-all active:scale-[0.98] disabled:opacity-50"
        >
          {demoLoading ? c.signing : c.tryDemo}
        </button>
        <p className="text-center text-xs text-ink/30 mt-2">{c.demoHint}</p>

        <p className="text-center text-sm text-ink/40 mt-6">
          {c.noAccount}{" "}
          <Link href="/auth/signup" className="text-primary font-semibold hover:underline">
            {c.createOne}
          </Link>
        </p>
      </div>
    </div>
  );
}
