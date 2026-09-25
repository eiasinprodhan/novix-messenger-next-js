'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { 
  Users, 
  BarChart3, 
  Shield, 
  LogOut, 
  Flag, 
  FileText, 
  ChevronRight, 
  ChevronLeft,
  Users2, 
  Menu, 
  X,
  Sparkles,
  Star,
  Layers,
  UserCheck,
  Activity,
  Bell,
  Search,
  ExternalLink,
  Settings,
  Server,
  ShieldAlert,
  Globe,
  CheckCircle2,
  PanelLeftClose,
  PanelLeftOpen,
  PanelLeft,
  Cpu
} from 'lucide-react';
import { AdminThemeProvider, ThemeToggleButton, useAdminTheme } from '@/components/admin/AdminThemeProvider';

interface NavItem {
  label: string;
  href: string;
  icon: any;
  description?: string;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const NAV_SECTIONS: NavSection[] = [
  {
    title: 'Main',
    items: [
      {
        label: 'Dashboard',
        href: '/admin',
        icon: BarChart3,
        description: 'Network metrics, KPIs & active throughput',
      },
    ],
  },
  {
    title: 'Community',
    items: [
      {
        label: 'Users',
        href: '/admin/users',
        icon: Users,
        description: 'Accounts, verification badges & credentials',
      },
      {
        label: 'Groups',
        href: '/admin/groups',
        icon: Users2,
        description: 'Multi-party rooms, memberships & access',
      },
      {
        label: 'Friends',
        href: '/admin/friends',
        icon: UserCheck,
        description: 'Friendships graph, pending & mutual connections',
      },
      {
        label: 'Reports',
        href: '/admin/reports',
        icon: ShieldAlert,
        description: 'Abuse triage queue & user reports',
      },
    ],
  },
  {
    title: 'Monetization',
    items: [
      {
        label: 'Ads',
        href: '/admin/ads',
        icon: Layers,
        description: 'Sponsored banners, impressions & CTR tracking',
      },
      {
        label: 'Stars',
        href: '/admin/stars',
        icon: Star,
        description: 'Novix Stars ledger, balance adjustments & VIP tiers',
      },
    ],
  },
  {
    title: 'System',
    items: [
      {
        label: 'Logs',
        href: '/admin/logs',
        icon: FileText,
        description: 'Immutable administrative audit trail',
      },
      {
        label: 'Settings',
        href: '/admin/settings',
        icon: Settings,
        description: 'Admin email recipient & feature toggles',
      },
    ],
  },
];

interface SidebarViewProps {
  isDrawer?: boolean;
  isCollapsed?: boolean;
  pathname: string;
  adminUser?: any;
  onCloseDrawer: () => void;
  onLogout: () => void;
}

function SidebarView({
  isDrawer = false,
  isCollapsed = false,
  pathname,
  adminUser,
  onCloseDrawer,
  onLogout,
}: SidebarViewProps) {
  return (
    <div className="flex flex-col h-full bg-white dark:bg-[#0c1220] select-none transition-colors duration-200 overflow-hidden">
      {/* Workspace / Brand Header */}
      <div className={`border-b border-slate-100 dark:border-slate-800/80 flex items-center shrink-0 ${
        isCollapsed ? 'p-3.5 justify-center' : 'p-4 justify-between'
      }`}>
        <Link 
          href="/admin" 
          className="flex items-center gap-3 group min-w-0"
          title="Novix Messenger Console"
        >
          <div className="relative shrink-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 p-0.5 shadow-sm shadow-blue-500/20 group-hover:scale-105 transition-transform duration-200 overflow-hidden">
              <Image 
                src="/app_icon.png" 
                alt="Novix Admin Logo" 
                width={36} 
                height={36} 
                className="w-full h-full object-cover rounded-[10px]" 
              />
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-[#0c1220]" />
          </div>

          {!isCollapsed && (
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-slate-900 dark:text-white text-base tracking-tight truncate">
                  Novix
                </span>
                <span className="px-1.5 py-0.5 text-[10px] font-black uppercase tracking-wider bg-blue-50 dark:bg-blue-950/70 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800/60 rounded">
                  Admin
                </span>
              </div>
            </div>
          )}
        </Link>

        {isDrawer && (
          <button
            onClick={onCloseDrawer}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            aria-label="Close navigation"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* Navigation Sections */}
      <nav className={`flex-1 flex flex-col justify-start overflow-y-auto scrollbar-none select-none ${
        isCollapsed ? 'p-2 space-y-2' : 'p-3 space-y-1.5'
      }`}>
        {NAV_SECTIONS.map((section, secIdx) => (
          <div key={secIdx} className={isCollapsed ? 'space-y-1.5' : 'space-y-0.5'}>
            {isCollapsed ? (
              secIdx > 0 && <div className="border-t border-slate-100 dark:border-slate-800/80 my-2 mx-1" />
            ) : (
              <div className="px-3 pt-2 pb-1 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                {section.title}
              </div>
            )}

            {section.items.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={item.label}
                  className={`relative flex items-center rounded-xl transition-all duration-150 ${
                    isCollapsed
                      ? 'justify-center w-11 h-11 mx-auto'
                      : 'gap-3 px-3.5 py-2.5'
                  } ${
                    isActive
                      ? 'bg-blue-50/90 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 font-semibold shadow-xs border border-blue-200/80 dark:border-blue-800/60'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/80 dark:hover:bg-slate-800/60 font-medium'
                  }`}
                >
                  <Icon
                    size={19}
                    className={`shrink-0 transition-transform duration-150 ${
                      isActive
                        ? 'text-blue-600 dark:text-blue-400'
                        : 'text-slate-400 dark:text-slate-400'
                    }`}
                  />
                  {!isCollapsed && (
                    <span className="text-sm truncate">
                      {item.label}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Logout Button */}
      <div className={`border-t border-slate-100 dark:border-slate-800/70 shrink-0 ${
        isCollapsed ? 'p-2 flex justify-center' : 'p-3'
      }`}>
        <button
          onClick={onLogout}
          title="Sign Out of Admin Console"
          className={`flex items-center rounded-xl font-semibold text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer ${
            isCollapsed
              ? 'justify-center w-11 h-11'
              : 'w-full gap-3 px-3.5 py-2.5 text-sm'
          }`}
        >
          <LogOut size={19} className="shrink-0" />
          {!isCollapsed && <span>Logout</span>}
        </button>
      </div>
    </div>
  );
}

function AdminLayoutInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [adminUser, setAdminUser] = useState<any>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  const [mounted, setMounted] = useState<boolean>(false);
  const { theme } = useAdminTheme();

  // Load client-only preferences after initial hydration
  useEffect(() => {
    setMounted(true);
    try {
      const savedCollapsed = localStorage.getItem('novix_admin_sidebar_collapsed');
      if (savedCollapsed === 'true') {
        setIsSidebarCollapsed(true);
      }
    } catch {
      // ignore
    }
  }, []);

  const toggleSidebarCollapse = () => {
    setIsSidebarCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('novix_admin_sidebar_collapsed', String(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  useEffect(() => {
    if (pathname === '/admin/login') return;

    const token = localStorage.getItem('adminToken');
    if (!token) {
      router.push('/admin/login');
      return;
    }

    const userStr = localStorage.getItem('adminUser');
    if (userStr) {
      try {
        setAdminUser(JSON.parse(userStr));
      } catch {
        setAdminUser({ name: 'Administrator', email: 'admin@novix.com', role: 'admin' });
      }
    }
  }, [pathname, router]);

  // Close mobile drawer on route navigation
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  // Find active item info for browser tab title (unconditionally at top level)
  let currentNavLabel = 'Dashboard';
  for (const sec of NAV_SECTIONS) {
    const match = sec.items.find((i) => i.href === pathname);
    if (match) {
      currentNavLabel = match.label;
      break;
    }
  }

  // Dynamically set browser tab page title (unconditionally at top level before early returns)
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.title = `${currentNavLabel} | Novix Admin`;
    }
  }, [currentNavLabel]);

  const handleLogout = () => {
    if (confirm('Are you sure you want to sign out of the Novix Admin Console?')) {
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminUser');
      router.push('/admin/login');
    }
  };

  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  return (
    <div className="flex h-screen bg-[#f8fafc] dark:bg-[#080c15] text-slate-800 dark:text-slate-100 font-sans selection:bg-blue-600 selection:text-white overflow-hidden transition-colors duration-200">
      {/* Desktop Sidebar (Collapsible: w-[72px] icon-only or w-64 full) */}
      <aside className={`hidden md:flex flex-col shadow-xs shrink-0 z-30 h-full border-r border-slate-200 dark:border-slate-800/80 overflow-hidden transition-[width] duration-200 ease-in-out ${
        isSidebarCollapsed ? 'w-[72px]' : 'w-64'
      }`}>
        <SidebarView
          pathname={pathname}
          adminUser={adminUser}
          isCollapsed={isSidebarCollapsed}
          onCloseDrawer={() => setIsMobileMenuOpen(false)}
          onLogout={handleLogout}
        />
      </aside>

      {/* Mobile Off-Canvas Drawer (100% Responsive) */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex animate-in fade-in duration-200">
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <div className="relative w-72 max-w-[85vw] h-full shadow-2xl z-10 animate-in slide-in-from-left duration-250">
            <SidebarView
              isDrawer={true}
              isCollapsed={false}
              pathname={pathname}
              adminUser={adminUser}
              onCloseDrawer={() => setIsMobileMenuOpen(false)}
              onLogout={handleLogout}
            />
          </div>
        </div>
      )}

      {/* Main Content Viewport */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Modern Enterprise Top Header */}
        <header className="h-16 px-3 sm:px-6 lg:px-8 border-b border-slate-200 dark:border-slate-800/80 bg-white/85 dark:bg-[#0c1220]/85 backdrop-blur-md flex items-center justify-between shrink-0 z-20 transition-colors duration-200">
          {/* Left Side: Collapse Toggle Button & Mobile Menu Toggle */}
          <div className="flex items-center gap-2 min-w-0">
            {/* Mobile Drawer Button */}
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="md:hidden p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-800/80 transition cursor-pointer"
              aria-label="Open navigation menu"
            >
              <Menu size={19} />
            </button>

            {/* Desktop Collapse / Expand Sidebar Toggle */}
            <button
              onClick={toggleSidebarCollapse}
              className="hidden md:flex items-center justify-center p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-800/80 transition cursor-pointer"
              title={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              aria-label={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {isSidebarCollapsed ? (
                <PanelLeftOpen size={19} />
              ) : (
                <PanelLeftClose size={19} />
              )}
            </button>
          </div>

          {/* Right Side: Telemetry Pill, Theme Toggle, Admin Avatar */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Real-time Status Badge */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/50 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="hidden lg:inline">Engine Active</span>
              <span className="lg:hidden">Online</span>
            </div>

            {/* Light / Dark Mode Toggle Switcher */}
            <ThemeToggleButton />

            {/* Quick Admin Profile Display */}
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-800">
              <div 
                suppressHydrationWarning
                className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-black flex items-center justify-center text-xs shadow-xs shrink-0"
              >
                {mounted ? (adminUser?.name?.[0]?.toUpperCase() || 'A') : 'A'}
              </div>
              <div suppressHydrationWarning className="hidden xl:block text-left">
                <div 
                  suppressHydrationWarning
                  className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate max-w-[120px]"
                >
                  {mounted ? (adminUser?.name || 'Administrator') : 'Administrator'}
                </div>
                <div className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                  Super Admin
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Responsive Page Body Container */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-3.5 sm:p-6 lg:p-8 bg-[#f8fafc] dark:bg-[#080c15] transition-colors duration-200">
          <div className="w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminThemeProvider>
      <AdminLayoutInner>{children}</AdminLayoutInner>
    </AdminThemeProvider>
  );
}
