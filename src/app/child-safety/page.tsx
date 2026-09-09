import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';

export const metadata: Metadata = {
  title: 'Child Safety Standards | Novix Messenger',
  description: 'Novix Messenger standards and policies against Child Sexual Abuse and Exploitation (CSAE) and Child Sexual Abuse Material (CSAM).',
};

export default function ChildSafetyPage() {
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
      <div style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '4rem 1.5rem 3rem', textAlign: 'center', background: 'rgba(239,68,68,0.04)' }}>
        <div style={{ fontSize: 12, color: '#f87171', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12 }}>Safety &amp; Compliance</div>
        <h1 style={{ fontSize: 'clamp(2rem,5vw,3rem)', fontWeight: 900, letterSpacing: '-1px', marginBottom: 16 }}>Child Safety Standards</h1>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14 }}>Standards against Child Sexual Abuse and Exploitation (CSAE) &nbsp;·&nbsp; Last updated: September 2026</p>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '3rem 1.5rem 5rem' }}>

        <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 16, padding: '20px 24px', marginBottom: 40 }}>
          <p style={{ color: '#fca5a5', fontSize: 14, lineHeight: 1.7, margin: 0 }}>
            <strong>Zero-Tolerance Policy:</strong> Novix Messenger maintains a strict, non-negotiable zero-tolerance policy against Child Sexual Abuse Material (CSAM) and Child Sexual Abuse and Exploitation (CSAE). We strictly prohibit any use of our services to create, possess, facilitate, distribute, or promote material that harms or exploits children.
          </p>
        </div>

        <Section title="1. Purpose and Scope">
          Novix Messenger is committed to creating a safe and trustworthy communication environment. These Child Safety Standards articulate our policies, technical safeguards, reporting pathways, and enforcement mechanisms designed to prevent, detect, and eradicate any form of child sexual abuse and exploitation across our platform in compliance with global laws and Google Play Child Safety policies.
        </Section>

        <Section title="2. Strictly Prohibited Content and Conduct">
          The following activities and content are strictly forbidden on Novix Messenger:
          <ul>
            <li><strong>Child Sexual Abuse Material (CSAM):</strong> Generating, uploading, sharing, linking to, streaming, or storing visual depictions of sexual abuse or sexual exploitation involving minors.</li>
            <li><strong>Child Grooming and Solicitations:</strong> Initiating or maintaining contact with minors with the intent to facilitate sexual abuse, sexual interactions, or exploitation.</li>
            <li><strong>Sextortion and Exploitation:</strong> Coercing, threatening, or blackmailing children or young persons for sexual images, monetary payments, or personal information.</li>
            <li><strong>Facilitation and Promotion:</strong> Advertising, soliciting, sharing links, or encouraging the distribution of child sexual abuse material or trafficking of minors.</li>
          </ul>
        </Section>

        <Section title="3. In-App Reporting Mechanisms">
          Novix Messenger provides direct, easily accessible mechanisms for all users to immediately report concerns regarding child safety:
          <ul>
            <li><strong>Report User:</strong> Users can tap on any contact or user profile, select <em>Report User</em>, choose the appropriate violation category, and submit the report directly to our safety moderation team.</li>
            <li><strong>Report Content:</strong> Objectionable messages or media can be flagged directly within chat threads.</li>
            <li><strong>Immediate Block:</strong> Users can block abusive or suspicious individuals instantly, immediately severing all incoming calls and messages.</li>
          </ul>
        </Section>

        <Section title="4. Dedicated Safety Contact &amp; External Reporting">
          In addition to in-app reporting tools, anyone can report child safety concerns, CSAM/CSAE incidents, or inquiries directly to our designated child safety response team:
          <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: '16px 20px', marginTop: 14, border: '1px solid rgba(255,255,255,0.08)' }}>
            <p style={{ margin: '0 0 8px', color: '#fff', fontWeight: 600 }}>Designated Safety Contact Point:</p>
            <p style={{ margin: '0 0 4px', color: '#93c5fd' }}>
              <strong>Email:</strong> <a href="mailto:cyberloomittechnologies@gmail.com" style={{ color: '#60a5fa', textDecoration: 'underline' }}>cyberloomittechnologies@gmail.com</a>
            </p>
            <p style={{ margin: 0, color: 'rgba(255,255,255,0.6)', fontSize: 13 }}>
              Subject line recommendation: <code>[URGENT: Child Safety Report]</code>
            </p>
          </div>
          <p style={{ marginTop: 14 }}>
            Reports received via our designated contact are reviewed with the highest priority and urgent response protocols.
          </p>
        </Section>

        <Section title="5. Enforcement and Legal Compliance">
          Upon receiving a report or identifying an account engaging in CSAE or CSAM:
          <ul>
            <li><strong>Immediate Account Termination:</strong> Offending accounts are permanently banned with immediate revocation of platform access.</li>
            <li><strong>Device and IP Blocking:</strong> Hardware identifiers and network fingerprints are permanently blacklisted to prevent re-registration.</li>
            <li><strong>Content Purging:</strong> All associated violative content is permanently excised from our infrastructure.</li>
            <li><strong>Mandatory Law Enforcement Referral:</strong> We cooperate fully with regional and international law enforcement agencies. Violations involving CSAM are reported directly to relevant national clearinghouses, including the National Center for Missing &amp; Exploited Children (NCMEC) via the CyberTipline and national law enforcement bodies.</li>
          </ul>
        </Section>

        <Section title="6. Co-operation with Authorities">
          Novix Messenger complies with all applicable local, national, and international child safety legislation, including 18 U.S.C. § 2258A (reporting of child sexual exploitation), relevant GDPR child protection mandates, and local criminal statutes. We work cooperatively with government authorities, NGOs, and child protection organizations worldwide to combat crimes against children.
        </Section>

        {/* Footer links */}
        <div style={{ marginTop: 48, paddingTop: 32, borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', gap: 20, flexWrap: 'wrap' }}>
          <Link href="/privacy" style={{ color: '#60a5fa', fontSize: 14, textDecoration: 'none' }}>Privacy Policy →</Link>
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
      <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 15, lineHeight: 1.85 }}>
        {children}
      </div>
    </div>
  );
}
