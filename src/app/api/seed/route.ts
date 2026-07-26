import { NextResponse } from "next/server";
import { db, cuid } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST() {
  const userId = "demo-user";

  // Clear existing sermons, references, themes
  db.prepare("DELETE FROM references_ WHERE sermon_id IN (SELECT id FROM sermons WHERE author_id = ?)").run(userId);
  db.prepare("DELETE FROM sermons WHERE author_id = ?").run(userId);
  db.prepare("DELETE FROM sub_topics WHERE theme_id IN (SELECT id FROM themes WHERE owner_id = ?)").run(userId);
  db.prepare("DELETE FROM themes WHERE owner_id = ?").run(userId);

  // Settings
  db.prepare("INSERT OR REPLACE INTO user_settings (user_id, default_language, word_target, editor_font_size) VALUES (?, ?, ?, ?)").run(userId, "ar-first", 2500, 18);

  const year = 2026;

  // ── 12-month annual plan ──
  const themes = [
    {
      name: "Foundations of Faith",
      description: "Strengthening Aqeedah — Tawheed, trust in Allah, and the pillars of Iman.",
      month: 1, color: "#2563eb",
      subs: ["Tawheed & Sincerity", "Trust & Reliance on Allah"],
      sermons: [
        { title: "The Beauty of Tawheed in Daily Life", date: "2026-01-02", status: "delivered", content: genContent("tawheed") },
        { title: "Patience in Testing — A Mark of True Faith", date: "2026-01-09", status: "delivered", content: genContent("patience") },
        { title: "Certainty in Allah Amid Uncertainty", date: "2026-01-16", status: "delivered", content: genContent("certainty") },
        { title: "Living with Tawakkul", date: "2026-01-23", status: "delivered", content: genContent("tawakkul") },
      ],
    },
    {
      name: "The Prophetic Example",
      description: "Living the Sunnah — the Prophet's character, mercy, and guidance for modern life.",
      month: 2, color: "#059669",
      subs: ["Prophetic Character", "Mercy & Compassion"],
      sermons: [
        { title: "The Prophet's Gentleness with All People", date: "2026-02-06", status: "delivered", content: genContent("gentleness") },
        { title: "Mercy as a Way of Life", date: "2026-02-13", status: "delivered", content: genContent("mercy") },
        { title: "The Sunnah in Our Modern Routines", date: "2026-02-20", status: "delivered", content: genContent("sunnah") },
        { title: "Forgiveness: The Prophet's Greatest Strength", date: "2026-02-27", status: "delivered", content: genContent("forgiveness") },
      ],
    },
    {
      name: "Purification of the Heart",
      description: "Tazkiyah — cleansing the soul from envy, arrogance, and heedlessness.",
      month: 3, color: "#7c3aed",
      subs: ["Diseases of the Heart", "Spiritual Remedies"],
      sermons: [
        { title: "Recognizing the Diseases of the Heart", date: "2026-03-06", status: "delivered", content: genContent("diseases") },
        { title: "Overcoming Envy with Gratitude", date: "2026-03-13", status: "delivered", content: genContent("envy") },
        { title: "Humility Before Allah and His Creation", date: "2026-03-20", status: "delivered", content: genContent("humility") },
        { title: "The Remembrance of Allah — Medicine for the Soul", date: "2026-03-27", status: "delivered", content: genContent("dhikr") },
      ],
    },
    {
      name: "Family & Relationships",
      description: "Building strong Muslim families — marriage, parenting, and kinship ties.",
      month: 4, color: "#C4A35A",
      subs: ["Marriage & Partnership", "Rights of Parents & Children"],
      sermons: [
        { title: "The Sacred Bond of Marriage in Islam", date: "2026-04-03", status: "delivered", content: genContent("marriage") },
        { title: "Raising Children with Purpose and Love", date: "2026-04-10", status: "delivered", content: genContent("parenting") },
        { title: "Honouring Parents in Word and Deed", date: "2026-04-17", status: "delivered", content: genContent("parents") },
        { title: "Maintaining Family Ties in a Busy World", date: "2026-04-24", status: "delivered", content: genContent("kinship") },
      ],
    },
    {
      name: "Social Justice in Islam",
      description: "Standing for justice — equity, charity, and defending the oppressed.",
      month: 5, color: "#dc2626",
      subs: ["Justice & Equity", "Charity & Generosity"],
      sermons: [
        { title: "Justice as a Pillar of the Muslim Community", date: "2026-05-01", status: "delivered", content: genContent("justice") },
        { title: "The Spirit of Sadaqah Beyond Ramadan", date: "2026-05-08", status: "delivered", content: genContent("sadaqah") },
        { title: "Standing with the Oppressed", date: "2026-05-15", status: "delivered", content: genContent("oppressed") },
        { title: "Wealth as a Trust from Allah", date: "2026-05-22", status: "delivered", content: genContent("wealth") },
      ],
    },
    {
      name: "Quran: A Living Guide",
      description: "Deepening our relationship with the Book of Allah — recitation, reflection, and application.",
      month: 6, color: "#0891b2",
      subs: ["Tadabbur & Reflection", "Living by the Quran"],
      sermons: [
        { title: "The Quran as a Companion in Solitude", date: "2026-06-05", status: "delivered", content: genContent("quran_companion") },
        { title: "Reflecting on the Quran with the Heart", date: "2026-06-12", status: "delivered", content: genContent("tadabbur") },
        { title: "Stories of the Prophets — Lessons for Today", date: "2026-06-19", status: "delivered", content: genContent("prophets") },
        { title: "Applying Quranic Ethics in the Workplace", date: "2026-06-26", status: "ready", content: genContent("ethics") },
      ],
    },
    {
      name: "Unity & Brotherhood",
      description: "Strengthening the bonds of the Ummah — community, cooperation, and reconciliation.",
      month: 7, color: "#4a7c59",
      subs: ["Community Building", "Reconciliation & Forgiveness"],
      sermons: [
        { title: "Brotherhood as a Shield Against Division", date: "2026-07-03", status: "ready", content: genContent("brotherhood") },
        { title: "Holding Fast to Allah's Rope Together", date: "2026-07-10", status: "ready", content: genContent("unity") },
        { title: "Repairing Broken Ties with Mercy", date: "2026-07-17", status: "ready", content: genContent("broken_ties") },
        { title: "The Importance of Taqwa (God-Consciousness)", date: "2026-07-24", status: "ready", content: genContent("taqwa") },
        { title: "Respecting Difference Without Division", date: "2026-07-31", status: "in_review", content: genContent("difference") },
      ],
    },
    {
      name: "Knowledge & Education",
      description: "The pursuit of knowledge — its virtue, etiquette, and impact on the Ummah.",
      month: 8, color: "#ea580c",
      subs: ["Seeking Knowledge", "Teaching & Mentorship"],
      sermons: [
        { title: "The Virtue of Seeking Knowledge", date: "2026-08-07", status: "in_review", content: genContent("knowledge") },
        { title: "The Etiquette of the Student and Scholar", date: "2026-08-14", status: "draft", content: genContent("etiquette") },
        { title: "Raising a Generation of Thinkers", date: "2026-08-21", status: "draft", content: "" },
        { title: "Knowledge Without Action", date: "2026-08-28", status: "draft", content: "" },
      ],
    },
    {
      name: "Du'a & Worship",
      description: "The power of supplication and deepening our acts of worship.",
      month: 9, color: "#be185d",
      subs: ["The Art of Du'a", "Perfecting Salah"],
      sermons: [
        { title: "The Etiquette and Power of Du'a", date: "2026-09-04", status: "draft", content: "" },
        { title: "Khushu in Salah — Praying with Presence", date: "2026-09-11", status: "draft", content: "" },
        { title: "The Night Prayer — A Private Audience", date: "2026-09-18", status: "draft", content: "" },
        { title: "Gratitude as Worship", date: "2026-09-25", status: "draft", content: "" },
      ],
    },
    {
      name: "The Hereafter",
      description: "Reflecting on death, the grave, and the eternal life to come.",
      month: 10, color: "#8a5c6e",
      subs: ["Death & Preparation", "Paradise & Accountability"],
      sermons: [
        { title: "Remembering Death to Live Fully", date: "2026-10-02", status: "draft", content: "" },
        { title: "Preparing for the Journey No One Escapes", date: "2026-10-09", status: "draft", content: "" },
        { title: "The Scales of Justice on the Day of Judgement", date: "2026-10-16", status: "draft", content: "" },
        { title: "The Promise of Paradise", date: "2026-10-23", status: "draft", content: "" },
      ],
    },
    {
      name: "Contemporary Challenges",
      description: "Navigating modern life — technology, mental health, identity, and faith in the West.",
      month: 11, color: "#475569",
      subs: ["Faith in the Modern World", "Mental Health & Wellbeing"],
      sermons: [
        { title: "Social Media and the Muslim Soul", date: "2026-11-06", status: "draft", content: "" },
        { title: "Mental Health — Breaking the Stigma with Islam", date: "2026-11-13", status: "draft", content: "" },
        { title: "Muslim Identity in the West", date: "2026-11-20", status: "draft", content: "" },
        { title: "Raising Youth in a Digital Age", date: "2026-11-27", status: "draft", content: "" },
      ],
    },
    {
      name: "Year-End Reflection",
      description: "Accounting for the year — gratitude, repentance, and setting spiritual goals.",
      month: 12, color: "#1e3a5f",
      subs: ["Self-Accounting", "Renewal & Hope"],
      sermons: [
        { title: "A Year in Review — What Did We Plant?", date: "2026-12-04", status: "draft", content: "" },
        { title: "Repentance — The Door That Never Closes", date: "2026-12-11", status: "draft", content: "" },
        { title: "Setting Spiritual Goals for the Coming Year", date: "2026-12-18", status: "draft", content: "" },
        { title: "Ending the Year with Gratitude to Allah", date: "2026-12-25", status: "draft", content: "" },
      ],
    },
  ];

  // Reference library per sermon (keyed by sermon title substring)
  const refMap: Record<string, Array<{ type: string; title: string; source: string; content: string }>> = {
    "Tawheed": [
      { type: "quran", title: "Surah Al-Ikhlas 112:1-4", source: "Quran", content: "قُلْ هُوَ اللَّهُ أَحَدٌ ۝ اللَّهُ الصَّمَدُ ۝ لَمْ يَلِدْ وَلَمْ يُولَدْ ۝ وَلَمْ يَكُن لَّهُ كُفُوًا أَحَدٌ" },
      { type: "hadith", title: "Whoever dies knowing La ilaha illallah", source: "Sahih Muslim 26", content: "Whoever dies knowing that there is no god but Allah shall enter Paradise." },
    ],
    "Patience": [
      { type: "quran", title: "Surah Al-Baqarah 2:153", source: "Quran", content: "يَا أَيُّهَا الَّذِينَ آمَنُوا اسْتَعِينُوا بِالصَّبْرِ وَالصَّلَاةِ ۚ إِنَّ اللَّهَ مَعَ الصَّابِرِينَ" },
      { type: "hadith", title: "Patience at the first stroke", source: "Sahih al-Bukhari 1283", content: "Patience is at the first stroke of a calamity." },
    ],
    "Tawakkul": [
      { type: "quran", title: "Surah At-Talaq 65:3", source: "Quran", content: "وَمَن يَتَوَكَّلْ عَلَى اللَّهِ فَهُوَ حَسْبُهُ" },
      { type: "hadith", title: "Tie your camel and trust in Allah", source: "Jami' at-Tirmidhi 2517", content: "Tie your camel, then put your trust in Allah." },
    ],
    "Gentleness": [
      { type: "quran", title: "Surah Aal Imran 3:159", source: "Quran", content: "فَبِمَا رَحْمَةٍ مِّنَ اللَّهِ لِنتَ لَهُمْ ۖ وَلَوْ كُنتَ فَظًّا غَلِيظَ الْقَلْبِ لَانفَضُّوا مِنْ حَوْلِكَ" },
      { type: "hadith", title: "Gentleness adorns everything", source: "Sahih Muslim 2594", content: "Gentleness is not found in anything except that it beautifies it." },
    ],
    "Mercy": [
      { type: "quran", title: "Surah Al-Anbiya 21:107", source: "Quran", content: "وَمَا أَرْسَلْنَاكَ إِلَّا رَحْمَةً لِّلْعَالَمِينَ" },
      { type: "hadith", title: "The merciful are shown mercy", source: "Sunan Abi Dawud 4941", content: "The merciful are shown mercy by the Most Merciful. Be merciful to those on earth, and the One above the heavens will be merciful to you." },
    ],
    "Forgiveness": [
      { type: "quran", title: "Surah An-Nur 24:22", source: "Quran", content: "أَلَا تُحِبُّونَ أَن يَغْفِرَ اللَّهُ لَكُمْ ۗ وَاللَّهُ غَفُورٌ رَّحِيمٌ" },
      { type: "hadith", title: "Allah forgives the one who forgives", source: "Sahih Muslim 2588", content: "Charity does not decrease wealth. Allah increases the honor of one who forgives, and no one humbles himself for Allah's sake except that Allah raises his status." },
    ],
    "Taqwa": [
      { type: "quran", title: "Surah Aal Imran 3:102", source: "Quran", content: "يَا أَيُّهَا الَّذِينَ آمَنُوا اتَّقُوا اللَّهَ حَقَّ تُقَاتِهِ وَلَا تَمُوتُنَّ إِلَّا وَأَنتُم مُّسْلِمُونَ" },
      { type: "quran", title: "Surah Al-Hujurat 49:13", source: "Quran", content: "إِنَّ أَكْرَمَكُمْ عِنْدَ اللَّهِ أَتْقَاكُمْ" },
      { type: "hadith", title: "Fear Allah wherever you are", source: "Jami' at-Tirmidhi 1987", content: "Fear Allah wherever you are, follow a bad deed with a good deed and it will erase it, and treat people with good character." },
    ],
    "Brotherhood": [
      { type: "quran", title: "Surah Al-Hujurat 49:10", source: "Quran", content: "إِنَّمَا الْمُؤْمِنُونَ إِخْوَةٌ فَأَصْلِحُوا بَيْنَ أَخَوَيْكُمْ ۚ وَاتَّقُوا اللَّهَ لَعَلَّكُمْ تُرْحَمُونَ" },
      { type: "hadith", title: "The believers are like one body", source: "Sahih al-Bukhari 6011", content: "The believers in their mutual kindness, compassion, and sympathy are like one body. When one limb aches, the whole body reacts with sleeplessness and fever." },
    ],
    "Unity": [
      { type: "quran", title: "Surah Aal Imran 3:103", source: "Quran", content: "وَاعْتَصِمُوا بِحَبْلِ اللَّهِ جَمِيعًا وَلَا تَفَرَّقُوا" },
    ],
    "Marriage": [
      { type: "quran", title: "Surah Ar-Rum 30:21", source: "Quran", content: "وَمِنْ آيَاتِهِ أَنْ خَلَقَ لَكُم مِّنْ أَنفُسِكُمْ أَزْوَاجًا لِّتَسْكُنُوا إِلَيْهَا وَجَعَلَ بَيْنَكُم مَّوَدَّةً وَرَحْمَةً" },
      { type: "hadith", title: "The best of you to their families", source: "Jami' at-Tirmidhi 3895", content: "The best of you are those who are best to their families, and I am the best of you to my family." },
    ],
    "Parents": [
      { type: "quran", title: "Surah Al-Isra 17:23-24", source: "Quran", content: "وَقَضَىٰ رَبُّكَ أَلَّا تَعْبُدُوا إِلَّا إِيَّاهُ وَبِالْوَالِدَيْنِ إِحْسَانًا" },
      { type: "hadith", title: "Paradise lies at the feet of your mother", source: "Sunan an-Nasa'i 3104", content: "Paradise lies at the feet of your mother." },
    ],
    "Justice": [
      { type: "quran", title: "Surah An-Nisa 4:135", source: "Quran", content: "يَا أَيُّهَا الَّذِينَ آمَنُوا كُونُوا قَوَّامِينَ بِالْقِسْطِ شُهَدَاءَ لِلَّهِ وَلَوْ عَلَىٰ أَنفُسِكُمْ" },
      { type: "quran", title: "Surah An-Nahl 16:90", source: "Quran", content: "إِنَّ اللَّهَ يَأْمُرُ بِالْعَدْلِ وَالْإِحْسَانِ وَإِيتَاءِ ذِي الْقُرْبَىٰ" },
    ],
    "Quran": [
      { type: "quran", title: "Surah Al-Qamar 54:17", source: "Quran", content: "وَلَقَدْ يَسَّرْنَا الْقُرْآنَ لِلذِّكْرِ فَهَلْ مِن مُّدَّكِرٍ" },
      { type: "hadith", title: "The best of you are those who learn the Quran", source: "Sahih al-Bukhari 5027", content: "The best of you are those who learn the Quran and teach it." },
    ],
    "Knowledge": [
      { type: "quran", title: "Surah Az-Zumar 39:9", source: "Quran", content: "هَلْ يَسْتَوِي الَّذِينَ يَعْلَمُونَ وَالَّذِينَ لَا يَعْلَمُونَ" },
      { type: "hadith", title: "Seeking knowledge is an obligation", source: "Sunan Ibn Majah 224", content: "Seeking knowledge is an obligation upon every Muslim." },
    ],
  };

  const insertTheme = db.prepare(
    "INSERT INTO themes (id, name, description, month, year, color, owner_id) VALUES (?, ?, ?, ?, ?, ?, ?)"
  );
  const insertSub = db.prepare(
    "INSERT INTO sub_topics (id, name, week_number, theme_id) VALUES (?, ?, ?, ?)"
  );
  const insertSermon = db.prepare(
    "INSERT INTO sermons (id, title, content, status, scheduled_date, author_id, theme_id, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
  );
  const insertRef = db.prepare(
    "INSERT INTO references_ (id, type, title, source, content, sermon_id) VALUES (?, ?, ?, ?, ?, ?)"
  );

  let totalSermons = 0;
  let totalRefs = 0;

  const txn = db.transaction(() => {
    for (const theme of themes) {
      const themeId = cuid();
      insertTheme.run(themeId, theme.name, theme.description, theme.month, year, theme.color, userId);

      theme.subs.forEach((sub, idx) => {
        const subId = cuid();
        insertSub.run(subId, sub, idx + 1, themeId);
      });

      for (const s of theme.sermons) {
        const sermonId = cuid();
        const updatedAt = s.date + "T12:00:00.000Z";
        insertSermon.run(sermonId, s.title, s.content, s.status, s.date, userId, themeId, updatedAt);
        totalSermons++;

        for (const [key, refs] of Object.entries(refMap)) {
          if (s.title.includes(key)) {
            for (const r of refs) {
              insertRef.run(cuid(), r.type, r.title, r.source, r.content, sermonId);
              totalRefs++;
            }
          }
        }
      }
    }
  });

  txn();

  return NextResponse.json({
    ok: true,
    message: `Seeded 12 monthly themes, ${totalSermons} sermons, and ${totalRefs} references`,
  });
}

