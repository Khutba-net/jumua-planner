"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useI18n } from "@/lib/i18n";

type Member = {
  id: string;
  name: string;
  email: string | null;
  role: string;
  status: string;
  invite_code: string | null;
  invite_expires_at: string | null;
  created_at: string;
};

export default function KhatibsPage() {
  const { t, lang } = useI18n();
  const isAr = lang === "ar";

  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const [adding, setAdding] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchMembers = useCallback(() => {
    fetch("/api/org/members")
      .then((r) => r.json())
      .then((d) => { if (Array.isArray(d)) setMembers(d); })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchMembers(); }, [fetchMembers]);

  const handleAdd = async () => {
    if (!newName.trim()) return;
    setAdding(true);
    const res = await fetch("/api/org/members", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName.trim() }),
    });
    if (res.ok) {
      setNewName("");
      setShowAdd(false);
      fetchMembers();
    }
    setAdding(false);
  };

  const handleAction = async (id: string, action: string) => {
    setActionLoading(id);
    if (action === "remove") {
      await fetch(`/api/org/members/${id}`, { method: "DELETE" });
    } else {
      await fetch(`/api/org/members/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
    }
    fetchMembers();
    setActionLoading(null);
  };

  const copyInviteLink = (code: string) => {
    const link = `${window.location.origin}/invite/${code}`;
    navigator.clipboard.writeText(link);
    setCopied(code);
    setTimeout(() => setCopied(null), 2000);
  };

  const statusColor = (s: string) => {
    if (s === "active") return "bg-emerald-50 text-emerald-700";
    if (s === "invited") return "bg-amber-50 text-amber-700";
    return "bg-gray-100 text-gray-500";
  };

  const khatibs = members.filter((m) => m.role === "khatib");
  const admin = members.find((m) => m.role === "admin");

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-ink">{t("org.khatibs")}</h1>
          <p className="text-sm text-mute mt-0.5">{t("org.khatibsSub")}</p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-secondary transition-colors"
        >
          <span className="material-symbols-outlined text-lg">person_add</span>
          {t("org.addKhatib")}
        </button>
      </div>

      {showAdd && (
        <div className="bg-white border border-line rounded-xl p-4 mb-4 flex items-end gap-3">
          <div className="flex-1">
            <label className="text-xs font-semibold text-ink/50 block mb-1.5">{t("org.khatibNameLabel")}</label>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder={t("org.khatibNamePlaceholder")}
              autoFocus
              className="w-full px-3 py-2 rounded-lg border border-line bg-white text-ink placeholder:text-ink/25 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 text-sm"
              onKeyDown={(e) => { if (e.key === "Enter") handleAdd(); }}
            />
          </div>
          <button
            onClick={handleAdd}
            disabled={adding || !newName.trim()}
            className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-secondary transition-colors disabled:opacity-50"
          >
            {adding ? "..." : t("org.add")}
          </button>
          <button
            onClick={() => { setShowAdd(false); setNewName(""); }}
            className="px-3 py-2 rounded-lg text-sm text-mute hover:text-ink transition-colors"
          >
            {t("btn.cancel")}
          </button>
        </div>
      )}

      {admin && (
        <div className="bg-white border border-line rounded-xl p-4 mb-3 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-accent-gold/15 flex items-center justify-center text-accent-gold font-bold text-sm">
            {admin.name[0]}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-ink text-sm">{admin.name}</p>
            {admin.email && <p className="text-xs text-mute truncate">{admin.email}</p>}
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-accent-gold bg-accent-gold/10 px-2.5 py-1 rounded-full">
            {t("org.admin")}
          </span>
        </div>
      )}

      <div className="flex flex-col gap-2">
        {khatibs.map((m) => (
          <div key={m.id} className="bg-white border border-line rounded-xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
              {m.name[0]}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-ink text-sm">{m.name}</p>
              {m.email && <p className="text-xs text-mute truncate">{m.email}</p>}
            </div>

            <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${statusColor(m.status)}`}>
              {t(`org.status.${m.status}`)}
            </span>

            <div className="flex items-center gap-1">
              {m.status === "active" && (
                <Link
                  href={`/org/khatibs/${m.id}`}
                  className="p-1.5 rounded-lg text-mute hover:text-primary hover:bg-primary/5 transition-colors"
                  title={t("org.viewSermons")}
                >
                  <span className="material-symbols-outlined text-lg">visibility</span>
                </Link>
              )}
              {m.status === "invited" && m.invite_code && (
                <button
                  onClick={() => copyInviteLink(m.invite_code!)}
                  className="p-1.5 rounded-lg text-mute hover:text-primary hover:bg-primary/5 transition-colors"
                  title={t("org.copyLink")}
                >
                  <span className="material-symbols-outlined text-lg">
                    {copied === m.invite_code ? "check" : "content_copy"}
                  </span>
                </button>
              )}
              {m.status === "invited" && (
                <>
                  <button
                    onClick={() => handleAction(m.id, "resend")}
                    disabled={actionLoading === m.id}
                    className="p-1.5 rounded-lg text-mute hover:text-primary hover:bg-primary/5 transition-colors disabled:opacity-50"
                    title={t("org.resend")}
                  >
                    <span className="material-symbols-outlined text-lg">refresh</span>
                  </button>
                  <button
                    onClick={() => handleAction(m.id, "remove")}
                    disabled={actionLoading === m.id}
                    className="p-1.5 rounded-lg text-mute hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
                    title={t("org.remove")}
                  >
                    <span className="material-symbols-outlined text-lg">delete</span>
                  </button>
                </>
              )}
              {m.status === "active" && (
                <button
                  onClick={() => handleAction(m.id, "deactivate")}
                  disabled={actionLoading === m.id}
                  className="p-1.5 rounded-lg text-mute hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
                  title={t("org.deactivate")}
                >
                  <span className="material-symbols-outlined text-lg">person_off</span>
                </button>
              )}
              {m.status === "deactivated" && (
                <button
                  onClick={() => handleAction(m.id, "reactivate")}
                  disabled={actionLoading === m.id}
                  className="p-1.5 rounded-lg text-mute hover:text-emerald-600 hover:bg-emerald-50 transition-colors disabled:opacity-50"
                  title={t("org.reactivate")}
                >
                  <span className="material-symbols-outlined text-lg">person_add</span>
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {khatibs.length === 0 && (
        <div className="text-center py-12">
          <span className="material-symbols-outlined text-4xl text-ink/15 mb-2">group</span>
          <p className="text-mute text-sm">{t("org.noKhatibs")}</p>
        </div>
      )}
    </div>
  );
}
