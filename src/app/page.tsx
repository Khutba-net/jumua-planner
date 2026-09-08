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
    salam: "السلام عليكم ورحمة الله وبركاته",
    heroTitle: "A year of khutbahs that hold together.",
    heroAccent: "",
    heroSub: <>JumuaPlanner is a planning tool for Friday khatibs. It won{"'"}t let you drift into a topic a week: you set the year{"'"}s main themes first, break each into sub-bouquets, and only then name the sermons underneath. The result is a plan your congregation can actually follow, one coherent line of thought from January to December, written and rehearsed before each Friday arrives.</>,
    heroCta: "Start Planning Your Year",

    twoObjectives: "Two Objectives",
    whatHelps: "What JumuaPlanner helps you achieve",

    obj1Title: "Plan the entire year in one sitting.",
    obj1Text: <>The software divides your year into <strong>4</strong> seasons, 3 months or 13 weeks each. You name a main theme per season, choose <strong>4</strong> sub-bouquets under it, then title <strong>4</strong> sermons under every sub-bouquet. Eid and the other Hijri occasions rarely land on a Friday; those khutbahs sit in the plan on whatever weekday or weekend they fall.</>,
    obj1Result: "= 64 sermons a year, about 13 Fridays per main theme, plus occasion khutbahs on any day.",
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
    semester: "Season",
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

    obj2Title: "Write it down. Then deliver it without the page.",
    obj2Text: <>The sermon window encourages you to document each khutbah{"'"}s content and hold it to 15–20 minutes, a real constraint where Friday is a working day and employees get a fixed window to leave and return. Then rehearse it and speak without notes. Prepared in substance, free of the script: that is what empowers khatibs and makes a khutbah land.</>,
    obj2Link: "Try the editor",
    editorWrite: "Write the full content",
    editorWriteSub: "Draft each khutbah in Arabic and English.",
    editorTarget: "Target 15–20 minutes",
    editorTargetSub: "Word count tracks your delivery time",
    editorRef: "Quran & hadith references",
    editorRefSub: "Cite your sources inline as you write.",
    editorDeliver: "Deliver without notes",
    editorDeliverSub: "Prepared, not memorized, and not read.",

    smartTitle: "It doesn't just organize. It processes, monitors, and reports.",
    smartText: "And it keeps your plan on track all year, with level switching between individual, organization, and institution when your needs grow.",

    pricingTitle: "Simple, honest pricing.",
    pricingSub: "Choose the plan that fits your mosque's size and mission. Moving between levels is facilitated.",
    individual: "Individual",
    indPrice: "$10",
    indPeriod: "/month",
    indDesc: "For solo khatibs planning their year.",
    indF1: "Full annual planning",
    indF2: "Arabic + English editor",
    indF3: "Friday calendar",
    indF4: "Reference library",
    organization: "Organization",
    orgPrice: "$50",
    orgPeriod: "/month",
    orgDesc: "For mosques with multiple khatibs.",
    orgF1: "Everything in Individual",
    orgF2: "Up to 10 khatib accounts",
    orgF3: "Moderator review tools",
    orgF4: "Shared khutbah bank",
    institution: "Institution",
    instPrice: "Custom",
    instDesc: "For Awqaf and multi-mosque networks.",
    instF1: "Everything in Organization",
    instF2: "Up to 50 khatib accounts",
    instF3: "Multiple mosque groups",
    instF4: "Priority support",
    getStarted: "Get started",
    contactSales: "Contact sales",

    ctaTitle: "Your Year Starts Here",
    ctaSub: "Plan 64 sermons across 4 seasons. Write, prepare, and deliver every khutbah with purpose.",
    ctaButton: "Get started free",

    math1Unit: "main themes",
    math1Per: "per year",
    math1Note: "One named theme for each season of 13 weeks.",
    math2Unit: "sub-bouquets",
    math2Per: "per main theme",
    math2Note: "Sixteen across the year, each a strand of its season.",
    math3Unit: "sermons",
    math3Per: "per sub-bouquet",
    math3Note: "Every Friday titled before the year begins, occasions included.",
    mathFormula: "4 × 4 × 4",

    why64Label: "Why 64, not 52",
    why64Title: "You own 64 opportunities, not 52.",
    why64Text1: "52 weeks, 52 Friday khutbahs, plus 12 more for the Hijri occasions: Eid al-Fitr, Eid al-Adha, Hijrah, Isra' and Mi'raj, Ramadan. They arrive on their own dates and don't always belong under one of your themes or sub-bouquets. 52 + 12 = 64.",
    why64Text2: "So the four seasons stay coherent, and the occasions get planned khutbahs of their own instead of displacing a theme mid-stream.",
    stat52Label: "Weekly khutbahs",
    stat52Note: "One for every Friday of the year.",
    stat12Label: "Occasion khutbahs",
    stat12Note: "Eid, Hijrah, Isra' and Mi'raj, Ramadan.",
    stat64Label: "Sermons you own",
    stat64Note: "The full annual plan, 52 plus 12.",
    stat0Label: "Fridays improvised",
    stat0Note: "Nothing chosen the night before.",

    smartProcess: "Processes",
    smartProcessBody: "Themes, sub-bouquets and titles resolve into a balanced year with no Friday left unnamed.",
    smartMonitor: "Monitors",
    smartMonitorBody: "See what is written, rehearsed and delivered, and where the year is drifting.",
    smartReport: "Reports",
    smartReportBody: "Season-by-season reporting for you, your board, or your Awqaf network.",

    termMonthly: "Monthly",
    term1yr: "1 year",
    term2yr: "2 years",
    term3yr: "3 years",
    save10: "Save 10%",
    save20: "Save 20%",
    save30: "Save 30%",
    termNoteMonthly: "Prices shown per month, billed monthly. Longer commitments cost less.",
    termNoteUpfront: "Prices shown per month, billed as one upfront payment.",
    cancelAnytime: "Cancel any time",
    billedOnce: "billed once",
    indBadge: "Solo khatib",
    orgBadge: "For mosques",
    instBadge: "Awqaf",

    footerTagline: "Built for mosque administration and khatibs",
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

    greeting: "إلى خطباء الجمعة",
    salam: "السلام عليكم ورحمة الله وبركاته",
    heroTitle: "عامٌ من الخطب يشدّ بعضه بعضاً.",
    heroAccent: "",
    heroSub: <>{"«مخطِّط الجمعة» نظامٌ لتخطيط خطب الجمعة يأخذ بيد الخطيب إلى الترتيب: تضع عناوين عامك الرئيسية أولاً، ثم تقسم كل عنوان إلى باقاتٍ فرعية، ثم تسمّي الخطب تحتها — فلا تنتقل من موضوع إلى موضوع بغير رابط."}<br /><br />{"فتخرج خطةٌ يتابعها جمهورك: خطٌّ واحد متصل من أول العام إلى آخره، مكتوبةٌ خطبه ومُتدرَّبٌ على إلقائها قبل أن تهلّ الجمعة."}</>,
    heroCta: "ابدأ تخطيط عامك",

    twoObjectives: "الغرضان",
    whatHelps: "النظام · كل ما تحتاجه لتخطيط عامك",

    obj1Title: "الغرض الأول · التخطيط",
    obj1Text: <>{"خطِّط عامك كاملاً في جلسة واحدة. يقسم النظام عامك إلى ٤ فصول، ٣ أشهر أو ١٣ أسبوعاً لكل فصل. تسمّي لكل فصل عنواناً رئيسياً، وتختار تحته ٤ باقات فرعية، ثم تسمّي ٤ خطب تحت كل باقة. والعيد وسائر المناسبات الهجرية قلّ أن تقع يوم جمعة؛ فتأخذ خطبها موضعها في الخطة في أي يوم وقعت فيه، أسبوعياً كان أو في نهاية الأسبوع."}</>,
    obj1Result: "= ٦٤ خطبة في السنة، نحو ١٣ جمعة لكل عنوان رئيسي، بالإضافة إلى خطب المناسبات في أي يوم.",
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

    obj2Title: "الغرض الثاني · الإعداد",
    obj2Text: <>{"اكتُبها، ثم ألقِها بغير ورقة. تحملك نافذة الخطبة على توثيق محتوى كل خطبة وضبطها في حدود ١٥ إلى ٢٠ دقيقة؛ وهو قيدٌ واقعي في البلدان التي لا تعطّل الدوام يوم الجمعة وتحدّد للعاملين فسحةً معلومة للخروج والعودة."}<br /><br />{"ثم تتدرّب على إلقائها بغير ورقة: معدٌّ في المعنى، متحرّرٌ من النص. بهذا يتمكّن الخطيب من خطبته، وتبلغ خطبته من سامعها."}</>,
    obj2Link: "جرّب المحرر",
    editorWrite: "اكتب المحتوى كاملاً",
    editorWriteSub: "توثيق كل خطبة بالعربية والإنجليزية.",
    editorTarget: "استهدف ١٥–٢٠ دقيقة",
    editorTargetSub: "عدّاد الكلمات يقدّر لك زمن الإلقاء.",
    editorRef: "أضف الشواهد",
    editorRefSub: "من القرآن والسنة، موثّقة في موضعها.",
    editorDeliver: "ألقِ بغير ورقة",
    editorDeliverSub: "معدٌّ في المعنى، لا محفوظاً ولا مقروءاً.",

    smartTitle: "نظامٌ ذكي: لا ينظّم فحسب؛ بل يعالج، ويراقب، ويرفع التقارير",
    smartText: "فتبقى خطتك على مسارها طوال العام. وللمشترك أن ينتقل بين المستويات — الفردي، والمنظّمي، والأوقاف — كلما اتّسعت حاجته.",

    pricingTitle: "أسعارٌ واضحة بلا تعقيد",
    pricingSub: "اختر الخطة المناسبة لحجم مسجدك ورسالته. والانتقال بين المستويات ميسّر.",
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
    ctaSub: "خطّط لـ ٦٤ خطبة عبر ٤ فصول. اكتب وأعدّ وألقِ كل خطبة بهدف.",
    ctaButton: "ابدأ مجاناً",

    math1Unit: "فصول",
    math1Per: "في السنة",
    math1Note: "١٣ أسبوعاً (جمعة) لكل فصل.",
    math2Unit: "باقات فرعية",
    math2Per: "لكل فصل",
    math2Note: "ست عشرة على مدار العام، كلٌّ منها خيط في نسيج فصله.",
    math3Unit: "خطب",
    math3Per: "لكل باقة",
    math3Note: "كل جمعة معنونة قبل أن يبدأ العام، والمناسبات مشمولة.",
    mathFormula: "٤ × ٤ × ٤",

    why64Label: "لماذا ٦٤ وليس ٥٢؟",
    why64Title: "تملك أربعاً وستين فرصة.",
    why64Text1: "اثنان وخمسون أسبوعاً، واثنتان وخمسون خطبة جمعة، وتُزاد عليها اثنتا عشرة خطبة للمناسبات الهجرية: عيد الفطر، وعيد الأضحى، والهجرة النبوية، والإسراء والمعراج، ومعركة بدر... الخ تأتي هذه في تواريخها، ولا تندرج بالضرورة تحت عنوانٍ من عناوينك أو باقةٍ من باقاتك. ٥٢ + ١٢ = ٦٤.",
    why64Text2: "فتبقى الفصول الأربعة على نظامها، وتنال المناسبات خطباً مخطَّطة لها، من غير أن تزحم عنواناً في منتصف الطريق.",
    stat52Label: "جمعة، لكل واحدة عنوانها",
    stat52Note: "خطبة لكل جمعة من جمع العام.",
    stat12Label: "مناسبة هجرية خلال السنة",
    stat12Note: "في أي يوم من الأسبوع.",
    stat64Label: "فرصة في الخطة السنوية الكاملة",
    stat64Note: "الخطة السنوية كاملة: ٥٢ + ١٢.",
    stat0Label: "جمعة مرتجلة",
    stat0Note: "لا موضوع يُختار ليلة الخطبة.",

    smartProcess: "المعالجة",
    smartProcessBody: "تنتظم عناوينك وباقاتك وخطبك في عامٍ متوازن بين الفصول، لا تبقى فيه جمعة بلا عنوان.",
    smartMonitor: "المراقبة",
    smartMonitorBody: "ترى ما كُتب وما تُدرّب عليه وما أُلقي، وتدرك انحراف الخطة قبل أن يستقر.",
    smartReport: "التقارير",
    smartReportBody: "تقارير فصلية لك، أو لمجلس مسجدك، أو لدائرة الأوقاف؛ تقدّمٌ يمكن تسليمه.",

    termMonthly: "شهرياً",
    term1yr: "سنة",
    term2yr: "سنتان",
    term3yr: "ثلاث سنوات",
    save10: "وفّر ١٠٪",
    save20: "وفّر ٢٠٪",
    save30: "وفّر ٣٠٪",
    termNoteMonthly: "الأسعار معروضة شهرياً وتُسدَّد شهرياً؛ والاشتراك الأطول أقل كلفة.",
    termNoteUpfront: "الأسعار معروضة شهرياً، وتُسدَّد دفعةً واحدة مقدّماً.",
    cancelAnytime: "الإلغاء متاح في أي وقت",
    billedOnce: "دفعةً واحدة",
    indBadge: "خطيب منفرد",
    orgBadge: "الجمعية ومساجدها",
    instBadge: "مديريات الأوقاف",

    footerTagline: "أُعدّ لإدارة شؤون المساجد والخطباء",
    privacy: "الخصوصية",
    terms: "الشروط",
    support: "الدعم",
    status: "الحالة",
  },
} as const satisfies Record<string, Record<string, ReactNode>>;

