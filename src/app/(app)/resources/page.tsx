"use client";

import { useI18n } from "@/lib/i18n";

export default function ResourcesPage() {
  const { t } = useI18n();

  return (
    <div className="max-w-3xl mx-auto px-6 py-16 text-center">
      <div className="w-16 h-16 mx-auto mb-6 bg-primary/10 flex items-center justify-center">
        <span className="material-symbols-outlined text-3xl text-primary">menu_book</span>
      </div>
      <h1 className="text-2xl font-bold text-ink mb-2">{t("resources.title")}</h1>
      <p className="text-mute text-sm mb-8">
        {t("resources.desc")}
      </p>
      <div className="inline-flex items-center gap-2 bg-accent-gold/10 text-accent-gold px-4 py-2 text-sm font-semibold">
        <span className="material-symbols-outlined text-lg">construction</span>
        {t("resources.comingSoon")}
      </div>
      <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-px bg-line border border-line">
        <div className="bg-white p-6">
          <span className="material-symbols-outlined text-2xl text-primary/40 mb-3 block">auto_stories</span>
          <h3 className="text-sm font-bold text-ink mb-1">{t("resources.quranHadith")}</h3>
          <p className="text-xs text-mute">{t("resources.quranHadithDesc")}</p>
        </div>
        <div className="bg-white p-6">
          <span className="material-symbols-outlined text-2xl text-primary/40 mb-3 block">lightbulb</span>
          <h3 className="text-sm font-bold text-ink mb-1">{t("resources.sermonIdeas")}</h3>
          <p className="text-xs text-mute">{t("resources.sermonIdeasDesc")}</p>
        </div>
        <div className="bg-white p-6">
          <span className="material-symbols-outlined text-2xl text-primary/40 mb-3 block">bookmark</span>
          <h3 className="text-sm font-bold text-ink mb-1">{t("resources.savedCollection")}</h3>
          <p className="text-xs text-mute">{t("resources.savedCollectionDesc")}</p>
        </div>
      </div>
    </div>
  );
}
