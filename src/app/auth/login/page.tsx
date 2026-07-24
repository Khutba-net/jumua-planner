"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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
      window.location.href = "/dashboard";
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-[440px]">
        {/* Logo */}
        <div className="text-center mb-10">
          <Link href="/" className="inline-flex items-center gap-2.5 text-[#00666d]">
            <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
              <rect x="1" y="1" width="13" height="13" rx="2" fill="#00666d" />
              <rect x="18" y="1" width="13" height="13" rx="2" fill="#00818a" />
              <rect x="1" y="18" width="13" height="13" rx="2" fill="#C4A35A" />
              <rect x="18" y="18" width="13" height="13" rx="2" fill="#00666d" opacity="0.5" />
            </svg>
            <span className="text-2xl font-bold" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              JumuaPlanner
            </span>
          </Link>
        </div>

        <h1
          className="text-3xl font-bold text-[#00666d] text-center mb-2 italic"
          style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
        >
          Welcome back
        </h1>
        <p className="text-[#6d797a] text-center mb-8 text-sm">
          Sign in to continue planning your khutbahs
        </p>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <div>
            <label className="text-[10px] font-bold tracking-[2px] text-[#C4A35A] uppercase block mb-1.5">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className="w-full px-4 py-3 border border-[#bcc9ca]/40 bg-white/70 text-[#1a1c1e] placeholder:text-[#bcc9ca] focus:outline-none focus:border-[#00666d] focus:ring-2 focus:ring-[#00666d]/10 transition-all text-[14px]"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold tracking-[2px] text-[#C4A35A] uppercase block mb-1.5">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
              className="w-full px-4 py-3 border border-[#bcc9ca]/40 bg-white/70 text-[#1a1c1e] placeholder:text-[#bcc9ca] focus:outline-none focus:border-[#00666d] focus:ring-2 focus:ring-[#00666d]/10 transition-all text-[14px]"
            />
          </div>

          <div className="flex justify-end">
            <button type="button" className="text-[12px] text-[#00666d] font-semibold hover:underline">
              Forgot password?
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-[#00666d] text-white font-bold text-[14px] hover:bg-[#004a50] shadow-lg hover:shadow-xl transition-all active:scale-[0.98] disabled:opacity-50"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>

          <div className="flex items-center gap-3 my-2">
            <div className="flex-1 h-px bg-[#bcc9ca]/30" />
            <span className="text-[10px] text-[#bcc9ca] font-bold uppercase tracking-wider">or</span>
            <div className="flex-1 h-px bg-[#bcc9ca]/30" />
          </div>

          <button
            type="button"
            className="w-full py-3.5 border border-[#bcc9ca]/40 bg-white/70 text-[#3d494a] font-semibold text-[14px] hover:bg-white transition-all flex items-center justify-center gap-3"
          >
            <svg width="18" height="18" viewBox="0 0 18 18">
              <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
              <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
              <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
              <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </button>
        </form>

        <p className="text-center text-[13px] text-[#6d797a] mt-8">
          Don&apos;t have an account?{" "}
          <Link href="/auth/signup" className="text-[#00666d] font-bold hover:underline">
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}
