"use client";

import { useEffect, useState, useCallback, useRef, use } from "react";
import { useRouter } from "next/navigation";

interface Reference {
  id: string;
  type: string;
  title: string;
  source: string | null;
  content: string | null;
}

interface Sermon {
  id: string;
  title: string;
  content: string | null;
  outline: string | null;
  status: string;
  scheduled_date: string | null;
  notes: string | null;
  theme_id: string | null;
  theme_name: string | null;
  references: Reference[];
}

function wordCount(text: string | null) {
  if (!text) return 0;
  return text.trim().split(/\s+/).filter(Boolean).length;
}

const SECTION_IDS = ["opening", "main", "second", "dua"] as const;
const SECTION_DELIM = "\n\n---§---\n\n";

function parseSections(text: string): Record<string, string> {
  const parts = text.split(SECTION_DELIM);
  const result: Record<string, string> = {};
  SECTION_IDS.forEach((id, i) => {
    result[id] = (parts[i] ?? "").trim();
  });
  return result;
}

function joinSections(data: Record<string, string>): string {
  return SECTION_IDS.map((id) => data[id] ?? "").join(SECTION_DELIM);
}

const allStatuses = ["draft", "in_review", "ready", "delivered", "archived"];

const statusLabel: Record<string, string> = {
  draft: "DRAFT",
  in_review: "IN REVIEW",
  ready: "READY",
  delivered: "DELIVERED",
  archived: "ARCHIVED",
};

const statusStyle: Record<string, string> = {
  draft: "bg-[#f3f0ea] text-[#8a7968]",
  in_review: "bg-orange-50 text-orange-600",
  ready: "bg-green-50 text-green-700",
  delivered: "bg-[#f0eef8] text-[#6b5fa0]",
  archived: "bg-surface text-mute",
};

const statusIcon: Record<string, string> = {
  draft: "edit_note",
  in_review: "rate_review",
  ready: "check_circle",
  delivered: "event_available",
  archived: "inventory_2",
};

interface CheckItem {
  key: string;
  label: string;
  check: (ctx: CheckContext) => boolean;
  required: boolean;
}

interface CheckContext {
  title: string;
  content: string;
  outline: string;
  scheduledDate: string;
  notes: string;
  words: number;
  estMinutes: number;
  hasReferences: boolean;
}

const checklist: CheckItem[] = [
  { key: "title", label: "Sermon title set", check: (c) => c.title.length > 0 && c.title !== "Untitled Sermon", required: true },
  { key: "arabic", label: "Arabic content written", check: (c) => c.content.length >= 50, required: true },
  { key: "english", label: "English translation added", check: (c) => c.outline.length >= 50, required: true },
  { key: "date", label: "Scheduled date set", check: (c) => c.scheduledDate.length > 0, required: true },
  { key: "length", label: "Within target (15-25 min)", check: (c) => c.estMinutes >= 15 && c.estMinutes <= 25, required: false },
  { key: "references", label: "References cited in notes", check: (c) => c.notes.toLowerCase().includes("surah") || c.notes.toLowerCase().includes("hadith") || c.notes.toLowerCase().includes("quran") || c.notes.toLowerCase().includes("reference") || c.hasReferences, required: false },
];

