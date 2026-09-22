'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import {
  FiFolder,
  FiUser,
  FiShield,
  FiSettings,
  FiChevronDown,
  FiChevronUp,
  FiLogOut,
  FiMessageSquare,
} from 'react-icons/fi';
import { LayoutGrid } from 'lucide-react';
import { AdminTab } from './Sidebar';

interface CoreSidebarProps {
  activeTab: AdminTab;
  setActiveTab: (tab: AdminTab) => void;
  appsCount: number;
  gamesCount: number;
  projectsCount: number;
  messagesCount: number;
  profile?: any;
  adminEmail?: string;
  onLogout?: () => void;
  isSettingsRoute?: boolean;
}

export function CoreLogoEmblem({ className = 'h-10 w-10' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="coreGrad" x1="4" y1="4" x2="40" y2="40" gradientUnits="userSpaceOnUse">
          <stop stopColor="#2A0B0E" />
          <stop offset="1" stopColor="#0E0F14" />
        </linearGradient>
        <linearGradient id="facetLight" x1="0" y1="0" x2="44" y2="44" gradientUnits="userSpaceOnUse">
          <stop stopColor="#EF4444" stopOpacity="0.6" />
          <stop offset="1" stopColor="#991B1B" stopOpacity="0.2" />
        </linearGradient>
      </defs>
      <circle cx="22" cy="22" r="21" fill="url(#coreGrad)" stroke="#EF4444" strokeWidth="1" strokeOpacity="0.3" />
      <path d="M22 3 L22 41" stroke="#EF4444" strokeWidth="1.2" strokeOpacity="0.4" />
      <path d="M3 22 L41 22" stroke="#EF4444" strokeWidth="1.2" strokeOpacity="0.4" />
      <path d="M22 3 L41 22 L22 41 L3 22 Z" stroke="url(#facetLight)" strokeWidth="1.2" fill="#1C0F12" fillOpacity="0.5" />
      <circle cx="22" cy="22" r="5" fill="#EF4444" fillOpacity="0.8" stroke="#F87171" strokeWidth="1.5" />
    </svg>
  );
}

