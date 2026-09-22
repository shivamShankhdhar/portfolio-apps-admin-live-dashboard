'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  FiShield,
  FiActivity,
  FiMonitor,
  FiMapPin,
  FiClock,
  FiMail,
  FiMessageSquare,
  FiAlertTriangle,
  FiCheckCircle,
  FiLock,
  FiUser,
  FiRefreshCw,
  FiExternalLink,
  FiKey,
  FiSettings,
} from 'react-icons/fi';
import {
  Smartphone,
  LayoutGrid,
  Code2,
  Briefcase,
  GraduationCap,
  Gamepad2,
} from 'lucide-react';
import { FaFingerprint } from 'react-icons/fa6';

interface DashboardProps {
  adminEmail: string;
  apps: any[];
  projects: any[];
  skills: any[];
  experience: any[];
  education: any[];
  messages: any[];
  twoFactorEnabled: boolean;
  twoFactorMethod?: string;
  dbConnected: boolean;
  onNavigate: (tab: string) => void;
  onOpenSettings: () => void;
}

interface LoginActivity {
  lastLogin: string | null;
  lastLoginIp: string | null;
  lastLoginDevice: string | null;
  lastLoginLocation: string | null;
  passkeys: { credentialId: string; deviceName: string; createdAt: string }[];
  totpVerified: boolean;
}

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return 'Never';
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function formatDateTime(dateStr: string | null): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Kolkata',
  });
}

