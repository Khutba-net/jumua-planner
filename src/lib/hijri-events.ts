export interface HijriEvent {
  name: string;
  nameAr: string;
  hijriMonth: number;
  hijriDay: number;
  icon: string;
  color: string;
  type: "eid" | "occasion" | "season";
}

const HIJRI_EVENTS: HijriEvent[] = [
  { name: "Islamic New Year", nameAr: "رأس السنة الهجرية", hijriMonth: 1, hijriDay: 1, icon: "auto_awesome", color: "#00666d", type: "occasion" },
  { name: "Ashura", nameAr: "عاشوراء", hijriMonth: 1, hijriDay: 10, icon: "water_drop", color: "#4a7c59", type: "occasion" },
  { name: "Mawlid an-Nabi", nameAr: "المولد النبوي", hijriMonth: 3, hijriDay: 12, icon: "mosque", color: "#2563eb", type: "occasion" },
  { name: "Isra wal Mi'raj", nameAr: "الإسراء والمعراج", hijriMonth: 7, hijriDay: 27, icon: "nights_stay", color: "#6d28d9", type: "occasion" },
  { name: "Sha'ban Mid-Night", nameAr: "ليلة النصف من شعبان", hijriMonth: 8, hijriDay: 15, icon: "dark_mode", color: "#8a5c6e", type: "occasion" },
  { name: "Ramadan Begins", nameAr: "بداية رمضان", hijriMonth: 9, hijriDay: 1, icon: "nightlight", color: "#C4A35A", type: "season" },
  { name: "Laylat al-Qadr", nameAr: "ليلة القدر", hijriMonth: 9, hijriDay: 27, icon: "star", color: "#C4A35A", type: "occasion" },
  { name: "Eid al-Fitr", nameAr: "عيد الفطر", hijriMonth: 10, hijriDay: 1, icon: "celebration", color: "#C4A35A", type: "eid" },
  { name: "Day of Arafah", nameAr: "يوم عرفة", hijriMonth: 12, hijriDay: 9, icon: "landscape", color: "#00666d", type: "occasion" },
  { name: "Eid al-Adha", nameAr: "عيد الأضحى", hijriMonth: 12, hijriDay: 10, icon: "celebration", color: "#C4A35A", type: "eid" },
];

export interface ResolvedHijriEvent extends HijriEvent {
  gregorianDate: Date;
  dateStr: string;
}

function gregorianToHijri(date: Date): { month: number; day: number; year: number } | null {
  try {
    const parts = new Intl.DateTimeFormat("en-US-u-ca-islamic-umalqura", {
      day: "numeric",
      month: "numeric",
      year: "numeric",
    }).formatToParts(date);

    const month = Number(parts.find((p) => p.type === "month")?.value);
    const day = Number(parts.find((p) => p.type === "day")?.value);
    const year = Number(parts.find((p) => p.type === "year")?.value);

    if (isNaN(month) || isNaN(day) || isNaN(year)) return null;
    return { month, day, year };
  } catch {
    return null;
  }
}

export function getHijriEventsForYear(gregorianYear: number): ResolvedHijriEvent[] {
  const results: ResolvedHijriEvent[] = [];
  const seen = new Set<string>();

  const start = new Date(gregorianYear, 0, 1);
  const end = new Date(gregorianYear, 11, 31);

  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const hijri = gregorianToHijri(d);
    if (!hijri) continue;

    for (const event of HIJRI_EVENTS) {
      if (hijri.month === event.hijriMonth && hijri.day === event.hijriDay) {
        const key = `${event.name}-${hijri.year}`;
        if (!seen.has(key)) {
          seen.add(key);
          const gregorianDate = new Date(d);
          results.push({
            ...event,
            gregorianDate,
            dateStr: `${gregorianYear}-${String(gregorianDate.getMonth() + 1).padStart(2, "0")}-${String(gregorianDate.getDate()).padStart(2, "0")}`,
          });
        }
      }
    }
  }

  results.sort((a, b) => a.gregorianDate.getTime() - b.gregorianDate.getTime());
  return results;
}

export function getHijriEventsForMonth(gregorianYear: number, month: number): ResolvedHijriEvent[] {
  return getHijriEventsForYear(gregorianYear).filter(
    (e) => e.gregorianDate.getMonth() === month
  );
}

export function isEidDate(dateStr: string): ResolvedHijriEvent | null {
  const year = Number(dateStr.slice(0, 4));
  const events = getHijriEventsForYear(year);
  return events.find((e) => e.dateStr === dateStr && e.type === "eid") ?? null;
}

export function getUpcomingHijriEvents(count: number = 5): ResolvedHijriEvent[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const currentYear = today.getFullYear();

  const events = [
    ...getHijriEventsForYear(currentYear),
    ...getHijriEventsForYear(currentYear + 1),
  ];

  return events
    .filter((e) => e.gregorianDate >= today)
    .slice(0, count);
}

export function getHijriDateString(date: Date): string {
  try {
    return new Intl.DateTimeFormat("en-US-u-ca-islamic-umalqura", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(date);
  } catch {
    return "";
  }
}