export default function SermonEditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [sermon, setSermon] = useState<Sermon | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  const [title, setTitle] = useState("");
  const [status, setStatus] = useState("draft");
  const [scheduledDate, setScheduledDate] = useState("");
  const [notes, setNotes] = useState("");
  const [activeSection, setActiveSection] = useState("opening");
  const [sectionData, setSectionData] = useState<Record<string, { ar: string; en: string }>>({
    opening: { ar: "", en: "" },
    main: { ar: "", en: "" },
    second: { ar: "", en: "" },
    dua: { ar: "", en: "" },
  });
  const [langMode, setLangMode] = useState("ar-first");
  const [mobilePanel, setMobilePanel] = useState<"editor" | "info" | "checklist">("editor");
  const [userWordTarget, setUserWordTarget] = useState(2500);
  const [editorFontSize, setEditorFontSize] = useState(16);
  const [references, setReferences] = useState<Reference[]>([]);
  const [showRefModal, setShowRefModal] = useState(false);
  const [refType, setRefType] = useState<"quran" | "hadith">("quran");
  const [refTitle, setRefTitle] = useState("");
  const [refSource, setRefSource] = useState("");
  const [refContent, setRefContent] = useState("");
  const [refSaving, setRefSaving] = useState(false);
  const [lastFocusedLang, setLastFocusedLang] = useState<"ar" | "en">("ar");
  const sectionRefs = useRef<Record<string, { ar: HTMLTextAreaElement | null; en: HTMLTextAreaElement | null }>>({});

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data) => {
        if (data.settings) {
          setLangMode(data.settings.default_language || "ar-first");
          setUserWordTarget(data.settings.word_target || 2500);
          setEditorFontSize(data.settings.editor_font_size || 16);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetch(`/api/sermons/${id}`)
      .then((r) => {
        if (!r.ok) throw new Error("Not found");
        return r.json();
      })
      .then((data: Sermon) => {
        setSermon(data);
        setTitle(data.title);
        const arSections = parseSections(data.content ?? "");
        const enSections = parseSections(data.outline ?? "");
        const parsed: Record<string, { ar: string; en: string }> = {};
        SECTION_IDS.forEach((id) => {
          parsed[id] = { ar: arSections[id] ?? "", en: enSections[id] ?? "" };
        });
        setSectionData(parsed);
        setStatus(data.status);
        setScheduledDate(
          data.scheduled_date
            ? new Date(data.scheduled_date).toISOString().split("T")[0]
            : ""
        );
        setNotes(data.notes ?? "");
        setReferences(data.references ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  const content = joinSections(Object.fromEntries(SECTION_IDS.map((id) => [id, sectionData[id]?.ar ?? ""])));
  const outline = joinSections(Object.fromEntries(SECTION_IDS.map((id) => [id, sectionData[id]?.en ?? ""])));

  const save = useCallback(async () => {
    setSaving(true);
    const arJoined = joinSections(Object.fromEntries(SECTION_IDS.map((id) => [id, sectionData[id]?.ar ?? ""])));
    const enJoined = joinSections(Object.fromEntries(SECTION_IDS.map((id) => [id, sectionData[id]?.en ?? ""])));
    await fetch(`/api/sermons/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        content: arJoined,
        outline: enJoined,
        status,
        scheduledDate: scheduledDate || null,
        notes,
      }),
    });
    setLastSaved(new Date());
    setSaving(false);
  }, [id, title, sectionData, status, scheduledDate, notes]);

  useEffect(() => {
    if (!sermon) return;
    const timer = setInterval(() => save(), 30000);
    return () => clearInterval(timer);
  }, [sermon, save]);

  function buildReferenceMarker(type: "quran" | "hadith", title: string, source: string): string {
    const label = type === "quran" ? "Quran" : "Hadith";
    const detail = title || source || "";
    return `\n[${label} — ${detail}]\n`;
  }

  function insertAtCursor(block: string) {
    const lang = lastFocusedLang;
    const textarea = sectionRefs.current[activeSection]?.[lang];

    if (textarea) {
      const start = textarea.selectionStart ?? textarea.value.length;
      const before = textarea.value.slice(0, start);
      const after = textarea.value.slice(start);
      const newValue = before + block + after;

      setSectionData((prev) => ({
        ...prev,
        [activeSection]: { ...prev[activeSection], [lang]: newValue },
      }));

      requestAnimationFrame(() => {
        const newPos = start + block.length;
        textarea.selectionStart = newPos;
        textarea.selectionEnd = newPos;
        textarea.focus();
      });
    }
  }

  async function handleAddReference() {
    if (!refTitle.trim()) return;
    setRefSaving(true);
    try {
      const res = await fetch(`/api/sermons/${id}/references`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: refType,
          title: refTitle.trim(),
          source: refSource.trim() || null,
          content: refContent.trim() || null,
        }),
      });
      if (res.ok) {
        const ref = await res.json();
        setReferences((prev) => [...prev, ref]);

        const block = buildReferenceMarker(
          refType,
          refTitle.trim(),
          refSource.trim()
        );
        insertAtCursor(block);

        setRefTitle("");
        setRefSource("");
        setRefContent("");
        setShowRefModal(false);
      }
    } catch {}
    setRefSaving(false);
  }

  async function handleDeleteReference(refId: string) {
    try {
      await fetch(`/api/sermons/${id}/references?refId=${refId}`, { method: "DELETE" });
      setReferences((prev) => prev.filter((r) => r.id !== refId));
    } catch {}
  }

  async function handleDelete() {
    if (!confirm("Delete this sermon? This cannot be undone.")) return;
    await fetch(`/api/sermons/${id}`, { method: "DELETE" });
    router.push("/sermons");
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full text-mute">
        Loading...
      </div>
    );
  }

  if (!sermon) {
    return (
      <div className="flex items-center justify-center h-full text-mute">
        Sermon not found
      </div>
    );
  }

  const words = wordCount(content);
  const estMinutes = Math.max(1, Math.round(words / 130));

  const checkCtx: CheckContext = {
    title, content, outline, scheduledDate, notes, words, estMinutes,
    hasReferences: references.length > 0,
  };

  const passedChecks = checklist.filter((c) => c.check(checkCtx));
  const requiredPassed = checklist.filter((c) => c.required && c.check(checkCtx)).length;
  const requiredTotal = checklist.filter((c) => c.required).length;
  const allRequiredPassed = requiredPassed === requiredTotal;

  const nextStatus: Record<string, string> = {
    draft: "in_review",
    in_review: "ready",
    ready: "delivered",
  };

  const nextAction: Record<string, string> = {
    draft: "Submit for Review",
    in_review: "Mark Ready",
    ready: "Mark Delivered",
  };

  function handleStatusAdvance() {
    const next = nextStatus[status];
    if (!next) return;
    if ((status === "draft" || status === "in_review") && !allRequiredPassed) return;
    setStatus(next);
  }

  const sections = [
    {
      id: "opening",
      label: "Opening praise",
      icon: "wb_twilight",
      guide: [
        "Hamd & Salawat (praise of Allah)",
        "Shahada (testimony of faith)",
        "Taqwa reminder verse",
        "Introduce the topic",
      ],
    },
    {
      id: "main",
      label: "Main theme",
      icon: "auto_stories",
      guide: [
        "Core message & argument",
        "Quran verses as evidence",
        "Supporting hadith",
        "Real-life examples",
        "Practical lessons",
      ],
    },
    {
      id: "second",
      label: "Second khutbah",
      icon: "looks_two",
      guide: [
        "Brief hamd & salawat",
        "Reinforce the message",
        "Call to action",
        "Salawat on the Prophet ﷺ",
      ],
    },
    {
      id: "dua",
      label: "Closing du'a",
      icon: "volunteer_activism",
      guide: [
        "Du'a for the ummah",
        "Du'a for the sick & deceased",
        "Du'a for guidance",
        "Closing Quranic verse (16:90)",
      ],
    },
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Top bar */}
      <div className="flex items-center justify-between px-3 sm:px-5 py-2.5 border-b border-line bg-white gap-2">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
          <button
            onClick={() => router.push("/sermons")}
            className="text-xs px-2 sm:px-2.5 py-1 border border-line bg-white text-ink hover:bg-surface transition-colors shrink-0"
          >
            ←<span className="hidden sm:inline"> Sermons</span>
          </button>
          <span className="text-sm text-ink font-[var(--font-arabic)] italic truncate hidden sm:inline">
            {title || "Untitled"}{scheduledDate ? ` — ${new Date(scheduledDate).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })}` : ""}
          </span>
          {sermon.theme_name && (
            <span className="text-[9px] font-bold px-2 py-0.5 bg-accent-gold/10 text-accent-gold tracking-wide shrink-0 hidden md:inline">
              {sermon.theme_name.toUpperCase()}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <span className={`text-[9px] font-bold px-2 py-0.5 tracking-wide flex items-center gap-1 ${statusStyle[status] ?? statusStyle.draft}`}>
            <span className="material-symbols-outlined text-[12px]">{statusIcon[status] ?? "edit_note"}</span>
            <span className="hidden sm:inline">{statusLabel[status] ?? status.toUpperCase()}</span>
          </span>
          <button
            onClick={handleDelete}
            className="text-xs px-2 sm:px-2.5 py-1 border border-line text-red-500 hover:bg-red-50 transition-colors hidden sm:inline-flex"
          >
            Delete
          </button>
          <button
            className="text-xs px-2 sm:px-2.5 py-1 border border-line bg-white text-ink hover:bg-surface transition-colors hidden sm:inline-flex"
          >
            Export
          </button>
          <button
            onClick={save}
            className="text-xs px-3 py-1 bg-primary text-white font-semibold hover:bg-secondary transition-colors"
          >
            Save
          </button>
        </div>
      </div>

      {/* Mobile panel tabs */}
      <div className="flex md:hidden border-b border-line bg-white">
        {([
          { key: "info", label: "Info", icon: "info" },
          { key: "editor", label: "Editor", icon: "edit" },
          { key: "checklist", label: "Checklist", icon: "checklist" },
        ] as const).map((tab) => (
          <button
            key={tab.key}
            onClick={() => setMobilePanel(tab.key)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium transition-colors ${
              mobilePanel === tab.key
                ? "text-primary border-b-2 border-primary"
                : "text-mute"
            }`}
          >
            <span className="material-symbols-outlined text-base">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* 3-column layout */}
      <div className="flex-1 flex min-h-0">
        {/* Left panel — Speech info */}
        <div className={`${mobilePanel === "info" ? "flex" : "hidden"} md:flex w-full md:w-[175px] border-r border-line bg-white p-3.5 overflow-y-auto shrink-0 flex-col`}>
          <p className="text-[9px] tracking-[2px] text-mute/60 mb-2">SPEECH INFO</p>

          <div className="mb-2.5">
            <p className="text-[10px] text-mute/60">Date</p>
            <input
              type="date"
              value={scheduledDate}
              onChange={(e) => setScheduledDate(e.target.value)}
              className="text-xs font-medium text-ink bg-transparent border-none outline-none w-full"
            />
          </div>

          <div className="mb-2.5">
            <p className="text-[10px] text-mute/60">Status</p>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="text-xs font-medium text-ink bg-transparent border-none outline-none w-full"
            >
              {allStatuses.map((s) => (
                <option key={s} value={s}>{statusLabel[s]}</option>
              ))}
            </select>
          </div>

          <div className="mb-2.5">
            <p className="text-[10px] text-mute/60">Words</p>
            <p className="text-xs font-medium text-ink">{words}</p>
          </div>

          <div className="mb-2.5">
            <p className="text-[10px] text-mute/60">Estimated delivery</p>
            <p className="text-xs font-medium text-ink">{estMinutes} min</p>
          </div>

          <div className="h-px bg-line my-2.5" />

          <p className="text-[9px] tracking-[2px] text-mute/60 mb-2">SECTIONS</p>
          <div className="flex flex-col gap-0.5">
            {sections.map((sec, i) => (
              <button
                key={sec.id}
                onClick={() => {
                  setActiveSection(sec.id);
                  setMobilePanel("editor");
                  document.getElementById(`section-${sec.id}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
                }}
                className={`flex items-center gap-1.5 text-[11px] px-1.5 py-1.5 text-left transition-colors ${
                  activeSection === sec.id
                    ? "bg-[#f3f0ea] text-ink font-medium"
                    : "text-mute hover:bg-surface"
                }`}
              >
                <span className={`material-symbols-outlined text-[14px] shrink-0 ${activeSection === sec.id ? "text-primary" : "text-line"}`}>{sec.icon}</span>
                <span className="truncate">{sec.label}</span>
              </button>
            ))}
          </div>

          <div className="h-px bg-line my-2.5" />

          <p className="text-[9px] tracking-[2px] text-mute/60 mb-2">NOTES</p>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Private notes..."
            rows={4}
            className="w-full text-[11px] text-ink bg-surface border border-line p-2 resize-none outline-none focus:border-primary transition-colors"
          />

          {/* Delete/export on mobile */}
          <div className="flex gap-2 mt-4 md:hidden">
            <button
              onClick={handleDelete}
              className="text-xs px-3 py-1.5 border border-line text-red-500 hover:bg-red-50 transition-colors flex-1"
            >
              Delete
            </button>
            <button className="text-xs px-3 py-1.5 border border-line bg-white text-ink hover:bg-surface transition-colors flex-1">
              Export
            </button>
          </div>
        </div>

        {/* Center — Editor */}
        <div className={`${mobilePanel === "editor" ? "flex" : "hidden"} md:flex flex-1 flex-col min-w-0`}>
          {/* Language toggle bar */}
          <div className="flex items-center justify-between px-3 sm:px-3.5 py-2 border-b border-line bg-[#fdfcfa] flex-wrap gap-1.5">
            <div className="flex bg-[#f3f0ea] p-0.5 gap-px overflow-x-auto">
              {[
                { key: "ar-first", label: "Arabic first", shortLabel: "AR 1st" },
                { key: "en-first", label: "English first", shortLabel: "EN 1st" },
                { key: "ar-only", label: "AR only", shortLabel: "AR" },
                { key: "en-only", label: "EN only", shortLabel: "EN" },
              ].map((m) => (
                <button
                  key={m.key}
                  onClick={() => setLangMode(m.key)}
                  className={`text-[11px] px-2 sm:px-2.5 py-1 transition-colors whitespace-nowrap ${
                    langMode === m.key
                      ? "bg-white text-ink border border-line"
                      : "text-mute bg-transparent border border-transparent"
                  }`}
                >
                  <span className="hidden sm:inline">{m.label}</span>
                  <span className="sm:hidden">{m.shortLabel}</span>
                </button>
              ))}
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[10px] text-mute">
                {saving
                  ? "Saving..."
                  : lastSaved
                  ? `Saved ${lastSaved.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
                  : ""}
              </span>
            </div>
          </div>

          {/* Formatting toolbar */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 mx-3 sm:mx-4 mt-3 bg-[#fcfaf6] border border-line overflow-x-auto">
            <button className="text-[11px] px-2 py-1 border border-line bg-white text-ink/70 hover:bg-[#f3f0ea] transition-colors font-bold shrink-0">B</button>
            <button className="text-[11px] px-2 py-1 border border-line bg-white text-ink/70 hover:bg-[#f3f0ea] transition-colors italic shrink-0">I</button>
            <button className="text-[11px] px-2 py-1 border border-line bg-white text-ink/70 hover:bg-[#f3f0ea] transition-colors underline shrink-0">U</button>
            <div className="w-px h-4 bg-line mx-0.5 shrink-0" />
            <button className="px-1.5 py-1 border border-line bg-white text-ink/70 hover:bg-[#f3f0ea] transition-colors shrink-0"><span className="material-symbols-outlined text-[14px]">format_list_bulleted</span></button>
            <button className="px-1.5 py-1 border border-line bg-white text-ink/70 hover:bg-[#f3f0ea] transition-colors shrink-0"><span className="material-symbols-outlined text-[14px]">format_list_numbered</span></button>
            <div className="w-px h-4 bg-line mx-0.5 shrink-0" />
            <button className="px-1.5 py-1 border border-line bg-white text-ink/70 hover:bg-[#f3f0ea] transition-colors shrink-0"><span className="material-symbols-outlined text-[14px]">format_quote</span></button>
            <button className="px-1.5 py-1 border border-line bg-white text-ink/70 hover:bg-[#f3f0ea] transition-colors shrink-0"><span className="material-symbols-outlined text-[14px]">link</span></button>
            <div className="w-px h-4 bg-line mx-0.5 shrink-0" />
            <button
              onClick={() => { setRefType("quran"); setShowRefModal(true); }}
              className="flex items-center gap-1 px-2 py-1 border border-line bg-white text-ink/70 hover:bg-green-50 hover:text-green-700 hover:border-green-200 transition-colors shrink-0 text-[11px] font-medium"
            >
              <span className="material-symbols-outlined text-[14px]">menu_book</span>
              <span className="hidden sm:inline">Quran</span>
            </button>
            <button
              onClick={() => { setRefType("hadith"); setShowRefModal(true); }}
              className="flex items-center gap-1 px-2 py-1 border border-line bg-white text-ink/70 hover:bg-amber-50 hover:text-amber-700 hover:border-amber-200 transition-colors shrink-0 text-[11px] font-medium"
            >
              <span className="material-symbols-outlined text-[14px]">auto_stories</span>
              <span className="hidden sm:inline">Hadith</span>
            </button>
          </div>

          {/* Title */}
          <div className="px-3 sm:px-4 pt-3 pb-2">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Sermon title..."
              className="w-full text-lg sm:text-xl font-bold text-ink placeholder:text-line bg-transparent border-none outline-none font-[var(--font-arabic)]"
            />
          </div>

          {/* Writing area — continuous scroll with section dividers */}
          <div className="flex-1 overflow-y-auto">
            {(() => {
              const showBoth = langMode === "ar-first" || langMode === "en-first";
              const showAr = showBoth || langMode === "ar-only";
              const showEn = showBoth || langMode === "en-only";

              if (showBoth) {
                return (
                  <div className="flex mx-3 sm:mx-4 my-3 gap-0 min-h-0">
                    {/* English column (left) */}
                    <div className="flex-1 bg-white border border-line border-r-0 p-4 sm:p-5">
                      <p className="text-[9px] tracking-[2px] text-mute/40 font-bold mb-4">ENGLISH</p>
                      {sections.map((sec, secIdx) => {
                        const secData = sectionData[sec.id] ?? { ar: "", en: "" };
                        const isActive = activeSection === sec.id;
                        return (
                          <div key={sec.id} id={`section-${sec.id}`} onClick={() => setActiveSection(sec.id)}>
                            <div className={`flex items-center gap-2 ${secIdx === 0 ? "mb-2" : "mt-5 mb-2"}`}>
                              {secIdx > 0 && <div className="flex-1 h-px bg-[#e8e3d6]" />}
                              <div className={`flex items-center gap-1 transition-colors ${isActive ? "text-primary" : "text-mute/30"}`}>
                                <span className="material-symbols-outlined text-xs">{sec.icon}</span>
                                <span className="text-[8px] tracking-[1.5px] font-bold uppercase">{sec.label}</span>
                              </div>
                              {secIdx > 0 && <div className="flex-1 h-px bg-[#e8e3d6]" />}
                            </div>
                            <textarea
                              ref={(el) => {
                                if (!sectionRefs.current[sec.id]) sectionRefs.current[sec.id] = { ar: null, en: null };
                                sectionRefs.current[sec.id].en = el;
                              }}
                              value={secData.en}
                              onChange={(e) =>
                                setSectionData((prev) => ({
                                  ...prev,
                                  [sec.id]: { ...prev[sec.id], en: e.target.value },
                                }))
                              }
                              onFocus={() => { setActiveSection(sec.id); setLastFocusedLang("en"); }}
                              placeholder={`${sec.label} in English...`}
                              className="w-full min-h-[60px] leading-relaxed text-ink bg-transparent border-none resize-none outline-none"
                              style={{ fontSize: `${editorFontSize - 1}px` }}
                            />
                          </div>
                        );
                      })}
                    </div>

                    {/* Divider */}
                    <div className="w-px bg-line shrink-0" />

                    {/* Arabic column (right) */}
                    <div className="flex-1 bg-white border border-line border-l-0 p-4 sm:p-5">
                      <p className="text-[9px] tracking-[2px] text-mute/40 font-bold mb-4 text-right">العربية</p>
                      {sections.map((sec, secIdx) => {
                        const secData = sectionData[sec.id] ?? { ar: "", en: "" };
                        const isActive = activeSection === sec.id;
                        return (
                          <div key={sec.id} onClick={() => setActiveSection(sec.id)}>
                            <div className={`flex items-center gap-2 ${secIdx === 0 ? "mb-2" : "mt-5 mb-2"}`}>
                              {secIdx > 0 && <div className="flex-1 h-px bg-[#e8e3d6]" />}
                              <div className={`flex items-center gap-1 transition-colors ${isActive ? "text-primary" : "text-mute/30"}`}>
                                <span className="text-[8px] tracking-[1.5px] font-bold uppercase">{sec.label}</span>
                                <span className="material-symbols-outlined text-xs">{sec.icon}</span>
                              </div>
                              {secIdx > 0 && <div className="flex-1 h-px bg-[#e8e3d6]" />}
                            </div>
                            <textarea
                              ref={(el) => {
                                if (!sectionRefs.current[sec.id]) sectionRefs.current[sec.id] = { ar: null, en: null };
                                sectionRefs.current[sec.id].ar = el;
                              }}
                              value={secData.ar}
                              onChange={(e) =>
                                setSectionData((prev) => ({
                                  ...prev,
                                  [sec.id]: { ...prev[sec.id], ar: e.target.value },
                                }))
                              }
                              onFocus={() => { setActiveSection(sec.id); setLastFocusedLang("ar"); }}
                              placeholder={sec.id === "opening" ? "...اكتب خطبتك هنا" : `...${sec.label}`}
                              className="w-full min-h-[60px] font-[var(--font-arabic)] leading-[2] text-ink bg-transparent border-none resize-none outline-none text-right"
                              style={{ fontSize: `${editorFontSize}px` }}
                              dir="rtl"
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              }

              return (
                <div className="bg-white mx-3 sm:mx-4 my-3 border border-line p-4 sm:p-6">
                  {sections.map((sec, secIdx) => {
                    const secData = sectionData[sec.id] ?? { ar: "", en: "" };
                    const isActive = activeSection === sec.id;
                    return (
                      <div key={sec.id} id={`section-${sec.id}`} onClick={() => setActiveSection(sec.id)}>
                        <div className={`flex items-center gap-3 ${secIdx === 0 ? "mb-3" : "mt-6 mb-3"}`}>
                          {secIdx > 0 && <div className="flex-1 h-px bg-[#e8e3d6]" />}
                          <div className={`flex items-center gap-1.5 transition-colors ${isActive ? "text-primary" : "text-mute/40"}`}>
                            <span className="material-symbols-outlined text-sm">{sec.icon}</span>
                            <span className="text-[9px] tracking-[2px] font-bold uppercase">{sec.label}</span>
                          </div>
                          <div className="flex-1 h-px bg-[#e8e3d6]" />
                        </div>
                        {showAr && (
                          <textarea
                            ref={(el) => {
                              if (!sectionRefs.current[sec.id]) sectionRefs.current[sec.id] = { ar: null, en: null };
                              sectionRefs.current[sec.id].ar = el;
                            }}
                            value={secData.ar}
                            onChange={(e) =>
                              setSectionData((prev) => ({
                                ...prev,
                                [sec.id]: { ...prev[sec.id], ar: e.target.value },
                              }))
                            }
                            onFocus={() => { setActiveSection(sec.id); setLastFocusedLang("ar"); }}
                            placeholder={sec.id === "opening" ? "...اكتب خطبتك هنا" : `...${sec.label}`}
                            className="w-full min-h-[60px] font-[var(--font-arabic)] leading-[2] text-ink bg-transparent border-none resize-none outline-none text-right"
                            style={{ fontSize: `${editorFontSize}px` }}
                            dir="rtl"
                          />
                        )}
                        {showEn && (
                          <textarea
                            ref={(el) => {
                              if (!sectionRefs.current[sec.id]) sectionRefs.current[sec.id] = { ar: null, en: null };
                              sectionRefs.current[sec.id].en = el;
                            }}
                            value={secData.en}
                            onChange={(e) =>
                              setSectionData((prev) => ({
                                ...prev,
                                [sec.id]: { ...prev[sec.id], en: e.target.value },
                              }))
                            }
                            onFocus={() => { setActiveSection(sec.id); setLastFocusedLang("en"); }}
                            placeholder={`${sec.label} in English...`}
                            className="w-full min-h-[60px] leading-relaxed text-ink bg-transparent border-none resize-none outline-none"
                            style={{ fontSize: `${editorFontSize - 1}px` }}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>

          {/* Status bar */}
          <div className="flex items-center justify-between px-3 sm:px-3.5 py-1.5 border-t border-line bg-white text-[10px] text-mute/60">
            <span>
              {saving
                ? "Saving..."
                : lastSaved
                ? `Auto-saved ${lastSaved.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
                : "Not saved yet"}
            </span>
            <span>
              {langMode === "ar-only" ? "AR" : langMode === "en-only" ? "EN" : "AR+EN"} · {words} words · ~{estMinutes} min
            </span>
          </div>
        </div>

        {/* Right panel — Context & Checklist */}
        <div className={`${mobilePanel === "checklist" ? "flex" : "hidden"} md:flex w-full md:w-[200px] border-l border-line bg-white p-3.5 overflow-y-auto shrink-0 flex-col`}>
          {/* Readiness checklist */}
          <p className="text-[9px] tracking-[2px] text-mute/60 mb-2">READINESS</p>
          <div className="mb-3">
            {/* Progress bar */}
            <div className="flex items-center gap-2 mb-2">
              <div className="flex-1 h-1.5 bg-surface overflow-hidden">
                <div
                  className={`h-full transition-all ${allRequiredPassed ? "bg-green-500" : "bg-accent-gold"}`}
                  style={{ width: `${(passedChecks.length / checklist.length) * 100}%` }}
                />
              </div>
              <span className="text-[10px] font-bold text-mute">{passedChecks.length}/{checklist.length}</span>
            </div>

            {/* Checklist items */}
            <div className="flex flex-col gap-1">
              {checklist.map((item) => {
                const passed = item.check(checkCtx);
                return (
                  <div
                    key={item.key}
                    className={`flex items-start gap-1.5 text-[10px] px-2 py-1.5 transition-colors ${
                      passed ? "bg-green-50/50" : "bg-surface"
                    }`}
                  >
                    <span className={`material-symbols-outlined text-[14px] shrink-0 mt-px ${
                      passed ? "text-green-600" : "text-line"
                    }`}>
                      {passed ? "check_circle" : "radio_button_unchecked"}
                    </span>
                    <span className={passed ? "text-green-700" : "text-mute"}>
                      {item.label}
                      {item.required && !passed && <span className="text-red-400 ml-0.5">*</span>}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Status advance button */}
            {nextAction[status] && (
              <button
                onClick={handleStatusAdvance}
                disabled={!allRequiredPassed && (status === "draft" || status === "in_review")}
                className={`w-full mt-2.5 text-[11px] font-bold py-2 px-3 transition-all flex items-center justify-center gap-1.5 ${
                  allRequiredPassed || status === "ready"
                    ? status === "ready"
                      ? "bg-[#6b5fa0] text-white hover:bg-[#5a4f8a]"
                      : "bg-primary text-white hover:bg-secondary"
                    : "bg-line text-mute cursor-not-allowed"
                }`}
              >
                <span className="material-symbols-outlined text-[14px]">
                  {status === "draft" ? "send" : status === "in_review" ? "check_circle" : "event_available"}
                </span>
                {nextAction[status]}
              </button>
            )}

            {!allRequiredPassed && (status === "draft" || status === "in_review") && (
              <p className="text-[9px] text-red-400 mt-1">Complete required items (*) first</p>
            )}

            {status === "delivered" && (
              <div className="mt-2 bg-[#f0eef8] p-2 text-center">
                <span className="material-symbols-outlined text-[#6b5fa0] text-lg">event_available</span>
                <p className="text-[10px] text-[#6b5fa0] font-bold mt-0.5">Delivered</p>
              </div>
            )}
          </div>

          <div className="h-px bg-line my-2.5" />

          {/* This Friday */}
          <p className="text-[9px] tracking-[2px] text-mute/60 mb-2">THIS FRIDAY</p>
          <div className="bg-primary/5 p-2.5 mb-3">
            {scheduledDate ? (
              <>
                <p className="text-[10px] text-mute/60">
                  {new Date(scheduledDate).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
                </p>
                <p className="text-xs font-medium text-primary mt-0.5">
                  {new Date(scheduledDate).toLocaleDateString("en-US", { year: "numeric" })}
                </p>
              </>
            ) : (
              <p className="text-[10px] text-mute">No date set</p>
            )}
          </div>

          {/* Word target */}
          <p className="text-[9px] tracking-[2px] text-mute/60 mb-2 mt-1">WORD TARGET</p>
          <div className="mb-3">
            <div className="flex items-baseline gap-1.5 mb-1">
              <span className="text-lg font-bold text-ink">{words}</span>
              <span className="text-[10px] text-mute">/ {userWordTarget.toLocaleString()}</span>
            </div>
            <div className="w-full h-1 bg-surface overflow-hidden">
              <div
                className="h-full bg-primary transition-all"
                style={{ width: `${Math.min(100, (words / userWordTarget) * 100)}%` }}
              />
            </div>
            <p className="text-[9px] text-mute/60 mt-1">~{Math.round(userWordTarget / 130)} min khutbah target</p>
          </div>

          {/* References */}
          <p className="text-[9px] tracking-[2px] text-mute/60 mb-2">REFERENCES</p>
          {references.length > 0 ? (
            <div className="flex flex-col gap-1.5">
              {references.map((ref) => (
                <div key={ref.id} className={`px-2.5 py-2 border text-[11px] ${
                  ref.type === "quran"
                    ? "bg-green-50/50 border-green-200"
                    : "bg-amber-50/50 border-amber-200"
                }`}>
                  <div className="flex items-start justify-between gap-1">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1 mb-0.5">
                        <span className={`material-symbols-outlined text-[12px] ${
                          ref.type === "quran" ? "text-green-600" : "text-amber-600"
                        }`}>
                          {ref.type === "quran" ? "menu_book" : "auto_stories"}
                        </span>
                        <span className={`text-[9px] font-bold uppercase tracking-wide ${
                          ref.type === "quran" ? "text-green-600" : "text-amber-600"
                        }`}>
                          {ref.type}
                        </span>
                      </div>
                      <p className="font-medium text-ink leading-tight">{ref.title}</p>
                      {ref.source && <p className="text-[10px] text-mute mt-0.5">{ref.source}</p>}
                      {ref.content && <p className="text-[10px] text-ink/70 mt-1 italic leading-snug">{ref.content}</p>}
                    </div>
                    <button
                      onClick={() => handleDeleteReference(ref.id)}
                      className="text-mute/40 hover:text-red-500 transition-colors shrink-0"
                    >
                      <span className="material-symbols-outlined text-[14px]">close</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[10px] text-mute/50">No references added</p>
          )}
          <div className="flex gap-1 mt-2">
            <button
              onClick={() => { setRefType("quran"); setShowRefModal(true); }}
              className="flex-1 text-[10px] font-medium py-1.5 border border-line text-mute hover:text-green-700 hover:border-green-200 hover:bg-green-50 transition-colors flex items-center justify-center gap-1"
            >
              <span className="material-symbols-outlined text-[12px]">add</span>
              Quran
            </button>
            <button
              onClick={() => { setRefType("hadith"); setShowRefModal(true); }}
              className="flex-1 text-[10px] font-medium py-1.5 border border-line text-mute hover:text-amber-700 hover:border-amber-200 hover:bg-amber-50 transition-colors flex items-center justify-center gap-1"
            >
              <span className="material-symbols-outlined text-[12px]">add</span>
              Hadith
            </button>
          </div>
        </div>
      </div>

      {/* Reference modal */}
      {showRefModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={() => setShowRefModal(false)}>
          <div className="bg-white w-full max-w-md mx-4 border border-line shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className={`flex items-center gap-2 px-5 py-3 border-b border-line ${
              refType === "quran" ? "bg-green-50" : "bg-amber-50"
            }`}>
              <span className={`material-symbols-outlined text-lg ${
                refType === "quran" ? "text-green-600" : "text-amber-600"
              }`}>
                {refType === "quran" ? "menu_book" : "auto_stories"}
              </span>
              <h3 className="text-sm font-bold text-ink">
                {refType === "quran" ? "Add Quran verse" : "Add Hadith"}
              </h3>
              <div className="flex ml-auto gap-1">
                <button
                  onClick={() => setRefType("quran")}
                  className={`text-[10px] px-2 py-0.5 font-medium transition-colors ${
                    refType === "quran"
                      ? "bg-green-600 text-white"
                      : "bg-white border border-line text-mute hover:text-green-600"
                  }`}
                >
                  Quran
                </button>
                <button
                  onClick={() => setRefType("hadith")}
                  className={`text-[10px] px-2 py-0.5 font-medium transition-colors ${
                    refType === "hadith"
                      ? "bg-amber-600 text-white"
                      : "bg-white border border-line text-mute hover:text-amber-600"
                  }`}
                >
                  Hadith
                </button>
              </div>
            </div>

            <div className="p-5 flex flex-col gap-3">
              <div>
                <label className="text-[10px] font-bold tracking-[1.5px] text-accent-gold uppercase block mb-1">
                  {refType === "quran" ? "Verse / Ayah" : "Hadith text"}
                </label>
                <textarea
                  value={refContent}
                  onChange={(e) => setRefContent(e.target.value)}
                  placeholder={refType === "quran"
                    ? "إِنَّ مَعَ ٱلْعُسْرِ يُسْرًا"
                    : "The Prophet ﷺ said..."
                  }
                  rows={3}
                  className="w-full px-3 py-2 border border-line text-sm text-ink bg-surface focus:outline-none focus:border-primary transition-colors font-[var(--font-arabic)]"
                  dir={refType === "quran" ? "rtl" : "ltr"}
                />
              </div>

              <div>
                <label className="text-[10px] font-bold tracking-[1.5px] text-accent-gold uppercase block mb-1">
                  {refType === "quran" ? "Reference (e.g. Al-Sharh 94:6)" : "Title / summary"}
                </label>
                <input
                  type="text"
                  value={refTitle}
                  onChange={(e) => setRefTitle(e.target.value)}
                  placeholder={refType === "quran"
                    ? "Surah Al-Sharh, Ayah 6"
                    : "Patience in hardship"
                  }
                  className="w-full px-3 py-2 border border-line text-sm text-ink bg-surface focus:outline-none focus:border-primary transition-colors"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold tracking-[1.5px] text-accent-gold uppercase block mb-1">
                  {refType === "quran" ? "Translation (optional)" : "Source (e.g. Sahih Bukhari)"}
                </label>
                <input
                  type="text"
                  value={refSource}
                  onChange={(e) => setRefSource(e.target.value)}
                  placeholder={refType === "quran"
                    ? "Indeed, with hardship comes ease."
                    : "Sahih Bukhari, Book 2, Hadith 14"
                  }
                  className="w-full px-3 py-2 border border-line text-sm text-ink bg-surface focus:outline-none focus:border-primary transition-colors"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-line bg-surface">
              <button
                onClick={() => { setShowRefModal(false); setRefTitle(""); setRefSource(""); setRefContent(""); }}
                className="text-xs px-4 py-2 border border-line text-mute hover:bg-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddReference}
                disabled={!refTitle.trim() || refSaving}
                className={`text-xs px-4 py-2 font-bold text-white transition-colors flex items-center gap-1.5 ${
                  refType === "quran"
                    ? "bg-green-600 hover:bg-green-700"
                    : "bg-amber-600 hover:bg-amber-700"
                } disabled:opacity-50`}
              >
                {refSaving && <span className="material-symbols-outlined text-[14px] animate-spin">progress_activity</span>}
                Add {refType === "quran" ? "verse" : "hadith"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
