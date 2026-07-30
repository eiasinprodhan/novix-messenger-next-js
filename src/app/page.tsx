import Link from 'next/link';
import Image from 'next/image';
import {
  MessageCircle, Phone, Video, Shield, Lock, Globe, Zap,
  Users, Star, ChevronRight, Check, Download, Smile, Bell,
  ArrowRight
} from 'lucide-react';

export default function NovixHome() {
  return (
    <div style={{ minHeight: '100vh', background: '#0a0f1e', color: '#fff', fontFamily: 'var(--font-geist-sans, system-ui, sans-serif)', overflowX: 'hidden' }}>

      {/* ── Navbar ── */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: 'rgba(10,15,30,0.85)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        padding: '0 1.5rem',
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Image src="/app_icon.png" alt="Novix" width={38} height={38} style={{ borderRadius: 10 }} />
            <div>
              <div style={{ fontWeight: 800, fontSize: 18, letterSpacing: '-0.5px', lineHeight: 1 }}>Novix</div>
              <div style={{ fontSize: 10, color: '#3b82f6', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Messenger</div>
            </div>
          </div>

          {/* Nav links */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Link href="#features" style={{ padding: '8px 16px', color: 'rgba(255,255,255,0.65)', fontSize: 14, fontWeight: 500, textDecoration: 'none', borderRadius: 10, transition: 'color 0.2s' }}>Features</Link>
            <Link href="/terms" style={{ padding: '8px 16px', color: 'rgba(255,255,255,0.65)', fontSize: 14, fontWeight: 500, textDecoration: 'none', borderRadius: 10 }}>Terms</Link>
            <Link href="/privacy" style={{ padding: '8px 16px', color: 'rgba(255,255,255,0.65)', fontSize: 14, fontWeight: 500, textDecoration: 'none', borderRadius: 10 }}>Privacy</Link>
            <Link href="/delete-account" style={{
              padding: '9px 20px',
              background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
              color: '#fff', fontSize: 14, fontWeight: 600,
              textDecoration: 'none', borderRadius: 12,
              boxShadow: '0 4px 20px rgba(99,102,241,0.4)',
              display: 'flex', alignItems: 'center', gap: 6
            }}>
              Delete Account
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section style={{ position: 'relative', paddingTop: '6rem', paddingBottom: '6rem', textAlign: 'center', overflow: 'hidden' }}>
        {/* Glow blobs */}
        <div style={{ position: 'absolute', top: -100, left: '20%', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(59,130,246,0.18) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: 50, right: '10%', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)', pointerEvents: 'none' }} />

        <div style={{ maxWidth: 800, margin: '0 auto', padding: '0 1.5rem', position: 'relative', zIndex: 1 }}>
          {/* Badge */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.3)',
            borderRadius: 99, padding: '6px 16px', marginBottom: '2rem',
            fontSize: 13, fontWeight: 600, color: '#60a5fa'
          }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#22c55e', display: 'inline-block', animation: 'pulse 2s infinite' }} />
            Available on Android — Free
          </div>

          <Image src="/app_icon.png" alt="Novix Messenger" width={100} height={100}
            style={{ borderRadius: 24, boxShadow: '0 20px 60px rgba(59,130,246,0.4)', marginBottom: '2rem' }} />

          <h1 style={{ fontSize: 'clamp(2.5rem, 6vw, 4rem)', fontWeight: 900, letterSpacing: '-1.5px', lineHeight: 1.1, marginBottom: '1.5rem' }}>
            Chat, Call & Connect{' '}
            <span style={{ background: 'linear-gradient(90deg, #3b82f6, #a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              with Novix
            </span>
          </h1>

          <p style={{ fontSize: 18, lineHeight: 1.7, color: 'rgba(255,255,255,0.55)', marginBottom: '2.5rem', maxWidth: 560, margin: '0 auto 2.5rem' }}>
            A fast, secure, and modern messaging app built for real people. Send messages, make crystal-clear calls, share media, and stay connected — all in one place.
          </p>

          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
            <a
              href="https://play.google.com/store"
              target="_blank"
              rel="noreferrer"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 10,
                padding: '14px 28px',
                background: 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)',
                borderRadius: 16, fontWeight: 700, fontSize: 16,
                color: '#fff', textDecoration: 'none',
                boxShadow: '0 8px 32px rgba(99,102,241,0.45)',
                transition: 'transform 0.2s, box-shadow 0.2s'
              }}
            >
              <Download size={18} /> Download on Google Play
            </a>
            <Link href="#features" style={{
              display: 'inline-flex', alignItems: 'center', gap: 10,
              padding: '14px 28px',
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: 16, fontWeight: 600, fontSize: 16,
              color: 'rgba(255,255,255,0.8)', textDecoration: 'none'
            }}>
              Explore Features <ChevronRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Stats ── */}
      <section style={{ borderTop: '1px solid rgba(255,255,255,0.06)', borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '3rem 1.5rem' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 40, textAlign: 'center' }}>
          {[
            { value: '100%', label: 'End-to-End Encrypted' },
            { value: 'Free', label: 'Always Free to Use' },
            { value: 'HD', label: 'Crystal-Clear Voice Calls' },
            { value: '24/7', label: 'Real-Time Messaging' },
          ].map((s) => (
            <div key={s.label}>
              <div style={{ fontSize: 36, fontWeight: 900, background: 'linear-gradient(135deg,#3b82f6,#a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{s.value}</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', marginTop: 4 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" style={{ padding: '6rem 1.5rem' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
            <div style={{ fontSize: 13, color: '#60a5fa', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12 }}>Everything You Need</div>
            <h2 style={{ fontSize: 'clamp(1.75rem, 4vw, 2.75rem)', fontWeight: 800, letterSpacing: '-0.5px', marginBottom: 16 }}>Packed with Powerful Features</h2>
            <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 16, maxWidth: 500, margin: '0 auto' }}>Novix Messenger brings together all the communication tools you need in a sleek, beautiful package.</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>
            {[
              {
                icon: <MessageCircle size={24} />, color: '#3b82f6',
                title: 'Instant Messaging',
                desc: 'Send text messages, emojis, stickers, GIFs, and voice notes. Conversations that feel alive and expressive.'
              },
              {
                icon: <Phone size={24} />, color: '#10b981',
                title: 'Voice Calls',
                desc: 'Crystal-clear HD voice calls with minimal latency. Stay connected with friends and family anywhere in the world.'
              },
              {
                icon: <Video size={24} />, color: '#8b5cf6',
                title: 'Video Calls',
                desc: 'Face-to-face conversations with smooth, high-quality video. Feel closer to the people you care about.'
              },
              {
                icon: <Lock size={24} />, color: '#f59e0b',
                title: 'End-to-End Encryption',
                desc: 'All messages and calls are fully encrypted. Only you and the person you\'re talking to can read your conversations.'
              },
              {
                icon: <Users size={24} />, color: '#ec4899',
                title: 'Group Chats',
                desc: 'Create group conversations with friends, family, or communities. Share moments and coordinate effortlessly.'
              },
              {
                icon: <Bell size={24} />, color: '#14b8a6',
                title: 'Smart Notifications',
                desc: 'Stay up to date without being overwhelmed. Smart notification grouping keeps you informed, not distracted.'
              },
              {
                icon: <Globe size={24} />, color: '#6366f1',
                title: 'Media Sharing',
                desc: 'Share photos, videos, documents, and files instantly. No size limits that get in the way of sharing memories.'
              },
              {
                icon: <Smile size={24} />, color: '#f97316',
                title: 'Expressive Reactions',
                desc: 'React to messages with emojis. Say more with less — a heart, a laugh, or a thumbs up says it all.'
              },
              {
                icon: <Shield size={24} />, color: '#22c55e',
                title: 'Privacy Controls',
                desc: 'Control who sees your status, profile photo, and last seen. Your data stays yours — always.'
              },
            ].map((f) => (
              <div key={f.title} style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: 20, padding: '28px 28px',
                transition: 'border-color 0.2s, transform 0.2s',
              }}>
                <div style={{
                  width: 48, height: 48, borderRadius: 14,
                  background: `${f.color}18`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: f.color, marginBottom: 18
                }}>{f.icon}</div>
                <h3 style={{ fontWeight: 700, fontSize: 17, marginBottom: 8 }}>{f.title}</h3>
                <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 14, lineHeight: 1.7, margin: 0 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Why Novix ── */}
      <section style={{ padding: '5rem 1.5rem', background: 'rgba(255,255,255,0.015)', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 60, alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 13, color: '#60a5fa', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12 }}>Why Choose Novix</div>
            <h2 style={{ fontSize: 'clamp(1.6rem, 3.5vw, 2.4rem)', fontWeight: 800, letterSpacing: '-0.5px', lineHeight: 1.2, marginBottom: 24 }}>
              Messaging That Respects Your Privacy
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 15, lineHeight: 1.8, marginBottom: 32 }}>
              Novix is built from the ground up with privacy as a core principle — not an afterthought. We believe your conversations belong to you.
            </p>
            {[
              'No ads, no tracking, no data selling',
              'Messages deleted from servers after delivery',
              'Open reporting for safety violations',
              'Verified accounts for trusted connections',
              'Lightweight app with battery-friendly design',
            ].map((item) => (
              <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'rgba(34,197,94,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#22c55e', flexShrink: 0 }}>
                  <Check size={13} />
                </div>
                <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)' }}>{item}</span>
              </div>
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {[
              { icon: <Lock size={20} />, color: '#3b82f6', label: 'Encrypted' },
              { icon: <Zap size={20} />, color: '#f59e0b', label: 'Fast' },
              { icon: <Shield size={20} />, color: '#22c55e', label: 'Safe' },
              { icon: <Star size={20} />, color: '#ec4899', label: 'Loved' },
            ].map((item) => (
              <div key={item.label} style={{
                background: `${item.color}10`,
                border: `1px solid ${item.color}25`,
                borderRadius: 20, padding: 28, textAlign: 'center'
              }}>
                <div style={{ color: item.color, marginBottom: 10, display: 'flex', justifyContent: 'center' }}>{item.icon}</div>
                <div style={{ fontWeight: 700, fontSize: 15 }}>{item.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{ padding: '6rem 1.5rem', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at center, rgba(99,102,241,0.12) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ maxWidth: 600, margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <h2 style={{ fontSize: 'clamp(1.8rem, 4vw, 3rem)', fontWeight: 900, letterSpacing: '-1px', marginBottom: 20 }}>
            Ready to Start Chatting?
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 16, marginBottom: 36, lineHeight: 1.7 }}>
            Join thousands of users already enjoying secure, fast, and free messaging on Novix Messenger.
          </p>
          <a
            href="https://play.google.com/store"
            target="_blank"
            rel="noreferrer"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 10,
              padding: '16px 36px',
              background: 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)',
              borderRadius: 18, fontWeight: 700, fontSize: 17,
              color: '#fff', textDecoration: 'none',
              boxShadow: '0 12px 40px rgba(99,102,241,0.5)',
            }}
          >
            <Download size={20} /> Download Free on Android
          </a>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '2.5rem 1.5rem', background: 'rgba(0,0,0,0.3)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 32, justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <Image src="/app_icon.png" alt="Novix" width={30} height={30} style={{ borderRadius: 8 }} />
                <span style={{ fontWeight: 800, fontSize: 16 }}>Novix Messenger</span>
              </div>
              <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13, maxWidth: 260, lineHeight: 1.6 }}>
                Fast, secure, and free messaging for everyone. Connect with the world.
              </p>
            </div>
            <div style={{ display: 'flex', gap: 48, flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 14, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Legal</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <Link href="/terms" style={{ color: 'rgba(255,255,255,0.45)', fontSize: 14, textDecoration: 'none' }}>Terms &amp; Conditions</Link>
                  <Link href="/privacy" style={{ color: 'rgba(255,255,255,0.45)', fontSize: 14, textDecoration: 'none' }}>Privacy Policy</Link>
                  <Link href="/delete-account" style={{ color: 'rgba(255,255,255,0.45)', fontSize: 14, textDecoration: 'none' }}>Delete Account</Link>
                </div>
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 14, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>App</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <a href="#features" style={{ color: 'rgba(255,255,255,0.45)', fontSize: 14, textDecoration: 'none' }}>Features</a>
                  <a href="https://play.google.com/store" target="_blank" rel="noreferrer" style={{ color: 'rgba(255,255,255,0.45)', fontSize: 14, textDecoration: 'none' }}>Download</a>
                </div>
              </div>
            </div>
          </div>
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 20, display: 'flex', flexWrap: 'wrap', gap: 16, justifyContent: 'space-between', alignItems: 'center' }}>
            <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: 13, margin: 0 }}>© {new Date().getFullYear()} Novix Messenger. All rights reserved.</p>
            <div style={{ display: 'flex', gap: 20 }}>
              <Link href="/terms" style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12, textDecoration: 'none' }}>Terms</Link>
              <Link href="/privacy" style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12, textDecoration: 'none' }}>Privacy</Link>
              <Link href="/delete-account" style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12, textDecoration: 'none' }}>Delete Account</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
