"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

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

const STATUS_MAP: Record<string, { bg: string; text: string; dot: string; label: string }> = {
  draft: { bg: "#f0eeeb", text: "#6d797a", dot: "#bcc9ca", label: "Not started" },
  in_review: { bg: "#fdf3e7", text: "#a9822f", dot: "#C4A35A", label: "Planned" },
  ready: { bg: "#e8f5ee", text: "#1f7a4d", dot: "#2f9e5f", label: "Written" },
  delivered: { bg: "#e9f0f7", text: "#3c6194", dot: "#5b7fa6", label: "Delivered" },
  archived: { bg: "#f0eeeb", text: "#6d797a", dot: "#bcc9ca", label: "Archived" },
};

const TARGET_FRIDAYS = 52;

function seasonIndexOf(month: number) {
  return Math.floor((Math.min(12, Math.max(1, month)) - 1) / 3);
}

function fridaysInYear(year: number): Date[] {
  const out: Date[] = [];
  const d = new Date(year, 0, 1);
  // advance to first Friday (getDay() === 5)
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

function formatFriday(iso: string) {
  const d = new Date(iso + "T00:00:00");
  return `${d.getDate()} ${MONTH_SHORT[d.getMonth()]}`;
}

export default function AnnualPlanPage() {
  const router = useRouter();
  const [themes, setThemes] = useState<Theme[]>([]);
  const [sermons, setSermons] = useState<Sermon[]>([]);
  const [loading, setLoading] = useState(true);
  const [year, setYear] = useState(new Date().getFullYear());
  const [view, setView] = useState<"seasons" | "grid">("seasons");

  // Create / edit theme panel
  const [editingTheme, setEditingTheme] = useState<Theme | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formName, setFormName] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formColor, setFormColor] = useState("#00666d");
  const [formMonth, setFormMonth] = useState(1);
  const [formTopics, setFormTopics] = useState<string[]>(["", "", "", ""]);

  // Inline title creation (season table): keyed by `${themeId}:${subIdx}`
  const [addingKey, setAddingKey] = useState<string | null>(null);
  const [addTitleText, setAddTitleText] = useState("");
  const [addDate, setAddDate] = useState<string>("");
  const [addBusy, setAddBusy] = useState(false);

  // Inline title creation (52-Friday grid): keyed by ISO date
  const [gridAddIso, setGridAddIso] = useState<string | null>(null);
  const [gridAddText, setGridAddText] = useState("");
  const [gridBusy, setGridBusy] = useState(false);

  useEffect(() => { fetchAll(); }, []);

  function fetchAll() {
    Promise.all([
      fetch("/api/themes").then((r) => r.json()),
      fetch("/api/sermons").then((r) => r.json()),
    ])
      .then(([t, s]) => { setThemes(t); setSermons(s); setLoading(false); })
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

  // group themes into 4 seasons
  const seasonGroups = SEASONS.map((s) => ({
    ...s,
    themes: yearThemes.filter((t) => seasonIndexOf(t.month) === s.n - 1),
  }));

  // ── Friday helpers ──
  const fridays = useMemo(() => fridaysInYear(year), [year]);
  const takenDates = useMemo(() => {
    const m = new Map<string, Sermon>();
    for (const s of yearSermons) if (s.scheduled_date) m.set(s.scheduled_date.slice(0, 10), s);
    return m;
  }, [yearSermons]);

  // ISO dates of every Friday inside a theme's season (its 3-month quarter)
  function seasonFridayISOs(theme: Theme): string[] {
    const startMonth = SEASONS[seasonIndexOf(theme.month)].startMonth; // 1,4,7,10
    return fridays
      .filter((d) => { const m = d.getMonth() + 1; return m >= startMonth && m <= startMonth + 2; })
      .map(toISODate);
  }

  // Open (unassigned) Fridays in the season, optionally keeping the currently-picked one
  function openSeasonFridays(theme: Theme, keep?: string | null): string[] {
    return seasonFridayISOs(theme).filter((iso) => !takenDates.has(iso) || iso === keep);
  }

  function nextFridayForTheme(theme: Theme): string | null {
    const seasonISOs = seasonFridayISOs(theme);
    const free = seasonISOs.find((iso) => !takenDates.has(iso));
    return free ?? seasonISOs[seasonISOs.length - 1] ?? null;
  }

  // Which theme "owns" a given Friday date — the theme with the greatest start month
  // at or before that month. On a tie (several themes share a start month), keep the
  // first one, i.e. the season's primary theme.
  function themeIdForDate(iso: string): string | null {
    const month = Number(iso.slice(5, 7));
    let chosen: Theme | null = null;
    let chosenMonth = -1;
    for (const t of yearThemes) {
      if (t.month <= month && t.month > chosenMonth) { chosen = t; chosenMonth = t.month; }
    }
    return chosen?.id ?? yearThemes[0]?.id ?? null;
  }

  // ── Theme panel ──
  function openCreate(prefillMonth?: number) {
    setEditingTheme(null);
    setShowCreate(true);
    const month = prefillMonth ?? SEASONS[Math.min(3, yearThemes.length)]?.startMonth ?? 1;
    setFormName("");
    setFormDesc("");
    setFormColor(THEME_COLORS[yearThemes.length % THEME_COLORS.length].value);
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
    setFormTopics(topics.length < 4 ? [...topics, ...Array(4 - topics.length).fill("")] : topics);
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
    if (!confirm("Delete this theme? Its Friday sermons stay but become unlinked from the plan.")) return;
    await fetch(`/api/themes/${id}`, { method: "DELETE" });
    closeForm();
    fetchAll();
  }

  function addSubField() { setFormTopics([...formTopics, ""]); }
  function setSubField(i: number, v: string) { setFormTopics(formTopics.map((t, idx) => (idx === i ? v : t))); }
  function removeSubField(i: number) { setFormTopics(formTopics.filter((_, idx) => idx !== i)); }

  // ── Inline add title (season table) ──
  function startAddTitle(theme: Theme, key: string) {
    setAddingKey(key);
    setAddTitleText("");
    setAddDate(nextFridayForTheme(theme) ?? "");
  }
  function cancelAddTitle() {
    setAddingKey(null);
    setAddTitleText("");
  }
  async function submitAddTitle(theme: Theme) {
    const title = addTitleText.trim();
    if (!title || addBusy) { if (!title) cancelAddTitle(); return; }
    setAddBusy(true);
    await fetch("/api/sermons", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, themeId: theme.id, status: "draft", scheduledDate: addDate || nextFridayForTheme(theme) }),
    });
    setAddTitleText("");
    setAddingKey(null);
    setAddBusy(false);
    fetchAll();
  }

  // ── Inline add title (52-Friday grid) ──
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

  // ── Export CSV ──
  function exportPlan() {
    const rows: string[][] = [["Season", "Main theme", "Sub-bouquet", "Friday", "Sermon title", "Status"]];
    seasonGroups.forEach((sg) => {
      sg.themes.forEach((theme) => {
        const ss = themeSermons(theme.id);
        const subs = theme.sub_topics.length ? theme.sub_topics.map((s) => s.name) : ["General"];
        const per = Math.max(1, Math.ceil(ss.length / subs.length));
        subs.forEach((sub, si) => {
          const slice = ss.slice(si * per, (si + 1) * per);
          if (slice.length === 0) rows.push([sg.label, theme.name, sub, "", "", ""]);
          slice.forEach((sr) =>
            rows.push([
              sg.label, theme.name, sub,
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
        <header className="px-4 sm:px-6 lg:px-10 pt-6 pb-5 border-b border-line">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div>
              <p className="text-[10px] font-bold tracking-[2.5px] text-accent-gold uppercase mb-1">Plan phase</p>
              <h1 className="text-2xl sm:text-[28px] font-extrabold text-primary tracking-tight leading-none">
                Annual Plan · {year}
              </h1>
              <p className="mt-1.5 text-[13px] text-mute font-[var(--font-arabic)]" dir="rtl">
                الخطة السنوية لخطبة الجمعة — {TARGET_FRIDAYS} جمعة
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Year stepper */}
              <div className="flex items-center bg-white border border-line rounded-full overflow-hidden">
                <button onClick={() => setYear(year - 1)} aria-label="Previous year"
                  className="w-8 h-8 grid place-items-center text-mute hover:text-primary hover:bg-primary/5 transition-colors">‹</button>
                <span className="text-sm font-bold text-primary px-2 min-w-[46px] text-center tabular-nums">{year}</span>
                <button onClick={() => setYear(year + 1)} aria-label="Next year"
                  className="w-8 h-8 grid place-items-center text-mute hover:text-primary hover:bg-primary/5 transition-colors">›</button>
              </div>
              {/* View toggle */}
              <div className="flex items-center bg-white border border-line rounded-full p-0.5">
                {(["seasons", "grid"] as const).map((v) => (
                  <button key={v} onClick={() => setView(v)}
                    className={`text-[12px] font-semibold px-3.5 py-1.5 rounded-full transition-all flex items-center gap-1.5 ${
                      view === v ? "bg-primary text-white shadow-sm" : "text-mute hover:text-ink"
                    }`}>
                    <span className="material-symbols-outlined text-[15px]">{v === "seasons" ? "table_rows" : "grid_view"}</span>
                    {v === "seasons" ? "Seasons" : "52 Fridays"}
                  </button>
                ))}
              </div>
              <button onClick={exportPlan}
                className="h-9 px-3.5 text-[12px] font-semibold text-ink bg-white border border-line rounded-full hover:bg-surface transition-colors flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px]">download</span>
                <span className="hidden sm:inline">Export</span>
              </button>
            </div>
          </div>

          {/* Progress meter */}
          <div className="mt-5 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6">
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline justify-between mb-1.5">
                <p className="text-[12px] font-semibold text-ink">
                  <span className="text-primary text-[15px] font-extrabold tabular-nums">{titled}</span>
                  <span className="text-mute"> / {TARGET_FRIDAYS} Fridays titled</span>
                </p>
                <p className="text-[11px] text-mute tabular-nums">{pct}%</p>
              </div>
              <div className="h-2 rounded-full bg-line/70 overflow-hidden flex">
                <div className="h-full bg-primary transition-[width] duration-500 ease-out"
                  style={{ width: `${Math.min(100, (delivered / TARGET_FRIDAYS) * 100)}%` }} title={`${delivered} delivered`} />
                <div className="h-full bg-primary/40 transition-[width] duration-500 ease-out"
                  style={{ width: `${Math.min(100, ((written - delivered) / TARGET_FRIDAYS) * 100)}%` }} title="written" />
                <div className="h-full bg-accent-gold/50 transition-[width] duration-500 ease-out"
                  style={{ width: `${Math.min(100, ((titled - written) / TARGET_FRIDAYS) * 100)}%` }} title="planned" />
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
                <Legend color="#00666d" label={`${delivered} delivered`} />
                <Legend color="rgba(0,102,109,0.4)" label={`${written - delivered} written`} />
                <Legend color="rgba(196,163,90,0.6)" label={`${titled - written} planned`} />
                <Legend color="#e8e5df" label={`${Math.max(0, TARGET_FRIDAYS - titled)} open`} />
              </div>
            </div>
            <div className="flex gap-2 shrink-0">
              <button onClick={() => openCreate()}
                className="h-9 px-4 text-[12px] font-bold text-white bg-primary rounded-full hover:bg-secondary transition-colors active:scale-95 flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px]">add</span> Main theme
              </button>
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
            <div className="flex flex-col gap-5 max-w-6xl">
              {seasonGroups.map((sg, i) => (
                <section key={sg.n} className="annual-rise" style={{ animationDelay: `${i * 70}ms` }}>
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
                className="self-start text-[12px] text-mute hover:text-primary transition-colors flex items-center gap-1.5 mt-1">
                <span className="material-symbols-outlined text-[16px]">bolt</span>
                Add a standalone Friday (Eid, special occasion)
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Create / Edit panel ── */}
      {isFormOpen && (
        <>
          <div className="fixed inset-0 bg-black/25 backdrop-blur-sm z-40 lg:hidden" onClick={closeForm} />
          <aside className="fixed right-0 top-0 h-full w-full sm:w-[400px] z-50 lg:z-auto lg:relative lg:w-[380px] border-l border-line bg-white overflow-y-auto shrink-0 shadow-xl lg:shadow-none">
            <div className="sticky top-0 bg-white/95 backdrop-blur border-b border-line px-6 py-4 flex items-center justify-between z-10">
              <div>
                <p className="text-[10px] font-bold tracking-[2px] uppercase text-accent-gold">
                  {formSeason.label} · {formSeason.range}
                </p>
                <p className="text-lg font-bold text-primary">{editingTheme ? "Edit theme" : "New main theme"}</p>
              </div>
              <button onClick={closeForm} aria-label="Close"
                className="w-8 h-8 rounded-full bg-surface border border-line grid place-items-center text-mute hover:text-primary transition-colors">
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            <div className="p-6 flex flex-col gap-5">
              <Field label="Theme name">
                <input type="text" value={formName} onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Foundations of Faith" autoFocus
                  className="w-full text-[14px] font-semibold text-ink border border-line rounded-lg px-3.5 py-2.5 outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all placeholder:text-mute/50" />
              </Field>

              <Field label="Season (start month)">
                <select value={formMonth} onChange={(e) => setFormMonth(Number(e.target.value))}
                  className="w-full text-[13px] font-semibold text-ink border border-line rounded-lg px-3 py-2.5 outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all">
                  {SEASONS.map((s) => (
                    <option key={s.n} value={s.startMonth}>{s.label} · {s.range}</option>
                  ))}
                  {MONTHS.map((m, i) => (
                    <option key={m} value={i + 1}>Starts {m}</option>
                  ))}
                </select>
              </Field>

              <Field label="Accent color">
                <div className="flex gap-2.5">
                  {THEME_COLORS.map((c) => (
                    <button key={c.value} onClick={() => setFormColor(c.value)} title={c.label}
                      className={`w-8 h-8 rounded-full transition-all ${formColor === c.value ? "ring-2 ring-offset-2 ring-primary scale-110" : "hover:scale-110"}`}
                      style={{ backgroundColor: c.value }} />
                  ))}
                </div>
              </Field>

              <Field label="Description">
                <textarea value={formDesc} onChange={(e) => setFormDesc(e.target.value)} rows={2}
                  placeholder="What this season's theme is about..."
                  className="w-full text-[13px] text-ink border border-line rounded-lg px-3.5 py-2.5 outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all resize-none placeholder:text-mute/50" />
              </Field>

              <Field label="Sub-bouquets · الباقات الفرعية">
                <div className="flex flex-col gap-2">
                  {formTopics.map((t, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full text-[10px] font-bold grid place-items-center shrink-0 text-white"
                        style={{ backgroundColor: formColor }}>{i + 1}</span>
                      <input type="text" value={t} onChange={(e) => setSubField(i, e.target.value)}
                        placeholder={`Sub-bouquet ${i + 1}`}
                        className="flex-1 text-[13px] text-ink border border-line rounded-lg px-3 py-2 outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all placeholder:text-mute/50" />
                      {formTopics.length > 1 && (
                        <button onClick={() => removeSubField(i)} className="text-mute hover:text-red-500 transition-colors" aria-label="Remove">
                          <span className="material-symbols-outlined text-base">close</span>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                {formTopics.length < 6 && (
                  <button onClick={addSubField} className="text-[11px] font-bold text-primary hover:text-secondary mt-2.5 flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">add</span> Add sub-bouquet
                  </button>
                )}
              </Field>

              <div className="flex flex-col gap-2.5 pt-1">
                <button onClick={handleSave} disabled={!formName.trim() || saving}
                  className={`w-full py-2.5 text-[13px] font-bold rounded-lg transition-all ${
                    formName.trim() && !saving ? "bg-primary text-white hover:bg-secondary active:scale-[0.98]" : "bg-line text-mute cursor-not-allowed"
                  }`}>
                  {saving ? "Saving…" : editingTheme ? "Update theme" : "Create theme"}
                </button>
                {editingTheme && (
                  <button onClick={() => handleDelete(editingTheme.id)}
                    className="w-full py-2 text-[12px] font-semibold text-red-500 border border-red-200 rounded-lg hover:bg-red-50 transition-all">
                    Delete theme
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
    <span className="flex items-center gap-1.5 text-[10.5px] text-mute">
      <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: color }} />
      {label}
    </span>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-[10px] font-bold tracking-[1.5px] uppercase text-mute block mb-1.5">{label}</label>
      {children}
    </div>
  );
}

/* ── Season block: the Main theme │ Sub-bouquets │ Sermon titles table ── */
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
  onStartAdd: (t: Theme, key: string) => void;
  onCancelAdd: () => void;
  addTitleText: string;
  setAddTitleText: (v: string) => void;
  addDate: string;
  setAddDate: (v: string) => void;
  dateOptionsFor: (t: Theme) => string[];
  submitAddTitle: (t: Theme) => void;
  addBusy: boolean;
}) {
  const seasonSermons = season.themes.reduce((n, t) => n + themeSermons(t.id).length, 0);

  return (
    <div className="bg-white border border-line rounded-xl overflow-hidden">
      {/* Season header */}
      <div className="flex items-center justify-between px-4 sm:px-5 py-3 border-b border-line bg-surface/60">
        <div className="flex items-center gap-3">
          <span className="w-9 h-9 rounded-lg bg-primary/10 text-primary grid place-items-center text-[15px] font-extrabold tabular-nums">
            {season.n}
          </span>
          <div>
            <p className="text-[14px] font-bold text-ink leading-tight">
              {season.label} <span className="text-mute font-medium">· {season.range}</span>
            </p>
            <p className="text-[11px] text-mute font-[var(--font-arabic)]" dir="rtl">{season.ar}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-mute tabular-nums hidden sm:inline">{seasonSermons} Fridays</span>
          <button onClick={onAddThemeToSeason}
            className="text-[11px] font-semibold text-primary border border-primary/20 bg-primary/5 rounded-full px-3 py-1 hover:bg-primary/10 transition-colors flex items-center gap-1">
            <span className="material-symbols-outlined text-[14px]">add</span> Theme
          </button>
        </div>
      </div>

      {season.themes.length === 0 ? (
        <button onClick={onAddThemeToSeason}
          className="w-full py-8 text-center text-[12px] text-mute hover:text-primary hover:bg-primary/[0.02] transition-colors flex flex-col items-center gap-1.5">
          <span className="material-symbols-outlined text-2xl text-line">add_circle</span>
          Set the main theme for {season.range}
        </button>
      ) : (
        <div>
          {/* Column labels */}
          <div className="hidden sm:grid grid-cols-[190px_minmax(0,1fr)] px-5 pt-3 pb-1.5 text-[9px] font-bold tracking-[1.5px] uppercase text-mute/70">
            <span>Main theme</span>
            <span className="grid grid-cols-[170px_minmax(0,1fr)]"><span>Sub-bouquet</span><span>Sermon titles · Fridays</span></span>
          </div>

          {season.themes.map((theme) => {
            const color = theme.color || "#00666d";
            const ss = themeSermons(theme.id);
            const subs = theme.sub_topics.length ? theme.sub_topics.map((s) => s.name) : ["Untitled sub-bouquet"];
            const per = Math.max(1, Math.ceil(ss.length / subs.length));

            return (
              <div key={theme.id} className="grid grid-cols-1 sm:grid-cols-[190px_minmax(0,1fr)] border-t border-line">
                {/* Main theme cell */}
                <div className="px-5 py-3.5 sm:border-r border-line flex sm:flex-col items-center sm:items-start gap-2 sm:gap-1.5 bg-surface/30">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
                  <button onClick={() => onEditTheme(theme)}
                    className="text-left text-[14px] font-bold text-ink hover:text-primary transition-colors leading-snug">
                    {theme.name}
                  </button>
                  <span className="text-[10px] text-mute sm:mt-0.5">
                    {theme.sub_topics.length} bouquets · {ss.length} Fridays
                  </span>
                </div>

                {/* Sub-bouquets + titles */}
                <div className="divide-y divide-line/70">
                  {subs.map((sub, si) => {
                    const slice = ss.slice(si * per, (si + 1) * per);
                    const key = `${theme.id}:${si}`;
                    const isAdding = addingKey === key;
                    const dateOpts = isAdding ? dateOptionsFor(theme) : [];
                    return (
                      <div key={si} className="grid grid-cols-1 sm:grid-cols-[170px_minmax(0,1fr)]">
                        {/* sub-bouquet name */}
                        <div className="px-5 sm:px-4 pt-2.5 sm:py-3 sm:border-r border-line/70 flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full text-[10px] font-bold grid place-items-center shrink-0 text-white" style={{ backgroundColor: color }}>
                            {si + 1}
                          </span>
                          <span className="text-[12.5px] font-semibold text-ink">{sub}</span>
                        </div>
                        {/* titles */}
                        <div className="px-5 sm:px-4 pb-2.5 sm:py-2 flex flex-col">
                          {slice.length === 0 && !isAdding && (
                            <span className="text-[11px] text-mute/60 italic py-1">No titles yet</span>
                          )}
                          {slice.map((sr) => {
                            const st = STATUS_MAP[sr.status] ?? STATUS_MAP.draft;
                            return (
                              <Link key={sr.id} href={`/sermons/${sr.id}/edit`}
                                className="group flex items-center gap-2.5 py-1.5 -mx-1.5 px-1.5 rounded-md hover:bg-primary/[0.04] transition-colors">
                                <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: st.dot }} />
                                <span className="text-[10px] text-mute tabular-nums w-[42px] shrink-0">
                                  {sr.scheduled_date ? formatFriday(sr.scheduled_date.slice(0, 10)) : "—"}
                                </span>
                                <span className="text-[12.5px] text-ink font-medium truncate min-w-0 flex-1 group-hover:text-primary transition-colors">
                                  {sr.title}
                                </span>
                                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded whitespace-nowrap"
                                  style={{ backgroundColor: st.bg, color: st.text }}>{st.label}</span>
                              </Link>
                            );
                          })}

                          {isAdding ? (
                            <div className="mt-1.5 flex flex-col gap-2 bg-primary/[0.03] border border-primary/20 rounded-lg p-2">
                              <input autoFocus value={addTitleText} disabled={addBusy}
                                onChange={(e) => setAddTitleText(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") submitAddTitle(theme);
                                  if (e.key === "Escape") onCancelAdd();
                                }}
                                placeholder="Sermon title…"
                                className="text-[12.5px] text-ink bg-white border border-line rounded-md px-2.5 py-1.5 outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 placeholder:text-mute/50" />
                              <div className="flex items-center gap-1.5">
                                <span className="material-symbols-outlined text-[15px] text-mute shrink-0">event</span>
                                <select value={addDate} onChange={(e) => setAddDate(e.target.value)} disabled={addBusy}
                                  className="flex-1 min-w-0 text-[11.5px] font-semibold text-ink bg-white border border-line rounded-md px-2 py-1.5 outline-none focus:border-primary">
                                  {dateOpts.length === 0 && <option value="">No open Fridays in season</option>}
                                  {dateOpts.map((iso) => (
                                    <option key={iso} value={iso}>Fri {formatFriday(iso)}</option>
                                  ))}
                                </select>
                                <button onClick={() => submitAddTitle(theme)} disabled={!addTitleText.trim() || addBusy}
                                  className={`text-[11px] font-bold px-2.5 py-1.5 rounded-md transition-colors ${
                                    addTitleText.trim() && !addBusy ? "bg-primary text-white hover:bg-secondary" : "bg-line text-mute cursor-not-allowed"
                                  }`}>{addBusy ? "…" : "Add"}</button>
                                <button onClick={onCancelAdd} className="text-[11px] font-semibold text-mute hover:text-ink px-1.5 py-1.5">Cancel</button>
                              </div>
                            </div>
                          ) : (
                            <button onClick={() => onStartAdd(theme, key)}
                              className="mt-0.5 self-start text-[11px] font-semibold text-mute hover:text-primary transition-colors flex items-center gap-1 py-1">
                              <span className="material-symbols-outlined text-[14px]">add</span> Add title
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
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
  const cols = 4;
  const perCol = Math.ceil(fridays.length / cols);
  const groups = Array.from({ length: cols }, (_, i) => fridays.slice(i * perCol, (i + 1) * perCol));
  const openCount = fridays.filter((d) => !taken.has(toISODate(d))).length;

  return (
    <div className="max-w-6xl">
      <p className="text-[12px] text-mute mb-4">
        Every Friday of <span className="font-bold text-ink">{year}</span> — {fridays.length} in total, {openCount} still open.
        Click a filled row to open its sermon, or an <span className="text-primary font-semibold">open</span> row to title it here.
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
                  <span className="text-[10px] text-mute tabular-nums w-[42px] shrink-0">{d.getDate()} {MONTH_SHORT[d.getMonth()]}</span>
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
                      placeholder="Title, Enter to save…"
                      className="text-[12px] text-ink bg-white border border-primary/40 rounded px-2 py-1 outline-none focus:ring-2 focus:ring-primary/10 min-w-0 flex-1 placeholder:text-mute/50" />
                  </div>
                );
              }

              return (
                <button key={iso} onClick={() => onStartGridAdd(iso)}
                  className="w-full flex items-center gap-2.5 px-3 py-2 border-b border-line/60 last:border-b-0 min-h-[38px] hover:bg-primary/[0.04] transition-colors text-left group">
                  {lead}
                  <span className="text-[11px] text-mute/40 italic flex-1 group-hover:text-primary/70">open</span>
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
  const steps = [
    { icon: "category", title: "Choose 4 season themes", desc: "One main theme per quarter of the year." },
    { icon: "account_tree", title: "Add sub-bouquets", desc: "4 sub-topics under each theme, 16 in total." },
    { icon: "edit_note", title: "Title the Fridays", desc: "Name each Friday sermon under its sub-bouquet." },
  ];
  return (
    <div className="max-w-2xl mx-auto text-center py-10">
      <span className="material-symbols-outlined text-5xl text-primary/20 mb-3 block">calendar_month</span>
      <h2 className="text-xl font-extrabold text-primary">Build your {year} plan</h2>
      <p className="text-[13px] text-mute mt-1.5 mb-8">
        A year of Friday sermons in three steps, from season themes down to each Friday&apos;s title.
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
        Start with Season 1
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
