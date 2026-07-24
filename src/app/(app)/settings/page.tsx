"use client";

import { useEffect, useState, useRef } from "react";

interface UserData {
  id: string;
  name: string;
  email: string;
  account_type: string;
  avatar_url: string | null;
  bio: string | null;
  phone: string | null;
}

interface SettingsData {
  user_id: string;
  default_language: string;
  word_target: number;
  theme_mode: string;
  editor_font_size: number;
  friday_reminder: string;
  email_assigned: number;
  weekly_digest: number;
}

const languageModes = [
  { value: "ar-first", label: "Arabic first" },
  { value: "en-first", label: "English first" },
  { value: "ar-only", label: "Arabic only" },
  { value: "en-only", label: "English only" },
];

const reminderOptions = [
  { value: "1", label: "1 day before" },
  { value: "2", label: "2 days before" },
  { value: "3", label: "3 days before" },
  { value: "5", label: "5 days before" },
  { value: "7", label: "1 week before" },
];

const navSections = [
  { id: "profile", label: "Profile", icon: "person" },
  { id: "sermon", label: "Sermon Defaults", icon: "edit_note" },
  { id: "notifications", label: "Notifications", icon: "notifications" },
  { id: "appearance", label: "Appearance", icon: "palette" },
  { id: "subscription", label: "Subscription", icon: "credit_card" },
  { id: "organization", label: "Organization", icon: "groups" },
  { id: "account", label: "Account", icon: "manage_accounts" },
];

