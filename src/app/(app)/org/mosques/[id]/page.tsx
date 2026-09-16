"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useI18n } from "@/lib/i18n";

type MosqueData = {
  mosque: {
    id: string;
    name: string;
    address: string | null;
    city: string | null;
    country: string | null;
    capacity: number | null;
  };
  members: {
    id: string;
    name: string;
    email: string | null;
    role: string;
    status: string;
    user_id: string | null;
    invite_code: string | null;
    created_at: string;
  }[];
  khatibStats: {
    member_id: string;
    name: string;
    total_sermons: number;
    delivered_sermons: number;
  }[];
};

type Assignment = {
  id: string;
  friday_date: string;
  member_id: string | null;
  guest_name: string | null;
  khatib_name: string | null;
  status: string;
  swap_reason: string | null;
};

type ActiveMember = {
  id: string;
  name: string;
  status: string;
};

function getFridays(fromDate: Date, count: number): string[] {
  const fridays: string[] = [];
  const d = new Date(fromDate);
  const day = d.getDay();
  const diff = (5 - day + 7) % 7;
  d.setDate(d.getDate() + (diff === 0 ? 0 : diff));
  for (let i = 0; i < count; i++) {
    fridays.push(d.toISOString().split("T")[0]);
    d.setDate(d.getDate() + 7);
  }
  return fridays;
}

function getThisFriday(): string {
  const now = new Date();
  const day = now.getDay();
  const diff = (5 - day + 7) % 7;
  const friday = new Date(now);
  friday.setDate(now.getDate() + (diff === 0 ? 0 : diff));
  return friday.toISOString().split("T")[0];
}

