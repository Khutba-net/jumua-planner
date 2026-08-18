"use client";

import { useState, useEffect } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import WorkspacePreview from "./components/WorkspacePreview";
import MobileNav from "./components/MobileNav";

const t = {
  en: {
    navPlan: "Plan",
    navPrepare: "Prepare",
    navPricing: "Pricing",
    signIn: "Sign in",

    greeting: "O, Friday Khatibs",
    salam: "Assalamu Alaykum Wa Rahmatullahi Wa Barakatuhu",
    heroTitle: "You Own",
    heroAccent: "64 Opportunities",
    heroSub: <>By subscribing to this application, you will own <strong>64</strong> opportunities to build your annual plan to easily cover <strong>52</strong> Fridays <u>and</u> the accompanied repeated Higri events like Eid sermons, Hijrah, Isra{"'"}a and others.</>,
    heroCta: "Start Planning Your Year",

    twoObjectives: "Two Objectives",
    whatHelps: "What JumuaPlanner helps you achieve",

    obj1Title: "Plan the Entire Year",
    obj1Text: <>The software directed you to divide the year into <strong>4</strong> <u>seasons</u>/ semesters/ chapters, 3 months or 13 weeks per season, each season with its own named <strong>main theme</strong>. Then, you have to choose <strong>4</strong> <u>sub-bouquets</u> for each season, and finally, titles are going to be selected for <strong>4</strong> <u>sermons</u> within each sub-bouquet.</>,
    obj1Result: "= 64 sermons/year for full implementation.",
    obj1Summary: <>This is the <u>1<sup>st</sup></u> objective of our software system.</>,
    obj1Link: "Build your annual plan",
    annualStructure: "Annual Structure",
    mainThemes: "4 main themes",
    subBouquets: "4 sub-bouquets",
    sermons4: "4 sermons",
    labelYear: "year",
    labelMainTheme: "main theme",
    labelSubBouquet: "sub-bouquet",
    fullYear: "Full Year",
    sermonsCount: "64 sermons",
    semester: "Semester",
    mainThemeLabel: "MAIN THEME",
    subBouquetLabel: "SUB-BOUQUET",
    sermonsLabel: "SERMONS",
    exampleTheme: "Foundations of Faith",
    exampleSub1: "Tawheed & Sincerity",
    exampleSub2: "Trust in Allah",
    exampleSub3: "Gratitude & Patience",
    exampleSub4: "Repentance & Hope",
    exampleSermon1: "The beauty of Tawheed",
    exampleSermon2: "Sincerity in worship",
    exampleSermon3: "Purifying intentions",
    exampleSermon4: "Living with Tawheed",

    obj2Title: "Write and Prepare",
    obj2Text: <>The <u>2<sup>nd</sup></u> objective aims to encourage the Khatib to document the contents of his sermons, using the text window page, for a period no more than 15-20 minutes, and practice delivering it to be <u>improvised</u>.</>,
    obj2Link: "Try the editor",
    editorWrite: "Write the full sermon content",
    editorWriteSub: "Draft in Arabic and English",
    editorTarget: "Target 15–20 minutes",
    editorTargetSub: "Word count tracks your delivery time",
    editorRef: "Add Quran & Hadith references",
    editorRefSub: "Cite sources inline",
    editorDeliver: "Deliver extemporaneously",
    editorDeliverSub: "Prepared, not memorized",

    smartTitle: "Smart System",
    smartText: "The system is smart in its processing, monitoring and reporting. Subscribers can choose the level of usages: individual, organization and institution, and sometimes level switching and transitions between levels are facilitated.",

    pricingTitle: "Simple, honest pricing.",
    pricingSub: "Choose the plan that fits your mosque's size and mission.",
    individual: "Individual",
    indPrice: "$10",
    indPeriod: "/month",
    indDesc: "For solo khatibs planning their year",
    indF1: "Full annual planning",
    indF2: "Arabic + English editor",
    indF3: "Friday calendar",
    indF4: "Reference library",
    organization: "Organization",
    orgPrice: "$50",
    orgPeriod: "/month",
    orgDesc: "For mosques with multiple khatibs",
    orgF1: "Everything in Individual",
    orgF2: "Up to 10 khatib accounts",
    orgF3: "Moderator review tools",
    orgF4: "Shared khutbah bank",
    institution: "Institution",
    instPrice: "Custom",
    instDesc: "For Awqaf and multi-mosque networks",
    instF1: "Everything in Organization",
    instF2: "Up to 50 khatib accounts",
    instF3: "Multiple mosque groups",
    instF4: "Priority support",
    getStarted: "Get started",
    contactSales: "Contact sales",

    ctaTitle: "Your Year Starts Here",
    ctaSub: "Plan 64 sermons across 4 semesters. Write, prepare, and deliver every khutbah with purpose.",
    ctaButton: "Get Started Free",

    footerTagline: "Built for mosque administration",
    privacy: "Privacy",
    terms: "Terms",
    support: "Support",
    status: "Status",
  },
  ar: {
    navPlan: "الخطة",
    navPrepare: "الإعداد",
    navPricing: "الأسعار",
    signIn: "تسجيل الدخول",

    greeting: "عزيزي خطيب الجمعة",
    salam: "السلام عليكم ورحمة الله وبركاته",
    heroTitle: "ستمتلك",
    heroAccent: "٦٤ فرصة",
    heroSub: <>{"باستخدامك هذا التطبيق ستمتلك "}<strong>64</strong>{" فرصة لبناء خطتك السنوية لتغطي "}<strong>52</strong>{" جمعة وما يصحبها من مناسبات السنة الهجرية المتكررة كخطب العيدين والهجرة والاسراء والمعراج وغيرها."}</>,
    heroCta: "ابدأ تخطيط عامك",

    twoObjectives: "غرضان",
    whatHelps: "ما يساعدك جمعة بلانر على تحقيقه",

    obj1Title: "خطط لعامك بالكامل",
    obj1Text: <>{"يقودك البرنامج بتقسيم السنة الى ٤ فصول، ٣ شهور أو ١٣ أسبوعا لكل فصل. تختار لكل فصل من الفصول الأربعة عنواناً رئيسيا "}<strong>main theme</strong>{". ثم تختار لكل عنوان رئيسي باقة من أربعة عناوين فرعية لتحصل على 4 × 4 = 16 باقة "}<strong>sub-bouquet</strong>{". وتختار لكل باقة أربعة عناوين خطب تغطي موضوعاتها 16 × 4 = 64 خطبة "}<strong>sermon</strong>{"."}</>,
    obj1Result: "4 عنوان رئيسي × 4 باقة × 4 خطبة = 64 خطبة / سنة",
    obj1Summary: <>{"هذا هو الغرض "}<strong><u>{"الأول"}</u></strong>{" من النظام وإعداد الخطة السنوية."}</>,
    obj1Link: "ابنِ خطتك السنوية",
    annualStructure: "الهيكل السنوي",
    mainThemes: "٤ عناوين رئيسية",
    subBouquets: "٤ باقات",
    sermons4: "٤ خطب",
    labelYear: "سنة",
    labelMainTheme: "عنوان رئيسي",
    labelSubBouquet: "باقة",
    fullYear: "السنة الكاملة",
    sermonsCount: "٦٤ خطبة",
    semester: "فصل",
    mainThemeLabel: "العنوان الرئيسي",
    subBouquetLabel: "الباقة",
    sermonsLabel: "الخطب",
    exampleTheme: "أسس الإيمان",
    exampleSub1: "التوحيد والإخلاص",
    exampleSub2: "التوكل على الله",
    exampleSub3: "الشكر والصبر",
    exampleSub4: "التوبة والرجاء",
    exampleSermon1: "جمال التوحيد",
    exampleSermon2: "الإخلاص في العبادة",
    exampleSermon3: "تزكية النيات",
    exampleSermon4: "العيش مع التوحيد",

    obj2Title: "اكتب وأعدّ",
    obj2Text: <>{"أما الغرض الثاني فالمقصد منه تشجيع الخطيب، باستخدام نافذة كتابة الخطبة، على توثيق محتوى خطبه لتكون كل واحدة بحدود 15-20 دقيقة، بخاصة في البلدان التي لا تعطل الدوام والعمل الرسمي أيام الجمع وتحدد فسحة خروج العاملين بوقت معين، وعلى التدرب على إلقاء الخطبة "}<u>{"ارتجالياً"}</u>{" لتمكين الخطباء ولزيادة فاعلية خطبهم."}</>,
    obj2Link: "جرّب المحرر",
    editorWrite: "اكتب محتوى الخطبة كاملاً",
    editorWriteSub: "مسودة بالعربية والإنجليزية",
    editorTarget: "استهدف ١٥–٢٠ دقيقة",
    editorTargetSub: "عدد الكلمات يتتبع وقت الإلقاء",
    editorRef: "أضف مراجع القرآن والحديث",
    editorRefSub: "وثّق المصادر",
    editorDeliver: "ألقِ ارتجالاً",
    editorDeliverSub: "مُعدّ، لا محفوظ",

    smartTitle: "نظام ذكي",
    smartText: "يتميز النظام بالذكاء في المعالجة والمراقبة واعداد التقارير. للمشترك حرية الاختيار بين المستويات: الفردي، والمنظمي، ودوائر الأوقاف وربما يتيح النظام تبديل المستويات والانتقال بينها بضوابط.",

    pricingTitle: "أسعار بسيطة وشفافة.",
    pricingSub: "اختر الخطة المناسبة لحجم مسجدك ورسالته.",
    individual: "فردي",
    indPrice: "$١٠",
    indPeriod: "/شهر",
    indDesc: "للخطيب الفرد الذي يخطط لعامه",
    indF1: "تخطيط سنوي كامل",
    indF2: "محرر عربي + إنجليزي",
    indF3: "تقويم الجُمَع",
    indF4: "مكتبة المراجع",
    organization: "منظمة",
    orgPrice: "$٥٠",
    orgPeriod: "/شهر",
    orgDesc: "للمساجد ذات الخطباء المتعددين",
    orgF1: "كل ميزات الفردي",
    orgF2: "حتى ١٠ حسابات خطباء",
    orgF3: "أدوات مراجعة المشرف",
    orgF4: "بنك خطب مشترك",
    institution: "أوقاف",
    instPrice: "مخصص",
    instDesc: "لدوائر الأوقاف والشبكات المتعددة",
    instF1: "كل ميزات المنظمة",
    instF2: "حتى ٥٠ حساباً للخطباء",
    instF3: "مجموعات مساجد متعددة",
    instF4: "دعم ذو أولوية",
    getStarted: "ابدأ الآن",
    contactSales: "تواصل معنا",

    ctaTitle: "عامك يبدأ من هنا",
    ctaSub: "خطط لـ ٦٤ خطبة عبر ٤ فصول. اكتب وأعدّ وألقِ كل خطبة بهدف.",
    ctaButton: "ابدأ مجاناً",

    footerTagline: "مبني لإدارة شؤون المسجد",
    privacy: "الخصوصية",
    terms: "الشروط",
    support: "الدعم",
    status: "الحالة",
  },
} as const satisfies Record<string, Record<string, ReactNode>>;

