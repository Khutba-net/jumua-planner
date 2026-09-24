"use client";

import { useEffect, useState, useCallback, useRef, use } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/lib/i18n";

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
  original_theme_id: string | null;
  is_override: number;
  language: string;
  translation_of: string | null;
  updated_at: string;
}

function wordCount(text: string | null) {
  if (!text) return 0;
  return text.trim().split(/\s+/).filter(Boolean).length;
}

const allStatuses = ["draft", "ready", "submitted", "in_review", "approved", "delivered", "archived", "skipped"];

const statusStyle: Record<string, string> = {
  draft: "bg-[#f3f0ea] text-[#8a7968]",
  ready: "bg-green-50 text-green-700",
  delivered: "bg-[#f0eef8] text-[#6b5fa0]",
  archived: "bg-surface text-mute",
  skipped: "bg-amber-50 text-amber-700",
};

const statusIcon: Record<string, string> = {
  draft: "edit_note",
  ready: "check_circle",
  delivered: "event_available",
  archived: "inventory_2",
  skipped: "event_busy",
};

interface CheckItem {
  key: string;
  labelKey: string;
  check: (ctx: CheckContext) => boolean;
  required: boolean;
}

interface CheckContext {
  title: string;
  content: string;
  scheduledDate: string;
  notes: string;
}

const checklist: CheckItem[] = [
  { key: "title", labelKey: "editor.titleSet", check: (c) => c.title.length > 0 && c.title !== "Untitled Sermon", required: true },
  { key: "content", labelKey: "editor.contentWritten", check: (c) => c.content.length >= 50, required: true },
  { key: "date", labelKey: "editor.dateSet", check: (c) => c.scheduledDate.length > 0, required: true },
];

const sectionCheckKeys = [
  { id: "opening", labelKey: "editor.openingPraise", icon: "wb_twilight" },
  { id: "main", labelKey: "editor.mainTheme", icon: "auto_stories" },
  { id: "second", labelKey: "editor.secondKhutbah", icon: "looks_two" },
  { id: "dua", labelKey: "editor.closingDua", icon: "volunteer_activism" },
];