export default function LandingPage() {
  const [lang, setLang] = useState<"en" | "ar">("en");
  const [term, setTerm] = useState(0);
  const c = t[lang];
  const isAr = lang === "ar";

  const terms = [
    { individual: 10, org: 50, years: 0 },
    { individual: 9, org: 45, years: 1 },
  ];
  const activeTerm = terms[term];

  const toAr = (n: string | number) => String(n).replace(/\d/g, d => "٠١٢٣٤٥٦٧٨٩"[+d]);

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
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-ink tracking-[-0.02em] leading-[1.08] mb-8">{c.heroTitle}</h2>
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

        {/* You own 64, not 52 */}
        <section className="py-16 md:py-24 bg-surface border-b border-line/30">
          <div className="max-w-6xl mx-auto px-5 md:px-12">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16 items-center">
              <div>
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-ink tracking-[-0.02em] leading-[1.08] mb-5">{c.why64Title}</h2>
                <p className="text-ink/60 text-base md:text-lg leading-relaxed mb-4">{c.why64Text1}</p>
                <p className="text-ink/60 text-base md:text-lg leading-relaxed">{c.why64Text2}</p>
              </div>
              <div className="grid grid-cols-2">
                {[
                  { value: "52", label: c.stat52Label, note: c.stat52Note },
                  { value: "12", label: c.stat12Label, note: c.stat12Note },
                  { value: "64", label: c.stat64Label, note: c.stat64Note },
                  { value: "0", label: c.stat0Label, note: c.stat0Note },
                ].map((s, i) => (
                  <div key={i} className={`p-5 md:p-6 ${i % 2 === 0 ? (isAr ? "border-s border-line/40" : "border-e border-line/40") : ""} ${i < 2 ? "border-b border-line/40" : ""}`}>
                    <p className="text-4xl font-bold text-primary mb-2">{isAr ? toAr(s.value) : s.value}</p>
                    <p className="text-sm font-bold text-ink mb-1">{s.label}</p>
                    <p className="text-xs text-ink/50 leading-relaxed">{s.note}</p>
                  </div>
                ))}
              </div>
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

                {/* Formula — horizontal step flow */}
                <div className="mb-8" dir={isAr ? "rtl" : "ltr"}>
                  <div className="flex items-start gap-0">
                    {[
                      { unit: c.math1Unit, per: c.math1Per, note: c.math1Note },
                      { unit: c.math2Unit, per: c.math2Per, note: c.math2Note },
                      { unit: c.math3Unit, per: c.math3Per, note: c.math3Note },
                    ].map((m, i) => (
                      <div key={i} className="flex items-start flex-1 min-w-0">
                        <div className="flex-1 min-w-0 text-center">
                          <p className="text-3xl md:text-4xl font-bold text-primary leading-none">{isAr ? "٤" : "4"}</p>
                          <p className="text-xs md:text-sm font-bold text-ink mt-1.5 leading-tight">{m.unit}</p>
                          <p className="text-[9px] md:text-[10px] font-bold text-primary/50 uppercase tracking-widest mt-1">{m.per}</p>
                          <p className="text-[10px] md:text-xs text-ink/40 leading-snug mt-2 px-1">{m.note}</p>
                        </div>
                        {i < 2 && (
                          <div className="flex items-center pt-3 px-1 shrink-0">
                            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className={`text-primary/30 ${isAr ? "rotate-180" : ""}`}>
                              <path d="M7 4l6 6-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="bg-secondary text-white p-4 md:p-5 mt-4 flex flex-wrap items-baseline justify-between gap-3 rounded-sm">
                    <span className="text-xs font-bold text-accent-gold tracking-widest">{c.mathFormula}</span>
                    <span className="text-sm md:text-base">{c.obj1Result}</span>
                  </div>
                </div>

                <Link href="/themes" className="inline-flex items-center gap-2 text-primary font-semibold text-sm hover:gap-3 transition-all group">
                  {c.obj1Link} <span className={`material-symbols-outlined text-base transition-transform ${isAr ? "group-hover:-translate-x-1 rotate-180" : "group-hover:translate-x-1"}`}>arrow_forward</span>
                </Link>
              </div>

              {/* Hierarchy tree */}
              <div dir="ltr">
                <p className="text-xs font-bold text-primary/50 uppercase tracking-widest mb-5">{c.annualStructure}</p>
                <div className="text-sm space-y-3">
                  {/* Full Year */}
                  <div className="flex items-center gap-1">
                    <span className="font-bold text-primary shrink-0">{c.fullYear}</span>
                    <span className="flex-1 border-b border-dotted border-primary/20 mx-1" />
                    <span className="text-[10px] font-medium text-primary/60 bg-primary/8 rounded px-1.5 py-0.5 shrink-0">{c.sermonsCount}</span>
                  </div>

                  {/* Season — expanded */}
                  <div className="pl-6">
                    <div className="flex items-center gap-1">
                      <span className="font-semibold text-primary shrink-0">{c.semester}</span>
                      <span className="flex-1 border-b border-dotted border-primary/20 mx-1" />
                      <span className="text-[10px] text-primary/40 shrink-0">{isAr ? "يناير–مارس" : "Jan–Mar"}</span>
                    </div>

                    {/* Main Theme */}
                    <div className="pl-6 mt-2">
                      <div className="flex items-center gap-1">
                        <span className="font-medium text-primary/70 text-xs shrink-0">{c.exampleTheme}</span>
                        <span className="flex-1 border-b border-dotted border-primary/15 mx-1" />
                        <span className="text-[9px] text-primary/35 shrink-0">{c.mainThemeLabel}</span>
                      </div>

                      {/* Sub-bouquet */}
                      <div className="pl-6 mt-2">
                        <div className="flex items-center gap-1">
                          <span className="text-primary/55 text-xs shrink-0">{c.exampleSub1}</span>
                          <span className="flex-1 border-b border-dotted border-primary/12 mx-1" />
                          <span className="text-[9px] text-primary/30 shrink-0">{c.subBouquetLabel}</span>
                        </div>

                        {/* Sermons */}
                        <div className="pl-6 mt-1.5 space-y-0.5">
                          {[c.exampleSermon1, c.exampleSermon2, c.exampleSermon3, c.exampleSermon4].map((sermon, i) => (
                            <div key={i} className="flex items-center gap-1">
                              <span className="text-primary/40 text-[11px] shrink-0">{sermon}</span>
                              <span className="flex-1 border-b border-dotted border-primary/8 mx-1" />
                              {i === 0 && <span className="text-[9px] text-primary/20 shrink-0">{c.sermonsLabel}</span>}
                            </div>
                          ))}
                        </div>

                        {/* Other sub-bouquets */}
                        <div className="mt-2 space-y-1">
                          {[c.exampleSub2, c.exampleSub3, c.exampleSub4].map((sb, i) => (
                            <div key={i} className="flex items-center gap-1">
                              <span className="text-primary/35 text-xs shrink-0">{sb}</span>
                              <span className="flex-1 border-b border-dotted border-primary/10 mx-1" />
                              <span className="text-primary/20 text-[10px] shrink-0">4</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Other seasons */}
                  {[
                    isAr ? "أبريل–يونيو" : "Apr–Jun",
                    isAr ? "يوليو–سبتمبر" : "Jul–Sep",
                    isAr ? "أكتوبر–ديسمبر" : "Oct–Dec",
                  ].map((period, i) => (
                    <div key={i} className="pl-6">
                      <div className="flex items-center gap-1">
                        <span className="font-semibold text-primary/35 text-sm shrink-0">{c.semester}</span>
                        <span className="flex-1 border-b border-dotted border-primary/12 mx-1" />
                        <span className="text-[10px] text-primary/20 shrink-0">{period}</span>
                      </div>
                    </div>
                  ))}
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

        </section>

        {/* Interface Preview */}
        <WorkspacePreview lang={lang} />

        {/* Smart System */}
        <section className="bg-secondary px-5 md:px-12 py-16 md:py-20">
          <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-[0.9fr_1.1fr] gap-10 md:gap-16 items-center">
            <div>
              <p className="text-sm font-bold text-white/50 uppercase tracking-widest mb-4">{isAr ? "نظامٌ ذكي" : "Smart system"}</p>
              <h3 className="text-2xl md:text-3xl font-extrabold text-white mb-4 leading-snug">{c.smartTitle}</h3>
              <p className="text-white/70 text-base md:text-lg leading-relaxed">{c.smartText}</p>
            </div>
            <div className="grid grid-cols-3 gap-px bg-white/15">
              {[
                { title: c.smartProcess, body: c.smartProcessBody },
                { title: c.smartMonitor, body: c.smartMonitorBody },
                { title: c.smartReport, body: c.smartReportBody },
              ].map((card, i) => (
                <div key={i} className="bg-secondary p-5 md:p-6">
                  <p className="text-lg md:text-xl font-bold text-accent-gold mb-2">{card.title}</p>
                  <p className="text-sm text-white/75 leading-relaxed">{card.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section id="pricing" className="py-16 md:py-28 px-5 md:px-8 bg-white scroll-mt-20 overflow-hidden">
          <div className="max-w-4xl mx-auto text-center mb-10 md:mb-14">
            <h2 className="text-3xl sm:text-5xl md:text-6xl font-bold text-ink tracking-[-0.02em] leading-[1.08] mb-5">
              {c.pricingTitle}
            </h2>
            <p className="text-lg text-ink/50 mb-6">{c.pricingSub}</p>
            <div className="inline-flex gap-px bg-line/40 rounded-full overflow-hidden border border-line/40">
              {[
                { label: c.termMonthly, save: "" },
                { label: c.term1yr, save: c.save10 },
              ].map((t, i) => (
                <button
                  key={i}
                  onClick={() => setTerm(i)}
                  className={`flex flex-col items-center gap-0.5 px-6 py-2.5 text-sm font-bold transition-all ${term === i ? "bg-primary text-white" : "bg-surface text-ink/60 hover:bg-surface/80"}`}
                >
                  <span>{t.label}</span>
                  {t.save && <span className={`text-[10px] ${term === i ? "text-accent-gold" : "text-primary/60"}`}>{t.save}</span>}
                </button>
              ))}
            </div>
            <p className="text-sm text-ink/40 mt-3">
              {activeTerm.years ? c.termNoteUpfront : c.termNoteMonthly}
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-line/40 max-w-4xl mx-auto border border-line/40">
            {/* Individual */}
            <div className="bg-surface p-8 md:p-10 flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <p className="text-xs font-bold text-ink/40 uppercase tracking-widest">{c.individual}</p>
                <span className="text-[10px] font-bold text-ink/50 bg-ink/5 px-2 py-1">{c.indBadge}</span>
              </div>
              <p className="text-4xl font-bold text-ink mb-1">${activeTerm.individual} <span className="text-base font-normal text-ink/40">{c.indPeriod}</span></p>
              <p className="text-xs text-ink/40 mb-2">
                {activeTerm.years
                  ? `$${activeTerm.individual * 12 * activeTerm.years} ${c.billedOnce} · ${c.save10}`
                  : c.cancelAnytime}
              </p>
              <p className="text-sm text-ink/50 mb-8">{c.indDesc}</p>
              <ul className="space-y-3 mb-10 flex-1 text-sm text-ink/70">
                <li className="flex gap-2"><span className="text-ink/30">—</span>{c.indF1}</li>
                <li className="flex gap-2"><span className="text-ink/30">—</span>{c.indF2}</li>
                <li className="flex gap-2"><span className="text-ink/30">—</span>{c.indF3}</li>
                <li className="flex gap-2"><span className="text-ink/30">—</span>{c.indF4}</li>
              </ul>
              <Link href="/auth/signup" className="w-full py-3 rounded-full border border-ink/15 text-ink font-semibold hover:border-ink/30 transition-all text-center text-sm">{c.getStarted}</Link>
            </div>
            {/* Organization */}
            <div className="bg-secondary text-white p-8 md:p-10 flex flex-col relative">
              <div className="flex items-center justify-between mb-4">
                <p className="text-xs font-bold text-white/60 uppercase tracking-widest">{c.organization}</p>
                <span className="text-[10px] font-bold text-secondary bg-accent-gold px-2 py-1">{c.orgBadge}</span>
              </div>
              <p className="text-4xl font-bold text-white mb-1">${activeTerm.org} <span className="text-base font-normal text-white/50">{c.orgPeriod}</span></p>
              <p className="text-xs text-white/50 mb-2">
                {activeTerm.years
                  ? `$${activeTerm.org * 12 * activeTerm.years} ${c.billedOnce} · ${c.save10}`
                  : c.cancelAnytime}
              </p>
              <p className="text-sm text-white/60 mb-8">{c.orgDesc}</p>
              <ul className="space-y-3 mb-10 flex-1 text-sm text-white/80">
                <li className="flex gap-2"><span className="text-white/30">—</span>{c.orgF1}</li>
                <li className="flex gap-2"><span className="text-white/30">—</span>{c.orgF2}</li>
                <li className="flex gap-2"><span className="text-white/30">—</span>{c.orgF3}</li>
                <li className="flex gap-2"><span className="text-white/30">—</span>{c.orgF4}</li>
              </ul>
              <Link href="/auth/signup" className="w-full py-3 rounded-full bg-accent-gold text-secondary font-semibold hover:bg-accent-gold/90 transition-all text-center text-sm">{c.getStarted}</Link>
            </div>
            {/* Institution */}
            <div className="bg-surface p-8 md:p-10 flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <p className="text-xs font-bold text-ink/40 uppercase tracking-widest">{c.institution}</p>
                <span className="text-[10px] font-bold text-ink/50 bg-ink/5 px-2 py-1">{c.instBadge}</span>
              </div>
              <p className="text-4xl font-bold text-ink mb-1">{c.instPrice}</p>
              <p className="text-xs text-ink/40 mb-2">
                {activeTerm.years
                  ? (isAr ? "تُسعَّر المدد الطويلة على حجم الاشتراك" : "Multi-year terms priced on volume")
                  : (isAr ? "اتفاقات سنوية أو متعددة السنوات" : "Annual or multi-year agreements")}
              </p>
              <p className="text-sm text-ink/50 mb-8">{c.instDesc}</p>
              <ul className="space-y-3 mb-10 flex-1 text-sm text-ink/70">
                <li className="flex gap-2"><span className="text-ink/30">—</span>{c.instF1}</li>
                <li className="flex gap-2"><span className="text-ink/30">—</span>{c.instF2}</li>
                <li className="flex gap-2"><span className="text-ink/30">—</span>{c.instF3}</li>
                <li className="flex gap-2"><span className="text-ink/30">—</span>{c.instF4}</li>
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
