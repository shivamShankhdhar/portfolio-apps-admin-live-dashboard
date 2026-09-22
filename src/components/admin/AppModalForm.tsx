'use client';

import React, { useState, useEffect } from 'react';
import { FiX, FiCheck, FiPlus, FiTrash2 } from 'react-icons/fi';
import { AppItem, AppFeature } from '@/lib/defaultData';
import { toast } from 'sonner';

interface AppModalFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (app: Partial<AppItem>) => Promise<void>;
  initialData?: AppItem | null;
}

export default function AppModalForm({
  isOpen,
  onClose,
  onSave,
  initialData,
}: AppModalFormProps) {
  const [formData, setFormData] = useState<Partial<AppItem>>({
    title: '',
    subtitle: '',
    tagline: '',
    category: 'Games',
    package: '',
    version: 'v1.0.0',
    status: 'Google Play Production',
    rating: '4.9',
    ratingCount: '1K+ Players',
    icon: '🎮',
    bannerType: 'default',
    playStoreUrl: '',
    playStoreStatus: 'Google Play Production',
    appStoreUrl: '',
    appStoreStatus: 'Coming Soon',
    privacyUrl: '',
    technologies: [],
    highlights: [],
    features: [],
    featured: true,
    order: 1,
  });

  const [techInput, setTechInput] = useState('');
  const [highlightsInput, setHighlightsInput] = useState('');
  const [featurePairs, setFeaturePairs] = useState<AppFeature[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
      setTechInput(initialData.technologies?.join(', ') || '');
      setHighlightsInput(initialData.highlights?.join('\n') || '');
      setFeaturePairs(initialData.features || []);
    } else {
      setFormData({
        title: '',
        subtitle: '',
        tagline: '',
        category: 'Games',
        package: '',
        version: 'v1.0.0',
        status: 'Closed Testing',
        rating: 'Coming Soon',
        ratingCount: 'Testing Phase',
        icon: '🎲',
        bannerType: 'ludo',
        playStoreUrl: '',
        playStoreStatus: 'Closed Testing Track',
        appStoreUrl: '',
        appStoreStatus: 'Coming Soon',
        privacyUrl: '',
        technologies: ['React Native', 'TypeScript'],
        highlights: [],
        features: [],
        featured: true,
        order: 1,
      });
      setTechInput('React Native, TypeScript');
      setHighlightsInput('');
      setFeaturePairs([
        { label: 'Platform', value: 'Android' },
        { label: 'Security', value: 'Zero Data Collection' },
      ]);
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleAddFeaturePair = () => {
    setFeaturePairs([...featurePairs, { label: '', value: '' }]);
  };

  const handleRemoveFeaturePair = (idx: number) => {
    setFeaturePairs(featurePairs.filter((_, i) => i !== idx));
  };

  const handleFeaturePairChange = (idx: number, field: 'label' | 'value', val: string) => {
    const updated = [...featurePairs];
    updated[idx][field] = val;
    setFeaturePairs(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.package) {
      toast.error('Title and Package Name are required.');
      return;
    }

    setIsSaving(true);
    try {
      const payload: Partial<AppItem> = {
        ...formData,
        technologies: techInput
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean),
        highlights: highlightsInput
          .split('\n')
          .map((h) => h.trim())
          .filter(Boolean),
        features: featurePairs.filter((f) => f.label.trim() && f.value.trim()),
      };

      await onSave(payload);
      toast.success(initialData ? 'App updated successfully!' : 'New app added to database!');
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Failed to save app');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="w-full max-w-2xl bg-[#12131c] border-2 border-red-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 my-8">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span>{initialData ? 'Edit App / Game' : 'Add New App or Game to Database'}</span>
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all cursor-pointer"
          >
            <FiX className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                Title *
              </label>
              <input
                type="text"
                required
                value={formData.title || ''}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g. Ludo Binge"
                className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-sm focus:outline-none focus:border-red-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                Package Name (Android ID) *
              </label>
              <input
                type="text"
                required
                value={formData.package || ''}
                onChange={(e) => setFormData({ ...formData, package: e.target.value })}
                placeholder="e.g. com.shivam.ludobinge"
                className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-sm focus:outline-none focus:border-red-500 font-mono text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                Category
              </label>
              <select
                value={formData.category || 'Games'}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#181926] border border-white/10 text-white text-sm focus:outline-none focus:border-red-500"
              >
                <option value="Games">Games</option>
                <option value="Apps">Apps</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                Lifecycle Status
              </label>
              <select
                value={formData.status || 'Google Play Production'}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#181926] border border-white/10 text-white text-sm focus:outline-none focus:border-red-500"
              >
                <option value="Google Play Production">Google Play Production</option>
                <option value="Closed Testing">Closed Testing</option>
                <option value="Coming Soon">Coming Soon</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                Banner Art Type
              </label>
              <select
                value={formData.bannerType || 'default'}
                onChange={(e) => setFormData({ ...formData, bannerType: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#181926] border border-white/10 text-white text-sm focus:outline-none focus:border-red-500"
              >
                <option value="ludo">Ludo Board & Celestial Art</option>
                <option value="chess">Chess Board & Pieces</option>
                <option value="default">Default Modern Glass</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                Icon (Emoji or URL)
              </label>
              <input
                type="text"
                value={formData.icon || ''}
                onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                placeholder="🎲 or ⚡"
                className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-sm focus:outline-none focus:border-red-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                Version
              </label>
              <input
                type="text"
                value={formData.version || ''}
                onChange={(e) => setFormData({ ...formData, version: e.target.value })}
                placeholder="v1.0.0"
                className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-sm focus:outline-none focus:border-red-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                Sort Order
              </label>
              <input
                type="number"
                value={formData.order ?? 1}
                onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-sm focus:outline-none focus:border-red-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                Rating
              </label>
              <input
                type="text"
                value={formData.rating || ''}
                onChange={(e) => setFormData({ ...formData, rating: e.target.value })}
                placeholder="4.9 or Coming Soon"
                className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-sm focus:outline-none focus:border-red-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                Rating Count / Downloads
              </label>
              <input
                type="text"
                value={formData.ratingCount || ''}
                onChange={(e) => setFormData({ ...formData, ratingCount: e.target.value })}
                placeholder="10K+ Downloads or Testing Phase"
                className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-sm focus:outline-none focus:border-red-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
              Subtitle
            </label>
            <input
              type="text"
              value={formData.subtitle || ''}
              onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
              placeholder="e.g. Classic 4-Player Strategy Board Game"
              className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-sm focus:outline-none focus:border-red-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
              Tagline (Detailed Description)
            </label>
            <textarea
              rows={2}
              value={formData.tagline || ''}
              onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
              placeholder="Brief summary of features, engine, and capabilities"
              className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-sm focus:outline-none focus:border-red-500"
            />
          </div>

          {/* Store Links & Distribution Status */}
          <div className="p-4 rounded-2xl bg-black/30 border border-white/10 space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <span className="text-xs font-mono uppercase tracking-wider text-slate-300 font-bold">
                Platform Distribution & Store Targets
              </span>
              <span className="text-[10px] font-mono text-slate-400">Admin Control</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Google Play URL */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                  Google Play Store URL
                </label>
                <input
                  type="url"
                  value={formData.playStoreUrl || ''}
                  onChange={(e) => setFormData({ ...formData, playStoreUrl: e.target.value })}
                  placeholder="https://play.google.com/store/apps/details?id=..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-sm focus:outline-none focus:border-red-500 text-xs font-mono"
                />
                <p className="text-[10px] text-slate-500 mt-1">Leave empty to show &quot;Coming Soon&quot; QR on web</p>
              </div>

              {/* Google Play Status */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                  Google Play Status
                </label>
                <select
                  value={formData.playStoreStatus || 'Google Play Production'}
                  onChange={(e) => setFormData({ ...formData, playStoreStatus: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#181926] border border-white/10 text-white text-sm focus:outline-none focus:border-red-500"
                >
                  <option value="Google Play Production">Google Play Production</option>
                  <option value="Closed Testing Track">Closed Testing Track</option>
                  <option value="Open Beta / Testing">Open Beta / Testing</option>
                  <option value="Pre-Registration">Pre-Registration</option>
                  <option value="Coming Soon">Coming Soon</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Apple App Store URL */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                  Apple App Store / TestFlight URL
                </label>
                <input
                  type="url"
                  value={formData.appStoreUrl || ''}
                  onChange={(e) => setFormData({ ...formData, appStoreUrl: e.target.value })}
                  placeholder="https://apps.apple.com/app/... or TestFlight link"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-sm focus:outline-none focus:border-red-500 text-xs font-mono"
                />
                <p className="text-[10px] text-slate-500 mt-1">Leave empty to show &quot;Coming Soon&quot; QR on web</p>
              </div>

              {/* Apple App Store Status */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                  Apple App Store Status
                </label>
                <select
                  value={formData.appStoreStatus || 'Coming Soon'}
                  onChange={(e) => setFormData({ ...formData, appStoreStatus: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#181926] border border-white/10 text-white text-sm focus:outline-none focus:border-red-500"
                >
                  <option value="Coming Soon">Coming Soon</option>
                  <option value="In Development">In Development</option>
                  <option value="TestFlight Beta">TestFlight Beta</option>
                  <option value="Live on App Store">Live on App Store</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                Privacy Policy Route
              </label>
              <input
                type="text"
                value={formData.privacyUrl || ''}
                onChange={(e) => setFormData({ ...formData, privacyUrl: e.target.value })}
                placeholder="/apps/games/ludo-binge/privacy-policy"
                className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-sm focus:outline-none focus:border-red-500 text-xs font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
              Technologies (comma separated)
            </label>
            <input
              type="text"
              value={techInput}
              onChange={(e) => setTechInput(e.target.value)}
              placeholder="Next.js, React Native, WebSockets, TypeScript"
              className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-sm focus:outline-none focus:border-red-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
              Highlights (one line per highlight)
            </label>
            <textarea
              rows={3}
              value={highlightsInput}
              onChange={(e) => setHighlightsInput(e.target.value)}
              placeholder="Real-time 60 FPS multiplayer engine&#10;Heuristic AI fallback&#10;Custom 3D dice physics"
              className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-sm focus:outline-none focus:border-red-500 font-mono text-xs"
            />
          </div>

          {/* Key-Value Features Breakdown */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-300 uppercase">
                Technical Specifications (Label &bull; Value)
              </label>
              <button
                type="button"
                onClick={handleAddFeaturePair}
                className="inline-flex items-center gap-1 text-xs text-red-400 hover:text-red-300 font-semibold cursor-pointer"
              >
                <FiPlus className="h-3.5 w-3.5" />
                <span>Add Spec</span>
              </button>
            </div>

            <div className="space-y-2">
              {featurePairs.map((pair, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={pair.label}
                    onChange={(e) => handleFeaturePairChange(idx, 'label', e.target.value)}
                    placeholder="Spec Label (e.g. Engine)"
                    className="w-1/3 px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white text-xs focus:outline-none focus:border-red-500"
                  />
                  <input
                    type="text"
                    value={pair.value}
                    onChange={(e) => handleFeaturePairChange(idx, 'value', e.target.value)}
                    placeholder="Spec Value (e.g. WebSocket 60 FPS)"
                    className="flex-1 px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white text-xs focus:outline-none focus:border-red-500"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveFeaturePair(idx)}
                    className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-all cursor-pointer"
                  >
                    <FiTrash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-2">
            <label className="inline-flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={Boolean(formData.featured)}
                onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                className="rounded text-red-600 focus:ring-red-500 h-4 w-4 bg-black/40 border-white/10"
              />
              <span className="text-xs font-semibold text-slate-300">
                Feature on Hero 3D Showcase & Frontpage Highlights
              </span>
            </label>
          </div>

          {/* Modal Actions */}
          <div className="pt-4 border-t border-white/10 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-white/5 transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white shadow-lg shadow-red-600/30 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isSaving ? (
                <span>Saving to DB...</span>
              ) : (
                <>
                  <FiCheck className="h-4 w-4" />
                  <span>{initialData ? 'Update Record' : 'Create Record'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
