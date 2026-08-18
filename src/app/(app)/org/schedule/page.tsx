"use client";

import { useState, useEffect, useCallback } from "react";
import { useI18n } from "@/lib/i18n";

type Assignment = {
  id: string;
  friday_date: string;
  member_id: string | null;
  guest_name: string | null;
  status: string;
  swap_reason: string | null;
  notes: string | null;
  khatib_name: string | null;
  khatib_status: string | null;
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

export default function SchedulePage() {
  const { t, lang } = useI18n();
  const isAr = lang === "ar";

  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [members, setMembers] = useState<ActiveMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState<string | null>(null);
  const [selectedMember, setSelectedMember] = useState("");
  const [guestName, setGuestName] = useState("");
  const [isGuest, setIsGuest] = useState(false);
  const [swapId, setSwapId] = useState<string | null>(null);
  const [swapReason, setSwapReason] = useState("");
  const [swapMember, setSwapMember] = useState("");
  const [swapGuest, setSwapGuest] = useState("");
  const [swapIsGuest, setSwapIsGuest] = useState(false);

  const thisFriday = getThisFriday();
  const fridays = getFridays(new Date(), 16);

  const fetchSchedule = useCallback(() => {
    fetch("/api/org/schedule?weeks=16")
      .then((r) => r.json())
      .then((d) => {
        if (d.assignments) setAssignments(d.assignments);
        if (d.members) setMembers(d.members);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchSchedule(); }, [fetchSchedule]);

  const assignmentMap = new Map(assignments.map((a) => [a.friday_date, a]));

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
      }),
    });

    setAssigning(null);
    setSelectedMember("");
    setGuestName("");
    setIsGuest(false);
    fetchSchedule();
  };

  const handleSwap = async (assignmentId: string) => {
    if (!swapMember && !swapGuest.trim()) return;

    await fetch("/api/org/schedule", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: assignmentId,
        member_id: swapIsGuest ? null : swapMember,
        guest_name: swapIsGuest ? swapGuest.trim() : null,
        swap_reason: swapReason || null,
      }),
    });

    setSwapId(null);
    setSwapReason("");
    setSwapMember("");
    setSwapGuest("");
    setSwapIsGuest(false);
    fetchSchedule();
  };

  const handleRemove = async (assignmentId: string) => {
    await fetch(`/api/org/schedule?id=${assignmentId}`, { method: "DELETE" });
    fetchSchedule();
  };

  const formatFridayDate = (d: string) => {
    const date = new Date(d + "T12:00:00");
    return date.toLocaleDateString(isAr ? "ar-SA" : "en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  const isThisWeek = (d: string) => d === thisFriday;
  const isPast = (d: string) => d < new Date().toISOString().split("T")[0];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-ink">{t("org.schedule")}</h1>
        <p className="text-sm text-mute mt-0.5">{t("org.scheduleSub")}</p>
      </div>

      <div className="flex flex-col gap-2">
        {fridays.map((friday) => {
          const assignment = assignmentMap.get(friday);
          const thisWeek = isThisWeek(friday);
          const past = isPast(friday);
          const showAssignForm = assigning === friday;
          const showSwapForm = swapId === assignment?.id;

          return (
            <div
              key={friday}
              className={`bg-white border rounded-xl p-4 transition-colors ${
                thisWeek ? "border-primary/40 ring-2 ring-primary/10" : "border-line"
              } ${past ? "opacity-60" : ""}`}
            >
              <div className="flex items-center gap-3">
                {/* Date */}
                <div className="w-16 text-center shrink-0">
                  <p className="text-[10px] text-mute font-semibold uppercase">{t("org.friday")}</p>
                  <p className="text-sm font-bold text-ink">{formatFridayDate(friday)}</p>
                  {thisWeek && (
                    <span className="text-[9px] font-bold text-primary uppercase">{t("org.thisWeekLabel")}</span>
                  )}
                </div>

                <div className={`w-px h-10 ${thisWeek ? "bg-primary/20" : "bg-line"}`} />

                {/* Assignment */}
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
                        {assignment.swap_reason && (
                          <p className="text-[10px] text-mute">{assignment.swap_reason}</p>
                        )}
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-ink/25 italic">{t("org.unassigned")}</p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 shrink-0">
                  {assignment && !past ? (
                    <>
                      <button
                        onClick={() => {
                          setSwapId(assignment.id);
                          setSwapMember("");
                          setSwapGuest("");
                          setSwapIsGuest(false);
                          setSwapReason("");
                        }}
                        className="p-1.5 rounded-lg text-mute hover:text-primary hover:bg-primary/5 transition-colors"
                        title={t("org.swapKhatib")}
                      >
                        <span className="material-symbols-outlined text-lg">swap_horiz</span>
                      </button>
                      <button
                        onClick={() => handleRemove(assignment.id)}
                        className="p-1.5 rounded-lg text-mute hover:text-red-500 hover:bg-red-50 transition-colors"
                        title={t("org.removeAssignment")}
                      >
                        <span className="material-symbols-outlined text-lg">close</span>
                      </button>
                    </>
                  ) : !assignment && !past ? (
                    <button
                      onClick={() => {
                        setAssigning(friday);
                        setSelectedMember(members[0]?.id || "");
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

              {/* Assign form */}
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
                        {members.map((m) => (
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

              {/* Swap form */}
              {showSwapForm && (
                <div className="mt-3 pt-3 border-t border-line">
                  <p className="text-xs font-semibold text-ink/50 mb-2">{t("org.swapKhatib")}</p>

                  <div className="flex items-center gap-2 mb-2">
                    <button
                      onClick={() => setSwapIsGuest(false)}
                      className={`text-xs font-semibold px-3 py-1 rounded-full transition-colors ${!swapIsGuest ? "bg-primary text-white" : "bg-surface text-mute"}`}
                    >
                      {t("org.selectKhatib")}
                    </button>
                    <button
                      onClick={() => setSwapIsGuest(true)}
                      className={`text-xs font-semibold px-3 py-1 rounded-full transition-colors ${swapIsGuest ? "bg-accent-gold text-white" : "bg-surface text-mute"}`}
                    >
                      {t("org.addGuest")}
                    </button>
                  </div>

                  <div className="flex flex-col gap-2">
                    <div className="flex items-end gap-2">
                      {swapIsGuest ? (
                        <input
                          type="text"
                          value={swapGuest}
                          onChange={(e) => setSwapGuest(e.target.value)}
                          placeholder={t("org.guestName")}
                          autoFocus
                          className="flex-1 px-3 py-2 rounded-lg border border-line bg-white text-ink text-sm placeholder:text-ink/25 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
                        />
                      ) : (
                        <select
                          value={swapMember}
                          onChange={(e) => setSwapMember(e.target.value)}
                          className="flex-1 px-3 py-2 rounded-lg border border-line bg-white text-ink text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
                        >
                          <option value="">{t("org.selectKhatib")}</option>
                          {members.map((m) => (
                            <option key={m.id} value={m.id}>{m.name}</option>
                          ))}
                        </select>
                      )}
                    </div>

                    <select
                      value={swapReason}
                      onChange={(e) => setSwapReason(e.target.value)}
                      className="px-3 py-2 rounded-lg border border-line bg-white text-ink text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
                    >
                      <option value="">{t("org.reason")}</option>
                      <option value="Sick">{t("org.sick")}</option>
                      <option value="Travel">{t("org.travel")}</option>
                      <option value="Other">{t("org.other")}</option>
                    </select>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleSwap(assignment!.id)}
                        disabled={(!swapIsGuest && !swapMember) || (swapIsGuest && !swapGuest.trim())}
                        className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-secondary transition-colors disabled:opacity-50"
                      >
                        {t("org.swapKhatib")}
                      </button>
                      <button
                        onClick={() => setSwapId(null)}
                        className="px-3 py-2 rounded-lg text-sm text-mute hover:text-ink transition-colors"
                      >
                        {t("btn.cancel")}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
