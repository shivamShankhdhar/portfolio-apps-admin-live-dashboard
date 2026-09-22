'use client';

import React from 'react';
import Link from 'next/link';
import {
  FiGrid,
  FiUser,
  FiBriefcase,
  FiCode,
  FiBook,
  FiMail,
  FiExternalLink,
  FiLogOut,
  FiShield,
  FiLayers,
} from 'react-icons/fi';
import { FaGamepad } from 'react-icons/fa6';

export type AdminTab =
  | 'apps'
  | 'projects'
  | 'profile'
  | 'skills'
  | 'experience'
  | 'education'
  | 'messages';

interface SidebarProps {
  activeTab: AdminTab;
  setActiveTab: (tab: AdminTab) => void;
  appsCount: number;
  projectsCount: number;
  messagesCount: number;
  onLogout: () => void;
}

export default function Sidebar({
  activeTab,
  setActiveTab,
  appsCount,
  projectsCount,
  messagesCount,
  onLogout,
}: SidebarProps) {
  const navItems = [
    {
      id: 'apps' as AdminTab,
      label: 'Apps & Games Hub',
      icon: FaGamepad,
      count: appsCount,
      badgeColor: 'bg-red-500/20 text-red-400 border border-red-500/30',
    },
    {
      id: 'projects' as AdminTab,
      label: 'Portfolio Projects',
      icon: FiGrid,
      count: projectsCount,
      badgeColor: 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
    },
    {
      id: 'profile' as AdminTab,
      label: 'Profile & Bio',
      icon: FiUser,
    },
    {
      id: 'skills' as AdminTab,
      label: 'Skills & Tech Stack',
      icon: FiCode,
    },
    {
      id: 'experience' as AdminTab,
      label: 'Work Experience',
      icon: FiBriefcase,
    },
    {
      id: 'education' as AdminTab,
      label: 'Education & Certs',
      icon: FiBook,
    },
    {
      id: 'messages' as AdminTab,
      label: 'Contact Messages',
      icon: FiMail,
      count: messagesCount,
      badgeColor: 'bg-amber-500/20 text-amber-400 border border-amber-500/30',
    },
  ];

  return (
    <aside className="w-64 shrink-0 flex flex-col justify-between border-r border-red-500/20 bg-[#0d0e17]/95 p-5 min-h-screen">
      <div className="space-y-6">
        {/* Brand Header */}
        <div className="flex items-center gap-3 px-2">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-red-600 to-rose-500 flex items-center justify-center text-white shadow-lg shadow-red-600/30 font-bold">
            <FiShield className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-black text-white tracking-tight">Admin Hub</h2>
            <p className="text-[11px] font-mono text-slate-400">Control Center</p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-md shadow-red-600/20'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <Icon className={`h-4 w-4 ${isActive ? 'text-white' : 'text-red-400'}`} />
                  <span>{item.label}</span>
                </span>
                {item.count !== undefined && (
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      isActive ? 'bg-white/20 text-white' : item.badgeColor
                    }`}
                  >
                    {item.count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Live Sites External Links */}
        <div className="pt-4 border-t border-white/10 space-y-2">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 px-2">
            Live Deployments
          </p>
          <a
            href={process.env.NEXT_PUBLIC_PORTFOLIO_URL || 'http://localhost:3000'}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between px-3 py-2 rounded-xl text-xs text-slate-400 hover:text-white hover:bg-white/5 transition-all"
          >
            <span className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              <span>Portfolio (3000)</span>
            </span>
            <FiExternalLink className="h-3.5 w-3.5 text-slate-500" />
          </a>
          <a
            href={process.env.NEXT_PUBLIC_APPS_URL || 'http://localhost:3002'}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between px-3 py-2 rounded-xl text-xs text-slate-400 hover:text-white hover:bg-white/5 transition-all"
          >
            <span className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-red-400" />
              <span>Apps Hub (3002)</span>
            </span>
            <FiExternalLink className="h-3.5 w-3.5 text-slate-500" />
          </a>
        </div>
      </div>

      {/* Logout & User Info */}
      <div className="pt-4 border-t border-white/10 space-y-3">
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-rose-400 hover:bg-rose-500/10 transition-all cursor-pointer"
        >
          <FiLogOut className="h-4 w-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