export default function MosqueDetailPage() {
  const { t, lang } = useI18n();
  const isAr = lang === "ar";
  const router = useRouter();
  const params = useParams();
  const mosqueId = params.id as string;

  const [tab, setTab] = useState<"khatibs" | "schedule">("khatibs");
  const [data, setData] = useState<MosqueData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddKhatib, setShowAddKhatib] = useState(false);
  const [newKhatibName, setNewKhatibName] = useState("");
  const [newKhatibEmail, setNewKhatibEmail] = useState("");
  const [adding, setAdding] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  // Schedule state
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [scheduleMembers, setScheduleMembers] = useState<ActiveMember[]>([]);
  const [assigning, setAssigning] = useState<string | null>(null);
  const [selectedMember, setSelectedMember] = useState("");
  const [guestName, setGuestName] = useState("");
  const [isGuest, setIsGuest] = useState(false);
  const [unlinking, setUnlinking] = useState(false);

  const handleUnlink = async () => {
    if (!confirm(t("mosques.unlinkDesc"))) return;
    setUnlinking(true);
    try {
      await fetch(`/api/org/mosques/${mosqueId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "unlink" }),
      });
      router.push("/org/mosques");
    } finally {
      setUnlinking(false);
    }
  };

  const thisFriday = getThisFriday();
  const fridays = getFridays(new Date(), 12);

  const fetchData = useCallback(() => {
    fetch(`/api/org/mosques/${mosqueId}`)
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, [mosqueId]);

  const fetchSchedule = useCallback(() => {
    fetch(`/api/org/schedule?weeks=12&mosque_id=${mosqueId}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.assignments) setAssignments(d.assignments);
        if (d.members) setScheduleMembers(d.members);
      });
  }, [mosqueId]);

  useEffect(() => { fetchData(); fetchSchedule(); }, [fetchData, fetchSchedule]);

  const handleAddKhatib = async () => {
    if (!newKhatibName.trim()) return;
    setAdding(true);
    const res = await fetch("/api/org/members", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: newKhatibName.trim(),
        mosque_id: mosqueId,
        email: newKhatibEmail.trim() || undefined,
      }),
    });
    if (res.ok) {
      setNewKhatibName("");
      setNewKhatibEmail("");
      setShowAddKhatib(false);
      fetchData();
    }
    setAdding(false);
  };

  const handleAssign = async (fridayDate: string) => {
    if (!selectedMember && !guestName.trim()) return;
    setAssigning(fridayDate);
    await fetch("/api/org/schedule", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        friday_date: fridayDate,
        member_id: isGuest ? null : selectedMember,
        guest_name: isGuest ? guestName.trim() : null,
        mosque_id: mosqueId,
      }),
    });
    setAssigning(null);
    setSelectedMember("");
    setGuestName("");
    setIsGuest(false);
    fetchSchedule();
  };

  const handleRemoveAssignment = async (assignmentId: string) => {
    await fetch(`/api/org/schedule?id=${assignmentId}`, { method: "DELETE" });
    fetchSchedule();
  };

  const copyInviteLink = (code: string) => {
    const link = `${window.location.origin}/invite/${code}`;
    navigator.clipboard.writeText(link);
    setCopied(code);
    setTimeout(() => setCopied(null), 2000);
  };

  const formatFridayDate = (d: string) => {
    const date = new Date(d + "T12:00:00");
    return date.toLocaleDateString(isAr ? "ar-SA" : "en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!data?.mosque) {
    return (
      <div className="text-center py-20">
        <p className="text-mute">Mosque not found</p>
      </div>
    );
  }

  const { mosque, members, khatibStats } = data;
  const khatibs = members.filter((m) => m.role === "khatib");
  const assignmentMap = new Map(assignments.map((a) => [a.friday_date, a]));

  const statusColor = (s: string) => {
    if (s === "active") return "bg-emerald-50 text-emerald-700";
    if (s === "invited") return "bg-amber-50 text-amber-700";
    return "bg-gray-100 text-gray-500";
  };

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/org/mosques"
          className="flex items-center gap-1 text-ink/40 hover:text-primary text-sm mb-3 transition-colors"
        >
          <span className="material-symbols-outlined text-lg">{isAr ? "arrow_forward" : "arrow_back"}</span>
          {t("org.backToMosques")}
        </Link>

        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
            <span className="material-symbols-outlined text-3xl">mosque</span>
          </div>
          <div>
            <h1 className="text-xl font-bold text-ink">{mosque.name}</h1>
            <p className="text-sm text-mute mt-0.5">
              {[mosque.city, mosque.country].filter(Boolean).join(", ")}
              {mosque.capacity ? ` · ${mosque.capacity} capacity` : ""}
            </p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: t("org.mosqueKhatibs"), value: khatibs.length, icon: "group", color: "text-primary" },
          { label: t("org.totalSermons"), value: khatibStats.reduce((s, k) => s + k.total_sermons, 0), icon: "description", color: "text-primary" },
          { label: t("org.statDelivered"), value: khatibStats.reduce((s, k) => s + k.delivered_sermons, 0), icon: "check_circle", color: "text-emerald-600" },
        ].map((s) => (
          <div key={s.label} className="bg-white border border-line rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className={`material-symbols-outlined text-lg ${s.color}`}>{s.icon}</span>
              <span className="text-xs text-mute font-semibold">{s.label}</span>
            </div>
            <p className="text-2xl font-bold text-ink">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 mb-4 border-b border-line">
        {(["khatibs", "schedule"] as const).map((t2) => (
          <button
            key={t2}
            onClick={() => setTab(t2)}
            className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors ${
              tab === t2 ? "border-primary text-primary" : "border-transparent text-mute hover:text-ink"
            }`}
          >
            {t2 === "khatibs" ? t("org.mosqueKhatibs") : t("org.mosqueSchedule")}
          </button>
        ))}
      </div>

      {/* Khatibs tab */}
      {tab === "khatibs" && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-mute">{khatibs.length} {t("org.mosqueKhatibs").toLowerCase()}</p>
            <button
              onClick={() => setShowAddKhatib(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-semibold hover:bg-primary/20 transition-colors"
            >
              <span className="material-symbols-outlined text-sm">person_add</span>
              {t("org.addKhatib")}
            </button>
          </div>

          {showAddKhatib && (
            <div className="bg-white border border-line rounded-xl p-4 mb-3">
              <div className="flex flex-col gap-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-ink/50 block mb-1.5">{t("org.khatibNameLabel")}</label>
                    <input
                      type="text"
                      value={newKhatibName}
                      onChange={(e) => setNewKhatibName(e.target.value)}
                      placeholder={t("org.khatibNamePlaceholder")}
                      autoFocus
                      className="w-full px-3 py-2 rounded-lg border border-line bg-white text-ink placeholder:text-ink/25 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 text-sm"
                      onKeyDown={(e) => { if (e.key === "Enter") handleAddKhatib(); }}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-ink/50 block mb-1.5">{isAr ? "البريد الإلكتروني" : "Email (optional)"}</label>
                    <input
                      type="email"
                      value={newKhatibEmail}
                      onChange={(e) => setNewKhatibEmail(e.target.value)}
                      placeholder="khatib@email.com"
                      className="w-full px-3 py-2 rounded-lg border border-line bg-white text-ink placeholder:text-ink/25 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 text-sm"
                      onKeyDown={(e) => { if (e.key === "Enter") handleAddKhatib(); }}
                    />
                    <p className="text-[10px] text-mute mt-1">{isAr ? "سيتم إرسال رابط الدعوة عبر البريد" : "Invite link will be emailed if provided"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleAddKhatib}
                    disabled={adding || !newKhatibName.trim()}
                    className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-secondary transition-colors disabled:opacity-50"
                  >
                    {adding ? "..." : isAr ? "إضافة ودعوة" : "Add & Invite"}
                  </button>
                  <button
                    onClick={() => { setShowAddKhatib(false); setNewKhatibName(""); setNewKhatibEmail(""); }}
                    className="px-3 py-2 rounded-lg text-sm text-mute hover:text-ink transition-colors"
                  >
                    {t("btn.cancel")}
                  </button>
                </div>
              </div>
            </div>
          )}

          {khatibs.length === 0 ? (
            <div className="text-center py-8">
              <span className="material-symbols-outlined text-3xl text-ink/15 mb-2">group</span>
              <p className="text-mute text-sm">{t("org.noKhatibs")}</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {khatibs.map((m) => {
                const stats = khatibStats.find((k) => k.member_id === m.id);
                return (
                  <div key={m.id} className="bg-white border border-line rounded-xl p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                      {m.name[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-ink text-sm">{m.name}</p>
                      {stats && (
                        <p className="text-xs text-mute">
                          {stats.total_sermons} {t("org.sermons")} · {stats.delivered_sermons} {t("org.delivered")}
                        </p>
                      )}
                    </div>
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${statusColor(m.status)}`}>
                      {t(`org.status.${m.status}`)}
                    </span>
                    {m.status === "invited" && m.invite_code && (
                      <button
                        onClick={() => copyInviteLink(m.invite_code!)}
                        className="p-1.5 rounded-lg text-mute hover:text-primary hover:bg-primary/5 transition-colors"
                      >
                        <span className="material-symbols-outlined text-lg">
                          {copied === m.invite_code ? "check" : "content_copy"}
                        </span>
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Schedule tab */}
      {tab === "schedule" && (
        <div className="flex flex-col gap-2">
          {fridays.map((friday) => {
            const assignment = assignmentMap.get(friday);
            const thisWeek = friday === thisFriday;
            const past = friday < new Date().toISOString().split("T")[0];
            const showAssignForm = assigning === friday;

            return (
              <div
                key={friday}
                className={`bg-white border rounded-xl p-4 transition-colors ${
                  thisWeek ? "border-primary/40 ring-2 ring-primary/10" : "border-line"
                } ${past ? "opacity-60" : ""}`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-16 text-center shrink-0">
                    <p className="text-[10px] text-mute font-semibold uppercase">{t("org.friday")}</p>
                    <p className="text-sm font-bold text-ink">{formatFridayDate(friday)}</p>
                    {thisWeek && <span className="text-[9px] font-bold text-primary uppercase">{t("org.thisWeekLabel")}</span>}
                  </div>
                  <div className={`w-px h-10 ${thisWeek ? "bg-primary/20" : "bg-line"}`} />
                  <div className="flex-1 min-w-0">
                    {assignment ? (
                      <div className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                          assignment.guest_name ? "bg-accent-gold/15 text-accent-gold" : "bg-primary/10 text-primary"
                        }`}>
                          {(assignment.khatib_name || assignment.guest_name || "?")[0]}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-ink text-sm truncate">
                            {assignment.khatib_name || assignment.guest_name}
                            {assignment.guest_name && (
                              <span className="text-[10px] text-accent-gold font-bold ms-1.5">({t("org.guest")})</span>
                            )}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-ink/25 italic">{t("org.unassigned")}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {assignment && !past ? (
                      <button
                        onClick={() => handleRemoveAssignment(assignment.id)}
                        className="p-1.5 rounded-lg text-mute hover:text-red-500 hover:bg-red-50 transition-colors"
                      >
                        <span className="material-symbols-outlined text-lg">close</span>
                      </button>
                    ) : !assignment && !past ? (
                      <button
                        onClick={() => {
                          setAssigning(friday);
                          setSelectedMember(scheduleMembers[0]?.id || "");
                          setIsGuest(false);
                          setGuestName("");
                        }}
                        className="px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-semibold hover:bg-primary/20 transition-colors"
                      >
                        {t("org.assignKhatib")}
                      </button>
                    ) : null}
                  </div>
                </div>

                {showAssignForm && (
                  <div className="mt-3 pt-3 border-t border-line">
                    <div className="flex items-center gap-2 mb-2">
                      <button
                        onClick={() => setIsGuest(false)}
                        className={`text-xs font-semibold px-3 py-1 rounded-full transition-colors ${!isGuest ? "bg-primary text-white" : "bg-surface text-mute"}`}
                      >
                        {t("org.selectKhatib")}
                      </button>
                      <button
                        onClick={() => setIsGuest(true)}
                        className={`text-xs font-semibold px-3 py-1 rounded-full transition-colors ${isGuest ? "bg-accent-gold text-white" : "bg-surface text-mute"}`}
                      >
                        {t("org.addGuest")}
                      </button>
                    </div>
                    <div className="flex items-end gap-2">
                      {isGuest ? (
                        <input
                          type="text"
                          value={guestName}
                          onChange={(e) => setGuestName(e.target.value)}
                          placeholder={t("org.guestName")}
                          autoFocus
                          className="flex-1 px-3 py-2 rounded-lg border border-line bg-white text-ink text-sm placeholder:text-ink/25 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
                        />
                      ) : (
                        <select
                          value={selectedMember}
                          onChange={(e) => setSelectedMember(e.target.value)}
                          className="flex-1 px-3 py-2 rounded-lg border border-line bg-white text-ink text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
                        >
                          {scheduleMembers.map((m) => (
                            <option key={m.id} value={m.id}>{m.name}</option>
                          ))}
                        </select>
                      )}
                      <button
                        onClick={() => handleAssign(friday)}
                        disabled={(!isGuest && !selectedMember) || (isGuest && !guestName.trim())}
                        className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-secondary transition-colors disabled:opacity-50"
                      >
                        {t("org.assignKhatib")}
                      </button>
                      <button
                        onClick={() => setAssigning(null)}
                        className="px-3 py-2 rounded-lg text-sm text-mute hover:text-ink transition-colors"
                      >
                        {t("btn.cancel")}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Unlink section */}
      <div className="mt-6 bg-white border border-red-200 rounded-xl p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-red-600">{t("mosques.unlink")}</p>
            <p className="text-xs text-mute mt-0.5">{t("mosques.unlinkDesc")}</p>
          </div>
          <button
            onClick={handleUnlink}
            disabled={unlinking}
            className="px-4 py-2 rounded-lg bg-red-50 text-red-600 text-xs font-semibold hover:bg-red-100 transition-colors disabled:opacity-50"
          >
            {unlinking ? t("mosques.unlinking") : t("mosques.unlinkConfirm")}
          </button>
        </div>
      </div>
    </div>
  );
}
