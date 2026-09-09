import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';

export const metadata: Metadata = {
  title: 'Terms & Conditions | Novix Messenger',
  description: 'Read the Terms and Conditions for using Novix Messenger app.',
};

export default function TermsPage() {
  return (
    <div style={{ minHeight: '100vh', background: '#0a0f1e', color: '#fff', fontFamily: 'var(--font-geist-sans, system-ui, sans-serif)' }}>

      {/* Navbar */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: 'rgba(10,15,30,0.9)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        padding: '0 1.5rem',
      }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', color: '#fff' }}>
            <Image src="/app_icon.png" alt="Novix" width={32} height={32} style={{ borderRadius: 8 }} />
            <span style={{ fontWeight: 800, fontSize: 16 }}>Novix Messenger</span>
          </Link>
          <Link href="/" style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', textDecoration: 'none', padding: '6px 14px', background: 'rgba(255,255,255,0.06)', borderRadius: 8 }}>
            ← Back to Home
          </Link>
        </div>
      </nav>

      {/* Header */}
      <div style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '4rem 1.5rem 3rem', textAlign: 'center', background: 'rgba(59,130,246,0.04)' }}>
        <div style={{ fontSize: 12, color: '#60a5fa', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12 }}>Legal</div>
        <h1 style={{ fontSize: 'clamp(2rem,5vw,3rem)', fontWeight: 900, letterSpacing: '-1px', marginBottom: 16 }}>Terms &amp; Conditions</h1>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14 }}>Last updated: July 30, 2025 &nbsp;·&nbsp; Effective: July 30, 2025</p>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '3rem 1.5rem 5rem' }}>

        <Section title="1. Acceptance of Terms">
          By downloading, installing, or using <strong>Novix Messenger</strong> ("the App"), you agree to be bound by these Terms &amp; Conditions ("Terms"). If you do not agree to these Terms, please do not use the App. We reserve the right to update these Terms at any time, and your continued use of the App constitutes acceptance of any changes.
        </Section>

        <Section title="2. Eligibility">
          You must be at least <strong>13 years of age</strong> to use Novix Messenger. By using the App, you represent and warrant that you meet this age requirement. If you are under 18, you should use the App only with the involvement and consent of a parent or guardian.
        </Section>

        <Section title="3. Account Registration">
          <ul>
            <li>You may be required to create an account to access certain features.</li>
            <li>You are responsible for maintaining the confidentiality of your account credentials.</li>
            <li>You agree to provide accurate and complete information when creating your account.</li>
            <li>You are solely responsible for all activity that occurs under your account.</li>
            <li>Notify us immediately of any unauthorized use of your account.</li>
          </ul>
        </Section>

        <Section title="4. Permitted Use">
          You agree to use Novix Messenger only for lawful purposes and in a manner that does not infringe on the rights of others. You may use the App to:
          <ul>
            <li>Send and receive messages, photos, videos, and other content.</li>
            <li>Make voice and video calls.</li>
            <li>Create and participate in group conversations.</li>
            <li>Share media files within the App.</li>
          </ul>
        </Section>

        <Section title="5. Prohibited Conduct">
          You agree NOT to use Novix Messenger to:
          <ul>
            <li>Harass, bully, threaten, or harm other users.</li>
            <li>Send spam, unsolicited messages, or advertisements.</li>
            <li>Share illegal content, including but not limited to child sexual abuse material (CSAM).</li>
            <li>Distribute malware, viruses, or harmful code.</li>
            <li>Impersonate any person or entity.</li>
            <li>Violate any applicable local, national, or international law or regulation.</li>
            <li>Attempt to reverse-engineer, hack, or exploit the App or its servers.</li>
            <li>Engage in any form of fraud or deceptive practices.</li>
          </ul>
          Violation of these rules may result in immediate account suspension or termination.
        </Section>

        <Section title="6. Content Ownership & License">
          You retain ownership of all content you submit, post, or share through Novix Messenger. By sharing content, you grant Novix a non-exclusive, royalty-free license to transmit, store, and display that content solely for the purpose of providing the App's services to you. We do not sell your content to third parties.
        </Section>

        <Section title="7. Privacy">
          Your privacy is important to us. Please review our <Link href="/privacy" style={{ color: '#60a5fa', textDecoration: 'none' }}>Privacy Policy</Link>, which is incorporated into these Terms and explains how we collect, use, and protect your personal information.
        </Section>

        <Section title="8. End-to-End Encryption">
          Novix Messenger uses end-to-end encryption for messages and calls. This means your communications are encrypted and can only be read by you and the intended recipient(s). We cannot access the content of your encrypted messages.
        </Section>

        <Section title="9. Reporting & Safety">
          We take safety seriously. If you encounter abusive content or behavior within the App, please use the built-in reporting feature. We review all reports and take appropriate action, which may include removing content or suspending accounts.
        </Section>

        <Section title="10. Intellectual Property">
          All intellectual property rights in the App, including but not limited to the Novix name, logo, design, and source code, are owned by or licensed to us. You may not use our intellectual property without prior written consent.
        </Section>

        <Section title="11. Disclaimers">
          The App is provided "as is" and "as available" without warranties of any kind, either express or implied. We do not warrant that the App will be uninterrupted, error-free, or free of viruses or other harmful components.
        </Section>

        <Section title="12. Limitation of Liability">
          To the fullest extent permitted by law, Novix Messenger and its developers shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of or inability to use the App.
        </Section>

        <Section title="13. Termination">
          We reserve the right to suspend or terminate your access to the App at any time, with or without notice, for conduct that we believe violates these Terms or is harmful to other users, us, or third parties. You may delete your account at any time through the App's settings or by visiting our <Link href="/delete-account" style={{ color: '#60a5fa', textDecoration: 'none' }}>Delete Account</Link> page.
        </Section>

        <Section title="14. Changes to Terms">
          We may update these Terms from time to time. We will notify you of significant changes by posting a notice within the App. Continued use of the App after changes are posted constitutes your acceptance of the revised Terms.
        </Section>

        <Section title="15. Governing Law">
          These Terms are governed by and construed in accordance with applicable laws. Any disputes arising under these Terms shall be resolved through good-faith negotiation or, if necessary, through appropriate legal channels.
        </Section>

        <Section title="16. Contact Us">
          If you have any questions about these Terms &amp; Conditions, please contact us through the Novix Messenger app or reach out via the contact information provided within the App.
        </Section>

        {/* Footer links */}
        <div style={{ marginTop: 48, paddingTop: 32, borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', gap: 20, flexWrap: 'wrap' }}>
          <Link href="/child-safety" style={{ color: '#60a5fa', fontSize: 14, textDecoration: 'none' }}>Child Safety Standards →</Link>
          <Link href="/privacy" style={{ color: '#60a5fa', fontSize: 14, textDecoration: 'none' }}>Privacy Policy →</Link>
          <Link href="/delete-account" style={{ color: '#60a5fa', fontSize: 14, textDecoration: 'none' }}>Delete Account →</Link>
          <Link href="/" style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14, textDecoration: 'none' }}>← Back to Home</Link>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 40 }}>
      <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 14, color: '#e2e8f0', letterSpacing: '-0.2px' }}>{title}</h2>
      <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 15, lineHeight: 1.85 }}>
        {children}
      </div>
    </div>
  );
}
