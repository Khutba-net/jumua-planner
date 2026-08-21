import { NextResponse } from "next/server";
import { query, queryOne, exec, cuid, hashPassword, withTransaction } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  return seed();
}

export async function POST() {
  return seed();
}

async function seed() {
  try {
  const userId = "demo-user";

  await exec("DELETE FROM references_ WHERE sermon_id IN (SELECT id FROM sermons WHERE author_id = $1)", [userId]);
  await exec("DELETE FROM feedback WHERE sermon_id IN (SELECT id FROM sermons WHERE author_id = $1)", [userId]);
  await exec("DELETE FROM sermons WHERE author_id = $1", [userId]);
  await exec("DELETE FROM sub_topics WHERE theme_id IN (SELECT id FROM themes WHERE owner_id = $1)", [userId]);
  await exec("DELETE FROM themes WHERE owner_id = $1", [userId]);
  await exec("DELETE FROM user_settings WHERE user_id = $1", [userId]);

  await exec("DELETE FROM users WHERE id = $1", [userId]);
  const demoHash = hashPassword("demo1234");
  await query(
    "INSERT INTO users (id, email, name, password_hash, role, account_type, onboarding_complete) VALUES ($1, $2, $3, $4, $5, $6, $7)",
    [userId, "ahmed@example.com", "Sheikh Ahmed", demoHash, "khatib", "individual", 1]
  );

  await query(
    `INSERT INTO user_settings (user_id, default_language, word_target, editor_font_size) VALUES ($1, $2, $3, $4)
     ON CONFLICT(user_id) DO UPDATE SET default_language = EXCLUDED.default_language, word_target = EXCLUDED.word_target, editor_font_size = EXCLUDED.editor_font_size`,
    [userId, "ar-first", 2500, 18]
  );

  const year = 2026;

  const themes = [
    {
      name: "Foundations of Faith",
      description: "Strengthening Aqeedah, the Prophetic example, and purification of the heart.",
      month: 1, color: "#2563eb",
      subs: ["Tawheed & Sincerity", "The Prophetic Example", "Trust & Reliance", "Purification of the Heart"],
      sermons: [
        { title: "The Beauty of Tawheed in Daily Life", date: "2026-01-02", status: "delivered", content: genContent("tawheed") },
        { title: "Patience in Testing — A Mark of True Faith", date: "2026-01-09", status: "delivered", content: genContent("patience") },
        { title: "Certainty in Allah Amid Uncertainty", date: "2026-01-16", status: "delivered", content: genContent("certainty") },
        { title: "Living with Tawakkul", date: "2026-01-23", status: "delivered", content: genContent("tawakkul") },
        { title: "The Prophet's Gentleness with All People", date: "2026-02-06", status: "delivered", content: genContent("gentleness") },
        { title: "Mercy as a Way of Life", date: "2026-02-13", status: "delivered", content: genContent("mercy") },
        { title: "The Sunnah in Our Modern Routines", date: "2026-02-20", status: "delivered", content: genContent("sunnah") },
        { title: "Forgiveness: The Prophet's Greatest Strength", date: "2026-02-27", status: "delivered", content: genContent("forgiveness") },
        { title: "Recognizing the Diseases of the Heart", date: "2026-03-06", status: "delivered", content: genContent("diseases") },
        { title: "Overcoming Envy with Gratitude", date: "2026-03-13", status: "delivered", content: genContent("envy") },
        { title: "Humility Before Allah and His Creation", date: "2026-03-20", status: "delivered", content: genContent("humility") },
        { title: "The Remembrance of Allah — Medicine for the Soul", date: "2026-03-27", status: "delivered", content: genContent("dhikr") },
      ],
    },
    {
      name: "Family, Justice & Quran",
      description: "Building strong families, standing for justice, and living by the Book of Allah.",
      month: 4, color: "#C4A35A",
      subs: ["Marriage & Family", "Rights & Responsibilities", "Justice & Generosity", "Living by the Quran"],
      sermons: [
        { title: "The Sacred Bond of Marriage in Islam", date: "2026-04-03", status: "delivered", content: genContent("marriage") },
        { title: "Raising Children with Purpose and Love", date: "2026-04-10", status: "delivered", content: genContent("parenting") },
        { title: "Honouring Parents in Word and Deed", date: "2026-04-17", status: "delivered", content: genContent("parents") },
        { title: "Maintaining Family Ties in a Busy World", date: "2026-04-24", status: "delivered", content: genContent("kinship") },
        { title: "Justice as a Pillar of the Muslim Community", date: "2026-05-01", status: "delivered", content: genContent("justice") },
        { title: "The Spirit of Sadaqah Beyond Ramadan", date: "2026-05-08", status: "delivered", content: genContent("sadaqah") },
        { title: "Standing with the Oppressed", date: "2026-05-15", status: "delivered", content: genContent("oppressed") },
        { title: "Wealth as a Trust from Allah", date: "2026-05-22", status: "delivered", content: genContent("wealth") },
        { title: "The Quran as a Companion in Solitude", date: "2026-06-05", status: "delivered", content: genContent("quran_companion") },
        { title: "Reflecting on the Quran with the Heart", date: "2026-06-12", status: "delivered", content: genContent("tadabbur") },
        { title: "Stories of the Prophets — Lessons for Today", date: "2026-06-19", status: "delivered", content: genContent("prophets") },
        { title: "Applying Quranic Ethics in the Workplace", date: "2026-06-26", status: "ready", content: genContent("ethics") },
      ],
    },
    {
      name: "Unity, Knowledge & Worship",
      description: "Strengthening community bonds, pursuing knowledge, and deepening worship.",
      month: 7, color: "#4a7c59",
      subs: ["Community Building", "Reconciliation & Forgiveness", "Seeking Knowledge", "Du'a & Worship"],
      sermons: [
        { title: "Brotherhood as a Shield Against Division", date: "2026-07-03", status: "ready", content: genContent("brotherhood") },
        { title: "Holding Fast to Allah's Rope Together", date: "2026-07-10", status: "ready", content: genContent("unity") },
        { title: "Repairing Broken Ties with Mercy", date: "2026-07-17", status: "ready", content: genContent("broken_ties") },
        { title: "The Importance of Taqwa (God-Consciousness)", date: "2026-07-24", status: "ready", content: genContent("taqwa") },
        { title: "Respecting Difference Without Division", date: "2026-07-31", status: "ready", content: genContent("difference") },
        { title: "The Virtue of Seeking Knowledge", date: "2026-08-07", status: "ready", content: genContent("knowledge") },
        { title: "The Etiquette of the Student and Scholar", date: "2026-08-14", status: "draft", content: genContent("etiquette") },
        { title: "Raising a Generation of Thinkers", date: "2026-08-21", status: "draft", content: "" },
        { title: "Knowledge Without Action", date: "2026-08-28", status: "draft", content: "" },
        { title: "The Etiquette and Power of Du'a", date: "2026-09-04", status: "draft", content: "" },
        { title: "Khushu in Salah — Praying with Presence", date: "2026-09-11", status: "draft", content: "" },
        { title: "The Night Prayer — A Private Audience", date: "2026-09-18", status: "draft", content: "" },
        { title: "Gratitude as Worship", date: "2026-09-25", status: "draft", content: "" },
      ],
    },
    {
      name: "The Hereafter & Modern Life",
      description: "Reflecting on the eternal life, navigating contemporary challenges, and year-end renewal.",
      month: 10, color: "#8a5c6e",
      subs: ["Death & Preparation", "Paradise & Accountability", "Contemporary Challenges", "Reflection & Renewal"],
      sermons: [
        { title: "Remembering Death to Live Fully", date: "2026-10-02", status: "draft", content: "" },
        { title: "Preparing for the Journey No One Escapes", date: "2026-10-09", status: "draft", content: "" },
        { title: "The Scales of Justice on the Day of Judgement", date: "2026-10-16", status: "draft", content: "" },
        { title: "The Promise of Paradise", date: "2026-10-23", status: "draft", content: "" },
        { title: "Social Media and the Muslim Soul", date: "2026-11-06", status: "draft", content: "" },
        { title: "Mental Health — Breaking the Stigma with Islam", date: "2026-11-13", status: "draft", content: "" },
        { title: "Muslim Identity in the West", date: "2026-11-20", status: "draft", content: "" },
        { title: "Raising Youth in a Digital Age", date: "2026-11-27", status: "draft", content: "" },
        { title: "A Year in Review — What Did We Plant?", date: "2026-12-04", status: "draft", content: "" },
        { title: "Repentance — The Door That Never Closes", date: "2026-12-11", status: "draft", content: "" },
        { title: "Setting Spiritual Goals for the Coming Year", date: "2026-12-18", status: "draft", content: "" },
        { title: "Ending the Year with Gratitude to Allah", date: "2026-12-25", status: "draft", content: "" },
      ],
    },
  ];

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

  let totalSermons = 0;
  let totalRefs = 0;

  await withTransaction(async (client) => {
    for (const theme of themes) {
      const themeId = cuid();
      await client.query(
        "INSERT INTO themes (id, name, description, month, year, color, owner_id) VALUES ($1, $2, $3, $4, $5, $6, $7)",
        [themeId, theme.name, theme.description, theme.month, year, theme.color, userId]
      );

      const subIds: string[] = [];
      for (let idx = 0; idx < theme.subs.length; idx++) {
        const subId = cuid();
        subIds.push(subId);
        await client.query(
          "INSERT INTO sub_topics (id, name, week_number, theme_id) VALUES ($1, $2, $3, $4)",
          [subId, theme.subs[idx], idx + 1, themeId]
        );
      }

      const perSub = subIds.length > 0 ? Math.ceil(theme.sermons.length / subIds.length) : 0;
      for (let si = 0; si < theme.sermons.length; si++) {
        const s = theme.sermons[si];
        const sermonId = cuid();
        const updatedAt = s.date + "T12:00:00.000Z";
        const subIdx = Math.min(Math.floor(si / perSub), subIds.length - 1);
        const subTopicId = subIds[subIdx] ?? null;
        await client.query(
          "INSERT INTO sermons (id, title, content, status, scheduled_date, author_id, theme_id, sub_topic_id, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)",
          [sermonId, s.title, s.content, s.status, s.date, userId, themeId, subTopicId, updatedAt]
        );
        totalSermons++;

        for (const [key, refs] of Object.entries(refMap)) {
          if (s.title.includes(key)) {
            for (const r of refs) {
              await client.query(
                "INSERT INTO references_ (id, type, title, source, content, sermon_id) VALUES ($1, $2, $3, $4, $5, $6)",
                [cuid(), r.type, r.title, r.source, r.content, sermonId]
              );
              totalRefs++;
            }
          }
        }
      }
    }
  });

  // Seed khatib user
  const khatibUserId = "demo-khatib";
  await exec("DELETE FROM references_ WHERE sermon_id IN (SELECT id FROM sermons WHERE author_id = $1)", [khatibUserId]);
  await exec("DELETE FROM feedback WHERE sermon_id IN (SELECT id FROM sermons WHERE author_id = $1)", [khatibUserId]);
  await exec("DELETE FROM sermons WHERE author_id = $1", [khatibUserId]);
  await exec("DELETE FROM sub_topics WHERE theme_id IN (SELECT id FROM themes WHERE owner_id = $1)", [khatibUserId]);
  await exec("DELETE FROM themes WHERE owner_id = $1", [khatibUserId]);
  await exec("DELETE FROM user_settings WHERE user_id = $1", [khatibUserId]);
  await exec("DELETE FROM friday_assignments WHERE organization_id IN (SELECT organization_id FROM org_members WHERE user_id = $1)", [khatibUserId]);
  await exec("DELETE FROM org_members WHERE user_id = $1", [khatibUserId]);
  await exec("DELETE FROM users WHERE id = $1", [khatibUserId]);

  const existingOrg = await queryOne<{ id: string; name: string }>("SELECT id, name FROM organizations LIMIT 1");

  if (existingOrg) {
    const khatibHash = hashPassword("khatib123");
    await query(
      "INSERT INTO users (id, email, name, password_hash, role, account_type, organization_id, onboarding_complete, planning_year) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)",
      [khatibUserId, "bilal@example.com", "Sheikh Bilal", khatibHash, "khatib", "organization", existingOrg.id, 1, 2026]
    );

    const khatibMemberId = cuid();
    await query(
      "INSERT INTO org_members (id, organization_id, user_id, name, email, role, status) VALUES ($1, $2, $3, $4, $5, 'khatib', 'active')",
      [khatibMemberId, existingOrg.id, khatibUserId, "Sheikh Bilal", "bilal@example.com"]
    );

    const khatibThemeId = cuid();
    await query(
      "INSERT INTO themes (id, name, description, month, year, color, owner_id) VALUES ($1, $2, $3, $4, $5, $6, $7)",
      [khatibThemeId, "Community & Compassion", "Building bridges and nurturing mercy in our community", 7, 2026, "#2563eb", khatibUserId]
    );

    const khatibSubs = ["Neighborly Love", "Supporting the Vulnerable", "Forgiveness & Reconciliation", "Collective Worship"];
    const kSubIds: string[] = [];
    for (let idx = 0; idx < khatibSubs.length; idx++) {
      const subId = cuid();
      kSubIds.push(subId);
      await query("INSERT INTO sub_topics (id, name, week_number, theme_id) VALUES ($1, $2, $3, $4)", [subId, khatibSubs[idx], idx + 1, khatibThemeId]);
    }

    const kSermons = [
      { title: "The Right of the Neighbor in Islam", date: "2026-07-03", status: "delivered" },
      { title: "Opening Our Doors, Opening Our Hearts", date: "2026-07-10", status: "delivered" },
      { title: "Caring for the Elderly in Our Community", date: "2026-07-17", status: "delivered" },
      { title: "The Power of a Sincere Apology", date: "2026-07-24", status: "ready" },
      { title: "Praying Together: The Strength of Jama'ah", date: "2026-07-31", status: "ready" },
      { title: "When Your Brother Is Hurting", date: "2026-08-07", status: "draft" },
      { title: "Youth and the Masjid — A Home They Choose", date: "2026-08-14", status: "draft" },
      { title: "The Sunnah of Smiling", date: "2026-08-21", status: "draft" },
    ];

    for (let i = 0; i < kSermons.length; i++) {
      const s = kSermons[i];
      const sermonId = cuid();
      const subIdx = Math.min(Math.floor(i / 2), kSubIds.length - 1);
      await query(
        "INSERT INTO sermons (id, title, content, status, scheduled_date, author_id, theme_id, sub_topic_id, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)",
        [sermonId, s.title, s.status === "delivered" ? genContent("brotherhood") : "", s.status, s.date, khatibUserId, khatibThemeId, kSubIds[subIdx], s.date + "T12:00:00.000Z"]
      );
    }

    const now = new Date();
    const day = now.getDay();
    const diff = (5 - day + 7) % 7;
    const thisFri = new Date(now);
    thisFri.setDate(now.getDate() + (diff === 0 ? 0 : diff));

    const fridaysToAssign: string[] = [];
    const f = new Date(thisFri);
    for (let i = 0; i < 4; i++) {
      fridaysToAssign.push(f.toISOString().split("T")[0]);
      f.setDate(f.getDate() + 7);
    }

    await exec("DELETE FROM friday_assignments WHERE organization_id = $1", [existingOrg.id]);

    const guests = ["Sheikh Abdullah", "Imam Hassan"];
    for (let i = 0; i < fridaysToAssign.length; i++) {
      const fd = fridaysToAssign[i];
      if (i % 2 === 0) {
        await query(
          "INSERT INTO friday_assignments (id, organization_id, member_id, friday_date) VALUES ($1, $2, $3, $4)",
          [cuid(), existingOrg.id, khatibMemberId, fd]
        );
      } else {
        await query(
          "INSERT INTO friday_assignments (id, organization_id, member_id, friday_date, guest_name) VALUES ($1, $2, $3, $4, $5)",
          [cuid(), existingOrg.id, null, fd, guests[Math.floor(i / 2)] || "Guest Khatib"]
        );
      }
    }
  }

  return NextResponse.json({
    ok: true,
    message: `Seeded 4 seasonal themes, ${totalSermons} sermons, and ${totalRefs} references. ${existingOrg ? "Also seeded khatib user (bilal@example.com / khatib123) with assignments." : "No org found for khatib seeding."}`,
  });
  } catch (e) {
    console.error("[Seed Error]", e);
    return NextResponse.json({ error: e instanceof Error ? e.message : "Unknown error" }, { status: 500 });
  }
}

