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

function DashboardMockup() {
  return (
    <div className="flex-1 flex min-w-0">
      <div className="flex-1 p-4 md:p-5 overflow-hidden">
        <div className="flex items-center justify-between mb-4">
          <p className="text-[11px] text-[#3d494a]">Asalamu alaykom, <span className="text-[#00666d] font-semibold">Ahmed</span> <span className="hidden md:inline text-[#6d797a] text-[10px]">— السلام عليكم ورحمة الله وبركاته</span></p>
          <button className="bg-[#00666d] text-white text-[9px] px-2.5 py-1 font-bold">+ New sermon</button>
        </div>
        <div className="grid grid-cols-4 gap-1.5 mb-4">
          {[
            { v: "33", l: "Total sermons", icon: "description" },
            { v: "15", l: "Drafts", icon: "edit_note" },
            { v: "14", l: "Ready to deliver", icon: "check_circle" },
            { v: "1", l: "Delivered", icon: "event_available" },
          ].map((s) => (
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
          <p className="text-[10px] font-semibold text-[#3d494a]">0 total words written</p>
        </div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-[8px] font-bold text-[#6d797a] tracking-[2px] uppercase">Recent Sermons</p>
          <span className="text-[9px] text-[#00666d] font-semibold">View all →</span>
        </div>
        {[
          { t: "The beauty of Tawheed", date: "FRI, JAN 2, 2026", theme: "FOUNDATIONS OF FAITH" },
          { t: "Patience in testing — a mark of faith", date: "FRI, JAN 9, 2026", theme: "FOUNDATIONS OF FAITH" },
          { t: "Certainty in God and daily life", date: "FRI, JAN 16, 2026", theme: "FOUNDATIONS OF FAITH" },
        ].map((s, i) => (
          <div key={i} className="bg-white border border-[#bcc9ca]/15 p-2.5 mb-1 flex items-center justify-between">
            <div>
              <p className="text-[9px] text-[#6d797a] mb-0.5">{s.date}</p>
              <p className="text-[10px] font-semibold text-[#1a1c1e]">{s.t}</p>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="text-[7px] font-bold px-1.5 py-0.5 bg-green-50 text-green-700">READY</span>
                <span className="text-[7px] font-bold px-1.5 py-0.5 bg-[#C4A35A]/10 text-[#C4A35A]">{s.theme}</span>
                <span className="text-[7px] text-[#6d797a]">0 words</span>
              </div>
            </div>
            <p className="text-[8px] text-[#bcc9ca] shrink-0">Edited 2d ago</p>
          </div>
        ))}
      </div>
      {/* Right sidebar */}
      <div className="hidden lg:block w-[180px] border-l border-[#bcc9ca]/20 p-3 shrink-0">
        <p className="text-[8px] font-bold text-[#6d797a] tracking-[2px] uppercase mb-2">This Week</p>
        <div className="bg-[#00666d]/5 p-2.5 mb-4">
          <p className="text-[9px] text-[#6d797a]">Next Friday</p>
          <p className="text-[10px] font-semibold text-[#00666d]">Friday, July 10</p>
          <p className="text-[8px] text-[#6d797a] mt-1">Holding fast to Allah&apos;s rope — <span className="font-bold text-[#C4A35A]">PLANNED</span></p>
        </div>
        <p className="text-[8px] font-bold text-[#6d797a] tracking-[2px] uppercase mb-2">Upcoming</p>
        {[
          { date: "JUL 9", t: "Holding fast to Allah's..." },
          { date: "JUL 16", t: "Repairing broken ties..." },
          { date: "JUL 23", t: "Respecting difference..." },
        ].map((s, i) => (
          <div key={i} className="flex items-start gap-2 py-1.5">
            <span className="text-[8px] font-bold text-[#00666d] min-w-[30px]">{s.date}</span>
            <div>
              <p className="text-[9px] text-[#1a1c1e] truncate">{s.t}</p>
              <span className="text-[7px] font-bold px-1 py-px bg-[#C4A35A]/10 text-[#C4A35A]">{i === 0 ? "PLANNED" : "DRAFT"}</span>
            </div>
          </div>
        ))}
        <p className="text-[8px] font-bold text-[#6d797a] tracking-[2px] uppercase mb-2 mt-4">Quick Actions</p>
        {[
          { icon: "add", label: "New sermon" },
          { icon: "list", label: "All sermons" },
          { icon: "calendar_month", label: "Annual plan" },
        ].map((a) => (
          <div key={a.label} className="flex items-center gap-1.5 text-[9px] text-[#1a1c1e] px-2 py-1.5 bg-white border border-[#bcc9ca]/15 mb-0.5">
            <span className="material-symbols-outlined text-[#00666d] text-[12px]">{a.icon}</span>
            {a.label}
          </div>
        ))}
      </div>
    </div>
  );
}

function AnnualPlanMockup() {
  const themes = [
    { name: "Foundations of Faith", color: "#00666d", months: "Jan – Mar", subs: [
      { name: "Tawheed & Sincerity", sermons: ["The beauty of Tawheed", "Patience in testing, a mark of faith"] },
      { name: "Trust in Allah", sermons: ["Certainty in God and daily life", "Living with trust in Allah"] },
    ], count: 9, status: "9 written" },
    { name: "Family & Society", color: "#C4A35A", months: "Apr – Jun", subs: [
      { name: "Truthfulness & Integrity", sermons: ["Truthfulness in speech", "Integrity beyond appearance"] },
    ], count: 8, status: "6 written · 1 planned" },
  ];
  return (
    <div className="flex-1 p-4 md:p-5 overflow-hidden">
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="flex items-center gap-2">
            <p className="text-sm font-bold text-[#00666d] italic">Full year plan — 2026</p>
            <span className="text-[9px] text-[#6d797a]">‹ 2026 ›</span>
          </div>
          <p className="text-[9px] text-[#6d797a]">4 seasons · 16 sub-bouquets · 52 Fridays</p>
        </div>
        <button className="bg-[#00666d] text-white text-[9px] px-2.5 py-1 font-bold">Export year plan</button>
      </div>
      {/* Stats strip */}
      <div className="flex border border-[#bcc9ca]/20 bg-white/60 mb-3">
        {[
          { v: "52", l: "FRIDAYS" },
          { v: "9", l: "SERIES 1" },
          { v: "8", l: "THEME 2" },
          { v: "8", l: "THEME 3" },
          { v: "15", l: "WRITTEN" },
          { v: "33", l: "TOTAL" },
        ].map((s, i) => (
          <div key={i} className="flex-1 px-2 py-2 text-center border-r border-[#bcc9ca]/15 last:border-r-0">
            <p className="text-sm font-bold text-[#00666d]">{s.v}</p>
            <p className="text-[6px] font-bold tracking-[1px] text-[#6d797a] uppercase">{s.l}</p>
          </div>
        ))}
      </div>
      {/* Filters */}
      <div className="flex gap-1 mb-2 flex-wrap">
        {["All themes", "Foundations of Faith", "Family & Society", "Unity & Knowledge"].map((f, i) => (
          <span key={f} className={`text-[8px] font-bold px-2 py-1 ${i === 0 ? "bg-[#00666d] text-white" : "bg-white border border-[#bcc9ca]/30 text-[#6d797a]"}`}>{f}</span>
        ))}
      </div>
      <div className="flex gap-1 mb-3">
        {["All", "Written", "Planned", "Delivered", "Not started"].map((f, i) => (
          <span key={f} className={`text-[7px] font-bold px-2 py-0.5 ${i === 0 ? "bg-[#00666d] text-white" : "bg-white/70 border border-[#bcc9ca]/25 text-[#6d797a]"}`}>{f}</span>
        ))}
      </div>
      {/* Action buttons */}
      <div className="flex gap-1.5 mb-3">
        <span className="text-[8px] font-bold px-2 py-1 bg-[#00666d] text-white">+ Add main theme</span>
        <span className="text-[8px] font-bold px-2 py-1 border border-[#bcc9ca]/30 text-[#3d494a]">+ Add sub-theme</span>
        <span className="text-[8px] font-bold px-2 py-1 border border-[#bcc9ca]/30 text-[#3d494a]">+ Add Friday</span>
      </div>
      {/* Theme blocks */}
      {themes.map((t) => (
        <div key={t.name} className="bg-white/70 border border-[#bcc9ca]/20 p-3 mb-2">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5" style={{ backgroundColor: t.color }} />
              <p className="text-[11px] font-bold text-[#1a1c1e]">{t.name}</p>
              <span className="text-[8px] text-[#6d797a]">{t.months}</span>
            </div>
            <span className="text-[8px] text-[#6d797a]">{t.status}</span>
          </div>
          {t.subs.map((sub) => (
            <div key={sub.name} className="pl-4 mb-1.5">
              <p className="text-[9px] font-semibold text-[#3d494a] mb-0.5 flex items-center gap-1">
                <span className="text-[#bcc9ca]">├</span> {sub.name}
              </p>
              {sub.sermons.map((s) => (
                <div key={s} className="pl-4 flex items-center justify-between py-0.5">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[#bcc9ca] text-[8px]">│ └</span>
                    <span className="text-[8px] text-[#6d797a]">FRI</span>
                    <span className="text-[8px] text-[#1a1c1e]">{s}</span>
                  </div>
                  <span className="text-[7px] font-bold px-1 py-px bg-green-50 text-green-700">Written</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

function CalendarMockup() {
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const weeks = [
    [null, null, 1, 2, 3, 4, 5],
    [6, 7, 8, 9, 10, 11, 12],
    [13, 14, 15, 16, 17, 18, 19],
    [20, 21, 22, 23, 24, 25, 26],
    [27, 28, 29, 30, 31, null, null],
  ];
  const sermonDays: Record<number, { title: string; status: string }> = {
    3: { title: "Brotherhood as a shield", status: "ready" },
    10: { title: "Holding fast to Allah's rope", status: "ready" },
    17: { title: "Repairing broken ties", status: "draft" },
    24: { title: "Respecting difference", status: "draft" },
  };
  const statusColors: Record<string, { bg: string; text: string; label: string }> = {
    ready: { bg: "#e8f5ee", text: "#1f7a4d", label: "Ready" },
    draft: { bg: "#f0eeeb", text: "#6d797a", label: "Not started" },
  };
  return (
    <div className="flex-1 p-4 md:p-5 overflow-hidden">
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-sm font-bold text-[#00666d] italic">July 2026</p>
          <p className="text-[9px] text-[#6d797a]">4 sermons this month</p>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[9px] font-bold px-2 py-1 border border-[#bcc9ca]/30 bg-white text-[#3d494a]">Today</span>
          <span className="text-[9px] text-[#6d797a]">‹ ›</span>
          <span className="text-[9px] font-bold px-2 py-1 bg-[#00666d] text-white">Month</span>
          <span className="text-[9px] font-bold px-2 py-1 border border-[#bcc9ca]/30 bg-white text-[#3d494a]">Year</span>
        </div>
      </div>
      {/* Stats strip */}
      <div className="flex border border-[#bcc9ca]/20 bg-white/60 mb-3">
        {[
          { v: "4", l: "SERMONS", highlight: true },
          { v: "0", l: "WRITTEN" },
          { v: "2", l: "PLANNED", gold: true },
          { v: "2", l: "NOT STARTED" },
        ].map((s, i) => (
          <div key={i} className="flex-1 px-2 py-2 text-center border-r border-[#bcc9ca]/15 last:border-r-0">
            <p className={`text-sm font-bold ${s.gold ? "text-[#C4A35A]" : s.highlight ? "text-[#00666d]" : "text-[#6d797a]"}`}>{s.v}</p>
            <p className="text-[6px] font-bold tracking-[1px] text-[#6d797a] uppercase">{s.l}</p>
          </div>
        ))}
      </div>
      <div className="border border-[#bcc9ca]/20 bg-white/40">
        <div className="grid grid-cols-7 border-b border-[#bcc9ca]/20">
          {days.map((d) => (
            <div key={d} className={`text-[7px] font-bold tracking-[1px] uppercase text-center py-1 border-r border-[#bcc9ca]/10 last:border-r-0 ${d === "Fri" ? "text-[#00666d] bg-[#00666d]/[0.03]" : "text-[#6d797a]"}`}>
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
                  } ${di === 5 ? "bg-[#00666d]/[0.02]" : ""} ${day === 10 ? "bg-[#00666d]/[0.06]" : ""}`}
                >
                  {day && (
                    <>
                      <span className={`text-[8px] font-bold inline-flex items-center justify-center ${day === 10 ? "bg-[#00666d] text-white w-3.5 h-3.5 rounded-full" : di === 5 ? "text-[#00666d]" : "text-[#3d494a]"}`}>
                        {day}
                      </span>
                      {sermon && st && (
                        <div className="mt-0.5 hidden md:block" style={{ borderLeft: "2px solid #4a7c59" }}>
                          <p className="text-[6px] font-semibold text-[#1a1c1e] truncate pl-0.5">{sermon.title}</p>
                          <span className="text-[5px] font-bold px-0.5 ml-0.5" style={{ backgroundColor: st.bg, color: st.text }}>{st.label}</span>
                        </div>
                      )}
                      {di === 5 && !sermon && (
                        <p className="text-[5px] text-[#bcc9ca] italic hidden md:block">Jumu&apos;ah</p>
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

function EditorMockup() {
  return (
    <div className="flex-1 flex flex-col min-w-0">
      {/* Top bar */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-[#bcc9ca]/20 bg-white gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-[9px] px-1.5 py-0.5 border border-[#bcc9ca]/30 bg-white text-[#1a1c1e]">← Sermons</span>
          <span className="text-[9px] text-[#1a1c1e] italic truncate hidden md:inline">Holding fast to Allah&apos;s rope together — Jul 10, 2026</span>
          <span className="text-[7px] font-bold px-1.5 py-0.5 bg-[#C4A35A]/10 text-[#C4A35A] hidden md:inline">UNITY & KNOWLEDGE</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[8px] font-bold px-1.5 py-0.5 bg-orange-50 text-orange-600 flex items-center gap-0.5">
            <span className="material-symbols-outlined text-[10px]">rate_review</span>
            <span className="hidden sm:inline">IN REVIEW</span>
          </span>
          <span className="text-[8px] px-1.5 py-0.5 border border-[#bcc9ca]/30 text-red-500 hidden md:inline">Delete</span>
          <span className="text-[8px] px-1.5 py-0.5 border border-[#bcc9ca]/30 text-[#1a1c1e] hidden md:inline">Export</span>
          <span className="text-[8px] px-2 py-0.5 bg-[#00666d] text-white font-semibold">Save</span>
        </div>
      </div>
      {/* 3-column layout */}
      <div className="flex-1 flex min-h-0">
        {/* Left — Speech info */}
        <div className="hidden md:flex w-[120px] border-r border-[#bcc9ca]/20 bg-white p-2.5 flex-col shrink-0">
          <p className="text-[7px] tracking-[2px] text-[#6d797a]/60 mb-1.5">SPEECH INFO</p>
          <div className="mb-2">
            <p className="text-[8px] text-[#6d797a]/60">Date</p>
            <p className="text-[9px] font-medium text-[#1a1c1e]">2026-07-10</p>
          </div>
          <div className="mb-2">
            <p className="text-[8px] text-[#6d797a]/60">Status</p>
            <p className="text-[9px] font-medium text-[#1a1c1e]">IN REVIEW</p>
          </div>
          <div className="mb-2">
            <p className="text-[8px] text-[#6d797a]/60">Words</p>
            <p className="text-[9px] font-medium text-[#1a1c1e]">0</p>
          </div>
          <div className="mb-2">
            <p className="text-[8px] text-[#6d797a]/60">Est. delivery</p>
            <p className="text-[9px] font-medium text-[#1a1c1e]">1 min</p>
          </div>
          <div className="h-px bg-[#bcc9ca]/20 my-2" />
          <p className="text-[7px] tracking-[2px] text-[#6d797a]/60 mb-1.5">SECTIONS</p>
          {["Opening", "Main theme", "Second khutbah"].map((s, i) => (
            <div key={s} className={`flex items-center gap-1 text-[8px] px-1 py-0.5 ${i === 0 ? "bg-[#f3f0ea] text-[#1a1c1e] font-medium" : "text-[#6d797a]"}`}>
              <span className={`w-1 h-1 rounded-full ${i === 0 ? "bg-[#00666d]" : "bg-[#bcc9ca]"}`} />
              {s}
            </div>
          ))}
          <div className="h-px bg-[#bcc9ca]/20 my-2" />
          <p className="text-[7px] tracking-[2px] text-[#6d797a]/60 mb-1">NOTES</p>
          <div className="bg-[#f9f9fc] border border-[#bcc9ca]/20 p-1.5 text-[8px] text-[#bcc9ca]">Private notes...</div>
        </div>
        {/* Center — Editor */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex items-center justify-between px-3 py-1.5 border-b border-[#bcc9ca]/20 bg-[#fdfcfa]">
            <div className="flex bg-[#f3f0ea] p-0.5 gap-px">
              {["Arabic first", "English first", "AR only", "EN only"].map((m, i) => (
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
            <p className="text-sm font-bold text-[#1a1c1e]">Holding fast to Allah&apos;s rope together</p>
          </div>
          <div className="flex-1 px-3 pt-2">
            <div className="bg-white border border-[#bcc9ca]/20 p-2.5">
              <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-[#f0ede7]">
                <div>
                  <p className="text-[7px] tracking-[2px] text-[#bcc9ca]">OPENING</p>
                  <p className="text-[8px] text-[#6d797a] hidden md:block">Begin with praise and set the theme for the congregation.</p>
                </div>
                <div className="flex gap-0.5">
                  <span className="w-4 h-4 flex items-center justify-center border border-[#bcc9ca]/20 bg-[#f5f2eb] text-[#6d797a] text-[8px]">▲</span>
                  <span className="w-4 h-4 flex items-center justify-center border border-[#bcc9ca]/20 bg-[#f5f2eb] text-[#6d797a] text-[8px]">▼</span>
                </div>
              </div>
              <p className="text-[10px] text-[#bcc9ca] text-right" dir="rtl">اكتب خطبتك هنا...</p>
              <div className="border-t border-[#f0ede7] mt-2 pt-2">
                <p className="text-[9px] text-[#bcc9ca] italic">Write the English translation or notes here...</p>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between px-3 py-1 border-t border-[#bcc9ca]/20 bg-white text-[7px] text-[#6d797a]/60">
            <span>Not saved yet</span>
            <span>AR+EN · 0 words · ~1 min</span>
          </div>
        </div>
        {/* Right — Checklist */}
        <div className="hidden lg:flex w-[140px] border-l border-[#bcc9ca]/20 bg-white p-2.5 flex-col shrink-0">
          <p className="text-[7px] tracking-[2px] text-[#6d797a]/60 mb-1.5">READINESS</p>
          <div className="flex items-center gap-1.5 mb-1.5">
            <div className="flex-1 h-1 bg-[#f9f9fc] overflow-hidden">
              <div className="h-full bg-[#C4A35A] w-[16%]" />
            </div>
            <span className="text-[8px] font-bold text-[#6d797a]">1/6</span>
          </div>
          {[
            { label: "Sermon title set", done: true },
            { label: "Arabic content written", done: false, req: true },
            { label: "English translation", done: false, req: true },
            { label: "Scheduled date set", done: false, req: true },
            { label: "Within target (15-25 min)", done: false },
            { label: "References cited", done: false },
          ].map((c) => (
            <div key={c.label} className={`flex items-start gap-1 text-[7px] px-1.5 py-1 mb-0.5 ${c.done ? "bg-green-50/50" : "bg-[#f9f9fc]"}`}>
              <span className={`material-symbols-outlined text-[10px] ${c.done ? "text-green-600" : "text-[#bcc9ca]"}`}>
                {c.done ? "check_circle" : "radio_button_unchecked"}
              </span>
              <span className={c.done ? "text-green-700" : "text-[#6d797a]"}>
                {c.label}{c.req && !c.done && <span className="text-red-400 ml-0.5">*</span>}
              </span>
            </div>
          ))}
          <div className="w-full mt-2 text-[8px] font-bold py-1.5 bg-[#bcc9ca]/30 text-[#bcc9ca] text-center">
            Submit for Review
          </div>
          <p className="text-[7px] text-red-400 mt-1">Complete required items (*) first</p>
          <div className="h-px bg-[#bcc9ca]/20 my-2" />
          <p className="text-[7px] tracking-[2px] text-[#6d797a]/60 mb-1">WORD TARGET</p>
          <div className="flex items-baseline gap-1 mb-1">
            <span className="text-sm font-bold text-[#1a1c1e]">0</span>
            <span className="text-[8px] text-[#6d797a]">/ 1500</span>
          </div>
          <div className="w-full h-1 bg-[#f9f9fc]"><div className="h-full bg-[#00666d] w-0" /></div>
          <p className="text-[7px] text-[#6d797a]/60 mt-0.5">~20 min khutbah target</p>
        </div>
      </div>
    </div>
  );
}

const mockups: Record<string, () => React.ReactNode> = {
  dashboard: DashboardMockup,
  annual: AnnualPlanMockup,
  calendar: CalendarMockup,
  editor: EditorMockup,
};

export default function WorkspacePreview({ lang = "en" }: { lang?: "en" | "ar" }) {
  const [activeTab, setActiveTab] = useState("annual");
  const sidebarActive = activeTab === "annual" ? "annual" : activeTab === "calendar" ? "calendar" : activeTab === "editor" ? "sermons" : "dashboard";
  const MockupComponent = mockups[activeTab];

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
            <MockupComponent />
          </div>
        </div>
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-accent-gold/10 rounded-full blur-3xl -z-10" />
        <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-primary/10 rounded-full blur-3xl -z-10" />
      </div>
    </section>
  );
}
