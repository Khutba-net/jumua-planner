"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

type AccountType = "individual" | "organization" | "institution";
type Step = "plan" | "details" | "year";

const accountTypes = [
  {
    id: "individual" as AccountType,
    title: "Individual",
    description: "I'm a khatib planning my own Friday sermons",
    icon: "person",
    features: ["Personal 52-sermon plan", "Sermon editor & notes", "Progress tracking"],
  },
  {
    id: "organization" as AccountType,
    title: "Organization",
    description: "A mosque or Islamic center with multiple khatibs",
    icon: "mosque",
    features: ["Manage multiple khatibs", "Shared theme planning", "Org-wide reports"],
  },
  {
    id: "institution" as AccountType,
    title: "Institution",
    description: "An Islamic council or body managing multiple mosques",
    icon: "account_balance",
    features: ["Multi-mosque oversight", "Standardized themes", "Regional analytics"],
  },
];

export default function SetupPage() {
  const [step, setStep] = useState<Step>("plan");
  const [selectedType, setSelectedType] = useState<AccountType | null>(null);
  const [orgName, setOrgName] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");
  const [planningYear, setPlanningYear] = useState(new Date().getFullYear());
  const [saving, setSaving] = useState(false);
  const [userName, setUserName] = useState("");

  useEffect(() => {
    fetch("/api/setup")
      .then((r) => {
        if (r.status === 401) { window.location.href = "/auth/login"; return null; }
        return r.json();
      })
      .then((d) => {
        if (!d) return;
        if (d.onboarding_complete) { window.location.href = "/dashboard"; return; }
        setUserName(d.name || "");
      });
  }, []);

  const currentYear = new Date().getFullYear();
  const years = [currentYear, currentYear + 1];

  const handleFinish = async () => {
    if (!selectedType) return;
    setSaving(true);

    try {
      const res = await fetch("/api/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          account_type: selectedType,
          org_name: orgName,
          city,
          country,
          planning_year: planningYear,
        }),
      });
      if (res.ok) {
        window.location.href = "/dashboard";
      }
    } catch {
      setSaving(false);
    }
  };

  const stepNumber = step === "plan" ? 1 : step === "details" ? 2 : 3;

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      {/* Header */}
      <div className="border-b border-line bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-5 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <svg width="22" height="22" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="1" y="1" width="11" height="11" rx="2" fill="#00666d" opacity="0.9"/>
              <rect x="16" y="1" width="11" height="11" rx="2" fill="#00666d" opacity="0.6"/>
              <rect x="1" y="16" width="11" height="11" rx="2" fill="#00666d" opacity="0.6"/>
              <rect x="16" y="16" width="11" height="11" rx="2" fill="#C4A35A" opacity="0.8"/>
            </svg>
            <span className="text-lg font-bold text-primary tracking-tight">JumuaPlanner</span>
          </Link>

          {/* Step indicator */}
          <div className="flex items-center gap-2">
            {[1, 2, 3].map((n) => (
              <div key={n} className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  n < stepNumber ? "bg-primary text-white"
                  : n === stepNumber ? "bg-primary text-white ring-4 ring-primary/15"
                  : "bg-line text-mute"
                }`}>
                  {n < stepNumber ? (
                    <span className="material-symbols-outlined text-sm">check</span>
                  ) : n}
                </div>
                {n < 3 && <div className={`w-8 h-0.5 rounded-full transition-colors ${n < stepNumber ? "bg-primary" : "bg-line"}`} />}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex items-start justify-center px-5 py-8 md:py-14">
        <div className="w-full max-w-2xl">

          {/* ── Step 1: Choose Plan ── */}
          {step === "plan" && (
            <div>
              <div className="text-center mb-8 md:mb-10">
                <p className="text-accent-gold text-[10px] font-bold tracking-[2.5px] uppercase mb-2">Step 1 of 3</p>
                <h1 className="text-2xl md:text-3xl font-bold text-ink tracking-tight mb-2">
                  {userName ? `Welcome, ${userName}` : "Choose your plan"}
                </h1>
                <p className="text-ink/40 text-sm">
                  How will you use JumuaPlanner?
                </p>
              </div>

              <div className="flex flex-col gap-3 mb-8">
                {accountTypes.map((type) => (
                  <button
                    key={type.id}
                    onClick={() => setSelectedType(type.id)}
                    className={`flex gap-4 p-5 md:p-6 rounded-xl border transition-all text-left ${
                      selectedType === type.id
                        ? "border-primary bg-primary/5 shadow-sm"
                        : "border-line bg-white hover:border-primary/30"
                    }`}
                  >
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                      selectedType === type.id ? "bg-primary text-white" : "bg-surface text-mute"
                    }`}>
                      <span className="material-symbols-outlined text-2xl">{type.icon}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="font-bold text-ink text-[15px]">{type.title}</h3>
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors shrink-0 ${
                          selectedType === type.id ? "border-primary bg-primary" : "border-ink/20"
                        }`}>
                          {selectedType === type.id && (
                            <span className="material-symbols-outlined text-white text-xs">check</span>
                          )}
                        </div>
                      </div>
                      <p className="text-ink/40 text-sm leading-snug mb-2.5">{type.description}</p>
                      <div className="flex flex-wrap gap-x-4 gap-y-1">
                        {type.features.map((f) => (
                          <span key={f} className="text-[11px] text-mute flex items-center gap-1">
                            <span className="material-symbols-outlined text-primary/50 text-xs">check_circle</span>
                            {f}
                          </span>
                        ))}
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              <button
                onClick={() => { if (selectedType) setStep("details"); }}
                disabled={!selectedType}
                className={`w-full py-3.5 rounded-full font-bold text-sm transition-all ${
                  selectedType
                    ? "bg-primary text-white hover:bg-secondary shadow-md hover:shadow-lg active:scale-[0.98]"
                    : "bg-ink/10 text-ink/25 cursor-not-allowed"
                }`}
              >
                Continue
              </button>
            </div>
          )}

          {/* ── Step 2: Details ── */}
          {step === "details" && (
            <div>
              <button
                onClick={() => setStep("plan")}
                className="flex items-center gap-1 text-ink/40 hover:text-primary text-sm mb-6 transition-colors"
              >
                <span className="material-symbols-outlined text-lg">arrow_back</span>
                Back
              </button>

              <div className="mb-8">
                <p className="text-accent-gold text-[10px] font-bold tracking-[2.5px] uppercase mb-2">Step 2 of 3</p>
                <h1 className="text-2xl md:text-3xl font-bold text-ink tracking-tight mb-2">
                  {selectedType === "individual"
                    ? "You're all set"
                    : selectedType === "organization"
                    ? "Set up your organization"
                    : "Set up your institution"}
                </h1>
                <p className="text-ink/40 text-sm">
                  {selectedType === "individual"
                    ? "Your personal plan is ready — just one more step"
                    : selectedType === "organization"
                    ? "Tell us about your mosque or center"
                    : "Tell us about your institution"}
                </p>
              </div>

              {selectedType === "individual" ? (
                <div className="bg-white border border-line rounded-xl p-6 mb-8">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary text-lg font-bold">
                      {userName?.[0] ?? "?"}
                    </div>
                    <div>
                      <p className="font-bold text-ink">{userName}</p>
                      <p className="text-sm text-mute">Individual Khatib</p>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-line flex flex-col gap-2">
                    <div className="flex items-center gap-2 text-sm text-mute">
                      <span className="material-symbols-outlined text-primary/50 text-base">check_circle</span>
                      Personal 52-sermon annual plan
                    </div>
                    <div className="flex items-center gap-2 text-sm text-mute">
                      <span className="material-symbols-outlined text-primary/50 text-base">check_circle</span>
                      Sermon editor with notes & references
                    </div>
                    <div className="flex items-center gap-2 text-sm text-mute">
                      <span className="material-symbols-outlined text-primary/50 text-base">check_circle</span>
                      Progress tracking & reports
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-5 mb-8">
                  <div>
                    <label className="text-xs font-semibold text-ink/50 block mb-2">
                      {selectedType === "organization" ? "Mosque / Organization name" : "Institution name"}
                    </label>
                    <input
                      type="text"
                      value={orgName}
                      onChange={(e) => setOrgName(e.target.value)}
                      placeholder={selectedType === "organization" ? "e.g. Masjid Al-Noor" : "e.g. Islamic Council of Calgary"}
                      autoFocus
                      className="w-full px-4 py-3 rounded-lg border border-line bg-white text-ink placeholder:text-ink/25 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all text-sm"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-ink/50 block mb-2">City</label>
                      <input
                        type="text"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        placeholder="City"
                        className="w-full px-4 py-3 rounded-lg border border-line bg-white text-ink placeholder:text-ink/25 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-ink/50 block mb-2">Country</label>
                      <input
                        type="text"
                        value={country}
                        onChange={(e) => setCountry(e.target.value)}
                        placeholder="Country"
                        className="w-full px-4 py-3 rounded-lg border border-line bg-white text-ink placeholder:text-ink/25 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all text-sm"
                      />
                    </div>
                  </div>
                </div>
              )}

              <button
                onClick={() => setStep("year")}
                disabled={selectedType !== "individual" && !orgName.trim()}
                className={`w-full py-3.5 rounded-full font-bold text-sm transition-all ${
                  selectedType === "individual" || orgName.trim()
                    ? "bg-primary text-white hover:bg-secondary shadow-md hover:shadow-lg active:scale-[0.98]"
                    : "bg-ink/10 text-ink/25 cursor-not-allowed"
                }`}
              >
                Continue
              </button>
            </div>
          )}

          {/* ── Step 3: Planning Year ── */}
          {step === "year" && (
            <div>
              <button
                onClick={() => setStep("details")}
                className="flex items-center gap-1 text-ink/40 hover:text-primary text-sm mb-6 transition-colors"
              >
                <span className="material-symbols-outlined text-lg">arrow_back</span>
                Back
              </button>

              <div className="mb-8">
                <p className="text-accent-gold text-[10px] font-bold tracking-[2.5px] uppercase mb-2">Step 3 of 3</p>
                <h1 className="text-2xl md:text-3xl font-bold text-ink tracking-tight mb-2">
                  Pick your planning year
                </h1>
                <p className="text-ink/40 text-sm">
                  Which year are you planning sermons for? You can always add more years later.
                </p>
              </div>

              <div className="flex flex-col gap-3 mb-8">
                {years.map((y) => (
                  <button
                    key={y}
                    onClick={() => setPlanningYear(y)}
                    className={`flex items-center gap-4 p-5 rounded-xl border transition-all text-left ${
                      planningYear === y
                        ? "border-primary bg-primary/5 shadow-sm"
                        : "border-line bg-white hover:border-primary/30"
                    }`}
                  >
                    <div className={`w-14 h-14 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                      planningYear === y ? "bg-primary text-white" : "bg-surface text-mute"
                    }`}>
                      <span className="text-xl font-extrabold tabular-nums">{y}</span>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-ink text-[15px]">
                        {y === currentYear ? `${y} — This year` : `${y} — Next year`}
                      </h3>
                      <p className="text-ink/40 text-sm mt-0.5">
                        {y === currentYear
                          ? "Start planning from where you are now"
                          : "Plan ahead for the entire year"}
                      </p>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                      planningYear === y ? "border-primary bg-primary" : "border-ink/20"
                    }`}>
                      {planningYear === y && (
                        <span className="material-symbols-outlined text-white text-xs">check</span>
                      )}
                    </div>
                  </button>
                ))}
              </div>

              <button
                onClick={handleFinish}
                disabled={saving}
                className="w-full py-4 rounded-full bg-primary text-white font-bold text-sm hover:bg-secondary shadow-md hover:shadow-lg transition-all active:scale-[0.98] disabled:opacity-50"
              >
                {saving ? (
                  "Setting up your plan..."
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    Start Planning
                    <span className="material-symbols-outlined text-lg">arrow_forward</span>
                  </span>
                )}
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