function genContent(topic: string): string {
  const contents: Record<string, string> = {
    tawheed: `بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ

إِنَّ الْحَمْدَ لِلَّهِ نَحْمَدُهُ وَنَسْتَعِينُهُ وَنَسْتَغْفِرُهُ

All praise is due to Allah, the Lord of all worlds. We praise Him, seek His help, and ask for His forgiveness. We bear witness that there is no deity worthy of worship except Allah alone, without any partners, and we bear witness that Muhammad is His servant and final messenger.

Dear brothers and sisters in Islam,

Today we reflect on the most fundamental principle of our faith — Tawheed, the absolute Oneness of Allah. This is not merely a theological concept confined to textbooks; it is the very foundation upon which our entire existence should be built.

Allah says in Surah Al-Ikhlas:

قُلْ هُوَ اللَّهُ أَحَدٌ ۝ اللَّهُ الصَّمَدُ ۝ لَمْ يَلِدْ وَلَمْ يُولَدْ ۝ وَلَمْ يَكُن لَّهُ كُفُوًا أَحَدٌ

"Say: He is Allah, the One. Allah, the Eternal Refuge. He neither begets nor is born, nor is there to Him any equivalent."

When we truly internalize Tawheed, it transforms every aspect of our daily life. We wake up knowing that our sustenance is from Allah alone. We go to work knowing that success comes only from Him. We face hardship knowing that relief is in His hands.

The Prophet ﷺ said: "Whoever dies knowing that there is no god but Allah shall enter Paradise." This knowing is not passive — it is an active, living conviction that shapes every decision we make.

Brothers and sisters, let us ask ourselves: does our Tawheed show in how we speak? In how we spend? In how we treat our neighbors? True Tawheed frees us from the slavery of dunya and anchors us to the worship of the One who created us.

May Allah make us among those whose Tawheed is pure, whose worship is sincere, and whose hearts are attached only to Him.

أَقُولُ قَوْلِي هَذَا وَأَسْتَغْفِرُ اللَّهَ لِي وَلَكُمْ`,

    patience: `بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ

All praise belongs to Allah, and may peace and blessings be upon His Messenger Muhammad ﷺ, his family, and his companions.

Brothers and sisters,

Life is a test. Allah tells us clearly in the Quran:

أَحَسِبَ النَّاسُ أَن يُتْرَكُوا أَن يَقُولُوا آمَنَّا وَهُمْ لَا يُفْتَنُونَ

"Do the people think that they will be left to say 'We believe' and they will not be tried?" (Al-Ankabut 29:2)

Every single one of us is being tested — some with poverty, others with wealth. Some with illness, others with health that makes them heedless. The question is not whether we will face trials, but how we respond.

The Prophet ﷺ taught us: "Patience is at the first stroke of a calamity." Not after we have complained. Not after we have lost hope. But at the very first moment, when the heart wants to scream — that is when true Sabr shines.

و بشر الصابرين الذين إذا أصابتهم مصيبة قالوا إنا لله و إنا إليه راجعون

"And give good tidings to the patient, who, when disaster strikes them, say: Indeed we belong to Allah, and indeed to Him we will return." (Al-Baqarah 2:155-156)

Dear community, patience is not passivity. It is not giving up. It is active trust in Allah's wisdom. It is continuing to pray when you feel nothing. It is being kind when people are unkind to you. It is holding your tongue when anger burns inside.

May Allah grant us all beautiful patience — the kind that draws us closer to Him rather than pushing us away.

أَقُولُ قَوْلِي هَذَا وَأَسْتَغْفِرُ اللَّهَ الْعَظِيمَ لِي وَلَكُمْ`,

    certainty: `بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ

All praise is due to Allah, the Most Wise, the All-Knowing.

Brothers and sisters in faith,

We live in an age of uncertainty — economic instability, political turmoil, personal anxieties about the future. Yet as believers, we are called to a higher certainty, one that transcends worldly circumstances.

Yaqeen — certainty in Allah — is what separates mere knowledge from transformative faith. You may know that Allah provides, but do you feel it when your bank account is empty? You may know that Allah heals, but do you trust it when the diagnosis is grim?

Ibrahim عليه السلام stood before a blazing fire with absolute certainty. Musa عليه السلام faced the sea with Pharaoh's army behind him and said with yaqeen: "Indeed, with me is my Lord; He will guide me."

This certainty is built, not born. It comes through the daily practice of turning to Allah in every situation — the small ones and the big ones. It comes through reading His Book and finding that He has already addressed every fear in your heart.

May Allah fill our hearts with yaqeen that cannot be shaken.`,

    tawakkul: `بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ

Dear brothers and sisters,

The Prophet ﷺ told us: "Tie your camel, then put your trust in Allah." In this one sentence lies the entire philosophy of Tawakkul.

Tawakkul is not laziness. It is not abandoning effort. It is the inner peace that comes from knowing that after you have done your best, the outcome belongs to Allah.

وَمَن يَتَوَكَّلْ عَلَى اللَّهِ فَهُوَ حَسْبُهُ

"Whoever puts their trust in Allah — He is sufficient for them." (At-Talaq 65:3)

Study for your exam, then trust Allah with the result. Apply for the job, then trust Allah with the outcome. Take your medicine, then trust Allah with your healing.

The birds leave their nests each morning with empty stomachs and return full. They do not sit idle — they go out and seek. But they trust that Allah will provide.

Let us be people of both effort and trust. This is the balanced path of Islam.

May Allah make us among the Mutawakkileen.`,

    gentleness: `بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ

All praise to Allah who sent His Messenger as a mercy to mankind.

Brothers and sisters,

Our Prophet Muhammad ﷺ was described by Allah Himself:

فَبِمَا رَحْمَةٍ مِّنَ اللَّهِ لِنتَ لَهُمْ

"It was by the mercy of Allah that you were gentle with them." (Aal Imran 3:159)

In a world that rewards harshness, aggression, and dominance, the Sunnah teaches us that true strength lies in gentleness.

The Prophet ﷺ said: "Gentleness is not found in anything except that it beautifies it, and it is not removed from anything except that it makes it ugly."

This applies to our marriages, our parenting, our work relationships, our community interactions, and even how we speak about those who disagree with us.

When Aisha رضي الله عنها was insulted by some people, the Prophet ﷺ did not respond with anger. He responded with calm and taught her to respond with patience.

Let us carry this prophetic gentleness into every room we enter.`,

    mercy: `بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ

وَمَا أَرْسَلْنَاكَ إِلَّا رَحْمَةً لِّلْعَالَمِينَ

"We have not sent you except as a mercy to the worlds." (Al-Anbiya 21:107)

Brothers and sisters, mercy is not weakness — it is the very essence of our religion. Every chapter of the Quran begins with "In the name of Allah, the Most Merciful, the Especially Merciful."

The Prophet ﷺ said: "Be merciful to those on earth, and the One above the heavens will be merciful to you."

Mercy in Islam extends to everything — to children, to the elderly, to animals, to the environment, to those who wrong us.

Let us ask ourselves: when was the last time we showed mercy to someone who didn't deserve it? That is the prophetic standard.`,

    sunnah: `بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ

Brothers and sisters,

The Sunnah is not merely a collection of historical practices — it is a living, breathing guide for every moment of our day.

From the way we eat (with the right hand, saying Bismillah), to how we greet (with Salam), to how we sleep (on the right side, reciting the evening adhkar) — the Prophet ﷺ left us a complete system of living.

In our modern world, we often think these small acts are insignificant. But it is precisely in these small, daily practices that our faith is built and sustained. The Sunnah turns routine into worship.

Let us revive a Sunnah this week. Pick one practice you have neglected, and bring it back to life.`,

    forgiveness: `بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ

Brothers and sisters,

أَلَا تُحِبُّونَ أَن يَغْفِرَ اللَّهُ لَكُمْ

"Would you not like that Allah should forgive you?" (An-Nur 24:22)

This powerful question was revealed when Abu Bakr رضي الله عنه considered cutting off support to a relative who had slandered his daughter Aisha. Allah reminded him: if you want My forgiveness, you must forgive others.

Forgiveness is the Prophet's greatest strength. On the day of the conquest of Makkah, he stood before the very people who had tortured him, expelled him, killed his companions — and he said: "Go, you are free."

Carrying grudges is heavy. It poisons the heart. Forgiveness is not saying what happened was okay — it is freeing yourself from the weight of bitterness.

Who do you need to forgive today?`,

    diseases: `بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ

Brothers and sisters,

The Prophet ﷺ said: "Beware, in the body there is a piece of flesh; if it is sound, the whole body is sound, and if it is corrupt, the whole body is corrupt. Verily, it is the heart."

The diseases of the heart — hasad (envy), kibr (arrogance), riya (showing off), ghadab (uncontrolled anger) — these are more dangerous than any physical illness, because they destroy our connection with Allah.

We may pray five times a day, fast in Ramadan, and give charity — but if our hearts harbor resentment, jealousy, or pride, our worship is diminished.

The first step to healing is recognition. Let us examine our hearts honestly today.`,

    envy: `بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ

Brothers and sisters,

Envy was the first sin that caused destruction — Iblis envied Adam, and Qabil envied Habil. The Prophet ﷺ warned: "Do not envy one another."

The cure for envy is gratitude. When you see someone blessed with something, say "MashaAllah, Allahumma barik" — and then look at your own blessings. You will find that Allah has given you abundantly in ways you have stopped noticing.

Make a habit: every night before sleep, name five blessings. Gratitude starves envy.`,

    humility: `بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ

Brothers and sisters,

The Prophet ﷺ said: "No one who has an atom's weight of arrogance in their heart will enter Paradise."

Humility before Allah means recognizing that every talent, every achievement, every breath is from Him. And humility before creation means treating every person — the janitor, the CEO, the child — with equal dignity.

The Prophet ﷺ mended his own shoes, served his family, and sat with the poor. This is our standard.`,

    dhikr: `بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ

Brothers and sisters,

أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ

"Verily, in the remembrance of Allah do hearts find rest." (Ar-Ra'd 13:28)

In an age of anxiety, the prescription is ancient and simple: remember Allah often. SubhanAllah, Alhamdulillah, Allahu Akbar, La ilaha illallah — these are not just words. They are the medicine for restless hearts.

The Prophet ﷺ made dhikr constantly — while walking, while waiting, while lying down. Let us bring this practice back into our daily rhythm.`,

    marriage: `بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ

Brothers and sisters,

وَمِنْ آيَاتِهِ أَنْ خَلَقَ لَكُم مِّنْ أَنفُسِكُمْ أَزْوَاجًا لِّتَسْكُنُوا إِلَيْهَا وَجَعَلَ بَيْنَكُم مَّوَدَّةً وَرَحْمَةً

"And among His signs is that He created for you mates from among yourselves, that you may find tranquility in them, and He placed between you affection and mercy." (Ar-Rum 30:21)

Marriage in Islam is described as a sign of Allah — not merely a contract, but a sacred bond designed for peace, love, and mercy.

The Prophet ﷺ said: "The best of you are those who are best to their families." Our marriages are the first place our faith is tested and demonstrated.`,

    parenting: `بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ

Brothers and sisters,

Our children are an amanah — a trust from Allah. They do not belong to us; they are entrusted to us for a time.

The Prophet ﷺ was the most loving father. He would extend his sujood because his grandson was on his back. He kissed his children openly and was shocked when a man told him he had ten children and had never kissed any of them.

Raising children with purpose means giving them roots in faith and wings of confidence. It means being present, not just providing.`,

    parents: `بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ

وَقَضَىٰ رَبُّكَ أَلَّا تَعْبُدُوا إِلَّا إِيَّاهُ وَبِالْوَالِدَيْنِ إِحْسَانًا

"Your Lord has decreed that you worship none but Him, and that you be kind to parents." (Al-Isra 17:23)

Notice — Allah placed kindness to parents immediately after His own worship. This is not coincidence. It is priority.

Brothers and sisters, our parents sacrificed sleep, health, wealth, and years of their lives for us. No amount of service can repay them. But we try — with gentleness, with patience, with du'a.`,

    kinship: `بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ

Brothers and sisters,

The Prophet ﷺ said: "Whoever would like his provision to be increased and his lifespan to be extended, let him maintain family ties."

In our busy world, it is easy to let family connections fade. A cousin we haven't called in months. An aunt we haven't visited in years. These ties are sacred in Islam.

Even if maintaining ties is difficult — even if the other person is cold or distant — the believer takes the first step. That is Silat ar-Rahm.`,

    justice: `بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ

يَا أَيُّهَا الَّذِينَ آمَنُوا كُونُوا قَوَّامِينَ بِالْقِسْطِ

"O you who believe, be persistently standing firm in justice." (An-Nisa 4:135)

Justice in Islam is not optional — it is obligatory. And it does not bend for family, friendship, or self-interest. We must stand for truth even when it is against ourselves.

This is the standard Allah set for the Muslim community — to be witnesses for justice among mankind.`,

    sadaqah: `بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ

Brothers and sisters,

The Prophet ﷺ said: "Charity does not decrease wealth." This is a divine promise.

But sadaqah is more than money. A smile is charity. Removing harm from the road is charity. A kind word is charity. Helping someone carry their groceries is charity.

Let us expand our understanding of generosity beyond the donation box.`,

    oppressed: `بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ

Brothers and sisters,

The Prophet ﷺ said: "Help your brother, whether he is an oppressor or oppressed." They asked: "How do we help an oppressor?" He said: "By preventing him from oppressing."

Islam demands that we do not remain silent in the face of injustice. Silence is complicity. Speaking truth to power is an act of worship.

May Allah give us the courage to stand with every oppressed soul, regardless of their color, nationality, or religion.`,

    wealth: `بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ

Brothers and sisters,

Wealth is not evil in Islam — but attachment to it is. Money is a tool, not a goal. It is a means of doing good, not an end in itself.

The Prophet ﷺ said: "The son of Adam says 'My wealth, my wealth.' But what is your wealth except what you eat and consume, wear and wear out, or give in charity and send forward?"

Let us earn halal, spend wisely, and give generously — knowing that what we send ahead is what truly belongs to us.`,

    quran_companion: `بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ

Brothers and sisters,

وَلَقَدْ يَسَّرْنَا الْقُرْآنَ لِلذِّكْرِ فَهَلْ مِن مُّدَّكِرٍ

"We have made the Quran easy for remembrance — so is there anyone who will remember?" (Al-Qamar 54:17)

The Quran is not just a book to be placed on the highest shelf and opened occasionally. It is meant to be a daily companion — the first voice you hear in the morning and the last before sleep.

The Prophet ﷺ said: "The best of you are those who learn the Quran and teach it."

Let us commit to even one page a day. Consistency over quantity.`,

    tadabbur: `بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ

Brothers and sisters,

أَفَلَا يَتَدَبَّرُونَ الْقُرْآنَ أَمْ عَلَىٰ قُلُوبٍ أَقْفَالُهَا

"Do they not reflect upon the Quran, or are there locks upon their hearts?" (Muhammad 47:24)

Reciting the Quran is beautiful. But reflecting on it — tadabbur — is transformative. It means pausing at each verse and asking: what is Allah saying to me? How does this apply to my life today?

One verse reflected upon deeply is worth more than rushing through entire juz without thought.`,

    prophets: `بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ

Brothers and sisters,

The Quran dedicates a significant portion to the stories of the Prophets — not as entertainment, but as lessons.

In Yusuf عليه السلام we learn patience through injustice. In Ayyub عليه السلام we learn endurance through suffering. In Ibrahim عليه السلام we learn sacrifice for truth. In Musa عليه السلام we learn courage before tyranny.

These are not ancient tales — they are mirrors for our own struggles today.`,

    ethics: `بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ

Brothers and sisters,

How many of us live the Quran at work? Do we apply honesty in our dealings? Do we avoid riba in our transactions? Do we treat our employees and colleagues with the justice the Quran demands?

Islam does not separate the spiritual from the professional. Every honest transaction is worship. Every fair dealing is sadaqah. Every kept promise is a reflection of iman.`,

    brotherhood: `بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ

إِنَّمَا الْمُؤْمِنُونَ إِخْوَةٌ

"The believers are but brothers." (Al-Hujurat 49:10)

Brothers and sisters,

This brotherhood is not based on ethnicity, language, or nationality. It is based on La ilaha illallah. The Arab and the non-Arab, the rich and the poor, the scholar and the layperson — all are equal before Allah, distinguished only by Taqwa.

The Prophet ﷺ said: "The believers in their mutual kindness, compassion, and sympathy are like one body. When one limb aches, the whole body reacts with sleeplessness and fever."

Are we living this? When our brother in Palestine suffers, do we lose sleep? When our sister in any corner of the world is oppressed, does our heart ache? Brotherhood demands action, not just feelings.`,

    unity: `بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ

وَاعْتَصِمُوا بِحَبْلِ اللَّهِ جَمِيعًا وَلَا تَفَرَّقُوا

"And hold firmly to the rope of Allah all together and do not become divided." (Aal Imran 3:103)

Brothers and sisters, division is the weapon of Shaytan. When we are united, we are strong. When we fracture over petty differences — political opinions, cultural practices, school of fiqh — we weaken the entire Ummah.

Unity does not mean uniformity. We can disagree on matters of ijtihad while remaining one body, praying behind one imam, working toward one goal.`,

    broken_ties: `بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ

Brothers and sisters,

How many relationships in our community are broken? Families that don't speak. Friends who avoid each other at the masjid. Committee members who carry years-old grudges.

The Prophet ﷺ said: "It is not permissible for a Muslim to forsake his brother for more than three days."

Three days. Not three months. Not three years. The standard is clear.

Repairing broken ties requires swallowing pride. It requires being the first to say Salam, even when you feel you were right. This is not weakness — this is the strength of faith.`,

    taqwa: `بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ

يَا أَيُّهَا الَّذِينَ آمَنُوا اتَّقُوا اللَّهَ حَقَّ تُقَاتِهِ وَلَا تَمُوتُنَّ إِلَّا وَأَنتُم مُّسْلِمُونَ

"O you who believe, fear Allah as He should be feared, and do not die except as Muslims." (Aal Imran 3:102)

Brothers and sisters,

Taqwa — God-consciousness — is the single most repeated instruction in the Quran. It is the quality that Allah looks for above all else.

إِنَّ أَكْرَمَكُمْ عِنْدَ اللَّهِ أَتْقَاكُمْ

"The most honored of you in the sight of Allah is the one with the most Taqwa." (Al-Hujurat 49:13)

Taqwa is not just avoiding haram. It is being aware of Allah in every moment — when you are alone and when you are in a crowd. When you are online and when you are offline. When no one is watching and when everyone is.

The Prophet ﷺ said: "Fear Allah wherever you are, follow a bad deed with a good deed and it will erase it, and treat people with good character."

This is the comprehensive formula for a righteous life. Three instructions that cover our relationship with Allah, with ourselves, and with others.

May Allah make us among the people of Taqwa — those who walk this earth with awareness of their Lord in every step.

أَقُولُ قَوْلِي هَذَا وَأَسْتَغْفِرُ اللَّهَ الْعَظِيمَ لِي وَلَكُمْ وَلِسَائِرِ الْمُسْلِمِينَ فَاسْتَغْفِرُوهُ إِنَّهُ هُوَ الْغَفُورُ الرَّحِيمُ`,

    difference: `بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ

Brothers and sisters,

The companions of the Prophet ﷺ disagreed on many matters — but they never allowed those disagreements to divide them. Abu Bakr and Umar رضي الله عنهما had different opinions on many issues, yet their brotherhood was legendary.

Ikhtilaf (scholarly difference) is a mercy when handled with adab. It becomes a curse when it becomes personal, tribal, or political.

Let us learn to say: "I respect your view, even as I hold my own." This is the way of our righteous predecessors.`,

    knowledge: `بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ

هَلْ يَسْتَوِي الَّذِينَ يَعْلَمُونَ وَالَّذِينَ لَا يَعْلَمُونَ

"Are those who know equal to those who do not know?" (Az-Zumar 39:9)

Brothers and sisters,

The very first word revealed to our Prophet ﷺ was "Iqra" — Read. Before Salah was ordained, before Zakat was prescribed, before fasting was commanded — the first instruction was to seek knowledge.

The Prophet ﷺ said: "Seeking knowledge is an obligation upon every Muslim."

This is not limited to religious knowledge. Any knowledge that benefits humanity is valued in Islam — medicine, engineering, technology, education. But all knowledge must be grounded in Taqwa, or it becomes a tool of destruction rather than benefit.`,

    etiquette: `بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ

Brothers and sisters,

Imam Malik رحمه الله would perform wudu, wear his best clothes, and apply perfume before sitting to teach hadith. When asked why, he said: "I am dealing with the words of the Messenger of Allah ﷺ."

The etiquette of seeking knowledge includes humility, patience, consistency, and acting upon what one learns. Knowledge without adab is like a tree without fruit.

Let us be students who honor what we learn by living it.`,
  };

  return contents[topic] || "";
}
