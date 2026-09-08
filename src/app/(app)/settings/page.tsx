"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/lib/i18n";

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
  const router = useRouter();
  const { t, isAr } = useI18n();

  const languageModes = [
    { value: "ar-first", label: t("lang.arFirst") },
    { value: "en-first", label: t("lang.enFirst") },
    { value: "ar-only", label: t("lang.arOnly") },
    { value: "en-only", label: t("lang.enOnly") },
  ];

  const reminderOptions = [
    { value: "1", label: t("reminder.1") },
    { value: "2", label: t("reminder.2") },
    { value: "3", label: t("reminder.3") },
    { value: "5", label: t("reminder.5") },
    { value: "7", label: t("reminder.7") },
  ];

  const navSections = [
    { id: "profile", label: t("settings.profile"), icon: "person" },
    { id: "sermon", label: t("settings.sermonDefaults"), icon: "edit_note" },
    { id: "notifications", label: t("settings.notifications"), icon: "notifications" },
    { id: "appearance", label: t("settings.appearance"), icon: "palette" },
    { id: "subscription", label: t("settings.subscription"), icon: "credit_card" },
    { id: "organization", label: t("settings.organization"), icon: "groups" },
    { id: "account", label: t("settings.account"), icon: "manage_accounts" },
  ];

  const [user, setUser] = useState<UserData | null>(null);
  const [settings, setSettings] = useState<SettingsData | null>(null);
  const [activeSection, setActiveSection] = useState("profile");
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [deleting, setDeleting] = useState(false);
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

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

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
      showToast(t("settings.settingsSaved"));
    } catch {
      showToast(t("settings.saveFailed"), "error");
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
        sidebarAvatar.textContent = "";
        const img = document.createElement("img");
        img.src = url;
        img.alt = userName;
        img.className = "w-8 h-8 object-cover rounded-full";
        sidebarAvatar.appendChild(img);
      } else {
        sidebarAvatar.textContent = userName?.[0] ?? "?";
      }
    }
    const sidebarName = document.querySelector("[data-sidebar-name]");
    if (sidebarName) sidebarName.textContent = userName;
  }

  async function handleDeleteAccount() {
    if (!confirm(isAr
      ? "هل أنت متأكد أنك تريد حذف حسابك؟ سيتم حذف جميع خطبك ومواضيعك وبياناتك نهائياً. لا يمكن التراجع عن هذا الإجراء."
      : "Are you sure you want to delete your account? All your sermons, themes, and data will be permanently deleted. This cannot be undone."
    )) return;
    setDeleting(true);
    try {
      const res = await fetch("/api/auth/delete-account", { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");
      router.push("/");
    } catch {
      showToast(isAr ? "فشل حذف الحساب" : "Failed to delete account", "error");
      setDeleting(false);
    }
  }

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      showToast(isAr ? "يجب أن تكون الصورة أقل من 5 ميغابايت" : "Image must be under 5MB", "error");
      return;
    }
    if (!file.type.startsWith("image/")) {
      showToast(isAr ? "يرجى رفع ملف صورة" : "Please upload an image file", "error");
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
        showToast(isAr ? "تم تحديث الصورة" : "Photo updated");
      }
    } catch {
      showToast(isAr ? "فشل رفع الصورة" : "Failed to upload photo", "error");
    }
    setUploading(false);
  }

  function validateProfile(): boolean {
    let valid = true;
    setNameError("");
    setEmailError("");
    if (!name.trim()) {
      setNameError(t("settings.nameRequired"));
      valid = false;
    }
    if (!email.trim()) {
      setEmailError(t("settings.emailRequired"));
      valid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError(t("settings.emailInvalid"));
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
        <p className="text-sm">{t("settings.failedToLoad")}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-primary text-white text-sm font-semibold hover:bg-secondary transition-colors"
        >
          {t("settings.retry")}
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-full">
      {toast && (
        <div className={`fixed top-4 ${isAr ? "left-4" : "right-4"} z-50 text-white text-sm font-medium px-4 py-2.5 shadow-lg flex items-center gap-2 ${
          toast.type === "error" ? "bg-red-500" : "bg-primary"
        }`}>
          <span className="material-symbols-outlined text-base">
            {toast.type === "error" ? "error" : "check_circle"}
          </span>
          {toast.message}
        </div>
      )}
      {/* Section nav */}
      <div className={`hidden md:block w-56 ${isAr ? "border-l" : "border-r"} border-line p-4 shrink-0`}>
        <button
          onClick={() => window.location.href = "/dashboard"}
          className="flex items-center gap-2 px-3 py-2 mb-3 text-sm text-mute hover:text-primary transition-colors w-full text-start"
        >
          <span className="material-symbols-outlined text-base">{isAr ? "arrow_forward" : "arrow_back"}</span>
          {t("settings.backToApp")}
        </button>
        <div className="h-px bg-line mb-3" />
        <p className="text-[9px] font-bold text-mute tracking-[2px] uppercase mb-4 px-3">{t("settings.title")}</p>
        <nav className="flex flex-col gap-0.5">
          {navSections
            .filter((s) => s.id !== "organization" || isOrg)
            .map((s) => (
              <button
                key={s.id}
                onClick={() => setActiveSection(s.id)}
                className={`flex items-center gap-2.5 px-3 py-2 text-sm font-medium transition-colors text-start ${
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
            <span className="material-symbols-outlined text-base">{isAr ? "arrow_forward" : "arrow_back"}</span>
            {t("settings.backToApp")}
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

        {/* Profile */}
        {activeSection === "profile" && (
          <div>
            <h2 className="text-xl font-bold text-ink mb-1">{t("settings.profile")}</h2>
            <p className="text-sm text-mute mb-6">{t("settings.personalInfo")}</p>

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
                  {uploading ? t("settings.uploading") : avatarUrl ? t("settings.changePhoto") : t("settings.uploadPhoto")}
                </button>
              </div>
            </div>

            <div className="space-y-5">
              <div>
                <label className="text-[10px] font-bold text-mute tracking-[1.5px] uppercase block mb-1.5">{t("settings.fullName")}</label>
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
                <label className="text-[10px] font-bold text-mute tracking-[1.5px] uppercase block mb-1.5">{t("settings.email")}</label>
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
                <label className="text-[10px] font-bold text-mute tracking-[1.5px] uppercase block mb-1.5">{t("settings.accountType")}</label>
                <p className="text-sm text-ink capitalize px-4 py-2.5 bg-surface border border-line">{user?.account_type ?? "—"}</p>
              </div>
            </div>

            <button
              onClick={handleProfileSave}
              disabled={saving}
              className="mt-6 px-6 py-2.5 bg-primary text-white text-sm font-semibold hover:bg-secondary transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {saving && <span className="material-symbols-outlined text-base animate-spin">progress_activity</span>}
              {saving ? t("settings.saving") : t("settings.saveChanges")}
            </button>
          </div>
        )}

        {/* Sermon Defaults */}
        {activeSection === "sermon" && (
          <div>
            <h2 className="text-xl font-bold text-ink mb-1">{t("settings.sermonDefaults")}</h2>
            <p className="text-sm text-mute mb-6">{t("settings.sermonDefaultsDesc")}</p>

            <div className="space-y-5">
              <div>
                <label className="text-[10px] font-bold text-mute tracking-[1.5px] uppercase block mb-1.5">{t("settings.defaultLang")}</label>
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
                <label className="text-[10px] font-bold text-mute tracking-[1.5px] uppercase block mb-1.5">{t("settings.defaultWordTarget")}</label>
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
                  <span className="text-sm font-semibold text-ink w-16 text-end">{wordTarget.toLocaleString(isAr ? "ar-SA" : "en-US")}</span>
                </div>
                <p className="text-xs text-mute mt-1">{t("settings.wordTargetHint")}</p>
              </div>

              <div>
                <label className="text-[10px] font-bold text-mute tracking-[1.5px] uppercase block mb-1.5">{t("settings.statusFlow")}</label>
                <div className="flex items-center gap-2 text-sm text-mute">
                  <span className="px-2.5 py-1 bg-surface border border-line text-xs font-bold">{t("status.draft").toUpperCase()}</span>
                  <span className="material-symbols-outlined text-base">arrow_forward</span>
                  <span className="px-2.5 py-1 bg-accent-gold/10 text-accent-gold text-xs font-bold">{t("themes.planned").toUpperCase()}</span>
                  <span className="material-symbols-outlined text-base">arrow_forward</span>
                  <span className="px-2.5 py-1 bg-green-50 text-green-700 text-xs font-bold">{t("status.ready").toUpperCase()}</span>
                  <span className="material-symbols-outlined text-base">arrow_forward</span>
                  <span className="px-2.5 py-1 bg-primary/10 text-primary text-xs font-bold">{t("status.delivered").toUpperCase()}</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => saveSection("sermon", { default_language: defaultLanguage, word_target: wordTarget })}
              disabled={saving}
              className="mt-6 px-6 py-2.5 bg-primary text-white text-sm font-semibold hover:bg-secondary transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {saving && <span className="material-symbols-outlined text-base animate-spin">progress_activity</span>}
              {saving ? t("settings.saving") : t("settings.saveChanges")}
            </button>
          </div>
        )}

        {/* Notifications */}
        {activeSection === "notifications" && (
          <div>
            <h2 className="text-xl font-bold text-ink mb-1">{t("settings.notifications")}</h2>
            <p className="text-sm text-mute mb-6">{t("settings.howReminded")}</p>

            <div className="space-y-6">
              <div>
                <label className="text-[10px] font-bold text-mute tracking-[1.5px] uppercase block mb-1.5">{t("settings.fridayReminder")}</label>
                <p className="text-xs text-mute mb-2">{t("settings.fridayReminderDesc")}</p>
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
                <label className="text-[10px] font-bold text-mute tracking-[1.5px] uppercase block">{t("settings.emailNotifications")}</label>

                <div className="flex items-center justify-between py-3 border-b border-line">
                  <div>
                    <p className="text-sm text-ink font-medium">{t("settings.sermonAssigned")}</p>
                    <p className="text-xs text-mute">{t("settings.sermonAssignedDesc")}</p>
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
                    <p className="text-sm text-ink font-medium">{t("settings.weeklyDigest")}</p>
                    <p className="text-xs text-mute">{t("settings.weeklyDigestDesc")}</p>
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
              {saving ? t("settings.saving") : t("settings.saveChanges")}
            </button>
          </div>
        )}

        {/* Appearance */}
        {activeSection === "appearance" && (
          <div>
            <h2 className="text-xl font-bold text-ink mb-1">{t("settings.appearance")}</h2>
            <p className="text-sm text-mute mb-6">{t("settings.customizeAppearance")}</p>

            <div className="space-y-6">
              <div>
                <label className="text-[10px] font-bold text-mute tracking-[1.5px] uppercase block mb-3">{t("settings.theme")}</label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { value: "light", label: t("settings.light"), icon: "light_mode" },
                    { value: "dark", label: t("settings.dark"), icon: "dark_mode" },
                    { value: "system", label: t("settings.system"), icon: "settings_brightness" },
                  ].map((th) => (
                    <button
                      key={th.value}
                      onClick={() => { setThemeMode(th.value); applyTheme(th.value); localStorage.setItem("jp_theme", th.value); saveSection("appearance", { theme_mode: th.value, editor_font_size: Number(editorFontSize) }); }}
                      className={`flex flex-col items-center gap-2 p-4 border transition-colors ${
                        themeMode === th.value
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-line bg-white text-mute hover:text-ink"
                      }`}
                    >
                      <span className="material-symbols-outlined text-2xl">{th.icon}</span>
                      <span className="text-sm font-medium">{th.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-mute tracking-[1.5px] uppercase block mb-1.5">{t("settings.editorFontSize")}</label>
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
                  <p className="text-[10px] font-bold text-mute tracking-[1.5px] uppercase mb-2">{t("settings.preview")}</p>
                  <p style={{ fontSize: `${editorFontSize}px` }} className="font-[var(--font-arabic)] text-ink text-right" dir="rtl">بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ</p>
                  <p style={{ fontSize: `${Number(editorFontSize) - 2}px` }} className="text-mute italic mt-1">In the name of Allah, the Most Gracious, the Most Merciful.</p>
                </div>
              </div>
            </div>

            <p className="mt-4 text-xs text-mute flex items-center gap-1.5">
              <span className="material-symbols-outlined text-primary text-sm">check_circle</span>
              {t("settings.autoSaved")}
            </p>
          </div>
        )}

        {/* Subscription */}
        {activeSection === "subscription" && (
          <div>
            <h2 className="text-xl font-bold text-ink mb-1">{t("settings.subscription")}</h2>
            <p className="text-sm text-mute mb-6">{t("settings.managePlan")}</p>

            <div className="border-2 border-primary/20 p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-[10px] font-bold text-mute tracking-[1.5px] uppercase">{t("settings.currentPlan")}</p>
                  <p className="text-xl font-bold text-primary mt-1">{isOrg ? t("settings.organization") : t("settings.individual")}</p>
                </div>
                <div className="text-end">
                  <p className="text-2xl font-bold text-ink">{isOrg ? "$49" : "$9"}<span className="text-sm font-normal text-mute">/mo</span></p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs text-mute">
                <span className="material-symbols-outlined text-primary text-sm">check_circle</span>
                Active — renews Aug 21, 2026
              </div>
            </div>

            <div className="mb-6">
              <p className="text-[10px] font-bold text-mute tracking-[1.5px] uppercase mb-3">{t("settings.planIncludes")}</p>
              <ul className="space-y-2">
                <li className="flex items-center gap-2 text-sm text-ink"><span className="material-symbols-outlined text-primary text-base">check</span> {isAr ? "محرر خطب عربي + إنجليزي" : "Arabic + English sermon editor"}</li>
                <li className="flex items-center gap-2 text-sm text-ink"><span className="material-symbols-outlined text-primary text-base">check</span> {isAr ? "مخطط المواضيع السنوي" : "Annual theme planner"}</li>
                <li className="flex items-center gap-2 text-sm text-ink"><span className="material-symbols-outlined text-primary text-base">check</span> {isAr ? "تقويم الجمعة" : "Jumu'ah calendar"}</li>
                <li className="flex items-center gap-2 text-sm text-ink"><span className="material-symbols-outlined text-primary text-base">check</span> {isAr ? "تصدير إلى PDF و Word" : "Export to PDF & Word"}</li>
                {isOrg && (
                  <>
                    <li className="flex items-center gap-2 text-sm text-ink"><span className="material-symbols-outlined text-accent-gold text-base">check</span> {isAr ? "حتى 20 حساب خطيب" : "Up to 20 khatib accounts"}</li>
                    <li className="flex items-center gap-2 text-sm text-ink"><span className="material-symbols-outlined text-accent-gold text-base">check</span> {isAr ? "أدوات مراجعة المشرف" : "Moderator review tools"}</li>
                    <li className="flex items-center gap-2 text-sm text-ink"><span className="material-symbols-outlined text-accent-gold text-base">check</span> {isAr ? "بنك خطب مشترك" : "Shared khutbah bank"}</li>
                  </>
                )}
              </ul>
            </div>

            {!isOrg && (
              <div className="bg-accent-gold/5 border border-accent-gold/20 p-5 mb-6">
                <div className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-accent-gold text-xl mt-0.5">upgrade</span>
                  <div>
                    <p className="text-sm font-semibold text-ink">{isAr ? "الترقية إلى المؤسسة" : "Upgrade to Organization"}</p>
                    <p className="text-xs text-mute mt-1">{isAr ? "احصل على إدارة متعددة الخطباء وبنك خطب مشترك وأدوات المشرف لمسجدك." : "Get multi-khatib management, shared sermon bank, and moderator tools for your masjid."}</p>
                    <button onClick={() => showToast(t("settings.comingSoon"), "error")} className="mt-3 px-5 py-2 bg-primary text-white text-sm font-semibold hover:bg-secondary transition-colors">
                      {isAr ? "الترقية — $49/شهر" : "Upgrade — $49/mo"}
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div>
              <p className="text-[10px] font-bold text-mute tracking-[1.5px] uppercase mb-3">{t("settings.billing")}</p>
              <div className="space-y-3">
                <div className="flex items-center justify-between py-3 border-b border-line">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-mute text-lg">credit_card</span>
                    <div>
                      <p className="text-sm text-ink font-medium">{isAr ? "Visa تنتهي بـ 4242" : "Visa ending in 4242"}</p>
                      <p className="text-xs text-mute">{isAr ? "تنتهي 12/2027" : "Expires 12/2027"}</p>
                    </div>
                  </div>
                  <button onClick={() => showToast(t("settings.comingSoon"), "error")} className="text-xs text-primary font-semibold hover:underline">{isAr ? "تحديث" : "Update"}</button>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-line">
                  <p className="text-sm text-ink">{isAr ? "عرض الفواتير" : "View invoices"}</p>
                  <button onClick={() => showToast(t("settings.comingSoon"), "error")} className="text-xs text-primary font-semibold hover:underline">{t("dash.viewAll")}</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Organization */}
        {activeSection === "organization" && isOrg && (
          <div>
            <h2 className="text-xl font-bold text-ink mb-1">{t("settings.organization")}</h2>
            <p className="text-sm text-mute mb-6">{t("settings.manageMasjid")}</p>

            <div className="bg-surface border border-line p-6 text-center">
              <span className="material-symbols-outlined text-primary text-4xl mb-3 block">group</span>
              <p className="text-sm text-ink font-medium mb-2">
                {isAr ? "إدارة الخطباء والجدول الزمني" : "Manage khatibs and schedule"}
              </p>
              <p className="text-xs text-mute mb-4">
                {isAr ? "أضف خطباء، أرسل دعوات، وأدر جدول الجمعة من لوحة المؤسسة." : "Add khatibs, send invites, and manage the Friday schedule from the organization dashboard."}
              </p>
              <div className="flex items-center justify-center gap-3">
                <a href="/org/khatibs" className="px-5 py-2 bg-primary text-white text-sm font-semibold hover:bg-secondary transition-colors">
                  {isAr ? "إدارة الخطباء" : "Manage Khatibs"}
                </a>
                <a href="/org/schedule" className="px-5 py-2 border border-line bg-white text-ink text-sm font-medium hover:bg-surface transition-colors">
                  {isAr ? "جدول الجمعة" : "Friday Schedule"}
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Account */}
        {activeSection === "account" && (
          <div>
            <h2 className="text-xl font-bold text-ink mb-1">{t("settings.account")}</h2>
            <p className="text-sm text-mute mb-6">{t("settings.securityData")}</p>

            <div className="space-y-6">
              <div>
                <p className="text-[10px] font-bold text-mute tracking-[1.5px] uppercase mb-3">{t("settings.changePassword")}</p>
                <div className="space-y-3">
                  <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder={t("settings.currentPassword")} className="w-full border border-line px-4 py-2.5 text-sm bg-white focus:outline-none focus:border-primary" />
                  <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder={t("settings.newPassword")} className="w-full border border-line px-4 py-2.5 text-sm bg-white focus:outline-none focus:border-primary" />
                  <input type="password" value={confirmNewPassword} onChange={(e) => setConfirmNewPassword(e.target.value)} placeholder={t("settings.confirmPassword")} className="w-full border border-line px-4 py-2.5 text-sm bg-white focus:outline-none focus:border-primary" />
                </div>
                <button
                  disabled={changingPassword}
                  onClick={async () => {
                    if (!currentPassword || !newPassword) { showToast(isAr ? "يرجى ملء جميع الحقول" : "Please fill all fields", "error"); return; }
                    if (newPassword.length < 8 || !/[A-Z]/.test(newPassword) || !/[a-z]/.test(newPassword) || !/[0-9]/.test(newPassword) || !/[^A-Za-z0-9]/.test(newPassword)) {
                      showToast(isAr ? "كلمة المرور يجب أن تحتوي على حرف كبير وصغير ورقم ورمز خاص" : "Password needs uppercase, lowercase, number, and special character", "error"); return;
                    }
                    if (newPassword !== confirmNewPassword) { showToast(isAr ? "كلمتا المرور غير متطابقتين" : "Passwords don't match", "error"); return; }
                    setChangingPassword(true);
                    try {
                      const res = await fetch("/api/auth/change-password", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ currentPassword, newPassword }) });
                      const data = await res.json();
                      if (!res.ok) { showToast(data.error || "Failed", "error"); return; }
                      showToast(isAr ? "تم تحديث كلمة المرور" : "Password updated");
                      setCurrentPassword(""); setNewPassword(""); setConfirmNewPassword("");
                    } catch { showToast(isAr ? "فشل تحديث كلمة المرور" : "Failed to update password", "error"); }
                    finally { setChangingPassword(false); }
                  }}
                  className="mt-3 px-6 py-2.5 bg-primary text-white text-sm font-semibold hover:bg-secondary transition-colors disabled:opacity-50"
                >{changingPassword ? (isAr ? "جاري التحديث..." : "Updating...") : t("settings.updatePassword")}</button>
              </div>

              <div className="border-t border-line pt-6">
                <p className="text-[10px] font-bold text-mute tracking-[1.5px] uppercase mb-2">{t("settings.exportData")}</p>
                <p className="text-xs text-mute mb-3">{t("settings.exportDesc")}</p>
                <button
                  onClick={async () => {
                    try {
                      const res = await fetch("/api/export");
                      if (!res.ok) throw new Error("Export failed");
                      const blob = await res.blob();
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement("a");
                      a.href = url;
                      a.download = `jumua-planner-export-${new Date().toISOString().slice(0, 10)}.json`;
                      a.click();
                      URL.revokeObjectURL(url);
                      showToast(isAr ? "تم تصدير البيانات" : "Data exported");
                    } catch {
                      showToast(isAr ? "فشل تصدير البيانات" : "Failed to export data", "error");
                    }
                  }}
                  className="px-5 py-2 border border-line bg-white text-ink text-sm font-medium hover:bg-surface transition-colors flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-base">download</span>
                  {t("settings.exportAll")}
                </button>
              </div>

              <div className="border-t border-line pt-6">
                <p className="text-[10px] font-bold text-red-600 tracking-[1.5px] uppercase mb-2">{t("settings.dangerZone")}</p>
                <p className="text-xs text-mute mb-3">{t("settings.deleteAccountDesc")}</p>
                <button onClick={handleDeleteAccount} disabled={deleting} className="px-5 py-2 border border-red-300 bg-white text-red-600 text-sm font-medium hover:bg-red-50 transition-colors disabled:opacity-50">{deleting ? t("settings.deleting") : t("settings.deleteAccount")}</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
