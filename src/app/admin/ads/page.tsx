'use client';

import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Plus,
  Trash2,
  Edit3,
  ExternalLink,
  Eye,
  MousePointerClick,
  CheckCircle2,
  AlertCircle,
  Search,
  Star,
  ShieldCheck,
  Crown,
  RefreshCw,
  ToggleLeft,
  ToggleRight,
  TrendingUp,
  X,
  Building2,
  Layers,
  ArrowUpRight,
  User as UserIcon,
} from 'lucide-react';

interface AdCampaign {
  _id: string;
  title: string;
  description: string;
  advertiser: string;
  advertiserLogo?: string;
  imageUrl?: string;
  ctaText: string;
  url: string;
  category: string;
  isActive: boolean;
  impressions: number;
  clicks: number;
  createdAt: string;
}

interface MonetizationUser {
  id: string;
  name: string;
  username: string;
  email: string;
  avatar: string;
  telegramStars: number;
  isPremium: boolean;
  premiumPlan?: string;
  premiumExpiresAt?: string;
  createdAt: string;
}

export default function AdminAdsPage() {
  const [activeTab, setActiveTab] = useState<'ads' | 'stars'>('ads');

  // Ads state
  const [ads, setAds] = useState<AdCampaign[]>([]);
  const [adsLoading, setAdsLoading] = useState(true);
  const [adsStats, setAdsStats] = useState({
    totalAds: 0,
    activeAds: 0,
    pausedAds: 0,
    totalImpressions: 0,
    totalClicks: 0,
    avgCtr: '0.00%',
  });

  // Modal states for Ads
  const [isAdModalOpen, setIsAdModalOpen] = useState(false);
  const [editingAd, setEditingAd] = useState<AdCampaign | null>(null);
  const [adForm, setAdForm] = useState({
    title: '',
    description: '',
    advertiser: '',
    advertiserLogo: '',
    imageUrl: '',
    ctaText: 'Learn More',
    url: '',
    category: 'Technology',
    isActive: true,
  });

  // Stars & Premium state
  const [users, setUsers] = useState<MonetizationUser[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const [monetizationStats, setMonetizationStats] = useState({
    totalUsers: 0,
    totalPremiumUsers: 0,
    totalStarsInCirculation: 0,
  });

  // Stars adjustment modal
  const [isStarModalOpen, setIsStarModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<MonetizationUser | null>(null);
  const [starAdjustment, setStarAdjustment] = useState({
    mode: 'add' as 'add' | 'deduct' | 'set',
    amount: '100',
    reason: 'Promotional Reward',
  });

  // Premium adjustment modal
  const [isPremiumModalOpen, setIsPremiumModalOpen] = useState(false);
  const [premiumForm, setPremiumForm] = useState({
    isPremium: true,
    plan: 'monthly',
    durationMonths: '1',
  });

  // Notifications
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchAds();
    fetchMonetization();
  }, []);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  const getHeaders = () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : '';
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    };
  };

  // Fetch Ads
  const fetchAds = async () => {
    setAdsLoading(true);
    try {
      const res = await fetch('/api/admin/ads', { headers: getHeaders() });
      const data = await res.json();
      if (res.ok && data.success) {
        setAds(data.ads || []);
        if (data.stats) setAdsStats(data.stats);
      }
    } catch (err) {
      console.error('Failed to load ads:', err);
    } finally {
      setAdsLoading(false);
    }
  };

  // Fetch Monetization & Users
  const fetchMonetization = async (q = '') => {
    setUsersLoading(true);
    try {
      const res = await fetch(`/api/admin/monetization?q=${encodeURIComponent(q)}`, { headers: getHeaders() });
      const data = await res.json();
      if (res.ok && data.success) {
        setUsers(data.users || []);
        if (data.stats) setMonetizationStats(data.stats);
      }
    } catch (err) {
      console.error('Failed to load monetization:', err);
    } finally {
      setUsersLoading(false);
    }
  };

  // Create or Update Ad
  const handleSaveAd = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingAd) {
        // Update
        const res = await fetch('/api/admin/ads', {
          method: 'PATCH',
          headers: getHeaders(),
          body: JSON.stringify({ id: editingAd._id, ...adForm }),
        });
        const data = await res.json();
        if (res.ok && data.success) {
          showNotification('success', 'Ad campaign updated successfully!');
          setIsAdModalOpen(false);
          fetchAds();
        } else {
          showNotification('error', data.error || 'Failed to update ad');
        }
      } else {
        // Create
        const res = await fetch('/api/admin/ads', {
          method: 'POST',
          headers: getHeaders(),
          body: JSON.stringify(adForm),
        });
        const data = await res.json();
        if (res.ok && data.success) {
          showNotification('success', 'New ad campaign created and active!');
          setIsAdModalOpen(false);
          fetchAds();
        } else {
          showNotification('error', data.error || 'Failed to create ad');
        }
      }
    } catch (err: any) {
      showNotification('error', err.message || 'Error saving ad');
    } finally {
      setSubmitting(false);
    }
  };

  // Toggle Ad Active
  const handleToggleAdStatus = async (ad: AdCampaign) => {
    try {
      const res = await fetch('/api/admin/ads', {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify({ id: ad._id, isActive: !ad.isActive }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setAds((prev) =>
          prev.map((a) => (a._id === ad._id ? { ...a, isActive: !ad.isActive } : a))
        );
        showNotification('success', `Ad ${!ad.isActive ? 'activated' : 'paused'}`);
      }
    } catch (err) {
      showNotification('error', 'Failed to toggle status');
    }
  };

  // Delete Ad
  const handleDeleteAd = async (adId: string) => {
    if (!confirm('Are you sure you want to permanently delete this ad campaign?')) return;
    try {
      const res = await fetch(`/api/admin/ads?id=${adId}`, {
        method: 'DELETE',
        headers: getHeaders(),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showNotification('success', 'Ad campaign deleted');
        setAds((prev) => prev.filter((a) => a._id !== adId));
      } else {
        showNotification('error', data.error || 'Failed to delete');
      }
    } catch (err) {
      showNotification('error', 'Error deleting ad');
    }
  };

  // Submit Stars Adjustment
  const handleSaveStars = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/admin/monetization', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          action: 'adjust_stars',
          userId: selectedUser.id,
          amount: starAdjustment.amount,
          mode: starAdjustment.mode,
          reason: starAdjustment.reason,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showNotification('success', data.message || 'Stars balance updated!');
        setIsStarModalOpen(false);
        fetchMonetization(userSearch);
      } else {
        showNotification('error', data.error || 'Failed to update stars');
      }
    } catch (err: any) {
      showNotification('error', err.message || 'Error adjusting stars');
    } finally {
      setSubmitting(false);
    }
  };

  // Submit Premium Update
  const handleSavePremium = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/admin/monetization', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          action: 'set_premium',
          userId: selectedUser.id,
          isPremium: premiumForm.isPremium,
          plan: premiumForm.plan,
          durationMonths: premiumForm.durationMonths,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showNotification('success', data.message || 'Premium status updated!');
        setIsPremiumModalOpen(false);
        fetchMonetization(userSearch);
      } else {
        showNotification('error', data.error || 'Failed to update premium');
      }
    } catch (err: any) {
      showNotification('error', err.message || 'Error updating premium');
    } finally {
      setSubmitting(false);
    }
  };

  const openCreateAdModal = () => {
    setEditingAd(null);
    setAdForm({
      title: '',
      description: '',
      advertiser: '',
      advertiserLogo: '',
      imageUrl: '',
      ctaText: 'Learn More',
      url: '',
      category: 'Technology',
      isActive: true,
    });
    setIsAdModalOpen(true);
  };

  const openEditAdModal = (ad: AdCampaign) => {
    setEditingAd(ad);
    setAdForm({
      title: ad.title,
      description: ad.description,
      advertiser: ad.advertiser,
      advertiserLogo: ad.advertiserLogo || '',
      imageUrl: ad.imageUrl || '',
      ctaText: ad.ctaText || 'Learn More',
      url: ad.url,
      category: ad.category || 'Technology',
      isActive: ad.isActive,
    });
    setIsAdModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {notification && (
        <div
          className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl text-sm font-medium border animate-in slide-in-from-top duration-200 ${
            notification.type === 'success'
              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
              : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
          }`}
        >
          {notification.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Monetization & Ads Hub</h1>
            <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-purple-100 dark:bg-purple-950/70 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
              Live Real-Time
            </span>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Manage sponsored ad campaigns, oversee user Novix Stars circulation, and grant Novix Premium access.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              fetchAds();
              fetchMonetization(userSearch);
            }}
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl hover:shadow-sm transition-all"
            title="Refresh data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          {activeTab === 'ads' && (
            <button
              onClick={openCreateAdModal}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl text-sm font-medium shadow-sm shadow-purple-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <Plus className="w-4 h-4" />
              <span>Create Ad Campaign</span>
            </button>
          )}
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-gray-200/80 dark:border-slate-800/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Active Ads</span>
            <Layers className="w-4 h-4 text-purple-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-gray-900 dark:text-white">{adsStats.activeAds}</span>
            <span className="text-xs text-gray-400">/ {adsStats.totalAds} Total</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-gray-200/80 dark:border-slate-800/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Ad Impressions</span>
            <Eye className="w-4 h-4 text-blue-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-gray-900 dark:text-white">
              {adsStats.totalImpressions.toLocaleString()}
            </span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-gray-200/80 dark:border-slate-800/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Clicks & CTR</span>
            <MousePointerClick className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-gray-900 dark:text-white">{adsStats.totalClicks}</span>
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">{adsStats.avgCtr}</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-gray-200/80 dark:border-slate-800/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Stars In Circulation</span>
            <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-amber-500">
              {monetizationStats.totalStarsInCirculation.toLocaleString()}
            </span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-gray-200/80 dark:border-slate-800/80 shadow-xs col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Premium Users</span>
            <Crown className="w-4 h-4 text-purple-500 fill-purple-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {monetizationStats.totalPremiumUsers}
            </span>
            <span className="text-xs text-gray-400">Active</span>
          </div>
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="flex items-center gap-2 border-b border-gray-200 dark:border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('ads')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
            activeTab === 'ads'
              ? 'bg-purple-600 text-white shadow-sm shadow-purple-500/20'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-800'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Sponsored Ad Campaigns ({ads.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('stars')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
            activeTab === 'stars'
              ? 'bg-purple-600 text-white shadow-sm shadow-purple-500/20'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-800'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>Novix Stars & Premium Governance</span>
        </button>
      </div>

      {/* TAB 1: ADS MANAGEMENT */}
      {activeTab === 'ads' && (
        <div className="space-y-4">
          {adsLoading ? (
            <div className="flex items-center justify-center p-12 text-gray-400">
              <RefreshCw className="w-6 h-6 animate-spin mr-2" />
              <span>Loading ad campaigns...</span>
            </div>
          ) : ads.length === 0 ? (
            <div className="text-center p-12 bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800">
              <Layers className="w-12 h-12 text-gray-400 mx-auto mb-3 opacity-50" />
              <h3 className="text-base font-semibold text-gray-800 dark:text-gray-200">No ad campaigns found</h3>
              <p className="text-sm text-gray-500 mt-1 max-w-md mx-auto">
                Create your first sponsored ad campaign to display inside Novix Messenger mobile & web apps.
              </p>
              <button
                onClick={openCreateAdModal}
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-sm font-medium"
              >
                <Plus className="w-4 h-4" /> Create Ad Campaign
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {ads.map((ad) => (
                <div
                  key={ad._id}
                  className={`flex flex-col justify-between p-5 rounded-2xl bg-white dark:bg-slate-900 border transition-all ${
                    ad.isActive
                      ? 'border-gray-200 dark:border-slate-800 shadow-xs'
                      : 'border-dashed border-gray-300 dark:border-slate-800 opacity-60 bg-gray-50/50 dark:bg-slate-900/50'
                  }`}
                >
                  <div>
                    {/* Header */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        {ad.advertiserLogo ? (
                          <img
                            src={ad.advertiserLogo}
                            alt={ad.advertiser}
                            className="w-10 h-10 rounded-xl object-contain bg-gray-50 dark:bg-slate-800 p-1 border border-gray-100 dark:border-slate-700"
                            onError={(e) => ((e.target as HTMLElement).style.display = 'none')}
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold text-sm">
                            {ad.advertiser.slice(0, 2).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-gray-900 dark:text-white">{ad.advertiser}</span>
                            <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-300">
                              {ad.category}
                            </span>
                          </div>
                          <a
                            href={ad.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1 mt-0.5"
                          >
                            {ad.url}
                            <ArrowUpRight className="w-3 h-3" />
                          </a>
                        </div>
                      </div>

                      {/* Status switch */}
                      <button
                        onClick={() => handleToggleAdStatus(ad)}
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border transition-all ${
                          ad.isActive
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-400 dark:border-emerald-800'
                            : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-400 dark:border-amber-800'
                        }`}
                        title={ad.isActive ? 'Click to Pause' : 'Click to Activate'}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${ad.isActive ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                        <span>{ad.isActive ? 'Active' : 'Paused'}</span>
                      </button>
                    </div>

                    {/* Content Preview */}
                    <div className="mt-4">
                      <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 line-clamp-1">{ad.title}</h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2 leading-relaxed">
                        {ad.description}
                      </p>
                    </div>

                    {/* Image preview banner */}
                    {ad.imageUrl && (
                      <div className="mt-3 rounded-xl overflow-hidden h-28 bg-gray-100 dark:bg-slate-800 relative">
                        <img src={ad.imageUrl} alt={ad.title} className="w-full h-full object-cover" />
                        <span className="absolute bottom-2 right-2 px-2 py-0.5 text-[10px] font-bold bg-black/70 text-white rounded-md backdrop-blur-xs">
                          {ad.ctaText}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Footer & Telemetry */}
                  <div className="mt-4 pt-3 border-t border-gray-100 dark:border-slate-800/80 flex items-center justify-between">
                    <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                      <div className="flex items-center gap-1">
                        <Eye className="w-3.5 h-3.5 text-blue-500" />
                        <span className="font-semibold text-gray-700 dark:text-gray-300">
                          {ad.impressions.toLocaleString()}
                        </span>
                        <span>views</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <MousePointerClick className="w-3.5 h-3.5 text-emerald-500" />
                        <span className="font-semibold text-gray-700 dark:text-gray-300">{ad.clicks}</span>
                        <span>clicks</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEditAdModal(ad)}
                        className="p-1.5 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
                        title="Edit Campaign"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteAd(ad._id)}
                        className="p-1.5 text-gray-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                        title="Delete Campaign"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: STARS & PREMIUM GOVERNANCE */}
      {activeTab === 'stars' && (
        <div className="space-y-4">
          {/* Search bar */}
          <div className="flex items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-gray-200 dark:border-slate-800">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search user by name, username (@handle), or email..."
                value={userSearch}
                onChange={(e) => {
                  setUserSearch(e.target.value);
                  fetchMonetization(e.target.value);
                }}
                className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-slate-800/80 border border-gray-200 dark:border-slate-700 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-purple-500 text-gray-900 dark:text-white placeholder-gray-400"
              />
            </div>
          </div>

          {/* User Table */}
          <div className="overflow-hidden bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50/70 dark:bg-slate-800/50 text-gray-500 dark:text-gray-400 text-xs font-semibold uppercase tracking-wider border-b border-gray-100 dark:border-slate-800">
                  <tr>
                    <th className="px-5 py-3.5">User</th>
                    <th className="px-5 py-3.5">Novix Stars Balance</th>
                    <th className="px-5 py-3.5">Premium Status</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                  {usersLoading ? (
                    <tr>
                      <td colSpan={4} className="px-5 py-12 text-center text-gray-400">
                        <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2" />
                        <span>Searching users...</span>
                      </td>
                    </tr>
                  ) : users.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-5 py-12 text-center text-gray-400">
                        No users matching query.
                      </td>
                    </tr>
                  ) : (
                    users.map((u) => (
                      <tr key={u.id} className="hover:bg-gray-50/50 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            {u.avatar ? (
                              <img src={u.avatar} alt={u.name} className="w-9 h-9 rounded-full object-cover" />
                            ) : (
                              <div className="w-9 h-9 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-300 font-bold flex items-center justify-center text-xs">
                                {u.name.slice(0, 2).toUpperCase()}
                              </div>
                            )}
                            <div>
                              <div className="font-semibold text-gray-900 dark:text-white flex items-center gap-1.5">
                                <span>{u.name}</span>
                                {u.isPremium && (
                                  <span title="Premium Subscriber">
                                    <Crown className="w-3.5 h-3.5 text-purple-500 fill-purple-500" />
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                @{u.username} • {u.email}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-1.5 font-bold text-amber-500">
                            <Star className="w-4 h-4 fill-amber-500" />
                            <span>{((u as any).starsBalance ?? u.telegramStars ?? 0).toLocaleString()} Stars</span>
                          </div>
                        </td>

                        <td className="px-5 py-3.5">
                          {u.isPremium ? (
                            <div>
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-700 dark:bg-purple-950/80 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                                <Crown className="w-3 h-3 fill-current" />
                                <span>PRO ({u.premiumPlan || 'Active'})</span>
                              </span>
                              {u.premiumExpiresAt && (
                                <p className="text-[11px] text-gray-400 mt-1">
                                  Expires: {new Date(u.premiumExpiresAt).toLocaleDateString()}
                                </p>
                              )}
                            </div>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 dark:bg-slate-800 dark:text-gray-400">
                              Free User
                            </span>
                          )}
                        </td>

                        <td className="px-5 py-3.5 text-right">
                          <div className="inline-flex items-center gap-2">
                            <button
                              onClick={() => {
                                setSelectedUser(u);
                                setStarAdjustment({ mode: 'add', amount: '100', reason: 'Admin Reward' });
                                setIsStarModalOpen(true);
                              }}
                              className="px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/80 transition-colors border border-amber-200 dark:border-amber-800/80 flex items-center gap-1"
                            >
                              <Star className="w-3.5 h-3.5 fill-current" />
                              <span>Adjust Stars</span>
                            </button>

                            <button
                              onClick={() => {
                                setSelectedUser(u);
                                setPremiumForm({
                                  isPremium: !u.isPremium,
                                  plan: 'monthly',
                                  durationMonths: '1',
                                });
                                setIsPremiumModalOpen(true);
                              }}
                              className={`px-2.5 py-1.5 text-xs font-semibold rounded-lg transition-colors border flex items-center gap-1 ${
                                u.isPremium
                                  ? 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-900'
                                  : 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/50 dark:text-purple-300 dark:border-purple-900'
                              }`}
                            >
                              <Crown className="w-3.5 h-3.5" />
                              <span>{u.isPremium ? 'Revoke PRO' : 'Grant PRO'}</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CREATE / EDIT AD */}
      {isAdModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full border border-gray-200 dark:border-slate-800 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-slate-800">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Layers className="w-5 h-5 text-purple-600" />
                <span>{editingAd ? 'Edit Ad Campaign' : 'Create New Ad Campaign'}</span>
              </h3>
              <button
                onClick={() => setIsAdModalOpen(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAd} className="p-6 overflow-y-auto space-y-4 flex-1 text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Advertiser / Brand Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Novix Cloud, Google Ads"
                    value={adForm.advertiser}
                    onChange={(e) => setAdForm({ ...adForm, advertiser: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Category</label>
                  <input
                    type="text"
                    placeholder="Technology, E-Commerce, etc."
                    value={adForm.category}
                    onChange={(e) => setAdForm({ ...adForm, category: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-gray-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Campaign Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Compelling headline for the advertisement"
                  value={adForm.title}
                  onChange={(e) => setAdForm({ ...adForm, title: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Ad Description / Copy *
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Explain what value customers get from this sponsor..."
                  value={adForm.description}
                  onChange={(e) => setAdForm({ ...adForm, description: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-gray-900 dark:text-white resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Destination URL *
                  </label>
                  <input
                    type="url"
                    required
                    placeholder="https://example.com/promo"
                    value={adForm.url}
                    onChange={(e) => setAdForm({ ...adForm, url: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    CTA Button Label
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Learn More, Sign Up, Shop Now"
                    value={adForm.ctaText}
                    onChange={(e) => setAdForm({ ...adForm, ctaText: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-gray-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Logo Image URL (Optional)
                  </label>
                  <input
                    type="url"
                    placeholder="https://.../logo.png"
                    value={adForm.advertiserLogo}
                    onChange={(e) => setAdForm({ ...adForm, advertiserLogo: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Banner Cover URL (Optional)
                  </label>
                  <input
                    type="url"
                    placeholder="https://images.unsplash.com/..."
                    value={adForm.imageUrl}
                    onChange={(e) => setAdForm({ ...adForm, imageUrl: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-gray-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="isActiveToggle"
                  checked={adForm.isActive}
                  onChange={(e) => setAdForm({ ...adForm, isActive: e.target.checked })}
                  className="rounded-md text-purple-600 focus:ring-purple-500 w-4 h-4"
                />
                <label htmlFor="isActiveToggle" className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                  Activate immediately upon saving
                </label>
              </div>

              <div className="pt-4 border-t border-gray-100 dark:border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAdModalOpen(false)}
                  className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-medium shadow-sm shadow-purple-500/20 disabled:opacity-50 flex items-center gap-2"
                >
                  {submitting && <RefreshCw className="w-4 h-4 animate-spin" />}
                  <span>{editingAd ? 'Update Campaign' : 'Create Campaign'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADJUST STARS */}
      {isStarModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full border border-gray-200 dark:border-slate-800 shadow-2xl p-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
              <span>Adjust Novix Stars</span>
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              User: <span className="font-semibold text-gray-700 dark:text-gray-300">{selectedUser.name}</span> (@{selectedUser.username})
            </p>
            <div className="my-3 p-3 bg-amber-50 dark:bg-amber-950/40 rounded-xl border border-amber-200/80 dark:border-amber-900/60 flex items-center justify-between">
              <span className="text-xs text-amber-800 dark:text-amber-300 font-medium">Current Balance:</span>
              <span className="text-base font-bold text-amber-600 dark:text-amber-400">
                {selectedUser.telegramStars.toLocaleString()} Stars
              </span>
            </div>

            <form onSubmit={handleSaveStars} className="space-y-4 text-sm mt-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Action Type</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['add', 'deduct', 'set'] as const).map((m) => (
                    <button
                      type="button"
                      key={m}
                      onClick={() => setStarAdjustment({ ...starAdjustment, mode: m })}
                      className={`py-2 rounded-xl text-xs font-bold uppercase transition-all ${
                        starAdjustment.mode === m
                          ? 'bg-purple-600 text-white shadow-sm'
                          : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200'
                      }`}
                    >
                      {m === 'add' ? '+ Add' : m === 'deduct' ? '- Deduct' : '= Set'}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Amount of Stars *
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={starAdjustment.amount}
                  onChange={(e) => setStarAdjustment({ ...starAdjustment, amount: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Reason for Adjustment
                </label>
                <input
                  type="text"
                  placeholder="e.g. Promotional Bonus, Bug Bounty, Refund"
                  value={starAdjustment.reason}
                  onChange={(e) => setStarAdjustment({ ...starAdjustment, reason: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-gray-900 dark:text-white"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsStarModalOpen(false)}
                  className="px-4 py-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold shadow-sm shadow-amber-500/20"
                >
                  Confirm Stars Adjustment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: TOGGLE PREMIUM */}
      {isPremiumModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full border border-gray-200 dark:border-slate-800 shadow-2xl p-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Crown className="w-5 h-5 text-purple-600 fill-purple-600" />
              <span>{premiumForm.isPremium ? 'Grant Novix Premium' : 'Revoke Novix Premium'}</span>
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              User: <span className="font-semibold text-gray-700 dark:text-gray-300">{selectedUser.name}</span> (@{selectedUser.username})
            </p>

            <form onSubmit={handleSavePremium} className="space-y-4 text-sm mt-4">
              {premiumForm.isPremium ? (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                      Duration
                    </label>
                    <select
                      value={premiumForm.durationMonths}
                      onChange={(e) => setPremiumForm({ ...premiumForm, durationMonths: e.target.value })}
                      className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-gray-900 dark:text-white"
                    >
                      <option value="1">1 Month</option>
                      <option value="3">3 Months</option>
                      <option value="6">6 Months</option>
                      <option value="12">1 Year (12 Months)</option>
                      <option value="36">Lifetime / 3 Years (36 Months)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Plan Tier</label>
                    <select
                      value={premiumForm.plan}
                      onChange={(e) => setPremiumForm({ ...premiumForm, plan: e.target.value })}
                      className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-gray-900 dark:text-white"
                    >
                      <option value="monthly">Monthly VIP</option>
                      <option value="annual">Annual Founder</option>
                      <option value="lifetime">Staff / Special Sponsor</option>
                    </select>
                  </div>
                </>
              ) : (
                <div className="p-3 bg-rose-50 dark:bg-rose-950/40 rounded-xl border border-rose-200 dark:border-rose-900/60 text-xs text-rose-700 dark:text-rose-300">
                  This will immediately remove the purple PRO badge, ad-free experience, and premium perks for this user.
                </div>
              )}

              <div className="pt-3 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsPremiumModalOpen(false)}
                  className="px-4 py-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className={`px-4 py-2 rounded-xl text-xs font-bold text-white shadow-sm ${
                    premiumForm.isPremium ? 'bg-purple-600 hover:bg-purple-700' : 'bg-rose-600 hover:bg-rose-700'
                  }`}
                >
                  {premiumForm.isPremium ? 'Confirm Grant Premium' : 'Confirm Revoke Premium'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