export default function DashboardManager({
  adminEmail,
  apps,
  projects,
  skills,
  experience,
  education,
  messages,
  twoFactorEnabled,
  twoFactorMethod,
  dbConnected,
  onNavigate,
  onOpenSettings,
}: DashboardProps) {
  const [activity, setActivity] = useState<LoginActivity | null>(null);
  const [loadingActivity, setLoadingActivity] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchActivity = useCallback(async () => {
    try {
      setLoadingActivity(true);
      const token = localStorage.getItem('adminToken');
      if (!token) return;
      const [twoFaRes, authRes] = await Promise.all([
        fetch('/api/auth/2fa', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/auth', { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      const twoFaData = twoFaRes.ok ? await twoFaRes.json() : {};
      const authData = authRes.ok ? await authRes.json() : {};
      setActivity({
        lastLogin: authData.adminDetails?.lastLogin || null,
        lastLoginIp: authData.adminDetails?.lastLoginIp || null,
        lastLoginDevice: authData.adminDetails?.lastLoginDevice || null,
        lastLoginLocation: authData.adminDetails?.lastLoginLocation || null,
        passkeys: twoFaData.passkeys || [],
        totpVerified: Boolean(twoFaData.totpVerified),
      });
    } catch (e) {
      console.error('[Dashboard] Failed to fetch activity:', e);
    } finally {
      setLoadingActivity(false);
    }
  }, []);

  useEffect(() => { fetchActivity(); }, [fetchActivity]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchActivity();
    setRefreshing(false);
  };

  const appsCount = apps.filter((a) => (a.category || '').toLowerCase() !== 'games').length;
  const gamesCount = apps.filter((a) => (a.category || '').toLowerCase() === 'games').length;
  const unreadMessages = messages.filter((m) => !m.read).length;

  const stats = [
    { label: 'Applications', value: appsCount, Icon: Smartphone, color: 'text-emerald-400', border: 'border-emerald-500/30', bg: 'from-emerald-600/15 to-emerald-600/5', tab: 'apps' },
    { label: 'Games', value: gamesCount, Icon: Gamepad2, color: 'text-red-400', border: 'border-red-500/30', bg: 'from-red-600/15 to-red-600/5', tab: 'games' },
    { label: 'Projects', value: projects.length, Icon: LayoutGrid, color: 'text-blue-400', border: 'border-blue-500/30', bg: 'from-blue-600/15 to-blue-600/5', tab: 'projects' },
    { label: 'Messages', value: messages.length, badge: unreadMessages > 0 ? unreadMessages : null, Icon: FiMail, color: 'text-amber-400', border: 'border-amber-500/30', bg: 'from-amber-600/15 to-amber-600/5', tab: 'messages' },
    { label: 'Skills', value: skills.length, Icon: Code2, color: 'text-violet-400', border: 'border-violet-500/30', bg: 'from-violet-600/15 to-violet-600/5', tab: 'skills' },
    { label: 'Experience', value: experience.length, Icon: Briefcase, color: 'text-cyan-400', border: 'border-cyan-500/30', bg: 'from-cyan-600/15 to-cyan-600/5', tab: 'experience' },
    { label: 'Education', value: education.length, Icon: GraduationCap, color: 'text-pink-400', border: 'border-pink-500/30', bg: 'from-pink-600/15 to-pink-600/5', tab: 'education' },
  ];

  const securityScore = (() => {
    let s = 0;
    if (twoFactorEnabled) s += 40;
    if (activity?.totpVerified) s += 30;
    if ((activity?.passkeys?.length ?? 0) > 0) s += 20;
    if (dbConnected) s += 10;
    return s;
  })();

  const scoreColor = securityScore >= 80 ? 'text-emerald-400' : securityScore >= 50 ? 'text-amber-400' : 'text-red-400';
  const scoreLabel = securityScore >= 80 ? 'Excellent' : securityScore >= 50 ? 'Good' : 'Needs Attention';
  const scoreStroke = securityScore >= 80 ? '#10b981' : securityScore >= 50 ? '#f59e0b' : '#ef4444';

  const displayName = adminEmail
    .split('@')[0]
    .split(/[._-]/)
    .map((s: string) => s.charAt(0).toUpperCase() + s.slice(1))
    .join(' ');

  return (
    <div className="space-y-7 pb-8">

      {/* Welcome Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#12131c] via-[#16172a] to-[#0f1020] border border-red-500/20 p-7 shadow-2xl">
        <div className="absolute top-0 right-0 w-72 h-72 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-rose-600/5 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-red-600 to-rose-700 flex items-center justify-center text-white text-xl font-bold shadow-lg shadow-red-600/30 shrink-0">
              {adminEmail?.[0]?.toUpperCase() ?? 'A'}
            </div>
            <div>
              <p className="text-[10px] font-mono text-red-400 uppercase tracking-widest mb-0.5">⚡ Super Administrator</p>
              <h1 className="text-xl font-extrabold text-white tracking-tight">Welcome back, {displayName}</h1>
              <p className="text-xs text-slate-400 mt-0.5 font-mono">{adminEmail}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border ${dbConnected ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-red-500/10 text-red-400 border-red-500/30'}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${dbConnected ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`} />
              {dbConnected ? 'DB Online' : 'DB Offline'}
            </span>
            <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border ${twoFactorEnabled ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-amber-500/10 text-amber-400 border-amber-500/30'}`}>
              <FiShield className="h-3 w-3" />
              {twoFactorEnabled ? '2FA Active' : '2FA Off'}
            </span>
            <button onClick={handleRefresh} disabled={refreshing} className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-400 hover:text-white transition-all cursor-pointer" title="Refresh">
              <FiRefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {activity?.lastLogin && (
          <div className="relative z-10 mt-5 pt-4 border-t border-white/8 flex flex-wrap items-center gap-x-5 gap-y-1 text-[11px] text-slate-400 font-mono">
            <span className="flex items-center gap-1.5"><FiClock className="h-3 w-3 text-slate-500" />Last sign-in: <span className="text-slate-200">{formatDateTime(activity.lastLogin)}</span> <span className="text-slate-500">({timeAgo(activity.lastLogin)})</span></span>
            {activity.lastLoginIp && <span className="flex items-center gap-1.5"><FiMonitor className="h-3 w-3 text-slate-500" /><span className="text-slate-300">{activity.lastLoginIp}</span></span>}
            {activity.lastLoginLocation && <span className="flex items-center gap-1.5"><FiMapPin className="h-3 w-3 text-slate-500" /><span className="text-slate-300">{activity.lastLoginLocation}</span></span>}
          </div>
        )}
      </div>

      {/* Stats Grid */}
      <div>
        <p className="text-[10px] font-mono uppercase tracking-widest text-slate-500 mb-3 px-1">Content Overview</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          {stats.map((s) => (
            <button key={s.label} onClick={() => onNavigate(s.tab)} className={`group relative p-4 rounded-2xl bg-gradient-to-b ${s.bg} border ${s.border} text-left hover:scale-105 hover:shadow-lg transition-all cursor-pointer space-y-2.5 overflow-hidden`}>
              <div className="flex items-center justify-between">
                <s.Icon className={`h-4 w-4 ${s.color}`} />
                {'badge' in s && s.badge && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-500 text-black">{s.badge}</span>}
              </div>
              <div>
                <p className={`text-2xl font-extrabold ${s.color}`}>{s.value}</p>
                <p className="text-[10px] text-slate-400 font-semibold">{s.label}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Login Activity + Security */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Login Activity */}
        <div className="rounded-3xl bg-[#12131c] border border-white/10 overflow-hidden">
          <div className="px-6 py-4 border-b border-white/8 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center">
                <FiActivity className="h-4 w-4 text-blue-400" />
              </div>
              <div>
                <p className="text-sm font-bold text-white">Login Activity</p>
                <p className="text-[10px] text-slate-500 font-mono">Latest sign-in metadata</p>
              </div>
            </div>
            {loadingActivity && <div className="h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />}
          </div>
          <div className="p-6 space-y-4">
            {loadingActivity ? (
              <div className="space-y-3">
                {[90, 70, 55, 80].map((w, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-xl bg-white/8 animate-pulse shrink-0" />
                    <div className="space-y-1.5 flex-1">
                      <div className="h-2.5 bg-white/8 animate-pulse rounded-lg" style={{ width: `${w}%` }} />
                      <div className="h-2 bg-white/5 animate-pulse rounded-lg w-1/3" />
                    </div>
                  </div>
                ))}
              </div>
            ) : activity ? (
              <div className="space-y-3">
                {[
                  { icon: FiClock, label: 'Last Sign-In', value: formatDateTime(activity.lastLogin), sub: timeAgo(activity.lastLogin), color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
                  { icon: FiMonitor, label: 'IP Address', value: activity.lastLoginIp || 'Unknown', sub: 'Originating network address', color: 'text-cyan-400', bg: 'bg-cyan-500/10 border-cyan-500/20' },
                  { icon: FiActivity, label: 'Device & Browser', value: activity.lastLoginDevice || 'Unknown', sub: 'User agent string', color: 'text-violet-400', bg: 'bg-violet-500/10 border-violet-500/20' },
                  { icon: FiMapPin, label: 'Location', value: activity.lastLoginLocation || 'Unknown', sub: 'Approximate geo-location', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
                ].map((row, i) => {
                  const Icon = row.icon;
                  return (
                    <div key={i} className="flex items-start gap-3">
                      <div className={`h-8 w-8 rounded-xl border flex items-center justify-center shrink-0 ${row.bg}`}>
                        <Icon className={`h-3.5 w-3.5 ${row.color}`} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] font-mono uppercase tracking-wider text-slate-500">{row.label}</p>
                        <p className="text-xs font-semibold text-white truncate mt-0.5">{row.value}</p>
                        <p className="text-[10px] text-slate-600 mt-0.5">{row.sub}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-slate-500 font-mono text-center py-4">No login data available. Sign out and back in to record activity.</p>
            )}
          </div>
        </div>

        {/* Security Score */}
        <div className="rounded-3xl bg-[#12131c] border border-white/10 overflow-hidden">
          <div className="px-6 py-4 border-b border-white/8 flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-xl bg-red-500/15 border border-red-500/30 flex items-center justify-center">
              <FiShield className="h-4 w-4 text-red-400" />
            </div>
            <div>
              <p className="text-sm font-bold text-white">Security Score</p>
              <p className="text-[10px] text-slate-500 font-mono">Admin account protection level</p>
            </div>
          </div>
          <div className="p-6 space-y-5">
            <div className="flex items-center gap-5">
              <div className="relative h-20 w-20 shrink-0">
                <svg className="h-20 w-20 -rotate-90" viewBox="0 0 36 36">
                  <circle cx="18" cy="18" r="15.9" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="3" />
                  <circle cx="18" cy="18" r="15.9" fill="none" stroke={scoreStroke} strokeWidth="3" strokeDasharray={`${securityScore} ${100 - securityScore}`} strokeLinecap="round" />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className={`text-lg font-extrabold ${scoreColor}`}>{securityScore}</span>
                  <span className="text-[9px] text-slate-500 font-mono">/100</span>
                </div>
              </div>
              <div>
                <p className={`text-sm font-bold ${scoreColor}`}>{scoreLabel}</p>
                <p className="text-[11px] text-slate-400 mt-1 leading-relaxed max-w-[220px]">
                  {securityScore >= 80 ? 'Your account has multiple active security layers.' : securityScore >= 50 ? 'Enable all security features for full protection.' : 'Enable 2FA and register a biometric device.'}
                </p>
              </div>
            </div>
            <div className="space-y-2.5">
              {[
                { ok: twoFactorEnabled, label: '2FA Enforcement Active', desc: twoFactorEnabled ? `Method: ${(twoFactorMethod || 'totp').toUpperCase()}` : 'Enable from Settings → Security', icon: FiShield },
                { ok: activity?.totpVerified ?? false, label: 'Authenticator App Linked', desc: activity?.totpVerified ? 'TOTP configured & verified' : 'Set up Google Authenticator', icon: FiKey },
                { ok: (activity?.passkeys?.length ?? 0) > 0, label: 'Biometric Passkey Registered', desc: (activity?.passkeys?.length ?? 0) > 0 ? `${activity?.passkeys?.length} device(s) registered` : 'Register Touch ID / Face ID', icon: FaFingerprint },
                { ok: dbConnected, label: 'Database Connection', desc: dbConnected ? 'MongoDB connected & healthy' : 'Database is offline', icon: FiActivity },
              ].map((item, i) => {
                const Icon = item.icon as any;
                return (
                  <div key={i} className="flex items-center gap-3">
                    <div className={`h-7 w-7 rounded-lg flex items-center justify-center shrink-0 border ${item.ok ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-slate-800/80 border-white/8'}`}>
                      {item.ok ? <FiCheckCircle className="h-3.5 w-3.5 text-emerald-400" /> : <FiAlertTriangle className="h-3.5 w-3.5 text-slate-500" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className={`text-xs font-semibold ${item.ok ? 'text-white' : 'text-slate-400'}`}>{item.label}</p>
                      <p className="text-[10px] text-slate-500 font-mono truncate">{item.desc}</p>
                    </div>
                    {!item.ok && <button onClick={onOpenSettings} className="text-[10px] text-red-400 hover:text-red-300 font-bold shrink-0 cursor-pointer">Fix →</button>}
                  </div>
                );
              })}
            </div>
            <button onClick={onOpenSettings} className="w-full py-2.5 rounded-xl text-xs font-bold bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white transition-all flex items-center justify-center gap-2 cursor-pointer">
              <FiSettings className="h-3.5 w-3.5" /> Open Security Settings
            </button>
          </div>
        </div>
      </div>

      {/* Recent Messages + Biometric Devices */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Recent Messages */}
        <div className="rounded-3xl bg-[#12131c] border border-white/10 overflow-hidden">
          <div className="px-6 py-4 border-b border-white/8 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center">
                <FiMessageSquare className="h-4 w-4 text-amber-400" />
              </div>
              <div>
                <p className="text-sm font-bold text-white">Recent Messages</p>
                <p className="text-[10px] text-slate-500 font-mono">{unreadMessages > 0 ? `${unreadMessages} unread` : 'All caught up'}</p>
              </div>
            </div>
            <button onClick={() => onNavigate('messages')} className="text-[11px] text-slate-400 hover:text-white font-semibold flex items-center gap-1 cursor-pointer transition-colors">
              View all <FiExternalLink className="h-3 w-3" />
            </button>
          </div>
          <div className="divide-y divide-white/5">
            {messages.length === 0 ? (
              <div className="px-6 py-8 text-center text-xs text-slate-500 font-mono">No messages yet.</div>
            ) : (
              messages.slice(0, 5).map((msg: any, i: number) => (
                <button key={msg._id || i} onClick={() => onNavigate('messages')} className="w-full px-6 py-3.5 flex items-start gap-3 hover:bg-white/3 transition-colors cursor-pointer text-left">
                  <div className={`h-8 w-8 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold ${!msg.read ? 'bg-amber-500/20 border border-amber-500/30 text-amber-400' : 'bg-white/5 border border-white/10 text-slate-400'}`}>
                    {(msg.name?.[0] ?? msg.email?.[0] ?? '?').toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-semibold text-white truncate">{msg.name || msg.email || 'Anonymous'}</p>
                      {!msg.read && <span className="h-1.5 w-1.5 rounded-full bg-amber-400 shrink-0" />}
                    </div>
                    <p className="text-[11px] text-slate-400 truncate mt-0.5">{msg.subject || (msg.message || '').slice(0, 60) || 'No subject'}</p>
                    <p className="text-[10px] text-slate-600 mt-0.5 font-mono">{timeAgo(msg.createdAt || msg.timestamp)}</p>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Biometric Devices */}
        <div className="rounded-3xl bg-[#12131c] border border-white/10 overflow-hidden">
          <div className="px-6 py-4 border-b border-white/8 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-xl bg-violet-500/15 border border-violet-500/30 flex items-center justify-center">
                <FaFingerprint className="h-4 w-4 text-violet-400" />
              </div>
              <div>
                <p className="text-sm font-bold text-white">Biometric Devices</p>
                <p className="text-[10px] text-slate-500 font-mono">Registered passkeys & Touch ID</p>
              </div>
            </div>
            <button onClick={onOpenSettings} className="text-[11px] text-slate-400 hover:text-white font-semibold flex items-center gap-1 cursor-pointer transition-colors">
              Manage <FiExternalLink className="h-3 w-3" />
            </button>
          </div>
          <div className="p-6 space-y-3">
            {loadingActivity ? (
              [1, 2].map((i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-xl bg-white/8 animate-pulse shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3 w-40 bg-white/8 animate-pulse rounded-lg" />
                    <div className="h-2 w-24 bg-white/5 animate-pulse rounded-lg" />
                  </div>
                </div>
              ))
            ) : (activity?.passkeys?.length ?? 0) === 0 ? (
              <div className="py-6 text-center space-y-3">
                <FaFingerprint className="h-8 w-8 text-slate-700 mx-auto" />
                <p className="text-xs text-slate-500 font-mono">No biometric devices registered yet.</p>
                <button onClick={onOpenSettings} className="px-4 py-2 rounded-xl text-xs font-bold bg-red-600/20 hover:bg-red-600/30 border border-red-500/30 text-red-400 transition-all cursor-pointer">
                  Register Touch ID / Passkey
                </button>
              </div>
            ) : (
              <>
                {activity!.passkeys!.map((pk) => (
                  <div key={pk.credentialId} className="flex items-center gap-3 p-3 rounded-2xl bg-black/30 border border-white/8">
                    <div className="h-9 w-9 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center shrink-0">
                      <FaFingerprint className="h-4 w-4 text-violet-400" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-white truncate">{pk.deviceName}</p>
                      <p className="text-[10px] text-slate-500 font-mono">Registered {new Date(pk.createdAt).toLocaleDateString('en-IN')}</p>
                    </div>
                    <FiCheckCircle className="h-4 w-4 text-emerald-400 shrink-0" />
                  </div>
                ))}
                <p className="text-[10px] text-slate-600 font-mono text-center pt-1">{activity!.passkeys!.length}/3 slots used</p>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <p className="text-[10px] font-mono uppercase tracking-widest text-slate-500 mb-3 px-1">Quick Actions</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Add Application', Icon: Smartphone, tab: 'apps', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20 hover:border-emerald-400/50' },
            { label: 'Add Project', Icon: LayoutGrid, tab: 'projects', color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20 hover:border-blue-400/50' },
            { label: 'Edit Profile', Icon: FiUser, tab: 'profile', color: 'text-violet-400', bg: 'bg-violet-500/10 border-violet-500/20 hover:border-violet-400/50' },
            { label: 'View Messages', Icon: FiMail, tab: 'messages', color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20 hover:border-amber-400/50' },
            { label: 'Manage Skills', Icon: Code2, tab: 'skills', color: 'text-pink-400', bg: 'bg-pink-500/10 border-pink-500/20 hover:border-pink-400/50' },
            { label: 'Add Experience', Icon: Briefcase, tab: 'experience', color: 'text-cyan-400', bg: 'bg-cyan-500/10 border-cyan-500/20 hover:border-cyan-400/50' },
            { label: 'Security Settings', Icon: FiLock, tab: '__settings__', color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20 hover:border-red-400/50' },
            { label: 'Add Game', Icon: Gamepad2, tab: 'games', color: 'text-rose-400', bg: 'bg-rose-500/10 border-rose-500/20 hover:border-rose-400/50' },
          ].map((action, i) => {
            const Icon = action.Icon as any;
            return (
              <button key={i} onClick={() => action.tab === '__settings__' ? onOpenSettings() : onNavigate(action.tab)} className={`group flex items-center gap-3 p-4 rounded-2xl border transition-all cursor-pointer hover:scale-105 hover:shadow-md ${action.bg}`}>
                <Icon className={`h-5 w-5 ${action.color} shrink-0`} />
                <span className="text-xs font-semibold text-slate-300 group-hover:text-white transition-colors">{action.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
