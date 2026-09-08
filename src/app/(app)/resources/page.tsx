"use client";

import { useState } from "react";
import { useI18n } from "@/lib/i18n";

const sermonTopics = [
  { en: "Taqwa (God-Consciousness)", ar: "التقوى", icon: "favorite", verses: "Al-Baqarah 2:197, Al-Imran 3:102" },
  { en: "Patience & Gratitude", ar: "الصبر والشكر", icon: "self_improvement", verses: "Al-Baqarah 2:153, Ibrahim 14:7" },
  { en: "Unity of the Ummah", ar: "وحدة الأمة", icon: "group", verses: "Al-Imran 3:103, Al-Hujurat 49:10" },
  { en: "Sincerity (Ikhlas)", ar: "الإخلاص", icon: "brightness_7", verses: "Al-Bayyinah 98:5, Az-Zumar 39:11" },
  { en: "Justice & Fairness", ar: "العدل والإنصاف", icon: "balance", verses: "An-Nisa 4:135, Al-Ma'idah 5:8" },
  { en: "Kindness to Parents", ar: "بر الوالدين", icon: "family_restroom", verses: "Al-Isra 17:23-24, Luqman 31:14" },
  { en: "Trusting in Allah (Tawakkul)", ar: "التوكل على الله", icon: "shield", verses: "At-Talaq 65:3, Al-Imran 3:159" },
  { en: "Repentance (Tawbah)", ar: "التوبة", icon: "refresh", verses: "Az-Zumar 39:53, At-Tahrim 66:8" },
  { en: "Good Character (Akhlaq)", ar: "حسن الخلق", icon: "emoji_people", verses: "Al-Qalam 68:4, Al-Furqan 25:63" },
  { en: "Remembrance of Death", ar: "ذكر الموت", icon: "hourglass_bottom", verses: "Al-Imran 3:185, Al-Jumu'ah 62:8" },
  { en: "Rights of Neighbors", ar: "حقوق الجار", icon: "home", verses: "An-Nisa 4:36, Hadith: Bukhari 6015" },
  { en: "Seeking Knowledge", ar: "طلب العلم", icon: "school", verses: "Al-Alaq 96:1-5, Ta-Ha 20:114" },
  { en: "Charity (Sadaqah)", ar: "الصدقة", icon: "volunteer_activism", verses: "Al-Baqarah 2:261, Al-Hadid 57:18" },
  { en: "Avoiding Backbiting", ar: "اجتناب الغيبة", icon: "do_not_disturb", verses: "Al-Hujurat 49:12, Al-Humazah 104:1" },
  { en: "Trust & Accountability (Amanah)", ar: "الأمانة", icon: "verified", verses: "Al-Anfal 8:27, Al-Mu'minun 23:8" },
  { en: "The Power of Du'a", ar: "قوة الدعاء", icon: "nights_stay", verses: "Ghafir 40:60, Al-Baqarah 2:186" },
  { en: "Marriage & Family", ar: "الزواج والأسرة", icon: "diversity_3", verses: "Ar-Rum 30:21, An-Nisa 4:19" },
  { en: "Preparing for Ramadan", ar: "الاستعداد لرمضان", icon: "brightness_3", verses: "Al-Baqarah 2:183-185" },
  { en: "Lessons from the Seerah", ar: "دروس من السيرة", icon: "history_edu", verses: "Al-Ahzab 33:21, Yusuf 12:111" },
  { en: "Brotherhood & Sisterhood", ar: "الأخوة في الإسلام", icon: "handshake", verses: "Al-Hujurat 49:10, At-Tawbah 9:71" },
];

