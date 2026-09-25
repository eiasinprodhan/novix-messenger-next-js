'use client';

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import toast from 'react-hot-toast';
import DeleteConfirmModal from '@/components/admin/DeleteConfirmModal';
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
  BarChart3,
  ChevronLeft,
  ChevronRight
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

const ADS_CACHE_KEY = 'novix_admin_ads_cache';

export default function AdminAdsPage() {
  const [ads, setAds] = useState<AdCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'paused'>('all');

  // Delete modal state
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Restore cached ads post-hydration
  useEffect(() => {
    try {
      const raw = localStorage.getItem(ADS_CACHE_KEY);
      if (raw) {
        const cached = JSON.parse(raw);
        if (Array.isArray(cached) && cached.length > 0) {
          setAds(cached);
          setLoading(false);
        }
      }
    } catch {}
  }, []);

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
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [bannerPreview, setBannerPreview] = useState<string>('');
  const bannerInputRef = useRef<HTMLInputElement>(null);
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

  const uploadBannerImage = useCallback(async (file: File) => {
    if (!file) return;
    // Validate type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file (JPG, PNG, WebP, GIF)');
      return;
    }
    // Validate size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image too large. Max 10MB.');
      return;
    }
    // Local preview
    const objectUrl = URL.createObjectURL(file);
    setBannerPreview(objectUrl);
    setUploadingBanner(true);
    try {
      const token = localStorage.getItem('adminToken') || '';
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();
      if (res.ok && data.imageUrl) {
        setAdForm((prev) => ({ ...prev, imageUrl: data.imageUrl }));
        toast.success('Banner uploaded!');
      } else {
        toast.error(data.error || 'Upload failed');
        setBannerPreview('');
      }
    } catch {
      toast.error('Upload failed. Check your connection.');
      setBannerPreview('');
    } finally {
      setUploadingBanner(false);
    }
  }, []);

  const getHeaders = () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : '';
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    };
  };

  const fetchAds = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else if (ads.length === 0) setLoading(true);

    try {
      const res = await fetch('/api/admin/ads', { headers: getHeaders() });
      const data = await res.json();
      if (res.ok && data.success) {
        setAds(data.ads || []);
        if (data.stats) setAdsStats(data.stats);
        try {
          localStorage.setItem(ADS_CACHE_KEY, JSON.stringify(data.ads || []));
        } catch {}
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

  // Toggle Ad Active/Paused (Fast Optimistic Update)
  const handleToggleAdStatus = async (ad: AdCampaign) => {
    const nextActive = !ad.isActive;
    
    // Instant optimistic update
    setAds((prev) =>
      prev.map((a) => (a._id === ad._id ? { ...a, isActive: nextActive } : a))
    );
    setAdsStats((prev) => ({
      ...prev,
      activeAds: nextActive ? prev.activeAds + 1 : Math.max(0, prev.activeAds - 1),
      pausedAds: !nextActive ? prev.pausedAds + 1 : Math.max(0, prev.pausedAds - 1),
    }));
    toast.success(`Campaign "${ad.title}" ${nextActive ? 'activated' : 'paused'}`);

    try {
      const res = await fetch('/api/admin/ads', {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify({ id: ad._id, isActive: nextActive }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        // Revert on failure
        setAds((prev) =>
          prev.map((a) => (a._id === ad._id ? { ...a, isActive: ad.isActive } : a))
        );
        setAdsStats((prev) => ({
          ...prev,
          activeAds: ad.isActive ? prev.activeAds + 1 : Math.max(0, prev.activeAds - 1),
          pausedAds: !ad.isActive ? prev.pausedAds + 1 : Math.max(0, prev.pausedAds - 1),
        }));
        toast.error(data.error || 'Failed to update status');
      }
    } catch (err) {
      // Revert on error
      setAds((prev) =>
        prev.map((a) => (a._id === ad._id ? { ...a, isActive: ad.isActive } : a))
      );
      toast.error('Failed to toggle campaign status');
    }
  };

  // Confirm and Execute Delete Ad (Fast Optimistic Removal)
  const confirmDeleteAd = async () => {
    if (!deleteTarget) return;
    const { id, title } = deleteTarget;
    setIsDeleting(true);

    const previousAds = [...ads];
    const adToDelete = ads.find((a) => a._id === id);

    // Instant optimistic removal from UI
    setAds((prev) => prev.filter((a) => a._id !== id));
    if (adToDelete) {
      setAdsStats((prev) => ({
        ...prev,
        totalAds: Math.max(0, prev.totalAds - 1),
        activeAds: adToDelete.isActive ? Math.max(0, prev.activeAds - 1) : prev.activeAds,
        pausedAds: !adToDelete.isActive ? Math.max(0, prev.pausedAds - 1) : prev.pausedAds,
      }));
    }

    setDeleteTarget(null);
    setIsDeleting(false);
    toast.success(`Campaign "${title}" deleted successfully`);

    try {
      const res = await fetch(`/api/admin/ads?id=${id}`, {
        method: 'DELETE',
        headers: getHeaders(),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        // Revert on failure
        setAds(previousAds);
        toast.error(data.error || 'Failed to delete campaign');
      } else {
        try {
          localStorage.setItem(ADS_CACHE_KEY, JSON.stringify(ads.filter((a) => a._id !== id)));
        } catch {}
      }
    } catch (err) {
      setAds(previousAds);
      toast.error('Error deleting campaign');
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
          setAds((prev) =>
            prev.map((a) => (a._id === editingAd._id ? { ...a, ...adForm, ...(data.ad || {}) } : a))
          );
          setIsAdModalOpen(false);
          toast.success('Campaign updated successfully');
        } else {
          toast.error(data.error || 'Failed to update campaign');
        }
      } else {
        const res = await fetch('/api/admin/ads', {
          method: 'POST',
          headers: getHeaders(),
          body: JSON.stringify(adForm),
        });
        const data = await res.json();
        if (res.ok && data.success) {
          if (data.ad) {
            setAds((prev) => [data.ad, ...prev]);
          } else {
            fetchAds();
          }
          setIsAdModalOpen(false);
          toast.success('New campaign created and activated');
        } else {
          toast.error(data.error || 'Failed to create campaign');
        }
      }
    } catch (err: any) {
      toast.error(err.message || 'Error saving campaign');
    } finally {
      setSubmitting(false);
    }
  };

  const openCreateAdModal = () => {
    setEditingAd(null);
    setBannerPreview('');
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
    setBannerPreview(ad.imageUrl || '');
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

  const [page, setPage] = useState(1);

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

  const pageSize = 10;
  const totalPages = Math.max(1, Math.ceil(filteredAds.length / pageSize));
  const paginatedAds = useMemo(() => {
    return filteredAds.slice((page - 1) * pageSize, page * pageSize);
  }, [filteredAds, page]);

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
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Ads
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">
            Publish sponsored ads, review real-time impressions, track click-through rates, and govern banner campaigns
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

      {/* Filter & Search Bar */}
      <div className="p-4 bg-white dark:bg-[#111a2e] rounded-2xl border border-slate-200/90 dark:border-slate-800/90 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search input on Left */}
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
          <input
            type="text"
            placeholder="Search campaign, advertiser..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-blue-500 transition font-medium"
          />
        </div>

        {/* Category & Status Filters on Right */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Status buttons */}
          <div className="flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1 text-xs font-bold">
            <button
              onClick={() => { setStatusFilter('all'); setPage(1); }}
              className={`px-3 py-1.5 rounded-lg transition ${
                statusFilter === 'all'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400'
              }`}
            >
              All ({ads.length})
            </button>
            <button
              onClick={() => { setStatusFilter('active'); setPage(1); }}
              className={`px-3 py-1.5 rounded-lg transition ${
                statusFilter === 'active'
                  ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400'
              }`}
            >
              Active ({adsStats.activeAds})
            </button>
            <button
              onClick={() => { setStatusFilter('paused'); setPage(1); }}
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
            onChange={(e) => { setSelectedCategory(e.target.value); setPage(1); }}
            className="px-3.5 py-2 bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none focus:border-blue-500 shadow-xs transition cursor-pointer"
          >
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                Category: {cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Campaigns Table Container */}
      <div className="bg-white dark:bg-[#111a2e] border border-slate-200/90 dark:border-slate-800/90 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800">
          <table className="w-full text-left text-xs sm:text-sm border-collapse min-w-[760px]">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/70 dark:bg-slate-850/50 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                <th className="py-3.5 px-5">Campaign / Banner</th>
                <th className="py-3.5 px-5">Advertiser</th>
                <th className="py-3.5 px-5">Category</th>
                <th className="py-3.5 px-5">Performance (Imp / Clicks / CTR)</th>
                <th className="py-3.5 px-5">Status</th>
                <th className="py-3.5 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-700 dark:text-slate-300 text-xs">
              {loading && ads.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-slate-400">
                    <RefreshCw size={24} className="animate-spin text-blue-500 mx-auto mb-2" />
                    <span>Loading ad campaigns...</span>
                  </td>
                </tr>
              ) : filteredAds.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-slate-400">
                    <Layers size={36} className="mx-auto text-slate-300 dark:text-slate-700 mb-2" />
                    <p className="font-bold text-slate-700 dark:text-slate-300">No campaigns found</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Try adjusting your filters or search query</p>
                  </td>
                </tr>
              ) : (
                paginatedAds.map((ad) => {
                  const ctr = ad.impressions > 0 ? ((ad.clicks / ad.impressions) * 100).toFixed(2) : '0.00';
                  return (
                    <tr key={ad._id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition duration-150">
                      {/* Campaign info */}
                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 overflow-hidden shrink-0 border border-slate-200 dark:border-slate-700">
                            {ad.imageUrl ? (
                              <img src={ad.imageUrl} alt={ad.title} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-slate-400">
                                <Layers size={16} />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0 max-w-[220px]">
                            <div className="font-bold text-slate-900 dark:text-white truncate" title={ad.title}>
                              {ad.title}
                            </div>
                            <div className="text-[11px] text-slate-400 truncate" title={ad.description}>
                              {ad.description || 'No description'}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Advertiser */}
                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-2">
                          {ad.advertiserLogo ? (
                            <img src={ad.advertiserLogo} alt={ad.advertiser} className="w-6 h-6 rounded-full object-cover border border-slate-200 dark:border-slate-700" />
                          ) : (
                            <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-600 dark:text-blue-400 flex items-center justify-center text-[10px] font-bold">
                              {ad.advertiser?.[0]?.toUpperCase() || 'A'}
                            </div>
                          )}
                          <span className="font-medium text-slate-800 dark:text-slate-200 truncate max-w-[130px]">
                            {ad.advertiser}
                          </span>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-3.5 px-5 whitespace-nowrap">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60">
                          {ad.category || 'General'}
                        </span>
                      </td>

                      {/* Telemetry */}
                      <td className="py-3.5 px-5 whitespace-nowrap">
                        <div className="flex items-center gap-3 text-xs">
                          <div>
                            <span className="text-slate-400 text-[10px] block">Impr:</span>
                            <span className="font-bold tabular-nums text-slate-900 dark:text-white">{ad.impressions.toLocaleString()}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 text-[10px] block">Clicks:</span>
                            <span className="font-bold tabular-nums text-slate-900 dark:text-white">{ad.clicks.toLocaleString()}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 text-[10px] block">CTR:</span>
                            <span className="font-bold tabular-nums text-emerald-600 dark:text-emerald-400">{ctr}%</span>
                          </div>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-5 whitespace-nowrap">
                        <button
                          onClick={() => handleToggleAdStatus(ad)}
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold transition flex items-center gap-1.5 cursor-pointer border ${
                            ad.isActive
                              ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                          }`}
                          title={ad.isActive ? 'Click to Pause' : 'Click to Activate'}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${ad.isActive ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                          <span>{ad.isActive ? 'Active' : 'Paused'}</span>
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <a
                            href={ad.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-lg transition"
                            title="Visit destination link"
                          >
                            <ExternalLink size={14} />
                          </a>
                          <button
                            onClick={() => openEditAdModal(ad)}
                            className="p-1.5 text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40 rounded-lg transition cursor-pointer"
                            title="Edit campaign"
                          >
                            <Edit3 size={14} />
                          </button>
                          <button
                            onClick={() => setDeleteTarget({ id: ad._id, title: ad.title })}
                            className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition cursor-pointer"
                            title="Delete campaign"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Unified Pagination Bar */}
        <div className="p-4 bg-slate-50/70 dark:bg-slate-850/50 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span>
            Showing <strong className="text-slate-700 dark:text-slate-200">{filteredAds.length}</strong> campaigns • Page <strong className="text-slate-700 dark:text-slate-200">{page}</strong> of <strong className="text-slate-700 dark:text-slate-200">{totalPages}</strong>
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750 disabled:opacity-40 disabled:cursor-not-allowed transition shadow-xs cursor-pointer flex items-center gap-1 font-semibold"
            >
              <ChevronLeft size={14} />
              <span className="hidden sm:inline">Previous</span>
            </button>
            <span className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-800 dark:text-slate-200">
              {page}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750 disabled:opacity-40 disabled:cursor-not-allowed transition shadow-xs cursor-pointer flex items-center gap-1 font-semibold"
            >
              <span className="hidden sm:inline">Next</span>
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>

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
                {/* Banner Image Upload */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Banner Image
                  </label>
                  {/* Hidden file input */}
                  <input
                    ref={bannerInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) uploadBannerImage(file);
                      e.target.value = '';
                    }}
                  />
                  {/* Drop zone */}
                  <div
                    onClick={() => bannerInputRef.current?.click()}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      const file = e.dataTransfer.files?.[0];
                      if (file) uploadBannerImage(file);
                    }}
                    className="relative w-full h-36 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 hover:border-blue-500 hover:bg-blue-50/30 dark:hover:bg-blue-950/20 transition cursor-pointer overflow-hidden flex items-center justify-center group"
                  >
                    {uploadingBanner ? (
                      <div className="flex flex-col items-center gap-2 text-blue-500">
                        <RefreshCw size={22} className="animate-spin" />
                        <span className="text-xs font-semibold">Uploading...</span>
                      </div>
                    ) : bannerPreview ? (
                      <>
                        <img
                          src={bannerPreview}
                          alt="Banner preview"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                          <span className="text-white text-xs font-bold flex items-center gap-1.5">
                            <RefreshCw size={14} /> Change Image
                          </span>
                        </div>
                      </>
                    ) : (
                      <div className="flex flex-col items-center gap-1.5 text-slate-400 dark:text-slate-500 px-4 text-center">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center mb-0.5">
                          <TrendingUp size={20} className="text-slate-400" />
                        </div>
                        <span className="text-xs font-semibold">Click or drag &amp; drop to upload</span>
                        <span className="text-[10px] text-slate-400">JPG, PNG, WebP, GIF — max 10MB</span>
                      </div>
                    )}
                  </div>
                  {adForm.imageUrl && (
                    <div className="mt-1.5 flex items-center justify-between">
                      <span className="text-[10px] text-slate-400 truncate max-w-[220px]" title={adForm.imageUrl}>
                        ✓ {adForm.imageUrl.split('/').pop()}
                      </span>
                      <button
                        type="button"
                        onClick={() => { setAdForm((p) => ({ ...p, imageUrl: '' })); setBannerPreview(''); }}
                        className="text-[10px] text-rose-500 hover:underline font-semibold cursor-pointer"
                      >
                        Remove
                      </button>
                    </div>
                  )}
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

      {/* Delete Campaign Confirmation Modal Popup */}
      <DeleteConfirmModal
        isOpen={Boolean(deleteTarget)}
        title="Delete Ad Campaign"
        itemName={deleteTarget?.title}
        description={`Are you sure you want to permanently delete campaign "${deleteTarget?.title}"? All impressions and click metrics will be removed.`}
        confirmLabel="Delete Campaign"
        isLoading={isDeleting}
        onConfirm={confirmDeleteAd}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