export default function LandingPage() {
  const [lang, setLang] = useState<"en" | "ar">("en");
  const c = t[lang];
  const isAr = lang === "ar";

  useEffect(() => {
    const saved = localStorage.getItem("jp_lang");
    if (saved === "ar") setLang("ar");
  }, []);

  function toggleLang() {
    const next = isAr ? "en" : "ar";
    setLang(next);
    localStorage.setItem("jp_lang", next);
  }

  return (
    <div
      dir={isAr ? "rtl" : "ltr"}
      className={`bg-surface text-ink overflow-x-hidden ${isAr ? "font-arabic" : ""}`}
    >
      {/* Navigation */}
      <header className="sticky top-0 w-full z-50 bg-surface/80 backdrop-blur-md">
        <div className="flex justify-between items-center px-5 md:px-12 py-3 gap-3 max-w-[1200px] mx-auto">
          <div className="flex items-center gap-2 shrink-0">
            <svg width="22" height="22" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="1" y="1" width="11" height="11" rx="2" fill="#00666d" opacity="0.9"/>
              <rect x="16" y="1" width="11" height="11" rx="2" fill="#00666d" opacity="0.6"/>
              <rect x="1" y="16" width="11" height="11" rx="2" fill="#00666d" opacity="0.6"/>
              <rect x="16" y="16" width="11" height="11" rx="2" fill="#C4A35A" opacity="0.8"/>
            </svg>
            <h1 className="text-base md:text-lg font-bold text-primary tracking-tight">JumuaPlanner</h1>
          </div>
          <nav className="hidden md:flex items-center gap-8 text-sm">
            <a className="text-primary/70 font-medium hover:text-primary transition-colors" href="#framework">{c.navPlan}</a>
            <a className="text-primary/70 font-medium hover:text-primary transition-colors" href="#objectives">{c.navPrepare}</a>
            <a className="text-primary/70 font-medium hover:text-primary transition-colors" href="#pricing">{c.navPricing}</a>
          </nav>
          <div className="flex items-center gap-3">
            {/* Language toggle */}
            <button
              onClick={toggleLang}
              className="flex items-center bg-primary/10 rounded-full p-0.5 text-xs font-bold shrink-0"
              aria-label="Switch language"
            >
              <span className={`px-2.5 py-1 rounded-full transition-all ${!isAr ? "bg-primary text-white" : "text-primary/60"}`}>EN</span>
              <span className={`px-2.5 py-1 rounded-full transition-all font-arabic ${isAr ? "bg-primary text-white" : "text-primary/60"}`}>{"عربي"}</span>
            </button>
            <Link href="/auth/login" className="text-sm text-primary/70 font-medium hover:text-primary transition-colors shrink-0">{c.signIn}</Link>
            <MobileNav lang={lang} />
          </div>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="relative min-h-[600px] md:min-h-[750px] flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0 z-0">
            <img
              alt="Mosque illustration"
              className="w-full h-full object-cover object-center"
              src="/hero-mosque.jpg"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-cream-bg/25 via-cream-bg/15 to-cream-bg/45" />
          </div>
          <div
            className="relative z-10 w-full max-w-3xl mx-auto px-5 md:px-8 py-12 md:py-24 flex flex-col items-center text-center"
            style={{ textShadow: "0 1px 14px rgba(250,247,242,0.85), 0 1px 3px rgba(250,247,242,0.7)" }}
          >
            <p className="text-lg md:text-xl text-secondary font-extrabold mb-2 tracking-wide">{c.greeting}</p>
            <p className={`text-sm md:text-base text-ink/60 font-bold mb-6 ${isAr ? "font-arabic" : ""}`}>{c.salam}</p>
            <h2 className="text-4xl sm:text-5xl md:text-7xl font-extrabold text-primary mb-6 leading-tight">
              {c.heroTitle}<br />
              <span className="text-accent-gold">{c.heroAccent}</span>
            </h2>
            <p className="text-lg md:text-xl text-ink/90 font-bold mb-10 max-w-2xl mx-auto leading-relaxed">
              {c.heroSub}
            </p>
            <div className="flex justify-center">
              <Link href="/auth/signup" className="bg-primary text-white px-10 py-4 rounded-full font-bold text-lg shadow-lg hover:shadow-xl transition-all hover:scale-105 active:scale-95">
                {c.heroCta}
              </Link>
            </div>
          </div>
        </section>

        {/* Two Objectives */}
        <section id="framework" className="py-16 md:py-28 bg-surface overflow-hidden scroll-mt-20">
          <div className="text-center max-w-4xl mx-auto mb-14 md:mb-20 px-5">
            <p className="text-sm font-bold text-primary/60 uppercase tracking-widest mb-4">{c.twoObjectives}</p>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-ink tracking-[-0.02em] leading-[1.08]">{c.whatHelps}</h2>
          </div>

          {/* Objective 1 */}
          <div className="max-w-6xl mx-auto mb-16 md:mb-28 px-5 md:px-12">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-20 items-start">
              <div>
                <span className="text-[120px] md:text-[180px] font-extrabold text-primary/[0.06] leading-none block -mb-14 md:-mb-20 select-none">1</span>
                <h3 className="text-2xl md:text-3xl font-bold text-ink mb-5 relative">{c.obj1Title}</h3>
                <p className="text-ink/60 text-base md:text-lg leading-relaxed mb-8">
                  {c.obj1Text}
                </p>

                {/* Formula */}
                <div className="mb-8" dir="ltr">
                  <div className="flex flex-wrap items-center gap-3 md:gap-5 text-center">
                    <div className="flex flex-col items-center">
                      <span className="relative inline-block text-ink text-sm md:text-base font-bold px-1">
                        {c.mainThemes}
                        <span className="absolute inset-0 pointer-events-none" aria-hidden="true"><span className="absolute top-1/2 left-0 w-full h-[1.5px] bg-primary/60 -rotate-12 origin-center" /></span>
                      </span>
                      <div className="w-full h-px bg-ink/25 my-1" />
                      <span className="text-ink/50 text-sm md:text-base px-1">{c.labelYear}</span>
                    </div>
                    <span className="text-ink/25 text-lg font-light">&times;</span>
                    <div className="flex flex-col items-center">
                      <span className="relative inline-block text-ink text-sm md:text-base font-bold px-1">
                        {c.subBouquets}
                        <span className="absolute inset-0 pointer-events-none" aria-hidden="true"><span className="absolute top-1/2 left-0 w-full h-[1.5px] bg-primary/60 -rotate-12 origin-center" /></span>
                      </span>
                      <div className="w-full h-px bg-ink/25 my-1" />
                      <span className="relative inline-block text-ink/50 text-sm md:text-base px-1">
                        {c.labelMainTheme}
                        <span className="absolute inset-0 pointer-events-none" aria-hidden="true"><span className="absolute top-1/2 left-0 w-full h-[1.5px] bg-primary/60 -rotate-12 origin-center" /></span>
                      </span>
                    </div>
                    <span className="text-ink/25 text-lg font-light">&times;</span>
                    <div className="flex flex-col items-center">
                      <span className="text-ink text-sm md:text-base font-bold px-1">{c.sermons4}</span>
                      <div className="w-full h-px bg-ink/25 my-1" />
                      <span className="relative inline-block text-ink/50 text-sm md:text-base px-1">
                        {c.labelSubBouquet}
                        <span className="absolute inset-0 pointer-events-none" aria-hidden="true"><span className="absolute top-1/2 left-0 w-full h-[1.5px] bg-primary/60 -rotate-12 origin-center" /></span>
                      </span>
                    </div>
                  </div>
                  <p className="text-ink/60 text-sm md:text-base mt-4">
                    <strong className="text-ink">{c.obj1Result}</strong>
                  </p>
                  {c.obj1Summary && (
                    <p className="text-ink/60 text-sm md:text-base mt-2">{c.obj1Summary}</p>
                  )}
                </div>

                <Link href="/themes" className="inline-flex items-center gap-2 text-primary font-semibold text-sm hover:gap-3 transition-all group">
                  {c.obj1Link} <span className={`material-symbols-outlined text-base transition-transform ${isAr ? "group-hover:-translate-x-1 rotate-180" : "group-hover:translate-x-1"}`}>arrow_forward</span>
                </Link>
              </div>

              {/* Hierarchy tree — always LTR */}
              <div dir="ltr">
                <p className="text-xs font-bold text-primary/50 uppercase tracking-widest mb-5">{c.annualStructure}</p>
                <div className="text-sm">
                  {/* Full Year */}
                  <div className="flex items-center gap-2.5 mb-1">
                    <span className="text-primary/25 font-mono text-xs">{"──"}</span>
                    <span className="font-bold text-primary">{c.fullYear}</span>
                    <span className="text-[10px] font-medium text-primary/60 bg-primary/8 rounded px-1.5 py-0.5 ml-auto">{c.sermonsCount}</span>
                  </div>

                  {/* Semester — expanded */}
                  <div className="pl-5 border-l border-primary/15 ml-[7px]">
                    <div className="flex items-center gap-2 py-1.5">
                      <span className="text-primary/25 font-mono text-xs">{"├──"}</span>
                      <span className="font-semibold text-primary">{c.semester}</span>
                      <span className="text-[10px] text-primary/30 ml-auto">{isAr ? "يناير–مارس" : "Jan–Mar"}</span>
                    </div>

                    {/* Main Theme */}
                    <div className="pl-5 border-l border-primary/12 ml-[10px]">
                      <div className="flex items-center gap-2 py-1">
                        <span className="text-primary/25 font-mono text-xs">{"├──"}</span>
                        <span className="font-medium text-primary/70 text-xs">{c.exampleTheme}</span>
                        <span className="text-[9px] text-primary/30 ml-auto">{c.mainThemeLabel}</span>
                      </div>

                      {/* Sub-bouquets */}
                      <div className="pl-4 border-l border-primary/10 ml-[10px]">
                        <div className="flex items-center gap-2 py-1">
                          <span className="text-primary/20 font-mono text-xs">{"├──"}</span>
                          <span className="text-primary/55 text-xs">{c.exampleSub1}</span>
                          <span className="text-[9px] text-primary/25 ml-auto">{c.subBouquetLabel}</span>
                        </div>

                        {/* Sermons */}
                        <div className="pl-4 border-l border-primary/8 ml-[10px] mb-1">
                          {[c.exampleSermon1, c.exampleSermon2, c.exampleSermon3].map((sermon, i) => (
                            <div key={i} className="flex items-center gap-1.5 py-0.5">
                              <span className="text-primary/15 font-mono text-[10px]">{"├──"}</span>
                              <span className="text-primary/40 text-[11px]">{sermon}</span>
                            </div>
                          ))}
                          <div className="flex items-center gap-1.5 py-0.5">
                            <span className="text-primary/15 font-mono text-[10px]">{"└──"}</span>
                            <span className="text-primary/40 text-[11px]">{c.exampleSermon4}</span>
                          </div>
                          <span className="text-[9px] text-primary/20 pl-5">{c.sermonsLabel}</span>
                        </div>

                        {/* Other sub-bouquets */}
                        {[c.exampleSub2, c.exampleSub3].map((sb, i) => (
                          <div key={i} className="flex items-center gap-2 py-0.5">
                            <span className="text-primary/15 font-mono text-[10px]">{"├──"}</span>
                            <span className="text-primary/35 text-xs">{sb}</span>
                            <span className="text-primary/15 text-[10px] ml-auto">4</span>
                          </div>
                        ))}
                        <div className="flex items-center gap-2 py-0.5">
                          <span className="text-primary/15 font-mono text-[10px]">{"└──"}</span>
                          <span className="text-primary/35 text-xs">{c.exampleSub4}</span>
                          <span className="text-primary/15 text-[10px] ml-auto">4</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Other semesters collapsed */}
                  {[
                    isAr ? "أبريل–يونيو" : "Apr–Jun",
                    isAr ? "يوليو–سبتمبر" : "Jul–Sep",
                  ].map((period, i) => (
                    <div key={i} className="pl-5 border-l border-primary/10 ml-[7px]">
                      <div className="flex items-center gap-2 py-1.5">
                        <span className="text-primary/15 font-mono text-xs">{"├──"}</span>
                        <span className="font-semibold text-primary/35 text-sm">{c.semester}</span>
                        <span className="text-[10px] text-primary/20 ml-auto">{period}</span>
                      </div>
                    </div>
                  ))}
                  <div className="pl-5 ml-[7px]">
                    <div className="flex items-center gap-2 py-1.5">
                      <span className="text-primary/15 font-mono text-xs">{"└──"}</span>
                      <span className="font-semibold text-primary/35 text-sm">{c.semester}</span>
                      <span className="text-[10px] text-primary/20 ml-auto">{isAr ? "أكتوبر–ديسمبر" : "Oct–Dec"}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Objective 2 */}
          <div id="objectives" className="max-w-6xl mx-auto px-5 md:px-12 scroll-mt-20">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-20 items-center">
              <div className={`${isAr ? "order-2 md:order-2" : "order-2 md:order-1"}`}>
                <div className="flex items-center gap-3 mb-5 pb-4 border-b border-line/30">
                  <span className="material-symbols-outlined text-primary">description</span>
                  <span className="text-sm font-semibold text-ink">{isAr ? "محرر الخطب" : "Sermon Editor"}</span>
                </div>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <span className="material-symbols-outlined text-primary/40 text-lg mt-0.5">edit_note</span>
                    <div>
                      <p className="text-sm font-semibold text-ink">{c.editorWrite}</p>
                      <p className="text-xs text-ink/40 mt-0.5">{c.editorWriteSub}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="material-symbols-outlined text-primary/40 text-lg mt-0.5">timer</span>
                    <div>
                      <p className="text-sm font-semibold text-ink">{c.editorTarget}</p>
                      <p className="text-xs text-ink/40 mt-0.5">{c.editorTargetSub}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="material-symbols-outlined text-primary/40 text-lg mt-0.5">menu_book</span>
                    <div>
                      <p className="text-sm font-semibold text-ink">{c.editorRef}</p>
                      <p className="text-xs text-ink/40 mt-0.5">{c.editorRefSub}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="material-symbols-outlined text-accent-gold text-lg mt-0.5">record_voice_over</span>
                    <div>
                      <p className="text-sm font-semibold text-accent-gold">{c.editorDeliver}</p>
                      <p className="text-xs text-ink/40 mt-0.5">{c.editorDeliverSub}</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className={`${isAr ? "order-1 md:order-1" : "order-1 md:order-2"}`}>
                <span className="text-[120px] md:text-[180px] font-extrabold text-accent-gold/[0.08] leading-none block -mb-14 md:-mb-20 select-none">2</span>
                <h3 className="text-2xl md:text-3xl font-bold text-ink mb-5 relative">{c.obj2Title}</h3>
                <p className="text-ink/60 text-base md:text-lg leading-relaxed mb-8">
                  {c.obj2Text}
                </p>
                <Link href="/auth/signup" className="inline-flex items-center gap-2 text-primary font-semibold text-sm hover:gap-3 transition-all group">
                  {c.obj2Link} <span className={`material-symbols-outlined text-base transition-transform ${isAr ? "group-hover:-translate-x-1 rotate-180" : "group-hover:translate-x-1"}`}>arrow_forward</span>
                </Link>
              </div>
            </div>
          </div>

          {/* Smart system note */}
          <div className="max-w-4xl mx-auto mt-16 md:mt-24 px-5 md:px-12 text-center">
            <span className="material-symbols-outlined text-primary text-3xl mb-4 block">insights</span>
            <h3 className="text-xl md:text-2xl font-extrabold text-ink mb-3">{c.smartTitle}</h3>
            <p className="text-ink/60 text-base md:text-lg leading-relaxed max-w-2xl mx-auto font-bold">
              {c.smartText}
            </p>
          </div>
        </section>

        {/* Interface Preview */}
        <WorkspacePreview lang={lang} />

        {/* Pricing */}
        <section id="pricing" className="py-16 md:py-40 px-5 md:px-8 bg-white scroll-mt-20 overflow-hidden">
          <div className="max-w-4xl mx-auto text-center mb-10 md:mb-20">
            <h2 className="text-3xl sm:text-5xl md:text-6xl font-bold text-ink tracking-[-0.02em] leading-[1.08] mb-5">
              {c.pricingTitle}
            </h2>
            <p className="text-lg text-ink/50">{c.pricingSub}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-line/40 max-w-4xl mx-auto">
            {/* Individual */}
            <div className="bg-surface p-8 md:p-10 flex flex-col">
              <p className="text-xs font-bold text-ink/40 uppercase tracking-widest mb-4">{c.individual}</p>
              <p className="text-4xl font-bold text-ink mb-1">{c.indPrice} <span className="text-base font-normal text-ink/40">{c.indPeriod}</span></p>
              <p className="text-sm text-ink/50 mb-8">{c.indDesc}</p>
              <ul className="space-y-3 mb-10 flex-1 text-sm text-ink/70">
                <li>{c.indF1}</li>
                <li>{c.indF2}</li>
                <li>{c.indF3}</li>
                <li>{c.indF4}</li>
              </ul>
              <Link href="/auth/signup" className="w-full py-3 rounded-full border border-ink/15 text-ink font-semibold hover:border-ink/30 transition-all text-center text-sm">{c.getStarted}</Link>
            </div>
            {/* Organization */}
            <div className="bg-white p-8 md:p-10 flex flex-col relative">
              <p className="text-xs font-bold text-primary uppercase tracking-widest mb-4">{c.organization}</p>
              <p className="text-4xl font-bold text-ink mb-1">{c.orgPrice} <span className="text-base font-normal text-ink/40">{c.orgPeriod}</span></p>
              <p className="text-sm text-ink/50 mb-8">{c.orgDesc}</p>
              <ul className="space-y-3 mb-10 flex-1 text-sm text-ink/70">
                <li>{c.orgF1}</li>
                <li>{c.orgF2}</li>
                <li>{c.orgF3}</li>
                <li>{c.orgF4}</li>
              </ul>
              <Link href="/auth/signup" className="w-full py-3 rounded-full bg-primary text-white font-semibold hover:bg-secondary transition-all text-center text-sm">{c.getStarted}</Link>
            </div>
            {/* Institution */}
            <div className="bg-surface p-8 md:p-10 flex flex-col">
              <p className="text-xs font-bold text-ink/40 uppercase tracking-widest mb-4">{c.institution}</p>
              <p className="text-4xl font-bold text-ink mb-1">{c.instPrice}</p>
              <p className="text-sm text-ink/50 mb-8">{c.instDesc}</p>
              <ul className="space-y-3 mb-10 flex-1 text-sm text-ink/70">
                <li>{c.instF1}</li>
                <li>{c.instF2}</li>
                <li>{c.instF3}</li>
                <li>{c.instF4}</li>
              </ul>
              <button className="w-full py-3 rounded-full border border-ink/15 text-ink font-semibold hover:border-ink/30 transition-all text-sm">{c.contactSales}</button>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="bg-primary px-5 md:px-[120px] py-16 md:py-20">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">{c.ctaTitle}</h2>
            <p className="text-white/70 text-lg mb-8">{c.ctaSub}</p>
            <Link href="/auth/signup" className="bg-white text-primary px-10 py-4 rounded-full font-bold text-lg shadow-lg hover:shadow-xl transition-all hover:scale-105 active:scale-95 inline-block">
              {c.ctaButton}
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-surface w-full border-t border-line px-5 md:px-20 py-8 md:py-12">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex flex-col items-center md:items-start gap-4">
            <div className="text-2xl font-bold text-primary tracking-tight">JumuaPlanner</div>
            <p className="text-mute text-center md:text-left">{c.footerTagline}</p>
          </div>
          <nav className="flex flex-wrap justify-center gap-x-8 gap-y-4">
            <a className="text-xs font-bold uppercase tracking-widest text-mute hover:text-primary transition-all" href="#">{c.privacy}</a>
            <a className="text-xs font-bold uppercase tracking-widest text-mute hover:text-primary transition-all" href="#">{c.terms}</a>
            <a className="text-xs font-bold uppercase tracking-widest text-mute hover:text-primary transition-all" href="#">{c.support}</a>
            <a className="text-xs font-bold uppercase tracking-widest text-mute hover:text-primary transition-all" href="#">{c.status}</a>
          </nav>
          <div className="flex gap-4">
            <a className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary hover:bg-primary hover:text-white transition-all" href="#">
              <span className="material-symbols-outlined text-lg">share</span>
            </a>
            <a className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary hover:bg-primary hover:text-white transition-all" href="#">
              <span className="material-symbols-outlined text-lg">public</span>
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
