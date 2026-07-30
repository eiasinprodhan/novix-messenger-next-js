import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { Trash2, AlertTriangle, Clock, CheckCircle2 } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Delete Account | Novix Messenger',
  description: 'Learn how to permanently delete your Novix Messenger account and all associated data.',
};

export default function DeleteAccountPage() {
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
        <div style={{ width: 72, height: 72, borderRadius: 20, background: 'rgba(239,68,68,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', color: '#ef4444' }}>
          <Trash2 size={32} />
        </div>
        <h1 style={{ fontSize: 'clamp(2rem,5vw,3rem)', fontWeight: 900, letterSpacing: '-1px', marginBottom: 16 }}>Delete Your Account</h1>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 15, maxWidth: 500, margin: '0 auto' }}>
          We're sorry to see you go. Follow the steps below to permanently delete your Novix Messenger account and all associated data.
        </p>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '3rem 1.5rem 5rem' }}>

        {/* Warning Box */}
        <div style={{
          background: 'rgba(239,68,68,0.08)',
          border: '1px solid rgba(239,68,68,0.25)',
          borderRadius: 16, padding: '20px 24px', marginBottom: 40,
          display: 'flex', gap: 16, alignItems: 'flex-start'
        }}>
          <AlertTriangle size={22} style={{ color: '#ef4444', flexShrink: 0, marginTop: 2 }} />
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, color: '#fca5a5', marginBottom: 6 }}>This action is permanent and cannot be undone</div>
            <p style={{ color: 'rgba(239,68,68,0.7)', fontSize: 14, lineHeight: 1.65, margin: 0 }}>
              Once you delete your account, all your data including messages, contacts, media, and profile information will be permanently removed. You will not be able to recover your account.
            </p>
          </div>
        </div>

        {/* What gets deleted */}
        <div style={{ marginBottom: 40 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 20, color: '#e2e8f0' }}>What Will Be Deleted</h2>
          <div style={{ display: 'grid', gap: 12 }}>
            {[
              'Your profile information (username, photo, bio)',
              'All messages and conversation history',
              'Media files you have sent or received',
              'Your contact list within the App',
              'Group memberships and group messages',
              'Voice and video call logs',
              'Account settings and preferences',
              'All personal data associated with your account',
            ].map((item) => (
              <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12 }}>
                <CheckCircle2 size={16} style={{ color: '#ef4444', flexShrink: 0 }} />
                <span style={{ color: 'rgba(255,255,255,0.65)', fontSize: 14 }}>{item}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Timeline */}
        <div style={{ marginBottom: 40, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <Clock size={18} style={{ color: '#60a5fa' }} />
            <h2 style={{ fontSize: 17, fontWeight: 700, color: '#e2e8f0', margin: 0 }}>Deletion Timeline</h2>
          </div>
          <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, lineHeight: 1.8 }}>
            <p>• Your account will be <strong style={{ color: '#e2e8f0' }}>deactivated immediately</strong> once you confirm deletion.</p>
            <p>• Your personal data will be <strong style={{ color: '#e2e8f0' }}>permanently deleted within 30 days</strong> of your request.</p>
            <p>• Some information may be retained for a limited period if required by law (e.g., for fraud prevention or legal compliance).</p>
            <p>• Anonymized, non-identifiable data may be retained for service improvement purposes.</p>
          </div>
        </div>

        {/* Steps */}
        <div style={{ marginBottom: 40 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 24, color: '#e2e8f0' }}>How to Delete Your Account</h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {[
              {
                step: '1',
                title: 'Open Novix Messenger',
                desc: 'Launch the Novix Messenger app on your Android device.',
              },
              {
                step: '2',
                title: 'Go to Settings',
                desc: 'Tap your profile icon or the menu icon, then navigate to "Settings".',
              },
              {
                step: '3',
                title: 'Navigate to Account',
                desc: 'Inside Settings, tap on "Account" to open account management options.',
              },
              {
                step: '4',
                title: 'Select Delete Account',
                desc: 'Scroll down and tap "Delete Account". Read the warning carefully before proceeding.',
              },
              {
                step: '5',
                title: 'Confirm Deletion',
                desc: 'Enter your account password or verify your identity to confirm. Tap "Confirm Delete" to permanently delete your account.',
              },
            ].map((s) => (
              <div key={s.step} style={{ display: 'flex', gap: 18, alignItems: 'flex-start' }}>
                <div style={{
                  width: 38, height: 38, borderRadius: '50%', flexShrink: 0,
                  background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 800, fontSize: 15, color: '#fff'
                }}>{s.step}</div>
                <div style={{ paddingTop: 4 }}>
                  <div style={{ fontWeight: 700, fontSize: 15, color: '#e2e8f0', marginBottom: 4 }}>{s.title}</div>
                  <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: 14, lineHeight: 1.6 }}>{s.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Alternatives */}
        <div style={{ background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 16, padding: '24px', marginBottom: 40 }}>
          <h2 style={{ fontSize: 17, fontWeight: 700, color: '#93c5fd', marginBottom: 12 }}>Consider These Alternatives</h2>
          <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 14, lineHeight: 1.7, marginBottom: 12 }}>Before deleting your account, you might want to consider:</p>
          <ul style={{ color: 'rgba(255,255,255,0.45)', fontSize: 14, lineHeight: 1.85, paddingLeft: 20 }}>
            <li><strong style={{ color: '#93c5fd' }}>Mute notifications</strong> — Turn off all notifications if you need a break.</li>
            <li><strong style={{ color: '#93c5fd' }}>Adjust privacy settings</strong> — Restrict who can contact you or see your profile.</li>
            <li><strong style={{ color: '#93c5fd' }}>Clear chat history</strong> — Delete specific conversations without deleting your whole account.</li>
          </ul>
        </div>

        {/* Contact */}
        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: '24px', marginBottom: 40 }}>
          <h2 style={{ fontSize: 17, fontWeight: 700, color: '#e2e8f0', marginBottom: 12 }}>Need Help?</h2>
          <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 14, lineHeight: 1.7, margin: 0 }}>
            If you experience any issues deleting your account, or if you would like to submit a data deletion request manually, please contact us through the Novix Messenger app. We will process your request within 30 days.
          </p>
        </div>

        {/* Footer links */}
        <div style={{ paddingTop: 32, borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', gap: 20, flexWrap: 'wrap' }}>
          <Link href="/privacy" style={{ color: '#60a5fa', fontSize: 14, textDecoration: 'none' }}>Privacy Policy →</Link>
          <Link href="/terms" style={{ color: '#60a5fa', fontSize: 14, textDecoration: 'none' }}>Terms &amp; Conditions →</Link>
          <Link href="/" style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14, textDecoration: 'none' }}>← Back to Home</Link>
        </div>
      </div>
    </div>
  );
}
