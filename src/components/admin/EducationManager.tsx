'use client';

import React, { useState } from 'react';
import { FiPlus, FiTrash2, FiBook, FiAward } from 'react-icons/fi';
import { toast } from 'sonner';

export default function EducationManager({
  education,
  certifications,
  onReload,
}: {
  education: any[];
  certifications: any[];
  onReload: () => void;
}) {
  const [eduModalOpen, setEduModalOpen] = useState(false);
  const [certModalOpen, setCertModalOpen] = useState(false);

  const [eduForm, setEduForm] = useState<any>({ school: '', degree: '', field: '', grade: '' });
  const [certForm, setCertForm] = useState<any>({ title: '', issuer: '', credentialUrl: '' });

  const handleCreateEdu = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/education', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...eduForm, startDate: new Date() }),
      });
      if (!res.ok) throw new Error('Failed');
      toast.success('Education record added');
      setEduModalOpen(false);
      onReload();
    } catch {
      toast.error('Failed to save education');
    }
  };

  const handleCreateCert = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/certifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...certForm, issueDate: new Date() }),
      });
      if (!res.ok) throw new Error('Failed');
      toast.success('Certification added');
      setCertModalOpen(false);
      onReload();
    } catch {
      toast.error('Failed to save certification');
    }
  };

  const handleDeleteEdu = async (id: string) => {
    if (!confirm('Delete education record?')) return;
    await fetch(`/api/education/${id}`, { method: 'DELETE' });
    toast.success('Deleted');
    onReload();
  };

  const handleDeleteCert = async (id: string) => {
    if (!confirm('Delete certification?')) return;
    await fetch(`/api/certifications/${id}`, { method: 'DELETE' });
    toast.success('Deleted');
    onReload();
  };

  return (
    <div className="space-y-8">
      {/* Education */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <FiBook className="text-red-500" />
            <span>Academic Degrees ({education.length})</span>
          </h2>
          <button
            onClick={() => setEduModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-500 text-white shadow-lg cursor-pointer"
          >
            <FiPlus className="h-4 w-4" />
            <span>Add Degree</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {education.map((edu) => (
            <div key={edu._id} className="p-5 rounded-2xl bg-[#12131c] border border-red-500/20 flex justify-between items-start">
              <div>
                <h4 className="text-sm font-bold text-white">{edu.degree} in {edu.field}</h4>
                <p className="text-xs text-slate-400">{edu.school}</p>
                {edu.grade && <span className="text-[11px] text-amber-400">Grade: {edu.grade}</span>}
              </div>
              <button onClick={() => handleDeleteEdu(edu._id)} className="p-1.5 text-rose-400 hover:text-rose-300">
                <FiTrash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Certifications */}
      <div className="space-y-4 pt-4 border-t border-white/10">
        <div className="flex justify-between items-center">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <FiAward className="text-red-500" />
            <span>Professional Certifications ({certifications.length})</span>
          </h2>
          <button
            onClick={() => setCertModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-500 text-white shadow-lg cursor-pointer"
          >
            <FiPlus className="h-4 w-4" />
            <span>Add Certification</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {certifications.map((cert) => (
            <div key={cert._id} className="p-5 rounded-2xl bg-[#12131c] border border-red-500/20 flex justify-between items-start">
              <div>
                <h4 className="text-sm font-bold text-white">{cert.title}</h4>
                <p className="text-xs text-slate-400">Issued by {cert.issuer}</p>
                {cert.credentialUrl && (
                  <a href={cert.credentialUrl} target="_blank" rel="noopener noreferrer" className="text-[11px] text-red-400 underline">
                    Verify Credential
                  </a>
                )}
              </div>
              <button onClick={() => handleDeleteCert(cert._id)} className="p-1.5 text-rose-400 hover:text-rose-300">
                <FiTrash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Modals */}
      {eduModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
          <div className="w-full max-w-md bg-[#12131c] border border-red-500/30 p-6 rounded-3xl space-y-4">
            <h3 className="text-sm font-bold text-white">Add Education Record</h3>
            <form onSubmit={handleCreateEdu} className="space-y-3 text-xs">
              <input
                type="text"
                required
                placeholder="School / University"
                value={eduForm.school}
                onChange={(e) => setEduForm({ ...eduForm, school: e.target.value })}
                className="w-full p-2.5 rounded-xl bg-black/40 border border-white/10 text-white"
              />
              <input
                type="text"
                required
                placeholder="Degree (e.g. Bachelor of Technology)"
                value={eduForm.degree}
                onChange={(e) => setEduForm({ ...eduForm, degree: e.target.value })}
                className="w-full p-2.5 rounded-xl bg-black/40 border border-white/10 text-white"
              />
              <input
                type="text"
                required
                placeholder="Field of Study (e.g. Computer Science)"
                value={eduForm.field}
                onChange={(e) => setEduForm({ ...eduForm, field: e.target.value })}
                className="w-full p-2.5 rounded-xl bg-black/40 border border-white/10 text-white"
              />
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setEduModalOpen(false)} className="px-3 py-1.5 text-slate-400">Cancel</button>
                <button type="submit" className="px-4 py-1.5 bg-red-600 font-bold text-white rounded-xl">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {certModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
          <div className="w-full max-w-md bg-[#12131c] border border-red-500/30 p-6 rounded-3xl space-y-4">
            <h3 className="text-sm font-bold text-white">Add Certification</h3>
            <form onSubmit={handleCreateCert} className="space-y-3 text-xs">
              <input
                type="text"
                required
                placeholder="Certification Title (e.g. AWS Certified Developer)"
                value={certForm.title}
                onChange={(e) => setCertForm({ ...certForm, title: e.target.value })}
                className="w-full p-2.5 rounded-xl bg-black/40 border border-white/10 text-white"
              />
              <input
                type="text"
                required
                placeholder="Issuer (e.g. Amazon Web Services)"
                value={certForm.issuer}
                onChange={(e) => setCertForm({ ...certForm, issuer: e.target.value })}
                className="w-full p-2.5 rounded-xl bg-black/40 border border-white/10 text-white"
              />
              <input
                type="url"
                placeholder="Verification URL (optional)"
                value={certForm.credentialUrl}
                onChange={(e) => setCertForm({ ...certForm, credentialUrl: e.target.value })}
                className="w-full p-2.5 rounded-xl bg-black/40 border border-white/10 text-white"
              />
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setCertModalOpen(false)} className="px-3 py-1.5 text-slate-400">Cancel</button>
                <button type="submit" className="px-4 py-1.5 bg-red-600 font-bold text-white rounded-xl">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