export default function CoreSidebar({
  activeTab,
  setActiveTab,
  appsCount,
  gamesCount,
  projectsCount,
  messagesCount,
  profile,
  adminEmail,
  onLogout,
  isSettingsRoute = false,
}: CoreSidebarProps) {
  const router = useRouter();
  const pathname = usePathname();

  // Accordion open states
  const [appsOpen, setAppsOpen] = useState(true);
  const [portfolioOpen, setPortfolioOpen] = useState(true);
  const [securityOpen, setSecurityOpen] = useState(true);

  const handleTabSelect = (tab: AdminTab) => {
    if (pathname !== '/') {
      router.push(`/?tab=${tab}`);
    } else {
      setActiveTab(tab);
    }
  };

  const handleSettingsClick = () => {
    router.push('/settings');
  };

  const isTabActive = (tab: AdminTab) => !isSettingsRoute && activeTab === tab;

  return (
    <aside className="w-full lg:w-72 shrink-0 p-5 lg:p-6 flex flex-col h-full max-h-screen lg:h-screen lg:max-h-screen bg-[#0c0d14] border-b lg:border-b-0 lg:border-r border-white/10 select-none overflow-hidden">
      {/* Top Header / Logo (Fixed at top) */}
      <div className="shrink-0 flex items-center justify-between pb-4 border-b border-white/10">
        <Link href="/" className="inline-flex items-center gap-3 group">
          <CoreLogoEmblem className="h-9 w-9 transition-transform duration-300 group-hover:scale-105" />
          <div className="flex flex-col">
            <span className="text-sm font-extrabold text-white tracking-tight flex items-center gap-2">
              <span>Control Hub</span>
              <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
            </span>
            <span className="text-[10px] text-slate-400 font-mono">
              Portfolio Admin
            </span>
          </div>
        </Link>

        <div className="px-2.5 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-[10px] font-mono text-red-400 font-semibold">
          v2.4
        </div>
      </div>

      {/* Main Navigation List - Scrollable internally if screen is short */}
      <nav className="flex-1 overflow-y-auto pr-1 py-4 space-y-4 custom-scrollbar min-h-0">
        {/* 1. Root Item: Dashboard Overview */}
        <div>
          <button
            type="button"
            onClick={() => handleTabSelect('dashboard')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer ${
              isTabActive('dashboard')
                ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-lg shadow-red-950/50'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <LayoutGrid className="h-4 w-4 shrink-0 stroke-[2.2]" />
            <span>Dashboard</span>
          </button>
        </div>

        {/* 2. Group: Applications & Projects (with Tree Branches) */}
        <div className="space-y-1">
          <button
            type="button"
            onClick={() => setAppsOpen(!appsOpen)}
            className="w-full flex items-center justify-between px-3.5 py-2 text-xs font-bold text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            <span className="flex items-center gap-2.5">
              <FiFolder className="h-4 w-4 text-red-400" />
              <span>Apps &amp; Projects</span>
            </span>
            {appsOpen ? (
              <FiChevronUp className="h-3.5 w-3.5 text-slate-400" />
            ) : (
              <FiChevronDown className="h-3.5 w-3.5 text-slate-400" />
            )}
          </button>

          {/* Tree Branch Container with Connector Lines */}
          {appsOpen && (
            <div className="relative ml-5 pl-3.5 border-l-2 border-white/10 space-y-1">
              {/* Branch 1: Production Apps */}
              <div className="relative">
                <span className="absolute -left-[16px] top-1/2 -translate-y-1/2 w-3 h-[2px] bg-white/15 rounded-full" />
                <button
                  type="button"
                  onClick={() => handleTabSelect('apps')}
                  className={`w-full flex items-center justify-between px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    isTabActive('apps')
                      ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <span>Production Apps</span>
                  <span className="bg-red-500 text-white font-extrabold text-[10px] px-2 py-0.5 rounded-full shadow-xs">
                    {appsCount}
                  </span>
                </button>
              </div>

              {/* Branch 2: Games Collection */}
              <div className="relative">
                <span className="absolute -left-[16px] top-1/2 -translate-y-1/2 w-3 h-[2px] bg-white/15 rounded-full" />
                <button
                  type="button"
                  onClick={() => handleTabSelect('games')}
                  className={`w-full flex items-center justify-between px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    isTabActive('games')
                      ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <span>Games Hub</span>
                  {gamesCount > 0 && (
                    <span className="bg-white/10 text-slate-300 font-extrabold text-[10px] px-2 py-0.5 rounded-full">
                      {gamesCount}
                    </span>
                  )}
                </button>
              </div>

              {/* Branch 3: Portfolio Projects */}
              <div className="relative">
                <span className="absolute -left-[16px] top-1/2 -translate-y-1/2 w-3 h-[2px] bg-white/15 rounded-full" />
                <button
                  type="button"
                  onClick={() => handleTabSelect('projects')}
                  className={`w-full flex items-center justify-between px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    isTabActive('projects')
                      ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <span>Portfolio Projects</span>
                  <span className="bg-blue-500/20 text-blue-400 border border-blue-500/30 font-extrabold text-[10px] px-2 py-0.5 rounded-full">
                    {projectsCount}
                  </span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 3. Single Item: Client Messages */}
        <div>
          <button
            type="button"
            onClick={() => handleTabSelect('messages')}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              isTabActive('messages')
                ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-lg shadow-red-950/50'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <span className="flex items-center gap-2.5">
              <FiMessageSquare className="h-4 w-4 text-red-400" />
              <span>Inquiries &amp; Messages</span>
            </span>
            <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-extrabold text-[10px] px-2 py-0.5 rounded-full shadow-xs">
              {messagesCount}
            </span>
          </button>
        </div>

        {/* 4. Group: Portfolio & Profile Content (with Tree Branches) */}
        <div className="space-y-1">
          <button
            type="button"
            onClick={() => setPortfolioOpen(!portfolioOpen)}
            className="w-full flex items-center justify-between px-3.5 py-2 text-xs font-bold text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            <span className="flex items-center gap-2.5">
              <FiUser className="h-4 w-4 text-red-400" />
              <span>Portfolio</span>
            </span>
            {portfolioOpen ? (
              <FiChevronUp className="h-3.5 w-3.5 text-slate-400" />
            ) : (
              <FiChevronDown className="h-3.5 w-3.5 text-slate-400" />
            )}
          </button>

          {portfolioOpen && (
            <div className="relative ml-5 pl-3.5 border-l-2 border-white/10 space-y-1">
              {/* Profile */}
              <div className="relative hidden md:block">
                <span className="absolute -left-[16px] top-1/2 -translate-y-1/2 w-3 h-[2px] bg-white/15 rounded-full" />
                <button
                  type="button"
                  onClick={() => handleTabSelect('profile')}
                  className={`w-full flex items-center justify-between px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    isTabActive('profile')
                      ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <span>Developer Profile</span>
                </button>
              </div>

              {/* Skills */}
              <div className="relative">
                <span className="absolute -left-[16px] top-1/2 -translate-y-1/2 w-3 h-[2px] bg-white/15 rounded-full" />
                <button
                  type="button"
                  onClick={() => handleTabSelect('skills')}
                  className={`w-full flex items-center justify-between px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    isTabActive('skills')
                      ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <span>Skills Matrix</span>
                </button>
              </div>

              {/* Experience */}
              <div className="relative">
                <span className="absolute -left-[16px] top-1/2 -translate-y-1/2 w-3 h-[2px] bg-white/15 rounded-full" />
                <button
                  type="button"
                  onClick={() => handleTabSelect('experience')}
                  className={`w-full flex items-center justify-between px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    isTabActive('experience')
                      ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <span>Experience</span>
                </button>
              </div>

              {/* Education */}
              <div className="relative">
                <span className="absolute -left-[16px] top-1/2 -translate-y-1/2 w-3 h-[2px] bg-white/15 rounded-full" />
                <button
                  type="button"
                  onClick={() => handleTabSelect('education')}
                  className={`w-full flex items-center justify-between px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    isTabActive('education')
                      ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <span>Education &amp; Certs</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 5. Group: Security & Node */}
        <div className="space-y-1">
          <button
            type="button"
            onClick={() => setSecurityOpen(!securityOpen)}
            className="w-full flex items-center justify-between px-3.5 py-2 text-xs font-bold text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            <span className="flex items-center gap-2.5">
              <FiSettings className="h-4 w-4 text-red-400" />
              <span>Settings</span>
            </span>
            {securityOpen ? (
              <FiChevronUp className="h-3.5 w-3.5 text-slate-400" />
            ) : (
              <FiChevronDown className="h-3.5 w-3.5 text-slate-400" />
            )}
          </button>

          {securityOpen && (
            <div className="relative ml-5 pl-3.5 border-l-2 border-white/10 space-y-1">
              <div className="relative">
                <span className="absolute -left-[16px] top-1/2 -translate-y-1/2 w-3 h-[2px] bg-white/15 rounded-full" />
                <button
                  type="button"
                  onClick={handleSettingsClick}
                  className={`w-full flex items-center justify-between px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    isSettingsRoute
                      ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <span>Security &amp; 2FA</span>
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                </button>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Bottom Profile & Sign Out Card (Fixed at bottom) */}
      <div className="shrink-0 pt-4 mt-auto border-t border-white/10">
        <div className="p-3 rounded-2xl bg-[#12131c] border border-white/10 shadow-sm flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="h-8 w-8 rounded-xl bg-gradient-to-tr from-red-600 to-rose-700 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-md shadow-red-950/50">
              {adminEmail ? adminEmail.charAt(0).toUpperCase() : 'A'}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-white truncate">
                {profile?.name || 'Administrator'}
              </p>
              <p className="text-[10px] text-slate-400 font-mono truncate">
                {adminEmail || 'admin@hub'}
              </p>
            </div>
          </div>

          {onLogout && (
            <button
              type="button"
              onClick={onLogout}
              className="p-1.5 rounded-xl text-rose-400 hover:bg-rose-500/20 transition-colors cursor-pointer shrink-0"
              title="Sign Out"
            >
              <FiLogOut className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}
