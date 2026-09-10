import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy — Khutba",
  description: "Khutba.net privacy policy",
};

export default function PrivacyPage() {
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
        <h1 className="text-3xl md:text-4xl font-bold text-ink mb-2">Privacy Policy</h1>
        <p className="text-sm text-mute mb-10">Last updated: September 8, 2026</p>

        <div className="space-y-10 text-[15px] leading-relaxed text-ink/80">
          <section>
            <h2 className="text-xl font-bold text-ink mb-4">Introduction and organizational info</h2>
            <p className="mb-4">We, at Khutba.net, are dedicated to serving our customers and contacts to the best of our abilities. Part of our commitment involves the responsible management of personal information collected through our website khutba.net, and any related interactions. Our primary goals in processing this information include:</p>
            <ul className="list-disc pl-6 space-y-2 mb-4">
              <li>Enhancing the user experience on our platform by understanding customer needs and preferences.</li>
              <li>Providing timely support and responding to inquiries or service requests.</li>
              <li>Improving our products and services to meet the evolving demands of our users.</li>
              <li>Conducting necessary business operations, such as billing and account management.</li>
            </ul>
            <p className="mb-4">It is our policy to process personal information with the utmost respect for privacy and security. We adhere to all relevant regulations and guidelines to ensure that the data we handle is protected against unauthorized access, disclosure, alteration, and destruction.</p>
            <p className="mb-4">We do not have a designated Data Protection Officer (DPO) but remain fully committed to addressing your privacy concerns. Should you have any questions or require further information about how we manage personal information, please feel free to contact us at <a href="mailto:support@khutba.net" className="text-primary underline">support@khutba.net</a> or +1 (587) 718-9768.</p>
            <p>Your privacy is our priority. We are committed to processing your personal information transparently and with your safety in mind. This commitment extends to our collaboration with third-party services that may process personal information on our behalf. Rest assured, all activities are conducted in strict compliance with applicable privacy laws.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-ink mb-4">Scope and application</h2>
            <p>Our privacy policy is designed to protect the personal information of all our stakeholders, including website visitors, registered users, and customers. Whether you are just browsing our website khutba.net, using our services as a registered user, or engaging with us as a valued customer, we ensure that your personal data is processed with the highest standards of privacy and security. This policy outlines our practices and your rights related to personal information.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-ink mb-4">Data collection and processing</h2>
            <p className="mb-4">Our commitment to transparency and data protection extends to how we collect and use your personal information. We gather personal data through various interactions, including but not limited to, when you utilize our services or products such as cloud-based sermon planning and mosque management software, or directly provide information to us.</p>
            <p className="mb-3 font-semibold text-ink">The following types of personal information we may process:</p>
            <ul className="list-disc pl-6 space-y-1 mb-4">
              <li><strong>First and last name</strong></li>
              <li><strong>Payment information</strong> (e.g., credit card number, bank details)</li>
              <li><strong>Browsing history</strong></li>
              <li><strong>IP-based approximate location</strong></li>
              <li><strong>Device ID</strong></li>
            </ul>
            <p className="mb-4">We only process information that is essential for delivering our services, complying with legal obligations, or enhancing your user experience.</p>
            <p className="mb-3 font-semibold text-ink">Key ways in which we use the personal information collected:</p>
            <ul className="list-disc pl-6 space-y-1 mb-4">
              <li><strong>Authentication and security</strong></li>
              <li><strong>Analytics and performance tracking</strong></li>
              <li><strong>Customizing and adapting user experience</strong></li>
              <li><strong>Processing transactions</strong></li>
              <li><strong>Marketing and advertising</strong></li>
              <li><strong>Customer support</strong></li>
              <li><strong>Displaying videos</strong></li>
              <li><strong>Compliance with legal obligations</strong></li>
            </ul>
            <p>We process your personal information transparently and in accordance with your preferences and applicable privacy laws. We are committed to ensuring that your data is used solely for the purposes for which it was collected.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-ink mb-4">Data storage and protection</h2>
            <h3 className="text-base font-bold text-ink mb-2">Data storage</h3>
            <ul className="list-disc pl-6 space-y-2 mb-6">
              <li>Personal information is stored in secure servers located in the United States. For services that require international data transfer, we ensure compliance with all applicable laws.</li>
              <li>We partner with reputable data hosting providers committed to using state-of-the-art security measures, selected based on adherence to stringent data protection standards.</li>
            </ul>
            <h3 className="text-base font-bold text-ink mb-2">Data protection measures</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Encryption:</strong> We employ robust encryption technologies to protect data during transfer and at rest.</li>
              <li><strong>Access control:</strong> Access to personal information is strictly limited to authorized personnel with a legitimate business need. We enforce strict access controls and regularly review permissions.</li>
              <li><strong>Security audits and monitoring:</strong> Regular security audits are conducted to identify and remediate potential vulnerabilities. We monitor our systems for unusual activities to prevent unauthorized access.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-ink mb-4">Data sharing and disclosure</h2>
            <p className="mb-4">At Khutba.net, we are committed to safeguarding your personal information. Below we outline our practices:</p>
            <h3 className="text-base font-bold text-ink mb-2">Third-party service providers</h3>
            <p className="mb-4">We may share your information with third-party service providers who perform services on our behalf. These partners are prohibited from using your personal information for any purpose other than to provide services to Khutba.net, and they are required to maintain the confidentiality of your information.</p>

            <div className="overflow-x-auto border border-line rounded-xl mb-6">
              <table className="w-full text-sm">
                <thead className="bg-surface-alt">
                  <tr>
                    <th className="text-left p-3 font-semibold text-ink/70 border-b border-line">Service</th>
                    <th className="text-left p-3 font-semibold text-ink/70 border-b border-line">Provider</th>
                    <th className="text-left p-3 font-semibold text-ink/70 border-b border-line">Purpose</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-line/50">
                    <td className="p-3 font-medium">Stripe</td>
                    <td className="p-3">Stripe</td>
                    <td className="p-3">Payment processing, authentication</td>
                  </tr>
                  <tr className="border-b border-line/50">
                    <td className="p-3 font-medium">Google Analytics</td>
                    <td className="p-3">Google Ireland Limited</td>
                    <td className="p-3">Analytics and performance tracking</td>
                  </tr>
                  <tr className="border-b border-line/50">
                    <td className="p-3 font-medium">Google Ads</td>
                    <td className="p-3">Google Ireland Limited</td>
                    <td className="p-3">Marketing and advertising</td>
                  </tr>
                  <tr className="border-b border-line/50">
                    <td className="p-3 font-medium">YouTube</td>
                    <td className="p-3">Google Ireland Limited</td>
                    <td className="p-3">Displaying videos</td>
                  </tr>
                  <tr className="border-b border-line/50">
                    <td className="p-3 font-medium">Google Maps</td>
                    <td className="p-3">Google LLC</td>
                    <td className="p-3">Customizing user experience</td>
                  </tr>
                  <tr className="border-b border-line/50">
                    <td className="p-3 font-medium">Google Fonts</td>
                    <td className="p-3">Google Ireland Limited</td>
                    <td className="p-3">Customizing user experience</td>
                  </tr>
                  <tr className="border-b border-line/50">
                    <td className="p-3 font-medium">Cloudflare</td>
                    <td className="p-3">Cloudflare Inc.</td>
                    <td className="p-3">Authentication and security</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-medium">Amazon Web Services</td>
                    <td className="p-3">Amazon Web Services EMEA SARL</td>
                    <td className="p-3">Cloud computing</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-ink mb-4">Data processing agreements</h2>
            <p className="mb-4">When we share your data with third-party service providers, we do so under the protection of Data Processing Agreements (DPAs) that ensure your information is managed in accordance with GDPR and other relevant data protection laws.</p>
            <h3 className="text-base font-bold text-ink mb-2">Transparency and control</h3>
            <p className="mb-4">We believe in transparency and providing you with control over your personal information. You will always be informed about any significant changes to our sharing practices.</p>
            <p>For any queries or concerns about how we share and disclose personal information, please reach out to us at <a href="mailto:support@khutba.net" className="text-primary underline">support@khutba.net</a> or +1 (587) 718-9768.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-ink mb-4">User rights and choices</h2>
            <p className="mb-4">At Khutba.net, we recognize and respect your rights regarding your personal information, in accordance with the General Data Protection Regulation (GDPR) and other applicable data protection laws.</p>
            <ul className="list-disc pl-6 space-y-3 mb-6">
              <li><strong>Right of access</strong> (Art. 15 GDPR): You have the right to request access to the personal information we hold about you.</li>
              <li><strong>Right to rectification</strong> (Art. 16 GDPR): You have the right to request correction of incorrect or incomplete personal information.</li>
              <li><strong>Right to erasure</strong> (Art. 17 GDPR): You have the right to request deletion of your personal information when it is no longer necessary.</li>
              <li><strong>Right to restriction of processing</strong> (Art. 18 GDPR): You have the right to request restriction of processing under certain conditions.</li>
              <li><strong>Right to data portability</strong> (Art. 20 GDPR): You have the right to receive your personal information in a structured, machine-readable format.</li>
              <li><strong>Right to object</strong> (Art. 21 GDPR): You have the right to object to processing, including for direct marketing.</li>
              <li><strong>Right to withdraw consent</strong> (Art. 7(3) GDPR): You have the right to withdraw consent at any time.</li>
              <li><strong>Right to lodge a complaint</strong> (Art. 77 GDPR): You have the right to lodge a complaint with a supervisory authority.</li>
            </ul>
            <h3 className="text-base font-bold text-ink mb-2">Exercising your rights</h3>
            <p>To exercise any of these rights, please contact us at <a href="mailto:support@khutba.net" className="text-primary underline">support@khutba.net</a> or +1 (587) 718-9768. We will respond in accordance with applicable data protection laws.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-ink mb-4">Cookies and tracking technologies</h2>
            <p className="mb-4">At Khutba.net, we value your privacy and are committed to being transparent about our use of cookies and other tracking technologies on our website khutba.net.</p>
            <h3 className="text-base font-bold text-ink mb-2">How we use these technologies</h3>
            <ul className="list-disc pl-6 space-y-2 mb-4">
              <li><strong>Essential cookies:</strong> Necessary for website functionality, such as authentication and security. They do not require consent.</li>
              <li><strong>Performance and analytics cookies:</strong> Collect information about how visitors use our website to help us improve it.</li>
              <li><strong>Functional cookies:</strong> Enable enhanced functionality and personalization.</li>
              <li><strong>Advertising and targeting cookies:</strong> Used to deliver more relevant advertisements and measure campaign effectiveness.</li>
            </ul>
            <h3 className="text-base font-bold text-ink mb-2">Your choices and consent</h3>
            <p className="mb-4">Upon your first visit, our website will present you with a cookie consent banner, where you can accept all cookies, reject non-essential cookies, or customize your preferences.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-ink mb-4">Children{"'"}s privacy</h2>
            <p className="mb-4">Our services are not intended for children under the age of 10. We do not knowingly collect personal information from children under this age without verifiable parental consent.</p>
            <p className="mb-4">If we become aware that we have inadvertently collected personal information from a child under 10 without parental consent, we will promptly delete such information.</p>
            <p>Parents or legal guardians can contact us at <a href="mailto:support@khutba.net" className="text-primary underline">support@khutba.net</a> or +1 (587) 718-9768 to review, update, or delete any information collected from their child.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-ink mb-4">Compliance with United States privacy laws</h2>
            <p className="mb-4">For residents of the United States, the California Consumer Privacy Act provides specific rights regarding personal information:</p>
            <ul className="list-disc pl-6 space-y-2 mb-4">
              <li><strong>Right to Know:</strong> Request disclosure of what personal information we have collected, used, shared, or sold.</li>
              <li><strong>Right to Delete:</strong> Request deletion of personal information we have collected.</li>
              <li><strong>Right to Correct:</strong> Ask us to correct inaccurate information.</li>
              <li><strong>Right to Limit:</strong> Request we only use your sensitive personal information for limited purposes.</li>
              <li><strong>Right to Opt-Out:</strong> Khutba.net does not sell or share personal information.</li>
              <li><strong>Right to Non-Discrimination:</strong> You have the right to be protected from discrimination for exercising your rights.</li>
            </ul>
            <p>You may submit your request by sending an email to <a href="mailto:support@khutba.net" className="text-primary underline">support@khutba.net</a> or by phone at +1 (587) 718-9768.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-ink mb-4">Direct marketing and communications</h2>
            <p className="mb-4">We may use your personal information to send you direct marketing communications about our products, services, and promotions. We obtain your explicit opt-in consent before sending marketing communications.</p>
            <p>Every marketing communication will include clear instructions on how to unsubscribe. You can manage your communication preferences using the unsubscribe link in our emails.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-ink mb-4">Policy updates and changes</h2>
            <p className="mb-4">We may update this privacy policy from time to time. In the event of significant changes, we will provide notice through email, website notifications, or other appropriate channels.</p>
            <p>If you have any questions about our privacy policy, please contact us at <a href="mailto:support@khutba.net" className="text-primary underline">support@khutba.net</a> or +1 (587) 718-9768.</p>
          </section>
        </div>
      </main>

      <footer className="bg-surface border-t border-line px-5 md:px-20 py-8">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-mute">&copy; {new Date().getFullYear()} Khutba.net. All rights reserved.</p>
          <nav className="flex gap-6">
            <Link href="/privacy" className="text-xs font-bold uppercase tracking-widest text-primary">Privacy</Link>
            <Link href="/terms" className="text-xs font-bold uppercase tracking-widest text-mute hover:text-primary transition-all">Terms</Link>
            <a href="mailto:support@khutba.net" className="text-xs font-bold uppercase tracking-widest text-mute hover:text-primary transition-all">Support</a>
          </nav>
        </div>
      </footer>
    </div>
  );
}
