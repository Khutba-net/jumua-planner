"use client";

import { useState } from "react";

const tabs = [
  { id: "dashboard", label: "Dashboard", icon: "dashboard" },
  { id: "annual", label: "Annual Plan", icon: "calendar_month" },
  { id: "calendar", label: "Calendar", icon: "event" },
  { id: "editor", label: "Sermon Editor", icon: "edit_note" },
];

function SidebarMockup({ active }: { active: string }) {
  const navItems = [
    { icon: "dashboard", label: "Dashboard", id: "dashboard" },
    { icon: "description", label: "Sermons", id: "sermons" },
    { icon: "calendar_month", label: "Annual Plan", id: "annual" },
    { icon: "event", label: "Calendar", id: "calendar" },
    { icon: "groups", label: "Community", id: "community" },
    { icon: "menu_book", label: "Resources", id: "resources" },
  ];
  return (
    <div className="w-14 md:w-48 border-r border-[#bcc9ca]/20 flex flex-col bg-white shrink-0">
      <div className="flex items-center gap-2 px-3 py-3.5 border-b border-[#bcc9ca]/20">
        <svg width="18" height="18" viewBox="0 0 28 28" fill="none">
          <rect x="1" y="1" width="11" height="11" rx="2" fill="#00666d" opacity="0.9"/>
          <rect x="16" y="1" width="11" height="11" rx="2" fill="#00666d" opacity="0.6"/>
          <rect x="1" y="16" width="11" height="11" rx="2" fill="#00666d" opacity="0.6"/>
          <rect x="16" y="16" width="11" height="11" rx="2" fill="#C4A35A" opacity="0.8"/>
        </svg>
        <span className="hidden md:block text-[11px] font-bold text-[#00666d]">JumuaPlanner</span>
      </div>
      <nav className="flex-1 px-2 py-2.5 flex flex-col gap-0.5">
        {navItems.map((item) => (
          <div
            key={item.id}
            className={`flex items-center gap-2 px-2 py-1.5 text-[10px] font-medium rounded-lg ${
              active === item.id ? "bg-[#00666d]/10 text-[#00666d]" : "text-[#6d797a]"
            }`}
          >
            <span className="material-symbols-outlined text-[15px]">{item.icon}</span>
            <span className="hidden md:block">{item.label}</span>
          </div>
        ))}
      </nav>
      <div className="px-2 py-2 border-t border-[#bcc9ca]/20 flex flex-col gap-0.5">
        <div className="flex items-center gap-2 px-2 py-1.5 text-[10px] font-medium text-[#6d797a]">
          <span className="material-symbols-outlined text-[15px]">settings</span>
          <span className="hidden md:block">Settings</span>
        </div>
        <div className="flex items-center gap-2 px-2 py-1.5 text-[10px] font-medium text-[#6d797a]">
          <span className="material-symbols-outlined text-[15px]">logout</span>
          <span className="hidden md:block">Sign out</span>
        </div>
        <div className="flex items-center gap-2 px-2 py-2 mt-1">
          <div className="w-6 h-6 rounded-full bg-[#00666d]/20 flex items-center justify-center text-[#00666d] text-[9px] font-bold">A</div>
          <div className="hidden md:block min-w-0">
            <p className="text-[10px] font-semibold text-[#1a1c1e] truncate">Ahmed</p>
            <p className="text-[8px] text-[#6d797a] capitalize">individual</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function DashboardMockup({ lang = "en" }: { lang?: string }) {
  const ar = lang === "ar";
  const stats = ar
    ? [{ v: "٣٣", l: "إجمالي الخطب", icon: "description" }, { v: "١٥", l: "مسودات", icon: "edit_note" }, { v: "١٤", l: "جاهزة للإلقاء", icon: "check_circle" }, { v: "١", l: "تم إلقاؤها", icon: "event_available" }]
    : [{ v: "33", l: "Total sermons", icon: "description" }, { v: "15", l: "Drafts", icon: "edit_note" }, { v: "14", l: "Ready to deliver", icon: "check_circle" }, { v: "1", l: "Delivered", icon: "event_available" }];
  const sermons = ar
    ? [{ t: "جمال التوحيد", date: "الجمعة، ٢ يناير ٢٠٢٦", theme: "أسس الإيمان" }, { t: "الصبر عند الابتلاء", date: "الجمعة، ٩ يناير ٢٠٢٦", theme: "أسس الإيمان" }, { t: "اليقين في الحياة اليومية", date: "الجمعة، ١٦ يناير ٢٠٢٦", theme: "أسس الإيمان" }]
    : [{ t: "The beauty of Tawheed", date: "FRI, JAN 2, 2026", theme: "FOUNDATIONS OF FAITH" }, { t: "Patience in testing — a mark of faith", date: "FRI, JAN 9, 2026", theme: "FOUNDATIONS OF FAITH" }, { t: "Certainty in God and daily life", date: "FRI, JAN 16, 2026", theme: "FOUNDATIONS OF FAITH" }];
  const upcoming = ar
    ? [{ date: "٩ يول", t: "التمسك بحبل الله..." }, { date: "١٦ يول", t: "إصلاح ذات البين..." }, { date: "٢٣ يول", t: "احترام الاختلاف..." }]
    : [{ date: "JUL 9", t: "Holding fast to Allah's..." }, { date: "JUL 16", t: "Repairing broken ties..." }, { date: "JUL 23", t: "Respecting difference..." }];
  const actions = ar
    ? [{ icon: "add", label: "خطبة جديدة" }, { icon: "list", label: "جميع الخطب" }, { icon: "calendar_month", label: "الخطة السنوية" }]
    : [{ icon: "add", label: "New sermon" }, { icon: "list", label: "All sermons" }, { icon: "calendar_month", label: "Annual plan" }];
  return (
    <div className="flex-1 flex min-w-0" dir={ar ? "rtl" : "ltr"}>
      <div className="flex-1 p-4 md:p-5 overflow-hidden">
        <div className="flex items-center justify-between mb-4">
          <p className="text-[11px] text-[#3d494a]">{ar ? "السلام عليكم،" : "Asalamu alaykom,"} <span className="text-[#00666d] font-semibold">{ar ? "أحمد" : "Ahmed"}</span> <span className="hidden md:inline text-[#6d797a] text-[10px]">{ar ? "" : "— السلام عليكم ورحمة الله وبركاته"}</span></p>
          <button className="bg-[#00666d] text-white text-[9px] px-2.5 py-1 font-bold">{ar ? "+ خطبة جديدة" : "+ New sermon"}</button>
        </div>
        <div className="grid grid-cols-4 gap-1.5 mb-4">
          {stats.map((s) => (
            <div key={s.l} className="bg-white border border-[#bcc9ca]/20 p-2.5">
              <div className="w-6 h-6 bg-[#00666d]/10 flex items-center justify-center mb-1">
                <span className="material-symbols-outlined text-[#00666d] text-[12px]">{s.icon}</span>
              </div>
              <p className="text-base font-bold text-[#1a1c1e]">{s.v}</p>
              <p className="text-[8px] text-[#6d797a]">{s.l}</p>
            </div>
          ))}
        </div>
        <div className="bg-[#C4A35A]/5 border border-[#C4A35A]/20 p-2.5 mb-4 flex items-center gap-2">
          <span className="material-symbols-outlined text-[#C4A35A] text-base">trending_up</span>
          <p className="text-[10px] font-semibold text-[#3d494a]">{ar ? "٠ كلمة مكتوبة" : "0 total words written"}</p>
        </div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-[8px] font-bold text-[#6d797a] tracking-[2px] uppercase">{ar ? "الخطب الأخيرة" : "Recent Sermons"}</p>
          <span className="text-[9px] text-[#00666d] font-semibold">{ar ? "عرض الكل ←" : "View all →"}</span>
        </div>
        {sermons.map((s, i) => (
          <div key={i} className="bg-white border border-[#bcc9ca]/15 p-2.5 mb-1 flex items-center justify-between">
            <div>
              <p className="text-[9px] text-[#6d797a] mb-0.5">{s.date}</p>
              <p className="text-[10px] font-semibold text-[#1a1c1e]">{s.t}</p>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="text-[7px] font-bold px-1.5 py-0.5 bg-green-50 text-green-700">{ar ? "جاهزة" : "READY"}</span>
                <span className="text-[7px] font-bold px-1.5 py-0.5 bg-[#C4A35A]/10 text-[#C4A35A]">{s.theme}</span>
                <span className="text-[7px] text-[#6d797a]">{ar ? "٠ كلمة" : "0 words"}</span>
              </div>
            </div>
            <p className="text-[8px] text-[#bcc9ca] shrink-0">{ar ? "عُدّل منذ يومين" : "Edited 2d ago"}</p>
          </div>
        ))}
      </div>
      {/* Right sidebar */}
      <div className={`hidden lg:block w-[180px] ${ar ? "border-r" : "border-l"} border-[#bcc9ca]/20 p-3 shrink-0`}>
        <p className="text-[8px] font-bold text-[#6d797a] tracking-[2px] uppercase mb-2">{ar ? "هذا الأسبوع" : "This Week"}</p>
        <div className="bg-[#00666d]/5 p-2.5 mb-4">
          <p className="text-[9px] text-[#6d797a]">{ar ? "الجمعة القادمة" : "Next Friday"}</p>
          <p className="text-[10px] font-semibold text-[#00666d]">{ar ? "الجمعة، ١٠ يوليو" : "Friday, July 10"}</p>
          <p className="text-[8px] text-[#6d797a] mt-1">{ar ? "التمسك بحبل الله" : "Holding fast to Allah’s rope"} — <span className="font-bold text-[#C4A35A]">{ar ? "مخطط" : "PLANNED"}</span></p>
        </div>
        <p className="text-[8px] font-bold text-[#6d797a] tracking-[2px] uppercase mb-2">{ar ? "القادمة" : "Upcoming"}</p>
        {upcoming.map((s, i) => (
          <div key={i} className="flex items-start gap-2 py-1.5">
            <span className="text-[8px] font-bold text-[#00666d] min-w-[30px]">{s.date}</span>
            <div>
              <p className="text-[9px] text-[#1a1c1e] truncate">{s.t}</p>
              <span className="text-[7px] font-bold px-1 py-px bg-[#C4A35A]/10 text-[#C4A35A]">{i === 0 ? (ar ? "مخطط" : "PLANNED") : (ar ? "مسودة" : "DRAFT")}</span>
            </div>
          </div>
        ))}
        <p className="text-[8px] font-bold text-[#6d797a] tracking-[2px] uppercase mb-2 mt-4">{ar ? "إجراءات سريعة" : "Quick Actions"}</p>
        {actions.map((a) => (
          <div key={a.label} className="flex items-center gap-1.5 text-[9px] text-[#1a1c1e] px-2 py-1.5 bg-white border border-[#bcc9ca]/15 mb-0.5">
            <span className="material-symbols-outlined text-[#00666d] text-[12px]">{a.icon}</span>
            {a.label}
          </div>
        ))}
      </div>
    </div>
  );
}

function AnnualPlanMockup({ lang = "en" }: { lang?: string }) {
  const ar = lang === "ar";
  const seasons = ar ? [
    { n: 1, label: "الموسم ١", range: "يناير – مارس", theme: "الإيمان والأسس الروحية", color: "#00666d",
      subs: [
        { name: "أبعاد الإيمان الداخلية", sermons: [
          { date: "٢ يناير", title: "جوهر النية", status: "written" },
          { date: "٩ يناير", title: "تنمية اليقين", status: "written" },
          { date: "١٣ يناير", title: "استقبال رمضان", status: "planned", occasion: true },
          { date: "١٦ يناير", title: "التوكل في الممارسة", status: "not started" },
        ]},
        { name: "إتقان الصلوات اليومية", sermons: [
          { date: "٣٠ يناير", title: "الخشوع في الصلاة", status: "written" },
          { date: "٦ فبراير", title: "المسجد ملاذ آمن", status: "planned" },
        ]},
        { name: "الدعاء والذكر", sermons: [
          { date: "١٣ فبراير", title: "أوقات الإجابة", status: "not started" },
          { date: "٢٠ فبراير", title: "أذكار الصباح والمساء", status: "not started" },
        ]},
      ], slots: "10/16" },
    { n: 2, label: "الموسم ٢", range: "أبريل – يونيو", theme: null, slots: "0/16" },
  ] : [
    { n: 1, label: "Season 1", range: "Jan – Mar", theme: "Faith & Spiritual Foundations", color: "#00666d",
      subs: [
        { name: "The Inner Dimensions of Iman", sermons: [
          { date: "2 Jan", title: "The Essence of Niyyah", status: "written" },
          { date: "9 Jan", title: "Cultivating Yaqeen", status: "written" },
          { date: "13 Jan", title: "Welcoming Ramadan", status: "planned", occasion: true },
          { date: "16 Jan", title: "Tawakkul in Practice", status: "not started" },
        ]},
        { name: "Mastering the Daily Prayers", sermons: [
          { date: "30 Jan", title: "Khushu' in Salah", status: "written" },
          { date: "6 Feb", title: "The Masjid as a Sanctuary", status: "planned" },
        ]},
        { name: "Du'a & Dhikr", sermons: [
          { date: "13 Feb", title: "Times of Acceptance", status: "not started" },
          { date: "20 Feb", title: "Morning & Evening Adhkar", status: "not started" },
        ]},
      ], slots: "10/16" },
    { n: 2, label: "Season 2", range: "Apr – Jun", theme: null, slots: "0/16" },
  ];
  const statusMap: Record<string, { bg: string; text: string; label: string }> = ar ? {
    "written": { bg: "#e8f5ee", text: "#1f7a4d", label: "مكتوب" },
    "planned": { bg: "#FFF8E7", text: "#C4A35A", label: "مخطط" },
    "not started": { bg: "#f5f3f0", text: "#6d797a", label: "لم يبدأ" },
  } : {
    "written": { bg: "#e8f5ee", text: "#1f7a4d", label: "Written" },
    "planned": { bg: "#FFF8E7", text: "#C4A35A", label: "Planned" },
    "not started": { bg: "#f5f3f0", text: "#6d797a", label: "Not started" },
  };
  return (
    <div className="flex-1 p-4 md:p-5 overflow-hidden" dir={ar ? "rtl" : "ltr"}>
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-sm font-bold text-[#1a1c1e]">{ar ? "الخطة السنوية" : "Annual Plan"} · <span className="text-[#00666d]">2026</span></p>
          <p className="text-[9px] text-[#6d797a]">{ar ? "٦٤ خانة · ٤ مواسم" : "64 slots · 4 seasons"}</p>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[9px] text-[#6d797a]">‹ 2026 ›</span>
          <span className="text-[8px] font-bold px-2 py-1 bg-[#00666d] text-white">{ar ? "المواسم" : "Seasons"}</span>
          <span className="text-[8px] font-bold px-2 py-1 border border-[#bcc9ca]/30 text-[#6d797a]">{ar ? "٦٤ خانة" : "64 Slots"}</span>
        </div>
      </div>
      <div className="flex items-center gap-3 mb-3 text-[9px]">
        <span className="text-[#00666d] font-bold">10</span><span className="text-[#6d797a]">{ar ? "/ ٦٤ خانة معنونة" : "/ 64 slots titled"}</span>
        <div className="flex-1 h-1 bg-[#f0ede7] overflow-hidden"><div className="h-full bg-[#00666d]" style={{ width: "15%" }} /></div>
        <span className="text-[8px] text-[#6d797a]">15%</span>
      </div>
      {seasons.map((s) => (
        <div key={s.n} className="bg-white border border-[#bcc9ca]/20 mb-2 overflow-hidden">
          <div className="flex items-center justify-between px-3 py-2 border-b border-[#bcc9ca]/15">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 bg-[#00666d]/10 text-[#00666d] text-[8px] font-bold flex items-center justify-center">{s.n}</span>
              <span className="text-[10px] font-bold text-[#1a1c1e]">{s.label} <span className="text-[#6d797a] font-medium">· {s.range}</span></span>
            </div>
            <span className="text-[8px] text-[#6d797a]">{s.slots} {ar ? "خانة" : "slots"}</span>
          </div>
          {s.theme ? (
            <>
              <div className="flex items-center gap-2 px-3 py-1.5 border-b border-[#bcc9ca]/15 bg-[#fafaf8]">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
                <span className="text-[9px] font-bold text-[#1a1c1e]">{s.theme}</span>
              </div>
              {s.subs?.map((sub, si) => (
                <div key={si} className="border-b border-[#bcc9ca]/10 last:border-b-0">
                  <div className="flex items-center gap-1.5 px-3 py-1.5">
                    <span className="w-3.5 h-3.5 text-[7px] font-bold flex items-center justify-center text-white" style={{ backgroundColor: s.color }}>{si + 1}</span>
                    <span className="text-[9px] font-semibold text-[#3d494a]">{sub.name}</span>
                    <span className="text-[6px] text-[#bcc9ca] ml-auto">{sub.sermons.length}</span>
                  </div>
                  {sub.sermons.map((sr, sri) => {
                    const st = statusMap[sr.status];
                    return (
                      <div key={sri} className={`flex items-center gap-2 px-3 py-1 ${ar ? "mr-5" : "ml-5"}`}>
                        <span className={`w-1 h-1 rounded-full ${sr.occasion ? "bg-[#C4A35A]" : ""}`} style={sr.occasion ? {} : { backgroundColor: st.text }} />
                        <span className="text-[8px] text-[#6d797a] font-medium w-[30px] shrink-0">{sr.date}</span>
                        <span className="text-[8px] text-[#1a1c1e] flex-1 truncate">{sr.title}</span>
                        {sr.occasion ? (
                          <span className="text-[6px] font-bold px-1 py-px bg-[#C4A35A]/10 text-[#C4A35A]">{ar ? "عيد" : "Eid"}</span>
                        ) : (
                          <span className="text-[6px] font-bold px-1 py-px" style={{ backgroundColor: st.bg, color: st.text }}>{st.label}</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </>
          ) : (
            <div className="py-5 text-center text-[9px] text-[#bcc9ca]">
              <span className="material-symbols-outlined text-lg text-[#bcc9ca]/40 block mb-1">add_circle</span>
              {ar ? `حدد الموضوع الرئيسي لـ ${s.range}` : `Set the main theme for ${s.range}`}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function CalendarMockup({ lang = "en" }: { lang?: string }) {
  const ar = lang === "ar";
  const days = ar ? ["أحد", "إثنين", "ثلاثاء", "أربعاء", "خميس", "جمعة", "سبت"] : ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const weeks = [
    [null, null, 1, 2, 3, 4, 5],
    [6, 7, 8, 9, 10, 11, 12],
    [13, 14, 15, 16, 17, 18, 19],
    [20, 21, 22, 23, 24, 25, 26],
    [27, 28, 29, 30, 31, null, null],
  ];
  const sermonDays: Record<number, { title: string; status: string }> = ar ? {
    3: { title: "الأخوة درعٌ واقٍ", status: "ready" },
    10: { title: "الاعتصام بحبل الله", status: "ready" },
    17: { title: "إصلاح ذات البين", status: "draft" },
    24: { title: "احترام الاختلاف", status: "draft" },
  } : {
    3: { title: "Brotherhood as a shield", status: "ready" },
    10: { title: "Holding fast to Allah's rope", status: "ready" },
    17: { title: "Repairing broken ties", status: "draft" },
    24: { title: "Respecting difference", status: "draft" },
  };
  const statusColors: Record<string, { bg: string; text: string; label: string }> = ar ? {
    ready: { bg: "#e8f5ee", text: "#1f7a4d", label: "جاهزة" },
    draft: { bg: "#f0eeeb", text: "#6d797a", label: "لم تبدأ" },
  } : {
    ready: { bg: "#e8f5ee", text: "#1f7a4d", label: "Ready" },
    draft: { bg: "#f0eeeb", text: "#6d797a", label: "Not started" },
  };
  const calStats = ar
    ? [{ v: "٤", l: "خطب", highlight: true }, { v: "٠", l: "مكتوبة" }, { v: "٢", l: "مخططة", gold: true }, { v: "٢", l: "لم تبدأ" }]
    : [{ v: "4", l: "SERMONS", highlight: true }, { v: "0", l: "WRITTEN" }, { v: "2", l: "PLANNED", gold: true }, { v: "2", l: "NOT STARTED" }];
  const friIdx = ar ? 5 : 5;
  return (
    <div className="flex-1 p-4 md:p-5 overflow-hidden" dir={ar ? "rtl" : "ltr"}>
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-sm font-bold text-[#00666d] italic">{ar ? "يوليو ٢٠٢٦" : "July 2026"}</p>
          <p className="text-[9px] text-[#6d797a]">{ar ? "٤ خطب هذا الشهر" : "4 sermons this month"}</p>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[9px] font-bold px-2 py-1 border border-[#bcc9ca]/30 bg-white text-[#3d494a]">{ar ? "اليوم" : "Today"}</span>
          <span className="text-[9px] text-[#6d797a]">‹ ›</span>
          <span className="text-[9px] font-bold px-2 py-1 bg-[#00666d] text-white">{ar ? "شهر" : "Month"}</span>
          <span className="text-[9px] font-bold px-2 py-1 border border-[#bcc9ca]/30 bg-white text-[#3d494a]">{ar ? "سنة" : "Year"}</span>
        </div>
      </div>
      <div className="flex border border-[#bcc9ca]/20 bg-white/60 mb-3">
        {calStats.map((s, i) => (
          <div key={i} className="flex-1 px-2 py-2 text-center border-r border-[#bcc9ca]/15 last:border-r-0">
            <p className={`text-sm font-bold ${s.gold ? "text-[#C4A35A]" : s.highlight ? "text-[#00666d]" : "text-[#6d797a]"}`}>{s.v}</p>
            <p className="text-[6px] font-bold tracking-[1px] text-[#6d797a] uppercase">{s.l}</p>
          </div>
        ))}
      </div>
      <div className="border border-[#bcc9ca]/20 bg-white/40">
        <div className="grid grid-cols-7 border-b border-[#bcc9ca]/20">
          {days.map((d, di) => (
            <div key={d} className={`text-[7px] font-bold tracking-[1px] uppercase text-center py-1 border-r border-[#bcc9ca]/10 last:border-r-0 ${di === friIdx ? "text-[#00666d] bg-[#00666d]/[0.03]" : "text-[#6d797a]"}`}>
              {d}
            </div>
          ))}
        </div>
        {weeks.map((week, wi) => (
          <div key={wi} className="grid grid-cols-7">
            {week.map((day, di) => {
              const sermon = day ? sermonDays[day] : null;
              const st = sermon ? statusColors[sermon.status] : null;
              return (
                <div
                  key={di}
                  className={`min-h-[42px] border-r border-b border-[#bcc9ca]/10 last:border-r-0 p-0.5 ${
                    !day ? "bg-[#FAF7F2]/50" : ""
                  } ${di === friIdx ? "bg-[#00666d]/[0.02]" : ""} ${day === 10 ? "bg-[#00666d]/[0.06]" : ""}`}
                >
                  {day && (
                    <>
                      <span className={`text-[8px] font-bold inline-flex items-center justify-center ${day === 10 ? "bg-[#00666d] text-white w-3.5 h-3.5 rounded-full" : di === friIdx ? "text-[#00666d]" : "text-[#3d494a]"}`}>
                        {ar ? day.toLocaleString("ar-SA") : day}
                      </span>
                      {sermon && st && (
                        <div className="mt-0.5 hidden md:block" style={ar ? { borderRight: "2px solid #4a7c59" } : { borderLeft: "2px solid #4a7c59" }}>
                          <p className={`text-[6px] font-semibold text-[#1a1c1e] truncate ${ar ? "pr-0.5" : "pl-0.5"}`}>{sermon.title}</p>
                          <span className={`text-[5px] font-bold px-0.5 ${ar ? "mr-0.5" : "ml-0.5"}`} style={{ backgroundColor: st.bg, color: st.text }}>{st.label}</span>
                        </div>
                      )}
                      {di === friIdx && !sermon && (
                        <p className="text-[5px] text-[#bcc9ca] italic hidden md:block">{ar ? "جمعة" : "Jumu'ah"}</p>
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

function EditorMockup({ lang = "en" }: { lang?: string }) {
  const ar = lang === "ar";
  const sections = ar ? ["المقدمة", "الموضوع الرئيسي", "الخطبة الثانية"] : ["Opening", "Main theme", "Second khutbah"];
  const checklist = ar ? [
    { label: "تم تحديد العنوان", done: true },
    { label: "كتابة المحتوى العربي", done: false, req: true },
    { label: "الترجمة الإنجليزية", done: false, req: true },
    { label: "تحديد التاريخ", done: false, req: true },
    { label: "ضمن المدة (١٥-٢٥ د)", done: false },
    { label: "ذكر المراجع", done: false },
  ] : [
    { label: "Sermon title set", done: true },
    { label: "Arabic content written", done: false, req: true },
    { label: "English translation", done: false, req: true },
    { label: "Scheduled date set", done: false, req: true },
    { label: "Within target (15-25 min)", done: false },
    { label: "References cited", done: false },
  ];
  const langModes = ar ? ["العربية أولاً", "الإنجليزية أولاً", "عربي فقط", "إنجليزي فقط"] : ["Arabic first", "English first", "AR only", "EN only"];
  return (
    <div className="flex-1 flex flex-col min-w-0" dir={ar ? "rtl" : "ltr"}>
      <div className="flex items-center justify-between px-3 py-2 border-b border-[#bcc9ca]/20 bg-white gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-[9px] px-1.5 py-0.5 border border-[#bcc9ca]/30 bg-white text-[#1a1c1e]">{ar ? "الخطب ←" : "← Sermons"}</span>
          <span className="text-[9px] text-[#1a1c1e] italic truncate hidden md:inline">{ar ? "الاعتصام بحبل الله جميعاً — ١٠ يوليو ٢٠٢٦" : "Holding fast to Allah’s rope together — Jul 10, 2026"}</span>
          <span className="text-[7px] font-bold px-1.5 py-0.5 bg-[#C4A35A]/10 text-[#C4A35A] hidden md:inline">{ar ? "الوحدة والعلم" : "UNITY & KNOWLEDGE"}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[8px] font-bold px-1.5 py-0.5 bg-orange-50 text-orange-600 flex items-center gap-0.5">
            <span className="material-symbols-outlined text-[10px]">rate_review</span>
            <span className="hidden sm:inline">{ar ? "قيد المراجعة" : "IN REVIEW"}</span>
          </span>
          <span className="text-[8px] px-1.5 py-0.5 border border-[#bcc9ca]/30 text-red-500 hidden md:inline">{ar ? "حذف" : "Delete"}</span>
          <span className="text-[8px] px-1.5 py-0.5 border border-[#bcc9ca]/30 text-[#1a1c1e] hidden md:inline">{ar ? "تصدير" : "Export"}</span>
          <span className="text-[8px] px-2 py-0.5 bg-[#00666d] text-white font-semibold">{ar ? "حفظ" : "Save"}</span>
        </div>
      </div>
      <div className="flex-1 flex min-h-0">
        <div className={`hidden md:flex w-[120px] ${ar ? "border-l" : "border-r"} border-[#bcc9ca]/20 bg-white p-2.5 flex-col shrink-0`}>
          <p className="text-[7px] tracking-[2px] text-[#6d797a]/60 mb-1.5">{ar ? "بيانات الخطبة" : "SPEECH INFO"}</p>
          <div className="mb-2">
            <p className="text-[8px] text-[#6d797a]/60">{ar ? "التاريخ" : "Date"}</p>
            <p className="text-[9px] font-medium text-[#1a1c1e]">{ar ? "١٠/٧/٢٠٢٦" : "2026-07-10"}</p>
          </div>
          <div className="mb-2">
            <p className="text-[8px] text-[#6d797a]/60">{ar ? "الحالة" : "Status"}</p>
            <p className="text-[9px] font-medium text-[#1a1c1e]">{ar ? "قيد المراجعة" : "IN REVIEW"}</p>
          </div>
          <div className="mb-2">
            <p className="text-[8px] text-[#6d797a]/60">{ar ? "الكلمات" : "Words"}</p>
            <p className="text-[9px] font-medium text-[#1a1c1e]">{ar ? "٠" : "0"}</p>
          </div>
          <div className="mb-2">
            <p className="text-[8px] text-[#6d797a]/60">{ar ? "مدة الإلقاء" : "Est. delivery"}</p>
            <p className="text-[9px] font-medium text-[#1a1c1e]">{ar ? "١ دقيقة" : "1 min"}</p>
          </div>
          <div className="h-px bg-[#bcc9ca]/20 my-2" />
          <p className="text-[7px] tracking-[2px] text-[#6d797a]/60 mb-1.5">{ar ? "الأقسام" : "SECTIONS"}</p>
          {sections.map((s, i) => (
            <div key={s} className={`flex items-center gap-1 text-[8px] px-1 py-0.5 ${i === 0 ? "bg-[#f3f0ea] text-[#1a1c1e] font-medium" : "text-[#6d797a]"}`}>
              <span className={`w-1 h-1 rounded-full ${i === 0 ? "bg-[#00666d]" : "bg-[#bcc9ca]"}`} />
              {s}
            </div>
          ))}
          <div className="h-px bg-[#bcc9ca]/20 my-2" />
          <p className="text-[7px] tracking-[2px] text-[#6d797a]/60 mb-1">{ar ? "ملاحظات" : "NOTES"}</p>
          <div className="bg-[#f9f9fc] border border-[#bcc9ca]/20 p-1.5 text-[8px] text-[#bcc9ca]">{ar ? "ملاحظات خاصة..." : "Private notes..."}</div>
        </div>
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex items-center justify-between px-3 py-1.5 border-b border-[#bcc9ca]/20 bg-[#fdfcfa]">
            <div className="flex bg-[#f3f0ea] p-0.5 gap-px">
              {langModes.map((m, i) => (
                <span key={m} className={`text-[8px] px-1.5 py-0.5 ${i === 0 ? "bg-white text-[#1a1c1e] border border-[#bcc9ca]/20" : "text-[#6d797a]"}`}>{m}</span>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-1 px-3 py-1 mx-3 mt-2 bg-[#fcfaf6] border border-[#bcc9ca]/20">
            <span className="text-[9px] px-1.5 py-0.5 border border-[#bcc9ca]/20 bg-white text-[#1a1c1e]/70 font-bold">B</span>
            <span className="text-[9px] px-1.5 py-0.5 border border-[#bcc9ca]/20 bg-white text-[#1a1c1e]/70 italic">I</span>
            <span className="text-[9px] px-1.5 py-0.5 border border-[#bcc9ca]/20 bg-white text-[#1a1c1e]/70 underline">U</span>
            <div className="w-px h-3 bg-[#bcc9ca]/30 mx-0.5" />
            <span className="material-symbols-outlined text-[12px] text-[#1a1c1e]/70 px-1 py-0.5 border border-[#bcc9ca]/20 bg-white">format_list_bulleted</span>
            <span className="material-symbols-outlined text-[12px] text-[#1a1c1e]/70 px-1 py-0.5 border border-[#bcc9ca]/20 bg-white">format_quote</span>
          </div>
          <div className="px-3 pt-2">
            <p className="text-sm font-bold text-[#1a1c1e]">{ar ? "الاعتصام بحبل الله جميعاً" : "Holding fast to Allah’s rope together"}</p>
          </div>
          <div className="flex-1 px-3 pt-2">
            <div className="bg-white border border-[#bcc9ca]/20 p-2.5">
              <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-[#f0ede7]">
                <div>
                  <p className="text-[7px] tracking-[2px] text-[#bcc9ca]">{ar ? "المقدمة" : "OPENING"}</p>
                  <p className="text-[8px] text-[#6d797a] hidden md:block">{ar ? "ابدأ بالحمد وحدّد موضوع الخطبة للمصلّين." : "Begin with praise and set the theme for the congregation."}</p>
                </div>
                <div className="flex gap-0.5">
                  <span className="w-4 h-4 flex items-center justify-center border border-[#bcc9ca]/20 bg-[#f5f2eb] text-[#6d797a] text-[8px]">▲</span>
                  <span className="w-4 h-4 flex items-center justify-center border border-[#bcc9ca]/20 bg-[#f5f2eb] text-[#6d797a] text-[8px]">▼</span>
                </div>
              </div>
              <p className="text-[10px] text-[#bcc9ca] text-right" dir="rtl">اكتب خطبتك هنا...</p>
              <div className="border-t border-[#f0ede7] mt-2 pt-2">
                <p className="text-[9px] text-[#bcc9ca] italic">{ar ? "اكتب الترجمة الإنجليزية أو الملاحظات هنا..." : "Write the English translation or notes here..."}</p>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between px-3 py-1 border-t border-[#bcc9ca]/20 bg-white text-[7px] text-[#6d797a]/60">
            <span>{ar ? "لم يُحفظ بعد" : "Not saved yet"}</span>
            <span>{ar ? "عربي+إنجليزي · ٠ كلمة · ~١ د" : "AR+EN · 0 words · ~1 min"}</span>
          </div>
        </div>
        <div className={`hidden lg:flex w-[140px] ${ar ? "border-r" : "border-l"} border-[#bcc9ca]/20 bg-white p-2.5 flex-col shrink-0`}>
          <p className="text-[7px] tracking-[2px] text-[#6d797a]/60 mb-1.5">{ar ? "الجاهزية" : "READINESS"}</p>
          <div className="flex items-center gap-1.5 mb-1.5">
            <div className="flex-1 h-1 bg-[#f9f9fc] overflow-hidden">
              <div className="h-full bg-[#C4A35A] w-[16%]" />
            </div>
            <span className="text-[8px] font-bold text-[#6d797a]">{ar ? "١/٦" : "1/6"}</span>
          </div>
          {checklist.map((c) => (
            <div key={c.label} className={`flex items-start gap-1 text-[7px] px-1.5 py-1 mb-0.5 ${c.done ? "bg-green-50/50" : "bg-[#f9f9fc]"}`}>
              <span className={`material-symbols-outlined text-[10px] ${c.done ? "text-green-600" : "text-[#bcc9ca]"}`}>
                {c.done ? "check_circle" : "radio_button_unchecked"}
              </span>
              <span className={c.done ? "text-green-700" : "text-[#6d797a]"}>
                {c.label}{c.req && !c.done && <span className={`text-red-400 ${ar ? "mr-0.5" : "ml-0.5"}`}>*</span>}
              </span>
            </div>
          ))}
          <div className="w-full mt-2 text-[8px] font-bold py-1.5 bg-[#bcc9ca]/30 text-[#bcc9ca] text-center">
            {ar ? "إرسال للمراجعة" : "Submit for Review"}
          </div>
          <p className="text-[7px] text-red-400 mt-1">{ar ? "أكمل العناصر المطلوبة (*) أولاً" : "Complete required items (*) first"}</p>
          <div className="h-px bg-[#bcc9ca]/20 my-2" />
          <p className="text-[7px] tracking-[2px] text-[#6d797a]/60 mb-1">{ar ? "هدف الكلمات" : "WORD TARGET"}</p>
          <div className="flex items-baseline gap-1 mb-1">
            <span className="text-sm font-bold text-[#1a1c1e]">{ar ? "٠" : "0"}</span>
            <span className="text-[8px] text-[#6d797a]">{ar ? "/ ١٥٠٠" : "/ 1500"}</span>
          </div>
          <div className="w-full h-1 bg-[#f9f9fc]"><div className="h-full bg-[#00666d] w-0" /></div>
          <p className="text-[7px] text-[#6d797a]/60 mt-0.5">{ar ? "~٢٠ دقيقة هدف الخطبة" : "~20 min khutbah target"}</p>
        </div>
      </div>
    </div>
  );
}

const mockups: Record<string, (lang: string) => React.ReactNode> = {
  dashboard: (lang) => <DashboardMockup lang={lang} />,
  annual: (lang) => <AnnualPlanMockup lang={lang} />,
  calendar: (lang) => <CalendarMockup lang={lang} />,
  editor: (lang) => <EditorMockup lang={lang} />,
};

export default function WorkspacePreview({ lang = "en" }: { lang?: "en" | "ar" }) {
  const [activeTab, setActiveTab] = useState("annual");
  const sidebarActive = activeTab === "annual" ? "annual" : activeTab === "calendar" ? "calendar" : activeTab === "editor" ? "sermons" : "dashboard";
  const renderMockup = mockups[activeTab];

  return (
    <section id="features" className="py-28 md:py-40 px-5 md:px-8 bg-white scroll-mt-20 overflow-hidden">
      <div className="text-center mb-12 md:mb-16 max-w-4xl mx-auto">
        <h2 className="text-3xl sm:text-5xl md:text-6xl font-bold text-ink tracking-[-0.02em] leading-[1.08] mb-5">
          {lang === "ar" ? "كل ما تحتاجه لتخطيط عامك" : "Everything you need to plan your year"}
        </h2>
        <p className="text-lg md:text-xl text-ink/50 max-w-2xl mx-auto">
          {lang === "ar" ? "أربع واجهات متصلة، من الخطة السنوية إلى إلقاء الجمعة." : "Four connected surfaces, from the annual plan down to Friday’s delivery."}
        </p>
        <div className="flex justify-center gap-1 mt-8 bg-surface p-1 w-fit mx-auto flex-wrap">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 md:px-6 py-2 font-bold text-sm transition-all flex items-center gap-1.5 ${
                activeTab === tab.id
                  ? "bg-primary text-white shadow-md"
                  : "text-mute hover:bg-primary/5"
              }`}
            >
              <span className="material-symbols-outlined text-base hidden sm:inline">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </div>
      <div className="relative max-w-5xl mx-auto">
        <div className="bg-gray-900 rounded-3xl p-4 shadow-2xl overflow-hidden border-8 border-gray-100">
          <div className="bg-[#FAF7F2] min-h-[460px] md:min-h-[500px] rounded-xl flex overflow-hidden">
            <SidebarMockup active={sidebarActive} />
            {renderMockup(lang)}
          </div>
        </div>
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-accent-gold/10 rounded-full blur-3xl -z-10" />
        <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-primary/10 rounded-full blur-3xl -z-10" />
      </div>
    </section>
  );
}
