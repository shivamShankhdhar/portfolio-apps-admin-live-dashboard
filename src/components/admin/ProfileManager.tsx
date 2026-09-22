'use client';

import React, { useState, useEffect } from 'react';
import { FiSave, FiUser, FiLinkedin, FiGithub, FiMail, FiCheck } from 'react-icons/fi';
import { toast } from 'sonner';

interface ProfileManagerProps {
  initialProfile?: any;
  onProfileUpdated?: (updated: any) => void;
}

export default function ProfileManager({ initialProfile, onProfileUpdated }: ProfileManagerProps = {}) {
  const [profile, setProfile] = useState<any>(initialProfile || {
    name: '',
    bio: '',
    email: '',
    linkedinUrl: '',
    githubUrl: '',
    portfolioUrl: '',
    appsUrl: '',
    adminUrl: '',
    roles: [],
    available: true,
  });
  const [rolesInput, setRolesInput] = useState(initialProfile?.roles?.join(', ') || '');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (initialProfile) {
      setProfile(initialProfile);
      setRolesInput(initialProfile.roles?.join(', ') || '');
    }
  }, [initialProfile]);

  useEffect(() => {
    fetch('/api/profile?t=' + Date.now(), { cache: 'no-store' })
      .then((res) => res.json())
      .then((data) => {
        if (data) {
          setProfile(data);
          setRolesInput(data.roles?.join(', ') || '');
          onProfileUpdated?.(data);
        }
      })
      .catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const payload = {
        ...profile,
        roles: rolesInput
          .split(',')
          .map((r: string) => r.trim())
          .filter(Boolean),
      };

      const res = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error('Failed to update profile');
      const updated = await res.json();
      setProfile(updated);
      onProfileUpdated?.(updated);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('profileUpdated', { detail: updated }));
      }
      toast.success('Profile details updated successfully');
    } catch (err: any) {
      toast.error(err.message || 'Error saving profile');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-3xl rounded-3xl bg-[#12131c] border border-red-500/20 p-8 shadow-xl space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-red-600 to-rose-500 flex items-center justify-center text-white text-xl">
          <FiUser />
        </div>
        <div>
          <h2 className="text-lg font-bold text-white">Developer Bio & Headline</h2>
          <p className="text-xs text-slate-400">Manage public profile details visible across the portfolio</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Full Name</label>
            <input
              type="text"
              required
              value={profile.name || ''}
              onChange={(e) => setProfile({ ...profile, name: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-sm focus:outline-none focus:border-red-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Contact Email</label>
            <input
              type="email"
              value={profile.email || ''}
              onChange={(e) => setProfile({ ...profile, email: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-sm focus:outline-none focus:border-red-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
            Roles / Titles (comma separated)
          </label>
          <input
            type="text"
            value={rolesInput}
            onChange={(e) => setRolesInput(e.target.value)}
            placeholder="Full Stack Developer, React Native Developer, Java Engineer"
            className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-sm focus:outline-none focus:border-red-500"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Bio Description</label>
          <textarea
            rows={4}
            value={profile.bio || ''}
            onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
            placeholder="Introduce your background, engineering passions, and architecture experience..."
            className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-sm focus:outline-none focus:border-red-500"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase mb-1">LinkedIn URL</label>
            <input
              type="url"
              value={profile.linkedinUrl || ''}
              onChange={(e) => setProfile({ ...profile, linkedinUrl: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-sm focus:outline-none focus:border-red-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase mb-1">GitHub URL</label>
            <input
              type="url"
              value={profile.githubUrl || ''}
              onChange={(e) => setProfile({ ...profile, githubUrl: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-sm focus:outline-none focus:border-red-500"
            />
          </div>
        </div>

        {/* Live Ecosystem Deployment URLs (Controlled via Backend) */}
        <div className="p-4 rounded-2xl bg-black/30 border border-white/10 space-y-3">
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <span className="text-xs font-mono uppercase tracking-wider text-slate-300 font-bold">
              Live Ecosystem Deployment URLs (Backend Controlled)
            </span>
            <span className="text-[10px] font-mono text-emerald-400">Controls Cross-Site Links</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">
                Portfolio Live URL
              </label>
              <input
                type="url"
                value={profile.portfolioUrl || ''}
                onChange={(e) => setProfile({ ...profile, portfolioUrl: e.target.value })}
                placeholder="http://localhost:3000 or https://..."
                className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white text-xs focus:outline-none focus:border-red-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">
                Mobile Apps Hub Live URL
              </label>
              <input
                type="url"
                value={profile.appsUrl || ''}
                onChange={(e) => setProfile({ ...profile, appsUrl: e.target.value })}
                placeholder="http://localhost:3002 or https://..."
                className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white text-xs focus:outline-none focus:border-red-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">
                Admin Portal URL
              </label>
              <input
                type="url"
                value={profile.adminUrl || ''}
                onChange={(e) => setProfile({ ...profile, adminUrl: e.target.value })}
                placeholder="http://localhost:3003 or https://..."
                className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white text-xs focus:outline-none focus:border-red-500 font-mono"
              />
            </div>
          </div>
          <p className="text-[10px] text-slate-400">
            Updating these URLs controls where external and navigation links point across the Portfolio, Mobile Apps Hub, and Admin Portal.
          </p>
        </div>

        <div className="pt-2">
          <label className="inline-flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={Boolean(profile.available)}
              onChange={(e) => setProfile({ ...profile, available: e.target.checked })}
              className="rounded text-red-600 focus:ring-red-500 h-4 w-4 bg-black/40 border-white/10"
            />
            <span className="text-xs font-semibold text-slate-300">
              Show Available for Opportunities / Hire
            </span>
          </label>
        </div>

        <div className="pt-4 border-t border-white/10 flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="px-6 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white shadow-lg shadow-red-600/30 flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <FiSave className="h-4 w-4" />
            <span>{isSaving ? 'Saving...' : 'Save Profile Changes'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
