import Link from 'next/link';
import { ArrowRight, Users, MessageCircle, Shield, Smartphone, Zap, Lock, Globe, CheckCircle2 } from 'lucide-react';

export default function NovixHome() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-blue-500 selection:text-white">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs py-2 px-4 text-center font-medium shadow-sm">
        ✨ Novix Messenger Platform — Enterprise Admin Control & Mobile Sync Enabled
      </div>

      {/* Navbar */}
      <nav className="border-b border-slate-200/80 bg-white/90 backdrop-blur-md sticky top-0 z-50 transition-all">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center font-bold text-white shadow-md shadow-blue-500/20 text-lg">
              N
            </div>
            <div>
              <span className="font-bold tracking-tight text-xl text-slate-900 block leading-tight">Novix</span>
              <span className="text-[10px] text-blue-600 font-semibold tracking-wider uppercase block">Messenger Suite</span>
            </div>
          </div>
          <div className="flex items-center gap-3 text-sm font-medium">
            <Link 
              href="/admin/login" 
              className="px-4 py-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition"
            >
              Sign In
            </Link>
            <Link 
              href="/admin" 
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md shadow-blue-600/20 transition flex items-center gap-2"
            >
              <Shield size={16} /> Admin Portal
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative overflow-hidden pt-16 pb-24 border-b border-slate-200/60 bg-gradient-to-b from-white via-slate-50 to-blue-50/30">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-50 text-blue-700 rounded-full text-xs font-semibold mb-6 border border-blue-200/60 shadow-xs">
              <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span> Full-Stack Communication Engine
            </div>

            <h1 className="text-5xl sm:text-6xl font-extrabold tracking-tight text-slate-900 leading-tight mb-6">
              Powerful Administration for <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">Modern Messaging</span>
            </h1>
            <p className="text-lg sm:text-xl text-slate-600 leading-relaxed max-w-2xl mx-auto mb-10">
              Manage users, moderate safety reports, inspect real-time system logs, and control your Novix Flutter application from a clean, professional dashboard.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link 
                href="/admin" 
                className="w-full sm:w-auto px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-2xl shadow-lg shadow-blue-600/25 transition flex items-center justify-center gap-3 text-base"
              >
                Launch Admin Control <ArrowRight size={18} />
              </Link>
              <Link 
                href="/admin/login" 
                className="w-full sm:w-auto px-8 py-4 bg-white hover:bg-slate-100 text-slate-700 font-semibold rounded-2xl border border-slate-300 shadow-sm transition text-base"
              >
                Admin Login
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Feature Highlights Grid */}
      <div className="max-w-7xl mx-auto px-6 py-20">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 mb-3">Complete Administrative Suite</h2>
          <p className="text-slate-600 text-base">Designed with clarity and precision to manage your messaging ecosystem seamlessly.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white p-8 rounded-3xl border border-slate-200/80 shadow-sm hover:shadow-md transition">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-6">
              <Users size={24} />
            </div>
            <h3 className="font-bold text-xl text-slate-900 mb-2">User Control</h3>
            <p className="text-slate-600 text-sm leading-relaxed">
              View all accounts, search by name or email, toggle verification badges, modify roles, or create new administrative accounts instantly.
            </p>
          </div>

          <div className="bg-white p-8 rounded-3xl border border-slate-200/80 shadow-sm hover:shadow-md transition">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-6">
              <Shield size={24} />
            </div>
            <h3 className="font-bold text-xl text-slate-900 mb-2">Content Moderation</h3>
            <p className="text-slate-600 text-sm leading-relaxed">
              Review user safety reports with clear status tracking. Resolve or dismiss issues to maintain community standards.
            </p>
          </div>

          <div className="bg-white p-8 rounded-3xl border border-slate-200/80 shadow-sm hover:shadow-md transition">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-6">
              <Zap size={24} />
            </div>
            <h3 className="font-bold text-xl text-slate-900 mb-2">Live System Audit</h3>
            <p className="text-slate-600 text-sm leading-relaxed">
              Track administrative modifications with timestamped audit logs for complete security and transparency.
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-10">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2 font-medium text-slate-700">
            <div className="w-5 h-5 bg-blue-600 rounded text-white font-bold flex items-center justify-center text-[10px]">N</div>
            Novix Messenger Platform
          </div>
          <div>© {new Date().getFullYear()} Novix. All rights reserved.</div>
        </div>
      </footer>
    </div>
  );
}
