'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { SidebarProvider } from '@/components/ui/sidebar';
import Sidebar, { AdminTab } from '@/components/admin/Sidebar';
import CoreSidebar from '@/components/admin/CoreSidebar';
import Header from '@/components/admin/Header';
import AppsManager from '@/components/admin/AppsManager';
import ProjectsManager from '@/components/admin/ProjectsManager';
import ProfileManager from '@/components/admin/ProfileManager';
import SkillsManager from '@/components/admin/SkillsManager';
import ExperienceManager from '@/components/admin/ExperienceManager';
import EducationManager from '@/components/admin/EducationManager';
import MessagesManager from '@/components/admin/MessagesManager';
import DashboardManager from '@/components/admin/DashboardManager';
import SecuritySettingsModal from '@/components/admin/SecuritySettingsModal';
import ConfirmDialog from '@/components/admin/ConfirmDialog';
import { toast } from 'sonner';
import { FiRefreshCw, FiPlus } from 'react-icons/fi';

import { useAuthSession } from '@/hooks/useAuthSession';
import { useTwoFactorStatus } from '@/hooks/useTwoFactor';
import { useApps } from '@/hooks/useApps';
import { useProjects } from '@/hooks/useProjects';
import { useProfile } from '@/hooks/useProfile';
import {
  useSkills,
  useExperience,
  useEducation,
  useCertifications,
} from '@/hooks/usePortfolioCollections';
import { useMessages } from '@/hooks/useMessages';

type AuthStatus = 'validating' | 'setting_up' | 'authorized' | 'unauthorized';