export default function SermonEditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { t, isAr } = useI18n();
  const [sermon, setSermon] = useState<Sermon | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [status, setStatus] = useState("draft");
  const [scheduledDate, setScheduledDate] = useState("");
  const [notes, setNotes] = useState("");
  const [mobilePanel, setMobilePanel] = useState<"editor" | "info" | "checklist">("editor");
  const [editorFontSize, setEditorFontSize] = useState(16);
  const [completedSections, setCompletedSections] = useState<Set<string>>(new Set());
  const [leftOpen, setLeftOpen] = useState(true);
  const [rightOpen, setRightOpen] = useState(true);
  const [userRole, setUserRole] = useState<string>("member");
  const [hasOrg, setHasOrg] = useState(false);
  const [sessionExpired, setSessionExpired] = useState(false);
  const [conflictDetected, setConflictDetected] = useState(false);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<string | null>(null);
  const [recoveredDraft, setRecoveredDraft] = useState<{ title: string; content: string; notes: string } | null>(null);
  const editorRef = useRef<HTMLTextAreaElement>(null);

  const locale = isAr ? "ar-SA" : "en-US";

  const statusLabel: Record<string, string> = {
    draft: t("status.draft"),
    ready: t("status.ready"),
    delivered: t("status.delivered"),
    archived: t("status.archived"),
    submitted: t("status.submitted"),
    in_review: t("status.inReview"),
    approved: t("status.approved"),
    rejected: t("status.rejected"),
  };

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data) => {
        if (data.settings) {
          setEditorFontSize(data.settings.editor_font_size || 16);
        }
        if (data.user) {
          setUserRole(data.user.role || "member");
          setHasOrg(!!data.user.organization_id);
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
        setContent(data.content ?? "");
        setStatus(data.status);
        setScheduledDate(
          data.scheduled_date
            ? new Date(data.scheduled_date).toISOString().split("T")[0]
            : ""
        );
        setNotes(data.notes ?? "");
        setLastUpdatedAt(data.updated_at || null);
        setLoading(false);
        try {
          const saved = localStorage.getItem(`jp_draft_${id}`);
          if (saved) {
            const draft = JSON.parse(saved);
            if (draft.content !== data.content || draft.title !== data.title || draft.notes !== (data.notes ?? "")) {
              setRecoveredDraft(draft);
            } else {
              localStorage.removeItem(`jp_draft_${id}`);
            }
          }
        } catch {}
      })
      .catch(() => setLoading(false));
  }, [id]);

  const save = useCallback(async (overrides?: { status?: string }) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/sermons/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          content,
          outline: "",
          status: overrides?.status ?? status,
          scheduledDate: scheduledDate || null,
          notes,
          lastUpdated: lastUpdatedAt,
        }),
      });
      if (res.status === 409) {
        setConflictDetected(true);
        setSaving(false);
        return;
      }
      if (res.status === 401) {
        try {
          localStorage.setItem(`jp_draft_${id}`, JSON.stringify({ title, content, notes, savedAt: Date.now() }));
        } catch {}
        setSessionExpired(true);
        setSaving(false);
        return;
      }
      setLastSaved(new Date());
      setLastUpdatedAt(new Date().toISOString());
      setConflictDetected(false);
      try { localStorage.removeItem(`jp_draft_${id}`); } catch {}
    } catch {
      try {
        localStorage.setItem(`jp_draft_${id}`, JSON.stringify({ title, content, notes, savedAt: Date.now() }));
      } catch {}
    }
    setSaving(false);
  }, [id, title, content, status, scheduledDate, notes, lastUpdatedAt]);

  const changeStatus = useCallback((newStatus: string) => {
    setStatus(newStatus);
    save({ status: newStatus });
  }, [save]);

  useEffect(() => {
    if (!sermon) return;
    const timer = setInterval(() => save(), 30000);
    return () => clearInterval(timer);
  }, [sermon, save]);

  const bothClosed = !leftOpen && !rightOpen;

  function wrapSelection(prefix: string, suffix: string) {
    const textarea = editorRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = textarea.value.slice(start, end);
    const before = textarea.value.slice(0, start);
    const after = textarea.value.slice(end);
    const wrapped = prefix + (selected || "text") + suffix;
    setContent(before + wrapped + after);
    requestAnimationFrame(() => {
      if (selected) {
        textarea.selectionStart = start + prefix.length;
        textarea.selectionEnd = start + prefix.length + selected.length;
      } else {
        textarea.selectionStart = start + prefix.length;
        textarea.selectionEnd = start + prefix.length + 4;
      }
      textarea.focus();
    });
  }

  async function handleDelete() {
    if (!confirm(t("editor.deleteConfirm"))) return;
    await fetch(`/api/sermons/${id}`, { method: "DELETE" });
    router.push("/sermons");
  }

  function toggleSection(secId: string) {
    setCompletedSections((prev) => {
      const next = new Set(prev);
      if (next.has(secId)) next.delete(secId);
      else next.add(secId);
      return next;
    });
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full text-mute">
        {t("editor.loading")}
      </div>
    );
  }

  if (!sermon) {
    return (
      <div className="flex items-center justify-center h-full text-mute">
        {t("editor.notFound")}
      </div>
    );
  }

  const words = wordCount(content);
  const estMinutes = Math.max(1, Math.round(words / 130));

  const checkCtx: CheckContext = {
    title, content, scheduledDate, notes,
  };

  const passedChecks = checklist.filter((c) => c.check(checkCtx));
  const requiredPassed = checklist.filter((c) => c.required && c.check(checkCtx)).length;
  const requiredTotal = checklist.filter((c) => c.required).length;
  const allRequiredPassed = requiredPassed === requiredTotal;

  const nextStatus: Record<string, string> = {
    draft: "ready",
    ready: "delivered",
  };

  const nextAction: Record<string, string> = {
    draft: t("editor.markReady"),
    ready: t("editor.markDelivered"),
  };

  function handleStatusAdvance() {
    const next = nextStatus[status];
    if (!next) return;
    if (status === "draft" && !allRequiredPassed) return;
    changeStatus(next);
  }

  const chevronCollapse = isAr ? "chevron_right" : "chevron_left";
  const chevronExpandLeft = isAr ? "chevron_left" : "chevron_right";
  const chevronExpandRight = isAr ? "chevron_right" : "chevron_left";
  const backArrow = isAr ? "→" : "←";

  return (
    <div className="flex flex-col h-full">
      {/* Top bar */}
      <div className="flex items-center justify-between px-3 sm:px-5 py-2.5 border-b border-line bg-white gap-2">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
          <button
            onClick={() => router.push("/sermons")}
            className="text-xs px-2 sm:px-2.5 py-1 border border-line bg-white text-ink hover:bg-surface transition-colors shrink-0"
          >
            {backArrow}<span className="hidden sm:inline"> {t("editor.sermons")}</span>
          </button>
          <span className="text-sm text-ink font-[var(--font-arabic)] italic truncate hidden sm:inline">
            {title || t("editor.untitled")}{scheduledDate ? ` — ${new Date(scheduledDate).toLocaleDateString(locale, { day: "numeric", month: "short", year: "numeric" })}` : ""}
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
            {t("editor.delete")}
          </button>
          <button
            onClick={() => save()}
            className="text-xs px-3 py-1 bg-primary text-white font-semibold hover:bg-secondary transition-colors"
          >
            {saving ? t("editor.saving") : t("editor.save")}
          </button>
        </div>
      </div>

      {/* Mobile panel tabs */}
      <div className="flex md:hidden border-b border-line bg-white">
        {([
          { key: "info", labelKey: "editor.info", icon: "info" },
          { key: "editor", labelKey: "editor.editorTab", icon: "edit" },
          { key: "checklist", labelKey: "editor.checklist", icon: "checklist" },
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
            {t(tab.labelKey)}
          </button>
        ))}
      </div>

      {/* 3-column layout */}
      <div className="flex-1 flex min-h-0">
        {/* Left panel — Speech info */}
        <div className={`${mobilePanel === "info" ? "flex" : "hidden"} md:flex ${isAr ? "border-l" : "border-r"} border-line bg-white overflow-hidden shrink-0 flex-col transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${leftOpen ? "w-full md:w-[175px] p-3.5" : "md:w-0 md:p-0 md:border-none"}`}>
          <div className={`${leftOpen ? "opacity-100" : "opacity-0 pointer-events-none"} transition-opacity duration-200 flex flex-col min-w-[160px]`}>
          <div className="flex items-center justify-between mb-2">
            <p className="text-[9px] tracking-[2px] text-mute/60">{t("editor.speechInfo")}</p>
            <button onClick={() => setLeftOpen(false)} className="hidden md:flex items-center justify-center w-5 h-5 rounded-md text-mute/40 hover:text-mute hover:bg-surface transition-colors" title={t("editor.collapsePanel")}>
              <span className="material-symbols-outlined text-[14px]">{chevronCollapse}</span>
            </button>
          </div>

          <div className="mb-2.5">
            <p className="text-[10px] text-mute/60">{t("editor.date")}</p>
            <input
              type="date"
              value={scheduledDate}
              onChange={(e) => setScheduledDate(e.target.value)}
              className="text-xs font-medium text-ink bg-transparent border-none outline-none w-full"
            />
          </div>

          <div className="mb-2.5">
            <p className="text-[10px] text-mute/60">{t("status.label")}</p>
            <select
              value={status}
              onChange={(e) => changeStatus(e.target.value)}
              className="text-xs font-medium text-ink bg-transparent border-none outline-none w-full"
            >
              {allStatuses.map((s) => (
                <option key={s} value={s}>{statusLabel[s]}</option>
              ))}
            </select>
          </div>

          {hasOrg && (status === "ready" || status === "draft") && userRole !== "admin" && (
            <button
              onClick={() => changeStatus("submitted")}
              className="w-full mb-2.5 px-3 py-2 bg-blue-600 text-white text-[11px] font-semibold rounded hover:bg-blue-700 transition-colors flex items-center justify-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[14px]">send</span>
              {t("approval.submit")}
            </button>
          )}
          {hasOrg && (status === "submitted" || status === "in_review") && userRole === "admin" && (
            <div className="mb-2.5 flex flex-col gap-1.5">
              {status === "submitted" && (
                <button
                  onClick={() => changeStatus("in_review")}
                  className="w-full px-3 py-2 bg-amber-500 text-white text-[11px] font-semibold rounded hover:bg-amber-600 transition-colors flex items-center justify-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[14px]">rate_review</span>
                  {t("status.inReview")}
                </button>
              )}
              <button
                onClick={() => changeStatus("approved")}
                className="w-full px-3 py-2 bg-green-600 text-white text-[11px] font-semibold rounded hover:bg-green-700 transition-colors flex items-center justify-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[14px]">check_circle</span>
                {t("approval.approve")}
              </button>
              <button
                onClick={() => changeStatus("rejected")}
                className="w-full px-3 py-2 border border-red-200 text-red-600 text-[11px] font-semibold rounded hover:bg-red-50 transition-colors flex items-center justify-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[14px]">undo</span>
                {t("approval.reject")}
              </button>
            </div>
          )}
          {hasOrg && (status === "submitted" || status === "in_review") && userRole !== "admin" && (
            <div className="mb-2.5 px-3 py-2 bg-amber-50 border border-amber-200 rounded text-[11px] text-amber-700 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[14px]">hourglass_top</span>
              {t("approval.pending")}
            </div>
          )}

          <div className="mb-2.5">
            <p className="text-[10px] text-mute/60">{t("editor.words")}</p>
            <p className="text-xs font-medium text-ink">{words}</p>
          </div>

          <div className="mb-2.5">
            <p className="text-[10px] text-mute/60">{t("editor.estDelivery")}</p>
            <p className="text-xs font-medium text-ink">{estMinutes} {t("editor.min")}</p>
          </div>

          <div className="h-px bg-line my-2.5" />

          <p className="text-[9px] tracking-[2px] text-mute/60 mb-2">{t("editor.structure")}</p>
          <div className="flex flex-col gap-1">
            {sectionCheckKeys.map((sec) => (
              <button
                key={sec.id}
                onClick={() => toggleSection(sec.id)}
                className="flex items-center gap-2 text-[11px] px-1.5 py-1.5 text-start transition-colors hover:bg-surface group"
              >
                <span className={`material-symbols-outlined text-[14px] shrink-0 transition-colors ${
                  completedSections.has(sec.id) ? "text-green-600" : "text-line group-hover:text-mute"
                }`}>
                  {completedSections.has(sec.id) ? "check_circle" : "radio_button_unchecked"}
                </span>
                <span className={`material-symbols-outlined text-[13px] shrink-0 ${
                  completedSections.has(sec.id) ? "text-primary/40" : "text-line"
                }`}>{sec.icon}</span>
                <span className={completedSections.has(sec.id) ? "text-mute line-through" : "text-mute"}>
                  {t(sec.labelKey)}
                </span>
              </button>
            ))}
          </div>

          <div className="h-px bg-line my-2.5" />

          <p className="text-[9px] tracking-[2px] text-mute/60 mb-2">{t("editor.notes")}</p>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={t("editor.privateNotes")}
            rows={4}
            className="w-full text-[11px] text-ink bg-surface border border-line p-2 resize-none outline-none focus:border-primary transition-colors"
          />

          <div className="flex gap-2 mt-4 md:hidden">
            <button
              onClick={handleDelete}
              className="text-xs px-3 py-1.5 border border-line text-red-500 hover:bg-red-50 transition-colors flex-1"
            >
              {t("editor.delete")}
            </button>
          </div>
          </div>
        </div>

        {/* Center — Editor */}
        <div className={`${mobilePanel === "editor" ? "flex" : "hidden"} md:flex flex-1 flex-col min-w-0 relative`}>
          {/* Left re-open tab */}
          {!leftOpen && (
            <button
              onClick={() => setLeftOpen(true)}
              className={`hidden md:flex absolute ${isAr ? "right-0" : "left-0"} top-3 z-10 items-center justify-center w-5 h-10 bg-white border ${isAr ? "border-r-0 rounded-l-lg" : "border-l-0 rounded-r-lg"} border-line text-mute/50 hover:text-primary hover:bg-primary/5 transition-colors shadow-sm`}
              title={t("editor.showSpeechInfo")}
            >
              <span className="material-symbols-outlined text-[14px]">{chevronExpandLeft}</span>
            </button>
          )}

          {/* Right re-open tab */}
          {!rightOpen && (
            <button
              onClick={() => setRightOpen(true)}
              className={`hidden md:flex absolute ${isAr ? "left-0" : "right-0"} top-3 z-10 items-center justify-center w-5 h-10 bg-white border ${isAr ? "border-l-0 rounded-r-lg" : "border-r-0 rounded-l-lg"} border-line text-mute/50 hover:text-primary hover:bg-primary/5 transition-colors shadow-sm`}
              title={t("editor.showChecklist")}
            >
              <span className="material-symbols-outlined text-[14px]">{chevronExpandRight}</span>
            </button>
          )}

          {/* Toolbar */}
          <div className="flex items-center justify-between px-3 sm:px-3.5 py-2 border-b border-line bg-[#fdfcfa]">
            <div className="flex items-center gap-1.5 overflow-x-auto">
              <button onClick={() => wrapSelection("**", "**")} className="text-[11px] px-2 py-1 border border-line bg-white text-ink/70 hover:bg-[#f3f0ea] transition-colors font-bold shrink-0">B</button>
              <button onClick={() => wrapSelection("*", "*")} className="text-[11px] px-2 py-1 border border-line bg-white text-ink/70 hover:bg-[#f3f0ea] transition-colors italic shrink-0">I</button>
              <button onClick={() => wrapSelection("__", "__")} className="text-[11px] px-2 py-1 border border-line bg-white text-ink/70 hover:bg-[#f3f0ea] transition-colors underline shrink-0">U</button>
              <div className="w-px h-4 bg-line mx-0.5 shrink-0" />
              <button onClick={() => wrapSelection("\n> ", "\n")} className="px-1.5 py-1 border border-line bg-white text-ink/70 hover:bg-[#f3f0ea] transition-colors shrink-0"><span className="material-symbols-outlined text-[14px]">format_quote</span></button>
            </div>
            <span className="text-[10px] text-mute shrink-0 ms-2">
              {saving
                ? t("editor.saving")
                : lastSaved
                ? `${t("editor.saved")} ${lastSaved.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" })}`
                : ""}
            </span>
          </div>

          {/* Title + Editor wrapper */}
          <div className="flex-1 flex flex-col min-h-0 bg-white">
            {sessionExpired && (
              <div className="mx-5 sm:mx-8 mt-4 flex items-center gap-2 px-4 py-3 bg-amber-50 border border-amber-200 rounded-lg text-[13px] text-amber-800">
                <span className="material-symbols-outlined text-amber-500 text-lg">warning</span>
                {t("editor.sessionExpired")}
              </div>
            )}
            {conflictDetected && (
              <div className="mx-5 sm:mx-8 mt-4 flex items-center gap-2 px-4 py-3 bg-orange-50 border border-orange-200 rounded-lg text-[13px] text-orange-800">
                <span className="material-symbols-outlined text-orange-500 text-lg">sync_problem</span>
                <span className="flex-1">{t("editor.conflict")}</span>
                <button onClick={() => window.location.reload()}
                  className="px-3 py-1 bg-orange-600 text-white text-[11px] font-medium rounded hover:bg-orange-700 transition-colors">
                  {t("editor.reloadLatest")}
                </button>
              </div>
            )}
            {recoveredDraft && (
              <div className="mx-5 sm:mx-8 mt-4 flex items-center gap-2 px-4 py-3 bg-blue-50 border border-blue-200 rounded-lg text-[13px] text-blue-800">
                <span className="material-symbols-outlined text-blue-500 text-lg">restore</span>
                <span className="flex-1">{t("editor.recoveredDraft")}</span>
                <button onClick={() => { setTitle(recoveredDraft.title); setContent(recoveredDraft.content); setNotes(recoveredDraft.notes); setRecoveredDraft(null); try { localStorage.removeItem(`jp_draft_${id}`); } catch {} }}
                  className="px-3 py-1 bg-blue-600 text-white text-[11px] font-medium rounded hover:bg-blue-700 transition-colors">
                  {t("editor.restoreDraft")}
                </button>
                <button onClick={() => { setRecoveredDraft(null); try { localStorage.removeItem(`jp_draft_${id}`); } catch {} }}
                  className="px-3 py-1 border border-blue-200 text-blue-600 text-[11px] font-medium rounded hover:bg-blue-100 transition-colors">
                  {t("editor.discardDraft")}
                </button>
              </div>
            )}
            {/* Title */}
            <div className="px-5 sm:px-8 pt-5 pb-1">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={t("editor.titlePlaceholder")}
                className="w-full text-xl sm:text-2xl font-bold text-ink placeholder:text-line bg-transparent border-none outline-none"
              />
            </div>

            {/* Content */}
            <div className="flex-1 min-h-0 px-5 sm:px-8 pb-6">
              <textarea
                ref={editorRef}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={t("editor.contentPlaceholder")}
                className="w-full h-full min-h-0 leading-[2.2] text-ink bg-transparent border-none resize-none outline-none"
                style={{ fontSize: `${editorFontSize}px` }}
                dir="auto"
              />
            </div>
          </div>

          {/* Status bar */}
          <div className="flex items-center justify-between px-3 sm:px-3.5 py-1.5 border-t border-line bg-white text-[10px] text-mute/60">
            <span>
              {saving
                ? t("editor.saving")
                : lastSaved
                ? `${t("editor.autoSaved")} ${lastSaved.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" })}`
                : t("editor.notSaved")}
            </span>
            <span>{words} {t("editor.words")} · ~{estMinutes} {t("editor.min")}</span>
          </div>
        </div>

        {/* Right panel — Checklist & References */}
        <div className={`${mobilePanel === "checklist" ? "flex" : "hidden"} md:flex ${isAr ? "border-r" : "border-l"} border-line bg-white overflow-hidden shrink-0 flex-col transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${rightOpen ? "w-full md:w-[200px] p-3.5" : "md:w-0 md:p-0 md:border-none"}`}>
          <div className={`${rightOpen ? "opacity-100" : "opacity-0 pointer-events-none"} transition-opacity duration-200 flex flex-col min-w-[185px]`}>
          <div className="flex items-center justify-between mb-2">
            <p className="text-[9px] tracking-[2px] text-mute/60">{t("editor.readiness")}</p>
            <button onClick={() => setRightOpen(false)} className="hidden md:flex items-center justify-center w-5 h-5 rounded-md text-mute/40 hover:text-mute hover:bg-surface transition-colors" title={t("editor.collapsePanel")}>
              <span className="material-symbols-outlined text-[14px]">{isAr ? "chevron_left" : "chevron_right"}</span>
            </button>
          </div>
          <div className="mb-3">
            <div className="flex items-center gap-2 mb-2">
              <div className="flex-1 h-1.5 bg-surface overflow-hidden">
                <div
                  className={`h-full transition-all ${allRequiredPassed ? "bg-green-500" : "bg-accent-gold"}`}
                  style={{ width: `${(passedChecks.length / checklist.length) * 100}%` }}
                />
              </div>
              <span className="text-[10px] font-bold text-mute">{passedChecks.length}/{checklist.length}</span>
            </div>

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
                      {t(item.labelKey)}
                      {item.required && !passed && <span className={`text-red-400 ${isAr ? "me-0.5" : "ms-0.5"}`}>*</span>}
                    </span>
                  </div>
                );
              })}
            </div>

            {nextAction[status] && (
              <button
                onClick={handleStatusAdvance}
                disabled={!allRequiredPassed && status === "draft"}
                className={`w-full mt-2.5 text-[11px] font-bold py-2 px-3 transition-all flex items-center justify-center gap-1.5 ${
                  allRequiredPassed || status === "ready"
                    ? status === "ready"
                      ? "bg-[#6b5fa0] text-white hover:bg-[#5a4f8a]"
                      : "bg-primary text-white hover:bg-secondary"
                    : "bg-line text-mute cursor-not-allowed"
                }`}
              >
                <span className="material-symbols-outlined text-[14px]">
                  {status === "draft" ? "check_circle" : "event_available"}
                </span>
                {nextAction[status]}
              </button>
            )}

            {!allRequiredPassed && status === "draft" && (
              <p className="text-[9px] text-red-400 mt-1">{t("editor.completeRequired")}</p>
            )}

            {status === "delivered" && (
              <div className="mt-2 bg-[#f0eef8] p-2 text-center">
                <span className="material-symbols-outlined text-[#6b5fa0] text-lg">event_available</span>
                <p className="text-[10px] text-[#6b5fa0] font-bold mt-0.5">{statusLabel.delivered}</p>
              </div>
            )}
          </div>

          <div className="h-px bg-line my-2.5" />

          <p className="text-[9px] tracking-[2px] text-mute/60 mb-2">{t("editor.thisFriday")}</p>
          <div className="bg-primary/5 p-2.5 mb-3">
            {scheduledDate ? (
              <>
                <p className="text-[10px] text-mute/60">
                  {new Date(scheduledDate).toLocaleDateString(locale, { weekday: "long", month: "long", day: "numeric" })}
                </p>
                <p className="text-xs font-medium text-primary mt-0.5">
                  {new Date(scheduledDate).toLocaleDateString(locale, { year: "numeric" })}
                </p>
              </>
            ) : (
              <p className="text-[10px] text-mute">{t("editor.noDate")}</p>
            )}
          </div>


          </div>
        </div>
      </div>

    </div>
  );
}
