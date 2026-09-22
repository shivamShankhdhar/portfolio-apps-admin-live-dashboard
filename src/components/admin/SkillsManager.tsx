'use client';

import React, { useState } from 'react';
import { FiPlus, FiTrash2, FiEdit2 } from 'react-icons/fi';
import { toast } from 'sonner';

export interface SkillItem {
  _id?: string;
  name: string;
  category: string;
  proficiency: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
  icon?: string;
}

interface SkillsManagerProps {
  skills: SkillItem[];
  onReload: () => void;
  isModalOpen: boolean;
  setIsModalOpen: (open: boolean) => void;
}

export default function SkillsManager({
  skills,
  onReload,
  isModalOpen,
  setIsModalOpen,
}: SkillsManagerProps) {
  const [editingSkill, setEditingSkill] = useState<SkillItem | null>(null);
  const [formData, setFormData] = useState<Partial<SkillItem>>({
    name: '',
    category: 'Frontend',
    proficiency: 'Advanced',
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleOpenNew = () => {
    setEditingSkill(null);
    setFormData({ name: '', category: 'Frontend', proficiency: 'Advanced' });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (skill: SkillItem) => {
    setEditingSkill(skill);
    setFormData(skill);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) {
      toast.error('Skill name is required');
      return;
    }

    setIsSaving(true);
    try {
      if (editingSkill && editingSkill._id) {
        const res = await fetch(`/api/skills/${editingSkill._id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
        if (!res.ok) throw new Error('Failed to update skill');
        toast.success('Skill updated');
      } else {
        const res = await fetch('/api/skills', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
        if (!res.ok) throw new Error('Failed to create skill');
        toast.success('Skill added to database');
      }

      setIsModalOpen(false);
      onReload();
    } catch (err: any) {
      toast.error(err.message || 'Error saving skill');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id?: string) => {
    if (!id || !confirm('Delete this skill?')) return;
    try {
      const res = await fetch(`/api/skills/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      toast.success('Skill deleted');
      onReload();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-base font-bold text-white">Skills Matrix ({skills.length})</h2>
        <button
          onClick={handleOpenNew}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-500 text-white shadow-lg cursor-pointer"
        >
          <FiPlus className="h-4 w-4" />
          <span>Add Skill</span>
        </button>
      </div>

      {skills.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-[#12131c]/50 border border-dashed border-white/10">
          <p className="text-slate-400 text-sm">No skills found in database.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {skills.map((s) => (
            <div
              key={s._id || s.name}
              className="p-4 rounded-2xl bg-[#12131c] border border-red-500/20 hover:border-red-500/40 transition-all flex items-center justify-between"
            >
              <div>
                <h4 className="text-sm font-bold text-white">{s.name}</h4>
                <p className="text-[10px] text-slate-400">{s.category} &bull; {s.proficiency}</p>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleOpenEdit(s)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white"
                >
                  <FiEdit2 className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => handleDelete(s._id)}
                  className="p-1.5 rounded-lg text-rose-400 hover:text-rose-300"
                >
                  <FiTrash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#12131c] border-2 border-red-500/30 rounded-3xl p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white">{editingSkill ? 'Edit Skill' : 'New Skill'}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Skill Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white text-xs focus:outline-none focus:border-red-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Category</label>
                <input
                  type="text"
                  value={formData.category || 'Frontend'}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  placeholder="Frontend, Backend, Database, Mobile, DevOps"
                  className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white text-xs focus:outline-none focus:border-red-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Proficiency</label>
                <select
                  value={formData.proficiency || 'Advanced'}
                  onChange={(e) => setFormData({ ...formData, proficiency: e.target.value as any })}
                  className="w-full px-3 py-2 rounded-xl bg-[#181926] border border-white/10 text-white text-xs"
                >
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                  <option value="Expert">Expert</option>
                </select>
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
                  Save Skill
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
