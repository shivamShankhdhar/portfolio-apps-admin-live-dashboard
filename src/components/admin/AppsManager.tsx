'use client';

import React, { useState } from 'react';
import {
  FiEdit2,
  FiTrash2,
  FiExternalLink,
  FiSearch,
  FiShield,
  FiStar,
  FiLayers,
  FiSmartphone,
} from 'react-icons/fi';
import { FaGamepad, FaGooglePlay, FaApple } from 'react-icons/fa6';
import { AppItem } from '@/lib/defaultData';
import AppModalForm from './AppModalForm';
import AppIcon from '../ui/AppIcon';
import { toast } from 'sonner';

interface AppsManagerProps {
  apps: AppItem[];
  onReload: () => void;
  isModalOpen: boolean;
  setIsModalOpen: (open: boolean) => void;
}

export default function AppsManager({
  apps,
  onReload,
  isModalOpen,
  setIsModalOpen,
}: AppsManagerProps) {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'All' | 'Games' | 'Apps'>('All');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [editingApp, setEditingApp] = useState<AppItem | null>(null);

  const filteredApps = apps.filter((app) => {
    const matchesSearch =
      app.title.toLowerCase().includes(search.toLowerCase()) ||
      app.package.toLowerCase().includes(search.toLowerCase()) ||
      (app.subtitle && app.subtitle.toLowerCase().includes(search.toLowerCase()));

    const matchesCategory =
      categoryFilter === 'All' ||
      app.category.toLowerCase() === categoryFilter.toLowerCase();

    const matchesStatus =
      statusFilter === 'All' ||
      (app.status && app.status.toLowerCase().includes(statusFilter.toLowerCase()));

    return matchesSearch && matchesCategory && matchesStatus;
  });

  const handleOpenCreate = () => {
    setEditingApp(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (app: AppItem) => {
    setEditingApp(app);
    setIsModalOpen(true);
  };

  const handleSave = async (data: Partial<AppItem>) => {
    if (editingApp && editingApp._id) {
      // Update existing
      const res = await fetch(`/api/apps/${editingApp._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Failed to update app');
      }
    } else {
      // Create new
      const res = await fetch('/api/apps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Failed to create app');
      }
    }
    onReload();
  };

  const handleDelete = async (app: AppItem) => {
    if (!confirm(`Are you sure you want to delete "${app.title}" (${app.package}) from the database?`)) {
      return;
    }

    try {
      if (!app._id) {
        toast.error('Cannot delete item without database ID');
        return;
      }

      const res = await fetch(`/api/apps/${app._id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Failed to delete app');
      }

      toast.success(`"${app.title}" removed from database`);
      onReload();
    } catch (err: any) {
      toast.error(err.message || 'Delete operation failed');
    }
  };

  const getLiveUrl = (app: AppItem) => {
    const slug = app.package.split('.').pop() || app.title.toLowerCase().replace(/\s+/g, '-');
    const isGame = app.category.toLowerCase() === 'games';
    const baseUrl = process.env.NEXT_PUBLIC_APPS_URL || 'http://localhost:3002';
    return isGame ? `${baseUrl}/games/${slug}` : `${baseUrl}/apps/${slug}`;
  };

  return (
    <div className="space-y-6">
      
      {/* Control Bar: Search & Filters */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-[#12131c] border border-red-500/20 shadow-md">
        
        {/* Search */}
        <div className="relative w-full sm:w-72">
          <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title or package..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-black/40 border border-white/10 text-white text-xs focus:outline-none focus:border-red-500"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Category Tabs */}
          <div className="flex items-center rounded-xl bg-black/40 p-1 border border-white/10">
            {(['All', 'Games', 'Apps'] as const).map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                  categoryFilter === cat
                    ? 'bg-red-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Status Dropdown */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-slate-300 text-xs focus:outline-none focus:border-red-500 cursor-pointer"
          >
            <option value="All">All Statuses</option>
            <option value="Production">Google Play Production</option>
            <option value="Testing">Closed Testing</option>
            <option value="Coming">Coming Soon</option>
          </select>
        </div>
      </div>

      {/* Grid of Apps & Games */}
      {filteredApps.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-[#12131c]/50 border border-dashed border-white/10 space-y-3">
          <p className="text-slate-400 text-sm">No apps or games match your query in database.</p>
          <button
            onClick={handleOpenCreate}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-500 text-white shadow-lg cursor-pointer"
          >
            Add New App / Game
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredApps.map((app) => {
            const isTesting =
              app.status?.toLowerCase().includes('testing') ||
              app.status?.toLowerCase().includes('closed') ||
              app.rating?.toLowerCase().includes('coming');

            return (
              <div
                key={app._id || app.package}
                className="rounded-3xl bg-[#12131c] border border-red-500/20 hover:border-red-500/40 p-6 shadow-xl transition-all space-y-4 relative group"
              >
                {/* Header Row */}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-red-600/20 to-rose-600/20 border border-red-500/30 flex items-center justify-center shadow-inner shrink-0">
                      <AppIcon title={app.title} category={app.category} iconString={app.icon} className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white flex items-center gap-2">
                        <span>{app.title}</span>
                        {app.featured && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold">
                            Featured
                          </span>
                        )}
                      </h3>
                      <p className="text-xs font-mono text-slate-400">{app.package}</p>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <span
                    className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full border shrink-0 ${
                      isTesting
                        ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                        : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                    }`}
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        isTesting ? 'bg-amber-500' : 'bg-emerald-500 animate-pulse'
                      }`}
                    />
                    <span>{app.status || 'Active'}</span>
                  </span>
                </div>

                {/* Subtitle & Tagline */}
                {app.subtitle && (
                  <p className="text-xs text-slate-300 font-medium">{app.subtitle}</p>
                )}
                {app.tagline && (
                  <p className="text-xs text-slate-400 line-clamp-2">{app.tagline}</p>
                )}

                {/* Meta details pill row */}
                <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono">
                  <span className="px-2.5 py-1 rounded-lg bg-black/40 border border-white/5 text-slate-300">
                    Category: <strong className="text-white">{app.category}</strong>
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-black/40 border border-white/5 text-slate-300">
                    Version: <strong className="text-white">{app.version || 'v1.0.0'}</strong>
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-black/40 border border-white/5 text-slate-300">
                    Rating: <strong className="text-amber-400">{app.rating || '4.9'}</strong> ({app.ratingCount || 'Testing'})
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-black/40 border border-white/5 text-slate-300">
                    Banner: <strong className="text-red-400">{app.bannerType || 'default'}</strong>
                  </span>
                </div>

                {/* Platform Store Target Badges */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div className="p-2.5 rounded-xl bg-black/30 border border-white/5 flex items-center justify-between text-[11px]">
                    <span className="flex items-center gap-1.5 text-slate-300">
                      <FaGooglePlay className="h-3 w-3 text-emerald-400" />
                      <span>Google Play</span>
                    </span>
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                        app.playStoreUrl
                          ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                          : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                      }`}
                    >
                      {app.playStoreUrl ? (app.playStoreStatus || 'Live') : 'Coming Soon'}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-black/30 border border-white/5 flex items-center justify-between text-[11px]">
                    <span className="flex items-center gap-1.5 text-slate-300">
                      <FaApple className="h-3 w-3 text-slate-200" />
                      <span>App Store</span>
                    </span>
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                        app.appStoreUrl
                          ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                          : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                      }`}
                    >
                      {app.appStoreUrl ? (app.appStoreStatus || 'Live') : (app.appStoreStatus || 'Coming Soon')}
                    </span>
                  </div>
                </div>

                {/* Technologies */}
                {app.technologies && app.technologies.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {app.technologies.map((t, i) => (
                      <span
                        key={i}
                        className="text-[10px] px-2 py-0.5 rounded-md bg-white/5 text-slate-400 border border-white/5"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                )}

                {/* Highlights Count */}
                {app.highlights && app.highlights.length > 0 && (
                  <p className="text-[11px] text-slate-400 flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                    <span>{app.highlights.length} Engine & Gameplay Highlights in DB</span>
                  </p>
                )}

                {/* Card Actions */}
                <div className="pt-3 border-t border-white/10 flex items-center justify-between gap-2">
                  <a
                    href={getLiveUrl(app)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 font-semibold transition-colors"
                  >
                    <span>View Dedicated Page</span>
                    <FiExternalLink className="h-3 w-3" />
                  </a>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleOpenEdit(app)}
                      className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-all cursor-pointer"
                      title="Edit App Details"
                    >
                      <FiEdit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(app)}
                      className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-all cursor-pointer"
                      title="Delete from Database"
                    >
                      <FiTrash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Form */}
      <AppModalForm
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingApp(null);
        }}
        onSave={handleSave}
        initialData={editingApp}
      />
    </div>
  );
}
