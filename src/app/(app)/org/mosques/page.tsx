"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useI18n } from "@/lib/i18n";

type Mosque = {
  id: string;
  name: string;
  address: string | null;
  city: string | null;
  country: string | null;
  capacity: number | null;
  khatib_count: number;
  active_khatib_count: number;
  created_at: string;
};

export default function MosquesPage() {
  const { t } = useI18n();

  const [mosques, setMosques] = useState<Mosque[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const [newCity, setNewCity] = useState("");
  const [newCountry, setNewCountry] = useState("");
  const [newCapacity, setNewCapacity] = useState("");
  const [adding, setAdding] = useState(false);

  const fetchMosques = useCallback(() => {
    fetch("/api/org/mosques")
      .then((r) => r.json())
      .then((d) => { if (Array.isArray(d)) setMosques(d); })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchMosques(); }, [fetchMosques]);

  const handleAdd = async () => {
    if (!newName.trim()) return;
    setAdding(true);
    const res = await fetch("/api/org/mosques", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: newName.trim(),
        city: newCity.trim() || undefined,
        country: newCountry.trim() || undefined,
        capacity: newCapacity ? parseInt(newCapacity) : undefined,
      }),
    });
    if (res.ok) {
      setNewName("");
      setNewCity("");
      setNewCountry("");
      setNewCapacity("");
      setShowAdd(false);
      fetchMosques();
    }
    setAdding(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t("org.deleteMosqueConfirm"))) return;
    await fetch(`/api/org/mosques/${id}`, { method: "DELETE" });
    fetchMosques();
  };

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
          <h1 className="text-xl font-bold text-ink">{t("org.mosques")}</h1>
          <p className="text-sm text-mute mt-0.5">{t("org.mosquesSub")}</p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-secondary transition-colors"
        >
          <span className="material-symbols-outlined text-lg">add</span>
          {t("org.addMosque")}
        </button>
      </div>

      {showAdd && (
        <div className="bg-white border border-line rounded-xl p-5 mb-4">
          <div className="flex flex-col gap-3">
            <div>
              <label className="text-xs font-semibold text-ink/50 block mb-1.5">{t("org.mosqueName")}</label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder={t("org.mosqueNamePlaceholder")}
                autoFocus
                className="w-full px-3 py-2 rounded-lg border border-line bg-white text-ink placeholder:text-ink/25 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 text-sm"
                onKeyDown={(e) => { if (e.key === "Enter") handleAdd(); }}
              />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-semibold text-ink/50 block mb-1.5">{t("org.mosqueCity")}</label>
                <input
                  type="text"
                  value={newCity}
                  onChange={(e) => setNewCity(e.target.value)}
                  placeholder={t("org.mosqueCity")}
                  className="w-full px-3 py-2 rounded-lg border border-line bg-white text-ink placeholder:text-ink/25 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-ink/50 block mb-1.5">{t("org.mosqueCountry")}</label>
                <input
                  type="text"
                  value={newCountry}
                  onChange={(e) => setNewCountry(e.target.value)}
                  placeholder={t("org.mosqueCountry")}
                  className="w-full px-3 py-2 rounded-lg border border-line bg-white text-ink placeholder:text-ink/25 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-ink/50 block mb-1.5">{t("org.mosqueCapacity")}</label>
                <input
                  type="number"
                  value={newCapacity}
                  onChange={(e) => setNewCapacity(e.target.value)}
                  placeholder={t("org.mosqueCapacityPlaceholder")}
                  className="w-full px-3 py-2 rounded-lg border border-line bg-white text-ink placeholder:text-ink/25 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 text-sm"
                />
              </div>
            </div>
            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={handleAdd}
                disabled={adding || !newName.trim()}
                className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-secondary transition-colors disabled:opacity-50"
              >
                {adding ? "..." : t("org.addMosque")}
              </button>
              <button
                onClick={() => { setShowAdd(false); setNewName(""); setNewCity(""); setNewCountry(""); setNewCapacity(""); }}
                className="px-3 py-2 rounded-lg text-sm text-mute hover:text-ink transition-colors"
              >
                {t("btn.cancel")}
              </button>
            </div>
          </div>
        </div>
      )}

      {mosques.length === 0 ? (
        <div className="text-center py-12">
          <span className="material-symbols-outlined text-4xl text-ink/15 mb-2">mosque</span>
          <p className="text-mute text-sm">{t("org.noMosques")}</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {mosques.map((m) => (
            <Link
              key={m.id}
              href={`/org/mosques/${m.id}`}
              className="bg-white border border-line rounded-xl p-5 hover:border-primary/30 transition-colors block"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                  <span className="material-symbols-outlined text-2xl">mosque</span>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-ink text-[15px] truncate">{m.name}</h3>
                  <p className="text-xs text-mute mt-0.5">
                    {[m.city, m.country].filter(Boolean).join(", ") || " "}
                    {m.capacity ? ` · ${m.capacity} capacity` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-4 shrink-0">
                  <div className="text-center">
                    <p className="text-lg font-bold text-ink">{Number(m.active_khatib_count)}</p>
                    <p className="text-[10px] text-mute font-semibold uppercase">{t("org.mosqueKhatibs")}</p>
                  </div>
                  <button
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDelete(m.id); }}
                    className="p-1.5 rounded-lg text-mute hover:text-red-500 hover:bg-red-50 transition-colors"
                  >
                    <span className="material-symbols-outlined text-lg">delete</span>
                  </button>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
