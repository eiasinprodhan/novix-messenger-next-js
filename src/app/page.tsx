'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  MessageCircle, Phone, Video, Shield, Lock, Globe, Zap,
  Users, Star, ChevronRight, Check, Download, Smile, Bell,
  Menu, X, Gamepad2, ShieldCheck, Sparkles, ArrowRight
} from 'lucide-react';

export default function NovixHome() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#090d16] text-white font-sans overflow-x-hidden selection:bg-blue-600 selection:text-white">
      {/* ── Navbar ── */}
      <nav className="sticky top-0 z-50 bg-[#090d16]/90 backdrop-blur-xl border-b border-slate-800/80 px-4 sm:px-8 transition-all">
        <div className="max-w-7xl mx-auto h-16 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 p-0.5 shadow-lg shadow-blue-500/20 group-hover:scale-105 transition shrink-0 overflow-hidden">
              <Image src="/app_icon.png" alt="Novix Logo" width={40} height={40} className="w-full h-full object-cover rounded-[10px]" />
            </div>
            <div>
              <div className="font-extrabold text-lg tracking-tight leading-none text-white">Novix</div>
              <div className="text-[10px] text-blue-400 font-bold tracking-widest uppercase">Messenger</div>
            </div>
          </Link>

          {/* Desktop Nav links */}
          <div className="hidden md:flex items-center gap-2">
            <Link href="#features" className="px-4 py-2 text-slate-300 hover:text-white text-sm font-medium rounded-xl hover:bg-slate-800/60 transition">Features</Link>
            <Link href="#showcase" className="px-4 py-2 text-slate-300 hover:text-white text-sm font-medium rounded-xl hover:bg-slate-800/60 transition">Ecosystem</Link>
            <Link href="/terms" className="px-4 py-2 text-slate-300 hover:text-white text-sm font-medium rounded-xl hover:bg-slate-800/60 transition">Terms</Link>
            <Link href="/privacy" className="px-4 py-2 text-slate-300 hover:text-white text-sm font-medium rounded-xl hover:bg-slate-800/60 transition">Privacy</Link>
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800/80 transition"
            aria-label="Toggle navigation"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-800/80 py-4 px-2 space-y-2 bg-[#090d16]/95 backdrop-blur-2xl">
            <Link
              href="#features"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-4 py-2.5 text-slate-300 hover:text-white hover:bg-slate-800/60 rounded-xl text-sm font-medium"
            >
              Features
            </Link>
            <Link
              href="#showcase"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-4 py-2.5 text-slate-300 hover:text-white hover:bg-slate-800/60 rounded-xl text-sm font-medium"
            >
              Ecosystem & Apps
            </Link>
            <Link
              href="/terms"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-4 py-2.5 text-slate-300 hover:text-white hover:bg-slate-800/60 rounded-xl text-sm font-medium"
            >
              Terms & Conditions
            </Link>
            <Link
              href="/privacy"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-4 py-2.5 text-slate-300 hover:text-white hover:bg-slate-800/60 rounded-xl text-sm font-medium"
            >
              Privacy Policy
            </Link>
          </div>
        )}
      </nav>

      {/* ── Hero Section ── */}
      <section className="relative pt-16 pb-20 md:pt-24 md:pb-32 text-center overflow-hidden px-4 sm:px-6">
        {/* Glow Effects & SVG Doodle Background */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-full opacity-10 pointer-events-none">
          <Image src="/doodle.svg" alt="Doodle pattern" fill className="object-cover" />
        </div>
        <div className="absolute top-[-100px] left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-blue-600/20 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute top-[100px] right-[10%] w-[400px] h-[400px] bg-indigo-600/15 rounded-full blur-[120px] pointer-events-none" />

        <div className="max-w-4xl mx-auto relative z-10">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/30 rounded-full px-4 py-1.5 mb-8 text-xs sm:text-sm font-semibold text-blue-400 backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            Available on Android & Web — Modern & Encrypted
          </div>

          <div className="flex justify-center mb-6">
            <div className="relative p-1 bg-gradient-to-tr from-blue-500 via-indigo-500 to-purple-500 rounded-3xl shadow-2xl shadow-blue-500/30">
              <Image
                src="/app_icon.png"
                alt="Novix Messenger Icon"
                width={96}
                height={96}
                className="rounded-2xl w-20 h-20 sm:w-24 sm:h-24 object-cover"
              />
            </div>
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.1] mb-6">
            Chat, Call & Connect{' '}
            <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-400 bg-clip-text text-transparent">
              with Novix
            </span>
          </h1>

          <p className="text-base sm:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            A fast, secure, and modern messaging platform. Enjoy crystal-clear calls, end-to-end encrypted chats, built-in games, and integrated security features.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <a
              href="https://play.google.com/store"
              target="_blank"
              rel="noreferrer"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-2xl font-bold text-base shadow-xl shadow-blue-600/30 transition transform hover:-translate-y-0.5 active:translate-y-0"
            >
              <Download size={20} /> Download on Google Play
            </a>
            <Link
              href="#showcase"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 bg-slate-800/80 hover:bg-slate-800 text-slate-200 border border-slate-700/70 rounded-2xl font-semibold text-base backdrop-blur-md transition"
            >
              Explore Ecosystem <ChevronRight size={18} />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Stats Banner ── */}
      <section className="border-y border-slate-800/80 bg-slate-900/40 py-10 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { value: '100%', label: 'End-to-End Encrypted' },
            { value: 'HD Voice', label: 'Crystal-Clear Calls' },
            { value: '0 Ads', label: '100% Privacy Focused' },
            { value: '24/7', label: 'Real-Time Sync' },
          ].map((s) => (
            <div key={s.label} className="p-2">
              <div className="text-3xl sm:text-4xl font-extrabold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
                {s.value}
              </div>
              <div className="text-xs sm:text-sm text-slate-400 font-medium mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Flutter Ecosystem Showcase Section ── */}
      <section id="showcase" className="py-20 px-4 sm:px-6 relative bg-slate-950/60">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <div className="text-xs font-bold uppercase tracking-wider text-blue-400 mb-3">Ecosystem & Extra Apps</div>
            <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight mb-4">Integrated Modern Suite</h2>
            <p className="text-slate-400 text-base sm:text-lg max-w-xl mx-auto">
              Novix is more than just messaging — it is a complete suite of secure connectivity and entertainment.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Novix VPN Card */}
            <div className="group relative rounded-3xl bg-slate-900/80 border border-slate-800 p-6 sm:p-8 hover:border-blue-500/50 transition duration-300 shadow-xl overflow-hidden flex flex-col justify-between">
              <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl group-hover:bg-blue-600/20 transition" />
              <div>
                <div className="flex items-center justify-between mb-6">
                  <span className="p-3 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
                    <ShieldCheck size={28} />
                  </span>
                  <span className="text-xs font-mono px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full font-semibold">Included</span>
                </div>
                <h3 className="text-2xl font-bold mb-3 text-white">Novix VPN Protection</h3>
                <p className="text-slate-400 text-sm leading-relaxed mb-6">
                  Seamlessly encrypt your entire internet pipeline with high-speed proxy protocols. Protect your public Wi-Fi connections and keep your IP hidden.
                </p>
              </div>
              <div className="relative h-48 sm:h-56 w-full rounded-2xl overflow-hidden border border-slate-700/60 shadow-inner bg-slate-950/60 flex items-center justify-center p-4">
                <Image
                  src="/novix_vpn.png"
                  alt="Novix VPN Feature"
                  width={400}
                  height={220}
                  className="object-contain max-h-full rounded-lg group-hover:scale-105 transition duration-300"
                />
              </div>
            </div>

            {/* Snake X Card */}
            <div className="group relative rounded-3xl bg-slate-900/80 border border-slate-800 p-6 sm:p-8 hover:border-indigo-500/50 transition duration-300 shadow-xl overflow-hidden flex flex-col justify-between">
              <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/10 rounded-full blur-3xl group-hover:bg-indigo-600/20 transition" />
              <div>
                <div className="flex items-center justify-between mb-6">
                  <span className="p-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                    <Gamepad2 size={28} />
                  </span>
                  <span className="text-xs font-mono px-3 py-1 bg-indigo-500/20 text-indigo-300 rounded-full font-semibold">In-App Entertainment</span>
                </div>
                <h3 className="text-2xl font-bold mb-3 text-white">Snake X Gaming</h3>
                <p className="text-slate-400 text-sm leading-relaxed mb-6">
                  Play mini-games directly while chatting. Compete with your friends on global leaderboards and challenge your group members right inside conversations.
                </p>
              </div>
              <div className="relative h-48 sm:h-56 w-full rounded-2xl overflow-hidden border border-slate-700/60 shadow-inner bg-slate-950/60 flex items-center justify-center p-4">
                <Image
                  src="/snake_x.png"
                  alt="Snake X Game"
                  width={400}
                  height={220}
                  className="object-contain max-h-full rounded-lg group-hover:scale-105 transition duration-300"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features Grid ── */}
      <section id="features" className="py-20 px-4 sm:px-6 relative">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <div className="text-xs font-bold uppercase tracking-wider text-blue-400 mb-3">Core Features</div>
            <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight mb-4">Built for Effortless Communication</h2>
            <p className="text-slate-400 text-base sm:text-lg max-w-xl mx-auto">
              Everything you need in a modern messaging platform with clean design and responsive performance.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: <MessageCircle size={24} />, color: 'text-blue-400', bg: 'bg-blue-500/10',
                title: 'Instant Messaging',
                desc: 'Send text, emojis, audio notes, and media. Smooth real-time conversation flows.'
              },
              {
                icon: <Phone size={24} />, color: 'text-emerald-400', bg: 'bg-emerald-500/10',
                title: 'HD Voice Calls',
                desc: 'Low-latency crystal clear audio calls powered by modern WebRTC standard.'
              },
              {
                icon: <Video size={24} />, color: 'text-purple-400', bg: 'bg-purple-500/10',
                title: 'HD Video Calling',
                desc: 'High quality face-to-face video calls designed for stable performance.'
              },
              {
                icon: <Lock size={24} />, color: 'text-amber-400', bg: 'bg-amber-500/10',
                title: 'End-to-End Security',
                desc: 'Your conversations are private. Encryption ensures no third-party interception.'
              },
              {
                icon: <Users size={24} />, color: 'text-pink-400', bg: 'bg-pink-500/10',
                title: 'Group Communities',
                desc: 'Create group channels, manage member permissions, and share updates.'
              },
              {
                icon: <Bell size={24} />, color: 'text-teal-400', bg: 'bg-teal-500/10',
                title: 'Smart Push Alerts',
                desc: 'Receive immediate notifications for critical messages without draining battery.'
              },
            ].map((f) => (
              <div
                key={f.title}
                className="p-6 sm:p-8 rounded-3xl bg-slate-900/60 border border-slate-800/90 hover:border-slate-700 transition duration-300"
              >
                <div className={`w-12 h-12 rounded-2xl ${f.bg} ${f.color} flex items-center justify-center mb-5`}>
                  {f.icon}
                </div>
                <h3 className="text-xl font-bold mb-2 text-white">{f.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-slate-800/80 bg-slate-950/80 py-12 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-4">
            <Image src="/company_logo.png" alt="Company Logo" width={40} height={40} className="rounded-xl" />
            <div>
              <div className="font-extrabold text-white text-base">Novix Messenger</div>
              <div className="text-xs text-slate-500">© {new Date().getFullYear()} Novix Inc. All rights reserved.</div>
            </div>
          </div>

          <div className="flex flex-wrap justify-center gap-6 text-sm font-medium text-slate-400">
            <Link href="/terms" className="hover:text-white transition">Terms of Service</Link>
            <Link href="/privacy" className="hover:text-white transition">Privacy Policy</Link>
            <Link href="/delete-account" className="hover:text-white transition">Delete Account</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

