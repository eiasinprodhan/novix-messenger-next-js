'use client';

import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { 
  Settings, 
  Mail, 
  Bell, 
  Shield, 
  CheckCircle2, 
  AlertCircle, 
  Send, 
  Save, 
  Server, 
  Lock, 
  Radio, 
  Sparkles,
  ToggleLeft,
  ToggleRight,
  Info
} from 'lucide-react';

interface PlatformSettings {
  adminNotificationEmail: string;
  notifyOnNewUser: boolean;
  notifyOnNewReport: boolean;
  notifyOnNewGroup: boolean;
  allowRegistrations: boolean;
  maintenanceMode: boolean;
  systemAnnouncement: string;
}

const SETTINGS_CACHE_KEY = 'novix_admin_settings_cache';

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<PlatformSettings>({
    adminNotificationEmail: '',
    notifyOnNewUser: true,
    notifyOnNewReport: true,
    notifyOnNewGroup: false,
    allowRegistrations: true,
    maintenanceMode: false,
    systemAnnouncement: '',
  });

  const [saving, setSaving] = useState(false);
  const [testingEmail, setTestingEmail] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Restore cached settings post-hydration
  useEffect(() => {
    try {
      const raw = localStorage.getItem(SETTINGS_CACHE_KEY);
      if (raw) {
        setSettings(JSON.parse(raw));
      }
    } catch {}
  }, []);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch('/api/admin/settings', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && data.settings) {
        setSettings(data.settings);
        try {
          localStorage.setItem(SETTINGS_CACHE_KEY, JSON.stringify(data.settings));
        } catch {}
      }
    } catch (err) {
      console.error('Failed to load settings:', err);
    }
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(settings),
      });

      const data = await res.json();
      if (res.ok) {
        setMessage({ type: 'success', text: 'Admin settings saved successfully!' });
        toast.success('Admin settings saved successfully!');
        if (data.settings) setSettings(data.settings);
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to save settings' });
        toast.error(data.error || 'Failed to save settings');
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: 'Network error while saving settings' });
      toast.error('Network error while saving settings');
    } finally {
      setSaving(false);
    }
  };

  const handleSendTestEmail = async () => {
    if (!settings.adminNotificationEmail) {
      setMessage({ type: 'error', text: 'Please enter a notification email address first' });
      toast.error('Please enter a notification email address first');
      return;
    }

    setTestingEmail(true);
    setMessage(null);

    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch('/api/admin/settings/test-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ targetEmail: settings.adminNotificationEmail }),
      });

      const data = await res.json();
      if (res.ok) {
        setMessage({ type: 'success', text: `Test alert email sent to ${settings.adminNotificationEmail}! Check your inbox.` });
        toast.success(`Test alert email sent to ${settings.adminNotificationEmail}!`);
      } else {
        setMessage({ type: 'error', text: data.detail || data.error || 'Failed to send test email' });
        toast.error(data.detail || data.error || 'Failed to send test email');
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Network error sending test email' });
      toast.error('Network error sending test email');
    } finally {
      setTestingEmail(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200 w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Settings
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 font-medium">
            Configure admin email notification recipients, registration alerts & system operations
          </p>
        </div>
      </div>

      {/* Alert Banner */}
      {message && (
        <div
          className={`p-4 rounded-2xl text-sm font-semibold flex items-center justify-between border animate-in fade-in ${
            message.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60'
              : 'bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800/60'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {message.type === 'success' ? (
              <CheckCircle2 size={18} className="text-emerald-500 shrink-0" />
            ) : (
              <AlertCircle size={18} className="text-red-500 shrink-0" />
            )}
            <span>{message.text}</span>
          </div>
          <button onClick={() => setMessage(null)} className="text-xs font-bold hover:underline ml-4">
            ✕
          </button>
        </div>
      )}

      {/* Section 1: Admin Email Notifications */}
      <div className="bg-white dark:bg-[#111a2e] border border-slate-200/90 dark:border-slate-800/90 rounded-2xl p-6 sm:p-8 shadow-xs w-full">
        <div className="flex items-start justify-between pb-6 border-b border-slate-100 dark:border-slate-800/80 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900/50 flex items-center justify-center shrink-0">
              <Mail size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Admin Email Alerts</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Specify the email address where you will receive instant administrative alerts
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          {/* Target Email Input */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
              Admin Notification Recipient Email
            </label>
            <div className="flex flex-col sm:flex-row gap-2.5">
              <div className="relative flex-1">
                <input
                  type="email"
                  required
                  value={settings.adminNotificationEmail}
                  onChange={(e) => setSettings({ ...settings, adminNotificationEmail: e.target.value })}
                  placeholder="e.g. your-email@gmail.com"
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white text-sm font-medium focus:outline-none focus:border-blue-500 transition"
                />
                <Mail className="absolute left-3.5 top-3.5 text-slate-400 dark:text-slate-500" size={18} />
              </div>
              <button
                type="button"
                onClick={handleSendTestEmail}
                disabled={testingEmail || !settings.adminNotificationEmail}
                className="px-4 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer whitespace-nowrap"
              >
                <Send size={14} className={testingEmail ? 'animate-spin' : ''} />
                <span>{testingEmail ? 'Sending Test...' : 'Send Test Alert'}</span>
              </button>
            </div>
            <p className="text-[11px] text-slate-400 mt-2 flex items-center gap-1.5">
              <Info size={13} className="text-blue-500" />
              Notifications are dispatched automatically via your configured SMTP mail service.
            </p>
          </div>

          {/* Notification Toggles */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Trigger Conditions</h3>

            {/* Toggle: New User */}
            <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800/60">
              <div className="pr-4">
                <div className="text-sm font-bold text-slate-900 dark:text-white">New User Registration Alert</div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Receive an immediate email whenever a new user signs up with their name, username, email & country
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSettings({ ...settings, notifyOnNewUser: !settings.notifyOnNewUser })}
                className={`w-12 h-7 rounded-full transition-colors relative cursor-pointer shrink-0 ${
                  settings.notifyOnNewUser ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-700'
                }`}
              >
                <span
                  className={`absolute top-1 left-1 w-5 h-5 rounded-full bg-white transition-transform ${
                    settings.notifyOnNewUser ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Toggle: Content Report */}
            <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800/60">
              <div className="pr-4">
                <div className="text-sm font-bold text-slate-900 dark:text-white">Content Report Alert</div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Receive an alert whenever a user files a moderation report or abuse complaint
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSettings({ ...settings, notifyOnNewReport: !settings.notifyOnNewReport })}
                className={`w-12 h-7 rounded-full transition-colors relative cursor-pointer shrink-0 ${
                  settings.notifyOnNewReport ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-700'
                }`}
              >
                <span
                  className={`absolute top-1 left-1 w-5 h-5 rounded-full bg-white transition-transform ${
                    settings.notifyOnNewReport ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Toggle: New Group */}
            <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800/60">
              <div className="pr-4">
                <div className="text-sm font-bold text-slate-900 dark:text-white">New Group Created Alert</div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Receive an email whenever a member creates a new group or community channel
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSettings({ ...settings, notifyOnNewGroup: !settings.notifyOnNewGroup })}
                className={`w-12 h-7 rounded-full transition-colors relative cursor-pointer shrink-0 ${
                  settings.notifyOnNewGroup ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-700'
                }`}
              >
                <span
                  className={`absolute top-1 left-1 w-5 h-5 rounded-full bg-white transition-transform ${
                    settings.notifyOnNewGroup ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold shadow-md shadow-blue-500/20 transition flex items-center gap-2 cursor-pointer disabled:opacity-60"
            >
              <Save size={16} />
              <span>{saving ? 'Saving...' : 'Save Notification Preferences'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Section 2: Platform Controls */}
      <div className="bg-white dark:bg-[#111a2e] border border-slate-200/90 dark:border-slate-800/90 rounded-2xl p-6 sm:p-8 shadow-xs w-full">
        <div className="flex items-start justify-between pb-6 border-b border-slate-100 dark:border-slate-800/80 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-900/50 flex items-center justify-center shrink-0">
              <Server size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Platform Operations & Policy</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Control user registration access and maintenance state
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800/60">
            <div className="pr-4">
              <div className="text-sm font-bold text-slate-900 dark:text-white">Allow Public User Registrations</div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                When enabled, new users can freely register accounts via mobile and web apps
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                const next = !settings.allowRegistrations;
                setSettings({ ...settings, allowRegistrations: next });
              }}
              className={`w-12 h-7 rounded-full transition-colors relative cursor-pointer shrink-0 ${
                settings.allowRegistrations ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-700'
              }`}
            >
              <span
                className={`absolute top-1 left-1 w-5 h-5 rounded-full bg-white transition-transform ${
                  settings.allowRegistrations ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800/60">
            <div className="pr-4">
              <div className="text-sm font-bold text-slate-900 dark:text-white">System Maintenance Mode</div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Blocks client connections for maintenance while keeping admin console available
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                const next = !settings.maintenanceMode;
                setSettings({ ...settings, maintenanceMode: next });
              }}
              className={`w-12 h-7 rounded-full transition-colors relative cursor-pointer shrink-0 ${
                settings.maintenanceMode ? 'bg-red-600' : 'bg-slate-300 dark:bg-slate-700'
              }`}
            >
              <span
                className={`absolute top-1 left-1 w-5 h-5 rounded-full bg-white transition-transform ${
                  settings.maintenanceMode ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="button"
              onClick={() => handleSave()}
              disabled={saving}
              className="px-6 py-3 rounded-xl bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 dark:hover:bg-slate-600 text-white text-sm font-bold transition flex items-center gap-2 cursor-pointer disabled:opacity-60"
            >
              <Save size={16} />
              <span>{saving ? 'Saving...' : 'Save Platform Policy'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
