"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import type { ReactNode } from "react";

type AccountType = "individual" | "organization" | "institution";
type Step = "plan" | "details" | "year";

const tr = {
  en: {
    step1: "Step 1 of 3",
    step2: "Step 2 of 3",
    step3: "Step 3 of 3",
    welcomeUser: (name: string) => `Welcome, ${name}`,
    choosePlan: "Choose your plan",
    howUse: "How will you use JumuaPlanner?",
    continue: "Continue",
    back: "Back",
    individual: "Individual",
    indDesc: "I'm a khatib planning my own Friday sermons",
    indF1: "Personal 52-sermon plan",
    indF2: "Sermon editor & notes",
    indF3: "Progress tracking",
    organization: "Organization",
    orgDesc: "A mosque or Islamic center with multiple khatibs",
    orgF1: "Manage multiple khatibs",
    orgF2: "Shared theme planning",
    orgF3: "Org-wide reports",
    institution: "Institution",
    instDesc: "An Islamic council or body managing multiple mosques",
    instF1: "Multi-mosque oversight",
    instF2: "Standardized themes",
    instF3: "Regional analytics",
    indReady: "You're all set",
    indReadySub: "Your personal plan is ready — just one more step",
    orgSetup: "Set up your organization",
    orgSetupSub: "Tell us about your mosque or center",
    instSetup: "Set up your institution",
    instSetupSub: "Tell us about your institution",
    indKhatib: "Individual Khatib",
    indPlan: "Personal 52-sermon annual plan",
    indEditor: "Sermon editor with notes & references",
    indProgress: "Progress tracking & reports",
    orgNameLabel: "Mosque / Organization name",
    orgNamePlaceholder: "e.g. Masjid Al-Noor",
    instNameLabel: "Institution name",
    instNamePlaceholder: "e.g. Islamic Council of Calgary",
    city: "City",
    country: "Country",
    yourKhatibs: "Your Khatibs",
    khatibsDesc: "Add the names of your khatibs. You can invite them later.",
    khatibName: "Khatib name",
    khatibPlaceholder: (n: number) => `Khatib ${n}`,
    addKhatib: "Add another khatib",
    maxKhatibs: "Maximum 10 khatibs",
    yourMosques: "Your Mosques",
    mosquesDesc: "Add the mosques under your institution. You can add khatibs later.",
    mosqueName: "Mosque name",
    mosquePlaceholder: (n: number) => `Mosque ${n}`,
    mosqueCity: "City",
    addMosque: "Add another mosque",
    maxMosques: "Maximum 20 mosques",
    pickYear: "Pick your planning year",
    pickYearSub: "Which year are you planning sermons for? You can always add more years later.",
    thisYear: (y: number) => `${y} — This year`,
    nextYear: (y: number) => `${y} — Next year`,
    thisYearSub: "Start planning from where you are now",
    nextYearSub: "Plan ahead for the entire year",
    settingUp: "Setting up your plan...",
    startPlanning: "Start Planning",
  },
  ar: {
    step1: "الخطوة ١ من ٣",
    step2: "الخطوة ٢ من ٣",
    step3: "الخطوة ٣ من ٣",
    welcomeUser: (name: string) => `مرحباً، ${name}`,
    choosePlan: "اختر خطتك",
    howUse: "كيف ستستخدم جمعة بلانر؟",
    continue: "متابعة",
    back: "رجوع",
    individual: "فردي",
    indDesc: "أنا خطيب أخطط لخطب الجمعة بنفسي",
    indF1: "خطة ٥٢ خطبة شخصية",
    indF2: "محرر خطب وملاحظات",
    indF3: "تتبع التقدم",
    organization: "منظمة",
    orgDesc: "مسجد أو مركز إسلامي مع خطباء متعددين",
    orgF1: "إدارة خطباء متعددين",
    orgF2: "تخطيط مواضيع مشترك",
    orgF3: "تقارير على مستوى المنظمة",
    institution: "أوقاف",
    instDesc: "مجلس إسلامي أو هيئة تدير مساجد متعددة",
    instF1: "إشراف على مساجد متعددة",
    instF2: "مواضيع موحدة",
    instF3: "تحليلات إقليمية",
    indReady: "أنت جاهز",
    indReadySub: "خطتك الشخصية جاهزة — خطوة أخيرة فقط",
    orgSetup: "إعداد منظمتك",
    orgSetupSub: "أخبرنا عن مسجدك أو مركزك",
    instSetup: "إعداد مؤسستك",
    instSetupSub: "أخبرنا عن مؤسستك",
    indKhatib: "خطيب فردي",
    indPlan: "خطة سنوية شخصية لـ ٥٢ خطبة",
    indEditor: "محرر خطب مع ملاحظات ومراجع",
    indProgress: "تتبع التقدم والتقارير",
    orgNameLabel: "اسم المسجد / المنظمة",
    orgNamePlaceholder: "مثال: مسجد النور",
    instNameLabel: "اسم المؤسسة",
    instNamePlaceholder: "مثال: المجلس الإسلامي",
    city: "المدينة",
    country: "الدولة",
    yourKhatibs: "الخطباء",
    khatibsDesc: "أضف أسماء الخطباء. يمكنك دعوتهم لاحقاً.",
    khatibName: "اسم الخطيب",
    khatibPlaceholder: (n: number) => `الخطيب ${n}`,
    addKhatib: "إضافة خطيب آخر",
    maxKhatibs: "الحد الأقصى ١٠ خطباء",
    yourMosques: "المساجد",
    mosquesDesc: "أضف المساجد التابعة لمؤسستك. يمكنك إضافة الخطباء لاحقاً.",
    mosqueName: "اسم المسجد",
    mosquePlaceholder: (n: number) => `المسجد ${n}`,
    mosqueCity: "المدينة",
    addMosque: "إضافة مسجد آخر",
    maxMosques: "الحد الأقصى ٢٠ مسجداً",
    pickYear: "اختر سنة التخطيط",
    pickYearSub: "لأي سنة تخطط للخطب؟ يمكنك إضافة سنوات أخرى لاحقاً.",
    thisYear: (y: number) => `${y} — هذا العام`,
    nextYear: (y: number) => `${y} — العام القادم`,
    thisYearSub: "ابدأ التخطيط من حيث أنت الآن",
    nextYearSub: "خطط مسبقاً للعام بأكمله",
    settingUp: "جاري إعداد خطتك...",
    startPlanning: "ابدأ التخطيط",
  },
} as const;

