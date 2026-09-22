'use client';

import React, { useState, useEffect } from 'react';
import {
  FiPlus,
  FiTrash2,
  FiEdit2,
  FiBook,
  FiAward,
  FiCalendar,
  FiExternalLink,
  FiX,
  FiCheck,
} from 'react-icons/fi';
import { toast } from 'sonner';

export interface EducationItem {
  _id?: string;
  school: string;
  degree: string;
  field: string;
  startDate?: string | Date;
  endDate?: string | Date;
  grade?: string;
  description?: string;
}

export interface CertificationItem {
  _id?: string;
  title: string;
  issuer: string;
  issueDate?: string | Date;
  expiryDate?: string | Date;
  credentialId?: string;
  credentialUrl?: string;
  image?: string;
  description?: string;
}

interface EducationManagerProps {
  education: EducationItem[];
  certifications: CertificationItem[];
  onReload: () => void;
  isModalOpen?: boolean;
  setIsModalOpen?: (open: boolean) => void;
}

const formatDateForInput = (d?: string | Date) => {
  if (!d) return '';
  try {
    const date = new Date(d);
    if (isNaN(date.getTime())) return '';
    return date.toISOString().split('T')[0];
  } catch {
    return '';
  }
};

const formatDateDisplay = (d?: string | Date) => {
  if (!d) return '';
  try {
    const date = new Date(d);
    if (isNaN(date.getTime())) return '';
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
  } catch {
    return '';
  }
};

