'use client';

import React from 'react';
import { FiPlus, FiDatabase, FiRefreshCw } from 'react-icons/fi';
import { AdminTab } from './Sidebar';

interface HeaderProps {
  activeTab: AdminTab;
  adminEmail: string;
  dbConnected: boolean;
  onAddNew?: () => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

const tabTitles: Record<AdminTab, { title: string; subtitle: string }> = {
  apps: {
    title: 'Apps & Games Hub Management',
    subtitle: 'Manage production apps, closed testing games, versions, and store links in MongoDB.',
  },
  projects: {
    title: 'Portfolio Projects Management',
    subtitle: 'Showcase web, mobile, and full-stack software development projects.',
  },
  profile: {
    title: 'Profile & Bio Information',
    subtitle: 'Update your developer bio, headline roles, and social contact handles.',
  },
  skills: {
    title: 'Skills & Technical Proficiencies',
    subtitle: 'Maintain your programming languages, frameworks, and tools matrix.',
  },
  experience: {
    title: 'Work Experience & Roles',
    subtitle: 'Curate your career journey, employment history, and engineering accomplishments.',
  },
  education: {
    title: 'Education & Certifications',
    subtitle: 'Manage formal academic degrees and verified technical credentials.',
  },
  messages: {
    title: 'Contact Form Inquiries',
    subtitle: 'Review messages submitted from the portfolio contact form.',
  },
};

export default function Header({
  activeTab,
  adminEmail,
  dbConnected,
  onAddNew,
  onRefresh,
  isRefreshing = false,
}: HeaderProps) {
  const current = tabTitles[activeTab] || { title: 'Dashboard', subtitle: '' };
  const canAddNew = ['apps', 'projects', 'skills', 'experience', 'education'].includes(activeTab);

  return (
    <header className="px-8 py-6 border-b border-red-500/20 bg-[#0d0e17]/80 backdrop-blur-md flex flex-wrap items-center justify-between gap-4">
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
          {current.title}
        </h1>
        <p className="text-xs text-slate-400 mt-1">{current.subtitle}</p>
      </div>

      <div className="flex items-center gap-3">
        {/* Database Status Indicator */}
        <div
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-mono font-medium border ${
            dbConnected
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
              : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
          }`}
          title={dbConnected ? 'MongoDB Atlas is connected' : 'Connecting to MongoDB Atlas...'}
        >
          <FiDatabase className="h-3.5 w-3.5" />
          <span
            className={`h-2 w-2 rounded-full ${
              dbConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
            }`}
          />
          <span>{dbConnected ? 'Atlas DB Active' : 'Connecting...'}</span>
        </div>

        {/* Refresh Button */}
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="p-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-all cursor-pointer disabled:opacity-50"
            title="Refresh database records"
          >
            <FiRefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin text-red-400' : ''}`} />
          </button>
        )}

        {/* Add New Button */}
        {canAddNew && onAddNew && (
          <button
            onClick={onAddNew}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white shadow-lg shadow-red-600/30 transition-all cursor-pointer"
          >
            <FiPlus className="h-4 w-4" />
            <span>Add New</span>
          </button>
        )}
      </div>
    </header>
  );
}
