'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  MessageCircle, Phone, Video, Shield, Lock, Globe, Zap,
  Users, Star, ChevronRight, Check, Download, Smile, Bell,
  Menu, X, Gamepad2, ShieldCheck, Sparkles, ArrowRight,
  Sun, Moon, Mic, Send, Image as ImageIcon, Heart, CheckCheck,
  Headphones, Laptop, Smartphone, Eye, Server, Cpu, Play
} from 'lucide-react';

export default function NovixHome() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [mounted, setMounted] = useState(false);

  // Interactive Live Chat Demo State
  const [demoInput, setDemoInput] = useState('');
  const [demoMessages, setDemoMessages] = useState([
    { id: 1, sender: 'Alex Rivera', role: 'Product Lead', text: 'Hey team! Novix 2.0 end-to-end encryption & WebRTC video calls are officially live on Android & Web! 🚀', time: '10:42 AM', isMe: false, avatar: 'A' },
    { id: 2, sender: 'Sophia Chen', role: 'Security Architect', text: 'Just verified zero packet leaks over Novix VPN. Call latency is under 18ms globally! 🛡️✨', time: '10:43 AM', isMe: false, avatar: 'S' },
    { id: 3, sender: 'You', role: 'You', text: 'Stunning! The crisp audio quality and real-time push dispatch are completely instantaneous.', time: '10:44 AM', isMe: true, avatar: 'U' },
  ]);

  // Load and sync theme from localStorage and system preference
  useEffect(() => {
    try {
      const stored = (localStorage.getItem('novix_theme') || localStorage.getItem('novix_admin_theme')) as 'light' | 'dark' | null;
      if (stored === 'light' || stored === 'dark') {
        setTheme(stored);
        applyTheme(stored);
      } else {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const initial = prefersDark ? 'dark' : 'light';
        setTheme(initial);
        applyTheme(initial);
      }
    } catch {
      applyTheme('dark');
    }
    setMounted(true);
  }, []);

  const applyTheme = (t: 'light' | 'dark') => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    const body = document.body;
    if (t === 'dark') {
      root.classList.add('dark');
      body?.classList.add('dark');
      root.setAttribute('data-theme', 'dark');
      root.style.colorScheme = 'dark';
    } else {
      root.classList.remove('dark');
      body?.classList.remove('dark');
      root.setAttribute('data-theme', 'light');
      root.style.colorScheme = 'light';
    }
  };

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    applyTheme(next);
    try {
      localStorage.setItem('novix_theme', next);
      localStorage.setItem('novix_admin_theme', next);
    } catch (_) {}
  };

  const handleSendDemoMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!demoInput.trim()) return;
    const newMsg = {
      id: Date.now(),
      sender: 'You',
      role: 'You',
      text: demoInput.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isMe: true,
      avatar: 'U',
    };
    setDemoMessages((prev) => [...prev, newMsg]);
    setDemoInput('');
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#070b14] text-slate-900 dark:text-white font-sans overflow-x-hidden selection:bg-blue-600 selection:text-white transition-colors duration-300">
      
      {/* ── Top Announcement Banner ── */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white text-xs font-semibold py-2 px-4 text-center flex items-center justify-center gap-2 shadow-xs">
        <Sparkles size={14} className="animate-pulse shrink-0" />
        <span>Novix Messenger 2.0 is live! Featuring ultra-low latency WebRTC calls, high-speed VPN, & mini-games.</span>
        <Link href="#interactive-chat" className="underline font-bold hover:text-blue-100 hidden sm:inline ml-1">
          Try Interactive Demo →
        </Link>
      </div>

      {/* ── Navbar ── */}
      <nav className="sticky top-0 z-50 bg-white/80 dark:bg-[#070b14]/80 backdrop-blur-xl border-b border-slate-200/80 dark:border-slate-800/80 px-4 sm:px-8 transition-colors duration-300">
        <div className="max-w-7xl mx-auto h-18 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 p-0.5 shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform duration-200 shrink-0 overflow-hidden">
              <Image src="/app_icon.png" alt="Novix Logo" width={44} height={44} className="w-full h-full object-cover rounded-[14px]" />
            </div>
            <div>
              <div className="font-black text-xl tracking-tight leading-none text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                Novix
              </div>
              <div className="text-[10px] text-blue-600 dark:text-blue-400 font-extrabold tracking-widest uppercase">
                Messenger
              </div>
            </div>
          </Link>

          {/* Desktop Nav links */}
          <div className="hidden md:flex items-center gap-1">
            <Link href="#features" className="px-3.5 py-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white text-sm font-semibold rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/60 transition">
              Features
            </Link>
            <Link href="#interactive-chat" className="px-3.5 py-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white text-sm font-semibold rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/60 transition">
              Live Preview
            </Link>
            <Link href="#showcase" className="px-3.5 py-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white text-sm font-semibold rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/60 transition">
              Ecosystem
            </Link>
            <Link href="/terms" className="px-3.5 py-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white text-sm font-semibold rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/60 transition">
              Terms
            </Link>
            <Link href="/privacy" className="px-3.5 py-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white text-sm font-semibold rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/60 transition">
              Privacy
            </Link>
          </div>

          {/* Right Action Bar */}
          <div className="flex items-center gap-3">
            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
              className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800/80 bg-white/90 dark:bg-[#111a2e] text-slate-700 dark:text-amber-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition shadow-xs cursor-pointer"
              aria-label="Toggle theme"
            >
              {mounted && theme === 'light' ? (
                <Moon size={18} className="text-slate-700" />
              ) : (
                <Sun size={18} className="text-amber-400 animate-spin-slow" />
              )}
            </button>

            {/* Download CTA */}
            <a
              href="https://play.google.com/store"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold shadow-md shadow-blue-600/25 transition transform hover:-translate-y-0.5"
            >
              <Download size={15} />
              <span className="hidden sm:inline">Get the App</span>
              <span className="sm:hidden">Install</span>
            </a>

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              aria-label="Toggle navigation"
            >
              {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-200 dark:border-slate-800 py-4 px-2 space-y-2 bg-white/95 dark:bg-[#070b14]/95 backdrop-blur-2xl rounded-b-2xl shadow-xl animate-in slide-in-from-top-3 duration-200">
            <Link
              href="#features"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-4 py-2.5 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60 rounded-xl text-sm font-medium"
            >
              Core Features
            </Link>
            <Link
              href="#interactive-chat"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-4 py-2.5 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60 rounded-xl text-sm font-medium"
            >
              Interactive Chat Simulator
            </Link>
            <Link
              href="#showcase"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-4 py-2.5 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60 rounded-xl text-sm font-medium"
            >
              Ecosystem & Apps
            </Link>
            <Link
              href="/terms"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-4 py-2.5 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60 rounded-xl text-sm font-medium"
            >
              Terms & Conditions
            </Link>
            <Link
              href="/privacy"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-4 py-2.5 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60 rounded-xl text-sm font-medium"
            >
              Privacy Policy
            </Link>
          </div>
        )}
      </nav>

      {/* ── Hero Section ── */}
      <section className="relative pt-16 pb-20 md:pt-28 md:pb-36 text-center overflow-hidden px-4 sm:px-6">
        {/* Glow Effects & SVG Doodle Background */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-full opacity-5 dark:opacity-10 pointer-events-none">
          <Image src="/doodle.svg" alt="Doodle pattern" fill className="object-cover" />
        </div>
        <div className="absolute top-[-80px] left-1/2 -translate-x-1/2 w-[650px] h-[650px] bg-blue-500/10 dark:bg-blue-600/20 rounded-full blur-[150px] pointer-events-none" />
        <div className="absolute top-[120px] right-[8%] w-[450px] h-[450px] bg-indigo-500/10 dark:bg-indigo-600/15 rounded-full blur-[130px] pointer-events-none" />

        <div className="max-w-4xl mx-auto relative z-10">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/30 rounded-full px-4 py-1.5 mb-8 text-xs sm:text-sm font-bold text-blue-600 dark:text-blue-400 backdrop-blur-md shadow-xs">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
            <span>Next-Generation Encrypted Communication Suite</span>
          </div>

          {/* Center App Icon */}
          <div className="flex justify-center mb-6">
            <div className="relative p-1.5 bg-gradient-to-tr from-blue-500 via-indigo-500 to-purple-500 rounded-3xl shadow-2xl shadow-blue-500/30 animate-in zoom-in-75 duration-300">
              <Image
                src="/app_icon.png"
                alt="Novix Messenger Icon"
                width={96}
                height={96}
                className="rounded-2xl w-20 h-20 sm:w-24 sm:h-24 object-cover"
                priority
              />
            </div>
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-[1.08] mb-6 text-slate-900 dark:text-white">
            Ultra-Fast Chat, Voice & Video{' '}
            <span className="bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-600 bg-clip-text text-transparent">
              Built for Humans.
            </span>
          </h1>

          <p className="text-base sm:text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed font-normal">
            Novix delivers lightning-speed instant messaging, low-latency HD voice & video calls, military-grade end-to-end encryption, built-in VPN protection, and seamless community channels.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <a
              href="https://play.google.com/store"
              target="_blank"
              rel="noreferrer"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-2xl font-bold text-base shadow-xl shadow-blue-600/30 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
            >
              <Download size={20} />
              <span>Download on Google Play</span>
            </a>
            <Link
              href="#interactive-chat"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 bg-white dark:bg-slate-800/90 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700/80 rounded-2xl font-bold text-base backdrop-blur-md transition shadow-xs"
            >
              <span>Test Interactive Chat</span>
              <ChevronRight size={18} />
            </Link>
          </div>

          {/* Social Proof Tags */}
          <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-500 dark:text-slate-400 font-semibold">
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck size={16} className="text-emerald-500" /> End-to-End Encrypted
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Zap size={16} className="text-amber-500" /> &lt; 20ms Dispatch Latency
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Globe size={16} className="text-blue-500" /> Cross-Platform Android & Web
            </span>
          </div>
        </div>
      </section>

      {/* ── Stats Highlight Banner ── */}
      <section className="border-y border-slate-200 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/40 py-10 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { value: '100%', label: 'End-to-End Encrypted', sub: 'Zero eavesdropping' },
            { value: 'HD 60fps', label: 'Ultra-Clear Calling', sub: 'WebRTC Adaptive Bitrate' },
            { value: '0 Ads', label: '100% User Respect', sub: 'Zero tracking or selling' },
            { value: '99.99%', label: 'Uptime Reliability', sub: 'Multi-node server cluster' },
          ].map((s) => (
            <div key={s.label} className="p-2">
              <div className="text-3xl sm:text-4xl font-black bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">
                {s.value}
              </div>
              <div className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 font-bold mt-1">{s.label}</div>
              <div className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">{s.sub}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Interactive Live Chat & Calling Showcase ── */}
      <section id="interactive-chat" className="py-24 px-4 sm:px-6 relative bg-slate-100/60 dark:bg-[#090e1a]/80">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <div className="text-xs font-extrabold uppercase tracking-wider text-blue-600 dark:text-blue-400 mb-2">
              Interactive Preview
            </div>
            <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-slate-900 dark:text-white">
              Experience the Novix Chat Interface
            </h2>
            <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base max-w-xl mx-auto mt-2 font-medium">
              Try sending a message below to test our responsive conversation layout, message bubbles, and real-time dispatch aesthetics.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Left Column: Interactive Chat Window */}
            <div className="lg:col-span-8 bg-white dark:bg-[#101726] border border-slate-200 dark:border-slate-800 rounded-3xl shadow-xl overflow-hidden flex flex-col h-[560px]">
              
              {/* Chat Header */}
              <div className="p-4 sm:px-6 bg-slate-50 dark:bg-[#0c1220] border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold flex items-center justify-center text-sm shadow-xs">
                      N
                    </div>
                    <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white dark:border-[#0c1220]" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white flex items-center gap-1.5">
                      <span>Novix Core Product Team</span>
                      <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-blue-100 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300">
                        OFFICIAL
                      </span>
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">8 Members Active • End-to-End Encrypted</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-blue-600 transition" title="Start HD Voice Call">
                    <Phone size={16} />
                  </button>
                  <button className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 hover:bg-blue-100 transition" title="Start HD Video Call">
                    <Video size={16} />
                  </button>
                </div>
              </div>

              {/* Chat Messages Body */}
              <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4 bg-slate-50/50 dark:bg-[#0c1220]/40">
                <div className="text-center my-2">
                  <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-slate-200/70 dark:bg-slate-800 text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Today • Encrypted Channel
                  </span>
                </div>

                {demoMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex items-end gap-2.5 ${msg.isMe ? 'justify-end' : 'justify-start'} animate-in fade-in duration-200`}
                  >
                    {!msg.isMe && (
                      <div className="w-8 h-8 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold flex items-center justify-center text-xs shrink-0">
                        {msg.avatar}
                      </div>
                    )}
                    <div className={`max-w-[85%] sm:max-w-[70%] rounded-2xl p-3.5 shadow-xs ${
                      msg.isMe
                        ? 'bg-blue-600 text-white rounded-br-xs'
                        : 'bg-white dark:bg-slate-800/90 text-slate-800 dark:text-slate-100 border border-slate-200/80 dark:border-slate-700/60 rounded-bl-xs'
                    }`}>
                      {!msg.isMe && (
                        <div className="text-[11px] font-bold text-blue-600 dark:text-blue-400 mb-0.5">
                          {msg.sender} <span className="text-[10px] text-slate-400 font-normal">({msg.role})</span>
                        </div>
                      )}
                      <p className="text-xs sm:text-sm leading-relaxed">{msg.text}</p>
                      <div className={`flex items-center justify-end gap-1 mt-1 text-[10px] ${msg.isMe ? 'text-blue-100' : 'text-slate-400'}`}>
                        <span>{msg.time}</span>
                        {msg.isMe && <CheckCheck size={13} className="text-white" />}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Chat Input Bar */}
              <form onSubmit={handleSendDemoMessage} className="p-3 sm:p-4 bg-white dark:bg-[#0c1220] border-t border-slate-200 dark:border-slate-800 flex items-center gap-2">
                <input
                  type="text"
                  value={demoInput}
                  onChange={(e) => setDemoInput(e.target.value)}
                  placeholder="Type a message to preview live dispatch..."
                  className="flex-1 px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 transition font-medium"
                />
                <button
                  type="submit"
                  disabled={!demoInput.trim()}
                  className="p-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white shadow-xs transition flex items-center justify-center cursor-pointer"
                >
                  <Send size={16} />
                </button>
              </form>
            </div>

            {/* Right Column: Calling & Media Capabilities */}
            <div className="lg:col-span-4 space-y-4">
              
              {/* Voice Call Card */}
              <div className="p-5 rounded-3xl bg-white dark:bg-[#101726] border border-slate-200 dark:border-slate-800 shadow-md flex flex-col justify-between">
                <div className="flex items-center justify-between mb-4">
                  <span className="p-2.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/40">
                    <Phone size={20} />
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
                    HD VOICE
                  </span>
                </div>
                <h4 className="text-base font-bold text-slate-900 dark:text-white">Crystal-Clear WebRTC Audio</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-4 leading-relaxed">
                  Adaptive Opus codec bandwidth ensures zero voice lag even under poor 3G or variable Wi-Fi connections.
                </p>
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200/60 dark:border-slate-800 text-xs font-semibold">
                  <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Active Audio Buffer
                  </span>
                  <span className="text-slate-500">128 kbps stereo</span>
                </div>
              </div>

              {/* Video Call Card */}
              <div className="p-5 rounded-3xl bg-white dark:bg-[#101726] border border-slate-200 dark:border-slate-800 shadow-md flex flex-col justify-between">
                <div className="flex items-center justify-between mb-4">
                  <span className="p-2.5 rounded-2xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-900/40">
                    <Video size={20} />
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300">
                    1080P HD
                  </span>
                </div>
                <h4 className="text-base font-bold text-slate-900 dark:text-white">Fluid 60FPS Video Calling</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-4 leading-relaxed">
                  Hardware-accelerated rendering and background noise reduction for 1:1 and group team meetings.
                </p>
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200/60 dark:border-slate-800 text-xs font-semibold">
                  <span className="text-purple-600 dark:text-purple-400">VP9 / AV1 Hardware Codec</span>
                  <span className="text-slate-500">&lt; 20ms jitter</span>
                </div>
              </div>

            </div>

          </div>
        </div>
      </section>

      {/* ── Flutter Ecosystem Showcase Section ── */}
      <section id="showcase" className="py-24 px-4 sm:px-6 relative bg-slate-50 dark:bg-[#070b14] border-t border-slate-200 dark:border-slate-800/80">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <div className="text-xs font-extrabold uppercase tracking-wider text-blue-600 dark:text-blue-400 mb-2">
              Ecosystem & Integrated Tools
            </div>
            <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-slate-900 dark:text-white mb-4">
              More Than Just a Messenger
            </h2>
            <p className="text-slate-600 dark:text-slate-400 text-base sm:text-lg max-w-xl mx-auto font-medium">
              Novix includes built-in enterprise connectivity and entertainment features right out of the box.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Novix VPN Card */}
            <div className="group relative rounded-3xl bg-white dark:bg-[#101726] border border-slate-200 dark:border-slate-800 p-6 sm:p-8 hover:border-blue-500/50 transition-all duration-300 shadow-xl overflow-hidden flex flex-col justify-between">
              <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl group-hover:bg-blue-600/20 transition-opacity" />
              <div>
                <div className="flex items-center justify-between mb-6">
                  <span className="p-3 rounded-2xl bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 text-blue-600 dark:text-blue-400">
                    <ShieldCheck size={28} />
                  </span>
                  <span className="text-xs font-mono px-3 py-1 bg-blue-50 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 rounded-full font-bold">
                    Built-in Feature
                  </span>
                </div>
                <h3 className="text-2xl font-bold mb-3 text-slate-900 dark:text-white">Novix VPN Protection</h3>
                <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed mb-6 font-medium">
                  Seamlessly encrypt your entire internet pipeline with high-speed proxy protocols. Protect public Wi-Fi connections and keep your IP address hidden.
                </p>
              </div>
              <div className="relative h-48 sm:h-56 w-full rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700/60 shadow-inner bg-slate-100 dark:bg-slate-950/60 flex items-center justify-center p-4">
                <Image
                  src="/novix_vpn.png"
                  alt="Novix VPN Feature"
                  width={400}
                  height={220}
                  className="object-contain max-h-full rounded-lg group-hover:scale-105 transition-transform duration-300"
                />
              </div>
            </div>

            {/* Snake X Card */}
            <div className="group relative rounded-3xl bg-white dark:bg-[#101726] border border-slate-200 dark:border-slate-800 p-6 sm:p-8 hover:border-indigo-500/50 transition-all duration-300 shadow-xl overflow-hidden flex flex-col justify-between">
              <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/10 rounded-full blur-3xl group-hover:bg-indigo-600/20 transition-opacity" />
              <div>
                <div className="flex items-center justify-between mb-6">
                  <span className="p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 text-indigo-600 dark:text-indigo-400">
                    <Gamepad2 size={28} />
                  </span>
                  <span className="text-xs font-mono px-3 py-1 bg-indigo-50 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 rounded-full font-bold">
                    In-App Entertainment
                  </span>
                </div>
                <h3 className="text-2xl font-bold mb-3 text-slate-900 dark:text-white">Snake X Gaming</h3>
                <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed mb-6 font-medium">
                  Play mini-games directly while chatting. Compete with your friends on global leaderboards and challenge your group members right inside conversations.
                </p>
              </div>
              <div className="relative h-48 sm:h-56 w-full rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700/60 shadow-inner bg-slate-100 dark:bg-slate-950/60 flex items-center justify-center p-4">
                <Image
                  src="/snake_x.png"
                  alt="Snake X Game"
                  width={400}
                  height={220}
                  className="object-contain max-h-full rounded-lg group-hover:scale-105 transition-transform duration-300"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features Grid ── */}
      <section id="features" className="py-24 px-4 sm:px-6 relative bg-slate-100/50 dark:bg-[#090e1a]/50 border-t border-slate-200 dark:border-slate-800">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <div className="text-xs font-extrabold uppercase tracking-wider text-blue-600 dark:text-blue-400 mb-2">
              Engineered for Quality
            </div>
            <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-slate-900 dark:text-white mb-4">
              Everything You Need in One App
            </h2>
            <p className="text-slate-600 dark:text-slate-400 text-base sm:text-lg max-w-xl mx-auto font-medium">
              Every component is crafted with performance, battery efficiency, and human-centric design in mind.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: <MessageCircle size={24} />, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-500/10',
                title: 'Instant Messaging',
                desc: 'Send rich text, animated emojis, audio recordings, and media attachments with instant delivery receipts.'
              },
              {
                icon: <Phone size={24} />, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-500/10',
                title: 'HD Voice Calls',
                desc: 'WebRTC audio pipeline with dynamic acoustic echo cancellation and background suppression.'
              },
              {
                icon: <Video size={24} />, color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-500/10',
                title: 'HD Video Calling',
                desc: 'Crystal-clear face-to-face video calls optimized for low bandwidth and mobile battery life.'
              },
              {
                icon: <Lock size={24} />, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-500/10',
                title: 'End-to-End Encryption',
                desc: 'Private keys stay on your devices. No third-party, telecom, or ISP interception is mathematically possible.'
              },
              {
                icon: <Users size={24} />, color: 'text-pink-600 dark:text-pink-400', bg: 'bg-pink-50 dark:bg-pink-500/10',
                title: 'Group Communities',
                desc: 'Form group channels, assign admin moderators, share broadcast links, and create discussions.'
              },
              {
                icon: <Bell size={24} />, color: 'text-teal-600 dark:text-teal-400', bg: 'bg-teal-50 dark:bg-teal-500/10',
                title: 'Instant Push Alerts',
                desc: 'High-priority FCM notifications wake the app for calls and messages with zero battery drain.'
              },
            ].map((f) => (
              <div
                key={f.title}
                className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#101726] border border-slate-200 dark:border-slate-800/90 hover:border-blue-400 dark:hover:border-slate-700 transition duration-300 shadow-sm hover:shadow-md"
              >
                <div className={`w-12 h-12 rounded-2xl ${f.bg} ${f.color} flex items-center justify-center mb-5`}>
                  {f.icon}
                </div>
                <h3 className="text-xl font-bold mb-2 text-slate-900 dark:text-white">{f.title}</h3>
                <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed font-medium">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Call to Action (Install Novix) ── */}
      <section className="py-20 px-4 sm:px-6 relative overflow-hidden">
        <div className="max-w-5xl mx-auto rounded-3xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 p-8 sm:p-14 text-center text-white shadow-2xl relative">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-3xl sm:text-5xl font-black tracking-tight mb-4 leading-tight">
              Ready to Upgrade Your Chat Experience?
            </h2>
            <p className="text-blue-100 text-base sm:text-lg mb-8 font-medium">
              Join thousands enjoying seamless communication, encrypted privacy, and zero advertisement disruptions.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <a
                href="https://play.google.com/store"
                target="_blank"
                rel="noreferrer"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-4 bg-white text-blue-600 hover:bg-blue-50 rounded-2xl font-extrabold text-base shadow-lg transition transform hover:-translate-y-0.5"
              >
                <Download size={18} />
                <span>Install on Google Play</span>
              </a>
              <Link
                href="#interactive-chat"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 bg-blue-700/60 hover:bg-blue-700 text-white rounded-2xl font-bold text-base border border-blue-400/40 transition"
              >
                <span>Try Live Demo</span>
                <ChevronRight size={18} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-slate-200 dark:border-slate-800/80 bg-white dark:bg-[#070b14] py-14 px-4 sm:px-6 transition-colors duration-300">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 p-0.5 shadow-md shrink-0">
              <Image src="/app_icon.png" alt="Company Logo" width={44} height={44} className="rounded-[14px] object-cover" />
            </div>
            <div>
              <div className="font-extrabold text-slate-900 dark:text-white text-base">Novix Messenger</div>
              <div className="text-xs text-slate-500">© {new Date().getFullYear()} Novix Inc. All rights reserved.</div>
            </div>
          </div>

          <div className="flex flex-wrap justify-center gap-6 text-sm font-semibold text-slate-600 dark:text-slate-400">
            <Link href="#features" className="hover:text-blue-600 dark:hover:text-white transition">Features</Link>
            <Link href="#interactive-chat" className="hover:text-blue-600 dark:hover:text-white transition">Live Preview</Link>
            <Link href="/terms" className="hover:text-blue-600 dark:hover:text-white transition">Terms of Service</Link>
            <Link href="/privacy" className="hover:text-blue-600 dark:hover:text-white transition">Privacy Policy</Link>
            <Link href="/delete-account" className="hover:text-red-600 dark:hover:text-red-400 transition">Delete Account</Link>
          </div>
        </div>
      </footer>

    </div>
  );
}