export default function SetupPage() {
  const [lang, setLang] = useState<"en" | "ar">("en");
  const c = tr[lang];
  const isAr = lang === "ar";

  const [step, setStep] = useState<Step>("plan");
  const [selectedType, setSelectedType] = useState<AccountType | null>(null);
  const [orgName, setOrgName] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");
  const [khatibNames, setKhatibNames] = useState<string[]>([""]);
  const [mosqueEntries, setMosqueEntries] = useState<{ name: string; city: string }[]>([{ name: "", city: "" }]);
  const [planningYear, setPlanningYear] = useState(new Date().getFullYear());
  const [saving, setSaving] = useState(false);
  const [userName, setUserName] = useState("");
  const [isInvitedKhatib, setIsInvitedKhatib] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("jp_lang");
    if (saved === "ar") setLang("ar");
  }, []);

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
        if (d.organization_id && d.role === "khatib") {
          setIsInvitedKhatib(true);
          setSelectedType("organization");
          setStep("year");
        }
      });
  }, []);

  const accountTypes = [
    {
      id: "individual" as AccountType,
      title: c.individual,
      description: c.indDesc,
      icon: "person",
      features: [c.indF1, c.indF2, c.indF3],
    },
    {
      id: "organization" as AccountType,
      title: c.organization,
      description: c.orgDesc,
      icon: "mosque",
      features: [c.orgF1, c.orgF2, c.orgF3],
    },
    {
      id: "institution" as AccountType,
      title: c.institution,
      description: c.instDesc,
      icon: "account_balance",
      features: [c.instF1, c.instF2, c.instF3],
    },
  ];

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
          khatib_names: selectedType === "organization" ? khatibNames.filter((n) => n.trim()) : [],
          mosque_entries: selectedType === "institution" ? mosqueEntries.filter((m) => m.name.trim()) : [],
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
  const backArrow = isAr ? "arrow_forward" : "arrow_back";

  return (
    <div dir={isAr ? "rtl" : "ltr"} className={`min-h-screen bg-surface flex flex-col ${isAr ? "font-arabic" : ""}`}>
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

          <div className="flex items-center gap-3">
            <button
              onClick={() => { const next = isAr ? "en" : "ar"; setLang(next); localStorage.setItem("jp_lang", next); }}
              className="text-xs text-primary/60 hover:text-primary font-semibold transition-colors"
            >
              {isAr ? "English" : "العربية"}
            </button>

            {/* Step indicator */}
            <div className="flex items-center gap-2" dir="ltr">
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
      </div>

      {/* Content */}
      <div className="flex-1 flex items-start justify-center px-5 py-8 md:py-14">
        <div className="w-full max-w-2xl">

          {/* Step 1: Choose Plan */}
          {step === "plan" && (
            <div>
              <div className="text-center mb-8 md:mb-10">
                <p className="text-accent-gold text-[10px] font-bold tracking-[2.5px] uppercase mb-2">{c.step1}</p>
                <h1 className="text-2xl md:text-3xl font-bold text-ink tracking-tight mb-2">
                  {userName ? c.welcomeUser(userName) : c.choosePlan}
                </h1>
                <p className="text-ink/40 text-sm">
                  {c.howUse}
                </p>
              </div>

              <div className="flex flex-col gap-3 mb-8">
                {accountTypes.map((type) => (
                  <button
                    key={type.id}
                    onClick={() => setSelectedType(type.id)}
                    className={`flex gap-4 p-5 md:p-6 rounded-xl border transition-all text-start ${
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
                {c.continue}
              </button>
            </div>
          )}

          {/* Step 2: Details */}
          {step === "details" && (
            <div>
              <button
                onClick={() => setStep("plan")}
                className="flex items-center gap-1 text-ink/40 hover:text-primary text-sm mb-6 transition-colors"
              >
                <span className="material-symbols-outlined text-lg">{backArrow}</span>
                {c.back}
              </button>

              <div className="mb-8">
                <p className="text-accent-gold text-[10px] font-bold tracking-[2.5px] uppercase mb-2">{c.step2}</p>
                <h1 className="text-2xl md:text-3xl font-bold text-ink tracking-tight mb-2">
                  {selectedType === "individual"
                    ? c.indReady
                    : selectedType === "organization"
                    ? c.orgSetup
                    : c.instSetup}
                </h1>
                <p className="text-ink/40 text-sm">
                  {selectedType === "individual"
                    ? c.indReadySub
                    : selectedType === "organization"
                    ? c.orgSetupSub
                    : c.instSetupSub}
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
                      <p className="text-sm text-mute">{c.indKhatib}</p>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-line flex flex-col gap-2">
                    <div className="flex items-center gap-2 text-sm text-mute">
                      <span className="material-symbols-outlined text-primary/50 text-base">check_circle</span>
                      {c.indPlan}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-mute">
                      <span className="material-symbols-outlined text-primary/50 text-base">check_circle</span>
                      {c.indEditor}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-mute">
                      <span className="material-symbols-outlined text-primary/50 text-base">check_circle</span>
                      {c.indProgress}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-5 mb-8">
                  <div>
                    <label className="text-xs font-semibold text-ink/50 block mb-2">
                      {selectedType === "organization" ? c.orgNameLabel : c.instNameLabel}
                    </label>
                    <input
                      type="text"
                      value={orgName}
                      onChange={(e) => setOrgName(e.target.value)}
                      placeholder={selectedType === "organization" ? c.orgNamePlaceholder : c.instNamePlaceholder}
                      autoFocus
                      className="w-full px-4 py-3 rounded-lg border border-line bg-white text-ink placeholder:text-ink/25 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all text-sm"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-ink/50 block mb-2">{c.city}</label>
                      <input
                        type="text"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        placeholder={c.city}
                        className="w-full px-4 py-3 rounded-lg border border-line bg-white text-ink placeholder:text-ink/25 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-ink/50 block mb-2">{c.country}</label>
                      <input
                        type="text"
                        value={country}
                        onChange={(e) => setCountry(e.target.value)}
                        placeholder={c.country}
                        className="w-full px-4 py-3 rounded-lg border border-line bg-white text-ink placeholder:text-ink/25 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all text-sm"
                      />
                    </div>
                  </div>

                  {/* Khatib names (organization) or Mosques (institution) */}
                  {selectedType === "organization" ? (
                  <div className="pt-2">
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-semibold text-ink/50">{c.yourKhatibs}</label>
                      <span className="text-[10px] text-mute">{khatibNames.length}/10</span>
                    </div>
                    <p className="text-xs text-ink/30 mb-3">{c.khatibsDesc}</p>
                    <div className="flex flex-col gap-2">
                      {khatibNames.map((name, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <input
                            type="text"
                            value={name}
                            onChange={(e) => {
                              const updated = [...khatibNames];
                              updated[i] = e.target.value;
                              setKhatibNames(updated);
                            }}
                            placeholder={c.khatibPlaceholder(i + 1)}
                            className="flex-1 px-4 py-2.5 rounded-lg border border-line bg-white text-ink placeholder:text-ink/25 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all text-sm"
                          />
                          {khatibNames.length > 1 && (
                            <button
                              type="button"
                              onClick={() => setKhatibNames(khatibNames.filter((_, j) => j !== i))}
                              className="w-8 h-8 rounded-lg flex items-center justify-center text-ink/25 hover:text-red-500 hover:bg-red-50 transition-colors"
                            >
                              <span className="material-symbols-outlined text-lg">close</span>
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                    {khatibNames.length < 10 ? (
                      <button
                        type="button"
                        onClick={() => setKhatibNames([...khatibNames, ""])}
                        className="flex items-center gap-1.5 text-sm text-primary font-semibold mt-3 hover:text-secondary transition-colors"
                      >
                        <span className="material-symbols-outlined text-base">add_circle</span>
                        {c.addKhatib}
                      </button>
                    ) : (
                      <p className="text-xs text-mute mt-2">{c.maxKhatibs}</p>
                    )}
                  </div>
                  ) : (
                  <div className="pt-2">
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-semibold text-ink/50">{c.yourMosques}</label>
                      <span className="text-[10px] text-mute">{mosqueEntries.length}/20</span>
                    </div>
                    <p className="text-xs text-ink/30 mb-3">{c.mosquesDesc}</p>
                    <div className="flex flex-col gap-2">
                      {mosqueEntries.map((entry, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <input
                            type="text"
                            value={entry.name}
                            onChange={(e) => {
                              const updated = [...mosqueEntries];
                              updated[i] = { ...updated[i], name: e.target.value };
                              setMosqueEntries(updated);
                            }}
                            placeholder={c.mosquePlaceholder(i + 1)}
                            className="flex-1 px-4 py-2.5 rounded-lg border border-line bg-white text-ink placeholder:text-ink/25 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all text-sm"
                          />
                          <input
                            type="text"
                            value={entry.city}
                            onChange={(e) => {
                              const updated = [...mosqueEntries];
                              updated[i] = { ...updated[i], city: e.target.value };
                              setMosqueEntries(updated);
                            }}
                            placeholder={c.mosqueCity}
                            className="w-28 px-3 py-2.5 rounded-lg border border-line bg-white text-ink placeholder:text-ink/25 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all text-sm"
                          />
                          {mosqueEntries.length > 1 && (
                            <button
                              type="button"
                              onClick={() => setMosqueEntries(mosqueEntries.filter((_, j) => j !== i))}
                              className="w-8 h-8 rounded-lg flex items-center justify-center text-ink/25 hover:text-red-500 hover:bg-red-50 transition-colors"
                            >
                              <span className="material-symbols-outlined text-lg">close</span>
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                    {mosqueEntries.length < 20 ? (
                      <button
                        type="button"
                        onClick={() => setMosqueEntries([...mosqueEntries, { name: "", city: "" }])}
                        className="flex items-center gap-1.5 text-sm text-primary font-semibold mt-3 hover:text-secondary transition-colors"
                      >
                        <span className="material-symbols-outlined text-base">add_circle</span>
                        {c.addMosque}
                      </button>
                    ) : (
                      <p className="text-xs text-mute mt-2">{c.maxMosques}</p>
                    )}
                  </div>
                  )}
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
                {c.continue}
              </button>
            </div>
          )}

          {/* Step 3: Planning Year */}
          {step === "year" && (
            <div>
              <button
                onClick={() => setStep("details")}
                className="flex items-center gap-1 text-ink/40 hover:text-primary text-sm mb-6 transition-colors"
              >
                <span className="material-symbols-outlined text-lg">{backArrow}</span>
                {c.back}
              </button>

              <div className="mb-8">
                <p className="text-accent-gold text-[10px] font-bold tracking-[2.5px] uppercase mb-2">{c.step3}</p>
                <h1 className="text-2xl md:text-3xl font-bold text-ink tracking-tight mb-2">
                  {c.pickYear}
                </h1>
                <p className="text-ink/40 text-sm">
                  {c.pickYearSub}
                </p>
              </div>

              <div className="flex flex-col gap-3 mb-8">
                {years.map((y) => (
                  <button
                    key={y}
                    onClick={() => setPlanningYear(y)}
                    className={`flex items-center gap-4 p-5 rounded-xl border transition-all text-start ${
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
                        {y === currentYear ? c.thisYear(y) : c.nextYear(y)}
                      </h3>
                      <p className="text-ink/40 text-sm mt-0.5">
                        {y === currentYear ? c.thisYearSub : c.nextYearSub}
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
                  c.settingUp
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    {c.startPlanning}
                    <span className="material-symbols-outlined text-lg">{isAr ? "arrow_back" : "arrow_forward"}</span>
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
