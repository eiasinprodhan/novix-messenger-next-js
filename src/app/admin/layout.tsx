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
  Activity,
  Bell,
  Search,
  ExternalLink,
  Settings,
  Server,
  ShieldAlert,
  Globe,
  CheckCircle2,
  Cpu
} from 'lucide-react';
import { AdminThemeProvider, ThemeToggleButton, useAdminTheme } from '@/components/admin/AdminThemeProvider';

interface NavItem {
  label: string;
  shortLabel?: string;
  href: string;
  icon: any;
  badge?: string | null;
  badgeColor?: 'blue' | 'amber' | 'emerald' | 'purple';
  description?: string;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const NAV_SECTIONS: NavSection[] = [
  {
    title: 'Core Telemetry',
    items: [
      {
        label: 'Overview & Analytics',
        shortLabel: 'Overview',
        href: '/admin',
        icon: BarChart3,
        description: 'Network metrics, KPIs & active throughput',
      },
    ],
  },
  {
    title: 'Directory & Governance',
    items: [
      {
        label: 'User Directory',
        shortLabel: 'Users',
        href: '/admin/users',
        icon: Users,
        description: 'Accounts, verification badges & credentials',
      },
      {
        label: 'Groups & Channels',
        shortLabel: 'Groups',
        href: '/admin/groups',
        icon: Users2,
        description: 'Multi-party rooms, memberships & access',
      },
      {
        label: 'Content Moderation',
        shortLabel: 'Moderation',
        href: '/admin/reports',
        icon: ShieldAlert,
        badge: 'Alerts',
        badgeColor: 'amber',
        description: 'Abuse triage queue & user reports',
      },
    ],
  },
  {
    title: 'Monetization & Ads',
    items: [
      {
        label: 'Ads & Stars Hub',
        shortLabel: 'Monetization',
        href: '/admin/ads',
        icon: Sparkles,
        badge: 'Live',
        badgeColor: 'emerald',
        description: 'Ad campaigns, Novix Stars & Premium status',
      },
    ],
  },
  {
    title: 'System Operations',
    items: [
      {
        label: 'Audit & Security Logs',
        shortLabel: 'Audit Logs',
        href: '/admin/logs',
        icon: FileText,
        description: 'Immutable administrative audit trail',
      },
      {
        label: 'Platform & Notification',
        shortLabel: 'Settings',
        href: '/admin/settings',
        icon: Settings,
        badge: 'Email Alerts',
        badgeColor: 'blue',
        description: 'Admin email recipient & feature toggles',
      },
    ],
  },
];

interface SidebarViewProps {
  isDrawer?: boolean;
  isCollapsed: boolean;
  pathname: string;
  adminUser: any;
  onToggleCollapse: () => void;
  onCloseDrawer: () => void;
  onLogout: () => void;
}

function SidebarView({
  isDrawer = false,
  isCollapsed,
  pathname,
  adminUser,
  onToggleCollapse,
  onCloseDrawer,
  onLogout,
}: SidebarViewProps) {
  const collapsed = !isDrawer && isCollapsed;

  const renderBadge = (item: NavItem, isActive: boolean) => {
    if (!item.badge) return null;
    const colorClasses = {
      blue: 'bg-blue-100 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800/60',
      amber: 'bg-amber-100 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/60',
      emerald: 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60',
      purple: 'bg-purple-100 dark:bg-purple-950/70 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800/60',
    }[item.badgeColor || 'blue'];

    return (
      <span
        className={`px-2 py-0.5 text-[10px] font-extrabold rounded-full uppercase tracking-wider border shrink-0 transition-colors ${
          isActive ? 'bg-white/20 text-white border-white/20' : colorClasses
        }`}
      >
        {item.badge}
      </span>
    );
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-[#0c1220] border-r border-slate-200 dark:border-slate-800/80 select-none transition-colors duration-200 overflow-hidden">
      {/* Workspace / Brand Header */}
      <div className={`p-4 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between shrink-0 ${collapsed ? 'flex-col gap-3 py-5' : ''}`}>
        <Link 
          href="/admin" 
          className={`flex items-center gap-3 group min-w-0 ${collapsed ? 'justify-center' : ''}`}
          title="Novix Messenger Enterprise Console"
        >
          <div className="relative shrink-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 p-0.5 shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform duration-200 overflow-hidden">
              <Image 
                src="/app_icon.png" 
                alt="Novix Enterprise Logo" 
                width={40} 
                height={40} 
                className="w-full h-full object-cover rounded-[10px]" 
              />
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-[#0c1220]" />
          </div>

          {!collapsed && (
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-slate-900 dark:text-white text-base tracking-tight truncate">
                  Novix
                </span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-blue-50 dark:bg-blue-950/70 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800/60">
                  Enterprise
                </span>
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate flex items-center gap-1">
                <span>Cluster: Prod-US-01</span>
              </div>
            </div>
          )}
        </Link>

        {isDrawer && (
          <button
            onClick={onCloseDrawer}
            className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            aria-label="Close navigation"
          >
            <X size={20} />
          </button>
        )}
      </div>

      {/* Workspace Environment Status Pill */}
      {!collapsed && (
        <div className="mx-3.5 mt-3 p-2 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            <div className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 truncate">
              Production Environment
            </div>
          </div>
          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase px-1.5 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700">
            v2.4
          </span>
        </div>
      )}

      {/* Navigation Sections with Persistent Scrolling */}
      <nav 
        className="p-3 flex-1 min-h-0 space-y-4 overflow-y-auto overflow-x-hidden overscroll-y-contain scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800"
      >
        {NAV_SECTIONS.map((section, secIdx) => (
          <div key={secIdx} className="space-y-1">
            {!collapsed ? (
              <div className="px-3 pt-2 pb-1 text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                {section.title}
              </div>
            ) : (
              <div className="w-8 h-[1px] bg-slate-200 dark:bg-slate-800 mx-auto my-2" />
            )}

            {section.items.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <div key={item.href} className="relative group">
                  <Link
                    href={item.href}
                    className={`relative flex items-center rounded-xl transition-all duration-150 ${
                      collapsed
                        ? 'w-11 h-11 mx-auto justify-center'
                        : 'px-3 py-2.5 justify-between'
                    } ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25 font-semibold'
                        : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/70 font-medium'
                    }`}
                  >
                    {/* Active Indicator Bar */}
                    {isActive && (
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-white rounded-r-full" />
                    )}

                    <div className="flex items-center gap-3 min-w-0">
                      <Icon
                        size={19}
                        className={`shrink-0 transition-transform duration-150 ${
                          isActive
                            ? 'text-white'
                            : 'text-slate-400 dark:text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 group-hover:scale-110'
                        }`}
                      />
                      {!collapsed && (
                        <span className="text-xs sm:text-sm truncate">
                          {item.label}
                        </span>
                      )}
                    </div>

                    {!collapsed && (
                      <div className="flex items-center gap-1.5 shrink-0 ml-2">
                        {renderBadge(item, isActive)}
                        {isActive && <ChevronRight size={13} className="text-white/80" />}
                      </div>
                    )}

                    {/* Collapsed dot badge */}
                    {collapsed && item.badge && (
                      <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-amber-500 ring-2 ring-white dark:ring-[#0c1220]" />
                    )}
                  </Link>

                  {/* Pure CSS Tooltip for Collapsed Sidebar (no state change, never resets scroll) */}
                  {collapsed && (
                    <div className="hidden group-hover:flex absolute left-full top-1/2 -translate-y-1/2 ml-3 z-50 px-3 py-1.5 bg-slate-900 text-white text-xs font-semibold rounded-xl shadow-xl whitespace-nowrap pointer-events-none border border-slate-700/80 items-center gap-2">
                      <span>{item.label}</span>
                      {item.badge && (
                        <span className="px-1.5 py-0.5 text-[9px] font-bold rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                          {item.badge}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}

        {/* Developer / Telemetry Link */}
        {!collapsed && (
          <div className="pt-2">
            <div className="px-3 pt-2 pb-1 text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              Developer Links
            </div>
            <a
              href="/api/admin/stats"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-850 transition"
            >
              <span className="flex items-center gap-2">
                <Activity size={14} className="text-emerald-500" />
                Raw Metrics Feed
              </span>
              <ExternalLink size={12} />
            </a>
          </div>
        )}
      </nav>

      {/* Telemetry Status Module */}
      {!collapsed && (
        <div className="px-3.5 py-2.5 border-t border-slate-100 dark:border-slate-800/70 shrink-0">
          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200/60 dark:border-slate-800/80 space-y-1.5">
            <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1.5">
                <Server size={11} className="text-emerald-500" />
                MongoDB + Sockets
              </span>
              <span className="text-emerald-600 dark:text-emerald-400">99.98% SLA</span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div className="bg-emerald-500 h-full rounded-full w-[99%]" />
            </div>
          </div>
        </div>
      )}

      {/* Administrator Profile Card */}
      <div className="p-3 border-t border-slate-100 dark:border-slate-800/70 shrink-0">
        <div className={`flex items-center gap-2.5 p-2 bg-slate-50 dark:bg-slate-900/90 rounded-2xl border border-slate-200/70 dark:border-slate-800/80 ${collapsed ? 'justify-center p-1.5' : ''}`}>
          <div className="relative shrink-0">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-black flex items-center justify-center text-xs shadow-xs">
              {adminUser?.name?.[0]?.toUpperCase() || 'A'}
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-[#0c1220]" />
          </div>

          {!collapsed && (
            <div className="flex-1 min-w-0">
              <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                {adminUser?.name || 'Administrator'}
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                {adminUser?.email || 'admin@novix.com'}
              </div>
            </div>
          )}

          <button
            onClick={onLogout}
            title="Sign Out of Admin Console"
            className="text-slate-400 hover:text-red-600 dark:hover:text-red-400 p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 transition cursor-pointer"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>

      {/* Desktop Collapse / Expand Toggle Button */}
      {!isDrawer && (
        <div className="px-3 py-2 border-t border-slate-100 dark:border-slate-800/60 hidden md:block shrink-0">
          <button
            onClick={onToggleCollapse}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-semibold text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-850 hover:text-slate-800 dark:hover:text-slate-200 transition cursor-pointer"
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? (
              <ChevronRight size={16} />
            ) : (
              <>
                <ChevronLeft size={16} />
                <span>Collapse Navigation</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}

function AdminLayoutInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [adminUser, setAdminUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { theme } = useAdminTheme();

  // Load saved sidebar state
  useEffect(() => {
    try {
      const savedCollapsed = localStorage.getItem('novix_admin_sidebar_collapsed');
      if (savedCollapsed !== null) {
        setIsCollapsed(savedCollapsed === 'true');
      }
    } catch (e) {
      // ignore
    }
  }, []);

  const toggleCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('novix_admin_sidebar_collapsed', String(next));
      } catch (e) {}
      return next;
    });
  };

  useEffect(() => {
    if (pathname === '/admin/login') {
      setLoading(false);
      return;
    }

    const token = localStorage.getItem('adminToken');
    const userStr = localStorage.getItem('adminUser');

    if (!token) {
      router.push('/admin/login');
      return;
    }

    if (userStr) {
      try {
        setAdminUser(JSON.parse(userStr));
      } catch (e) {
        setAdminUser({ name: 'Administrator', email: 'admin@novix.com', role: 'admin' });
      }
    }
    setLoading(false);
  }, [pathname, router]);

  // Close mobile drawer on route navigation
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

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

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#080c15] text-slate-400 text-sm font-medium">
        <div className="flex flex-col items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 p-0.5 shadow-2xl shadow-blue-500/30 animate-pulse">
            <Image src="/app_icon.png" alt="Novix" width={56} height={56} className="w-full h-full object-cover rounded-[14px]" />
          </div>
          <div className="flex items-center gap-2.5 text-xs font-bold tracking-widest uppercase text-slate-300">
            <div className="w-2 h-2 rounded-full bg-blue-500 animate-ping" />
            <span>Authenticating Enterprise Session...</span>
          </div>
        </div>
      </div>
    );
  }

  // Find active item info for breadcrumb
  let currentNavLabel = 'Console';
  let currentCategory = 'Workspace';
  for (const sec of NAV_SECTIONS) {
    const match = sec.items.find((i) => i.href === pathname);
    if (match) {
      currentNavLabel = match.label;
      currentCategory = sec.title;
      break;
    }
  }

  return (
    <div className="flex h-screen bg-[#f8fafc] dark:bg-[#080c15] text-slate-800 dark:text-slate-100 font-sans selection:bg-blue-600 selection:text-white overflow-hidden transition-colors duration-200">
      {/* Desktop Sidebar (Persistent Component Instance with Smooth Width Transition) */}
      <aside 
        className={`hidden md:flex flex-col shadow-xs shrink-0 z-30 h-full overflow-hidden transition-all duration-300 ease-in-out ${
          isCollapsed ? 'w-20' : 'w-68'
        }`}
      >
        <SidebarView
          isCollapsed={isCollapsed}
          pathname={pathname}
          adminUser={adminUser}
          onToggleCollapse={toggleCollapse}
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
          <div className="relative w-76 max-w-[85vw] h-full shadow-2xl z-10 animate-in slide-in-from-left duration-250">
            <SidebarView
              isDrawer={true}
              isCollapsed={false}
              pathname={pathname}
              adminUser={adminUser}
              onToggleCollapse={toggleCollapse}
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
          {/* Left Side: Mobile Menu Button & Breadcrumbs */}
          <div className="flex items-center gap-2.5 sm:gap-4 min-w-0">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="md:hidden p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-800/80 transition cursor-pointer"
              aria-label="Open navigation menu"
            >
              <Menu size={19} />
            </button>

            {/* Desktop Quick Sidebar Collapse Icon */}
            <button
              onClick={toggleCollapse}
              className="hidden md:flex p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
            </button>

            <div className="min-w-0">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 dark:text-slate-500 truncate">
                <span className="hidden sm:inline">Novix Enterprise</span>
                <span className="hidden sm:inline">/</span>
                <span className="hidden md:inline text-slate-500 dark:text-slate-400">{currentCategory}</span>
                <span className="hidden md:inline">/</span>
                <span className="text-blue-600 dark:text-blue-400 font-bold truncate">
                  {currentNavLabel}
                </span>
              </div>
              <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate hidden sm:block">
                {currentNavLabel}
              </h2>
            </div>
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
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-black flex items-center justify-center text-xs shadow-xs shrink-0">
                {adminUser?.name?.[0]?.toUpperCase() || 'A'}
              </div>
              <div className="hidden xl:block text-left">
                <div className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate max-w-[120px]">
                  {adminUser?.name || 'Administrator'}
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
          <div className="max-w-7xl mx-auto w-full">
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
