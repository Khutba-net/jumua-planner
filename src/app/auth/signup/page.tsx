"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type AccountType = "individual" | "organization" | "institution";
type Step = "account-type" | "profile";

const accountTypes = [
  {
    id: "individual" as AccountType,
    title: "Individual",
    description: "I'm a khatib planning my own Friday sermons",
    icon: "person",
  },
  {
    id: "organization" as AccountType,
    title: "Organization",
    description: "A mosque or Islamic center with multiple khatibs",
    icon: "mosque",
  },
  {
    id: "institution" as AccountType,
    title: "Institution",
    description: "An Islamic council or body managing multiple mosques",
    icon: "account_balance",
  },
];

export default function SignupPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("account-type");
  const [selectedType, setSelectedType] = useState<AccountType | null>(null);
  const [loading, setLoading] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [orgName, setOrgName] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");

  const handleContinue = () => {
    if (selectedType) setStep("profile");
  };

  const [error, setError] = useState("");

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          password,
          account_type: selectedType,
          org_name: orgName,
          city,
          country,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Signup failed");
        setLoading(false);
        return;
      }
      window.location.href = "/dashboard";
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  const inputClass =
    "w-full px-4 py-3 border border-[#bcc9ca]/40 bg-white/70 text-[#1a1c1e] placeholder:text-[#bcc9ca] focus:outline-none focus:border-[#00666d] focus:ring-2 focus:ring-[#00666d]/10 transition-all text-[14px]";

  return (
    <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-[520px]">
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

        {step === "account-type" && (
          <div>
            <h1
              className="text-3xl font-bold text-[#00666d] text-center mb-2 italic"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              Create your account
            </h1>
            <p className="text-[#6d797a] text-center mb-8 text-sm">
              Choose how you'll use JumuaPlanner
            </p>

            <div className="flex flex-col gap-3 mb-8">
              {accountTypes.map((type) => (
                <button
                  key={type.id}
                  onClick={() => setSelectedType(type.id)}
                  className={`flex items-start gap-4 p-5 border-2 transition-all text-left ${
                    selectedType === type.id
                      ? "border-[#00666d] bg-[#00666d]/5 shadow-md"
                      : "border-[#bcc9ca]/30 bg-white/70 hover:border-[#00666d]/30"
                  }`}
                >
                  <div
                    className={`w-12 h-12 flex items-center justify-center shrink-0 ${
                      selectedType === type.id
                        ? "bg-[#00666d] text-white"
                        : "bg-[#f9f9fc] text-[#6d797a]"
                    }`}
                  >
                    <span className="material-symbols-outlined">{type.icon}</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-[#1a1c1e] text-base">{type.title}</h3>
                    <p className="text-[#6d797a] text-sm mt-0.5">{type.description}</p>
                  </div>
                  <div className="ml-auto shrink-0 mt-1">
                    <div
                      className={`w-5 h-5 border-2 flex items-center justify-center ${
                        selectedType === type.id
                          ? "border-[#00666d] bg-[#00666d]"
                          : "border-[#bcc9ca]"
                      }`}
                    >
                      {selectedType === type.id && (
                        <span className="material-symbols-outlined text-white text-sm">check</span>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>

            <button
              onClick={handleContinue}
              disabled={!selectedType}
              className={`w-full py-3.5 font-bold text-[14px] transition-all ${
                selectedType
                  ? "bg-[#00666d] text-white hover:bg-[#004a50] shadow-lg hover:shadow-xl active:scale-[0.98]"
                  : "bg-[#bcc9ca]/30 text-[#bcc9ca] cursor-not-allowed"
              }`}
            >
              Continue
            </button>

            <div className="flex items-center gap-3 my-6">
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

            <p className="text-center text-[13px] text-[#6d797a] mt-8">
              Already have an account?{" "}
              <Link href="/auth/login" className="text-[#00666d] font-bold hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        )}

        {step === "profile" && (
          <div>
            <button
              onClick={() => setStep("account-type")}
              className="flex items-center gap-1 text-[#6d797a] hover:text-[#00666d] text-sm mb-6 transition-colors"
            >
              <span className="material-symbols-outlined text-lg">arrow_back</span>
              Back
            </button>

            <h1
              className="text-3xl font-bold text-[#00666d] mb-2 italic"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              {selectedType === "individual"
                ? "Set up your profile"
                : selectedType === "organization"
                ? "Set up your organization"
                : "Set up your institution"}
            </h1>
            <p className="text-[#6d797a] mb-8 text-sm">
              {selectedType === "individual"
                ? "Tell us about yourself"
                : selectedType === "organization"
                ? "Tell us about your mosque or center"
                : "Tell us about your institution"}
            </p>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 mb-4">
                {error}
              </div>
            )}

            <form onSubmit={handleSignup} className="flex flex-col gap-4">
              <div>
                <label className="text-[10px] font-bold tracking-[2px] text-[#C4A35A] uppercase block mb-1.5">
                  {selectedType === "individual" ? "Full Name" : "Your Name"}
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your full name"
                  required
                  className={inputClass}
                />
              </div>

              {selectedType !== "individual" && (
                <div>
                  <label className="text-[10px] font-bold tracking-[2px] text-[#C4A35A] uppercase block mb-1.5">
                    {selectedType === "organization" ? "Mosque / Organization" : "Institution Name"}
                  </label>
                  <input
                    type="text"
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    placeholder={
                      selectedType === "organization" ? "e.g. Masjid Al-Noor" : "e.g. Islamic Council of Calgary"
                    }
                    required
                    className={inputClass}
                  />
                </div>
              )}

              {selectedType !== "individual" && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold tracking-[2px] text-[#C4A35A] uppercase block mb-1.5">
                      City
                    </label>
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="City"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold tracking-[2px] text-[#C4A35A] uppercase block mb-1.5">
                      Country
                    </label>
                    <input
                      type="text"
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      placeholder="Country"
                      className={inputClass}
                    />
                  </div>
                </div>
              )}

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
                  className={inputClass}
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
                  placeholder="At least 8 characters"
                  required
                  minLength={8}
                  className={inputClass}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-[#00666d] text-white font-bold text-[14px] hover:bg-[#004a50] shadow-lg hover:shadow-xl transition-all active:scale-[0.98] disabled:opacity-50 mt-2"
              >
                {loading ? "Creating account..." : "Create Account"}
              </button>
            </form>

            <p className="text-center text-[13px] text-[#6d797a] mt-8">
              Already have an account?{" "}
              <Link href="/auth/login" className="text-[#00666d] font-bold hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
