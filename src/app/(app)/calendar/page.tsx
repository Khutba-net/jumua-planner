"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { getHijriEventsForYear, type ResolvedHijriEvent } from "@/lib/hijri-events";
import { useI18n } from "@/lib/i18n";

interface Sermon {
  id: string;
  title: string;
  status: string;
  scheduled_date: string | null;
  theme_id: string | null;
}

interface Theme {
  id: string;
  name: string;
  color: string | null;
  month: number;
  year: number;
}

const DAY_KEYS = ["day.sun", "day.mon", "day.tue", "day.wed", "day.thu", "day.fri", "day.sat"];
const DAY_SHORT_KEYS = ["day.short.sun", "day.short.mon", "day.short.tue", "day.short.wed", "day.short.thu", "day.short.fri", "day.short.sat"];

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function getCalendarDays(year: number, month: number) {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startOffset = firstDay.getDay();
  const days: (Date | null)[] = [];

  for (let i = 0; i < startOffset; i++) days.push(null);
  for (let d = 1; d <= lastDay.getDate(); d++) days.push(new Date(year, month, d));
  while (days.length % 7 !== 0) days.push(null);

  return days;
}

export default function CalendarPage() {
  const { t, isAr } = useI18n();
  const [sermons, setSermons] = useState<Sermon[]>([]);
  const [themes, setThemes] = useState<Theme[]>([]);
  const [loading, setLoading] = useState(true);

  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [view, setView] = useState<"month" | "year">("month");
  const yearHijriEvents = useMemo(() => getHijriEventsForYear(year), [year]);
  const monthHijriEvents = useMemo(() => yearHijriEvents.filter(e => e.gregorianDate.getMonth() === month), [yearHijriEvents, month]);

  const STATUS_MAP: Record<string, { bg: string; text: string; label: string }> = {
    draft: { bg: "#f0eeeb", text: "#6d797a", label: t("status.notStarted") },
    ready: { bg: "#e8f5ee", text: "#00666d", label: t("status.written") },
    delivered: { bg: "#eef2f7", text: "#5b7fa6", label: t("status.delivered") },
    archived: { bg: "#f0eeeb", text: "#6d797a", label: t("status.archived") },
  };

  useEffect(() => {
    Promise.all([
      fetch("/api/sermons").then((r) => r.ok ? r.json() : []),
      fetch("/api/themes").then((r) => r.ok ? r.json() : []),
    ])
      .then(([s, t]) => {
        setSermons(Array.isArray(s) ? s : []);
        setThemes(Array.isArray(t) ? t : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  function getThemeColor(themeId: string | null) {
    if (!themeId) return "#6d797a";
    const theme = themes.find((t) => t.id === themeId);
    return theme?.color || "#00666d";
  }

  function getThemeName(themeId: string | null) {
    if (!themeId) return null;
    const theme = themes.find((t) => t.id === themeId);
    return theme?.name || null;
  }

  function getSermonsForDate(date: Date) {
    return sermons.filter((s) => {
      if (!s.scheduled_date) return false;
      const sd = new Date(s.scheduled_date);
      return isSameDay(sd, date);
    });
  }

  function getHijriEventsForDate(date: Date): ResolvedHijriEvent[] {
    return yearHijriEvents.filter((e) => isSameDay(e.gregorianDate, date));
  }

  function prevMonth() {
    if (month === 0) { setMonth(11); setYear(year - 1); }
    else setMonth(month - 1);
  }

  function nextMonth() {
    if (month === 11) { setMonth(0); setYear(year + 1); }
    else setMonth(month + 1);
  }

  function goToday() {
    setYear(now.getFullYear());
    setMonth(now.getMonth());
  }

  const days = getCalendarDays(year, month);
  const today = new Date();

  const monthSermons = sermons.filter((s) => {
    if (!s.scheduled_date) return false;
    const d = new Date(s.scheduled_date);
    return d.getFullYear() === year && d.getMonth() === month;
  });

  const writtenCount = monthSermons.filter((s) => s.status === "ready" || s.status === "delivered").length;
  const draftCount = monthSermons.filter((s) => s.status === "draft").length;

  function renderMiniMonth(m: number) {
    const miniDays = getCalendarDays(year, m);
    const monthSermonsForMini = sermons.filter((s) => {
      if (!s.scheduled_date) return false;
      const d = new Date(s.scheduled_date);
      return d.getFullYear() === year && d.getMonth() === m;
    });
    const miniHijriEvents = yearHijriEvents.filter((e) => e.gregorianDate.getMonth() === m);

    return (
      <div
        key={m}
        className="bg-white/50 border border-[#bcc9ca]/20 p-3 cursor-pointer hover:bg-white/80 transition-colors"
        onClick={() => { setMonth(m); setView("month"); }}
      >
        <p className="text-[11px] font-bold text-[#00666d] mb-2">{t(`month.${m}`)}</p>
        <div className="grid grid-cols-7 gap-px text-[8px] text-center">
          {DAY_SHORT_KEYS.map((dk) => (
            <div key={dk} className="text-[#bcc9ca] font-bold py-0.5">{t(dk)}</div>
          ))}
          {miniDays.map((day, i) => {
            if (!day) return <div key={`e-${i}`} />;
            const hasSermon = monthSermonsForMini.some((s) => {
              const sd = new Date(s.scheduled_date!);
              return isSameDay(sd, day);
            });
            const hasHijriEvent = miniHijriEvents.some((e) => isSameDay(e.gregorianDate, day));
            const isToday = isSameDay(day, today);
            const isFriday = day.getDay() === 5;

            return (
              <div
                key={i}
                className={`py-0.5 ${isToday ? "bg-[#00666d] text-white font-bold" : ""} ${
                  hasHijriEvent && !isToday ? "bg-[#C4A35A]/15 font-bold text-[#C4A35A]" :
                  isFriday && !isToday ? "text-[#00666d] font-bold" : "text-[#3d494a]"
                }`}
              >
                {day.getDate()}
                {hasSermon && !isToday && (
                  <div className="w-1 h-1 rounded-full bg-[#C4A35A] mx-auto -mt-0.5" />
                )}
              </div>
            );
          })}
        </div>
        {monthSermonsForMini.length > 0 && (
          <p className="text-[9px] text-[#6d797a] mt-2 font-medium">
            {monthSermonsForMini.length} {monthSermonsForMini.length !== 1 ? t("cal.sermonsLower") : t("cal.sermon")}
          </p>
        )}
        {miniHijriEvents.length > 0 && (
          <div className="mt-1">
            {miniHijriEvents.map((e) => (
              <p key={e.name} className="text-[8px] font-bold truncate" style={{ color: e.color }}>
                {e.gregorianDate.getDate()} — {isAr ? e.nameAr : e.name}
              </p>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF7F2]">
      {/* Header */}
      <div className="px-4 sm:px-6 lg:px-10 pt-6 pb-4 border-b border-[#bcc9ca]/20">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-4">
          <div>
            <h1
              className="text-2xl sm:text-3xl font-bold text-[#00666d] italic tracking-tight"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              {view === "month" ? `${t(`month.${month}`)} ${year}` : `${t("nav.calendar")} — ${year}`}
            </h1>
            <p className="text-[12px] text-[#6d797a] mt-0.5">
              {view === "month"
                ? `${monthSermons.length} ${t("cal.sermonsThisMonth")}`
                : `${sermons.filter((s) => s.scheduled_date && new Date(s.scheduled_date).getFullYear() === year).length} ${t("cal.sermonsThisYear")}`
              }
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={goToday}
              className="text-[11px] px-3 py-1.5 border border-[#bcc9ca]/40 bg-white/70 text-[#3d494a] font-semibold hover:bg-white transition-all"
            >
              {t("cal.today")}
            </button>
            <div className="flex items-center bg-white/70 backdrop-blur-sm rounded-full border border-[#bcc9ca]/30 shadow-sm">
              <button
                onClick={view === "month" ? prevMonth : () => setYear(year - 1)}
                className="w-8 h-8 flex items-center justify-center text-[#6d797a] hover:text-[#00666d] transition-colors text-sm font-bold rounded-l-full hover:bg-[#00666d]/5"
              >
                ‹
              </button>
              <button
                onClick={view === "month" ? nextMonth : () => setYear(year + 1)}
                className="w-8 h-8 flex items-center justify-center text-[#6d797a] hover:text-[#00666d] transition-colors text-sm font-bold rounded-r-full hover:bg-[#00666d]/5"
              >
                ›
              </button>
            </div>
            <div className="flex border border-[#bcc9ca]/30 bg-white/70">
              <button
                onClick={() => setView("month")}
                className={`text-[10px] px-3 py-1.5 font-bold transition-all ${
                  view === "month" ? "bg-[#00666d] text-white" : "text-[#3d494a] hover:bg-white"
                }`}
              >
                {t("cal.month")}
              </button>
              <button
                onClick={() => setView("year")}
                className={`text-[10px] px-3 py-1.5 font-bold transition-all ${
                  view === "year" ? "bg-[#00666d] text-white" : "text-[#3d494a] hover:bg-white"
                }`}
              >
                {t("cal.year")}
              </button>
            </div>
          </div>
        </div>

        {/* Stats strip */}
        {view === "month" && (
          <div className="flex overflow-x-auto border border-[#bcc9ca]/25 bg-white/60 backdrop-blur-sm">
            <div className="flex-1 min-w-[72px] px-3 py-2.5 text-center border-r border-[#bcc9ca]/20 bg-[#00666d]/[0.04]">
              <div className="text-xl font-bold text-[#00666d]">{monthSermons.length}</div>
              <div className="text-[8px] font-bold tracking-[1px] text-[#6d797a] uppercase">{t("cal.sermons")}</div>
            </div>
            <div className="flex-1 min-w-[72px] px-3 py-2.5 text-center border-r border-[#bcc9ca]/20">
              <div className="text-xl font-bold text-[#00666d]">{writtenCount}</div>
              <div className="text-[8px] font-bold tracking-[1px] text-[#6d797a] uppercase">{t("cal.written")}</div>
            </div>
            <div className="flex-1 min-w-[72px] px-3 py-2.5 text-center border-r border-[#bcc9ca]/20">
              <div className="text-xl font-bold text-[#6d797a]">{draftCount}</div>
              <div className="text-[8px] font-bold tracking-[1px] text-[#6d797a] uppercase">{t("cal.notStarted")}</div>
            </div>
            <div className="flex-1 min-w-[72px] px-3 py-2.5 text-center">
              <div className="text-xl font-bold text-[#C4A35A]">{monthHijriEvents.length}</div>
              <div className="text-[8px] font-bold tracking-[1px] text-[#6d797a] uppercase">{t("cal.hijriEvents")}</div>
            </div>
          </div>
        )}
      </div>

      {/* Calendar body */}
      <div className="px-4 sm:px-6 lg:px-10 py-4">
        {loading ? (
          <div className="text-center py-20 text-[#6d797a] text-sm">{t("cal.loading")}</div>
        ) : view === "year" ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-px bg-[#bcc9ca]/15">
            {Array.from({ length: 12 }, (_, m) => renderMiniMonth(m))}
          </div>
        ) : (
          <div className="border border-[#bcc9ca]/20 bg-white/40">
            {/* Day headers */}
            <div className="grid grid-cols-7 border-b border-[#bcc9ca]/20">
              {DAY_KEYS.map((dk, i) => (
                <div
                  key={dk}
                  className={`text-[10px] font-bold tracking-[1px] uppercase text-center py-2 border-r border-[#bcc9ca]/10 last:border-r-0 ${
                    i === 5 ? "text-[#00666d] bg-[#00666d]/[0.03]" : "text-[#6d797a]"
                  }`}
                >
                  {t(dk)}
                </div>
              ))}
            </div>

            {/* Day grid */}
            <div className="grid grid-cols-7">
              {days.map((day, i) => {
                if (!day) {
                  return (
                    <div
                      key={`empty-${i}`}
                      className="min-h-[80px] sm:min-h-[110px] border-r border-b border-[#bcc9ca]/10 last:border-r-0 bg-[#FAF7F2]/50"
                    />
                  );
                }

                const isToday = isSameDay(day, today);
                const isFriday = day.getDay() === 5;
                const daySermons = getSermonsForDate(day);
                const dayHijriEvents = getHijriEventsForDate(day);

                return (
                  <div
                    key={i}
                    className={`min-h-[80px] sm:min-h-[110px] border-r border-b border-[#bcc9ca]/10 last:border-r-0 p-1 sm:p-1.5 transition-colors ${
                      isFriday ? "bg-[#00666d]/[0.02]" : ""
                    } ${isToday ? "bg-[#00666d]/[0.06]" : ""}`}
                  >
                    <div className="flex items-center justify-between mb-0.5">
                      <span
                        className={`text-[11px] sm:text-[12px] font-bold w-6 h-6 flex items-center justify-center ${
                          isToday
                            ? "bg-[#00666d] text-white rounded-full"
                            : isFriday
                            ? "text-[#00666d]"
                            : "text-[#3d494a]"
                        }`}
                      >
                        {day.getDate()}
                      </span>
                      {isFriday && daySermons.length === 0 && (
                        <span className="text-[8px] text-[#bcc9ca] italic hidden sm:inline">
                          {isAr ? "جمعة" : "Jumu'ah"}
                        </span>
                      )}
                    </div>

                    <div className="flex flex-col gap-0.5">
                      {daySermons.map((sermon) => {
                        const st = STATUS_MAP[sermon.status] || STATUS_MAP.draft;
                        const color = getThemeColor(sermon.theme_id);

                        return (
                          <Link
                            key={sermon.id}
                            href={`/sermons/${sermon.id}/edit`}
                            className="group block"
                          >
                            <div
                              className="flex items-start gap-1 px-1 py-0.5 hover:bg-white/80 transition-colors cursor-pointer"
                              style={{ borderLeft: isAr ? undefined : `2px solid ${color}`, borderRight: isAr ? `2px solid ${color}` : undefined }}
                            >
                              <div className="flex-1 min-w-0">
                                <p className="text-[9px] sm:text-[10px] font-semibold text-[#1a1c1e] truncate leading-tight">
                                  {sermon.title}
                                </p>
                                <div className="flex items-center gap-1 mt-0.5">
                                  <span
                                    className="text-[7px] sm:text-[8px] px-1 py-px font-bold whitespace-nowrap"
                                    style={{ backgroundColor: st.bg, color: st.text }}
                                  >
                                    {st.label}
                                  </span>
                                  <span className="text-[7px] text-[#bcc9ca] truncate hidden sm:inline">
                                    {getThemeName(sermon.theme_id)}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </Link>
                        );
                      })}
                      {dayHijriEvents.map((event) => (
                        <div
                          key={event.name}
                          className="flex items-center gap-1 px-1 py-0.5"
                          style={{ borderLeft: isAr ? undefined : `2px solid ${event.color}`, borderRight: isAr ? `2px solid ${event.color}` : undefined }}
                        >
                          <span
                            className="material-symbols-outlined text-[10px]"
                            style={{ color: event.color }}
                          >
                            {event.icon}
                          </span>
                          <p
                            className="text-[9px] sm:text-[10px] font-bold truncate leading-tight"
                            style={{ color: event.color }}
                          >
                            {isAr ? event.nameAr : event.name}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
