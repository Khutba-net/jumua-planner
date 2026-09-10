"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useI18n } from "@/lib/i18n";

interface SubTopic {
  id: string;
  name: string;
  week_number: number;
}

interface Theme {
  id: string;
  name: string;
  description: string | null;
  month: number;
  year: number;
  color: string | null;
  sub_topic_count: number;
  sermon_count: number;
  sub_topics: SubTopic[];
  mosque_id: string | null;
}

interface Sermon {
  id: string;
  title: string;
  status: string;
  type: string;
  scheduled_date: string | null;
  theme_id: string | null;
  sub_topic_id: string | null;
}

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const MONTH_SHORT = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

const SEASONS = [
  { n: 1, startMonth: 1, label: "Season 1", ar: "الموسم الأول", range: "Jan – Mar" },
  { n: 2, startMonth: 4, label: "Season 2", ar: "الموسم الثاني", range: "Apr – Jun" },
  { n: 3, startMonth: 7, label: "Season 3", ar: "الموسم الثالث", range: "Jul – Sep" },
  { n: 4, startMonth: 10, label: "Season 4", ar: "الموسم الرابع", range: "Oct – Dec" },
];

const THEME_COLORS = [
  { label: "Teal", value: "#00666d" },
  { label: "Gold", value: "#C4A35A" },
  { label: "Green", value: "#4a7c59" },
  { label: "Blue", value: "#5b7fa6" },
  { label: "Rose", value: "#8a5c6e" },
  { label: "Amber", value: "#B8860B" },
];

function useStatusMap() {
  const { t } = useI18n();
  return {
    draft: { bg: "#f0eeeb", text: "#6d797a", dot: "#bcc9ca", label: t("status.notStarted") },
    ready: { bg: "#e8f5ee", text: "#1f7a4d", dot: "#2f9e5f", label: t("status.written") },
    delivered: { bg: "#e9f0f7", text: "#3c6194", dot: "#5b7fa6", label: t("status.delivered") },
    archived: { bg: "#f0eeeb", text: "#6d797a", dot: "#bcc9ca", label: t("status.archived") },
  } as Record<string, { bg: string; text: string; dot: string; label: string }>;
}

const SLOTS_PER_SEASON = 16;
const DEFAULT_FRIDAY_SLOTS = 13;
const DEFAULT_OCCASION_SLOTS = 3;
const TARGET_SLOTS = SLOTS_PER_SEASON * 4; // 64

/* ── Hijri ↔ Gregorian conversion (Kuwaiti algorithm) ── */
function hijriToGregorian(hY: number, hM: number, hD: number): Date {
  const jd = Math.floor((11 * hY + 3) / 30) + 354 * hY + 30 * hM - Math.floor((hM - 1) / 2) + hD + 1948440 - 385;
  const l = jd + 68569;
  const n = Math.floor(4 * l / 146097);
  const ll = l - Math.floor((146097 * n + 3) / 4);
  const i = Math.floor(4000 * (ll + 1) / 1461001);
  const lll = ll - Math.floor(1461 * i / 4) + 31;
  const j = Math.floor(80 * lll / 2447);
  const day = lll - Math.floor(2447 * j / 80);
  const month = j + 2 - 12 * Math.floor(j / 11);
  const gYear = 100 * (n - 49) + i + Math.floor(j / 11);
  return new Date(gYear, month - 1, day);
}

function gregorianToHijriYear(gYear: number): number {
  return Math.floor((gYear - 622) * 33 / 32);
}

interface HijriEvent {
  key: string;
  hMonth: number;
  hDay: number;
  icon: string;
  color: string;
}

const HIJRI_EVENTS: HijriEvent[] = [
  { key: "hijri.islamicNewYear", hMonth: 1, hDay: 1, icon: "celebration", color: "#00666d" },
  { key: "hijri.ashura", hMonth: 1, hDay: 10, icon: "water_drop", color: "#5b7fa6" },
  { key: "hijri.mawlid", hMonth: 3, hDay: 12, icon: "star", color: "#4a7c59" },
  { key: "hijri.israMiraj", hMonth: 7, hDay: 27, icon: "nights_stay", color: "#8a5c6e" },
  { key: "hijri.shaabanMid", hMonth: 8, hDay: 15, icon: "dark_mode", color: "#5b7fa6" },
  { key: "hijri.ramadanStart", hMonth: 9, hDay: 1, icon: "brightness_2", color: "#00666d" },
  { key: "hijri.laylatAlQadr", hMonth: 9, hDay: 27, icon: "auto_awesome", color: "#C4A35A" },
  { key: "hijri.eidAlFitr", hMonth: 10, hDay: 1, icon: "mosque", color: "#C4A35A" },
  { key: "hijri.dhulHijjahStart", hMonth: 12, hDay: 1, icon: "landscape", color: "#4a7c59" },
  { key: "hijri.arafah", hMonth: 12, hDay: 9, icon: "terrain", color: "#8a5c6e" },
  { key: "hijri.eidAlAdha", hMonth: 12, hDay: 10, icon: "mosque", color: "#C4A35A" },
];

function hijriEventsForYear(gYear: number) {
  const baseHY = gregorianToHijriYear(gYear);
  const results: { key: string; icon: string; color: string; date: Date; hijriYear: number; hMonth: number; hDay: number }[] = [];
  for (const ev of HIJRI_EVENTS) {
    for (const hy of [baseHY - 1, baseHY, baseHY + 1]) {
      const d = hijriToGregorian(hy, ev.hMonth, ev.hDay);
      if (d.getFullYear() === gYear) {
        results.push({ ...ev, date: d, hijriYear: hy, hMonth: ev.hMonth, hDay: ev.hDay });
      }
    }
  }
  return results.sort((a, b) => a.date.getTime() - b.date.getTime());
}

function seasonIndexOf(month: number) {
  return Math.floor((Math.min(12, Math.max(1, month)) - 1) / 3);
}

function fridaysInYear(year: number): Date[] {
  const out: Date[] = [];
  const d = new Date(year, 0, 1);
  while (d.getDay() !== 5) d.setDate(d.getDate() + 1);
  while (d.getFullYear() === year) {
    out.push(new Date(d));
    d.setDate(d.getDate() + 7);
  }
  return out;
}