export default function EducationManager({
  education,
  certifications,
  onReload,
  isModalOpen,
  setIsModalOpen,
}: EducationManagerProps) {
  // Education state
  const [eduModalOpen, setEduModalOpen] = useState(false);
  const [editingEdu, setEditingEdu] = useState<EducationItem | null>(null);
  const [isCurrentlyStudying, setIsCurrentlyStudying] = useState(false);
  const [eduForm, setEduForm] = useState<Partial<EducationItem>>({
    school: '',
    degree: '',
    field: '',
    grade: '',
    startDate: '',
    endDate: '',
    description: '',
  });

  // Certifications state
  const [certModalOpen, setCertModalOpen] = useState(false);
  const [editingCert, setEditingCert] = useState<CertificationItem | null>(null);
  const [certForm, setCertForm] = useState<Partial<CertificationItem>>({
    title: '',
    issuer: '',
    credentialId: '',
    credentialUrl: '',
    issueDate: '',
    expiryDate: '',
    description: '',
  });

  const [isSaving, setIsSaving] = useState(false);

  // Hook to parent "Add New" button in Header
  useEffect(() => {
    if (isModalOpen) {
      handleOpenNewEdu();
      setIsModalOpen?.(false);
    }
  }, [isModalOpen, setIsModalOpen]);

  // ==========================================
  // Academic Degree Handlers
  // ==========================================
  const handleOpenNewEdu = () => {
    setEditingEdu(null);
    setIsCurrentlyStudying(false);
    setEduForm({
      school: '',
      degree: '',
      field: '',
      grade: '',
      startDate: new Date().toISOString().split('T')[0],
      endDate: '',
      description: '',
    });
    setEduModalOpen(true);
  };

  const handleOpenEditEdu = (edu: EducationItem) => {
    setEditingEdu(edu);
    setIsCurrentlyStudying(!edu.endDate);
    setEduForm({
      school: edu.school || '',
      degree: edu.degree || '',
      field: edu.field || '',
      grade: edu.grade || '',
      startDate: formatDateForInput(edu.startDate),
      endDate: formatDateForInput(edu.endDate),
      description: edu.description || '',
    });
    setEduModalOpen(true);
  };

  const handleSaveEdu = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eduForm.school || !eduForm.degree || !eduForm.field) {
      toast.error('School, Degree, and Field of Study are required');
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        ...eduForm,
        startDate: eduForm.startDate ? new Date(eduForm.startDate) : new Date(),
        endDate: isCurrentlyStudying || !eduForm.endDate ? null : new Date(eduForm.endDate),
      };

      let res;
      if (editingEdu && editingEdu._id) {
        // Edit existing degree
        res = await fetch(`/api/education/${editingEdu._id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        // Add new degree
        res = await fetch('/api/education', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to save degree');
      }

      toast.success(editingEdu ? 'Academic degree updated successfully' : 'Academic degree added successfully');
      setEduModalOpen(false);
      onReload();
    } catch (err: any) {
      toast.error(err.message || 'Error saving degree record');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteEdu = async (id?: string) => {
    if (!id) return;
    if (!confirm('Are you sure you want to delete this degree record?')) return;
    try {
      const res = await fetch(`/api/education/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete degree');
      toast.success('Academic degree removed');
      onReload();
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete education record');
    }
  };

  // ==========================================
  // Certification Handlers
  // ==========================================
  const handleOpenNewCert = () => {
    setEditingCert(null);
    setCertForm({
      title: '',
      issuer: '',
      credentialId: '',
      credentialUrl: '',
      issueDate: new Date().toISOString().split('T')[0],
      expiryDate: '',
      description: '',
    });
    setCertModalOpen(true);
  };

  const handleOpenEditCert = (cert: CertificationItem) => {
    setEditingCert(cert);
    setCertForm({
      title: cert.title || '',
      issuer: cert.issuer || '',
      credentialId: cert.credentialId || '',
      credentialUrl: cert.credentialUrl || '',
      issueDate: formatDateForInput(cert.issueDate),
      expiryDate: formatDateForInput(cert.expiryDate),
      description: cert.description || '',
    });
    setCertModalOpen(true);
  };

  const handleSaveCert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!certForm.title || !certForm.issuer) {
      toast.error('Title and Issuing Organization are required');
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        ...certForm,
        issueDate: certForm.issueDate ? new Date(certForm.issueDate) : new Date(),
        expiryDate: certForm.expiryDate ? new Date(certForm.expiryDate) : null,
      };

      let res;
      if (editingCert && editingCert._id) {
        res = await fetch(`/api/certifications/${editingCert._id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch('/api/certifications', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to save certification');
      }

      toast.success(editingCert ? 'Certification updated' : 'Certification added');
      setCertModalOpen(false);
      onReload();
    } catch (err: any) {
      toast.error(err.message || 'Error saving certification');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteCert = async (id?: string) => {
    if (!id) return;
    if (!confirm('Are you sure you want to delete this certification?')) return;
    try {
      const res = await fetch(`/api/certifications/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete certification');
      toast.success('Certification removed');
      onReload();
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete certification');
    }
  };

  return (
    <div className="space-y-10">
      {/* ======================================================== */}
      {/* ACADEMIC DEGREES SECTION */}
      {/* ======================================================== */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-white/10">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <FiBook className="text-red-500 h-5 w-5" />
              <span>Academic Degrees ({education.length})</span>
            </h2>
            <p className="text-xs text-slate-400">
              Manage degrees, university education, grades, and academic achievements
            </p>
          </div>
          <button
            onClick={handleOpenNewEdu}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white shadow-lg shadow-red-600/20 cursor-pointer transition-all self-start sm:self-auto"
          >
            <FiPlus className="h-4 w-4" />
            <span>Add Degree</span>
          </button>
        </div>

        {education.length === 0 ? (
          <div className="p-8 text-center rounded-2xl bg-[#12131c] border border-white/10 text-slate-400 text-xs">
            No academic degree records found. Click &quot;Add Degree&quot; to add your university degrees.
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {education.map((edu) => {
              const startFormatted = formatDateDisplay(edu.startDate);
              const endFormatted = edu.endDate ? formatDateDisplay(edu.endDate) : 'Present';
              return (
                <div
                  key={edu._id}
                  className="p-5 rounded-2xl bg-[#12131c] border border-red-500/20 hover:border-red-500/40 transition-all flex flex-col justify-between gap-4 group"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="text-sm font-bold text-white group-hover:text-red-400 transition-colors">
                          {edu.degree} {edu.field ? `in ${edu.field}` : ''}
                        </h4>
                        <p className="text-xs font-medium text-slate-300">{edu.school}</p>
                      </div>

                      {/* Action buttons: Edit & Delete */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => handleOpenEditEdu(edu)}
                          title="Edit Degree"
                          className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 transition-all cursor-pointer"
                        >
                          <FiEdit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteEdu(edu._id)}
                          title="Delete Degree"
                          className="p-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 border border-rose-500/20 transition-all cursor-pointer"
                        >
                          <FiTrash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Timeline and Grade Badges */}
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      {(startFormatted || endFormatted) && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded-md bg-white/5 text-slate-400 border border-white/10">
                          <FiCalendar className="h-3 w-3 text-slate-500" />
                          <span>
                            {startFormatted} – {endFormatted}
                          </span>
                        </span>
                      )}

                      {edu.grade && (
                        <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20 font-semibold">
                          Grade: {edu.grade}
                        </span>
                      )}
                    </div>

                    {edu.description && (
                      <p className="text-xs text-slate-400 leading-relaxed pt-1 whitespace-pre-line">
                        {edu.description}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ======================================================== */}
      {/* PROFESSIONAL CERTIFICATIONS SECTION */}
      {/* ======================================================== */}
      <section className="space-y-4 pt-4 border-t border-white/10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-white/10">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <FiAward className="text-red-500 h-5 w-5" />
              <span>Professional Certifications ({certifications.length})</span>
            </h2>
            <p className="text-xs text-slate-400">
              Manage industry certificates, accreditations, and verification credentials
            </p>
          </div>
          <button
            onClick={handleOpenNewCert}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white shadow-lg shadow-red-600/20 cursor-pointer transition-all self-start sm:self-auto"
          >
            <FiPlus className="h-4 w-4" />
            <span>Add Certification</span>
          </button>
        </div>

        {certifications.length === 0 ? (
          <div className="p-8 text-center rounded-2xl bg-[#12131c] border border-white/10 text-slate-400 text-xs">
            No certifications found. Click &quot;Add Certification&quot; to add professional certificates.
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {certifications.map((cert) => {
              const issueFormatted = formatDateDisplay(cert.issueDate);
              return (
                <div
                  key={cert._id}
                  className="p-5 rounded-2xl bg-[#12131c] border border-red-500/20 hover:border-red-500/40 transition-all flex flex-col justify-between gap-4 group"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="text-sm font-bold text-white group-hover:text-red-400 transition-colors">
                          {cert.title}
                        </h4>
                        <p className="text-xs text-slate-300">Issued by {cert.issuer}</p>
                      </div>

                      {/* Action buttons: Edit & Delete */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => handleOpenEditCert(cert)}
                          title="Edit Certification"
                          className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 transition-all cursor-pointer"
                        >
                          <FiEdit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteCert(cert._id)}
                          title="Delete Certification"
                          className="p-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 border border-rose-500/20 transition-all cursor-pointer"
                        >
                          <FiTrash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      {issueFormatted && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded-md bg-white/5 text-slate-400 border border-white/10">
                          <FiCalendar className="h-3 w-3 text-slate-500" />
                          <span>Issued: {issueFormatted}</span>
                        </span>
                      )}

                      {cert.credentialId && (
                        <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-white/5 text-slate-300 border border-white/10">
                          ID: {cert.credentialId}
                        </span>
                      )}

                      {cert.credentialUrl && (
                        <a
                          href={cert.credentialUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] text-red-400 hover:text-red-300 underline font-medium"
                        >
                          <span>Verify Credential</span>
                          <FiExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </div>

                    {cert.description && (
                      <p className="text-xs text-slate-400 leading-relaxed pt-1 whitespace-pre-line">
                        {cert.description}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ======================================================== */}
      {/* ACADEMIC DEGREE MODAL (ADD & EDIT) */}
      {/* ======================================================== */}
      {eduModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-[#12131c] border border-red-500/30 p-6 sm:p-7 rounded-3xl shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-xl bg-gradient-to-tr from-red-600 to-rose-600 flex items-center justify-center text-white text-sm font-bold shadow-md">
                  <FiBook />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">
                    {editingEdu ? 'Edit Academic Degree' : 'Add Academic Degree'}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    {editingEdu ? 'Update degree specifications & grades' : 'Enter university degree details'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setEduModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
              >
                <FiX className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdu} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">
                    School / University *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Stanford University or MIT"
                    value={eduForm.school || ''}
                    onChange={(e) => setEduForm({ ...eduForm, school: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-red-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">
                    Degree Title *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Bachelor of Technology"
                    value={eduForm.degree || ''}
                    onChange={(e) => setEduForm({ ...eduForm, degree: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-red-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">
                    Field of Study / Major *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Computer Science & Engineering"
                    value={eduForm.field || ''}
                    onChange={(e) => setEduForm({ ...eduForm, field: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-red-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">
                    Grade / CGPA (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 8.9 CGPA / First Class"
                    value={eduForm.grade || ''}
                    onChange={(e) => setEduForm({ ...eduForm, grade: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-red-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={eduForm.startDate ? String(eduForm.startDate) : ''}
                    onChange={(e) => setEduForm({ ...eduForm, startDate: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-black/40 border border-white/10 text-white focus:outline-none focus:border-red-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    disabled={isCurrentlyStudying}
                    value={eduForm.endDate ? String(eduForm.endDate) : ''}
                    onChange={(e) => setEduForm({ ...eduForm, endDate: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-black/40 border border-white/10 text-white focus:outline-none focus:border-red-500 disabled:opacity-40"
                  />
                </div>

                <div className="flex items-center pt-6">
                  <label className="inline-flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isCurrentlyStudying}
                      onChange={(e) => {
                        setIsCurrentlyStudying(e.target.checked);
                        if (e.target.checked) setEduForm({ ...eduForm, endDate: '' });
                      }}
                      className="rounded text-red-600 focus:ring-red-500 h-4 w-4 bg-black/40 border-white/10"
                    />
                    <span className="text-xs text-slate-300 font-medium">Currently Pursuing</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">
                  Description / Honors & Coursework (Optional)
                </label>
                <textarea
                  rows={3}
                  placeholder="Key coursework, honors, leadership positions, or relevant thesis..."
                  value={eduForm.description || ''}
                  onChange={(e) => setEduForm({ ...eduForm, description: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-red-500"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setEduModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-white/5 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white shadow-lg shadow-red-600/30 flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <FiCheck className="h-4 w-4" />
                  <span>{isSaving ? 'Saving...' : editingEdu ? 'Update Degree' : 'Save Degree'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* PROFESSIONAL CERTIFICATION MODAL (ADD & EDIT) */}
      {/* ======================================================== */}
      {certModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-[#12131c] border border-red-500/30 p-6 sm:p-7 rounded-3xl shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-xl bg-gradient-to-tr from-red-600 to-rose-600 flex items-center justify-center text-white text-sm font-bold shadow-md">
                  <FiAward />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">
                    {editingCert ? 'Edit Certification' : 'Add Certification'}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    {editingCert ? 'Update certificate details & verification URLs' : 'Add professional accreditation'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setCertModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
              >
                <FiX className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCert} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">
                    Certification Title *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. AWS Certified Solutions Architect"
                    value={certForm.title || ''}
                    onChange={(e) => setCertForm({ ...certForm, title: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-red-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">
                    Issuing Organization *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Amazon Web Services, Oracle, Google Cloud"
                    value={certForm.issuer || ''}
                    onChange={(e) => setCertForm({ ...certForm, issuer: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-red-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">
                    Credential ID (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. AWS-8392174"
                    value={certForm.credentialId || ''}
                    onChange={(e) => setCertForm({ ...certForm, credentialId: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-red-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">
                    Issue Date
                  </label>
                  <input
                    type="date"
                    value={certForm.issueDate ? String(certForm.issueDate) : ''}
                    onChange={(e) => setCertForm({ ...certForm, issueDate: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-black/40 border border-white/10 text-white focus:outline-none focus:border-red-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">
                    Verification URL (Optional)
                  </label>
                  <input
                    type="url"
                    placeholder="https://www.credly.com/badges/..."
                    value={certForm.credentialUrl || ''}
                    onChange={(e) => setCertForm({ ...certForm, credentialUrl: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-red-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">
                    Description (Optional)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Brief description or skills covered..."
                    value={certForm.description || ''}
                    onChange={(e) => setCertForm({ ...certForm, description: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-red-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setCertModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-white/5 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white shadow-lg shadow-red-600/30 flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <FiCheck className="h-4 w-4" />
                  <span>{isSaving ? 'Saving...' : editingCert ? 'Update Certificate' : 'Save Certificate'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
