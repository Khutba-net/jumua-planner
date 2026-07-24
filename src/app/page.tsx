import Link from "next/link";
import WorkspacePreview from "./components/WorkspacePreview";

export default function LandingPage() {
  return (
    <div className="bg-surface text-ink overflow-x-hidden">
      {/* Navigation */}
      <header className="sticky top-0 w-full z-50 bg-surface/80 backdrop-blur-md border-b border-line/30 shadow-sm">
        <div className="flex justify-between items-center px-4 md:px-[120px] py-3 md:py-4 gap-3">
          <div className="flex items-center gap-2 md:gap-4 shrink-0">
            <svg width="24" height="24" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg" className="md:w-7 md:h-7 shrink-0">
              <rect x="1" y="1" width="11" height="11" rx="2" fill="#00666d" opacity="0.9"/>
              <rect x="16" y="1" width="11" height="11" rx="2" fill="#00666d" opacity="0.6"/>
              <rect x="1" y="16" width="11" height="11" rx="2" fill="#00666d" opacity="0.6"/>
              <rect x="16" y="16" width="11" height="11" rx="2" fill="#C4A35A" opacity="0.8"/>
            </svg>
            <h1 className="text-lg md:text-2xl font-extrabold text-primary tracking-tight">JumuaPlanner</h1>
          </div>
          <nav className="hidden md:flex items-center gap-8">
            <a className="text-primary font-bold border-b-2 border-primary py-1" href="#features">Features</a>
            <a className="text-mute hover:text-primary transition-colors" href="#themes">Themes</a>
            <a className="text-mute hover:text-primary transition-colors" href="#pricing">Pricing</a>
          </nav>
          <div className="flex items-center gap-2 md:gap-4 shrink-0">
            <Link href="/auth/login" className="hidden sm:block text-primary font-semibold hover:opacity-80 px-3 md:px-4 py-2 text-sm md:text-base">Sign in</Link>
            <Link href="/auth/signup" className="bg-primary text-white font-bold px-4 md:px-6 py-2 md:py-2.5 rounded-full hover:opacity-90 transition-all active:scale-95 text-sm md:text-base whitespace-nowrap">Get started</Link>
          </div>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="relative min-h-[600px] md:min-h-[750px] flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0 z-0">
            <img
              alt="Hassan II Mosque Watercolor Illustration"
              className="w-full h-full object-cover object-center"
              src="/hero-mosque.jpg"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-white/40 via-white/30 to-white/60" />
          </div>
          <div className="relative z-10 w-full px-5 md:px-[120px] py-12 md:py-16 flex flex-col items-center text-center">
            <h2 className="text-5xl md:text-7xl font-extrabold text-primary mb-6 leading-tight">
              Plan, Prepare,<br /> Deliver.
            </h2>
            <p className="font-[var(--font-arabic)] text-2xl md:text-3xl text-accent-gold mb-8 leading-relaxed">
              نظام متكامل لتنظيم وتقديم خطب الجمعة بفعالية وإتقان
            </p>
            <p className="text-lg text-mute mb-10 max-w-2xl mx-auto font-semibold">
              The first professional khutbah management platform designed for Khatibs and Mosques to deliver impactful messages with data-driven planning.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/auth/signup" className="bg-primary text-white px-10 py-4 rounded-full font-bold text-lg shadow-lg hover:shadow-xl transition-all hover:scale-105 active:scale-95">
                Start Your Planner
              </Link>
              <button className="bg-white/80 backdrop-blur-md border-2 border-primary/20 text-primary px-10 py-4 rounded-full font-bold text-lg hover:bg-white transition-all hover:scale-105 active:scale-95">
                Watch Demo
              </button>
            </div>
          </div>
        </section>

        {/* Core Features */}
        <section id="features" className="bg-cream-bg px-5 md:px-[120px] py-16 md:py-32">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-4xl font-bold text-primary mb-4">Everything you need to plan your year</h2>
            <div className="h-1 w-20 bg-accent-gold mx-auto rounded-full" />
            <p className="mt-6 text-mute">Streamline your preparation from research to delivery with tools built specifically for the pulpit.</p>
          </div>

          {/* Individual Plan Features */}
          <div className="max-w-5xl mx-auto mb-20">
            <div className="mb-10">
              <h3 className="text-sm font-bold text-primary tracking-wide">For every khatib</h3>
              <p className="text-xs text-mute mt-1">Included in the Individual plan</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Annual Planning — top-left logo square: teal strong */}
              <div className="bg-primary/[0.06] border border-primary/15 p-8 group hover:shadow-md transition-shadow">
                <div>
                  <div className="w-11 h-11 bg-primary/90 flex items-center justify-center mb-5">
                    <span className="material-symbols-outlined text-white text-xl">calendar_month</span>
                  </div>
                  <h3 className="text-xl font-extrabold text-primary mb-2">Annual Planning</h3>
                  <p className="text-mute text-sm leading-relaxed">Structure your entire year of <strong className="text-ink">khutbahs</strong> around meaningful topics. Set <strong className="text-ink">main themes</strong> with curated <strong className="text-ink">sub-topics</strong> and let the roadmap guide every Jumu&apos;ah.</p>
                  <ul className="mt-4 space-y-1.5">
                    <li className="flex items-center gap-2 text-sm text-ink"><span className="material-symbols-outlined text-primary text-base">check</span> Main themes &amp; sub-topics</li>
                    <li className="flex items-center gap-2 text-sm text-ink"><span className="material-symbols-outlined text-primary text-base">check</span> Assign khutbahs to Fridays</li>
                    <li className="flex items-center gap-2 text-sm text-ink"><span className="material-symbols-outlined text-primary text-base">check</span> Year-at-a-glance roadmap</li>
                  </ul>
                </div>
              </div>

              {/* Sermon Editor — top-right logo square: teal light */}
              <div className="bg-primary/[0.04] border border-primary/10 p-8 group hover:shadow-md transition-shadow">
                <div>
                  <div className="w-11 h-11 bg-primary/60 flex items-center justify-center mb-5">
                    <span className="material-symbols-outlined text-white text-xl">edit_note</span>
                  </div>
                  <h3 className="text-xl font-extrabold text-primary mb-2">Sermon Editor</h3>
                  <p className="text-mute text-sm leading-relaxed">Write your khutbah in <strong className="text-ink">Arabic and English</strong> side by side. A focused editor with formatting tools built for the minbar.</p>
                  <ul className="mt-4 space-y-1.5">
                    <li className="flex items-center gap-2 text-sm text-ink"><span className="material-symbols-outlined text-primary text-base">check</span> Bilingual Arabic + English</li>
                    <li className="flex items-center gap-2 text-sm text-ink"><span className="material-symbols-outlined text-primary text-base">check</span> Formatting toolbar</li>
                    <li className="flex items-center gap-2 text-sm text-ink"><span className="material-symbols-outlined text-primary text-base">check</span> Word target &amp; readiness checklist</li>
                  </ul>
                </div>
              </div>

              {/* Friday Calendar — bottom-left logo square: teal light */}
              <div className="bg-primary/[0.04] border border-primary/10 p-8 group hover:shadow-md transition-shadow">
                <div>
                  <div className="w-11 h-11 bg-primary/60 flex items-center justify-center mb-5">
                    <span className="material-symbols-outlined text-white text-xl">event</span>
                  </div>
                  <h3 className="text-xl font-extrabold text-primary mb-2">Jumu&apos;ah Calendar</h3>
                  <p className="text-mute text-sm leading-relaxed">See every Jumu&apos;ah at a glance. <strong className="text-ink">Schedule</strong> khutbahs onto dates, <strong className="text-ink">track</strong> what&apos;s coming, and never arrive at the masjid unprepared.</p>
                  <ul className="mt-4 space-y-1.5">
                    <li className="flex items-center gap-2 text-sm text-ink"><span className="material-symbols-outlined text-primary text-base">check</span> Visual month view</li>
                    <li className="flex items-center gap-2 text-sm text-ink"><span className="material-symbols-outlined text-primary text-base">check</span> Friday highlights</li>
                    <li className="flex items-center gap-2 text-sm text-ink"><span className="material-symbols-outlined text-primary text-base">check</span> Schedule &amp; reschedule khutbahs</li>
                  </ul>
                </div>
              </div>

              {/* Weekly Cycle — bottom-right logo square: gold */}
              <div className="bg-accent-gold/[0.06] border border-accent-gold/15 p-8 group hover:shadow-md transition-shadow">
                <div>
                  <div className="w-11 h-11 bg-accent-gold/80 flex items-center justify-center mb-5">
                    <span className="material-symbols-outlined text-white text-xl">cycle</span>
                  </div>
                  <h3 className="text-xl font-extrabold text-primary mb-2">Weekly Cycle</h3>
                  <p className="text-mute text-sm leading-relaxed">Each week: prepare your <strong className="text-ink">khutbah outline</strong>, deliver on Jumu&apos;ah, and track your progress. The <strong className="text-ink">dashboard</strong> shows exactly what needs attention.</p>
                  <ul className="mt-4 space-y-1.5">
                    <li className="flex items-center gap-2 text-sm text-ink"><span className="material-symbols-outlined text-accent-gold text-base">check</span> Draft &rarr; Review &rarr; Deliver flow</li>
                    <li className="flex items-center gap-2 text-sm text-ink"><span className="material-symbols-outlined text-accent-gold text-base">check</span> Dashboard status tracking</li>
                    <li className="flex items-center gap-2 text-sm text-ink"><span className="material-symbols-outlined text-accent-gold text-base">check</span> Export to PDF &amp; Word</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Organization Plan Feature */}
          <div className="max-w-5xl mx-auto">
            <div className="mb-10">
              <h3 className="text-sm font-bold text-accent-gold tracking-wide">For organizations &amp; mosques</h3>
              <p className="text-xs text-mute mt-1">Everything in Individual, plus team management</p>
            </div>

            <div className="bg-white border-2 border-primary/20 p-8 md:p-10 hover:shadow-md transition-shadow">
              <div className="flex flex-col md:flex-row gap-8 md:gap-12">
                <div className="flex-1">
                  <div className="w-12 h-12 bg-accent-gold/10 flex items-center justify-center mb-5">
                    <span className="material-symbols-outlined text-accent-gold text-2xl">groups</span>
                  </div>
                  <h3 className="text-2xl font-extrabold text-primary mb-3">Multi-Khatib Management</h3>
                  <p className="text-mute leading-relaxed">Manage rotating <strong className="text-ink">khatibs</strong> across your <strong className="text-ink">masjid</strong> or organization. Each khatib prepares their own Jumu&apos;ah khutbah and collaborates securely with the team.</p>
                </div>
                <div className="md:w-[280px] shrink-0">
                  <ul className="space-y-2">
                    <li className="flex items-center gap-2 text-sm text-ink"><span className="material-symbols-outlined text-accent-gold text-base">check</span> Up to 20 khatib accounts</li>
                    <li className="flex items-center gap-2 text-sm text-ink"><span className="material-symbols-outlined text-accent-gold text-base">check</span> Moderator review tools</li>
                    <li className="flex items-center gap-2 text-sm text-ink"><span className="material-symbols-outlined text-accent-gold text-base">check</span> Shared khutbah bank</li>
                    <li className="flex items-center gap-2 text-sm text-ink"><span className="material-symbols-outlined text-accent-gold text-base">check</span> Full resource library</li>
                    <li className="flex items-center gap-2 text-sm text-ink"><span className="material-symbols-outlined text-accent-gold text-base">check</span> Rotation scheduling</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Annual Themes */}
        <section id="themes" className="py-24 px-5 md:px-[120px] bg-surface">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col lg:flex-row items-center gap-16 lg:gap-24">
              <div className="lg:w-1/2 text-center lg:text-left">
                <span className="text-accent-gold font-bold text-sm tracking-widest uppercase">Strategic Vision</span>
                <h2 className="text-4xl font-bold text-primary mt-2 mb-4">Design Your Annual Roadmap</h2>
                <p className="text-mute text-lg leading-relaxed mb-6">Choose themes that matter to your community. Plan 12 months of purposeful khutbahs — your topics, your schedule, your vision.</p>
                <Link href="/themes" className="inline-flex items-center gap-2 bg-primary text-white font-bold px-8 py-3 rounded-full hover:bg-secondary transition-all group">
                  Start Planning <span className="material-symbols-outlined transition-transform group-hover:translate-x-1">arrow_forward</span>
                </Link>
              </div>
              <div className="lg:w-1/2 flex justify-center">
                <div className="relative w-[320px] h-[320px] md:w-[380px] md:h-[360px] mx-auto">
                  {/* Dashed placeholder card */}
                  <div className="absolute inset-0 overflow-hidden border-2 border-dashed border-primary/30 rounded-2xl -rotate-[8deg] -translate-x-6 translate-y-2 z-0">
                    <div className="p-5 flex flex-col items-center justify-center h-full">
                      <span className="material-symbols-outlined text-3xl text-primary/30 mb-2">add_circle_outline</span>
                      <p className="text-primary/40 font-bold text-sm">Your Theme</p>
                    </div>
                  </div>
                  {/* March card */}
                  <div className="absolute inset-0 overflow-hidden bg-accent-gold/10 border border-accent-gold/20 rounded-2xl shadow-md -rotate-[4deg] -translate-x-3 translate-y-1 z-[1]">
                    <div className="p-5 flex flex-col justify-between h-full">
                      <div>
                        <span className="text-accent-gold font-bold text-xs uppercase tracking-widest">March</span>
                        <p className="text-lg font-semibold text-secondary leading-tight mt-2">The Quranic Message</p>
                      </div>
                      <div className="flex items-center gap-2 text-accent-gold/60">
                        <span className="material-symbols-outlined text-sm">menu_book</span>
                        <span className="text-xs">4 sub-topics</span>
                      </div>
                    </div>
                  </div>
                  {/* February card */}
                  <div className="absolute inset-0 overflow-hidden bg-primary/10 border border-primary/20 rounded-2xl shadow-lg rotate-[2deg] translate-x-3 -translate-y-1 z-[2]">
                    <div className="p-5 flex flex-col justify-between h-full">
                      <div>
                        <span className="text-primary font-bold text-xs uppercase tracking-widest">February</span>
                        <p className="text-lg font-semibold text-primary leading-tight mt-2">Pillars of Islam</p>
                      </div>
                      <div className="flex items-center gap-2 text-primary/60">
                        <span className="material-symbols-outlined text-sm">menu_book</span>
                        <span className="text-xs">4 sub-topics</span>
                      </div>
                    </div>
                  </div>
                  {/* January card (front) */}
                  <div className="absolute inset-0 overflow-hidden bg-white border border-primary/20 rounded-2xl shadow-xl rotate-[6deg] translate-x-6 -translate-y-2 z-[3]">
                    <div className="p-5 flex flex-col justify-between h-full">
                      <div>
                        <span className="text-primary font-bold text-xs uppercase tracking-widest">January</span>
                        <p className="text-xl font-semibold text-primary leading-tight mt-2">Aqeedah &amp; Faith</p>
                        <p className="text-mute text-xs mt-3">Foundations of belief, Tawheed, and strengthening conviction.</p>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-primary/60">
                          <span className="material-symbols-outlined text-sm">menu_book</span>
                          <span className="text-xs">4 sub-topics</span>
                        </div>
                        <div className="flex -space-x-2">
                          <div className="w-6 h-6 rounded-full bg-primary/20 border-2 border-white" />
                          <div className="w-6 h-6 rounded-full bg-accent-gold/30 border-2 border-white" />
                          <div className="w-6 h-6 rounded-full bg-primary/10 border-2 border-white flex items-center justify-center text-[8px] font-bold text-primary">+9</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Interface Preview */}
        <WorkspacePreview />

        {/* Pricing */}
        <section id="pricing" className="py-24 px-5 md:px-[120px] bg-cream-bg">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-primary mb-4">Simple, honest pricing.</h2>
            <p className="text-mute">Choose the plan that fits your mosque&apos;s size and mission.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Individual */}
            <div className="bg-white p-10 rounded-2xl border border-line/30 flex flex-col">
              <h4 className="font-bold text-xl mb-2">Individual</h4>
              <p className="text-3xl font-bold text-primary mb-6">$9 <span className="text-sm font-normal text-mute">/mo</span></p>
              <ul className="space-y-4 mb-12 flex-1">
                <li className="flex items-center gap-2 text-sm"><span className="material-symbols-outlined text-primary text-lg">check_circle</span> Arabic+English editor</li>
                <li className="flex items-center gap-2 text-sm"><span className="material-symbols-outlined text-primary text-lg">check_circle</span> Friday calendar</li>
                <li className="flex items-center gap-2 text-sm"><span className="material-symbols-outlined text-primary text-lg">check_circle</span> Annual theme planner</li>
                <li className="flex items-center gap-2 text-sm"><span className="material-symbols-outlined text-primary text-lg">check_circle</span> Export PDF &amp; Word</li>
              </ul>
              <Link href="/auth/signup" className="w-full py-3 rounded-full border border-primary text-primary font-bold hover:bg-primary/5 transition-all text-center">Select Plan</Link>
            </div>
            {/* Organization */}
            <div className="bg-white p-10 rounded-2xl border-2 border-primary flex flex-col relative scale-105 shadow-xl">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-white text-xs font-bold px-4 py-1 rounded-full uppercase tracking-widest">Most Popular</div>
              <h4 className="font-bold text-xl mb-2">Organization</h4>
              <p className="text-3xl font-bold text-primary mb-6">$49 <span className="text-sm font-normal text-mute">/mo</span></p>
              <ul className="space-y-4 mb-12 flex-1">
                <li className="flex items-center gap-2 text-sm"><span className="material-symbols-outlined text-primary text-lg">check_circle</span> Everything in Individual</li>
                <li className="flex items-center gap-2 text-sm"><span className="material-symbols-outlined text-primary text-lg">check_circle</span> Full resource library</li>
                <li className="flex items-center gap-2 text-sm"><span className="material-symbols-outlined text-primary text-lg">check_circle</span> 20 free khatib accounts</li>
                <li className="flex items-center gap-2 text-sm"><span className="material-symbols-outlined text-primary text-lg">check_circle</span> Moderator review tools</li>
              </ul>
              <Link href="/auth/signup" className="w-full py-3 rounded-full bg-primary text-white font-bold hover:shadow-lg transition-all text-center">Select Plan</Link>
            </div>
            {/* Network */}
            <div className="bg-white p-10 rounded-2xl border border-line/30 flex flex-col">
              <h4 className="font-bold text-xl mb-2">Network</h4>
              <p className="text-3xl font-bold text-primary mb-6">Pricing TBD</p>
              <ul className="space-y-4 mb-12 flex-1">
                <li className="flex items-center gap-2 text-sm"><span className="material-symbols-outlined text-primary text-lg">check_circle</span> Everything in Organization</li>
                <li className="flex items-center gap-2 text-sm"><span className="material-symbols-outlined text-primary text-lg">check_circle</span> 100 khatib accounts</li>
                <li className="flex items-center gap-2 text-sm"><span className="material-symbols-outlined text-primary text-lg">check_circle</span> Multiple org groups</li>
                <li className="flex items-center gap-2 text-sm"><span className="material-symbols-outlined text-primary text-lg">check_circle</span> Priority support</li>
              </ul>
              <button className="w-full py-3 rounded-full border border-primary text-primary font-bold hover:bg-primary/5 transition-all">Contact Sales</button>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-surface w-full border-t border-line px-5 md:px-[120px] py-12">
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
