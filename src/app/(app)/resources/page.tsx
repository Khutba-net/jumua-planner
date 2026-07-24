"use client";

export default function ResourcesPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-16 text-center">
      <div className="w-16 h-16 mx-auto mb-6 bg-primary/10 flex items-center justify-center">
        <span className="material-symbols-outlined text-3xl text-primary">menu_book</span>
      </div>
      <h1 className="text-2xl font-bold text-ink mb-2">Resources</h1>
      <p className="text-mute text-sm mb-8">
        A curated library of Quranic references, hadith collections, and sermon inspiration — built for khatibs.
      </p>
      <div className="inline-flex items-center gap-2 bg-accent-gold/10 text-accent-gold px-4 py-2 text-sm font-semibold">
        <span className="material-symbols-outlined text-lg">construction</span>
        Coming soon
      </div>
      <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-px bg-line border border-line">
        <div className="bg-white p-6">
          <span className="material-symbols-outlined text-2xl text-primary/40 mb-3 block">auto_stories</span>
          <h3 className="text-sm font-bold text-ink mb-1">Quran & Hadith</h3>
          <p className="text-xs text-mute">Search references by topic, surah, or keyword</p>
        </div>
        <div className="bg-white p-6">
          <span className="material-symbols-outlined text-2xl text-primary/40 mb-3 block">lightbulb</span>
          <h3 className="text-sm font-bold text-ink mb-1">Sermon ideas</h3>
          <p className="text-xs text-mute">Topic prompts and outlines to spark your next khutbah</p>
        </div>
        <div className="bg-white p-6">
          <span className="material-symbols-outlined text-2xl text-primary/40 mb-3 block">bookmark</span>
          <h3 className="text-sm font-bold text-ink mb-1">Saved collection</h3>
          <p className="text-xs text-mute">Bookmark references and notes for quick access</p>
        </div>
      </div>
    </div>
  );
}
