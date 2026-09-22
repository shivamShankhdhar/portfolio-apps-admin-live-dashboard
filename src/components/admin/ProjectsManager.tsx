'use client';

import React, { useState } from 'react';
import { FiEdit2, FiTrash2, FiExternalLink, FiPlus, FiGithub } from 'react-icons/fi';
import { toast } from 'sonner';
import ConfirmDialog from './ConfirmDialog';
import { useSaveProject, useDeleteProject } from '@/hooks/useProjects';

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
  projects: any[];
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
  const [editingProject, setEditingProject] = useState<any | null>(null);
  const [formData, setFormData] = useState<any>({
    title: '',
    description: '',
    link: '',
    github: '',
    projectType: 'Web',
    featured: false,
  });
  const [techInput, setTechInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [deletingProjectId, setDeletingProjectId] = useState<string | null>(null);

  const saveProjectMutation = useSaveProject();
  const deleteProjectMutation = useDeleteProject();

  const handleOpenEdit = (project: any) => {
    setEditingProject(project);
    setFormData(project);
    setTechInput(project.technologies ? project.technologies.join(', ') : '');
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
          .map((t: string) => t.trim())
          .filter(Boolean),
        startDate: formData.startDate || new Date().toISOString(),
      };

      await saveProjectMutation.mutateAsync({
        id: editingProject?._id,
        data: payload,
      });

      setIsModalOpen(false);
      onReload();
    } catch {
      // Error handled by mutation
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingProjectId) return;
    try {
      await deleteProjectMutation.mutateAsync(deletingProjectId);
      setDeletingProjectId(null);
      onReload();
    } catch {
      // Error handled by mutation
    }
  };

  return (
    <div className="space-y-6">
      <ConfirmDialog
        open={!!deletingProjectId}
        onOpenChange={(open) => { if (!open) setDeletingProjectId(null); }}
        title="Delete Project"
        description="This project will be permanently removed from your portfolio database."
        confirmLabel="Delete Project"
        variant="danger"
        loading={deleteProjectMutation.isPending}
        onConfirm={handleDelete}
      />

      {/* Header Bar */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-white">Featured Projects ({projects.length})</h2>
          <p className="text-xs text-slate-400">Manage technical portfolio projects and case studies</p>
        </div>
        <button
          onClick={handleOpenNew}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white shadow-lg shadow-red-600/30 transition-all cursor-pointer"
        >
          <FiPlus className="h-4 w-4" />
          <span>Add Project</span>
        </button>
      </div>

      {/* Projects Grid */}
      {projects.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-[#12131c]/50 border border-dashed border-white/10">
          <p className="text-slate-400 text-sm">No portfolio projects currently in database.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((p) => (
            <div
              key={p._id}
              className="p-5 rounded-2xl bg-[#12131c] border border-red-500/20 hover:border-red-500/40 transition-all space-y-3 flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20">
                    {p.projectType || 'Project'}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(p)}
                      className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-all cursor-pointer"
                    >
                      <FiEdit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setDeletingProjectId(p._id)}
                      className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-all cursor-pointer"
                    >
                      <FiTrash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <p className="text-xs text-slate-300">{p.description}</p>

                {p.technologies && p.technologies.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {p.technologies.map((t: string, i: number) => (
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
