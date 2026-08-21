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
}

interface Sermon {
  id: string;
  title: string;
  status: string;
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

const TARGET_FRIDAYS = 52;

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
  const [view, setView] = useState<"seasons" | "grid">("seasons");

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

  const [gridAddIso, setGridAddIso] = useState<string | null>(null);
  const [gridAddText, setGridAddText] = useState("");
  const [gridBusy, setGridBusy] = useState(false);

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
  const pct = Math.min(100, Math.round((titled / TARGET_FRIDAYS) * 100));

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
    const padded = topics.length < 4 ? [...topics, ...Array(4 - topics.length).fill("")] : topics.slice(0, 4);
    setFormTopics(padded);
  }

  function closeForm() {
    setShowCreate(false);
    setEditingTheme(null);
    setSaving(false);
  }

  async function handleSave() {
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

  function startAddTitle(theme: Theme, key: string, subTopicId: string | null) {
    setAddingKey(key);
    setAddTitleText("");
    setAddDate(nextFridayForTheme(theme) ?? "");
    setAddSubTopicId(subTopicId);
  }
  function cancelAddTitle() {
    setAddingKey(null);
    setAddTitleText("");
    setAddSubTopicId(null);
  }
  async function submitAddTitle(theme: Theme) {
    const title = addTitleText.trim();
    if (!title || addBusy) { if (!title) cancelAddTitle(); return; }
    setAddBusy(true);
    await fetch("/api/sermons", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, themeId: theme.id, subTopicId: addSubTopicId, status: "draft", scheduledDate: addDate || nextFridayForTheme(theme) }),
    });
    setAddTitleText("");
    setAddingKey(null);
    setAddSubTopicId(null);
    setAddBusy(false);
    fetchAll();
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
    await fetch("/api/sermons", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, themeId: themeIdForDate(gridAddIso), status: "draft", scheduledDate: gridAddIso }),
    });
    setGridAddText("");
    setGridAddIso(null);
    setGridBusy(false);
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
                {t("themes.annualPlanAr")} — {TARGET_FRIDAYS} {t("themes.fridays")}
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
                {(["seasons", "grid"] as const).map((v) => (
                  <button key={v} onClick={() => setView(v)}
                    className={`text-[12px] font-medium px-3 py-[7px] rounded-[9px] transition-all duration-200 flex items-center gap-1.5 ${
                      view === v ? "bg-primary text-white shadow-[0_1px_3px_rgba(0,102,109,0.3)]" : "text-mute hover:text-ink"
                    }`}>
                    <span className="material-symbols-outlined text-[15px]">{v === "seasons" ? "table_rows" : "grid_view"}</span>
                    {v === "seasons" ? t("themes.seasons") : t("themes.52fridays")}
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
                  <span className="text-mute/80 font-normal"> / {TARGET_FRIDAYS} {t("themes.fridaysTitled")}</span>
                </p>
                <p className="text-[12px] text-mute/60 font-medium tabular-nums">{pct}%</p>
              </div>
              <div className="h-[6px] rounded-full bg-ink/[0.06] overflow-hidden flex">
                <div className="h-full bg-primary rounded-full transition-[width] duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]"
                  style={{ width: `${Math.min(100, (delivered / TARGET_FRIDAYS) * 100)}%` }} title={`${delivered} ${t("themes.delivered")}`} />
                <div className="h-full bg-primary/35 transition-[width] duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]"
                  style={{ width: `${Math.min(100, ((written - delivered) / TARGET_FRIDAYS) * 100)}%` }} title={t("themes.written")} />
                <div className="h-full bg-accent-gold/45 transition-[width] duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]"
                  style={{ width: `${Math.min(100, ((titled - written) / TARGET_FRIDAYS) * 100)}%` }} title={t("themes.planned")} />
              </div>
              <div className="flex flex-wrap gap-x-5 gap-y-1 mt-2.5">
                <Legend color="#00666d" label={`${delivered} ${t("themes.delivered")}`} />
                <Legend color="rgba(0,102,109,0.35)" label={`${written - delivered} ${t("themes.written")}`} />
                <Legend color="rgba(196,163,90,0.55)" label={`${titled - written} ${t("themes.planned")}`} />
                <Legend color="rgba(28,28,26,0.08)" label={`${Math.max(0, TARGET_FRIDAYS - titled)} ${t("themes.open")}`} />
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
          ) : view === "grid" ? (
            <YearGrid fridays={fridays} taken={takenDates} year={year}
              gridAddIso={gridAddIso} gridAddText={gridAddText} setGridAddText={setGridAddText}
              onStartGridAdd={startGridAdd} onCancelGridAdd={cancelGridAdd} onSubmitGridAdd={submitGridAdd} gridBusy={gridBusy} />
          ) : yearThemes.length === 0 ? (
            <EmptyWizard year={year} onStart={() => openCreate(1)} />
          ) : (
            <div className="flex flex-col gap-4 max-w-6xl">
              {seasonGroups.map((sg, i) => (
                <section key={sg.n} className="annual-rise" style={{ animationDelay: `${i * 60}ms` }}>
                  <SeasonBlock
                    season={sg}
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
                  />
                </section>
              ))}
              <button onClick={handleNewSermonBlank}
                className="self-start text-[11px] text-mute/45 hover:text-primary transition-all duration-200 flex items-center gap-1.5 mt-2 py-1">
                <span className="material-symbols-outlined text-[15px]">add</span>
                {t("themes.addStandalone")}
              </button>
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
                    </div>
                  ))}
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
  season, themeSermons, onEditTheme, onAddThemeToSeason,
  addingKey, onStartAdd, onCancelAdd, addTitleText, setAddTitleText,
  addDate, setAddDate, dateOptionsFor, submitAddTitle, addBusy,
}: {
  season: { n: number; label: string; ar: string; range: string; startMonth: number; themes: Theme[] };
  themeSermons: (id: string) => Sermon[];
  onEditTheme: (t: Theme) => void;
  onAddThemeToSeason: () => void;
  addingKey: string | null;
  onStartAdd: (t: Theme, key: string, subTopicId: string | null) => void;
  onCancelAdd: () => void;
  addTitleText: string;
  setAddTitleText: (v: string) => void;
  addDate: string;
  setAddDate: (v: string) => void;
  dateOptionsFor: (t: Theme) => string[];
  submitAddTitle: (t: Theme) => void;
  addBusy: boolean;
}) {
  const { t, isAr } = useI18n();
  const STATUS_MAP = useStatusMap();
  const theme = season.themes[0] ?? null;
  const color = theme?.color || "#00666d";
  const ss = season.themes.flatMap((t) => themeSermons(t.id));
  const allSubTopics = season.themes.flatMap((t) => t.sub_topics);
  const subSlots = Array.from({ length: 4 }, (_, i) => allSubTopics[i] ?? null);
  const seasonLabel = isAr ? t(`season.${season.n}`) : season.label;
  const seasonRange = isAr ? t(`season.${season.n}.range`) : season.range;

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
          <span className="text-[11px] text-mute/70 font-medium tabular-nums hidden sm:inline">
            {ss.length} {t("themes.titles")}
          </span>
        )}
      </div>

      {!theme ? (
        <button onClick={onAddThemeToSeason}
          className="w-full py-10 text-center text-[12px] text-mute/50 hover:text-primary transition-all duration-200 flex flex-col items-center gap-2 group">
          <span className="material-symbols-outlined text-2xl text-mute/25 group-hover:text-primary/50 transition-colors duration-200">add_circle</span>
          {t("themes.setMainTheme")} {seasonRange}
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
            </div>
            <span className="text-[10px] text-mute/70 font-medium">
              {theme.sub_topics.length}/4 {t("themes.bouquets")} · {ss.length} {t("themes.titles")}
            </span>
          </div>

          {/* Column labels */}
          <div className="hidden sm:grid grid-cols-[170px_minmax(0,1fr)] px-5 pt-3 pb-1.5 text-[10px] font-semibold text-mute/60 uppercase tracking-wide">
            <span>{t("themes.subBouquet")}</span><span>{t("themes.sermonTitles")}</span>
          </div>

          {/* 4 sub-bouquet slots */}
          <div className="divide-y divide-line/30">
            {subSlots.map((sub, si) => {
              const slice = sub
                ? ss.filter((s) => s.sub_topic_id === sub.id).slice(0, 4)
                : [];
              const key = `${theme.id}:${si}`;
              const isAdding = addingKey === key;
              const dateOpts = isAdding ? dateOptionsFor(theme) : [];
              const hasSubTopic = sub !== null;
              const emptySlots = 4 - slice.length;

              return (
                <div key={si} className="grid grid-cols-1 sm:grid-cols-[170px_minmax(0,1fr)]">
                  <div className="px-5 sm:px-4 pt-2.5 sm:py-3 sm:border-r border-line/30 flex items-center gap-2">
                    <span className="w-[18px] h-[18px] text-[9px] font-bold grid place-items-center shrink-0 text-white"
                      style={{ backgroundColor: hasSubTopic ? color : "#ccc" }}>
                      {si + 1}
                    </span>
                    <span className={`text-[12.5px] font-semibold ${hasSubTopic ? "text-ink" : "text-mute/35 italic"}`}>
                      {sub?.name ?? t("themes.emptySlot")}
                    </span>
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
                        {slice.map((sr) => {
                          const st = STATUS_MAP[sr.status] ?? STATUS_MAP.draft;
                          return (
                            <Link key={sr.id} href={`/sermons/${sr.id}/edit`}
                              className="group flex items-center gap-2.5 py-[7px] -mx-2 px-2 hover:bg-ink/[0.03] transition-all duration-200">
                              <span className="w-[5px] h-[5px] rounded-full shrink-0" style={{ backgroundColor: st.dot }} />
                              <span className="text-[11px] text-mute/70 font-medium tabular-nums w-[42px] shrink-0">
                                {sr.scheduled_date ? formatFriday(sr.scheduled_date.slice(0, 10), isAr) : "—"}
                              </span>
                              <span className="text-[13px] text-ink font-medium truncate min-w-0 flex-1 group-hover:text-primary transition-colors duration-200">
                                {sr.title}
                              </span>
                              <span className="text-[9.5px] font-semibold px-1.5 py-[3px] whitespace-nowrap"
                                style={{ backgroundColor: st.bg, color: st.text }}>{st.label}</span>
                            </Link>
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
                        ) : emptySlots > 0 ? (
                          <button onClick={() => onStartAdd(theme, key, sub.id)}
                            className="mt-0.5 self-start text-[11px] font-medium text-mute/50 hover:text-primary transition-all duration-200 flex items-center gap-0.5 py-1">
                            <span className="material-symbols-outlined text-[13px]">add</span> {t("themes.addTitle")}
                            <span className="text-mute/30 ml-1">({emptySlots} {t("themes.remaining")})</span>
                          </button>
                        ) : null}
                      </>
                    )}
                  </div>
                </div>
              );
            })}

          </div>
        </div>
      )}
    </div>
  );
}

/* ── 52-Friday master grid ── */
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
function EmptyWizard({ year, onStart }: { year: number; onStart: () => void }) {
  const { t } = useI18n();
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
      <button onClick={onStart}
        className="px-7 py-3 bg-primary text-white text-sm font-bold rounded-full hover:bg-secondary transition-all active:scale-95 shadow-sm">
        {t("themes.startSeason1")}
      </button>
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
