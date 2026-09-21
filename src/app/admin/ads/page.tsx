'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Layers,
  Plus,
  Trash2,
  Edit3,
  ExternalLink,
  Eye,
  MousePointerClick,
  CheckCircle2,
  AlertCircle,
  Search,
  RefreshCw,
  TrendingUp,
  X,
  Globe,
  BarChart3
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

const CATEGORIES = ['All', 'Technology', 'Crypto', 'Gaming', 'E-Commerce', 'Social', 'General'];

export default function AdminAdsPage() {
  const [ads, setAds] = useState<AdCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'paused'>('all');

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
  const [submitting, setSubmitting] = useState(false);
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

  // Toast notification
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    fetchAds();
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

  const fetchAds = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);

    try {
      const res = await fetch('/api/admin/ads', { headers: getHeaders() });
      const data = await res.json();
      if (res.ok && data.success) {
        setAds(data.ads || []);
        if (data.stats) setAdsStats(data.stats);
      } else {
        showNotification('error', data.error || 'Failed to fetch campaigns');
      }
    } catch (err: any) {
      console.error('Failed to load ads:', err);
      showNotification('error', 'Network error loading campaigns');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Toggle Ad Active/Paused
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
        setAdsStats((prev) => ({
          ...prev,
          activeAds: !ad.isActive ? prev.activeAds + 1 : prev.activeAds - 1,
          pausedAds: !ad.isActive ? prev.pausedAds - 1 : prev.pausedAds + 1,
        }));
        showNotification('success', `Campaign "${ad.title}" ${!ad.isActive ? 'activated' : 'paused'}`);
      } else {
        showNotification('error', data.error || 'Failed to update status');
      }
    } catch (err) {
      showNotification('error', 'Failed to toggle campaign status');
    }
  };

  // Delete Ad
  const handleDeleteAd = async (adId: string, title: string) => {
    if (!confirm(`Are you sure you want to permanently delete campaign "${title}"?`)) return;
    try {
      const res = await fetch(`/api/admin/ads?id=${adId}`, {
        method: 'DELETE',
        headers: getHeaders(),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showNotification('success', 'Campaign deleted successfully');
        fetchAds();
      } else {
        showNotification('error', data.error || 'Failed to delete campaign');
      }
    } catch (err) {
      showNotification('error', 'Error deleting campaign');
    }
  };

  // Save Ad (Create or Edit)
  const handleSaveAd = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingAd) {
        const res = await fetch('/api/admin/ads', {
          method: 'PATCH',
          headers: getHeaders(),
          body: JSON.stringify({ id: editingAd._id, ...adForm }),
        });
        const data = await res.json();
        if (res.ok && data.success) {
          showNotification('success', 'Campaign updated successfully');
          setIsAdModalOpen(false);
          fetchAds();
        } else {
          showNotification('error', data.error || 'Failed to update campaign');
        }
      } else {
        const res = await fetch('/api/admin/ads', {
          method: 'POST',
          headers: getHeaders(),
          body: JSON.stringify(adForm),
        });
        const data = await res.json();
        if (res.ok && data.success) {
          showNotification('success', 'New campaign created and activated');
          setIsAdModalOpen(false);
          fetchAds();
        } else {
          showNotification('error', data.error || 'Failed to create campaign');
        }
      }
    } catch (err: any) {
      showNotification('error', err.message || 'Error saving campaign');
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

  // Filtered ads
  const filteredAds = useMemo(() => {
    return ads.filter((ad) => {
      const matchesSearch =
        ad.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ad.advertiser.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ad.description.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory =
        selectedCategory === 'All' ||
        (ad.category && ad.category.toLowerCase() === selectedCategory.toLowerCase());

      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && ad.isActive) ||
        (statusFilter === 'paused' && !ad.isActive);

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [ads, searchQuery, selectedCategory, statusFilter]);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Toast Notification */}
      {notification && (
        <div
          className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl text-sm font-semibold border backdrop-blur-md animate-in slide-in-from-top duration-200 ${
            notification.type === 'success'
              ? 'bg-emerald-500/10 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
              : 'bg-rose-500/10 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400 border-rose-500/30'
          }`}
        >
          {notification.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-500" />
          ) : (
            <AlertCircle className="w-5 h-5 shrink-0 text-rose-500" />
          )}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-600/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Layers size={20} />
            </div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Sponsored Ad Campaigns
            </h1>
            <span className="px-2.5 py-0.5 text-[11px] font-extrabold rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
              Live Serving
            </span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">
            Publish sponsored ads, review real-time impressions, track click-through rates, and govern banner campaigns.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => fetchAds(true)}
            disabled={refreshing}
            className="p-2.5 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl hover:shadow-xs transition cursor-pointer"
            title="Refresh campaigns"
          >
            <RefreshCw size={16} className={refreshing ? 'animate-spin text-blue-600' : ''} />
          </button>
          <button
            onClick={openCreateAdModal}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-blue-500/20 transition hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
          >
            <Plus size={16} />
            <span>Create Campaign</span>
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total & Active Campaigns */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800/90 shadow-xs relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Campaigns</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Layers size={16} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
              {adsStats.activeAds}
            </span>
            <span className="text-xs text-slate-400 font-semibold">/ {adsStats.totalAds} Total</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
            <span>{adsStats.pausedAds} paused</span>
          </div>
        </div>

        {/* Card 2: Total Impressions */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800/90 shadow-xs relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Impressions</span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <Eye size={16} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
              {adsStats.totalImpressions.toLocaleString()}
            </span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">
            Across active consumer feeds
          </div>
        </div>

        {/* Card 3: Total Clicks */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800/90 shadow-xs relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Verified Clicks</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <MousePointerClick size={16} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
              {adsStats.totalClicks.toLocaleString()}
            </span>
          </div>
          <div className="mt-2 text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
            <TrendingUp size={12} />
            <span>Target engagement</span>
          </div>
        </div>

        {/* Card 4: Average CTR */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800/90 shadow-xs relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Average CTR</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <BarChart3 size={16} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-amber-600 dark:text-amber-400">
              {adsStats.avgCtr}
            </span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">
            Ratio of clicks per impression
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800/90 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search input */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search campaign, advertiser..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700/80 rounded-xl text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
          />
        </div>

        {/* Category & Status Filters */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Status buttons */}
          <div className="flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1 text-xs font-bold">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-lg transition ${
                statusFilter === 'all'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400'
              }`}
            >
              All ({ads.length})
            </button>
            <button
              onClick={() => setStatusFilter('active')}
              className={`px-3 py-1.5 rounded-lg transition ${
                statusFilter === 'active'
                  ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400'
              }`}
            >
              Active ({adsStats.activeAds})
            </button>
            <button
              onClick={() => setStatusFilter('paused')}
              className={`px-3 py-1.5 rounded-lg transition ${
                statusFilter === 'paused'
                  ? 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400'
              }`}
            >
              Paused ({adsStats.pausedAds})
            </button>
          </div>

          {/* Category dropdown */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          >
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                Category: {cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Campaigns Listing */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center text-slate-400 text-sm">
          <RefreshCw size={24} className="animate-spin text-blue-500 mb-3" />
          <span>Loading ad campaigns...</span>
        </div>
      ) : filteredAds.length === 0 ? (
        <div className="py-16 text-center bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 p-8">
          <Layers size={40} className="mx-auto text-slate-400 mb-3" />
          <h3 className="text-base font-bold text-slate-900 dark:text-white">No campaigns found</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
            {searchQuery || selectedCategory !== 'All' || statusFilter !== 'all'
              ? 'Try adjusting your filters or search query.'
              : 'Create your first sponsored ad campaign to start serving banners in Novix Messenger.'}
          </p>
          <button
            onClick={openCreateAdModal}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition"
          >
            <Plus size={14} />
            <span>Create Campaign</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredAds.map((ad) => {
            const ctr = ad.impressions > 0 ? ((ad.clicks / ad.impressions) * 100).toFixed(2) : '0.00';

            return (
              <div
                key={ad._id}
                className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800/90 rounded-2xl overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col"
              >
                {/* Banner Thumbnail Preview */}
                <div className="relative h-40 bg-slate-100 dark:bg-slate-850 overflow-hidden group border-b border-slate-100 dark:border-slate-800">
                  {ad.imageUrl ? (
                    <img
                      src={ad.imageUrl}
                      alt={ad.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 gap-2 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-900 dark:to-slate-850">
                      <Layers size={28} className="opacity-40" />
                      <span className="text-[11px] font-medium">No Banner Image</span>
                    </div>
                  )}

                  {/* Category Pill */}
                  <span className="absolute top-3 left-3 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-black/60 backdrop-blur-md text-white border border-white/20">
                    {ad.category || 'General'}
                  </span>

                  {/* Live Status Toggle Pill */}
                  <button
                    onClick={() => handleToggleAdStatus(ad)}
                    className={`absolute top-3 right-3 px-2.5 py-1 rounded-full text-[10px] font-bold backdrop-blur-md transition flex items-center gap-1.5 cursor-pointer border ${
                      ad.isActive
                        ? 'bg-emerald-500/90 text-white border-emerald-400'
                        : 'bg-slate-800/80 text-slate-300 border-slate-700'
                    }`}
                    title={ad.isActive ? 'Click to Pause' : 'Click to Activate'}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${ad.isActive ? 'bg-white' : 'bg-slate-400'}`} />
                    <span>{ad.isActive ? 'Active' : 'Paused'}</span>
                  </button>
                </div>

                {/* Campaign Body */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    {/* Advertiser Header */}
                    <div className="flex items-center gap-2 mb-1.5">
                      {ad.advertiserLogo ? (
                        <img
                          src={ad.advertiserLogo}
                          alt={ad.advertiser}
                          className="w-5 h-5 rounded-full object-cover border border-slate-200 dark:border-slate-700"
                        />
                      ) : (
                        <div className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-600 dark:text-blue-400 flex items-center justify-center text-[10px] font-bold">
                          {ad.advertiser[0]?.toUpperCase() || 'A'}
                        </div>
                      )}
                      <span className="text-xs font-bold text-slate-500 dark:text-slate-400 truncate">
                        {ad.advertiser}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-slate-900 dark:text-white line-clamp-1">
                      {ad.title}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                      {ad.description}
                    </p>
                  </div>

                  {/* Telemetry Stats Strip */}
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-850/80 border border-slate-200/60 dark:border-slate-800/80 grid grid-cols-3 gap-2 text-center">
                    <div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase">Impressions</div>
                      <div className="text-xs font-black text-slate-800 dark:text-slate-100 tabular-nums mt-0.5">
                        {ad.impressions.toLocaleString()}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase">Clicks</div>
                      <div className="text-xs font-black text-slate-800 dark:text-slate-100 tabular-nums mt-0.5">
                        {ad.clicks.toLocaleString()}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase">CTR</div>
                      <div className="text-xs font-black text-emerald-600 dark:text-emerald-400 tabular-nums mt-0.5">
                        {ctr}%
                      </div>
                    </div>
                  </div>

                  {/* Target Link & Actions */}
                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/80">
                    <a
                      href={ad.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 font-semibold truncate max-w-[150px]"
                      title={ad.url}
                    >
                      <Globe size={12} className="shrink-0" />
                      <span className="truncate">{ad.url.replace(/^https?:\/\//, '')}</span>
                      <ExternalLink size={10} className="shrink-0" />
                    </a>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => openEditAdModal(ad)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                        title="Edit campaign"
                      >
                        <Edit3 size={15} />
                      </button>
                      <button
                        onClick={() => handleDeleteAd(ad._id, ad.title)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
                        title="Delete campaign"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create / Edit Campaign Modal */}
      {isAdModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-2xl bg-white dark:bg-[#0f172a] rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <Layers size={16} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {editingAd ? 'Edit Ad Campaign' : 'Create New Ad Campaign'}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Configure banner display, target URL, and advertiser info
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAdModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSaveAd} className="p-6 overflow-y-auto space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Title */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Campaign Title *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Try SuperVPN Pro"
                    value={adForm.title}
                    onChange={(e) => setAdForm({ ...adForm, title: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Advertiser */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Advertiser Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. SuperVPN Inc."
                    value={adForm.advertiser}
                    onChange={(e) => setAdForm({ ...adForm, advertiser: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Description *
                </label>
                <textarea
                  required
                  rows={2}
                  placeholder="Short, persuasive text displayed below the banner..."
                  value={adForm.description}
                  onChange={(e) => setAdForm({ ...adForm, description: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Banner Image URL */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Banner Image URL
                  </label>
                  <input
                    type="url"
                    placeholder="https://images.unsplash.com/..."
                    value={adForm.imageUrl}
                    onChange={(e) => setAdForm({ ...adForm, imageUrl: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Advertiser Logo URL */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Advertiser Logo URL
                  </label>
                  <input
                    type="url"
                    placeholder="https://...logo.png"
                    value={adForm.advertiserLogo}
                    onChange={(e) => setAdForm({ ...adForm, advertiserLogo: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Target URL */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Destination / Landing Page URL *
                  </label>
                  <input
                    type="url"
                    required
                    placeholder="https://example.com/promo"
                    value={adForm.url}
                    onChange={(e) => setAdForm({ ...adForm, url: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* CTA Button Text */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    CTA Button Text
                  </label>
                  <input
                    type="text"
                    placeholder="Learn More"
                    value={adForm.ctaText}
                    onChange={(e) => setAdForm({ ...adForm, ctaText: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                {/* Category */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Category
                  </label>
                  <select
                    value={adForm.category}
                    onChange={(e) => setAdForm({ ...adForm, category: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  >
                    {CATEGORIES.filter((c) => c !== 'All').map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Active Status Toggle */}
                <div className="pt-4">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={adForm.isActive}
                      onChange={(e) => setAdForm({ ...adForm, isActive: e.target.checked })}
                      className="w-4 h-4 text-blue-600 rounded-sm focus:ring-blue-500"
                    />
                    <div>
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        Campaign Active Immediately
                      </span>
                      <p className="text-[10px] text-slate-400">
                        Uncheck to keep campaign in draft/paused state
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Live Card Preview Box */}
              <div className="p-3.5 rounded-xl bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                  Live Preview in Messenger
                </span>
                <div className="max-w-sm mx-auto bg-white dark:bg-slate-900 rounded-xl shadow-xs border border-slate-200 dark:border-slate-700 overflow-hidden">
                  <div className="h-28 bg-slate-200 dark:bg-slate-800 relative">
                    {adForm.imageUrl ? (
                      <img src={adForm.imageUrl} alt="preview" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs">
                        Banner Preview
                      </div>
                    )}
                    <span className="absolute top-2 left-2 px-2 py-0.5 rounded text-[9px] font-bold bg-black/60 text-white">
                      {adForm.category}
                    </span>
                  </div>
                  <div className="p-3">
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="text-[11px] font-bold text-slate-500 truncate">
                        {adForm.advertiser || 'Advertiser Name'}
                      </span>
                      <span className="text-[9px] px-1 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded">
                        Sponsored
                      </span>
                    </div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {adForm.title || 'Campaign Title'}
                    </div>
                    <div className="text-[10px] text-slate-500 truncate mt-0.5">
                      {adForm.description || 'Description text...'}
                    </div>
                    <div className="mt-2.5 flex justify-end">
                      <span className="px-3 py-1 bg-blue-600 text-white text-[10px] font-bold rounded-lg">
                        {adForm.ctaText || 'Learn More'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAdModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/25 transition flex items-center gap-2 cursor-pointer"
                >
                  {submitting ? (
                    <>
                      <RefreshCw size={13} className="animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>{editingAd ? 'Update Campaign' : 'Create Campaign'}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
