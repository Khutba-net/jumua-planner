"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface Stats {
  totalUsers: number;
  byPlan: { plan: string; count: number }[];
  totalOrgs: number;
  orgsByType: { type: string; count: number }[];
  totalSermons: number;
  sermonsByStatus: { status: string; count: number }[];
  totalMosques: number;
  recentUsers: { id: string; name: string; email: string; account_type: string; role: string; created_at: string; is_platform_admin: number }[];
  activeThisWeek: number;
  signupsThisWeek: number;
  subsByPlan: { plan: string; status: string; count: number }[];
  activeSubscriptions: number;
}

interface Institution {
  id: string;
  name: string;
  type: string;
  city: string | null;
  country: string | null;
  max_mosques: number | null;
  max_khatibs: number | null;
  custom_price_cents: number | null;
  billing_notes: string | null;
  billing_status: string;
  mosque_count: number;
  member_count: number;
  created_at: string;
}

interface InstitutionDetail extends Institution {
  mosques: { id: string; name: string; city: string | null; capacity: number | null }[];
  members: { id: string; user_id: string; role: string; name: string; email: string }[];
}

const planColors: Record<string, string> = {
  individual: "bg-emerald-100 text-emerald-700",
  organization: "bg-blue-100 text-blue-700",
  institution: "bg-violet-100 text-violet-700",
};

const statusColors: Record<string, string> = {
  active: "bg-green-100 text-green-700",
  trial: "bg-blue-100 text-blue-700",
  invoice_sent: "bg-yellow-100 text-yellow-700",
  past_due: "bg-red-100 text-red-700",
  cancelled: "bg-gray-100 text-gray-500",
  none: "bg-gray-100 text-gray-500",
};

