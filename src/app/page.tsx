import Link from "next/link";
import WorkspacePreview from "./components/WorkspacePreview";
import Reveal from "./components/Reveal";
import MobileNav from "./components/MobileNav";

export default function LandingPage() {
  return (
    <div className="bg-surface text-ink overflow-x-hidden">
      {/* Navigation */}
      <header className="sticky top-0 w-full z-50 bg-surface/80 backdrop-blur-md">
        <div className="flex justify-between items-center px-5 md:px-12 py-3 gap-3 max-w-[1200px] mx-auto">
          <div className="flex items-center gap-2 shrink-0">
            <svg width="22" height="22" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="1" y="1" width="11" height="11" rx="2" fill="#00666d" opacity="0.9"/>
              <rect x="16" y="1" width="11" height="11" rx="2" fill="#00666d" opacity="0.6"/>
              <rect x="1" y="16" width="11" height="11" rx="2" fill="#00666d" opacity="0.6"/>
              <rect x="16" y="16" width="11" height="11" rx="2" fill="#C4A35A" opacity="0.8"/>
            </svg>
            <h1 className="text-base md:text-lg font-bold text-primary tracking-tight">JumuaPlanner</h1>
          </div>
          <nav className="hidden md:flex items-center gap-8 text-sm">
            <a className="text-primary/70 font-medium hover:text-primary transition-colors" href="#annual-plan">Annual Plan</a>
            <a className="text-primary/70 font-medium hover:text-primary transition-colors" href="#features">Features</a>
            <a className="text-primary/70 font-medium hover:text-primary transition-colors" href="#how">How It Works</a>
            <a className="text-primary/70 font-medium hover:text-primary transition-colors" href="#pricing">Pricing</a>
          </nav>
          <div className="flex items-center gap-4">
            <Link href="/auth/login" className="text-sm text-primary/70 font-medium hover:text-primary transition-colors shrink-0">Sign in</Link>
            <MobileNav />
          </div>
        </div>
      </header>

      <main>
        {/* Hero — Lead with the outcome */}
        <section className="relative min-h-[600px] md:min-h-[750px] flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0 z-0">
            <img
              alt="Hassan II Mosque Watercolor Illustration"
              className="w-full h-full object-cover object-center"
              src="/hero-mosque.jpg"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-cream-bg/25 via-cream-bg/15 to-cream-bg/45" />
          </div>
          <div
            className="relative z-10 w-full max-w-3xl mx-auto px-5 md:px-8 py-12 md:py-24 flex flex-col items-center text-center"
            style={{ textShadow: "0 1px 14px rgba(250,247,242,0.85), 0 1px 3px rgba(250,247,242,0.7)" }}
          >
            <h2 className="text-4xl sm:text-5xl md:text-7xl font-extrabold text-primary mb-6 leading-tight">
              52 Fridays. Four Seasons.<br />One Annual Plan.
            </h2>
            <p className="font-[var(--font-arabic)] text-xl md:text-2xl text-secondary font-bold mb-6 leading-relaxed">
              خطط لعامك كاملاً من خطب الجمعة بوضوح وإتقان
            </p>
            <p className="text-lg text-ink/90 font-medium mb-10 max-w-2xl mx-auto">
              JumuaPlanner helps you design a full year of purposeful khutbahs, from annual themes to weekly delivery. Walk into every Jumu&apos;ah prepared, not improvising.
            </p>
            <div className="flex justify-center">
              <Link href="/auth/signup" className="bg-primary text-white px-10 py-4 rounded-full font-bold text-lg shadow-lg hover:shadow-xl transition-all hover:scale-105 active:scale-95">
                Start Planning Your Year
              </Link>
            </div>
          </div>
        </section>

        {/* The objective — a single Apple-style statement that reveals on scroll */}
        <section id="annual-plan" className="py-16 md:py-48 px-5 md:px-8 bg-white scroll-mt-20 overflow-hidden">
          <div className="max-w-4xl mx-auto text-center">
            <Reveal>
              <h2 className="text-4xl sm:text-6xl md:text-7xl font-bold text-ink tracking-[-0.03em] leading-[1.08]">
                One main theme per season.<br />
                Four sub-bouquets per theme.<br />
                <span className="text-primary">Every Friday, titled.</span>
              </h2>
            </Reveal>
            <Reveal delay={140}>
              <p className="mt-7 text-lg md:text-2xl text-ink/55 max-w-2xl mx-auto leading-relaxed">
                Four seasons. Four sub-bouquets under each main theme. A content chart for every khutbah — around fifteen minutes, prepared and documented, never improvised.
              </p>
            </Reveal>
            <Reveal delay={260}>
              <div className="mt-10 md:mt-12">
                <Link href="/themes" className="inline-flex items-center gap-2 bg-primary text-white font-bold px-8 py-3.5 rounded-full hover:bg-secondary transition-all group active:scale-95">
                  Build your annual plan <span className="material-symbols-outlined transition-transform group-hover:translate-x-1">arrow_forward</span>
                </Link>
              </div>
            </Reveal>
          </div>
        </section>

        {/* Interface Preview — what you get */}
        <WorkspacePreview />

        {/* How It Works — Zigzag path */}
        <section id="how" className="py-16 md:py-24 px-5 md:px-20 bg-surface overflow-hidden scroll-mt-20">
          <div className="text-center max-w-4xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-5xl md:text-6xl font-bold text-ink tracking-[-0.02em] leading-[1.08] mb-5">From Main Theme to Minbar</h2>
            <p className="text-lg md:text-xl text-ink/50">Choose your seasons, title every Friday, then prepare each khutbah with a content chart.</p>
          </div>

          <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-10">
            {/* Choose seasons */}
            <div>
              <span className="material-symbols-outlined text-primary text-3xl mb-5 block">palette</span>
              <h3 className="text-xl font-bold text-ink mb-3">Choose Your Main Themes</h3>
              <p className="text-mute text-sm leading-relaxed mb-5">Split the year into seasons and give each one a direction. Faith, family, justice, community — a roadmap your congregation will feel.</p>
              <div className="space-y-2">
                <div className="flex items-center gap-2.5"><div className="w-2 h-2 rounded-full bg-[#00666d]" /><span className="text-xs text-ink/70">Jan–Mar · Foundations of Faith</span></div>
                <div className="flex items-center gap-2.5"><div className="w-2 h-2 rounded-full bg-[#C4A35A]" /><span className="text-xs text-ink/70">Apr–Jun · Family &amp; Society</span></div>
                <div className="flex items-center gap-2.5"><div className="w-2 h-2 rounded-full bg-[#4a7c59]" /><span className="text-xs text-ink/70">Jul–Sep · Unity &amp; Knowledge</span></div>
                <div className="flex items-center gap-2.5"><div className="w-2 h-2 rounded-full bg-[#5b7fa6]" /><span className="text-xs text-ink/70">Oct–Dec · The Hereafter</span></div>
              </div>
            </div>

            {/* Title every Friday */}
            <div>
              <span className="material-symbols-outlined text-primary text-3xl mb-5 block">event_note</span>
              <h3 className="text-xl font-bold text-ink mb-3">Title Every Friday</h3>
              <p className="text-mute text-sm leading-relaxed mb-5">Break each season into sub-bouquets, then assign titles. Every Friday of the year gets a name with purpose.</p>
              <div className="space-y-2">
                <div className="flex items-center gap-2.5 text-xs"><span className="text-ink/40 w-10 shrink-0">Jan 3</span><span className="text-ink/70">The Beauty of Tawheed</span></div>
                <div className="flex items-center gap-2.5 text-xs"><span className="text-ink/40 w-10 shrink-0">Jan 10</span><span className="text-ink/70">Patience in Testing</span></div>
                <div className="flex items-center gap-2.5 text-xs"><span className="text-ink/40 w-10 shrink-0">Jan 17</span><span className="text-ink/70">Certainty in Allah</span></div>
                <div className="flex items-center gap-2.5 text-xs"><span className="text-ink/40 w-10 shrink-0">Jan 24</span><span className="text-ink/70">Living with Tawakkul</span></div>
              </div>
            </div>

            {/* Write & deliver */}
            <div>
              <span className="material-symbols-outlined text-accent-gold text-3xl mb-5 block">mosque</span>
              <h3 className="text-xl font-bold text-ink mb-3">Prepare &amp; Deliver</h3>
              <p className="text-mute text-sm leading-relaxed mb-5">Each week, draft in Arabic and English, add your references, and walk in ready. No scrambling, no last-minute outlines.</p>
              <div className="space-y-2">
                <div className="flex items-center gap-2.5 text-xs"><span className="material-symbols-outlined text-ink/30 text-sm">edit_note</span><span className="text-ink/70">Draft your khutbah</span></div>
                <div className="flex items-center gap-2.5 text-xs"><span className="material-symbols-outlined text-ink/30 text-sm">menu_book</span><span className="text-ink/70">Add Quran &amp; Hadith references</span></div>
                <div className="flex items-center gap-2.5 text-xs"><span className="material-symbols-outlined text-ink/30 text-sm">checklist</span><span className="text-ink/70">Readiness checklist</span></div>
                <div className="flex items-center gap-2.5 text-xs"><span className="material-symbols-outlined text-accent-gold text-sm">event_available</span><span className="text-accent-gold">Deliver with confidence</span></div>
              </div>
            </div>
          </div>

        </section>

        {/* Organization Plan Feature */}
        <section className="bg-white px-5 md:px-8 py-16 md:py-40 overflow-hidden">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl sm:text-5xl md:text-6xl font-bold text-ink tracking-[-0.02em] leading-[1.08] mb-6">
              Built for the whole masjid.<br />
              <span className="text-primary">Not just one khatib.</span>
            </h2>
            <p className="text-lg md:text-xl text-ink/50 max-w-2xl mx-auto leading-relaxed mb-14">
              Multiple khatibs, one shared annual plan. Each one prepares their own khutbah, follows the same seasonal roadmap, and collaborates securely with the team.
            </p>
            <div className="flex flex-col items-center gap-3 md:flex-row md:flex-wrap md:justify-center md:gap-x-10 md:gap-y-4 text-sm text-ink/70">
              <span>Up to 20 khatib accounts</span>
              <span className="hidden md:inline text-ink/20">|</span>
              <span>Moderator review</span>
              <span className="hidden md:inline text-ink/20">|</span>
              <span>Shared khutbah bank</span>
              <span className="hidden md:inline text-ink/20">|</span>
              <span>Rotation scheduling</span>
              <span className="hidden md:inline text-ink/20">|</span>
              <span>Resource library</span>
            </div>
          </div>
        </section>


        {/* Pricing */}
        <section id="pricing" className="py-16 md:py-40 px-5 md:px-8 bg-surface scroll-mt-20 overflow-hidden">
          <div className="max-w-4xl mx-auto text-center mb-10 md:mb-20">
            <h2 className="text-3xl sm:text-5xl md:text-6xl font-bold text-ink tracking-[-0.02em] leading-[1.08] mb-5">
              Simple, honest pricing.
            </h2>
            <p className="text-lg text-ink/50">Choose the plan that fits your mosque&apos;s size and mission.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-line/40 max-w-4xl mx-auto">
            {/* Individual */}
            <div className="bg-surface p-8 md:p-10 flex flex-col">
              <p className="text-xs font-bold text-ink/40 uppercase tracking-widest mb-4">Individual</p>
              <p className="text-4xl font-bold text-ink mb-1">$9 <span className="text-base font-normal text-ink/40">/mo</span></p>
              <p className="text-sm text-ink/50 mb-8">For solo khatibs planning their year</p>
              <ul className="space-y-3 mb-10 flex-1 text-sm text-ink/70">
                <li>Full annual planning</li>
                <li>Arabic + English editor</li>
                <li>Friday calendar</li>
                <li>Reference library</li>
              </ul>
              <Link href="/auth/signup" className="w-full py-3 rounded-full border border-ink/15 text-ink font-semibold hover:border-ink/30 transition-all text-center text-sm">Get started</Link>
            </div>
            {/* Organization */}
            <div className="bg-white p-8 md:p-10 flex flex-col relative">
              <p className="text-xs font-bold text-primary uppercase tracking-widest mb-4">Organization</p>
              <p className="text-4xl font-bold text-ink mb-1">$49 <span className="text-base font-normal text-ink/40">/mo</span></p>
              <p className="text-sm text-ink/50 mb-8">For mosques with multiple khatibs</p>
              <ul className="space-y-3 mb-10 flex-1 text-sm text-ink/70">
                <li>Everything in Individual</li>
                <li>Up to 20 khatib accounts</li>
                <li>Moderator review tools</li>
                <li>Shared khutbah bank</li>
              </ul>
              <Link href="/auth/signup" className="w-full py-3 rounded-full bg-primary text-white font-semibold hover:bg-secondary transition-all text-center text-sm">Get started</Link>
            </div>
            {/* Network */}
            <div className="bg-surface p-8 md:p-10 flex flex-col">
              <p className="text-xs font-bold text-ink/40 uppercase tracking-widest mb-4">Network</p>
              <p className="text-4xl font-bold text-ink mb-1">Custom</p>
              <p className="text-sm text-ink/50 mb-8">For multi-mosque networks</p>
              <ul className="space-y-3 mb-10 flex-1 text-sm text-ink/70">
                <li>Everything in Organization</li>
                <li>100+ khatib accounts</li>
                <li>Multiple org groups</li>
                <li>Priority support</li>
              </ul>
              <button className="w-full py-3 rounded-full border border-ink/15 text-ink font-semibold hover:border-ink/30 transition-all text-sm">Contact sales</button>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="bg-primary px-5 md:px-[120px] py-16 md:py-20">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Your Year Starts Here</h2>
            <p className="text-white/70 text-lg mb-8">Set your themes, title every Friday, prepare every khutbah. About 30 minutes to plan — and it carries you through the entire year.</p>
            <Link href="/auth/signup" className="bg-white text-primary px-10 py-4 rounded-full font-bold text-lg shadow-lg hover:shadow-xl transition-all hover:scale-105 active:scale-95 inline-block">
              Get Started Free
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-surface w-full border-t border-line px-5 md:px-20 py-8 md:py-12">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex flex-col items-center md:items-start gap-4">
            <div className="text-2xl font-bold text-primary tracking-tight">JumuaPlanner</div>
            <p className="text-mute text-center md:text-left">Built for mosque administration</p>
          </div>
          <nav className="flex flex-wrap justify-center gap-x-8 gap-y-4">
            <a className="text-xs font-bold uppercase tracking-widest text-mute hover:text-primary transition-all" href="#">Privacy</a>
            <a className="text-xs font-bold uppercase tracking-widest text-mute hover:text-primary transition-all" href="#">Terms</a>
            <a className="text-xs font-bold uppercase tracking-widest text-mute hover:text-primary transition-all" href="#">Support</a>
            <a className="text-xs font-bold uppercase tracking-widest text-mute hover:text-primary transition-all" href="#">Status</a>
          </nav>
          <div className="flex gap-4">
            <a className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary hover:bg-primary hover:text-white transition-all" href="#">
              <span className="material-symbols-outlined text-lg">share</span>
            </a>
            <a className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary hover:bg-primary hover:text-white transition-all" href="#">
              <span className="material-symbols-outlined text-lg">public</span>
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