function toISODate(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function formatFriday(iso: string, isAr: boolean) {
  const d = new Date(iso + "T00:00:00");
  if (isAr) {
    return d.toLocaleDateString("ar-SA", { day: "numeric", month: "short" });
  }
  return `${d.getDate()} ${MONTH_SHORT[d.getMonth()]}`;
}

export default function AnnualPlanPage() {
  const router = useRouter();
  const { t, isAr } = useI18n();
  const STATUS_MAP = useStatusMap();
  const [themes, setThemes] = useState<Theme[]>([]);
  const [sermons, setSermons] = useState<Sermon[]>([]);
  const [loading, setLoading] = useState(true);
  const [year, setYear] = useState(new Date().getFullYear());
  const [view, setView] = useState<"seasons" | "grid" | "hijri">("seasons");

  const [editingTheme, setEditingTheme] = useState<Theme | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formName, setFormName] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formColor, setFormColor] = useState("#00666d");
  const [formMonth, setFormMonth] = useState(1);
  const [formTopics, setFormTopics] = useState<string[]>(["", "", "", ""]);

  const [addingKey, setAddingKey] = useState<string | null>(null);
  const [addTitleText, setAddTitleText] = useState("");
  const [addDate, setAddDate] = useState<string>("");
  const [addBusy, setAddBusy] = useState(false);
  const [addSubTopicId, setAddSubTopicId] = useState<string | null>(null);
  const [addType, setAddType] = useState<string>("friday");

  const [gridAddIso, setGridAddIso] = useState<string | null>(null);
  const [gridAddText, setGridAddText] = useState("");
  const [gridBusy, setGridBusy] = useState(false);

  const [seasonFullModal, setSeasonFullModal] = useState<{ seasonN: number; theme: Theme } | null>(null);
  const [overwriteTarget, setOverwriteTarget] = useState<string | null>(null);
  const [deliveryCounts, setDeliveryCounts] = useState<Record<string, number>>({});
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("jp_delivery_counts");
      if (saved) setDeliveryCounts(JSON.parse(saved));
    } catch {}
  }, []);

  function cycleDelivery(sermonId: string) {
    setDeliveryCounts((prev) => {
      const cur = prev[sermonId] ?? 1;
      const next = cur >= 3 ? 1 : cur + 1;
      const updated = { ...prev, [sermonId]: next };
      if (next === 1) delete updated[sermonId];
      try { localStorage.setItem("jp_delivery_counts", JSON.stringify(updated)); } catch {}
      return updated;
    });
  }

  useEffect(() => { fetchAll(); }, []);

  function fetchAll() {
    Promise.all([
      fetch("/api/themes").then((r) => r.ok ? r.json() : []),
      fetch("/api/sermons").then((r) => r.ok ? r.json() : []),
    ])
      .then(([t, s]) => {
        setThemes(Array.isArray(t) ? t : []);
        setSermons(Array.isArray(s) ? s : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }

  async function importFromYear(fromYear: number) {
    setImporting(true);
    try {
      const res = await fetch("/api/themes/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fromYear, toYear: year }),
      });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || t("themes.importError"));
        return;
      }
      fetchAll();
    } catch {
      alert(t("themes.importError"));
    } finally {
      setImporting(false);
    }
  }

  const yearThemes = useMemo(
    () => themes.filter((t) => t.year === year).sort((a, b) => a.month - b.month),
    [themes, year],
  );

  const yearThemeIds = useMemo(() => new Set(yearThemes.map((t) => t.id)), [yearThemes]);

  const yearSermons = useMemo(
    () => sermons.filter((s) => s.theme_id && yearThemeIds.has(s.theme_id)),
    [sermons, yearThemeIds],
  );

  function themeSermons(themeId: string) {
    return sermons
      .filter((s) => s.theme_id === themeId)
      .sort((a, b) => {
        if (!a.scheduled_date) return 1;
        if (!b.scheduled_date) return -1;
        return a.scheduled_date.localeCompare(b.scheduled_date);
      });
  }

  const titled = yearSermons.length;
  const written = yearSermons.filter((s) => s.status === "ready" || s.status === "delivered").length;
  const delivered = yearSermons.filter((s) => s.status === "delivered").length;
  const pct = Math.min(100, Math.round((titled / TARGET_SLOTS) * 100));

  const seasonGroups = SEASONS.map((s) => ({
    ...s,
    themes: yearThemes.filter((t) => seasonIndexOf(t.month) === s.n - 1),
  }));

  const fridays = useMemo(() => fridaysInYear(year), [year]);
  const takenDates = useMemo(() => {
    const m = new Map<string, Sermon>();
    for (const s of yearSermons) if (s.scheduled_date) m.set(s.scheduled_date.slice(0, 10), s);
    return m;
  }, [yearSermons]);

  function seasonFridayISOs(theme: Theme): string[] {
    const startMonth = SEASONS[seasonIndexOf(theme.month)].startMonth;
    return fridays
      .filter((d) => { const m = d.getMonth() + 1; return m >= startMonth && m <= startMonth + 2; })
      .map(toISODate);
  }

  function openSeasonFridays(theme: Theme, keep?: string | null): string[] {
    return seasonFridayISOs(theme).filter((iso) => !takenDates.has(iso) || iso === keep);
  }

  function nextFridayForTheme(theme: Theme): string | null {
    const seasonISOs = seasonFridayISOs(theme);
    const free = seasonISOs.find((iso) => !takenDates.has(iso));
    return free ?? seasonISOs[seasonISOs.length - 1] ?? null;
  }

  function themeIdForDate(iso: string): string | null {
    const month = Number(iso.slice(5, 7));
    let chosen: Theme | null = null;
    let chosenMonth = -1;
    for (const t of yearThemes) {
      if (t.month <= month && t.month > chosenMonth) { chosen = t; chosenMonth = t.month; }
    }
    return chosen?.id ?? yearThemes[0]?.id ?? null;
  }

  function openCreate(prefillMonth?: number) {
    setEditingTheme(null);
    setShowCreate(true);
    const filledSeasons = new Set(yearThemes.map((t) => Math.floor((t.month - 1) / 3)));
    const firstEmpty = SEASONS.find((s) => !filledSeasons.has(s.n - 1));
    const month = prefillMonth ?? firstEmpty?.startMonth ?? 1;
    setFormName("");
    setFormDesc("");
    setFormColor(THEME_COLORS[filledSeasons.size % THEME_COLORS.length].value);
    setFormMonth(month);
    setFormTopics(["", "", "", ""]);
  }

  function openEdit(theme: Theme) {
    setShowCreate(false);
    setEditingTheme(theme);
    setFormName(theme.name);
    setFormDesc(theme.description ?? "");
    setFormColor(theme.color ?? "#00666d");
    setFormMonth(theme.month);
    const topics = theme.sub_topics.length > 0 ? theme.sub_topics.map((st) => st.name) : ["", "", "", ""];
    const padded = topics.length < 4 ? [...topics, ...Array(4 - topics.length).fill("")] : topics;
    setFormTopics(padded);
  }

  function closeForm() {
    setShowCreate(false);
    setEditingTheme(null);
    setSaving(false);
  }

  async function handleSave() {
    if (editingTheme && Number(editingTheme.sermon_count) > 0) {
      if (!confirm(t("themes.midYearWarning"))) return;
    }
    setSaving(true);
    const subTopics = formTopics
      .map((name, i) => ({ name: name.trim(), week: i + 1 }))
      .filter((t) => t.name.length > 0);

    if (editingTheme) {
      await fetch(`/api/themes/${editingTheme.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: formName, description: formDesc, color: formColor, month: formMonth, subTopics }),
      });
    } else {
      await fetch("/api/themes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: formName, description: formDesc, month: formMonth, year, color: formColor, subTopics }),
      });
    }
    closeForm();
    fetchAll();
  }

  async function handleDelete(id: string) {
    if (!confirm(t("themes.deleteConfirm"))) return;
    await fetch(`/api/themes/${id}`, { method: "DELETE" });
    closeForm();
    fetchAll();
  }

  function setSubField(i: number, v: string) { setFormTopics(formTopics.map((t, idx) => (idx === i ? v : t))); }

  function startAddTitle(theme: Theme, key: string, subTopicId: string | null, type: string = "friday") {
    setAddingKey(key);
    setAddTitleText("");
    setAddType(type);
    if (type === "friday") {
      setAddDate(nextFridayForTheme(theme) ?? "");
    } else {
      setAddDate("");
    }
    setAddSubTopicId(subTopicId);
  }
  function cancelAddTitle() {
    setAddingKey(null);
    setAddTitleText("");
    setAddSubTopicId(null);
    setAddType("friday");
  }
  async function submitAddTitle(theme: Theme) {
    const title = addTitleText.trim();
    if (!title || addBusy) { if (!title) cancelAddTitle(); return; }
    setAddBusy(true);
    try {
      const res = await fetch("/api/sermons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, themeId: theme.id, subTopicId: addSubTopicId, type: addType, status: "draft", scheduledDate: addDate || (addType === "friday" ? nextFridayForTheme(theme) : null) }),
      });
      if (!res.ok) { setAddBusy(false); return; }
      setAddTitleText("");
      setAddingKey(null);
      setAddSubTopicId(null);
      setAddBusy(false);
      fetchAll();
    } catch { setAddBusy(false); }
  }

  function startGridAdd(iso: string) {
    setGridAddIso(iso);
    setGridAddText("");
  }
  function cancelGridAdd() {
    setGridAddIso(null);
    setGridAddText("");
  }
  async function submitGridAdd() {
    const title = gridAddText.trim();
    if (!title || !gridAddIso || gridBusy) { if (!title) cancelGridAdd(); return; }
    setGridBusy(true);
    try {
      const res = await fetch("/api/sermons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, themeId: themeIdForDate(gridAddIso), status: "draft", scheduledDate: gridAddIso }),
      });
      if (!res.ok) { setGridBusy(false); return; }
      setGridAddText("");
      setGridAddIso(null);
      setGridBusy(false);
      fetchAll();
    } catch { setGridBusy(false); }
  }

  async function toggleSermonType(sermon: Sermon) {
    const newType = (!sermon.type || sermon.type === "friday") ? "eid" : "friday";
    await fetch(`/api/sermons/${sermon.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: newType }),
    });
    fetchAll();
  }

  async function pushToNextSeason(currentSeasonN: number, theme: Theme) {
    const nextSeason = SEASONS.find((s) => s.n === currentSeasonN + 1);
    if (!nextSeason) return;
    const nextTheme = yearThemes.find((t) => seasonIndexOf(t.month) === nextSeason.n - 1);
    setSeasonFullModal(null);
    startAddTitle(
      nextTheme ?? theme,
      `${nextTheme?.id ?? theme.id}:0`,
      nextTheme?.sub_topics[0]?.id ?? null,
    );
  }

  async function overwriteSlot(sermonId: string, theme: Theme) {
    await fetch(`/api/sermons/${sermonId}`, { method: "DELETE" });
    setOverwriteTarget(null);
    setSeasonFullModal(null);
    fetchAll();
  }

  async function handleNewSermonBlank() {
    const res = await fetch("/api/sermons", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Untitled Friday" }),
    });
    const s = await res.json();
    router.push(`/sermons/${s.id}/edit`);
  }

  function exportPlan() {
    const rows: string[][] = [[t("themes.season"), t("themes.mainTheme"), t("themes.subBouquet"), t("type.friday"), t("themes.sermonTitles"), t("status.draft")]];
    seasonGroups.forEach((sg) => {
      sg.themes.forEach((theme) => {
        const ss = themeSermons(theme.id);
        const subEntries = theme.sub_topics.length
          ? theme.sub_topics.map((s) => ({ name: s.name, id: s.id }))
          : [{ name: isAr ? "عام" : "General", id: null as string | null }];
        subEntries.forEach((sub) => {
          const slice = sub.id
            ? ss.filter((s) => s.sub_topic_id === sub.id)
            : ss.filter((s) => !s.sub_topic_id);
          if (slice.length === 0) rows.push([isAr ? t(`season.${sg.n}`) : sg.label, theme.name, sub.name, "", "", ""]);
          slice.forEach((sr) =>
            rows.push([
              isAr ? t(`season.${sg.n}`) : sg.label, theme.name, sub.name,
              sr.scheduled_date ? sr.scheduled_date.slice(0, 10) : "",
              sr.title,
              (STATUS_MAP[sr.status] ?? STATUS_MAP.draft).label,
            ]),
          );
        });
      });
    });
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `annual-plan-${year}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const isFormOpen = showCreate || editingTheme !== null;
  const formSeason = SEASONS[seasonIndexOf(formMonth)];

  return (
    <div className="flex min-h-screen bg-cream-bg">
      <div className="flex-1 min-w-0">
        {/* ── Header ── */}
        <header className="px-4 sm:px-6 lg:px-10 pt-7 pb-6 border-b border-line/60">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div>
              <h1 className="text-[22px] sm:text-[26px] font-bold text-ink tracking-tight leading-none">
                {t("themes.annualPlan")} <span className="text-mute font-normal">·</span> <span className="text-primary">{year}</span>
              </h1>
              <p className="mt-2 text-[13px] text-mute/70 font-[var(--font-arabic)]" dir="rtl">
                {t("themes.annualPlanAr")} · {TARGET_SLOTS} {t("themes.slots")}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center bg-white border border-line/60 rounded-xl overflow-hidden shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
                <button onClick={() => setYear(year - 1)} aria-label="Previous year"
                  className="w-9 h-9 grid place-items-center text-mute hover:text-primary hover:bg-primary/5 transition-all duration-200">
                  <span className="material-symbols-outlined text-[18px]">chevron_left</span>
                </button>
                <span className="text-[13px] font-semibold text-ink px-1 min-w-[44px] text-center tabular-nums select-none">{year}</span>
                <button onClick={() => setYear(year + 1)} aria-label="Next year"
                  className="w-9 h-9 grid place-items-center text-mute hover:text-primary hover:bg-primary/5 transition-all duration-200">
                  <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                </button>
              </div>
              <div className="flex items-center bg-white border border-line/60 rounded-xl p-[3px] shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
                {(["seasons", "grid", "hijri"] as const).map((v) => (
                  <button key={v} onClick={() => setView(v)}
                    className={`text-[12px] font-medium px-3 py-[7px] rounded-[9px] transition-all duration-200 flex items-center gap-1.5 ${
                      view === v ? (v === "hijri" ? "bg-accent-gold text-white shadow-[0_1px_3px_rgba(196,163,90,0.3)]" : "bg-primary text-white shadow-[0_1px_3px_rgba(0,102,109,0.3)]") : "text-mute hover:text-ink"
                    }`}>
                    <span className="material-symbols-outlined text-[15px]">{v === "seasons" ? "table_rows" : v === "grid" ? "grid_view" : "star_rate"}</span>
                    {v === "seasons" ? t("themes.seasons") : v === "grid" ? t("themes.52fridays") : t("themes.hijriEvents")}
                  </button>
                ))}
              </div>
              <button onClick={exportPlan}
                className="h-9 px-3 text-[12px] font-medium text-mute bg-white border border-line/60 rounded-xl hover:text-ink hover:border-line shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-all duration-200 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px]">download</span>
                <span className="hidden sm:inline">{t("themes.export")}</span>
              </button>
            </div>
          </div>

          {/* Progress meter */}
          <div className="mt-6 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6">
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline justify-between mb-2">
                <p className="text-[13px] text-ink">
                  <span className="text-primary text-[17px] font-bold tabular-nums">{titled}</span>
                  <span className="text-mute/80 font-normal"> / {TARGET_SLOTS} {t("themes.slotsTitled")}</span>
                </p>
                <p className="text-[12px] text-mute/60 font-medium tabular-nums">{pct}%</p>
              </div>
              <div className="h-[6px] rounded-full bg-ink/[0.06] overflow-hidden flex">
                <div className="h-full bg-primary rounded-full transition-[width] duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]"
                  style={{ width: `${Math.min(100, (delivered / TARGET_SLOTS) * 100)}%` }} title={`${delivered} ${t("themes.delivered")}`} />
                <div className="h-full bg-primary/35 transition-[width] duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]"
                  style={{ width: `${Math.min(100, ((written - delivered) / TARGET_SLOTS) * 100)}%` }} title={t("themes.written")} />
                <div className="h-full bg-accent-gold/45 transition-[width] duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]"
                  style={{ width: `${Math.min(100, ((titled - written) / TARGET_SLOTS) * 100)}%` }} title={t("themes.planned")} />
              </div>
              <div className="flex flex-wrap gap-x-5 gap-y-1 mt-2.5">
                <Legend color="#00666d" label={`${delivered} ${t("themes.delivered")}`} />
                <Legend color="rgba(0,102,109,0.35)" label={`${written - delivered} ${t("themes.written")}`} />
                <Legend color="rgba(196,163,90,0.55)" label={`${titled - written} ${t("themes.planned")}`} />
                <Legend color="rgba(28,28,26,0.08)" label={`${Math.max(0, TARGET_SLOTS - titled)} ${t("themes.open")}`} />
              </div>
            </div>
            <div className="flex gap-2 shrink-0">
              {seasonGroups.some((sg) => sg.themes.length === 0) && (
                <button onClick={() => openCreate()}
                  className="h-9 px-4 text-[12px] font-semibold text-white bg-primary rounded-xl hover:bg-secondary shadow-[0_1px_3px_rgba(0,102,109,0.25)] transition-all duration-200 active:scale-[0.97] flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px]">add</span> {t("themes.mainTheme")}
                </button>
              )}
            </div>
          </div>
        </header>

        {/* ── Body ── */}
        <div className="px-4 sm:px-6 lg:px-10 py-6">
          {loading ? (
            <SkeletonSeasons />
          ) : view === "hijri" ? (
            <HijriEventsTab year={year} onSermonCreated={fetchAll} />
          ) : view === "grid" ? (
            <YearGrid fridays={fridays} taken={takenDates} year={year}
              gridAddIso={gridAddIso} gridAddText={gridAddText} setGridAddText={setGridAddText}
              onStartGridAdd={startGridAdd} onCancelGridAdd={cancelGridAdd} onSubmitGridAdd={submitGridAdd} gridBusy={gridBusy} />
          ) : yearThemes.length === 0 ? (
            <EmptyWizard year={year} onStart={() => openCreate(1)} onImport={importFromYear} importing={importing} />
          ) : (
            <div className="flex flex-col gap-4 max-w-6xl">
              {seasonGroups.map((sg, i) => (
                <section key={sg.n} className="annual-rise" style={{ animationDelay: `${i * 60}ms` }}>
                  <SeasonBlock
                    season={sg}
                    allSeasons={seasonGroups}
                    themeSermons={themeSermons}
                    onEditTheme={openEdit}
                    onAddThemeToSeason={() => openCreate(sg.startMonth)}
                    addingKey={addingKey}
                    onStartAdd={startAddTitle}
                    onCancelAdd={cancelAddTitle}
                    addTitleText={addTitleText}
                    setAddTitleText={setAddTitleText}
                    addDate={addDate}
                    setAddDate={setAddDate}
                    dateOptionsFor={(t) => openSeasonFridays(t, addDate)}
                    submitAddTitle={submitAddTitle}
                    addBusy={addBusy}
                    addType={addType}
                    onToggleType={toggleSermonType}
                    onSeasonFull={(theme) => setSeasonFullModal({ seasonN: sg.n, theme })}
                    deliveryCounts={deliveryCounts}
                    onCycleDelivery={cycleDelivery}
                  />
                </section>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Create / Edit panel ── */}
      {isFormOpen && (
        <>
          <div className="fixed inset-0 bg-black/20 backdrop-blur-[2px] z-40 lg:hidden" onClick={closeForm} />
          <aside className={`fixed ${isAr ? "left-0" : "right-0"} top-0 h-full w-full sm:w-[400px] z-50 lg:z-auto lg:relative lg:w-[380px] ${isAr ? "border-r" : "border-l"} border-line/40 bg-white overflow-y-auto shrink-0 shadow-[-4px_0_24px_rgba(0,0,0,0.06)] lg:shadow-none`}>
            <div className="sticky top-0 bg-white/90 backdrop-blur-md border-b border-line/40 px-6 py-4 flex items-center justify-between z-10">
              <div>
                <p className="text-[11px] font-medium text-mute/60">
                  {isAr ? t(`season.${formSeason.n}`) : formSeason.label} · {isAr ? t(`season.${formSeason.n}.range`) : formSeason.range}
                </p>
                <p className="text-[17px] font-semibold text-ink mt-0.5">{editingTheme ? t("themes.editThemeTitle") : t("themes.newTheme")}</p>
              </div>
              <button onClick={closeForm} aria-label="Close"
                className="w-8 h-8 rounded-lg bg-ink/[0.04] grid place-items-center text-mute/60 hover:text-ink hover:bg-ink/[0.08] transition-all duration-200">
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <div className="p-6 flex flex-col gap-5">
              <Field label={t("themes.themeName")}>
                <input type="text" value={formName} onChange={(e) => setFormName(e.target.value)}
                  placeholder={t("themes.themeNamePlaceholder")} autoFocus
                  className="w-full text-[14px] font-medium text-ink border border-line/60 rounded-xl px-3.5 py-2.5 outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all duration-200 placeholder:text-mute/40" />
              </Field>

              <Field label={t("themes.season")}>
                <select value={formMonth} onChange={(e) => setFormMonth(Number(e.target.value))}
                  className="w-full text-[13px] font-medium text-ink border border-line/60 rounded-xl px-3 py-2.5 outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all duration-200">
                  {SEASONS.map((s) => {
                    const taken = !editingTheme && yearThemes.some((t) => Math.floor((t.month - 1) / 3) === s.n - 1);
                    return (
                      <option key={s.n} value={s.startMonth} disabled={taken}>
                        {isAr ? t(`season.${s.n}`) : s.label} · {isAr ? t(`season.${s.n}.range`) : s.range}{taken ? ` (${t("themes.filled")})` : ""}
                      </option>
                    );
                  })}
                </select>
              </Field>

              <Field label={t("themes.accentColor")}>
                <div className="flex gap-2">
                  {THEME_COLORS.map((c) => (
                    <button key={c.value} onClick={() => setFormColor(c.value)} title={c.label}
                      className={`w-7 h-7 rounded-lg transition-all duration-200 ${formColor === c.value ? "ring-2 ring-offset-2 ring-primary scale-105" : "hover:scale-105"}`}
                      style={{ backgroundColor: c.value }} />
                  ))}
                </div>
              </Field>

              <Field label={t("themes.description")}>
                <textarea value={formDesc} onChange={(e) => setFormDesc(e.target.value)} rows={2}
                  placeholder={t("themes.descPlaceholder")}
                  className="w-full text-[13px] text-ink border border-line/60 rounded-xl px-3.5 py-2.5 outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all duration-200 resize-none placeholder:text-mute/40" />
              </Field>

              <Field label={t("themes.subBouquets")}>
                <div className="flex flex-col gap-2">
                  {formTopics.map((tp, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="w-[18px] h-[18px] text-[9px] font-bold grid place-items-center shrink-0 text-white"
                        style={{ backgroundColor: formColor }}>{i + 1}</span>
                      <input type="text" value={tp} onChange={(e) => setSubField(i, e.target.value)}
                        placeholder={`${t("themes.subBouquetPlaceholder")} ${i + 1}`}
                        className="flex-1 text-[13px] text-ink border border-line/60 rounded-xl px-3 py-2 outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all duration-200 placeholder:text-mute/40" />
                      {i >= 4 && (
                        <button type="button" onClick={() => setFormTopics(formTopics.filter((_, idx) => idx !== i))}
                          className="text-mute/40 hover:text-red-400 transition-colors shrink-0">
                          <span className="material-symbols-outlined text-[14px]">close</span>
                        </button>
                      )}
                    </div>
                  ))}
                  <button type="button" onClick={() => setFormTopics([...formTopics, ""])}
                    className="self-start text-[11px] font-medium text-mute/50 hover:text-primary transition-all flex items-center gap-0.5 py-1">
                    <span className="material-symbols-outlined text-[13px]">add</span> {t("themes.addSubBouquet")}
                  </button>
                </div>
              </Field>

              <div className="flex flex-col gap-2.5 pt-2">
                <button onClick={handleSave} disabled={!formName.trim() || saving}
                  className={`w-full py-2.5 text-[13px] font-semibold rounded-xl transition-all duration-200 ${
                    formName.trim() && !saving ? "bg-primary text-white hover:bg-secondary shadow-[0_1px_3px_rgba(0,102,109,0.25)] active:scale-[0.98]" : "bg-ink/[0.06] text-mute cursor-not-allowed"
                  }`}>
                  {saving ? t("themes.saving") : editingTheme ? t("themes.updateTheme") : t("themes.createTheme")}
                </button>
                {editingTheme && (
                  <button onClick={() => handleDelete(editingTheme.id)}
                    className="w-full py-2 text-[12px] font-medium text-red-500/80 border border-red-200/60 rounded-xl hover:bg-red-50/50 transition-all duration-200">
                    {t("themes.deleteTheme")}
                  </button>
                )}
              </div>
            </div>
          </aside>
        </>
      )}

      {/* ── Season full modal ── */}
      {seasonFullModal && (() => {
        const sfSeason = seasonGroups.find((sg) => sg.n === seasonFullModal.seasonN);
        const sfSermons = sfSeason ? sfSeason.themes.flatMap((t) => themeSermons(t.id)) : [];
        const nextSeason = SEASONS.find((s) => s.n === seasonFullModal.seasonN + 1);
        const nextSeasonTheme = nextSeason ? yearThemes.find((t) => seasonIndexOf(t.month) === nextSeason.n - 1) : null;
        const nextSeasonSermons = nextSeasonTheme ? themeSermons(nextSeasonTheme.id) : [];
        const nextSeasonFull = nextSeasonSermons.length >= SLOTS_PER_SEASON;
        return (
          <>
            <div className="fixed inset-0 bg-black/30 backdrop-blur-[2px] z-50" onClick={() => { setSeasonFullModal(null); setOverwriteTarget(null); }} />
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="bg-white border border-line/40 shadow-xl max-w-md w-full p-6">
                <div className="flex items-center gap-3 mb-4">
                  <span className="w-10 h-10 bg-red-50 text-red-500 grid place-items-center">
                    <span className="material-symbols-outlined text-xl">block</span>
                  </span>
                  <div>
                    <p className="text-[15px] font-bold text-ink">{t("themes.seasonFullTitle")}</p>
                    <p className="text-[12px] text-mute">{t("themes.seasonFullDesc")}</p>
                  </div>
                </div>

                <div className="flex flex-col gap-2 mb-4">
                  {nextSeason && !nextSeasonFull && (
                    <button onClick={() => pushToNextSeason(seasonFullModal.seasonN, seasonFullModal.theme)}
                      className="w-full flex items-center gap-3 px-4 py-3 border border-line/40 hover:border-primary/40 hover:bg-primary/[0.03] transition-all text-left group">
                      <span className="material-symbols-outlined text-primary text-lg">arrow_forward</span>
                      <div>
                        <p className="text-[13px] font-semibold text-ink group-hover:text-primary transition-colors">{t("themes.pushToNext")}</p>
                        <p className="text-[11px] text-mute">{isAr ? t(`season.${nextSeason.n}`) : nextSeason.label} · {nextSeasonSermons.length}/{SLOTS_PER_SEASON} {t("themes.slots")}</p>
                      </div>
                    </button>
                  )}

                  <button onClick={() => setOverwriteTarget(overwriteTarget ? null : "picking")}
                    className="w-full flex items-center gap-3 px-4 py-3 border border-line/40 hover:border-red-300/60 hover:bg-red-50/30 transition-all text-left group">
                    <span className="material-symbols-outlined text-red-400 text-lg">swap_horiz</span>
                    <div>
                      <p className="text-[13px] font-semibold text-ink group-hover:text-red-600 transition-colors">{t("themes.overwriteSlot")}</p>
                      <p className="text-[11px] text-mute">{t("themes.selectSlot")}</p>
                    </div>
                  </button>
                </div>

                {overwriteTarget === "picking" && sfSermons.length > 0 && (
                  <div className="border border-line/40 max-h-48 overflow-y-auto mb-4">
                    {sfSermons.map((sr) => (
                      <button key={sr.id} onClick={() => overwriteSlot(sr.id, seasonFullModal.theme)}
                        className="w-full flex items-center gap-2 px-3 py-2 border-b border-line/20 last:border-b-0 hover:bg-red-50/50 transition-colors text-left">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-300 shrink-0" />
                        <span className="text-[12px] text-ink truncate flex-1">{sr.title}</span>
                        <span className="text-[10px] text-mute">{sr.scheduled_date?.slice(0, 10) ?? "—"}</span>
                      </button>
                    ))}
                  </div>
                )}

                <button onClick={() => { setSeasonFullModal(null); setOverwriteTarget(null); }}
                  className="w-full py-2 text-[12px] font-medium text-mute hover:text-ink transition-colors">
                  {t("sermons.cancel")}
                </button>
              </div>
            </div>
          </>
        );
      })()}
    </div>
  );
}

/* ────────────────────────────────────────────────────────── */

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5 text-[11px] text-mute/60">
      <span className="w-2 h-2 rounded-[3px]" style={{ backgroundColor: color }} />
      {label}
    </span>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-[11px] font-medium text-mute/70 block mb-2">{label}</label>
      {children}
    </div>
  );
}

/* ── Season block ── */
function SeasonBlock({
  season, allSeasons, themeSermons, onEditTheme, onAddThemeToSeason,
  addingKey, onStartAdd, onCancelAdd, addTitleText, setAddTitleText,
  addDate, setAddDate, dateOptionsFor, submitAddTitle, addBusy,
  addType, onToggleType, onSeasonFull, deliveryCounts, onCycleDelivery,
}: {
  season: { n: number; label: string; ar: string; range: string; startMonth: number; themes: Theme[] };
  allSeasons: { n: number; label: string; ar: string; range: string; startMonth: number; themes: Theme[] }[];
  themeSermons: (id: string) => Sermon[];
  onEditTheme: (t: Theme) => void;
  onAddThemeToSeason: () => void;
  addingKey: string | null;
  onStartAdd: (t: Theme, key: string, subTopicId: string | null, type?: string) => void;
  onCancelAdd: () => void;
  addTitleText: string;
  setAddTitleText: (v: string) => void;
  addDate: string;
  setAddDate: (v: string) => void;
  dateOptionsFor: (t: Theme) => string[];
  addType: string;
  submitAddTitle: (t: Theme) => void;
  addBusy: boolean;
  onToggleType: (sermon: Sermon) => void;
  onSeasonFull: (theme: Theme) => void;
  deliveryCounts: Record<string, number>;
  onCycleDelivery: (sermonId: string) => void;
}) {
  const { t, isAr } = useI18n();
  const STATUS_MAP = useStatusMap();
  const theme = season.themes[0] ?? null;
  const color = theme?.color || "#00666d";
  const ss = season.themes.flatMap((t) => themeSermons(t.id));
  const fridayCount = ss.filter((s) => !s.type || s.type === "friday").length;
  const occasionCount = ss.filter((s) => s.type && s.type !== "friday").length;
  const allSubTopics = season.themes.flatMap((t) => t.sub_topics);
  const minSlots = Math.max(4, allSubTopics.length);
  const subSlots = Array.from({ length: minSlots }, (_, i) => allSubTopics[i] ?? null);
  const seasonLabel = isAr ? t(`season.${season.n}`) : season.label;
  const seasonRange = isAr ? t(`season.${season.n}.range`) : season.range;

  const themeName = theme?.name?.toLowerCase() ?? "";
  const prevSeason = allSeasons.find((s) => s.n === season.n - 1);
  const nextSeason = allSeasons.find((s) => s.n === season.n + 1);
  const continuesFromPrev = prevSeason?.themes.some((t) => t.name.toLowerCase() === themeName) ?? false;
  const continuesInNext = nextSeason?.themes.some((t) => t.name.toLowerCase() === themeName) ?? false;

  return (
    <div className="bg-white border border-line/50 overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.04),0_0_0_1px_rgba(0,0,0,0.02)]">
      {/* Season header */}
      <div className="flex items-center justify-between px-4 sm:px-5 py-3.5 border-b border-line/40">
        <div className="flex items-center gap-3">
          <span className="w-8 h-8 bg-primary/10 text-primary grid place-items-center text-[13px] font-bold tabular-nums">
            {season.n}
          </span>
          <div>
            <p className="text-[14px] font-bold text-ink leading-tight">
              {seasonLabel} <span className="text-mute/70 font-medium">· {seasonRange}</span>
            </p>
            <p className="text-[10.5px] text-mute/50 font-[var(--font-arabic)] mt-0.5" dir="rtl">{season.ar}</p>
          </div>
        </div>
        {theme && (
          <div className="hidden sm:flex items-center gap-3 text-[11px] text-mute/70 font-medium tabular-nums">
            <span>{ss.length} {t("themes.slots")}</span>
            <span className="text-mute/30">|</span>
            <span>{fridayCount} {t("themes.fridayShort")}</span>
            <span className="text-mute/30">·</span>
            <span className="text-accent-gold/80">{occasionCount} {t("themes.occasionShort")}</span>
          </div>
        )}
      </div>

      {!theme ? (
        <button onClick={onAddThemeToSeason}
          className="w-full py-10 text-center text-[12px] text-mute/50 hover:text-primary transition-all duration-200 flex flex-col items-center gap-2 group">
          <span className="material-symbols-outlined text-2xl text-mute/25 group-hover:text-primary/50 transition-colors duration-200">add_circle</span>
          {t("themes.setMainTheme")} {seasonRange}
          <span className="text-[10px] text-mute/30">~{SLOTS_PER_SEASON} {t("themes.recommendedSlots")} · {DEFAULT_FRIDAY_SLOTS} {t("themes.fridayShort")} + {DEFAULT_OCCASION_SLOTS} {t("themes.occasionShort")}</span>
        </button>
      ) : (
        <div>
          {/* Theme name bar */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-line/40 bg-ink/[0.015]">
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
              <button onClick={() => onEditTheme(theme)}
                className="text-left text-[14px] font-bold text-ink hover:text-primary transition-all duration-200 leading-snug">
                {theme.name}
              </button>
              {theme.mosque_id && (
                <span className="text-[9px] font-bold text-accent-gold bg-accent-gold/10 px-1.5 py-0.5 rounded-full">{t("themes.mosqueOverride")}</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {continuesFromPrev && prevSeason && (
                <span className="text-[9px] font-medium text-primary/50 flex items-center gap-0.5">
                  <span className="material-symbols-outlined text-[11px]">arrow_back</span>
                  {t("themes.continuesFrom")} {isAr ? t(`season.${prevSeason.n}`) : prevSeason.label}
                </span>
              )}
              {continuesInNext && nextSeason && (
                <span className="text-[9px] font-medium text-primary/50 flex items-center gap-0.5">
                  {t("themes.continuesIn")} {isAr ? t(`season.${nextSeason.n}`) : nextSeason.label}
                  <span className="material-symbols-outlined text-[11px]">arrow_forward</span>
                </span>
              )}
              <span className="text-[10px] text-mute/70 font-medium">
                {theme.sub_topics.length} {t("themes.bouquets")} · {ss.length} {t("themes.slots")}
              </span>
            </div>
          </div>

          {/* Column labels */}
          <div className="hidden sm:grid grid-cols-[170px_minmax(0,1fr)] px-5 pt-3 pb-1.5 text-[10px] font-semibold text-mute/60 uppercase tracking-wide border-b border-line/40">
            <span>{t("themes.subBouquet")}</span><span>{t("themes.sermonTitles")}</span>
          </div>

          {/* 4 elastic sub-bouquets — season hard cap 16, sub-bouquet distribution is flexible */}
          {(() => {
            const allSorted = [...ss].sort((a, b) => (a.scheduled_date ?? "").localeCompare(b.scheduled_date ?? ""));
            const totalUsed = ss.length;
            const seasonOver = totalUsed >= SLOTS_PER_SEASON;
            const seasonRemaining = Math.max(0, SLOTS_PER_SEASON - totalUsed);

            const fridaysBySubId = new Map<string, Sermon[]>();
            for (const sub of subSlots) {
              if (!sub) continue;
              fridaysBySubId.set(sub.id, allSorted.filter((s) => s.sub_topic_id === sub.id && (!s.type || s.type === "friday")));
            }

            const occasions = allSorted.filter((s) => s.type && s.type !== "friday");
            const occasionBuckets = new Map<number, Sermon[]>();
            for (const oc of occasions) {
              const d = oc.scheduled_date?.slice(0, 10) ?? "";
              let target = subSlots.length - 1;
              for (let i = 0; i < subSlots.length; i++) {
                const sub = subSlots[i];
                if (!sub) continue;
                const fris = fridaysBySubId.get(sub.id) ?? [];
                if (fris.length === 0) continue;
                const minD = fris[0]?.scheduled_date?.slice(0, 10) ?? "";
                const maxD = fris[fris.length - 1]?.scheduled_date?.slice(0, 10) ?? "";
                if (d >= minD && d <= maxD) { target = i; break; }
                if (i < subSlots.length - 1) {
                  const nextSub = subSlots[i + 1];
                  const nextFris = nextSub ? (fridaysBySubId.get(nextSub.id) ?? []) : [];
                  const nextMinD = nextFris.length > 0 ? (nextFris[0]?.scheduled_date?.slice(0, 10) ?? "9999") : "9999";
                  if (d > maxD && d < nextMinD) { target = i; break; }
                }
              }
              occasionBuckets.set(target, [...(occasionBuckets.get(target) ?? []), oc]);
            }

            return (
              <div className="divide-y divide-line/60">
                {subSlots.map((sub, si) => {
                  const fridaysInSub = sub ? (fridaysBySubId.get(sub.id) ?? []) : [];
                  const occasionsInSub = occasionBuckets.get(si) ?? [];
                  const merged = [...fridaysInSub, ...occasionsInSub].sort(
                    (a, b) => (a.scheduled_date ?? "").localeCompare(b.scheduled_date ?? "")
                  );
                  const slotCount = merged.length;
                  const key = `${theme.id}:${si}`;
                  const isAdding = addingKey === key;
                  const isAddingOccasion = addingKey === `occasion:${season.n}:${si}`;
                  const dateOpts = isAdding ? dateOptionsFor(theme) : [];
                  const hasSubTopic = sub !== null;

                  const isHeavy = slotCount >= 6;

                  return (
                    <div key={si} className={`grid grid-cols-1 sm:grid-cols-[170px_minmax(0,1fr)] ${isHeavy ? "bg-accent-gold/[0.02]" : ""}`}>
                      <div className="px-5 sm:px-4 pt-2.5 sm:py-3 sm:border-r border-line/60 flex items-center gap-2">
                        <span className="w-[18px] h-[18px] text-[9px] font-bold grid place-items-center shrink-0 text-white"
                          style={{ backgroundColor: hasSubTopic ? color : "#ccc" }}>
                          {si + 1}
                        </span>
                        <span className={`text-[12.5px] font-semibold ${hasSubTopic ? "text-ink" : "text-mute/35 italic"} flex-1 min-w-0 truncate`}>
                          {sub?.name ?? t("themes.emptySlot")}
                        </span>
                        {isHeavy && (
                          <span className="text-[8px] font-bold px-1 py-[1px] bg-accent-gold/15 text-accent-gold shrink-0">{t("themes.heavySub")}</span>
                        )}
                        {hasSubTopic && slotCount > 0 && (
                          <span className="text-[9px] text-mute/40 font-medium tabular-nums shrink-0">{slotCount}</span>
                        )}
                      </div>

                      <div className="px-5 sm:px-4 pb-2.5 sm:py-2 flex flex-col">
                        {!hasSubTopic ? (
                          <button onClick={() => onEditTheme(theme)}
                            className="text-[11px] text-mute/40 hover:text-primary py-2 flex items-center gap-1 transition-colors duration-200">
                            <span className="material-symbols-outlined text-[13px]">edit</span>
                            {t("themes.editTheme")}
                          </button>
                        ) : (
                          <>
                            {merged.map((sr, idx) => {
                              const isOccasion = sr.type && sr.type !== "friday";
                              const st = STATUS_MAP[sr.status] ?? STATUS_MAP.draft;
                              const srDate = sr.scheduled_date?.slice(0, 10) ?? "";

                              const eidOnFridayPair = isOccasion && (sr.type === "eid") && merged.some(
                                (other) => other.id !== sr.id && (!other.type || other.type === "friday") && other.scheduled_date?.slice(0, 10) === srDate
                              );
                              const fridayWithEid = !isOccasion && merged.some(
                                (other) => other.id !== sr.id && other.type === "eid" && other.scheduled_date?.slice(0, 10) === srDate
                              );

                              return (
                                <div key={sr.id} className={`group ${eidOnFridayPair ? "border-l-2 border-accent-gold/40 ml-1" : ""} ${fridayWithEid ? "border-l-2 border-primary/40 ml-1" : ""}`}>
                                  <Link href={`/sermons/${sr.id}/edit`}
                                    className="flex items-center gap-2.5 py-[7px] -mx-2 px-2 hover:bg-ink/[0.03] transition-all duration-200">
                                    <span className={`w-[5px] h-[5px] rounded-full shrink-0 ${isOccasion ? "bg-accent-gold/60" : ""}`}
                                      style={isOccasion ? {} : { backgroundColor: st.dot }} />
                                    <span className="text-[11px] text-mute/70 font-medium tabular-nums w-[42px] shrink-0">
                                      {sr.scheduled_date ? formatFriday(sr.scheduled_date.slice(0, 10), isAr) : "—"}
                                    </span>
                                    <span className="text-[13px] text-ink font-medium truncate min-w-0 flex-1 group-hover:text-primary transition-colors duration-200">
                                      {sr.title}
                                    </span>
                                    {eidOnFridayPair && (
                                      <span className="text-[8px] font-semibold px-1 py-[1px] bg-accent-gold/15 text-accent-gold whitespace-nowrap hidden sm:inline" title={t("themes.eidOnFriday")}>
                                        {t("themes.morningEid")}
                                      </span>
                                    )}
                                    {fridayWithEid && (
                                      <span className="text-[8px] font-semibold px-1 py-[1px] bg-primary/10 text-primary whitespace-nowrap hidden sm:inline" title={t("themes.eidOnFriday")}>
                                        {t("themes.afternoonJumuah")}
                                      </span>
                                    )}
                                    {isOccasion && !eidOnFridayPair ? (
                                      <span className="text-[9px] font-semibold px-1.5 py-[2px] bg-accent-gold/10 text-accent-gold whitespace-nowrap">
                                        {sr.type === "eid" ? t("themes.eid") : t("themes.occasion")}
                                      </span>
                                    ) : !isOccasion && !fridayWithEid ? (
                                      <span className="text-[9.5px] font-semibold px-1.5 py-[3px] whitespace-nowrap"
                                        style={{ backgroundColor: st.bg, color: st.text }}>{st.label}</span>
                                    ) : null}
                                    {!isOccasion && (deliveryCounts[sr.id] ?? 1) > 1 && (
                                      <span className="text-[8px] font-bold px-1 py-[1px] bg-primary/10 text-primary tabular-nums whitespace-nowrap">
                                        ×{deliveryCounts[sr.id]} {t("themes.multiDelivery")}
                                      </span>
                                    )}
                                  </Link>
                                  <div className="flex items-center gap-1 -mt-1 mb-0.5 px-2">
                                    {isOccasion && (
                                      <span className="text-[8px] text-mute/40 italic" title={t("themes.moonSighting")}>
                                        {t("themes.moonSighting")}
                                      </span>
                                    )}
                                    {(eidOnFridayPair || fridayWithEid) && (
                                      <span className="text-[8px] text-accent-gold/50">2 {t("themes.slotsConsumed")}</span>
                                    )}
                                    {!isOccasion && (
                                      <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); onCycleDelivery(sr.id); }}
                                        className="text-[8px] text-mute/30 hover:text-primary transition-colors opacity-0 group-hover:opacity-100 flex items-center gap-0.5"
                                        title={t("themes.addDelivery")}>
                                        <span className="material-symbols-outlined text-[10px]">content_copy</span>
                                        {(deliveryCounts[sr.id] ?? 1) > 1 ? `×${deliveryCounts[sr.id]}` : t("themes.addDelivery")}
                                      </button>
                                    )}
                                    {(isOccasion || eidOnFridayPair || fridayWithEid) && (
                                      <button onClick={(e) => { e.preventDefault(); onToggleType(sr); }}
                                        className="text-[8px] text-mute/30 hover:text-primary transition-colors ml-auto opacity-0 group-hover:opacity-100"
                                        title={isOccasion ? t("themes.switchToFriday") : t("themes.switchToOccasion")}>
                                        {isOccasion ? t("themes.switchToFriday") : t("themes.switchToOccasion")}
                                      </button>
                                    )}
                                  </div>
                                </div>
                              );
                            })}

                            {isAdding ? (
                              <div className="mt-1.5 flex flex-col gap-2 bg-primary/[0.02] border border-primary/15 p-2.5">
                                <input autoFocus value={addTitleText} disabled={addBusy}
                                  onChange={(e) => setAddTitleText(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") submitAddTitle(theme);
                                    if (e.key === "Escape") onCancelAdd();
                                  }}
                                  placeholder={t("themes.sermonTitlePlaceholder")}
                                  className="text-[12.5px] text-ink font-medium bg-white border border-line/60 px-3 py-2 outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all duration-200 placeholder:text-mute/40" />
                                <div className="flex items-center gap-1.5">
                                  <span className="material-symbols-outlined text-[14px] text-mute/50 shrink-0">event</span>
                                  <select value={addDate} onChange={(e) => setAddDate(e.target.value)} disabled={addBusy}
                                    className="flex-1 min-w-0 text-[11px] font-semibold text-ink bg-white border border-line/60 px-2 py-1.5 outline-none focus:border-primary transition-all duration-200">
                                    {dateOpts.length === 0 && <option value="">{t("themes.noOpenFridays")}</option>}
                                    {dateOpts.map((iso) => (
                                      <option key={iso} value={iso}>{isAr ? t("type.friday") : "Fri"} {formatFriday(iso, isAr)}</option>
                                    ))}
                                  </select>
                                  <button onClick={() => submitAddTitle(theme)} disabled={!addTitleText.trim() || addBusy}
                                    className={`text-[11px] font-bold px-3 py-1.5 transition-all duration-200 ${
                                      addTitleText.trim() && !addBusy ? "bg-primary text-white hover:bg-secondary" : "bg-ink/[0.06] text-mute cursor-not-allowed"
                                    }`}>{addBusy ? "…" : t("themes.add")}</button>
                                  <button onClick={onCancelAdd} className="text-[11px] font-medium text-mute/60 hover:text-ink px-1.5 py-1.5 transition-colors duration-200">{t("sermons.cancel")}</button>
                                </div>
                              </div>
                            ) : isAddingOccasion ? (
                              <div className="mt-1.5 flex flex-col gap-2 bg-accent-gold/[0.04] border border-accent-gold/20 p-2.5">
                                <input autoFocus value={addTitleText} disabled={addBusy}
                                  onChange={(e) => setAddTitleText(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") submitAddTitle(theme);
                                    if (e.key === "Escape") onCancelAdd();
                                  }}
                                  placeholder={t("themes.occasionPlaceholder")}
                                  className="text-[12.5px] text-ink font-medium bg-white border border-line/60 px-3 py-2 outline-none focus:border-accent-gold focus:ring-2 focus:ring-accent-gold/10 transition-all duration-200 placeholder:text-mute/40" />
                                <div className="flex items-center gap-1.5">
                                  <span className="material-symbols-outlined text-[14px] text-mute/50 shrink-0">event</span>
                                  <input type="date" value={addDate} onChange={(e) => setAddDate(e.target.value)} disabled={addBusy}
                                    className="flex-1 min-w-0 text-[11px] font-semibold text-ink bg-white border border-line/60 px-2 py-1.5 outline-none focus:border-accent-gold transition-all duration-200" />
                                  <button onClick={() => submitAddTitle(theme)} disabled={!addTitleText.trim() || addBusy}
                                    className={`text-[11px] font-bold px-3 py-1.5 transition-all duration-200 ${
                                      addTitleText.trim() && !addBusy ? "bg-accent-gold text-white hover:bg-accent-gold/80" : "bg-ink/[0.06] text-mute cursor-not-allowed"
                                    }`}>{addBusy ? "…" : t("themes.add")}</button>
                                  <button onClick={onCancelAdd} className="text-[11px] font-medium text-mute/60 hover:text-ink px-1.5 py-1.5 transition-colors duration-200">{t("sermons.cancel")}</button>
                                </div>
                              </div>
                            ) : (
                              <>
                                {slotCount >= 4 && (
                                  <span className="text-[10px] text-mute/30 mt-1 py-0.5 flex items-center gap-1">
                                    <span className="material-symbols-outlined text-[12px]">check_circle</span>
                                    {t("themes.recommended4")}
                                  </span>
                                )}
                                <div className="flex items-center gap-2 mt-0.5">
                                  <button onClick={() => onStartAdd(theme, key, sub.id)}
                                    className="self-start text-[11px] font-medium text-mute/50 hover:text-primary transition-all duration-200 flex items-center gap-0.5 py-1">
                                    <span className="material-symbols-outlined text-[13px]">add</span> {t("themes.addTitle")}
                                  </button>
                                  <button onClick={() => onStartAdd(theme, `occasion:${season.n}:${si}`, null, "eid")}
                                    className="self-start text-[11px] font-medium text-accent-gold/50 hover:text-accent-gold transition-all duration-200 flex items-center gap-0.5 py-1">
                                    <span className="material-symbols-outlined text-[13px]">star</span> {t("themes.addOccasion")}
                                  </button>
                                </div>
                              </>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}

                {/* Season total indicator */}
                <div className="px-5 py-2 flex items-center justify-between text-[10px] text-mute/50">
                  <span>{totalUsed}/{SLOTS_PER_SEASON} {t("themes.slots")} · {fridayCount} {t("themes.fridayShort")} · {occasionCount} {t("themes.occasionShort")}</span>
                  {seasonOver && <span className="text-[9px] font-semibold text-accent-gold/70">{t("themes.beyondRecommended")}</span>}
                </div>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}

/* ── Year grid ── */
function YearGrid({
  fridays, taken, year,
  gridAddIso, gridAddText, setGridAddText, onStartGridAdd, onCancelGridAdd, onSubmitGridAdd, gridBusy,
}: {
  fridays: Date[];
  taken: Map<string, Sermon>;
  year: number;
  gridAddIso: string | null;
  gridAddText: string;
  setGridAddText: (v: string) => void;
  onStartGridAdd: (iso: string) => void;
  onCancelGridAdd: () => void;
  onSubmitGridAdd: () => void;
  gridBusy: boolean;
}) {
  const { t, isAr } = useI18n();
  const STATUS_MAP = useStatusMap();
  const cols = 4;
  const perCol = Math.ceil(fridays.length / cols);
  const groups = Array.from({ length: cols }, (_, i) => fridays.slice(i * perCol, (i + 1) * perCol));
  const openCount = fridays.filter((d) => !taken.has(toISODate(d))).length;

  return (
    <div className="max-w-6xl">
      <p className="text-[12px] text-mute mb-4">
        {t("themes.everyFriday")} <span className="font-bold text-ink">{year}</span> — {fridays.length} {t("themes.inTotal")}, {openCount} {t("themes.stillOpen")}
        {" "}{t("themes.gridHint")} <span className="text-primary font-semibold">{t("themes.openLabel")}</span> {t("themes.gridHint2")}
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {groups.map((group, gi) => (
          <div key={gi} className="bg-white border border-line rounded-xl overflow-hidden">
            {group.map((d, i) => {
              const idx = gi * perCol + i;
              const iso = toISODate(d);
              const s = taken.get(iso);
              const st = s ? STATUS_MAP[s.status] ?? STATUS_MAP.draft : null;
              const isAdding = gridAddIso === iso;

              const lead = (
                <>
                  <span className="text-[10px] font-bold text-mute/70 tabular-nums w-5 shrink-0">{idx + 1}</span>
                  <span className="text-[10px] text-mute tabular-nums w-[42px] shrink-0">{formatFriday(iso, isAr)}</span>
                </>
              );

              if (s) {
                return (
                  <Link key={iso} href={`/sermons/${s.id}/edit`}
                    className="flex items-center gap-2.5 px-3 py-2 border-b border-line/60 last:border-b-0 min-h-[38px] hover:bg-primary/[0.04] transition-colors">
                    {lead}
                    <span className="text-[12px] text-ink font-medium truncate min-w-0 flex-1">{s.title}</span>
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: st!.dot }} title={st!.label} />
                  </Link>
                );
              }

              if (isAdding) {
                return (
                  <div key={iso} className="flex items-center gap-2 px-3 py-1.5 border-b border-line/60 last:border-b-0 bg-primary/[0.04]">
                    {lead}
                    <input autoFocus value={gridAddText} disabled={gridBusy}
                      onChange={(e) => setGridAddText(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") onSubmitGridAdd(); if (e.key === "Escape") onCancelGridAdd(); }}
                      onBlur={onSubmitGridAdd}
                      placeholder={t("themes.titlePlaceholder")}
                      className="text-[12px] text-ink bg-white border border-primary/40 rounded px-2 py-1 outline-none focus:ring-2 focus:ring-primary/10 min-w-0 flex-1 placeholder:text-mute/50" />
                  </div>
                );
              }

              return (
                <button key={iso} onClick={() => onStartGridAdd(iso)}
                  className="w-full flex items-center gap-2.5 px-3 py-2 border-b border-line/60 last:border-b-0 min-h-[38px] hover:bg-primary/[0.04] transition-colors text-left group">
                  {lead}
                  <span className="text-[11px] text-mute/40 italic flex-1 group-hover:text-primary/70">{t("themes.openLabel")}</span>
                  <span className="material-symbols-outlined text-[15px] text-line group-hover:text-primary transition-colors shrink-0">add</span>
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Empty state / guided wizard ── */
function EmptyWizard({ year, onStart, onImport, importing }: { year: number; onStart: () => void; onImport: (fromYear: number) => void; importing: boolean }) {
  const { t } = useI18n();
  const prevYear = year - 1;
  const steps = [
    { icon: "category", title: t("themes.step1"), desc: t("themes.step1Desc") },
    { icon: "account_tree", title: t("themes.step2"), desc: t("themes.step2Desc") },
    { icon: "edit_note", title: t("themes.step3"), desc: t("themes.step3Desc") },
  ];
  return (
    <div className="max-w-2xl mx-auto text-center py-10">
      <span className="material-symbols-outlined text-5xl text-primary/20 mb-3 block">calendar_month</span>
      <h2 className="text-xl font-extrabold text-primary">{t("themes.buildPlan")} {year} {t("themes.plan")}</h2>
      <p className="text-[13px] text-mute mt-1.5 mb-8">
        {t("themes.buildDesc")}
      </p>
      <div className="grid sm:grid-cols-3 gap-3 mb-8 text-left">
        {steps.map((s, i) => (
          <div key={i} className="bg-white border border-line rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-7 h-7 rounded-lg bg-primary/10 text-primary grid place-items-center text-[13px] font-extrabold">{i + 1}</span>
              <span className="material-symbols-outlined text-primary/60 text-lg">{s.icon}</span>
            </div>
            <p className="text-[13px] font-bold text-ink">{s.title}</p>
            <p className="text-[11.5px] text-mute mt-0.5 leading-snug">{s.desc}</p>
          </div>
        ))}
      </div>
      <div className="flex flex-col items-center gap-3">
        <button onClick={onStart}
          className="px-7 py-3 bg-primary text-white text-sm font-bold rounded-full hover:bg-secondary transition-all active:scale-95 shadow-sm">
          {t("themes.startSeason1")}
        </button>
        <p className="text-[12px] text-mute">{t("themes.orImport")}</p>
        <button onClick={() => onImport(prevYear)} disabled={importing}
          className="px-5 py-2.5 text-[13px] font-semibold text-primary bg-primary/5 border border-primary/20 rounded-full hover:bg-primary/10 transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2">
          <span className="material-symbols-outlined text-[16px]">content_copy</span>
          {importing ? t("themes.importing") : `${t("themes.importPlan")} (${prevYear})`}
        </button>
      </div>
    </div>
  );
}

/* ── Hijri Events tab ── */
function HijriEventsTab({ year, onSermonCreated }: { year: number; onSermonCreated: () => void }) {
  const router = useRouter();
  const { t, isAr } = useI18n();
  const events = useMemo(() => hijriEventsForYear(year), [year]);
  const [prepState, setPrepState] = useState<Record<string, string>>({});
  const [creatingKey, setCreatingKey] = useState<string | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(`jp_hijri_prep_${year}`);
      if (saved) setPrepState(JSON.parse(saved));
    } catch {}
  }, [year]);

  function cyclePrepStatus(eventKey: string) {
    setPrepState((prev) => {
      const cur = prev[eventKey] ?? "not_started";
      const next = cur === "not_started" ? "in_prep" : cur === "in_prep" ? "prepared" : "not_started";
      const updated = { ...prev, [eventKey]: next };
      try { localStorage.setItem(`jp_hijri_prep_${year}`, JSON.stringify(updated)); } catch {}
      return updated;
    });
  }

  async function startKhutbah(ev: { key: string; date: Date; hijriYear: number }) {
    const stateKey = `${ev.key}:${ev.hijriYear}`;
    if (creatingKey) return;
    setCreatingKey(stateKey);
    try {
      const title = t(ev.key);
      const isoDate = toISODate(ev.date);
      const res = await fetch("/api/sermons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, type: "eid", status: "draft", scheduledDate: isoDate }),
      });
      if (res.ok) {
        const sermon = await res.json();
        onSermonCreated();
        router.push(`/sermons/${sermon.id}/edit`);
      }
    } catch {} finally {
      setCreatingKey(null);
    }
  }

  const PREP_STATUS: Record<string, { bg: string; text: string; dot: string; label: string }> = {
    not_started: { bg: "#f0eeeb", text: "#6d797a", dot: "#bcc9ca", label: t("themes.notStarted") },
    in_prep: { bg: "#FBF6EC", text: "#B8860B", dot: "#C4A35A", label: t("themes.inPrep") },
    prepared: { bg: "#e8f5ee", text: "#1f7a4d", dot: "#2f9e5f", label: t("themes.prepared") },
  };

  const HIJRI_MONTHS = [
    "Muharram", "Safar", "Rabi al-Awwal", "Rabi al-Thani",
    "Jumada al-Ula", "Jumada al-Thani", "Rajab", "Sha'ban",
    "Ramadan", "Shawwal", "Dhul Qi'dah", "Dhul Hijjah",
  ];
  const HIJRI_MONTHS_AR = [
    "محرم", "صفر", "ربيع الأول", "ربيع الثاني",
    "جمادى الأولى", "جمادى الثانية", "رجب", "شعبان",
    "رمضان", "شوال", "ذو القعدة", "ذو الحجة",
  ];

  const prepared = events.filter((e) => (prepState[`${e.key}:${e.hijriYear}`] ?? "not_started") === "prepared").length;

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-5">
        <div>
          <p className="text-[13px] text-mute">
            {t("themes.hijriEventsDesc")} <span className="font-bold text-ink">{year}</span>
          </p>
          <p className="text-[10px] text-mute/50 italic mt-1">{t("themes.hijriEventsNote")}</p>
        </div>
        <div className="flex items-center gap-3 text-[11px] text-mute/70 font-medium tabular-nums">
          <span>{prepared}/{events.length} {t("themes.prepared")}</span>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        {events.map((ev) => {
          const stateKey = `${ev.key}:${ev.hijriYear}`;
          const status = prepState[stateKey] ?? "not_started";
          const st = PREP_STATUS[status];
          const hijriDate = `${ev.hDay} ${isAr ? HIJRI_MONTHS_AR[ev.hMonth - 1] : HIJRI_MONTHS[ev.hMonth - 1]} ${ev.hijriYear}`;
          const gregDate = ev.date.toLocaleDateString(isAr ? "ar-SA" : "en-US", { weekday: "short", month: "short", day: "numeric" });
          const dayOfWeek = ev.date.getDay();
          const isFriday = dayOfWeek === 5;
          const isPast = ev.date < new Date();

          return (
            <div key={stateKey}
              className={`bg-white border border-line/50 overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.04)] transition-all hover:shadow-md ${isPast ? "opacity-60" : ""}`}>
              <div className="flex items-center gap-4 px-5 py-3.5">
                <div className="w-10 h-10 grid place-items-center shrink-0" style={{ backgroundColor: ev.color + "15", color: ev.color }}>
                  <span className="material-symbols-outlined text-xl">{ev.icon}</span>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-[14px] font-bold text-ink leading-tight truncate">{t(ev.key)}</p>
                    {isFriday && (
                      <span className="text-[8px] font-bold px-1.5 py-[2px] bg-primary/10 text-primary whitespace-nowrap">
                        {isAr ? "يوافق جمعة" : "Falls on Friday"}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[11px] text-mute/70 font-medium">{gregDate}</span>
                    <span className="text-mute/30">·</span>
                    <span className="text-[11px] text-accent-gold/70 font-medium" dir={isAr ? "rtl" : "ltr"}>{hijriDate}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[8px] text-mute/40 italic hidden sm:inline">
                    {isAr ? "±١ يوم" : "±1 day"}
                  </span>
                  <button onClick={() => cyclePrepStatus(stateKey)}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 transition-all duration-200 hover:opacity-80"
                    style={{ backgroundColor: st.bg }}
                    title={t("themes.prepStatus")}>
                    <span className="w-[6px] h-[6px] rounded-full" style={{ backgroundColor: st.dot }} />
                    <span className="text-[10px] font-semibold" style={{ color: st.text }}>{st.label}</span>
                  </button>
                  <button onClick={() => startKhutbah(ev)}
                    disabled={creatingKey === stateKey}
                    className="flex items-center gap-1 px-2.5 py-1.5 bg-primary/10 text-primary hover:bg-primary hover:text-white transition-all duration-200 text-[10px] font-semibold">
                    <span className="material-symbols-outlined text-[13px]">{creatingKey === stateKey ? "hourglass_top" : "edit_note"}</span>
                    {isAr ? "ابدأ الخطبة" : "Start khutbah"}
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {events.length === 0 && (
          <div className="text-center py-12 text-mute/50 text-[13px]">
            {isAr ? "لا توجد مناسبات هجرية لهذا العام" : "No Hijri events found for this year"}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Loading skeleton ── */
function SkeletonSeasons() {
  return (
    <div className="flex flex-col gap-5 max-w-6xl">
      {[0, 1, 2].map((i) => (
        <div key={i} className="bg-white border border-line rounded-xl overflow-hidden animate-pulse">
          <div className="h-14 border-b border-line bg-surface/60" />
          <div className="p-5 flex flex-col gap-3">
            {[0, 1, 2].map((j) => <div key={j} className="h-4 bg-line/60 rounded w-2/3" />)}
          </div>
        </div>
      ))}
    </div>
  );
}
