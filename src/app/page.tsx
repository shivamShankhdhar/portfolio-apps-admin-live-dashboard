'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar, { AdminTab } from '@/components/admin/Sidebar';
import Header from '@/components/admin/Header';
import AppsManager from '@/components/admin/AppsManager';
import ProjectsManager from '@/components/admin/ProjectsManager';
import ProfileManager from '@/components/admin/ProfileManager';
import SkillsManager from '@/components/admin/SkillsManager';
import ExperienceManager from '@/components/admin/ExperienceManager';
import EducationManager from '@/components/admin/EducationManager';
import MessagesManager from '@/components/admin/MessagesManager';
import { AppItem } from '@/lib/defaultData';
import { toast } from 'sonner';

export default function AdminDashboardPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<AdminTab>('apps');
  const [adminEmail, setAdminEmail] = useState('');
  const [dbConnected, setDbConnected] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

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

  // Authentication check
  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    const email = localStorage.getItem('adminEmail');
    if (!token) {
      router.push('/login');
      return;
    }
    setAdminEmail(email || 'Admin');
  }, [router]);

  // Load all collections
  const loadData = useCallback(async () => {
    setIsRefreshing(true);
    try {
      // 1. Auth & DB Health check
      const authRes = await fetch('/api/auth');
      if (authRes.ok) {
        const authData = await authRes.json();
        setDbConnected(Boolean(authData.dbConnected));
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
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setIsRefreshing(false);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminEmail');
    toast.info('Signed out from Admin Hub');
    router.push('/login');
  };

  const handleAddNew = () => {
    setIsModalOpen(true);
  };

  return (
    <div className="flex min-h-screen bg-[#09090b]">
      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        appsCount={apps.length}
        projectsCount={projects.length}
        messagesCount={messages.length}
        profile={profile}
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
    </div>
  );
}
