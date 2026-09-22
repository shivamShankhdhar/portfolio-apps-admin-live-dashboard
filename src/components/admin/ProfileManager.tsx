'use client';

import React, { useState, useEffect } from 'react';
import { FiSave, FiUser, FiLinkedin, FiGithub, FiMail, FiCheck } from 'react-icons/fi';
import { toast } from 'sonner';

export default function ProfileManager() {
  const [profile, setProfile] = useState<any>({
    name: '',
    bio: '',
    email: '',
    linkedinUrl: '',
    githubUrl: '',
    roles: [],
    available: true,
  });
  const [rolesInput, setRolesInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetch('/api/profile')
      .then((res) => res.json())
      .then((data) => {
        if (data) {
          setProfile(data);
          setRolesInput(data.roles?.join(', ') || '');
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
          .map((r) => r.trim())
          .filter(Boolean),
      };

      const res = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error('Failed to update profile');
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