const quickReferences = [
  { en: "Jumu'ah Surah (Al-Jumu'ah 62)", ar: "سورة الجمعة", icon: "menu_book" },
  { en: "Surah Al-Kahf (18)", ar: "سورة الكهف", icon: "auto_stories" },
  { en: "Surah Ya-Sin (36)", ar: "سورة يس", icon: "auto_stories" },
  { en: "Surah Ar-Rahman (55)", ar: "سورة الرحمن", icon: "auto_stories" },
  { en: "Surah Al-Mulk (67)", ar: "سورة الملك", icon: "auto_stories" },
  { en: "40 Hadith of Imam Nawawi", ar: "الأربعون النووية", icon: "format_quote" },
  { en: "Riyadh As-Salihin Topics", ar: "رياض الصالحين", icon: "format_quote" },
  { en: "Bulugh Al-Maram (Fiqh)", ar: "بلوغ المرام", icon: "gavel" },
];

export default function ResourcesPage() {
  const { t, isAr } = useI18n();
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<"topics" | "references">("topics");

  const filtered = sermonTopics.filter((topic) => {
    const q = search.toLowerCase();
    return topic.en.toLowerCase().includes(q) || topic.ar.includes(search) || topic.verses.toLowerCase().includes(q);
  });

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      <div className="mb-8">
        <h1 className="text-xl sm:text-2xl font-bold text-ink mb-1">{t("resources.title")}</h1>
        <p className="text-mute text-sm">{isAr ? "أفكار للخطب ومراجع سريعة" : "Sermon topic ideas and quick references"}</p>
      </div>

      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setTab("topics")}
          className={`px-4 py-2 text-sm font-semibold transition-colors ${tab === "topics" ? "bg-primary text-white" : "bg-surface text-mute hover:text-ink"}`}
        >
          <span className="material-symbols-outlined text-base align-middle mr-1">lightbulb</span>
          {isAr ? "أفكار للخطب" : "Sermon Topics"}
        </button>
        <button
          onClick={() => setTab("references")}
          className={`px-4 py-2 text-sm font-semibold transition-colors ${tab === "references" ? "bg-primary text-white" : "bg-surface text-mute hover:text-ink"}`}
        >
          <span className="material-symbols-outlined text-base align-middle mr-1">auto_stories</span>
          {isAr ? "مراجع سريعة" : "Quick References"}
        </button>
      </div>

      {tab === "topics" && (
        <>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={isAr ? "ابحث عن موضوع أو آية..." : "Search topics or verses..."}
            className="w-full border border-line px-4 py-2.5 text-sm bg-white focus:outline-none focus:border-primary mb-6"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {filtered.map((topic, i) => (
              <div key={i} className="border border-line bg-white p-4 hover:border-primary/30 transition-colors">
                <div className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-xl text-primary/60 mt-0.5">{topic.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-ink">{isAr ? topic.ar : topic.en}</p>
                    <p className="text-xs text-mute mt-0.5">{isAr ? topic.en : topic.ar}</p>
                    <p className="text-[11px] text-primary/70 mt-2 font-mono">{topic.verses}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filtered.length === 0 && (
            <p className="text-center text-mute text-sm py-12">{isAr ? "لا توجد نتائج" : "No results found"}</p>
          )}
        </>
      )}

      {tab === "references" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {quickReferences.map((ref, i) => (
            <div key={i} className="border border-line bg-white p-4 flex items-center gap-3">
              <span className="material-symbols-outlined text-xl text-primary/60">{ref.icon}</span>
              <div>
                <p className="text-sm font-semibold text-ink">{isAr ? ref.ar : ref.en}</p>
                <p className="text-xs text-mute">{isAr ? ref.en : ref.ar}</p>
              </div>
            </div>
          ))}

          <div className="col-span-full mt-6 bg-surface border border-line p-5 text-center">
            <span className="material-symbols-outlined text-2xl text-accent-gold mb-2 block">construction</span>
            <p className="text-sm font-semibold text-ink mb-1">{isAr ? "المزيد قادم قريباً" : "More coming soon"}</p>
            <p className="text-xs text-mute">{isAr ? "مكتبة متكاملة للقرآن والحديث ومحرك بحث متقدم" : "Full Quran & Hadith library with advanced search"}</p>
          </div>
        </div>
      )}
    </div>
  );
}
