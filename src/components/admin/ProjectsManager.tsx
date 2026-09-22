'use client';

import React, { useState } from 'react';
import { FiEdit2, FiTrash2, FiExternalLink, FiPlus, FiGithub } from 'react-icons/fi';
import { toast } from 'sonner';

export interface ProjectItem {
  _id?: string;
  title: string;
  description: string;
  image?: string;
  technologies?: string[];
  link?: string;
  github?: string;
  startDate?: string;
  endDate?: string;
  featured?: boolean;
  projectType?: string;
}

interface ProjectsManagerProps {
  projects: ProjectItem[];
  onReload: () => void;
  isModalOpen: boolean;
  setIsModalOpen: (open: boolean) => void;
}

export default function ProjectsManager({
  projects,
  onReload,
  isModalOpen,
  setIsModalOpen,
}: ProjectsManagerProps) {
  const [editingProject, setEditingProject] = useState<ProjectItem | null>(null);
  const [formData, setFormData] = useState<Partial<ProjectItem>>({
    title: '',
    description: '',
    technologies: [],
    link: '',
    github: '',
    projectType: 'Web',
    featured: false,
  });
  const [techInput, setTechInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleOpenEdit = (project: ProjectItem) => {
    setEditingProject(project);
    setFormData(project);
    setTechInput(project.technologies?.join(', ') || '');
    setIsModalOpen(true);
  };

  const handleOpenNew = () => {
    setEditingProject(null);
    setFormData({
      title: '',
      description: '',
      link: '',
      github: '',
      projectType: 'Web',
      featured: false,
    });
    setTechInput('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.description) {
      toast.error('Title and description are required');
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        ...formData,
        technologies: techInput
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean),
        startDate: formData.startDate || new Date().toISOString(),
      };

      if (editingProject && editingProject._id) {
        const res = await fetch(`/api/projects/${editingProject._id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error('Failed to update project');
        toast.success('Project updated successfully');
      } else {
        const res = await fetch('/api/projects', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error('Failed to create project');
        toast.success('Project created successfully');
      }

      setIsModalOpen(false);
      onReload();
    } catch (err: any) {
      toast.error(err.message || 'Error saving project');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id?: string) => {
    if (!id || !confirm('Are you sure you want to delete this project?')) return;
    try {
      const res = await fetch(`/api/projects/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete project');
      toast.success('Project deleted');
      onReload();
    } catch (err: any) {
      toast.error(err.message || 'Error deleting project');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-base font-bold text-white">Portfolio Projects ({projects.length})</h2>
        <button
          onClick={handleOpenNew}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-500 text-white shadow-lg cursor-pointer"
        >
          <FiPlus className="h-4 w-4" />
          <span>New Project</span>
        </button>
      </div>

      {projects.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-[#12131c]/50 border border-dashed border-white/10">
          <p className="text-slate-400 text-sm">No portfolio projects currently in database.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {projects.map((p) => (
            <div
              key={p._id || p.title}
              className="rounded-3xl bg-[#12131c] border border-red-500/20 p-6 shadow-xl space-y-4"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <span>{p.title}</span>
                    {p.featured && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-semibold">
                        Featured
                      </span>
                    )}
                  </h3>
                  <span className="text-xs text-red-400 font-medium">{p.projectType || 'Web'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleOpenEdit(p)}
                    className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 transition-all cursor-pointer"
                  >
                    <FiEdit2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(p._id)}
                    className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-all cursor-pointer"
                  >
                    <FiTrash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <p className="text-xs text-slate-300">{p.description}</p>

              {p.technologies && p.technologies.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {p.technologies.map((t, i) => (
                    <span key={i} className="text-[10px] px-2 py-0.5 rounded-md bg-white/5 text-slate-400 border border-white/5">
                      {t}
                    </span>
                  ))}
                </div>
              )}

              <div className="pt-2 border-t border-white/10 flex items-center gap-4 text-xs text-slate-400">
                {p.link && (
                  <a href={p.link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-red-400">
                    <FiExternalLink className="h-3.5 w-3.5" />
                    <span>Live Demo</span>
                  </a>
                )}
                {p.github && (
                  <a href={p.github} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-red-400">
                    <FiGithub className="h-3.5 w-3.5" />
                    <span>GitHub</span>
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-xl bg-[#12131c] border-2 border-red-500/30 rounded-3xl p-6 shadow-2xl space-y-4">
            <h2 className="text-lg font-bold text-white">
              {editingProject ? 'Edit Project' : 'Add New Portfolio Project'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Title *</label>
                <input
                  type="text"
                  required
                  value={formData.title || ''}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white text-xs focus:outline-none focus:border-red-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Description *</label>
                <textarea
                  rows={3}
                  required
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white text-xs focus:outline-none focus:border-red-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Type</label>
                  <select
                    value={formData.projectType || 'Web'}
                    onChange={(e) => setFormData({ ...formData, projectType: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[#181926] border border-white/10 text-white text-xs"
                  >
                    <option value="Web">Web</option>
                    <option value="Mobile">Mobile</option>
                    <option value="Backend">Backend</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Technologies</label>
                  <input
                    type="text"
                    value={techInput}
                    onChange={(e) => setTechInput(e.target.value)}
                    placeholder="React, Next.js, Node.js"
                    className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Live URL</label>
                  <input
                    type="url"
                    value={formData.link || ''}
                    onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1">GitHub URL</label>
                  <input
                    type="url"
                    value={formData.github || ''}
                    onChange={(e) => setFormData({ ...formData, github: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white text-xs"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-500 text-white"
                >
                  {isSaving ? 'Saving...' : 'Save Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