function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse bg-line/40 ${className}`} />;
}

function SettingsSkeleton() {
  return (
    <div className="flex h-full">
      <div className="hidden md:block w-56 border-r border-line p-4 shrink-0">
        <Skeleton className="h-8 w-28 mb-6" />
        <Skeleton className="h-px w-full mb-4" />
        <Skeleton className="h-4 w-16 mb-4" />
        <div className="space-y-2">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-9 w-full" />
          ))}
        </div>
      </div>
      <div className="flex-1 p-4 sm:p-6 lg:p-8 max-w-2xl">
        <Skeleton className="h-7 w-32 mb-2" />
        <Skeleton className="h-4 w-48 mb-8" />
        <div className="flex items-center gap-5 mb-8">
          <Skeleton className="w-20 h-20" />
          <div>
            <Skeleton className="h-4 w-24 mb-2" />
            <Skeleton className="h-3 w-16" />
          </div>
        </div>
        <div className="space-y-5">
          <div>
            <Skeleton className="h-3 w-20 mb-2" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div>
            <Skeleton className="h-3 w-14 mb-2" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div>
            <Skeleton className="h-3 w-24 mb-2" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
        <Skeleton className="h-10 w-32 mt-6" />
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const [user, setUser] = useState<UserData | null>(null);
  const [settings, setSettings] = useState<SettingsData | null>(null);
  const [activeSection, setActiveSection] = useState("profile");
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const [defaultLanguage, setDefaultLanguage] = useState("ar-first");
  const [wordTarget, setWordTarget] = useState(2500);

  const [fridayReminder, setFridayReminder] = useState("3");
  const [emailAssigned, setEmailAssigned] = useState(true);
  const [weeklyDigest, setWeeklyDigest] = useState(true);

  const [themeMode, setThemeMode] = useState("light");
  const [editorFontSize, setEditorFontSize] = useState("16");

  const [masjidName, setMasjidName] = useState("");
  const [masjidCity, setMasjidCity] = useState("");

  const [nameError, setNameError] = useState("");
  const [emailError, setEmailError] = useState("");

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => {
        if (!r.ok) throw new Error("Failed to load");
        return r.json();
      })
      .then((data) => {
        const u = data.user as UserData;
        const s = data.settings as SettingsData;
        setUser(u);
        setSettings(s);
        setName(u.name);
        setEmail(u.email);
        setAvatarUrl(u.avatar_url);
        setDefaultLanguage(s.default_language);
        setWordTarget(s.word_target);
        setFridayReminder(s.friday_reminder);
        setEmailAssigned(!!s.email_assigned);
        setWeeklyDigest(!!s.weekly_digest);
        setThemeMode(s.theme_mode);
        setEditorFontSize(String(s.editor_font_size));
        setLoading(false);
      })
      .catch(() => {
        setError(true);
        setLoading(false);
      });
  }, []);

  function showToast(message: string, type: "success" | "error" = "success") {
    setToast({ message, type });
    setTimeout(() => setToast(null), 2500);
  }

  async function saveSection(section: string, body: Record<string, unknown>) {
    setSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ section, ...body }),
      });
      if (!res.ok) throw new Error("Save failed");
      if (section === "appearance") {
        localStorage.setItem("jp_theme", body.theme_mode as string);
        localStorage.setItem("jp_editor_font", String(body.editor_font_size));
        applyTheme(body.theme_mode as string);
      }
      if (section === "profile") {
        updateSidebarAvatar(avatarUrl, body.name as string);
      }
      showToast("Settings saved");
    } catch {
      showToast("Failed to save. Please try again.", "error");
    }
    setSaving(false);
  }

  function applyTheme(mode: string) {
    const root = document.documentElement;
    if (mode === "dark" || (mode === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches)) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }

  function updateSidebarAvatar(url: string | null, userName: string) {
    const sidebarAvatar = document.querySelector("[data-sidebar-avatar]");
    if (sidebarAvatar) {
      if (url) {
        sidebarAvatar.innerHTML = `<img src="${url}" alt="${userName}" class="w-8 h-8 object-cover rounded-full" />`;
      } else {
        sidebarAvatar.textContent = userName?.[0] ?? "?";
      }
    }
    const sidebarName = document.querySelector("[data-sidebar-name]");
    if (sidebarName) sidebarName.textContent = userName;
  }

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      showToast("Image must be under 5MB", "error");
      return;
    }
    if (!file.type.startsWith("image/")) {
      showToast("Please upload an image file", "error");
      return;
    }
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("avatar", file);
      const res = await fetch("/api/settings/avatar", { method: "POST", body: formData });
      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();
      if (data.avatar_url) {
        const newUrl = data.avatar_url + "?t=" + Date.now();
        setAvatarUrl(newUrl);
        updateSidebarAvatar(newUrl, name);
        showToast("Photo updated");
      }
    } catch {
      showToast("Failed to upload photo", "error");
    }
    setUploading(false);
  }

  function validateProfile(): boolean {
    let valid = true;
    setNameError("");
    setEmailError("");
    if (!name.trim()) {
      setNameError("Name is required");
      valid = false;
    }
    if (!email.trim()) {
      setEmailError("Email is required");
      valid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError("Enter a valid email address");
      valid = false;
    }
    return valid;
  }

  function handleProfileSave() {
    if (!validateProfile()) return;
    saveSection("profile", { name: name.trim(), email: email.trim() });
  }

  const isOrg = user?.account_type === "organization" || user?.account_type === "institution";

  if (loading) return <SettingsSkeleton />;

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-mute gap-3">
        <span className="material-symbols-outlined text-3xl text-red-400">error</span>
        <p className="text-sm">Failed to load settings</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-primary text-white text-sm font-semibold hover:bg-secondary transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-full">
      {/* Section nav */}
      <div className="hidden md:block w-56 border-r border-line p-4 shrink-0">
        <button
          onClick={() => window.location.href = "/dashboard"}
          className="flex items-center gap-2 px-3 py-2 mb-3 text-sm text-mute hover:text-primary transition-colors w-full text-left"
        >
          <span className="material-symbols-outlined text-base">arrow_back</span>
          Back to app
        </button>
        <div className="h-px bg-line mb-3" />
        <p className="text-[9px] font-bold text-mute tracking-[2px] uppercase mb-4 px-3">Settings</p>
        <nav className="flex flex-col gap-0.5">
          {navSections
            .filter((s) => s.id !== "organization" || isOrg)
            .map((s) => (
              <button
                key={s.id}
                onClick={() => setActiveSection(s.id)}
                className={`flex items-center gap-2.5 px-3 py-2 text-sm font-medium transition-colors text-left ${
                  activeSection === s.id
                    ? "bg-primary/10 text-primary"
                    : "text-mute hover:bg-surface hover:text-ink"
                }`}
              >
                <span className="material-symbols-outlined text-lg">{s.icon}</span>
                {s.label}
              </button>
            ))}
        </nav>
      </div>

      {/* Content */}
      <div className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto max-w-2xl">
        {/* Mobile back + section selector */}
        <div className="md:hidden mb-4">
          <button
            onClick={() => window.location.href = "/dashboard"}
            className="flex items-center gap-1.5 text-sm text-mute hover:text-primary transition-colors mb-3"
          >
            <span className="material-symbols-outlined text-base">arrow_back</span>
            Back to app
          </button>
        </div>
        <div className="md:hidden mb-6">
          <select
            value={activeSection}
            onChange={(e) => setActiveSection(e.target.value)}
            className="w-full border border-line px-3 py-2 text-sm bg-white"
          >
            {navSections
              .filter((s) => s.id !== "organization" || isOrg)
              .map((s) => (
                <option key={s.id} value={s.id}>{s.label}</option>
              ))}
          </select>
        </div>

        {/* Toast */}
        {toast && (
          <div className={`fixed top-4 right-4 z-50 text-white text-sm font-medium px-4 py-2.5 shadow-lg flex items-center gap-2 transition-all ${
            toast.type === "error" ? "bg-red-500" : "bg-primary"
          }`}>
            <span className="material-symbols-outlined text-base">
              {toast.type === "error" ? "error" : "check_circle"}
            </span>
            {toast.message}
          </div>
        )}

        {/* Profile */}
        {activeSection === "profile" && (
          <div>
            <h2 className="text-xl font-bold text-ink mb-1">Profile</h2>
            <p className="text-sm text-mute mb-6">Your personal information</p>

            <div className="flex items-center gap-5 mb-8">
              <div className="relative group">
                {avatarUrl ? (
                  <img src={avatarUrl} alt={name} className="w-20 h-20 object-cover" />
                ) : (
                  <div className="w-20 h-20 bg-primary/20 flex items-center justify-center text-primary text-3xl font-bold">
                    {name?.[0] ?? "?"}
                  </div>
                )}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer disabled:cursor-wait"
                >
                  <span className="material-symbols-outlined text-white text-xl">
                    {uploading ? "hourglass_top" : "photo_camera"}
                  </span>
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={handleAvatarUpload}
                  className="hidden"
                />
              </div>
              <div>
                <p className="text-sm font-semibold text-ink">{name || "—"}</p>
                <p className="text-xs text-mute capitalize">{user?.account_type ?? ""}</p>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="text-xs text-primary font-semibold mt-1 hover:underline disabled:opacity-50"
                >
                  {uploading ? "Uploading..." : avatarUrl ? "Change photo" : "Upload photo"}
                </button>
              </div>
            </div>

            <div className="space-y-5">
              <div>
                <label className="text-[10px] font-bold text-mute tracking-[1.5px] uppercase block mb-1.5">Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => { setName(e.target.value); setNameError(""); }}
                  className={`w-full border px-4 py-2.5 text-sm bg-white focus:outline-none focus:border-primary ${
                    nameError ? "border-red-400" : "border-line"
                  }`}
                />
                {nameError && <p className="text-xs text-red-500 mt-1">{nameError}</p>}
              </div>
              <div>
                <label className="text-[10px] font-bold text-mute tracking-[1.5px] uppercase block mb-1.5">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setEmailError(""); }}
                  className={`w-full border px-4 py-2.5 text-sm bg-white focus:outline-none focus:border-primary ${
                    emailError ? "border-red-400" : "border-line"
                  }`}
                />
                {emailError && <p className="text-xs text-red-500 mt-1">{emailError}</p>}
              </div>
              <div>
                <label className="text-[10px] font-bold text-mute tracking-[1.5px] uppercase block mb-1.5">Account Type</label>
                <p className="text-sm text-ink capitalize px-4 py-2.5 bg-surface border border-line">{user?.account_type ?? "—"}</p>
              </div>
            </div>

            <button
              onClick={handleProfileSave}
              disabled={saving}
              className="mt-6 px-6 py-2.5 bg-primary text-white text-sm font-semibold hover:bg-secondary transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {saving && <span className="material-symbols-outlined text-base animate-spin">progress_activity</span>}
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        )}

        {/* Sermon Defaults */}
        {activeSection === "sermon" && (
          <div>
            <h2 className="text-xl font-bold text-ink mb-1">Sermon Defaults</h2>
            <p className="text-sm text-mute mb-6">Default settings for new sermons</p>

            <div className="space-y-5">
              <div>
                <label className="text-[10px] font-bold text-mute tracking-[1.5px] uppercase block mb-1.5">Default Language Mode</label>
                <div className="grid grid-cols-2 gap-2">
                  {languageModes.map((mode) => (
                    <button
                      key={mode.value}
                      onClick={() => setDefaultLanguage(mode.value)}
                      className={`px-4 py-2.5 text-sm font-medium border transition-colors ${
                        defaultLanguage === mode.value
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-line bg-white text-mute hover:text-ink"
                      }`}
                    >
                      {mode.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-mute tracking-[1.5px] uppercase block mb-1.5">Default Word Target</label>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min="500"
                    max="5000"
                    step="100"
                    value={wordTarget}
                    onChange={(e) => setWordTarget(Number(e.target.value))}
                    className="flex-1 accent-primary"
                  />
                  <span className="text-sm font-semibold text-ink w-16 text-right">{wordTarget.toLocaleString()}</span>
                </div>
                <p className="text-xs text-mute mt-1">Recommended: 2,000–3,000 words for a 20–30 min khutbah</p>
              </div>

              <div>
                <label className="text-[10px] font-bold text-mute tracking-[1.5px] uppercase block mb-1.5">Default Status Flow</label>
                <div className="flex items-center gap-2 text-sm text-mute">
                  <span className="px-2.5 py-1 bg-surface border border-line text-xs font-bold">DRAFT</span>
                  <span className="material-symbols-outlined text-base">arrow_forward</span>
                  <span className="px-2.5 py-1 bg-accent-gold/10 text-accent-gold text-xs font-bold">PLANNED</span>
                  <span className="material-symbols-outlined text-base">arrow_forward</span>
                  <span className="px-2.5 py-1 bg-green-50 text-green-700 text-xs font-bold">READY</span>
                  <span className="material-symbols-outlined text-base">arrow_forward</span>
                  <span className="px-2.5 py-1 bg-primary/10 text-primary text-xs font-bold">DELIVERED</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => saveSection("sermon", { default_language: defaultLanguage, word_target: wordTarget })}
              disabled={saving}
              className="mt-6 px-6 py-2.5 bg-primary text-white text-sm font-semibold hover:bg-secondary transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {saving && <span className="material-symbols-outlined text-base animate-spin">progress_activity</span>}
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        )}

        {/* Notifications */}
        {activeSection === "notifications" && (
          <div>
            <h2 className="text-xl font-bold text-ink mb-1">Notifications</h2>
            <p className="text-sm text-mute mb-6">How and when you get reminded</p>

            <div className="space-y-6">
              <div>
                <label className="text-[10px] font-bold text-mute tracking-[1.5px] uppercase block mb-1.5">Friday Reminder</label>
                <p className="text-xs text-mute mb-2">Get reminded before Jumu&apos;ah to finalize your khutbah</p>
                <div className="flex flex-wrap gap-2">
                  {reminderOptions.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setFridayReminder(opt.value)}
                      className={`px-4 py-2 text-sm font-medium border transition-colors ${
                        fridayReminder === opt.value
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-line bg-white text-mute hover:text-ink"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-bold text-mute tracking-[1.5px] uppercase block">Email Notifications</label>

                <div className="flex items-center justify-between py-3 border-b border-line">
                  <div>
                    <p className="text-sm text-ink font-medium">Sermon assigned to you</p>
                    <p className="text-xs text-mute">Get notified when a moderator assigns you a Friday</p>
                  </div>
                  <button
                    onClick={() => setEmailAssigned(!emailAssigned)}
                    className={`w-10 h-6 flex items-center px-0.5 transition-colors ${emailAssigned ? "bg-primary" : "bg-line"}`}
                  >
                    <div className={`w-5 h-5 bg-white shadow transition-transform ${emailAssigned ? "translate-x-4" : "translate-x-0"}`} />
                  </button>
                </div>

                <div className="flex items-center justify-between py-3 border-b border-line">
                  <div>
                    <p className="text-sm text-ink font-medium">Weekly prep digest</p>
                    <p className="text-xs text-mute">Summary of upcoming sermons every Monday morning</p>
                  </div>
                  <button
                    onClick={() => setWeeklyDigest(!weeklyDigest)}
                    className={`w-10 h-6 flex items-center px-0.5 transition-colors ${weeklyDigest ? "bg-primary" : "bg-line"}`}
                  >
                    <div className={`w-5 h-5 bg-white shadow transition-transform ${weeklyDigest ? "translate-x-4" : "translate-x-0"}`} />
                  </button>
                </div>
              </div>
            </div>

            <button
              onClick={() => saveSection("notifications", { friday_reminder: fridayReminder, email_assigned: emailAssigned, weekly_digest: weeklyDigest })}
              disabled={saving}
              className="mt-6 px-6 py-2.5 bg-primary text-white text-sm font-semibold hover:bg-secondary transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {saving && <span className="material-symbols-outlined text-base animate-spin">progress_activity</span>}
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        )}

        {/* Appearance */}
        {activeSection === "appearance" && (
          <div>
            <h2 className="text-xl font-bold text-ink mb-1">Appearance</h2>
            <p className="text-sm text-mute mb-6">Customize the look and feel</p>

            <div className="space-y-6">
              <div>
                <label className="text-[10px] font-bold text-mute tracking-[1.5px] uppercase block mb-3">Theme</label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { value: "light", label: "Light", icon: "light_mode" },
                    { value: "dark", label: "Dark", icon: "dark_mode" },
                    { value: "system", label: "System", icon: "settings_brightness" },
                  ].map((t) => (
                    <button
                      key={t.value}
                      onClick={() => { setThemeMode(t.value); applyTheme(t.value); localStorage.setItem("jp_theme", t.value); saveSection("appearance", { theme_mode: t.value, editor_font_size: Number(editorFontSize) }); }}
                      className={`flex flex-col items-center gap-2 p-4 border transition-colors ${
                        themeMode === t.value
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-line bg-white text-mute hover:text-ink"
                      }`}
                    >
                      <span className="material-symbols-outlined text-2xl">{t.icon}</span>
                      <span className="text-sm font-medium">{t.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-mute tracking-[1.5px] uppercase block mb-1.5">Editor Font Size</label>
                <div className="flex items-center gap-3">
                  {["14", "16", "18", "20"].map((size) => (
                    <button
                      key={size}
                      onClick={() => { setEditorFontSize(size); localStorage.setItem("jp_editor_font", size); saveSection("appearance", { theme_mode: themeMode, editor_font_size: Number(size) }); }}
                      className={`w-12 h-10 border text-sm font-medium transition-colors ${
                        editorFontSize === size
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-line bg-white text-mute hover:text-ink"
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                  <span className="text-xs text-mute">px</span>
                </div>
                <div className="mt-3 border border-line p-4 bg-surface">
                  <p className="text-[10px] font-bold text-mute tracking-[1.5px] uppercase mb-2">Preview</p>
                  <p style={{ fontSize: `${editorFontSize}px` }} className="font-[var(--font-arabic)] text-ink text-right" dir="rtl">بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ</p>
                  <p style={{ fontSize: `${Number(editorFontSize) - 2}px` }} className="text-mute italic mt-1">In the name of Allah, the Most Gracious, the Most Merciful.</p>
                </div>
              </div>
            </div>

            <p className="mt-4 text-xs text-mute flex items-center gap-1.5">
              <span className="material-symbols-outlined text-primary text-sm">check_circle</span>
              Changes apply instantly and are saved automatically
            </p>
          </div>
        )}

        {/* Subscription */}
        {activeSection === "subscription" && (
          <div>
            <h2 className="text-xl font-bold text-ink mb-1">Subscription</h2>
            <p className="text-sm text-mute mb-6">Manage your plan and billing</p>

            <div className="border-2 border-primary/20 p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-[10px] font-bold text-mute tracking-[1.5px] uppercase">Current Plan</p>
                  <p className="text-xl font-bold text-primary mt-1">{isOrg ? "Organization" : "Individual"}</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-ink">{isOrg ? "$49" : "$9"}<span className="text-sm font-normal text-mute">/mo</span></p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs text-mute">
                <span className="material-symbols-outlined text-primary text-sm">check_circle</span>
                Active — renews Aug 21, 2026
              </div>
            </div>

            <div className="mb-6">
              <p className="text-[10px] font-bold text-mute tracking-[1.5px] uppercase mb-3">Plan Includes</p>
              <ul className="space-y-2">
                <li className="flex items-center gap-2 text-sm text-ink"><span className="material-symbols-outlined text-primary text-base">check</span> Arabic + English sermon editor</li>
                <li className="flex items-center gap-2 text-sm text-ink"><span className="material-symbols-outlined text-primary text-base">check</span> Annual theme planner</li>
                <li className="flex items-center gap-2 text-sm text-ink"><span className="material-symbols-outlined text-primary text-base">check</span> Jumu&apos;ah calendar</li>
                <li className="flex items-center gap-2 text-sm text-ink"><span className="material-symbols-outlined text-primary text-base">check</span> Export to PDF &amp; Word</li>
                {isOrg && (
                  <>
                    <li className="flex items-center gap-2 text-sm text-ink"><span className="material-symbols-outlined text-accent-gold text-base">check</span> Up to 20 khatib accounts</li>
                    <li className="flex items-center gap-2 text-sm text-ink"><span className="material-symbols-outlined text-accent-gold text-base">check</span> Moderator review tools</li>
                    <li className="flex items-center gap-2 text-sm text-ink"><span className="material-symbols-outlined text-accent-gold text-base">check</span> Shared khutbah bank</li>
                  </>
                )}
              </ul>
            </div>

            {!isOrg && (
              <div className="bg-accent-gold/5 border border-accent-gold/20 p-5 mb-6">
                <div className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-accent-gold text-xl mt-0.5">upgrade</span>
                  <div>
                    <p className="text-sm font-semibold text-ink">Upgrade to Organization</p>
                    <p className="text-xs text-mute mt-1">Get multi-khatib management, shared sermon bank, and moderator tools for your masjid.</p>
                    <button className="mt-3 px-5 py-2 bg-primary text-white text-sm font-semibold hover:bg-secondary transition-colors">
                      Upgrade — $49/mo
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div>
              <p className="text-[10px] font-bold text-mute tracking-[1.5px] uppercase mb-3">Billing</p>
              <div className="space-y-3">
                <div className="flex items-center justify-between py-3 border-b border-line">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-mute text-lg">credit_card</span>
                    <div>
                      <p className="text-sm text-ink font-medium">Visa ending in 4242</p>
                      <p className="text-xs text-mute">Expires 12/2027</p>
                    </div>
                  </div>
                  <button className="text-xs text-primary font-semibold hover:underline">Update</button>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-line">
                  <p className="text-sm text-ink">View invoices</p>
                  <button className="text-xs text-primary font-semibold hover:underline">View all</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Organization */}
        {activeSection === "organization" && isOrg && (
          <div>
            <h2 className="text-xl font-bold text-ink mb-1">Organization</h2>
            <p className="text-sm text-mute mb-6">Manage your masjid and team</p>

            <div className="space-y-5 mb-8">
              <div>
                <label className="text-[10px] font-bold text-mute tracking-[1.5px] uppercase block mb-1.5">Masjid / Organization Name</label>
                <input type="text" value={masjidName} onChange={(e) => setMasjidName(e.target.value)} placeholder="e.g. Islamic Centre of Calgary" className="w-full border border-line px-4 py-2.5 text-sm bg-white focus:outline-none focus:border-primary" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-mute tracking-[1.5px] uppercase block mb-1.5">City</label>
                <input type="text" value={masjidCity} onChange={(e) => setMasjidCity(e.target.value)} placeholder="e.g. Calgary, AB" className="w-full border border-line px-4 py-2.5 text-sm bg-white focus:outline-none focus:border-primary" />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-4">
                <p className="text-[10px] font-bold text-mute tracking-[1.5px] uppercase">Team Members</p>
                <button className="px-4 py-1.5 bg-primary text-white text-xs font-semibold hover:bg-secondary transition-colors">+ Invite Khatib</button>
              </div>
              <div className="border border-line divide-y divide-line">
                {[
                  { name: "Ahmed Hassan", role: "Admin", email: "ahmed@example.com" },
                  { name: "Yusuf Ali", role: "Khatib", email: "yusuf@example.com" },
                  { name: "Omar Farooq", role: "Khatib", email: "omar@example.com" },
                ].map((member) => (
                  <div key={member.email} className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-primary/20 flex items-center justify-center text-primary text-sm font-bold">{member.name[0]}</div>
                      <div>
                        <p className="text-sm font-medium text-ink">{member.name}</p>
                        <p className="text-xs text-mute">{member.email}</p>
                      </div>
                    </div>
                    <span className={`text-[10px] font-bold px-2.5 py-1 ${member.role === "Admin" ? "bg-primary/10 text-primary" : "bg-surface text-mute"}`}>{member.role.toUpperCase()}</span>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={() => saveSection("profile", { name, email })}
              disabled={saving}
              className="mt-6 px-6 py-2.5 bg-primary text-white text-sm font-semibold hover:bg-secondary transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {saving && <span className="material-symbols-outlined text-base animate-spin">progress_activity</span>}
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        )}

        {/* Account */}
        {activeSection === "account" && (
          <div>
            <h2 className="text-xl font-bold text-ink mb-1">Account</h2>
            <p className="text-sm text-mute mb-6">Security and data management</p>

            <div className="space-y-6">
              <div>
                <p className="text-[10px] font-bold text-mute tracking-[1.5px] uppercase mb-3">Change Password</p>
                <div className="space-y-3">
                  <input type="password" placeholder="Current password" className="w-full border border-line px-4 py-2.5 text-sm bg-white focus:outline-none focus:border-primary" />
                  <input type="password" placeholder="New password" className="w-full border border-line px-4 py-2.5 text-sm bg-white focus:outline-none focus:border-primary" />
                  <input type="password" placeholder="Confirm new password" className="w-full border border-line px-4 py-2.5 text-sm bg-white focus:outline-none focus:border-primary" />
                </div>
                <button className="mt-3 px-6 py-2.5 bg-primary text-white text-sm font-semibold hover:bg-secondary transition-colors">Update Password</button>
              </div>

              <div className="border-t border-line pt-6">
                <p className="text-[10px] font-bold text-mute tracking-[1.5px] uppercase mb-2">Export Your Data</p>
                <p className="text-xs text-mute mb-3">Download all your sermons, themes, and settings as a JSON file.</p>
                <button className="px-5 py-2 border border-line bg-white text-ink text-sm font-medium hover:bg-surface transition-colors flex items-center gap-2">
                  <span className="material-symbols-outlined text-base">download</span>
                  Export All Data
                </button>
              </div>

              <div className="border-t border-line pt-6">
                <p className="text-[10px] font-bold text-red-600 tracking-[1.5px] uppercase mb-2">Danger Zone</p>
                <p className="text-xs text-mute mb-3">Permanently delete your account and all associated data. This action cannot be undone.</p>
                <button className="px-5 py-2 border border-red-300 bg-white text-red-600 text-sm font-medium hover:bg-red-50 transition-colors">Delete Account</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