export default function AdminDashboardPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [authStatus, setAuthStatus] = useState<AuthStatus>('validating');
  const [statusMessage, setStatusMessage] = useState('Validating Administrative Credentials...');
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSecurityModalOpen, setIsSecurityModalOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // TanStack Query Hooks
  const { data: authData, isLoading: isAuthLoading } = useAuthSession();
  const { data: twoFactorData } = useTwoFactorStatus();
  const { data: apps = [] } = useApps();
  const { data: projects = [] } = useProjects();
  const { data: profile } = useProfile();
  const { data: skills = [] } = useSkills();
  const { data: experience = [] } = useExperience();
  const { data: education = [] } = useEducation();
  const { data: certifications = [] } = useCertifications();
  const { data: messages = [] } = useMessages();

  // Derived state from queries
  const adminEmail =
    authData?.email ||
    (typeof window !== 'undefined' ? localStorage.getItem('adminEmail') : '') ||
    'Admin';
  const dbConnected = Boolean(authData?.dbConnected);
  const twoFactorEnabled = Boolean(twoFactorData?.twoFactorEnabled);
  const passkeyCount = twoFactorData?.passkeys?.length ?? 0;
  const loading = isAuthLoading;

  // Sync tab from query param if navigating back from /privacy
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get('tab') as AdminTab | null;
      const validTabs: AdminTab[] = [
        'dashboard',
        'apps',
        'games',
        'projects',
        'profile',
        'skills',
        'experience',
        'education',
        'messages',
      ];
      if (tabParam && validTabs.includes(tabParam)) {
        setActiveTab(tabParam);
      }
    }
  }, []);

  // Invalidate queries on manual refresh
  const loadData = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await queryClient.invalidateQueries();
    } finally {
      setIsRefreshing(false);
    }
  }, [queryClient]);

  // Strict Authentication Check
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const token = localStorage.getItem('adminToken');

    if (!token) {
      setAuthStatus('unauthorized');
      setStatusMessage('Authentication required. Redirecting to login...');
      setTimeout(() => router.replace('/login'), 300);
      return;
    }

    if (authData) {
      if (!authData.authenticated) {
        localStorage.removeItem('adminToken');
        setAuthStatus('unauthorized');
        setStatusMessage(
          authData.sessionTerminated
            ? 'Session expired: Another sign-in occurred from another device. Redirecting to login...'
            : 'Session invalid or expired. Redirecting to login...'
        );
        setTimeout(() => router.replace('/login'), 450);
      } else {
        setAuthStatus('authorized');
      }
    }
  }, [authData, router]);

  const handleLogout = () => {
    setShowLogoutConfirm(true);
  };

  const executeLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminEmail');
    toast.info('Signed out from Admin Hub');
    router.replace('/login');
  };

  const handleAddNew = () => {
    setIsModalOpen(true);
  };

  const appsOnlyCount = apps.filter((a: any) => (a.category || '').toLowerCase() !== 'games').length;
  const gamesOnlyCount = apps.filter((a: any) => (a.category || '').toLowerCase() === 'games').length;
  const canAddNew = ['apps', 'games', 'projects', 'skills', 'experience', 'education'].includes(activeTab);

  const tabDescriptions: Record<AdminTab, { title: string; subtitle: string }> = {
    dashboard: {
      title: 'Dashboard Overview',
      subtitle: 'Manage production releases, telemetry, developer portfolio, and security services',
    },
    apps: {
      title: 'Applications overview',
      subtitle: 'Manage production mobile apps, releases, and play store packages in MongoDB',
    },
    games: {
      title: 'Games Hub overview',
      subtitle: 'Manage gaming titles, closed testing tracks, game versions, and play console assets',
    },
    projects: {
      title: 'Portfolio Projects',
      subtitle: 'Showcase web, mobile, and full-stack software development projects',
    },
    profile: {
      title: 'Profile & Identity',
      subtitle: 'Update your developer bio, headline roles, and social contact handles',
    },
    skills: {
      title: 'Technical Skills Matrix',
      subtitle: 'Maintain your programming languages, frameworks, and tools matrix',
    },
    experience: {
      title: 'Career Experience',
      subtitle: 'Curate your career journey, employment history, and engineering accomplishments',
    },
    education: {
      title: 'Education & Credentials',
      subtitle: 'Manage formal academic degrees and verified technical credentials',
    },
    messages: {
      title: 'Customer Inquiries & Messages',
      subtitle: 'Review messages and inquiries submitted from the portfolio contact form',
    },
  };

  const currentTabInfo = tabDescriptions[activeTab] || tabDescriptions.dashboard;

  // Validation Gate — Core 2.0 styled skeleton frame
  if (authStatus !== 'authorized') {
    return (
      <div className="min-h-screen bg-[#EAECEF] dark:bg-[#0A0B10] p-3 sm:p-5 lg:p-7 flex flex-col justify-center">
        <div className="w-full max-w-[1600px] mx-auto bg-[#F4F5F6] dark:bg-[#11121A] rounded-[36px] border border-gray-200/80 dark:border-white/10 shadow-2xl overflow-hidden flex flex-col lg:flex-row min-h-[calc(100vh-3.5rem)] animate-pulse">
          {/* Skeleton Sidebar */}
          <div className="w-full lg:w-72 p-6 border-b lg:border-b-0 lg:border-r border-gray-200/80 dark:border-white/10 space-y-6">
            <div className="h-10 w-10 rounded-2xl bg-gray-300 dark:bg-white/10" />
            <div className="space-y-3">
              <div className="h-10 rounded-xl bg-gray-300 dark:bg-white/10" />
              <div className="h-8 rounded-xl bg-gray-200 dark:bg-white/5 w-3/4" />
              <div className="h-8 rounded-xl bg-gray-200 dark:bg-white/5 w-2/3" />
              <div className="h-8 rounded-xl bg-gray-200 dark:bg-white/5 w-4/5" />
            </div>
          </div>
          {/* Skeleton Content */}
          <div className="flex-1 p-8 space-y-6">
            <div className="h-8 w-64 rounded-xl bg-gray-300 dark:bg-white/10" />
            <div className="h-48 rounded-[28px] bg-white dark:bg-white/5" />
            <div className="h-96 rounded-[28px] bg-white dark:bg-white/5" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen max-h-screen p-3 sm:p-5 lg:p-6 flex flex-col justify-center bg-[#07080D] overflow-hidden">
      {/* Red & Black Core Framed Window (Sidebar inside the page) */}
      <div className="w-full max-w-[1600px] mx-auto bg-[#0c0d14] rounded-[28px] border border-white/10 shadow-2xl shadow-black/90 overflow-hidden flex flex-col lg:flex-row h-full max-h-[calc(100vh-2.5rem)]">
        {/* Integrated Core Sidebar with fixed height and internal scrolling */}
        <CoreSidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          appsCount={appsOnlyCount}
          gamesCount={gamesOnlyCount}
          projectsCount={projects.length}
          messagesCount={messages.length}
          profile={profile}
          adminEmail={adminEmail}
          onLogout={handleLogout}
        />

        {/* Content Area with Section Cards */}
        <div className="flex-1 flex flex-col min-w-0 p-6 sm:p-8 lg:p-10 space-y-6 overflow-y-auto h-full max-h-full custom-scrollbar">
          {/* Top Section Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0 pb-2">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
                <span>{currentTabInfo.title}</span>
                <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 mt-1 font-medium">
                {currentTabInfo.subtitle}
              </p>
            </div>

            <div className="flex items-center gap-3">
              {/* Refresh Action */}
              <button
                onClick={loadData}
                disabled={isRefreshing}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs font-bold text-white shadow-xs hover:bg-white/10 transition-all cursor-pointer disabled:opacity-50"
              >
                <FiRefreshCw className={`h-3.5 w-3.5 text-slate-400 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span>{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
              </button>

              {/* Quick Action Button (Add New) */}
              {canAddNew && (
                <button
                  onClick={handleAddNew}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white text-xs font-bold shadow-lg shadow-red-950/60 transition-all cursor-pointer"
                >
                  <FiPlus className="h-4 w-4" />
                  <span>Add New</span>
                </button>
              )}
            </div>
          </div>

          {/* Active Section Content */}
          <div className="space-y-6 pb-6">
            {activeTab === 'dashboard' && (
              <DashboardManager
                adminEmail={adminEmail}
                apps={apps}
                projects={projects}
                skills={skills}
                experience={experience}
                education={education}
                messages={messages}
                twoFactorEnabled={twoFactorEnabled}
                dbConnected={dbConnected}
                onNavigate={(tab) => setActiveTab(tab as AdminTab)}
                onOpenSettings={() => router.push('/settings')}
              />
            )}

            {activeTab === 'apps' && (
              <div className="bg-[#12131c] rounded-2xl p-6 sm:p-8 border border-white/10 shadow-lg">
                <AppsManager
                  apps={apps}
                  mode="apps"
                  onReload={loadData}
                  isModalOpen={isModalOpen}
                  setIsModalOpen={setIsModalOpen}
                />
              </div>
            )}

            {activeTab === 'games' && (
              <div className="bg-[#12131c] rounded-2xl p-6 sm:p-8 border border-white/10 shadow-lg">
                <AppsManager
                  apps={apps}
                  mode="games"
                  onReload={loadData}
                  isModalOpen={isModalOpen}
                  setIsModalOpen={setIsModalOpen}
                />
              </div>
            )}

            {activeTab === 'projects' && (
              <div className="bg-[#12131c] rounded-2xl p-6 sm:p-8 border border-white/10 shadow-lg">
                <ProjectsManager
                  projects={projects}
                  onReload={loadData}
                  isModalOpen={isModalOpen}
                  setIsModalOpen={setIsModalOpen}
                />
              </div>
            )}

            {activeTab === 'profile' && (
              <div className="bg-[#12131c] rounded-2xl p-6 sm:p-8 border border-white/10 shadow-lg">
                <ProfileManager
                  initialProfile={profile}
                  onProfileUpdated={() => queryClient.invalidateQueries({ queryKey: ['profile'] })}
                />
              </div>
            )}

            {activeTab === 'skills' && (
              <div className="bg-[#12131c] rounded-2xl p-6 sm:p-8 border border-white/10 shadow-lg">
                <SkillsManager
                  skills={skills}
                  onReload={loadData}
                  isModalOpen={isModalOpen}
                  setIsModalOpen={setIsModalOpen}
                />
              </div>
            )}

            {activeTab === 'experience' && (
              <div className="bg-[#12131c] rounded-2xl p-6 sm:p-8 border border-white/10 shadow-lg">
                <ExperienceManager
                  experience={experience}
                  onReload={loadData}
                  isModalOpen={isModalOpen}
                  setIsModalOpen={setIsModalOpen}
                />
              </div>
            )}

            {activeTab === 'education' && (
              <div className="bg-[#12131c] rounded-2xl p-6 sm:p-8 border border-white/10 shadow-lg">
                <EducationManager
                  education={education}
                  certifications={certifications}
                  onReload={loadData}
                  isModalOpen={isModalOpen}
                  setIsModalOpen={setIsModalOpen}
                />
              </div>
            )}

            {activeTab === 'messages' && (
              <div className="bg-[#12131c] rounded-2xl p-6 sm:p-8 border border-white/10 shadow-lg">
                <MessagesManager messages={messages} onReload={loadData} />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 2FA & Biometric Security Settings Modal */}
      <SecuritySettingsModal
        isOpen={isSecurityModalOpen}
        onClose={() => setIsSecurityModalOpen(false)}
        onStatusChange={() => {
          queryClient.invalidateQueries({ queryKey: ['2fa-status'] });
          queryClient.invalidateQueries({ queryKey: ['auth'] });
        }}
      />

      {/* Logout Confirmation Dialog */}
      <ConfirmDialog
        open={showLogoutConfirm}
        onOpenChange={setShowLogoutConfirm}
        title="Confirm Administrative Logout"
        description="Are you sure you want to end your active administrative session? You will be returned to the terminal login screen and must authenticate again."
        confirmLabel="Yes, Sign Out"
        cancelLabel="Cancel"
        variant="danger"
        onConfirm={executeLogout}
      />
    </div>
  );
}
