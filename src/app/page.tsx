'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { SidebarProvider } from '@/components/ui/sidebar';
import Sidebar, { AdminTab } from '@/components/admin/Sidebar';
import Header from '@/components/admin/Header';
import AppsManager from '@/components/admin/AppsManager';
import ProjectsManager from '@/components/admin/ProjectsManager';
import ProfileManager from '@/components/admin/ProfileManager';
import SkillsManager from '@/components/admin/SkillsManager';
import ExperienceManager from '@/components/admin/ExperienceManager';
import EducationManager from '@/components/admin/EducationManager';
import MessagesManager from '@/components/admin/MessagesManager';
import SecuritySettingsModal from '@/components/admin/SecuritySettingsModal';
import { AppItem } from '@/lib/defaultData';
import { toast } from 'sonner';

type AuthStatus = 'validating' | 'setting_up' | 'authorized' | 'unauthorized';

export default function AdminDashboardPage() {
  const router = useRouter();
  const [authStatus, setAuthStatus] = useState<AuthStatus>('validating');
  const [statusMessage, setStatusMessage] = useState('Validating Administrative Credentials...');
  const [activeTab, setActiveTab] = useState<AdminTab>('apps');
  const [adminEmail, setAdminEmail] = useState('');
  const [dbConnected, setDbConnected] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSecurityModalOpen, setIsSecurityModalOpen] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);

  // Database Collections State
  const [apps, setApps] = useState<AppItem[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [skills, setSkills] = useState<any[]>([]);
  const [experience, setExperience] = useState<any[]>([]);
  const [education, setEducation] = useState<any[]>([]);
  const [certifications, setCertifications] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Sync tab from query param if navigating back from /privacy
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get('tab') as AdminTab | null;
      const validTabs: AdminTab[] = [
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

  // Load all collections
  const loadData = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const token = localStorage.getItem('adminToken');
      const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

      // 1. Auth & DB Health check
      const authRes = await fetch('/api/auth', { headers });
      if (authRes.ok) {
        const authData = await authRes.json();
        setDbConnected(Boolean(authData.dbConnected));
        if (authData.email) setAdminEmail(authData.email);
      }

      // 2. Apps & Games
      const appsRes = await fetch('/api/apps');
      if (appsRes.ok) {
        const appsData = await appsRes.json();
        setApps(Array.isArray(appsData) ? appsData : []);
      }

      // 3. Projects
      const projectsRes = await fetch('/api/projects');
      if (projectsRes.ok) {
        const projData = await projectsRes.json();
        setProjects(Array.isArray(projData) ? projData : []);
      }

      // 4. Skills
      const skillsRes = await fetch('/api/skills');
      if (skillsRes.ok) {
        const skillsData = await skillsRes.json();
        setSkills(Array.isArray(skillsData) ? skillsData : []);
      }

      // 5. Experience
      const expRes = await fetch('/api/experience');
      if (expRes.ok) {
        const expData = await expRes.json();
        setExperience(Array.isArray(expData) ? expData : []);
      }

      // 6. Education
      const eduRes = await fetch('/api/education');
      if (eduRes.ok) {
        const eduData = await eduRes.json();
        setEducation(Array.isArray(eduData) ? eduData : []);
      }

      // 7. Certifications
      const certRes = await fetch('/api/certifications');
      if (certRes.ok) {
        const certData = await certRes.json();
        setCertifications(Array.isArray(certData) ? certData : []);
      }

      // 8. Messages
      const msgRes = await fetch('/api/messages');
      if (msgRes.ok) {
        const msgData = await msgRes.json();
        setMessages(Array.isArray(msgData) ? msgData : []);
      }

      // 9. Profile & Live URLs
      const profRes = await fetch('/api/profile?t=' + Date.now(), { cache: 'no-store' });
      if (profRes.ok) {
        const profData = await profRes.json();
        setProfile(profData);
      }

      // 10. 2FA Security Status Check
      if (token) {
        try {
          const twoFaRes = await fetch('/api/auth/2fa', { headers });
          if (twoFaRes.ok) {
            const twoFaData = await twoFaRes.json();
            setTwoFactorEnabled(Boolean(twoFaData.twoFactorEnabled));
          }
        } catch (e) {}
      }
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setIsRefreshing(false);
      setLoading(false);
    }
  }, []);

  // Strict Authentication Check First: Never show panel before validating
  useEffect(() => {
    let isMounted = true;

    async function checkAuthAndSetup() {
      const token = localStorage.getItem('adminToken');
      const email = localStorage.getItem('adminEmail');

      if (!token) {
        if (!isMounted) return;
        setAuthStatus('unauthorized');
        setStatusMessage('Authentication required. Redirecting to login...');
        setTimeout(() => {
          if (isMounted) router.replace('/login');
        }, 300);
        return;
      }

      setStatusMessage('Validating session security credentials...');

      try {
        const res = await fetch('/api/auth', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();

        if (!res.ok || !data.authenticated) {
          localStorage.removeItem('adminToken');
          if (!isMounted) return;
          setAuthStatus('unauthorized');
          setStatusMessage(
            data.sessionTerminated
              ? 'Session expired: Another sign-in occurred from another device. Redirecting to login...'
              : 'Session invalid or expired. Redirecting to login...'
          );
          setTimeout(() => {
            if (isMounted) router.replace('/login');
          }, 450);
          return;
        }

        if (!isMounted) return;
        setAdminEmail(data.email || email || 'Admin');
        setDbConnected(Boolean(data.dbConnected));
        setAuthStatus('setting_up');
        setStatusMessage('Setting up the Admin Panel...');

        await loadData();

        if (!isMounted) return;
        setTimeout(() => {
          if (isMounted) {
            setAuthStatus('authorized');
          }
        }, 350);
      } catch (err) {
        console.error('Auth verification error:', err);
        if (!isMounted) return;
        setAuthStatus('unauthorized');
        setStatusMessage('Security verification failed. Redirecting to login...');
        setTimeout(() => {
          if (isMounted) router.replace('/login');
        }, 350);
      }
    }

    checkAuthAndSetup();

    return () => {
      isMounted = false;
    };
  }, [router, loadData]);

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminEmail');
    toast.info('Signed out from Admin Hub');
    router.replace('/login');
  };

  const handleAddNew = () => {
    setIsModalOpen(true);
  };

  // If not yet authorized, show the security gate with status messages
  if (authStatus !== 'authorized') {
    return (
      <div className="min-h-screen w-full bg-[#09090b] flex">
        {/* Skeleton Sidebar */}
        <div className="hidden md:flex w-64 shrink-0 flex-col bg-[#0d0e17] border-r border-white/10 p-4 gap-3">
          {/* Logo area */}
          <div className="flex items-center gap-3 px-2 py-3 mb-2">
            <div className="h-8 w-8 rounded-xl bg-white/10 animate-pulse" />
            <div className="h-4 w-28 rounded-lg bg-white/10 animate-pulse" />
          </div>
          {/* Nav items */}
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 px-3 py-2.5 rounded-xl">
              <div className="h-4 w-4 rounded-md bg-white/10 animate-pulse shrink-0" />
              <div className="h-3.5 rounded-lg bg-white/10 animate-pulse" style={{ width: `${55 + (i % 3) * 20}px` }} />
            </div>
          ))}
          {/* Bottom user area */}
          <div className="mt-auto flex items-center gap-3 px-3 py-2.5">
            <div className="h-8 w-8 rounded-full bg-white/10 animate-pulse shrink-0" />
            <div className="flex-1 space-y-1.5">
              <div className="h-3 w-32 rounded-lg bg-white/10 animate-pulse" />
              <div className="h-2.5 w-20 rounded-lg bg-white/10 animate-pulse" />
            </div>
          </div>
        </div>

        {/* Main Content Skeleton */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header skeleton */}
          <div className="px-8 py-6 border-b border-white/10 flex items-center justify-between gap-4">
            <div className="space-y-2">
              <div className="h-6 w-52 rounded-xl bg-white/10 animate-pulse" />
              <div className="h-3 w-72 rounded-lg bg-white/10 animate-pulse" />
            </div>
            <div className="flex items-center gap-3">
              <div className="h-7 w-24 rounded-full bg-white/10 animate-pulse" />
              <div className="h-7 w-28 rounded-full bg-white/10 animate-pulse" />
              <div className="h-8 w-8 rounded-xl bg-white/10 animate-pulse" />
              <div className="h-8 w-24 rounded-xl bg-white/10 animate-pulse" />
            </div>
          </div>

          {/* Content area skeleton */}
          <div className="flex-1 p-8 space-y-6 overflow-hidden">
            {/* Stat cards row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="p-5 rounded-2xl bg-[#12131c] border border-white/10 space-y-3">
                  <div className="h-3 w-16 rounded-lg bg-white/10 animate-pulse" />
                  <div className="h-7 w-10 rounded-xl bg-white/10 animate-pulse" />
                  <div className="h-2.5 w-24 rounded-lg bg-white/10 animate-pulse" />
                </div>
              ))}
            </div>
            {/* Table / card grid */}
            <div className="p-6 rounded-2xl bg-[#12131c] border border-white/10 space-y-4">
              <div className="flex items-center justify-between">
                <div className="h-5 w-40 rounded-xl bg-white/10 animate-pulse" />
                <div className="h-8 w-24 rounded-xl bg-white/10 animate-pulse" />
              </div>
              <div className="h-10 w-full rounded-xl bg-white/10 animate-pulse" />
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 py-3 border-t border-white/5">
                  <div className="h-10 w-10 rounded-xl bg-white/10 animate-pulse shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3.5 rounded-lg bg-white/10 animate-pulse" style={{ width: `${45 + (i % 4) * 15}%` }} />
                    <div className="h-2.5 w-24 rounded-lg bg-white/10 animate-pulse" />
                  </div>
                  <div className="h-6 w-16 rounded-full bg-white/10 animate-pulse" />
                  <div className="h-8 w-8 rounded-xl bg-white/10 animate-pulse" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const appsOnlyCount = apps.filter((a) => (a.category || '').toLowerCase() !== 'games').length;
  const gamesOnlyCount = apps.filter((a) => (a.category || '').toLowerCase() === 'games').length;

  return (
    <SidebarProvider defaultOpen={true} className="min-h-screen w-full bg-[#09090b]">
      {/* Sidebar Navigation */}
      <Sidebar
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

      {/* Main Workspace Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <Header
          activeTab={activeTab}
          adminEmail={adminEmail}
          dbConnected={dbConnected}
          onAddNew={handleAddNew}
          onRefresh={loadData}
          isRefreshing={isRefreshing}
          onOpenSecurity={() => router.push('/settings')}
          twoFactorEnabled={twoFactorEnabled}
        />

        {/* Tab Content Container */}
        <main className="flex-1 p-6 sm:p-8 max-w-7xl w-full">
          {loading ? (
            <div className="flex items-center justify-center p-20">
              <div className="h-8 w-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <>
              {activeTab === 'apps' && (
                <AppsManager
                  apps={apps}
                  mode="apps"
                  onReload={loadData}
                  isModalOpen={isModalOpen}
                  setIsModalOpen={setIsModalOpen}
                />
              )}

              {activeTab === 'games' && (
                <AppsManager
                  apps={apps}
                  mode="games"
                  onReload={loadData}
                  isModalOpen={isModalOpen}
                  setIsModalOpen={setIsModalOpen}
                />
              )}

              {activeTab === 'projects' && (
                <ProjectsManager
                  projects={projects}
                  onReload={loadData}
                  isModalOpen={isModalOpen}
                  setIsModalOpen={setIsModalOpen}
                />
              )}

              {activeTab === 'profile' && (
                <ProfileManager
                  initialProfile={profile}
                  onProfileUpdated={(updated) => setProfile(updated)}
                />
              )}

              {activeTab === 'skills' && (
                <SkillsManager
                  skills={skills}
                  onReload={loadData}
                  isModalOpen={isModalOpen}
                  setIsModalOpen={setIsModalOpen}
                />
              )}

              {activeTab === 'experience' && (
                <ExperienceManager
                  experience={experience}
                  onReload={loadData}
                  isModalOpen={isModalOpen}
                  setIsModalOpen={setIsModalOpen}
                />
              )}

              {activeTab === 'education' && (
                <EducationManager
                  education={education}
                  certifications={certifications}
                  onReload={loadData}
                  isModalOpen={isModalOpen}
                  setIsModalOpen={setIsModalOpen}
                />
              )}

              {activeTab === 'messages' && (
                <MessagesManager messages={messages} onReload={loadData} />
              )}
            </>
          )}
        </main>
      </div>

      {/* 2FA & Biometric Security Settings Modal */}
      <SecuritySettingsModal
        isOpen={isSecurityModalOpen}
        onClose={() => setIsSecurityModalOpen(false)}
        onStatusChange={(enabled) => setTwoFactorEnabled(enabled)}
      />
    </SidebarProvider>
  );
}
