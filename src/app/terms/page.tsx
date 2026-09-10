import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service — Khutba",
  description: "Khutba.net terms of service",
};

export default function TermsPage() {
  return (
    <div className="bg-surface text-ink min-h-screen flex flex-col">
      <header className="sticky top-0 w-full z-50 bg-surface/80 backdrop-blur-md border-b border-line/30">
        <div className="flex justify-between items-center px-5 md:px-12 py-3 max-w-[1200px] mx-auto">
          <Link href="/" className="flex items-center gap-2">
            <svg width="22" height="22" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="1" y="1" width="11" height="11" rx="2" fill="#00666d" opacity="0.9"/>
              <rect x="16" y="1" width="11" height="11" rx="2" fill="#00666d" opacity="0.6"/>
              <rect x="1" y="16" width="11" height="11" rx="2" fill="#00666d" opacity="0.6"/>
              <rect x="16" y="16" width="11" height="11" rx="2" fill="#C4A35A" opacity="0.8"/>
            </svg>
            <span className="text-base md:text-lg font-bold text-primary tracking-tight">Khutba</span>
          </Link>
          <Link href="/" className="text-sm text-primary/70 font-medium hover:text-primary transition-colors">
            &larr; Back to Home
          </Link>
        </div>
      </header>

      <main className="flex-1 max-w-4xl mx-auto w-full px-5 md:px-12 py-12 md:py-20">
        <h1 className="text-3xl md:text-4xl font-bold text-ink mb-2">Terms of Service</h1>
        <p className="text-sm text-mute mb-10">Last updated: September 8, 2026</p>

        <div className="space-y-10 text-[15px] leading-relaxed text-ink/80">
          <section>
            <h2 className="text-xl font-bold text-ink mb-4">Agreement to our legal terms</h2>
            <p className="mb-4">We are Khutba.net (&quot;Company,&quot; &quot;we,&quot; &quot;us,&quot; &quot;our&quot;), a company registered in Canada at Calgary, Alberta.</p>
            <p className="mb-4">We operate the website <a href="https://khutba.net" className="text-primary underline">khutba.net</a> (the &quot;Site&quot;), as well as any other related products and services that refer or link to these legal terms (the &quot;Legal Terms&quot;) (collectively, the &quot;Services&quot;).</p>
            <p className="mb-4">Khutba.net is a web-based sermon planning and mosque management platform that helps khatibs (Friday sermon speakers) plan, organize, and schedule their sermons. It allows mosques and Islamic organizations to manage khatib rosters, coordinate Friday assignments, and maintain an annual sermon planning calendar.</p>
            <p className="mb-4">You can contact us by phone at (587) 718-9768, email at <a href="mailto:support@khutba.net" className="text-primary underline">support@khutba.net</a>, or by mail to Calgary, Alberta, Canada.</p>
            <p className="mb-4">These Legal Terms constitute a legally binding agreement made between you, whether personally or on behalf of an entity (&quot;you&quot;), and Khutba.net, concerning your access to and use of the Services. You agree that by accessing the Services, you have read, understood, and agreed to be bound by all of these Legal Terms. <strong>IF YOU DO NOT AGREE WITH ALL OF THESE LEGAL TERMS, THEN YOU ARE EXPRESSLY PROHIBITED FROM USING THE SERVICES AND YOU MUST DISCONTINUE USE IMMEDIATELY.</strong></p>
            <p className="mb-4">We will provide you with prior notice of any scheduled changes to the Services you are using. The modified Legal Terms will become effective upon posting or notifying you by <a href="mailto:support@khutba.net" className="text-primary underline">support@khutba.net</a>, as stated in the email message.</p>
            <p>The Services are intended for users who are at least 13 years of age. All users who are minors in the jurisdiction in which they reside (generally under the age of 18) must have the permission of, and be directly supervised by, their parent or guardian to use the Services.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-ink mb-4">1. Our services</h2>
            <p>The information provided when using the Services is not intended for distribution to or use by any person or entity in any jurisdiction or country where such distribution or use would be contrary to law or regulation. The Services are not tailored to comply with industry-specific regulations (HIPAA, FISMA, etc.). You may not use the Services in a way that would violate the Gramm-Leach-Bliley Act (GLBA).</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-ink mb-4">2. Intellectual property rights</h2>
            <h3 className="text-base font-bold text-ink mb-2">Our intellectual property</h3>
            <p className="mb-4">We are the owner or the licensee of all intellectual property rights in our Services, including all source code, databases, functionality, software, website designs, audio, video, text, photographs, and graphics (collectively, the &quot;Content&quot;), as well as the trademarks, service marks, and logos (the &quot;Marks&quot;).</p>
            <h3 className="text-base font-bold text-ink mb-2">Your use of our Services</h3>
            <p className="mb-4">Subject to your compliance with these Legal Terms, we grant you a non-exclusive, non-transferable, revocable license to access the Services and download or print a copy of any portion of the Content to which you have properly gained access, solely for your personal, non-commercial use or internal business purpose.</p>
            <p className="mb-4">If you wish to make any use of the Services, Content, or Marks other than as set out in this section, please address your request to: <a href="mailto:support@khutba.net" className="text-primary underline">support@khutba.net</a>.</p>
            <h3 className="text-base font-bold text-ink mb-2">Your submissions and contributions</h3>
            <p className="mb-4"><strong>Submissions:</strong> By directly sending us any question, comment, suggestion, idea, feedback, or other information about the Services (&quot;Submissions&quot;), you agree to assign to us all intellectual property rights in such Submission.</p>
            <p><strong>Contributions:</strong> The Services may invite you to chat, contribute to, or participate in blogs, message boards, online forums, and other functionality during which you may create, submit, post, display, transmit, publish, distribute, or broadcast content (&quot;Contributions&quot;). When you post Contributions, you grant us an unrestricted, unlimited, irrevocable, perpetual, non-exclusive, transferable, royalty-free, fully-paid, worldwide license to use, copy, reproduce, distribute, sell, resell, publish, and broadcast such Contributions.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-ink mb-4">3. User representations</h2>
            <p>By using the Services, you represent and warrant that: (1) all registration information you submit will be true, accurate, current, and complete; (2) you will maintain the accuracy of such information; (3) you have the legal capacity and agree to comply with these Legal Terms; (4) you are not under the age of 13; (5) you are not a minor, or if a minor, you have received parental permission; (6) you will not access the Services through automated or non-human means; (7) you will not use the Services for any illegal purpose; and (8) your use will not violate any applicable law or regulation.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-ink mb-4">4. User registration</h2>
            <p>You may be required to register to use the Services. You agree to keep your password confidential and will be responsible for all use of your account and password. We reserve the right to remove, reclaim, or change a username you select if we determine, in our sole discretion, that such username is inappropriate, obscene, or otherwise objectionable.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-ink mb-4">5. Purchases and payment</h2>
            <p className="mb-4">We accept the following forms of payment: Visa, Mastercard, American Express, PayPal.</p>
            <p className="mb-4">You agree to provide current, complete, and accurate purchase and account information for all purchases made via the Services. All payments shall be in US dollars.</p>
            <p>We reserve the right to correct any errors or mistakes in pricing, even if we have already requested or received payment. We reserve the right to refuse any order placed through the Services.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-ink mb-4">6. Subscriptions</h2>
            <h3 className="text-base font-bold text-ink mb-2">Billing and renewal</h3>
            <p className="mb-4">Your subscription will continue and automatically renew unless canceled. You consent to our charging your payment method on a recurring basis without requiring your prior approval for each recurring charge.</p>
            <h3 className="text-base font-bold text-ink mb-2">Free trial</h3>
            <p className="mb-4">We offer a 14-day free trial to new users who register with the Services. The account will be charged according to the user{"'"}s chosen subscription at the end of the free trial.</p>
            <h3 className="text-base font-bold text-ink mb-2">Cancellation</h3>
            <p>You can cancel your subscription at any time by logging into your account. Your cancellation will take effect at the end of the current paid term. If you have any questions or are unsatisfied with our Services, please email us at <a href="mailto:support@khutba.net" className="text-primary underline">support@khutba.net</a>.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-ink mb-4">7. Prohibited activities</h2>
            <p className="mb-4">You may not access or use the Services for any purpose other than that for which we make the Services available. As a user, you agree not to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Systematically retrieve data to create a collection without written permission.</li>
              <li>Trick, defraud, or mislead us and other users.</li>
              <li>Circumvent, disable, or interfere with security-related features.</li>
              <li>Disparage, tarnish, or otherwise harm us and/or the Services.</li>
              <li>Use information obtained from the Services to harass, abuse, or harm another person.</li>
              <li>Make improper use of our support services or submit false reports.</li>
              <li>Use the Services in a manner inconsistent with any applicable laws.</li>
              <li>Upload or transmit viruses, Trojan horses, or other material that interferes with the Services.</li>
              <li>Engage in any automated use of the system.</li>
              <li>Attempt to impersonate another user or person.</li>
              <li>Interfere with, disrupt, or create an undue burden on the Services.</li>
              <li>Copy or adapt the Services{"'"} software.</li>
              <li>Decipher, decompile, disassemble, or reverse engineer any of the software.</li>
              <li>Use any information retrieval system to access portions of the Services without authorization.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-ink mb-4">8. User generated contributions</h2>
            <p className="mb-4">The Services may provide you with the opportunity to create, submit, post, display, transmit, perform, publish, distribute, or broadcast content (&quot;Contributions&quot;). Any Contributions you transmit may be treated as non-confidential and non-proprietary.</p>
            <p>You represent and warrant that your Contributions do not infringe the proprietary rights of any third party, are not false or misleading, and do not violate any applicable law or regulation.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-ink mb-4">9. Contribution license</h2>
            <p className="mb-4">By posting Contributions, you grant us an unrestricted, unlimited, irrevocable, perpetual, non-exclusive, transferable, royalty-free, worldwide license to use, copy, reproduce, distribute, sell, publish, and broadcast such Contributions in any media format.</p>
            <p>We do not assert any ownership over your Contributions. You retain full ownership of all of your Contributions and any intellectual property rights associated with them.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-ink mb-4">10. Third-party websites and content</h2>
            <p>The Services may contain links to other websites (&quot;Third-Party Websites&quot;) as well as articles, photographs, text, graphics, and other content belonging to or originating from third parties (&quot;Third-Party Content&quot;). We are not responsible for any Third-Party Websites or Third-Party Content. If you decide to leave the Services and access Third-Party Websites, you do so at your own risk.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-ink mb-4">11. Services management</h2>
            <p>We reserve the right, but not the obligation, to: (1) monitor the Services for violations of these Legal Terms; (2) take appropriate legal action against anyone who violates the law or these Legal Terms; (3) refuse, restrict access to, limit the availability of, or disable any of your Contributions; (4) remove from the Services or disable all files and content that are excessive in size; and (5) otherwise manage the Services to protect our rights and property.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-ink mb-4">12. Privacy policy</h2>
            <p>We care about data privacy and security. Please review our <Link href="/privacy" className="text-primary underline">Privacy Policy</Link>. By using the Services, you agree to be bound by our Privacy Policy, which is incorporated into these Legal Terms. The Services are hosted in Canada and United States.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-ink mb-4">13. Copyright infringements</h2>
            <p>We respect the intellectual property rights of others. If you believe that any material available on or through the Services infringes upon any copyright you own or control, please immediately notify us using the contact information provided below.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-ink mb-4">14. Term and termination</h2>
            <p className="mb-4">These Legal Terms shall remain in full force and effect while you use the Services. <strong>WITHOUT LIMITING ANY OTHER PROVISION OF THESE LEGAL TERMS, WE RESERVE THE RIGHT TO, IN OUR SOLE DISCRETION AND WITHOUT NOTICE OR LIABILITY, DENY ACCESS TO AND USE OF THE SERVICES TO ANY PERSON FOR ANY REASON OR FOR NO REASON.</strong></p>
            <p>If we terminate or suspend your account for any reason, you are prohibited from registering and creating a new account under your name, a fake or borrowed name, or the name of any third party.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-ink mb-4">15. Modifications and interruptions</h2>
            <p className="mb-4">We reserve the right to change, modify, or remove the contents of the Services at any time or for any reason at our sole discretion without notice. We have no obligation to update any information on our Services.</p>
            <p>We cannot guarantee the Services will be available at all times. We may experience hardware, software, or other problems resulting in interruptions, delays, or errors.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-ink mb-4">16. Governing law</h2>
            <p>These Legal Terms shall be governed by and defined following the laws of Canada. Khutba.net and yourself irrevocably consent that the courts of Canada shall have exclusive jurisdiction to resolve any dispute which may arise in connection with these Legal Terms.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-ink mb-4">17. Dispute resolution</h2>
            <h3 className="text-base font-bold text-ink mb-2">Informal negotiations</h3>
            <p className="mb-4">The Parties agree to first attempt to negotiate any Dispute informally for at least thirty (30) days before initiating arbitration.</p>
            <h3 className="text-base font-bold text-ink mb-2">Binding arbitration</h3>
            <p className="mb-4">If unable to resolve through informal negotiation, the dispute shall be finally resolved by arbitration in accordance with the United Nations Commission on International Trade Law Arbitration Rules. The seat of arbitration shall be Calgary, Canada. The language shall be English.</p>
            <h3 className="text-base font-bold text-ink mb-2">Restrictions</h3>
            <p>Any arbitration shall be limited to the Dispute between the Parties individually. No arbitration shall be joined with any other proceeding, and there is no right for any Dispute to be arbitrated on a class-action basis.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-ink mb-4">18. Corrections</h2>
            <p>There may be information on the Services that contains typographical errors, inaccuracies, or omissions. We reserve the right to correct any errors and to change or update information at any time, without prior notice.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-ink mb-4">19. Disclaimer</h2>
            <p className="uppercase text-sm font-semibold">THE SERVICES ARE PROVIDED ON AN AS-IS AND AS-AVAILABLE BASIS. YOU AGREE THAT YOUR USE OF THE SERVICES WILL BE AT YOUR SOLE RISK. TO THE FULLEST EXTENT PERMITTED BY LAW, WE DISCLAIM ALL WARRANTIES, EXPRESS OR IMPLIED, IN CONNECTION WITH THE SERVICES AND YOUR USE THEREOF, INCLUDING THE IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-ink mb-4">20. Limitations of liability</h2>
            <p className="uppercase text-sm font-semibold">IN NO EVENT WILL WE OR OUR DIRECTORS, EMPLOYEES, OR AGENTS BE LIABLE TO YOU OR ANY THIRD PARTY FOR ANY DIRECT, INDIRECT, CONSEQUENTIAL, EXEMPLARY, INCIDENTAL, SPECIAL, OR PUNITIVE DAMAGES, INCLUDING LOST PROFIT, LOST REVENUE, LOSS OF DATA, OR OTHER DAMAGES ARISING FROM YOUR USE OF THE SERVICES, EVEN IF WE HAVE BEEN ADVISED OF THE POSSIBILITY OF SUCH DAMAGES.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-ink mb-4">21. Indemnification</h2>
            <p>You agree to defend, indemnify, and hold us harmless, including our subsidiaries, affiliates, and all of our respective officers, agents, partners, and employees, from and against any loss, damage, liability, claim, or demand made by any third party due to or arising out of: (1) your Contributions; (2) use of the Services; (3) breach of these Legal Terms; (4) any breach of your representations and warranties; (5) your violation of the rights of a third party; or (6) any overt harmful act toward any other user of the Services.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-ink mb-4">22. User data</h2>
            <p>We will maintain certain data that you transmit to the Services for the purpose of managing the performance of the Services. Although we perform regular routine backups, you are solely responsible for all data that you transmit or that relates to any activity you have undertaken using the Services.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-ink mb-4">23. Electronic communications, transactions, and signatures</h2>
            <p>Visiting the Services, sending us emails, and completing online forms constitute electronic communications. You consent to receive electronic communications, and you agree that all agreements, notices, disclosures, and other communications we provide to you electronically satisfy any legal requirement that such communication be in writing.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-ink mb-4">24. California users and residents</h2>
            <p>If any complaint with us is not satisfactorily resolved, you can contact the Complaint Assistance Unit of the Division of Consumer Services of the California Department of Consumer Affairs in writing at 1625 North Market Blvd., Suite N 112, Sacramento, California 95834 or by telephone at (800) 952-5210 or (916) 445-1254.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-ink mb-4">25. Miscellaneous</h2>
            <p>These Legal Terms and any policies or operating rules posted by us on the Services constitute the entire agreement and understanding between you and us. Our failure to exercise or enforce any right or provision of these Legal Terms shall not operate as a waiver of such right or provision. We may assign any or all of our rights and obligations to others at any time.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-ink mb-4">26. Contact us</h2>
            <p className="mb-2">In order to resolve a complaint regarding the Services or to receive further information regarding use of the Services, please contact us at:</p>
            <div className="bg-surface-alt/50 border border-line rounded-xl p-5 text-sm space-y-1">
              <p className="font-semibold text-ink">Khutba.net</p>
              <p>Calgary, Alberta, Canada</p>
              <p>Phone: (587) 718-9768</p>
              <p>Email: <a href="mailto:support@khutba.net" className="text-primary underline">support@khutba.net</a></p>
            </div>
          </section>
        </div>
      </main>

      <footer className="bg-surface border-t border-line px-5 md:px-20 py-8">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-mute">&copy; {new Date().getFullYear()} Khutba.net. All rights reserved.</p>
          <nav className="flex gap-6">
            <Link href="/privacy" className="text-xs font-bold uppercase tracking-widest text-mute hover:text-primary transition-all">Privacy</Link>
            <Link href="/terms" className="text-xs font-bold uppercase tracking-widest text-primary">Terms</Link>
            <a href="mailto:support@khutba.net" className="text-xs font-bold uppercase tracking-widest text-mute hover:text-primary transition-all">Support</a>
          </nav>
        </div>
      </footer>
    </div>
  );
}