export default function AdminPage() {
  const router = useRouter();
  const [tab, setTab] = useState<"overview" | "orgs" | "users">("overview");
  const [stats, setStats] = useState<Stats | null>(null);
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<InstitutionDetail | null>(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    max_mosques: "",
    max_khatibs: "",
    custom_price_cents: "",
    billing_notes: "",
    billing_status: "none",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/stats").then((r) => {
        if (r.status === 403) { router.push("/dashboard"); return null; }
        return r.json();
      }),
      fetch("/api/admin/institutions").then((r) => r.ok ? r.json() : null),
    ])
      .then(([s, i]) => {
        if (s) setStats(s);
        if (i) setInstitutions(i.institutions || []);
        setLoading(false);
      })
      .catch(() => { setError("Failed to load"); setLoading(false); });
  }, [router]);

  const loadDetail = async (id: string) => {
    const r = await fetch(`/api/admin/institutions/${id}`);
    if (!r.ok) return;
    const d = await r.json();
    const detail = { ...d.institution, mosques: d.mosques, members: d.members };
    setSelected(detail);
    setForm({
      max_mosques: detail.max_mosques?.toString() || "",
      max_khatibs: detail.max_khatibs?.toString() || "",
      custom_price_cents: detail.custom_price_cents?.toString() || "",
      billing_notes: detail.billing_notes || "",
      billing_status: detail.billing_status || "none",
    });
    setEditing(false);
  };

  const handleSave = async () => {
    if (!selected) return;
    setSaving(true);
    const r = await fetch(`/api/admin/institutions/${selected.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        max_mosques: form.max_mosques ? parseInt(form.max_mosques) : null,
        max_khatibs: form.max_khatibs ? parseInt(form.max_khatibs) : null,
        custom_price_cents: form.custom_price_cents ? parseInt(form.custom_price_cents) : null,
        billing_notes: form.billing_notes || null,
        billing_status: form.billing_status,
      }),
    });
    if (r.ok) {
      setEditing(false);
      loadDetail(selected.id);
      fetch("/api/admin/institutions").then((r) => r.json()).then((d) => setInstitutions(d.institutions || []));
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="p-6 md:p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 bg-line/40 rounded" />
          <div className="h-4 w-72 bg-line/40 rounded" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            {[1, 2, 3, 4].map((i) => <div key={i} className="h-24 bg-line/40 rounded" />)}
          </div>
        </div>
      </div>
    );
  }

  if (error) return <div className="p-8 text-red-500">{error}</div>;

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-6xl mx-auto">
      <div className="flex items-center gap-3 mb-1">
        <span className="material-symbols-outlined text-primary text-2xl">admin_panel_settings</span>
        <h1 className="text-2xl font-bold text-ink">Platform Admin</h1>
      </div>
      <p className="text-sm text-mute mb-6">Manage users, organizations, and billing</p>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-line mb-6">
        {(["overview", "orgs", "users"] as const).map((t) => (
          <button
            key={t}
            onClick={() => { setTab(t); setSelected(null); }}
            className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors capitalize ${
              tab === t ? "border-primary text-primary" : "border-transparent text-mute hover:text-ink"
            }`}
          >
            {t === "orgs" ? "Organizations" : t}
          </button>
        ))}
      </div>

      {/* OVERVIEW TAB */}
      {tab === "overview" && stats && (
        <div className="space-y-6">
          {/* Stat cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard icon="group" label="Total Users" value={stats.totalUsers} sub={`+${stats.signupsThisWeek} this week`} />
            <StatCard icon="domain" label="Organizations" value={stats.totalOrgs} sub={`${stats.totalMosques} mosques`} />
            <StatCard icon="description" label="Sermons" value={stats.totalSermons} />
            <StatCard icon="trending_up" label="Active This Week" value={stats.activeThisWeek} sub="unique authors" />
          </div>

          {/* Subscriptions */}
          <div className="border border-line p-5">
            <h3 className="text-xs font-bold text-mute tracking-[1.5px] uppercase mb-4">
              Subscriptions ({stats.activeSubscriptions} active)
            </h3>
            {stats.subsByPlan.length === 0 ? (
              <p className="text-sm text-mute">No subscriptions yet</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-line">
                      <th className="text-left py-2 pr-4 text-xs font-bold text-mute">Plan</th>
                      <th className="text-left py-2 pr-4 text-xs font-bold text-mute">Status</th>
                      <th className="text-right py-2 text-xs font-bold text-mute">Count</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.subsByPlan.map((s, i) => (
                      <tr key={i} className="border-b border-line/50">
                        <td className="py-2.5 pr-4">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${planColors[s.plan] || "bg-gray-100 text-gray-600"}`}>
                            {s.plan}
                          </span>
                        </td>
                        <td className="py-2.5 pr-4">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${
                            s.status === "active" ? "bg-green-100 text-green-700" :
                            s.status === "trialing" ? "bg-blue-100 text-blue-700" :
                            s.status === "canceled" ? "bg-red-100 text-red-700" :
                            "bg-gray-100 text-gray-600"
                          }`}>
                            {s.status}
                          </span>
                        </td>
                        <td className="py-2.5 text-right font-semibold text-ink">{s.count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Users by plan */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="border border-line p-5">
              <h3 className="text-xs font-bold text-mute tracking-[1.5px] uppercase mb-4">Users by Plan</h3>
              <div className="space-y-3">
                {stats.byPlan.map((p) => (
                  <div key={p.plan} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${planColors[p.plan] || "bg-gray-100 text-gray-600"}`}>
                        {p.plan}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-32 h-2 bg-line/40 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full"
                          style={{ width: `${Math.max(5, (p.count / stats.totalUsers) * 100)}%` }}
                        />
                      </div>
                      <span className="text-sm font-semibold text-ink w-8 text-right">{p.count}</span>
                    </div>
                  </div>
                ))}
                {stats.byPlan.length === 0 && <p className="text-sm text-mute">No users yet</p>}
              </div>
            </div>

            <div className="border border-line p-5">
              <h3 className="text-xs font-bold text-mute tracking-[1.5px] uppercase mb-4">Sermons by Status</h3>
              <div className="space-y-3">
                {stats.sermonsByStatus.map((s) => (
                  <div key={s.status} className="flex items-center justify-between">
                    <span className="text-sm text-ink capitalize">{s.status}</span>
                    <span className="text-sm font-semibold text-ink">{s.count}</span>
                  </div>
                ))}
                {stats.sermonsByStatus.length === 0 && <p className="text-sm text-mute">No sermons yet</p>}
              </div>
            </div>
          </div>

          {/* Recent signups */}
          <div className="border border-line p-5">
            <h3 className="text-xs font-bold text-mute tracking-[1.5px] uppercase mb-4">Recent Signups</h3>
            {stats.recentUsers.length === 0 ? (
              <p className="text-sm text-mute">No users yet</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-line">
                      <th className="text-left py-2 pr-4 text-xs font-bold text-mute">Name</th>
                      <th className="text-left py-2 pr-4 text-xs font-bold text-mute">Email</th>
                      <th className="text-left py-2 pr-4 text-xs font-bold text-mute">Plan</th>
                      <th className="text-left py-2 pr-4 text-xs font-bold text-mute">Role</th>
                      <th className="text-left py-2 text-xs font-bold text-mute">Joined</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.recentUsers.map((u) => (
                      <tr key={u.id} className="border-b border-line/50">
                        <td className="py-2.5 pr-4 font-medium text-ink">
                          {u.name}
                          {u.is_platform_admin === 1 && (
                            <span className="ml-1.5 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700">ADMIN</span>
                          )}
                        </td>
                        <td className="py-2.5 pr-4 text-mute">{u.email}</td>
                        <td className="py-2.5 pr-4">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${planColors[u.account_type] || "bg-gray-100 text-gray-600"}`}>
                            {u.account_type}
                          </span>
                        </td>
                        <td className="py-2.5 pr-4 text-mute capitalize">{u.role}</td>
                        <td className="py-2.5 text-mute">{new Date(u.created_at).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* USERS TAB */}
      {tab === "users" && stats && (
        <div className="border border-line p-5">
          <h3 className="text-xs font-bold text-mute tracking-[1.5px] uppercase mb-4">All Users ({stats.totalUsers})</h3>
          {stats.recentUsers.length === 0 ? (
            <p className="text-sm text-mute">No users yet</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-line">
                    <th className="text-left py-2 pr-4 text-xs font-bold text-mute">Name</th>
                    <th className="text-left py-2 pr-4 text-xs font-bold text-mute">Email</th>
                    <th className="text-left py-2 pr-4 text-xs font-bold text-mute">Plan</th>
                    <th className="text-left py-2 pr-4 text-xs font-bold text-mute">Role</th>
                    <th className="text-left py-2 text-xs font-bold text-mute">Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recentUsers.map((u) => (
                    <tr key={u.id} className="border-b border-line/50">
                      <td className="py-2.5 pr-4 font-medium text-ink">
                        {u.name}
                        {u.is_platform_admin === 1 && (
                          <span className="ml-1.5 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700">ADMIN</span>
                        )}
                      </td>
                      <td className="py-2.5 pr-4 text-mute">{u.email}</td>
                      <td className="py-2.5 pr-4">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${planColors[u.account_type] || "bg-gray-100 text-gray-600"}`}>
                          {u.account_type}
                        </span>
                      </td>
                      <td className="py-2.5 pr-4 text-mute capitalize">{u.role}</td>
                      <td className="py-2.5 text-mute">{new Date(u.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ORGS TAB */}
      {tab === "orgs" && (
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Org List */}
          <div className="lg:w-1/3">
            <h2 className="text-xs font-bold text-mute tracking-[1.5px] uppercase mb-3">
              Organizations ({institutions.length})
            </h2>
            {institutions.length === 0 ? (
              <div className="border border-line p-6 text-center">
                <span className="material-symbols-outlined text-mute text-3xl mb-2 block">domain</span>
                <p className="text-sm text-mute">No organizations yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {institutions.map((inst) => (
                  <button
                    key={inst.id}
                    onClick={() => loadDetail(inst.id)}
                    className={`w-full text-left p-4 border transition-colors ${
                      selected?.id === inst.id
                        ? "border-primary bg-primary/5"
                        : "border-line hover:border-primary/30"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-semibold text-ink truncate">{inst.name}</p>
                      <div className="flex items-center gap-1.5">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${planColors[inst.type] || "bg-gray-100 text-gray-500"}`}>
                          {inst.type}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${statusColors[inst.billing_status] || "bg-gray-100 text-gray-500"}`}>
                          {inst.billing_status}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-4 text-xs text-mute">
                      <span>{inst.mosque_count} mosques</span>
                      <span>{inst.member_count} members</span>
                    </div>
                    {inst.custom_price_cents != null && inst.custom_price_cents > 0 && (
                      <p className="text-xs text-primary mt-1">
                        ${(inst.custom_price_cents / 100).toFixed(2)}/mo
                      </p>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Detail Panel */}
          <div className="lg:w-2/3">
            {!selected ? (
              <div className="border border-dashed border-line p-12 text-center">
                <span className="material-symbols-outlined text-mute text-4xl mb-3 block">touch_app</span>
                <p className="text-sm text-mute">Select an organization to manage</p>
              </div>
            ) : (
              <div className="border border-line">
                {/* Header */}
                <div className="p-5 border-b border-line flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h2 className="text-lg font-bold text-ink">{selected.name}</h2>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${planColors[selected.type] || "bg-gray-100 text-gray-500"}`}>
                        {selected.type}
                      </span>
                    </div>
                    <p className="text-xs text-mute">
                      {selected.city}{selected.country ? `, ${selected.country}` : ""} · Created {new Date(selected.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <button
                    onClick={() => setEditing(!editing)}
                    className="text-sm font-semibold text-primary hover:underline"
                  >
                    {editing ? "Cancel" : "Edit"}
                  </button>
                </div>

                {/* Quotas & Billing */}
                <div className="p-5 border-b border-line">
                  <h3 className="text-xs font-bold text-mute tracking-[1.5px] uppercase mb-4">Quotas & Billing</h3>
                  {editing ? (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-semibold text-ink/50 block mb-1">Max Mosques</label>
                        <input
                          type="number"
                          value={form.max_mosques}
                          onChange={(e) => setForm({ ...form, max_mosques: e.target.value })}
                          placeholder="Unlimited"
                          className="w-full px-3 py-2 border border-line rounded text-sm focus:outline-none focus:border-primary"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-ink/50 block mb-1">Max Khatibs</label>
                        <input
                          type="number"
                          value={form.max_khatibs}
                          onChange={(e) => setForm({ ...form, max_khatibs: e.target.value })}
                          placeholder="Unlimited"
                          className="w-full px-3 py-2 border border-line rounded text-sm focus:outline-none focus:border-primary"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-ink/50 block mb-1">Custom Price (cents/mo)</label>
                        <input
                          type="number"
                          value={form.custom_price_cents}
                          onChange={(e) => setForm({ ...form, custom_price_cents: e.target.value })}
                          placeholder="e.g. 7500 = $75.00"
                          className="w-full px-3 py-2 border border-line rounded text-sm focus:outline-none focus:border-primary"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-ink/50 block mb-1">Billing Status</label>
                        <select
                          value={form.billing_status}
                          onChange={(e) => setForm({ ...form, billing_status: e.target.value })}
                          className="w-full px-3 py-2 border border-line rounded text-sm focus:outline-none focus:border-primary"
                        >
                          <option value="none">None</option>
                          <option value="trial">Trial</option>
                          <option value="active">Active</option>
                          <option value="invoice_sent">Invoice Sent</option>
                          <option value="past_due">Past Due</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </div>
                      <div className="col-span-2">
                        <label className="text-xs font-semibold text-ink/50 block mb-1">Billing Notes</label>
                        <textarea
                          value={form.billing_notes}
                          onChange={(e) => setForm({ ...form, billing_notes: e.target.value })}
                          placeholder="Agreement details, contact info, special terms..."
                          rows={3}
                          className="w-full px-3 py-2 border border-line rounded text-sm focus:outline-none focus:border-primary resize-none"
                        />
                      </div>
                      <div className="col-span-2 flex items-center gap-3">
                        <button
                          onClick={handleSave}
                          disabled={saving}
                          className="px-6 py-2 bg-primary text-white text-sm font-semibold rounded hover:bg-secondary transition-colors disabled:opacity-50"
                        >
                          {saving ? "Saving..." : "Save Changes"}
                        </button>
                        <button
                          onClick={async () => {
                            if (!confirm("This will create a Stripe subscription and send an invoice to the org admin. Continue?")) return;
                            setSaving(true);
                            try {
                              const res = await fetch(`/api/admin/institutions/${selected!.id}`, {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ action: "create_stripe_subscription" }),
                              });
                              const data = await res.json();
                              if (res.ok) {
                                alert("Stripe subscription created! Invoice sent to org admin.");
                                const detail = await fetch(`/api/admin/institutions/${selected!.id}`).then(r => r.json());
                                setSelected({ ...detail.institution, mosques: detail.mosques, members: detail.members });
                              } else {
                                alert(data.error || "Failed");
                              }
                            } catch { alert("Failed to create subscription"); }
                            setSaving(false);
                          }}
                          disabled={saving || !selected?.custom_price_cents}
                          className="px-6 py-2 bg-accent-gold text-white text-sm font-semibold rounded hover:opacity-90 transition-colors disabled:opacity-50"
                          title={!selected?.custom_price_cents ? "Set a custom price first" : ""}
                        >
                          Activate via Stripe
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-xs text-mute mb-1">Max Mosques</p>
                        <p className="text-sm font-semibold text-ink">{selected.max_mosques || "Unlimited"}</p>
                      </div>
                      <div>
                        <p className="text-xs text-mute mb-1">Max Khatibs</p>
                        <p className="text-sm font-semibold text-ink">{selected.max_khatibs || "Unlimited"}</p>
                      </div>
                      <div>
                        <p className="text-xs text-mute mb-1">Custom Price</p>
                        <p className="text-sm font-semibold text-ink">
                          {selected.custom_price_cents
                            ? `$${(selected.custom_price_cents / 100).toFixed(2)}/mo`
                            : "Not set"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-mute mb-1">Status</p>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${statusColors[selected.billing_status] || "bg-gray-100 text-gray-500"}`}>
                          {selected.billing_status}
                        </span>
                      </div>
                      {selected.billing_notes && (
                        <div className="col-span-2 md:col-span-4">
                          <p className="text-xs text-mute mb-1">Notes</p>
                          <p className="text-sm text-ink whitespace-pre-wrap">{selected.billing_notes}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Mosques */}
                <div className="p-5 border-b border-line">
                  <h3 className="text-xs font-bold text-mute tracking-[1.5px] uppercase mb-3">
                    Mosques ({selected.mosques?.length || 0}
                    {selected.max_mosques ? ` / ${selected.max_mosques}` : ""})
                  </h3>
                  {selected.mosques?.length ? (
                    <div className="space-y-2">
                      {selected.mosques.map((m) => (
                        <div key={m.id} className="flex items-center gap-3 px-3 py-2 bg-surface rounded">
                          <span className="material-symbols-outlined text-primary text-lg">mosque</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-ink truncate">{m.name}</p>
                            <p className="text-xs text-mute">{m.city || "No city"}{m.capacity ? ` · Capacity: ${m.capacity}` : ""}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-mute">No mosques added yet</p>
                  )}
                </div>

                {/* Members */}
                <div className="p-5">
                  <h3 className="text-xs font-bold text-mute tracking-[1.5px] uppercase mb-3">
                    Members ({selected.members?.length || 0}
                    {selected.max_khatibs ? ` / ${selected.max_khatibs}` : ""})
                  </h3>
                  {selected.members?.length ? (
                    <div className="space-y-2">
                      {selected.members.map((m) => (
                        <div key={m.id} className="flex items-center gap-3 px-3 py-2 bg-surface rounded">
                          <span className="material-symbols-outlined text-primary text-lg">person</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-ink truncate">{m.name}</p>
                            <p className="text-xs text-mute">{m.email} · {m.role}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-mute">No members yet</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon, label, value, sub }: { icon: string; label: string; value: number; sub?: string }) {
  return (
    <div className="border border-line p-4">
      <div className="flex items-center gap-2 mb-2">
        <span className="material-symbols-outlined text-primary text-lg">{icon}</span>
        <p className="text-xs font-semibold text-mute uppercase tracking-wider">{label}</p>
      </div>
      <p className="text-2xl font-bold text-ink">{value}</p>
      {sub && <p className="text-xs text-mute mt-1">{sub}</p>}
    </div>
  );
}
