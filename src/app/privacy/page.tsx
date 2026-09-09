import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';

export const metadata: Metadata = {
  title: 'Privacy Policy | Novix Messenger',
  description: 'Learn how Novix Messenger collects, uses, and protects your personal information.',
};

export default function PrivacyPage() {
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
        <h1 style={{ fontSize: 'clamp(2rem,5vw,3rem)', fontWeight: 900, letterSpacing: '-1px', marginBottom: 16 }}>Privacy Policy</h1>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14 }}>Last updated: July 30, 2025 &nbsp;·&nbsp; Effective: July 30, 2025</p>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '3rem 1.5rem 5rem' }}>

        <div style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 16, padding: '20px 24px', marginBottom: 40 }}>
          <p style={{ color: '#93c5fd', fontSize: 14, lineHeight: 1.7, margin: 0 }}>
            <strong>Summary:</strong> Novix Messenger is built with privacy at its core. We collect only what is necessary to provide the service, never sell your data, and protect your communications with end-to-end encryption.
          </p>
        </div>

        <Section title="1. Information We Collect">
          <strong style={{ color: '#e2e8f0' }}>Information you provide:</strong>
          <ul>
            <li>Account information (username, phone number or email, profile photo)</li>
            <li>Messages, photos, videos, and other content you send through the App</li>
            <li>Safety reports you submit</li>
          </ul>
          <strong style={{ color: '#e2e8f0' }}>Information collected automatically:</strong>
          <ul>
            <li>Device information (device type, operating system version)</li>
            <li>App usage data (connection timestamps, feature usage)</li>
            <li>IP address (used for security and fraud prevention)</li>
          </ul>
          <strong style={{ color: '#e2e8f0' }}>Information we do NOT collect:</strong>
          <ul>
            <li>The content of your encrypted messages (we cannot access them)</li>
            <li>Your contacts or address book</li>
            <li>Your location (unless you choose to share it)</li>
          </ul>
        </Section>

        <Section title="2. How We Use Your Information">
          We use the information we collect to:
          <ul>
            <li>Provide, maintain, and improve the Novix Messenger service</li>
            <li>Authenticate your identity and secure your account</li>
            <li>Deliver messages, calls, and media between users</li>
            <li>Investigate and respond to safety reports</li>
            <li>Send service-related notifications (e.g., security alerts)</li>
            <li>Prevent fraud, abuse, and violations of our Terms</li>
            <li>Comply with legal obligations</li>
          </ul>
        </Section>

        <Section title="3. End-to-End Encryption">
          All messages and calls on Novix Messenger are protected with <strong style={{ color: '#e2e8f0' }}>end-to-end encryption</strong>. This means:
          <ul>
            <li>Only you and your intended recipient(s) can read your messages.</li>
            <li>Even Novix cannot access the content of your encrypted conversations.</li>
            <li>Your messages are not stored on our servers after delivery.</li>
          </ul>
        </Section>

        <Section title="4. Information Sharing">
          We do <strong style={{ color: '#e2e8f0' }}>not</strong> sell, rent, or trade your personal information to third parties. We may share information only in the following limited circumstances:
          <ul>
            <li><strong style={{ color: '#e2e8f0' }}>With your consent:</strong> When you explicitly agree to share information.</li>
            <li><strong style={{ color: '#e2e8f0' }}>Service providers:</strong> Trusted partners who help us operate the App (under strict confidentiality agreements).</li>
            <li><strong style={{ color: '#e2e8f0' }}>Legal compliance:</strong> When required by law, court order, or government authority.</li>
            <li><strong style={{ color: '#e2e8f0' }}>Safety:</strong> To protect the safety of our users or the public.</li>
          </ul>
        </Section>

        <Section title="5. Data Retention">
          <ul>
            <li>Messages are deleted from our servers once delivered.</li>
            <li>Account information is retained for as long as your account is active.</li>
            <li>When you delete your account, we delete your personal data within 30 days, except where required by law.</li>
            <li>Anonymized usage data may be retained for analytics purposes.</li>
          </ul>
        </Section>

        <Section title="6. Your Rights">
          Depending on your location, you may have the following rights:
          <ul>
            <li><strong style={{ color: '#e2e8f0' }}>Access:</strong> Request a copy of your personal data.</li>
            <li><strong style={{ color: '#e2e8f0' }}>Correction:</strong> Update or correct inaccurate information.</li>
            <li><strong style={{ color: '#e2e8f0' }}>Deletion:</strong> Request deletion of your account and data. Visit our <Link href="/delete-account" style={{ color: '#60a5fa', textDecoration: 'none' }}>Delete Account page</Link>.</li>
            <li><strong style={{ color: '#e2e8f0' }}>Portability:</strong> Receive your data in a machine-readable format.</li>
            <li><strong style={{ color: '#e2e8f0' }}>Objection:</strong> Object to certain types of data processing.</li>
          </ul>
        </Section>

        <Section title="7. Children's Privacy">
          Novix Messenger is not intended for children under 13 years of age. We do not knowingly collect personal information from children under 13. If we become aware that a child under 13 has provided us with personal information, we will take steps to delete such information promptly.
        </Section>

        <Section title="8. Security">
          We implement industry-standard security measures to protect your information, including:
          <ul>
            <li>End-to-end encryption for all communications</li>
            <li>Secure HTTPS connections</li>
            <li>Regular security audits and vulnerability testing</li>
            <li>Access controls limiting who can access user data</li>
          </ul>
          No method of transmission over the Internet is 100% secure, but we are committed to protecting your data to the best of our ability.
        </Section>

        <Section title="9. Third-Party Services">
          The App may use third-party services (such as push notification providers) that have their own privacy policies. We are not responsible for the privacy practices of those services.
        </Section>

        <Section title="10. Changes to This Policy">
          We may update this Privacy Policy from time to time. We will notify you of significant changes by posting a notice within the App or sending you a notification. The "Last updated" date at the top of this page indicates when the policy was last revised.
        </Section>

        <Section title="11. Contact Us">
          If you have questions or concerns about this Privacy Policy or our data practices, please contact us through the Novix Messenger app or via the contact information provided within the App.
        </Section>

        {/* Footer links */}
        <div style={{ marginTop: 48, paddingTop: 32, borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', gap: 20, flexWrap: 'wrap' }}>
          <Link href="/child-safety" style={{ color: '#60a5fa', fontSize: 14, textDecoration: 'none' }}>Child Safety Standards →</Link>
          <Link href="/terms" style={{ color: '#60a5fa', fontSize: 14, textDecoration: 'none' }}>Terms &amp; Conditions →</Link>
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
