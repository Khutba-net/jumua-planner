import { NextResponse } from "next/server";
import { db, cuid } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST() {
  const userId = "demo-user";
  const year = 2026;

  // Clear existing data for clean seed
  db.prepare("DELETE FROM sermons WHERE author_id = ?").run(userId);
  db.prepare(`DELETE FROM sub_topics WHERE theme_id IN (SELECT id FROM themes WHERE owner_id = ?)`).run(userId);
  db.prepare("DELETE FROM themes WHERE owner_id = ?").run(userId);

  const data = [
    {
      name: "Aqeedah & Faith",
      description: "Foundations of belief, Tawheed, and strengthening conviction in Allah.",
      month: 1, color: "#5b7fa6",
      subs: [
        {
          name: "Tawheed & Sincerity",
          fridays: [
            { title: "The beauty of Tawheed", date: "2026-01-02", status: "ready" },
            { title: "Patience in testing — a mark of faith", date: "2026-01-09", status: "ready" },
          ],
        },
        {
          name: "Trust in Allah",
          fridays: [
            { title: "Certainty in God and daily life", date: "2026-01-16", status: "ready" },
            { title: "Living with trust in Allah", date: "2026-01-23", status: "ready" },
            { title: "The beauty of Allah's names", date: "2026-02-06", status: "delivered" },
            { title: "Mercy in relationship", date: "2026-02-13", status: "ready" },
          ],
        },
        {
          name: "Qadr & Divine Wisdom",
          fridays: [
            { title: "Understanding qadr with humility", date: "2026-03-06", status: "ready" },
            { title: "Patience in Allah's decree", date: "2026-03-13", status: "ready" },
            { title: "Reliance through action", date: "2026-03-20", status: "ready" },
          ],
        },
      ],
    },
    {
      name: "Morals & Purification",
      description: "Developing noble character and purifying the soul through Islamic ethics.",
      month: 4, color: "#C4A35A",
      subs: [
        {
          name: "Truthfulness & Integrity",
          fridays: [
            { title: "Truthfulness in speech", date: "2026-04-03", status: "ready" },
            { title: "Integrity beyond appearance", date: "2026-04-10", status: "ready" },
            { title: "Honesty at work and worship", date: "2026-04-17", status: "ready" },
            { title: "Keeping promises sincerely", date: "2026-04-24", status: "ready" },
          ],
        },
        {
          name: "Self-Purification & Patience",
          fridays: [
            { title: "Patience in trials", date: "2026-05-01", status: "ready" },
            { title: "Steadfastness after hardship", date: "2026-05-08", status: "ready" },
            { title: "Examining the heart", date: "2026-06-05", status: "in_review" },
            { title: "Renewing intentions for Allah", date: "2026-06-26", status: "draft" },
          ],
        },
      ],
    },
    {
      name: "Unity & Brotherhood",
      description: "Strengthening the bonds of the ummah and fostering community solidarity.",
      month: 7, color: "#4a7c59",
      subs: [
        {
          name: "Repairing Broken Ties",
          fridays: [
            { title: "Brotherhood as a shield against division", date: "2026-07-03", status: "in_review" },
            { title: "Holding fast to Allah's rope together", date: "2026-07-10", status: "in_review" },
            { title: "Repairing broken ties with mercy", date: "2026-07-17", status: "draft" },
            { title: "Respecting difference without separation", date: "2026-07-24", status: "draft" },
          ],
        },
        {
          name: "Cooperation & Community",
          fridays: [
            { title: "Unity in speech and action", date: "2026-08-07", status: "draft" },
            { title: "Building trust across the Ummah", date: "2026-09-04", status: "draft" },
            { title: "Avoiding hurtful speech and gossip", date: "2026-09-11", status: "draft" },
            { title: "Choosing reconciliation over separation", date: "2026-09-25", status: "draft" },
          ],
        },
      ],
    },
    {
      name: "The Hereafter & Asceticism",
      description: "Reflecting on the afterlife and cultivating detachment from worldly excess.",
      month: 10, color: "#8a5c6e",
      subs: [
        {
          name: "Death & the Barzakh",
          fridays: [
            { title: "Remembering the inevitability of death", date: "2026-10-02", status: "draft" },
            { title: "Preparing for the afterlife today", date: "2026-10-09", status: "draft" },
            { title: "The reality of Barzakh", date: "2026-10-16", status: "draft" },
            { title: "Living with Allah in view", date: "2026-10-23", status: "draft" },
          ],
        },
        {
          name: "Zuhd & Contentment",
          fridays: [
            { title: "Simplicity in a busy world", date: "2026-11-06", status: "draft" },
            { title: "Short hopes in eternity's light", date: "2026-11-13", status: "draft" },
            { title: "The promise of Paradise", date: "2026-12-04", status: "draft" },
            { title: "Living with the Hereafter in view", date: "2026-12-25", status: "draft" },
          ],
        },
      ],
    },
  ];

  const insertTheme = db.prepare(
    "INSERT INTO themes (id, name, description, month, year, color, owner_id) VALUES (?, ?, ?, ?, ?, ?, ?)"
  );
  const insertSub = db.prepare(
    "INSERT INTO sub_topics (id, name, week_number, theme_id) VALUES (?, ?, ?, ?)"
  );
  const insertSermon = db.prepare(
    "INSERT INTO sermons (id, title, status, scheduled_date, author_id, theme_id, sub_topic_id) VALUES (?, ?, ?, ?, ?, ?, ?)"
  );

  for (const theme of data) {
    const themeId = cuid();
    insertTheme.run(themeId, theme.name, theme.description, theme.month, year, theme.color, userId);

    theme.subs.forEach((sub, subIdx) => {
      const subId = cuid();
      insertSub.run(subId, sub.name, subIdx + 1, themeId);

      for (const fri of sub.fridays) {
        const sermonId = cuid();
        insertSermon.run(sermonId, fri.title, fri.status, fri.date, userId, themeId, null);
      }
    });
  }

  return NextResponse.json({ ok: true, message: "Seeded 4 themes with sub-themes and 33 sermons" });
}
