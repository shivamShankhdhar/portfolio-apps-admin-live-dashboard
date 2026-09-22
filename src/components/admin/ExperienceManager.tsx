'use client';

import React, { useState } from 'react';
import { FiPlus, FiTrash2, FiEdit2, FiBriefcase } from 'react-icons/fi';
import { toast } from 'sonner';

export interface ExperienceItem {
  _id?: string;
  company: string;
  position: string;
  description: string;
  startDate: string;
  endDate?: string;
  isCurrentRole?: boolean;
  technologies?: string[];
}

interface ExperienceManagerProps {
  experience: ExperienceItem[];
  onReload: () => void;
  isModalOpen: boolean;
  setIsModalOpen: (open: boolean) => void;
}

export default function ExperienceManager({
  experience,
  onReload,
  isModalOpen,
  setIsModalOpen,
}: ExperienceManagerProps) {
  const [editingExp, setEditingExp] = useState<ExperienceItem | null>(null);
  const [formData, setFormData] = useState<Partial<ExperienceItem>>({
    company: '',
    position: '',
    description: '',
    isCurrentRole: false,
  });
  const [techInput, setTechInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleOpenNew = () => {
    setEditingExp(null);
    setFormData({ company: '', position: '', description: '', isCurrentRole: false });
    setTechInput('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (exp: ExperienceItem) => {
    setEditingExp(exp);
    setFormData(exp);
    setTechInput(exp.technologies?.join(', ') || '');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.company || !formData.position) {
      toast.error('Company and Position are required');
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        ...formData,
        startDate: formData.startDate || new Date().toISOString(),
        technologies: techInput
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean),
      };

      if (editingExp && editingExp._id) {
        const res = await fetch(`/api/experience/${editingExp._id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error('Failed to update experience');
        toast.success('Experience updated');
      } else {
        const res = await fetch('/api/experience', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error('Failed to create experience');
        toast.success('Experience added to database');
      }

      setIsModalOpen(false);
      onReload();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id?: string) => {
    if (!id || !confirm('Delete this role?')) return;
    try {
      const res = await fetch(`/api/experience/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      toast.success('Experience deleted');
      onReload();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-base font-bold text-white">Work History ({experience.length})</h2>
        <button
          onClick={handleOpenNew}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-500 text-white shadow-lg cursor-pointer"
        >
          <FiPlus className="h-4 w-4" />
          <span>Add Role</span>
        </button>
      </div>

      {experience.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-[#12131c]/50 border border-dashed border-white/10">
          <p className="text-slate-400 text-sm">No work experience in database.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {experience.map((exp) => (
            <div
              key={exp._id || exp.company}
              className="p-6 rounded-3xl bg-[#12131c] border border-red-500/20 shadow-xl space-y-3"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <span>{exp.position}</span>
                    <span className="text-xs font-normal text-slate-400">at {exp.company}</span>
                    {exp.isCurrentRole && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-semibold">
                        Present
                      </span>
                    )}
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleOpenEdit(exp)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white"
                  >
                    <FiEdit2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(exp._id)}
                    className="p-1.5 rounded-lg text-rose-400 hover:text-rose-300"
                  >
                    <FiTrash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <p className="text-xs text-slate-300">{exp.description}</p>
              {exp.technologies && exp.technologies.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {exp.technologies.map((t, i) => (
                    <span key={i} className="text-[10px] px-2 py-0.5 rounded-md bg-white/5 text-slate-400">
                      {t}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-xl bg-[#12131c] border-2 border-red-500/30 rounded-3xl p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white">{editingExp ? 'Edit Experience' : 'Add Experience'}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Company *</label>
                  <input
                    type="text"
                    required
                    value={formData.company || ''}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white text-xs focus:outline-none focus:border-red-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Position *</label>
                  <input
                    type="text"
                    required
                    value={formData.position || ''}
                    onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white text-xs focus:outline-none focus:border-red-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Description</label>
                <textarea
                  rows={3}
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white text-xs focus:outline-none focus:border-red-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Technologies</label>
                <input
                  type="text"
                  value={techInput}
                  onChange={(e) => setTechInput(e.target.value)}
                  placeholder="Java, Spring Boot, React, AWS"
                  className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white text-xs focus:outline-none focus:border-red-500"
                />
              </div>

              <div>
                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={Boolean(formData.isCurrentRole)}
                    onChange={(e) => setFormData({ ...formData, isCurrentRole: e.target.checked })}
                    className="rounded text-red-600 focus:ring-red-500"
                  />
                  <span className="text-xs text-slate-300 font-semibold">Currently working in this role</span>
                </label>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs text-slate-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-500 text-white"
                >
                  Save Role
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
