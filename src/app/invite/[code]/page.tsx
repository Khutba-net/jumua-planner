"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";

const tr = {
  en: {
    loading: "Loading invite...",
    invalidTitle: "Invalid Invite",
    invalidDesc: "This invite link is invalid or has expired.",
    backHome: "Go to homepage",
    joinOrg: (org: string) => `Join ${org}`,
    youreInvited: (name: string, org: string) => `${name}, you've been invited to join ${org} on Khutba.`,
    createAccount: "Create your account to get started.",
    name: "Full name",
    namePlaceholder: "Enter your full name",
    email: "Email",
    emailPlaceholder: "you@example.com",
    password: "Password",
    passPlaceholder: "At least 8 characters",
    joining: "Joining...",
    join: "Join Organization",
    hasAccount: "Already have an account?",
    signIn: "Sign in",
    fallbackError: "Something went wrong. Please try again.",
  },
  ar: {
    loading: "جاري تحميل الدعوة...",
    invalidTitle: "دعوة غير صالحة",
    invalidDesc: "رابط الدعوة هذا غير صالح أو انتهت صلاحيته.",
    backHome: "العودة للرئيسية",
    joinOrg: (org: string) => `انضم إلى ${org}`,
    youreInvited: (name: string, org: string) => `${name}، لقد تمت دعوتك للانضمام إلى ${org} على جمعة بلانر.`,
    createAccount: "أنشئ حسابك للبدء.",
    name: "الاسم الكامل",
    namePlaceholder: "أدخل اسمك الكامل",
    email: "البريد الإلكتروني",
    emailPlaceholder: "you@example.com",
    password: "كلمة المرور",
    passPlaceholder: "٨ أحرف على الأقل",
    joining: "جاري الانضمام...",
    join: "انضم للمنظمة",
    hasAccount: "لديك حساب بالفعل؟",
    signIn: "تسجيل الدخول",
    fallbackError: "حدث خطأ. يرجى المحاولة مرة أخرى.",
  },
};

export default function InvitePage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = use(params);
  const [lang, setLang] = useState<"en" | "ar">("en");
  const c = tr[lang];
  const isAr = lang === "ar";

  const [inviteData, setInviteData] = useState<{ khatib_name: string; org_name: string; email?: string } | null>(null);
  const [inviteError, setInviteError] = useState("");
  const [loadingInvite, setLoadingInvite] = useState(true);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [existingAccount, setExistingAccount] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("jp_lang");
    if (saved === "ar") setLang("ar");
  }, []);

  useEffect(() => {
    fetch(`/api/invite/${code}`)
      .then(async (r) => {
        if (!r.ok) {
          const d = await r.json();
          setInviteError(d.error || "Invalid invite");
          return;
        }
        const d = await r.json();
        setInviteData(d);
        setName(d.khatib_name);
        if (d.email) setEmail(d.email);
      })
      .finally(() => setLoadingInvite(false));
  }, [code]);

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      const res = await fetch(`/api/invite/${code}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 401) {
          setExistingAccount(true);
          setError(isAr ? "كلمة المرور غير صحيحة" : "Incorrect password for your existing account");
        } else {
          setError(data.error || "Failed to join");
        }
        setSaving(false);
        return;
      }
      window.location.href = data.user?.onboarding_complete ? "/dashboard" : "/setup";
    } catch {
      setError(c.fallbackError);
      setSaving(false);
    }
  };

  if (loadingInvite) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <p className="text-mute text-sm">{c.loading}</p>
      </div>
    );
  }

  if (inviteError || !inviteData) {
    return (
      <div dir={isAr ? "rtl" : "ltr"} className={`min-h-screen bg-surface flex flex-col items-center justify-center px-5 ${isAr ? "font-arabic" : ""}`}>
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
            <span className="material-symbols-outlined text-red-500 text-3xl">error</span>
          </div>
          <h1 className="text-xl font-bold text-ink mb-2">{c.invalidTitle}</h1>
          <p className="text-ink/40 text-sm mb-6">{inviteError || c.invalidDesc}</p>
          <Link href="/" className="text-primary font-semibold text-sm hover:underline">{c.backHome}</Link>
        </div>
      </div>
    );
  }

  return (
    <div dir={isAr ? "rtl" : "ltr"} className={`min-h-screen bg-surface flex flex-col items-center justify-center px-5 py-10 ${isAr ? "font-arabic" : ""}`}>
      <div className="w-full max-w-[460px]">
        <div className="text-center mb-8">
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

        <div className="bg-primary/5 border border-primary/20 rounded-xl p-5 mb-6 text-center">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
            <span className="material-symbols-outlined text-primary text-2xl">group_add</span>
          </div>
          <h1 className="text-xl font-bold text-ink mb-1">{c.joinOrg(inviteData.org_name)}</h1>
          <p className="text-ink/40 text-sm">{c.youreInvited(inviteData.khatib_name, inviteData.org_name)}</p>
        </div>

        {existingAccount && (
          <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 mb-4 text-center">
            <span className="material-symbols-outlined text-primary text-xl mb-1">account_circle</span>
            <p className="text-sm text-ink/70 font-medium">
              {isAr ? "تم العثور على حسابك — أدخل كلمة المرور للانضمام" : "Account found — enter your password to join"}
            </p>
          </div>
        )}

        {!existingAccount && (
          <p className="text-ink/40 text-sm text-center mb-6">
            {isAr ? "أنشئ حسابك أو سجّل دخولك للانضمام" : "Create an account or sign in to join as a khatib."}
          </p>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleJoin} className="flex flex-col gap-5">
          {!existingAccount && (
            <div>
              <label htmlFor="invite-name" className="text-xs font-semibold text-ink/50 block mb-2">{c.name}</label>
              <input
                id="invite-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={c.namePlaceholder}
                required={!existingAccount}
                className="w-full px-4 py-3 rounded-lg border border-line bg-white text-ink placeholder:text-ink/25 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all text-sm"
              />
            </div>
          )}

          <div>
            <label htmlFor="invite-email" className="text-xs font-semibold text-ink/50 block mb-2">{c.email}</label>
            <input
              id="invite-email"
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setExistingAccount(false); setError(""); }}
              placeholder={c.emailPlaceholder}
              required
              className="w-full px-4 py-3 rounded-lg border border-line bg-white text-ink placeholder:text-ink/25 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all text-sm"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label htmlFor="invite-password" className="text-xs font-semibold text-ink/50">{c.password}</label>
              {existingAccount && (
                <Link href="/auth/forgot-password" className="text-xs text-primary/60 hover:text-primary font-semibold transition-colors">
                  {isAr ? "نسيت كلمة المرور؟" : "Forgot password?"}
                </Link>
              )}
            </div>
            <input
              id="invite-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={existingAccount ? (isAr ? "أدخل كلمة المرور الحالية" : "Enter your existing password") : c.passPlaceholder}
              required
              minLength={8}
              className="w-full px-4 py-3 rounded-lg border border-line bg-white text-ink placeholder:text-ink/25 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all text-sm"
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full py-3.5 rounded-full bg-primary text-white font-bold text-sm hover:bg-secondary shadow-md hover:shadow-lg transition-all active:scale-[0.98] disabled:opacity-50 mt-1"
          >
            {saving ? c.joining : existingAccount ? (isAr ? "تسجيل الدخول وقبول الدعوة" : "Sign in & Accept Invite") : c.join}
          </button>
        </form>
      </div>
    </div>
  );
}
