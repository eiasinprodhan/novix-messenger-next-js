import Link from 'next/link';
import { ArrowRight, Users, MessageCircle, Shield, Smartphone } from 'lucide-react';

export default function NovixHome() {
  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Navbar */}
      <nav className="border-b border-zinc-800 bg-zinc-950/90 backdrop-blur sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-xl flex items-center justify-center font-bold">N</div>
              <span className="font-semibold tracking-tight text-xl">Novix Messenger</span>
            </div>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <Link href="/admin" className="px-4 py-2 hover:bg-zinc-900 rounded-xl transition">Admin Dashboard</Link>
            <Link href="/auth" className="px-4 py-2 hover:bg-zinc-900 rounded-xl transition">Try Demo</Link>
            <a href="https://github.com" target="_blank" className="btn btn-secondary text-xs px-5">GitHub</a>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 pt-20 pb-24">
        {/* Hero */}
        <div className="text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-1 bg-zinc-900 rounded-full text-xs mb-4 border border-zinc-800">
            <span className="text-emerald-400">●</span> MVP v1 • Ready for Flutter
          </div>

          <h1 className="text-6xl font-semibold tracking-tighter leading-none mb-4">
            WhatsApp UI.<br />Telegram Features.
          </h1>
          <p className="text-xl text-zinc-400 max-w-md mx-auto">
            Novix Messenger — Full-stack MVP with modern Next.js backend, MongoDB, Admin Dashboard, and Flutter mobile app.
          </p>

          <div className="flex items-center justify-center gap-4 mt-10">
            <Link href="/admin" className="btn btn-primary px-8 py-4 text-base flex items-center gap-3">
              Open Admin Dashboard <ArrowRight size={18} />
            </Link>
            <Link href="/auth" className="btn btn-secondary px-8 py-4 text-base">
              Try Authentication Demo
            </Link>
          </div>

          <div className="mt-4 text-xs text-zinc-500">
            Built with Next.js + MongoDB • JWT Auth • Ready for Flutter
          </div>
        </div>

        {/* Features Grid */}
        <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-5">
          {[
            { icon: Users, title: "User & Friends", desc: "Register, login, search users, send/accept friend requests. Only friends can chat." },
            { icon: MessageCircle, title: "1:1 Messaging", desc: "Real-time ready messaging APIs. Text + Image messages, reply, reactions, delivery status." },
            { icon: Shield, title: "Admin Dashboard", desc: "Full control: Manage users, monitor friendships, view stats. Built-in Next.js UI." },
          ].map((feat, idx) => (
            <div key={idx} className="card">
              <div className="p-2 w-fit rounded-2xl bg-zinc-900 mb-4">
                <feat.icon className="text-blue-400" size={24} />
              </div>
              <h3 className="font-semibold text-lg mb-1">{feat.title}</h3>
              <p className="text-sm text-zinc-400">{feat.desc}</p>
            </div>
          ))}
        </div>

        {/* Tech Stack */}
        <div className="mt-20">
          <div className="text-center mb-8">
            <h3 className="text-sm font-semibold tracking-widest text-zinc-400">TECH STACK — FULL MVP</h3>
          </div>
          <div className="flex flex-wrap justify-center gap-3 text-sm">
            {['Next.js 16', 'MongoDB + Mongoose', 'JWT Authentication', 'bcrypt Passwords', 'Flutter (Mobile)', 'Tailwind CSS'].map((tech) => (
              <div key={tech} className="px-4 py-1.5 bg-zinc-900 border border-zinc-800 rounded-2xl text-zinc-300">
                {tech}
              </div>
            ))}
          </div>
        </div>

        {/* Quick Start */}
        <div className="mt-24 grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="card">
            <h3 className="font-semibold mb-4 flex items-center gap-2"><Smartphone size={18} /> Get Started (Backend)</h3>
            <ol className="text-sm space-y-3 text-zinc-300 list-decimal pl-4">
              <li>Copy <code className="bg-zinc-900 px-1.5 py-px rounded">.env.example</code> to <code className="bg-zinc-900 px-1.5 py-px rounded">.env.local</code></li>
              <li>Start MongoDB (local or Atlas)</li>
              <li>Run <code className="bg-zinc-900 px-1.5 py-px rounded">npm run dev</code></li>
              <li>Visit <Link href="/admin" className="text-blue-400 underline">/admin</Link> to manage users</li>
            </ol>
            <div className="mt-6">
              <Link href="/auth" className="text-blue-400 text-sm underline">→ Test Register/Login API</Link>
            </div>
          </div>

          <div className="card">
            <h3 className="font-semibold mb-4">Next Steps (Part by Part)</h3>
            <ul className="text-sm space-y-[9px]">
              <li className="flex gap-2"><span className="text-emerald-400">✓</span> Backend APIs (Auth, Users, Friends, Messages)</li>
              <li className="flex gap-2"><span className="text-emerald-400">✓</span> Admin Dashboard (Fully functional)</li>
              <li className="flex gap-2"><span className="text-yellow-400">→</span> <span className="font-medium">Next: Flutter Mobile App Setup</span></li>
              <li className="flex gap-2"><span className="text-zinc-400">○</span> WebSocket real-time updates</li>
              <li className="flex gap-2"><span className="text-zinc-400">○</span> Image upload + Group chat</li>
            </ul>
          </div>
        </div>
      </div>

      <footer className="border-t border-zinc-800 py-8 text-center text-xs text-zinc-500">
        Novix Messenger • All features implemented incrementally
      </footer>
    </div>
  );
}
