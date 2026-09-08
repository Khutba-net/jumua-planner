"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import PasswordStrength, { isPasswordValid } from "@/app/components/PasswordStrength";

const tr = {
  en: {
    title: "Set new password",
    subtitle: "Enter your new password below",
    password: "New Password",
    confirm: "Confirm Password",
    passPlaceholder: "At least 8 characters",
    confirmPlaceholder: "Re-enter your password",
    submit: "Reset Password",
    resetting: "Resetting...",
    mismatch: "Passwords do not match",
    tooShort: "Password must be at least 8 characters",
    successTitle: "Password reset!",
    successMsg: "Your password has been changed. You can now sign in.",
    signIn: "Sign In",
    invalidTitle: "Invalid reset link",
    invalidMsg: "This reset link is missing or invalid. Please request a new one.",
    requestNew: "Request New Link",
    fallbackError: "Something went wrong. Please try again.",
  },
  ar: {
    title: "تعيين كلمة مرور جديدة",
    subtitle: "أدخل كلمة المرور الجديدة أدناه",
    password: "كلمة المرور الجديدة",
    confirm: "تأكيد كلمة المرور",
    passPlaceholder: "8 أحرف على الأقل",
    confirmPlaceholder: "أعد إدخال كلمة المرور",
    submit: "إعادة تعيين كلمة المرور",
    resetting: "جاري إعادة التعيين...",
    mismatch: "كلمتا المرور غير متطابقتين",
    tooShort: "يجب أن تكون كلمة المرور 8 أحرف على الأقل",
    successTitle: "تم إعادة تعيين كلمة المرور!",
    successMsg: "تم تغيير كلمة المرور. يمكنك الآن تسجيل الدخول.",
    signIn: "تسجيل الدخول",
    invalidTitle: "رابط غير صالح",
    invalidMsg: "رابط إعادة التعيين مفقود أو غير صالح. يرجى طلب رابط جديد.",
    requestNew: "طلب رابط جديد",
    fallbackError: "حدث خطأ. يرجى المحاولة مرة أخرى.",
  },
};

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  );
}

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const [lang, setLang] = useState<"en" | "ar">("en");
  const c = tr[lang];
  const isAr = lang === "ar";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("jp_lang");
    if (saved === "ar") setLang("ar");
  }, []);

  if (!token) {
    return (
      <div dir={isAr ? "rtl" : "ltr"} className={`min-h-screen bg-surface flex flex-col items-center justify-center px-5 py-10 ${isAr ? "font-arabic" : ""}`}>
        <div className="w-full max-w-[460px] text-center">
          <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-5">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#c0392b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-ink mb-2">{c.invalidTitle}</h1>
          <p className="text-ink/50 text-sm mb-6">{c.invalidMsg}</p>
          <Link href="/auth/forgot-password" className="text-primary font-semibold text-sm hover:underline">
            {c.requestNew}
          </Link>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!isPasswordValid(password)) {
      setError(c.tooShort);
      return;
    }
    if (password !== confirmPassword) {
      setError(c.mismatch);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || c.fallbackError);
        setLoading(false);
        return;
      }
      setSuccess(true);
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

        {success ? (
          <div className="text-center">
            <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-5">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#00666d" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-ink mb-2">{c.successTitle}</h1>
            <p className="text-ink/50 text-sm mb-6">{c.successMsg}</p>
            <Link href="/auth/login" className="inline-block py-3 px-8 rounded-full bg-primary text-white font-bold text-sm hover:bg-secondary shadow-md transition-all">
              {c.signIn}
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

              <div>
                <label className="text-xs font-semibold text-ink/50 block mb-2">{c.confirm}</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder={c.confirmPlaceholder}
                  required
                  minLength={8}
                  className="w-full px-4 py-3 rounded-lg border border-line bg-white text-ink placeholder:text-ink/25 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all text-sm"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-full bg-primary text-white font-bold text-sm hover:bg-secondary shadow-md hover:shadow-lg transition-all active:scale-[0.98] disabled:opacity-50 mt-1"
              >
                {loading ? c.resetting : c.submit}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