function genContent(topic: string): string {
  const contents: Record<string, string> = {
    tawheed: `بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ

إِنَّ الْحَمْدَ لِلَّهِ نَحْمَدُهُ وَنَسْتَعِينُهُ وَنَسْتَغْفِرُهُ

All praise is due to Allah, the Lord of all worlds. We praise Him, seek His help, and ask for His forgiveness. We bear witness that there is no deity worthy of worship except Allah alone, without any partners, and we bear witness that Muhammad is His servant and final messenger.

Dear brothers and sisters in Islam,

Today we reflect on the most fundamental principle of our faith — Tawheed, the absolute Oneness of Allah. This is not merely a theological concept confined to textbooks; it is the very foundation upon which our entire existence should be built.

When we truly internalize Tawheed, it transforms every aspect of our daily life. We wake up knowing that our sustenance is from Allah alone. We go to work knowing that success comes only from Him. We face hardship knowing that relief is in His hands.

Brothers and sisters, let us ask ourselves: does our Tawheed show in how we speak? In how we spend? In how we treat our neighbors? True Tawheed frees us from the slavery of dunya and anchors us to the worship of the One who created us.

May Allah make us among those whose Tawheed is pure, whose worship is sincere, and whose hearts are attached only to Him.

أَقُولُ قَوْلِي هَذَا وَأَسْتَغْفِرُ اللَّهَ لِي وَلَكُمْ`,

    patience: `بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ

All praise belongs to Allah, and may peace and blessings be upon His Messenger Muhammad ﷺ, his family, and his companions.

Brothers and sisters,

Life is a test. Allah tells us clearly in the Quran. Every single one of us is being tested — some with poverty, others with wealth. The question is not whether we will face trials, but how we respond.

Dear community, patience is not passivity. It is not giving up. It is active trust in Allah's wisdom. It is continuing to pray when you feel nothing.

May Allah grant us all beautiful patience — the kind that draws us closer to Him rather than pushing us away.`,

    certainty: `بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ

All praise is due to Allah, the Most Wise, the All-Knowing.

Brothers and sisters in faith,

We live in an age of uncertainty. Yet as believers, we are called to a higher certainty, one that transcends worldly circumstances.

This certainty is built, not born. It comes through the daily practice of turning to Allah in every situation.

May Allah fill our hearts with yaqeen that cannot be shaken.`,

    tawakkul: `بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ

Dear brothers and sisters,

Tawakkul is not laziness. It is not abandoning effort. It is the inner peace that comes from knowing that after you have done your best, the outcome belongs to Allah.

Study for your exam, then trust Allah with the result. Apply for the job, then trust Allah with the outcome.

Let us be people of both effort and trust. This is the balanced path of Islam.

May Allah make us among the Mutawakkileen.`,

    gentleness: `بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ

All praise to Allah who sent His Messenger as a mercy to mankind.

Brothers and sisters,

In a world that rewards harshness, the Sunnah teaches us that true strength lies in gentleness.

Let us carry this prophetic gentleness into every room we enter.`,

    mercy: `بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ

Brothers and sisters, mercy is not weakness — it is the very essence of our religion.

Mercy in Islam extends to everything — to children, to the elderly, to animals, to the environment, to those who wrong us.

Let us ask ourselves: when was the last time we showed mercy to someone who didn't deserve it? That is the prophetic standard.`,

    sunnah: `بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ

Brothers and sisters,

The Sunnah is not merely a collection of historical practices — it is a living, breathing guide for every moment of our day.

In our modern world, we often think these small acts are insignificant. But it is precisely in these small, daily practices that our faith is built and sustained.

Let us revive a Sunnah this week. Pick one practice you have neglected, and bring it back to life.`,

    forgiveness: `بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ

Brothers and sisters,

Forgiveness is the Prophet's greatest strength. On the day of the conquest of Makkah, he stood before the very people who had tortured him and said: "Go, you are free."

Carrying grudges is heavy. It poisons the heart. Forgiveness is not saying what happened was okay — it is freeing yourself from the weight of bitterness.

Who do you need to forgive today?`,

    diseases: `بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ

Brothers and sisters,

The diseases of the heart — hasad, kibr, riya, ghadab — these are more dangerous than any physical illness.

The first step to healing is recognition. Let us examine our hearts honestly today.`,

    envy: `بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ

Brothers and sisters,

The cure for envy is gratitude. When you see someone blessed with something, say "MashaAllah" — and then look at your own blessings.

Make a habit: every night before sleep, name five blessings. Gratitude starves envy.`,

    humility: `بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ

Brothers and sisters,

Humility before Allah means recognizing that every talent, every achievement, every breath is from Him.

The Prophet ﷺ mended his own shoes, served his family, and sat with the poor. This is our standard.`,

    dhikr: `بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ

Brothers and sisters,

In an age of anxiety, the prescription is ancient and simple: remember Allah often.

The Prophet ﷺ made dhikr constantly. Let us bring this practice back into our daily rhythm.`,

    marriage: `بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ

Brothers and sisters,

Marriage in Islam is described as a sign of Allah — not merely a contract, but a sacred bond designed for peace, love, and mercy.`,

    parenting: `بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ

Brothers and sisters,

Our children are an amanah — a trust from Allah. Raising children with purpose means giving them roots in faith and wings of confidence.`,

    parents: `بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ

Brothers and sisters, our parents sacrificed sleep, health, wealth, and years of their lives for us. No amount of service can repay them.`,

    kinship: `بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ

Brothers and sisters,

In our busy world, it is easy to let family connections fade. These ties are sacred in Islam. Even if maintaining ties is difficult, the believer takes the first step.`,

    justice: `بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ

Justice in Islam is not optional — it is obligatory. And it does not bend for family, friendship, or self-interest.`,

    sadaqah: `بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ

Brothers and sisters,

Sadaqah is more than money. A smile is charity. Removing harm from the road is charity. A kind word is charity.

Let us expand our understanding of generosity beyond the donation box.`,

    oppressed: `بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ

Brothers and sisters,

Islam demands that we do not remain silent in the face of injustice. Silence is complicity.

May Allah give us the courage to stand with every oppressed soul.`,

    wealth: `بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ

Brothers and sisters,

Wealth is not evil in Islam — but attachment to it is. Money is a tool, not a goal.

Let us earn halal, spend wisely, and give generously.`,

    quran_companion: `بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ

Brothers and sisters,

The Quran is not just a book to be placed on the highest shelf and opened occasionally. It is meant to be a daily companion.

Let us commit to even one page a day. Consistency over quantity.`,

    tadabbur: `بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ

Brothers and sisters,

Reciting the Quran is beautiful. But reflecting on it — tadabbur — is transformative.

One verse reflected upon deeply is worth more than rushing through entire juz without thought.`,

    prophets: `بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ

Brothers and sisters,

The stories of the Prophets are not ancient tales — they are mirrors for our own struggles today.`,

    ethics: `بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ

Brothers and sisters,

Islam does not separate the spiritual from the professional. Every honest transaction is worship. Every fair dealing is sadaqah.`,

    brotherhood: `بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ

إِنَّمَا الْمُؤْمِنُونَ إِخْوَةٌ

Brothers and sisters,

This brotherhood is not based on ethnicity, language, or nationality. It is based on La ilaha illallah. Are we living this? Brotherhood demands action, not just feelings.`,

    unity: `بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ

Brothers and sisters, division is the weapon of Shaytan. Unity does not mean uniformity. We can disagree on matters of ijtihad while remaining one body.`,

    broken_ties: `بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ

Brothers and sisters,

Repairing broken ties requires swallowing pride. It requires being the first to say Salam, even when you feel you were right.`,

    taqwa: `بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ

Brothers and sisters,

Taqwa — God-consciousness — is the single most repeated instruction in the Quran. It is being aware of Allah in every moment.

May Allah make us among the people of Taqwa.`,

    difference: `بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ

Brothers and sisters,

Ikhtilaf (scholarly difference) is a mercy when handled with adab. It becomes a curse when it becomes personal, tribal, or political.

Let us learn to say: "I respect your view, even as I hold my own."`,

    knowledge: `بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ

Brothers and sisters,

The very first word revealed to our Prophet ﷺ was "Iqra" — Read. Before Salah was ordained, before Zakat was prescribed — the first instruction was to seek knowledge.

All knowledge must be grounded in Taqwa.`,

    etiquette: `بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ

Brothers and sisters,

The etiquette of seeking knowledge includes humility, patience, consistency, and acting upon what one learns.

Let us be students who honor what we learn by living it.`,
  };

  return contents[topic] || "";
}
