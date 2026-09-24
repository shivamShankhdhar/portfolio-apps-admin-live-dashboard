'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  FiShield,
  FiArrowLeft,
  FiCheck,
  FiCopy,
  FiSmartphone,
  FiCheckCircle,
  FiAlertCircle,
  FiTrash2,
  FiKey,
  FiLock,
  FiEye,
  FiEyeOff,
  FiRefreshCw,
  FiDatabase,
  FiSettings,
  FiUser,
  FiMail,
  FiClock,
  FiCpu,
  FiCheckSquare,
  FiActivity,
  FiLogOut,
  FiGlobe,
  FiMapPin,
  FiMonitor,
} from 'react-icons/fi';
import { FaFingerprint } from 'react-icons/fa6';
import { toast } from 'sonner';
import CoreSidebar from '@/components/admin/CoreSidebar';
import { AdminTab } from '@/components/admin/Sidebar';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import ConfirmDialog from '@/components/admin/ConfirmDialog';
import { useAuthSession, useChangePassword } from '@/hooks/useAuthSession';
import {
  useTwoFactorStatus,
  useToggle2FA,
  useGenerateTotp,
  useVerifyTotp,
  useDisableTotp,
  useRegisterPasskey,
  useDeletePasskey,
  detectDeviceName,
} from '@/hooks/useTwoFactor';
import { useApps } from '@/hooks/useApps';
import { useProjects } from '@/hooks/useProjects';
import { useMessages } from '@/hooks/useMessages';
import { useProfile } from '@/hooks/useProfile';

export default function SettingsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'profile' | '2fa' | 'privacy' | 'system'>('profile');
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // TanStack Query Hooks
  const { data: authData, isLoading: isAuthLoading, isFetching: isAuthFetching } = useAuthSession();
  const { data: twoFactorData } = useTwoFactorStatus();
  const { data: apps = [] } = useApps();
  const { data: projects = [] } = useProjects();
  const { data: messages = [] } = useMessages();
  const { data: profile } = useProfile();

  // Mutations
  const changePasswordMutation = useChangePassword();
  const toggle2FAMutation = useToggle2FA();
  const generateTotpMutation = useGenerateTotp();
  const verifyTotpMutation = useVerifyTotp();
  const disableTotpMutation = useDisableTotp();
  const registerPasskeyMutation = useRegisterPasskey();
  const deletePasskeyMutation = useDeletePasskey();

  // Password Change Form State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // TOTP Setup State
  const [totpSecret, setTotpSecret] = useState('');
  const [totpQrCode, setTotpQrCode] = useState('');
  const [testCode, setTestCode] = useState('');
  const [copiedSecret, setCopiedSecret] = useState(false);
  const [showDisableTotpConfirm, setShowDisableTotpConfirm] = useState(false);

  // Passkey Setup State
  const [showPasskeyModal, setShowPasskeyModal] = useState(false);
  const [detectedDevice, setDetectedDevice] = useState('');
  const [deletingPasskeyId, setDeletingPasskeyId] = useState<string | null>(null);

  // Derived state from queries
  const adminEmail =
    authData?.email ||
    (typeof window !== 'undefined' ? localStorage.getItem('adminEmail') : '') ||
    's.shankhdhar1981@gmail.com';
  const dbConnected = Boolean(authData?.dbConnected);
  const adminDetails = authData?.adminDetails || null;

  const twoFactorEnabled = Boolean(twoFactorData?.twoFactorEnabled);
  const twoFactorMethod = twoFactorData?.twoFactorMethod || 'totp';
  const totpVerified = Boolean(twoFactorData?.totpVerified);
  const passkeys = twoFactorData?.passkeys || [];

  const appsCount = apps.filter((a: any) => (a.category || '').toLowerCase() !== 'games').length;
  const gamesCount = apps.filter((a: any) => (a.category || '').toLowerCase() === 'games').length;
  const projectsCount = projects.length;
  const messagesCount = messages.length;

  const isChangingPassword = changePasswordMutation.isPending;
  const isGeneratingTotp = generateTotpMutation.isPending;
  const isRegisteringPasskey = registerPasskeyMutation.isPending;
  const isDeletingPasskey = deletePasskeyMutation.isPending;
  const isDisablingTotp = disableTotpMutation.isPending;
  const loading = toggle2FAMutation.isPending || verifyTotpMutation.isPending;

  // Verify Session Token
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const token = localStorage.getItem('adminToken');
    if (!token) {
      router.replace('/login');
    }
  }, [router]);

  useEffect(() => {
    if (isAuthLoading || isAuthFetching) return;
    if (authData && !authData.authenticated) {
      localStorage.removeItem('adminToken');
      if (authData.sessionTerminated) {
        toast.error('Session expired: Another administrator session was started.');
      }
      router.replace('/login');
    }
  }, [authData, isAuthLoading, isAuthFetching, router]);

  // 1. Change Password Handler
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentPassword) {
      toast.error('Please enter your current administrator password');
      return;
    }

    if (!newPassword || newPassword.length < 8) {
      toast.error('New password must be at least 8 characters long');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('New password and confirmation do not match');
      return;
    }

    try {
      await changePasswordMutation.mutateAsync({ currentPassword, newPassword });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch {
      // Error handled by mutation
    }
  };

  // 2. Master Toggle 2FA
  const handleToggle2FA = async (enable: boolean) => {
    try {
      await toggle2FAMutation.mutateAsync(enable);
    } catch {
      // Error handled by mutation
    }
  };

  // 3. Generate TOTP Secret & QR Code
  const handleGenerateTotp = async () => {
    try {
      const data = await generateTotpMutation.mutateAsync();
      setTotpSecret(data.secret);
      setTotpQrCode(data.qrCode);
      setTestCode('');
    } catch {
      // Error handled by mutation
    }
  };

  // 4. Verify & Activate TOTP
  const handleVerifyTotp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testCode || testCode.trim().length !== 6) {
      toast.error('Please enter the 6-digit code from your Authenticator app');
      return;
    }

    try {
      await verifyTotpMutation.mutateAsync({
        code: testCode,
        secret: totpSecret,
      });
      setTotpQrCode('');
      setTotpSecret('');
      setTestCode('');
    } catch {
      // Error handled by mutation
    }
  };

  // 5. Register Passkey / Biometrics via WebAuthn
  const handleRegisterPasskey = async () => {
    try {
      await registerPasskeyMutation.mutateAsync(detectedDevice || detectDeviceName());
      setShowPasskeyModal(false);
      setDetectedDevice('');
    } catch {
      // Error handled by mutation
    }
  };

  // 6. Delete Passkey
  const handleDeletePasskey = async () => {
    if (!deletingPasskeyId) return;
    try {
      await deletePasskeyMutation.mutateAsync(deletingPasskeyId);
      setDeletingPasskeyId(null);
    } catch {
      // Error handled by mutation
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminEmail');
    toast.info('Signed out from Admin Hub');
    router.replace('/login');
  };

  // Disable / Remove TOTP
  const handleDisableTotp = async () => {
    try {
      await disableTotpMutation.mutateAsync();
      setTotpSecret('');
      setTotpQrCode('');
      setShowDisableTotpConfirm(false);
    } catch {
      // Error handled by mutation
    }
  };

  // Password strength calculation helper
  const calculatePasswordStrength = (pass: string) => {
    if (!pass) return { score: 0, text: 'Empty', color: 'bg-slate-700' };
    let score = 0;
    if (pass.length >= 8) score += 1;
    if (pass.length >= 12) score += 1;
    if (/[A-Z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;

    if (score <= 2) return { score: 1, text: 'Weak', color: 'bg-rose-500' };
    if (score <= 4) return { score: 2, text: 'Medium', color: 'bg-amber-500' };
    return { score: 3, text: 'Strong', color: 'bg-emerald-500' };
  };

  const strength = calculatePasswordStrength(newPassword);

  // Validation Gate — show skeleton layout instead of black screen
  if (isAuthLoading || !authData?.authenticated) {
    return (
      <div className="h-screen w-screen max-w-full bg-[#0c0d14] flex flex-col lg:flex-row overflow-hidden animate-pulse">
        {/* Skeleton Sidebar */}
        <div className="w-full lg:w-72 p-6 border-b lg:border-b-0 lg:border-r border-white/10 space-y-6 bg-[#0c0d14]">
          <div className="h-10 w-10 rounded-2xl bg-white/10" />
          <div className="space-y-3">
            <div className="h-10 rounded-xl bg-white/10" />
            <div className="h-8 rounded-xl bg-white/5 w-3/4" />
            <div className="h-8 rounded-xl bg-white/5 w-2/3" />
            <div className="h-8 rounded-xl bg-white/5 w-4/5" />
          </div>
        </div>

        {/* Skeleton Settings Content */}
        <div className="flex-1 flex flex-col min-w-0 bg-[#07080D] overflow-y-auto">
          {/* Header */}
          <div className="px-8 py-6 border-b border-white/10 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-white/10" />
              <div className="space-y-2">
                <div className="h-6 w-48 rounded-xl bg-white/10" />
                <div className="h-3 w-64 rounded-lg bg-white/10" />
              </div>
            </div>
            <div className="h-7 w-28 rounded-full bg-white/10" />
          </div>

          {/* Settings body */}
          <div className="flex-1 p-8 space-y-6 max-w-4xl mx-auto w-full">
            {/* Tabs */}
            <div className="flex gap-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-9 rounded-xl bg-white/10" style={{ width: `${80 + i * 20}px` }} />
              ))}
            </div>
            {/* Profile card */}
            <div className="p-6 rounded-3xl bg-[#12131c] border border-white/10 space-y-5">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-2xl bg-white/10 shrink-0" />
                <div className="space-y-2 flex-1">
                  <div className="h-5 w-40 rounded-xl bg-white/10" />
                  <div className="h-3 w-52 rounded-lg bg-white/10" />
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="p-4 rounded-2xl bg-black/30 border border-white/10 space-y-2">
                    <div className="h-3 w-16 rounded-lg bg-white/10" />
                    <div className="h-4 w-24 rounded-lg bg-white/10" />
                  </div>
                ))}
              </div>
            </div>
            {/* Password section */}
            <div className="p-6 rounded-3xl bg-[#12131c] border border-white/10 space-y-4">
              <div className="h-5 w-36 rounded-xl bg-white/10" />
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="space-y-1.5">
                  <div className="h-3 w-28 rounded-lg bg-white/10" />
                  <div className="h-11 w-full rounded-xl bg-white/10" />
                </div>
              ))}
              <div className="h-10 w-40 rounded-xl bg-white/10" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen max-w-full bg-[#07080D] flex flex-col lg:flex-row overflow-hidden">
      {/* Integrated Core Sidebar matching home screen */}
      <CoreSidebar
        activeTab={'profile' as AdminTab}
        setActiveTab={(tab: AdminTab) => {
          router.push(`/?tab=${tab}`);
        }}
        appsCount={appsCount}
        gamesCount={gamesCount}
        projectsCount={projectsCount}
        messagesCount={messagesCount}
        profile={profile}
        adminEmail={adminEmail}
        onLogout={() => setShowLogoutConfirm(true)}
        isSettingsRoute={true}
      />

      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto h-full max-h-full custom-scrollbar bg-[#07080D]">
        {/* Top Header */}
        <header className="px-8 py-6 border-b border-red-500/20 bg-[#0d0e17]/80 backdrop-blur-md flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-all border border-white/10"
              title="Return to Admin Dashboard"
            >
              <FiArrowLeft className="h-4 w-4" />
            </Link>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
                <FiSettings className="h-5 w-5 text-red-400" />
                <span>Admin Settings &amp; Security</span>
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Manage your administrator account, password, two-factor authentication, and data privacy.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-mono font-semibold border ${twoFactorEnabled
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                }`}
            >
              <FiShield className="h-3.5 w-3.5" />
              <span>{twoFactorEnabled ? '2FA Enabled' : '2FA Disabled'}</span>
            </div>

            {/* Logout Trigger */}
            <button
              type="button"
              onClick={() => setShowLogoutConfirm(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold text-rose-400 hover:text-white bg-rose-500/10 hover:bg-rose-600/30 border border-rose-500/20 transition-all cursor-pointer shadow-sm"
              title="Sign Out from Administrative Session"
            >
              <FiLogOut className="h-3.5 w-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 p-6 sm:p-8 max-w-6xl w-full space-y-8">

          {/* Top Overview Cards Banner */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* 1. Admin Identity */}
            <div className="p-4 rounded-2xl bg-[#12131c] border border-white/10 space-y-2 relative overflow-hidden group hover:border-red-500/30 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold">
                  Administrator
                </span>
                <div className="h-7 w-7 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
                  <FiUser className="h-3.5 w-3.5" />
                </div>
              </div>
              <p className="text-sm font-bold text-white truncate font-mono" title={adminEmail}>
                {adminEmail}
              </p>
              <p className="text-[11px] text-emerald-400 font-mono flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Super Administrator</span>
              </p>
            </div>

            {/* 2. Password Status */}
            <div className="p-4 rounded-2xl bg-[#12131c] border border-white/10 space-y-2 relative overflow-hidden group hover:border-red-500/30 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold">
                  Account Password
                </span>
                <div className="h-7 w-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <FiKey className="h-3.5 w-3.5" />
                </div>
              </div>
              <p className="text-sm font-bold text-white">Active &amp; Protected</p>
              <p className="text-[11px] text-slate-400 font-mono">
                {adminDetails?.passwordUpdatedAt
                  ? `Updated ${new Date(adminDetails.passwordUpdatedAt).toLocaleDateString()}`
                  : 'Configured'}
              </p>
            </div>

            {/* 3. 2FA Security Level */}
            <div className="p-4 rounded-2xl bg-[#12131c] border border-white/10 space-y-2 relative overflow-hidden group hover:border-red-500/30 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold">
                  Two-Factor Authentication
                </span>
                <div className="h-7 w-7 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                  <FiSmartphone className="h-3.5 w-3.5" />
                </div>
              </div>
              <p className="text-sm font-bold text-white">
                {twoFactorEnabled ? 'Enabled & Enforced' : 'Optional'}
              </p>
              <p className="text-[11px] text-slate-400 font-mono">
                {passkeys.length > 0
                  ? `${passkeys.length} Passkeys & Authenticator`
                  : totpVerified
                    ? 'Authenticator App'
                    : 'Not configured'}
              </p>
            </div>

            {/* 4. Database Connection */}
            <div className="p-4 rounded-2xl bg-[#12131c] border border-white/10 space-y-2 relative overflow-hidden group hover:border-red-500/30 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold">
                  Database Connection
                </span>
                <div className="h-7 w-7 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                  <FiDatabase className="h-3.5 w-3.5" />
                </div>
              </div>
              <p className="text-sm font-bold text-white">
                {dbConnected ? 'Connected' : 'Connecting...'}
              </p>
              <p className="text-[11px] text-slate-400 font-mono">
                MongoDB Atlas Cloud
              </p>
            </div>
          </div>

          {/* Settings Tabs Container (shadcn ui) */}
          <Tabs
            value={activeTab}
            onValueChange={(val) => setActiveTab(val as 'profile' | '2fa' | 'privacy' | 'system')}
            className="w-full space-y-6"
          >
            {/* Navigation Tabs List (shadcn ui) */}
            <TabsList className="w-full grid grid-cols-2 sm:grid-cols-4 h-auto p-1.5 rounded-2xl bg-black/40 border border-white/10 gap-1.5">
              <TabsTrigger
                value="profile"
                className="py-3 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2"
              >
                <FiUser className="h-4 w-4" />
                <span>User &amp; Password</span>
              </TabsTrigger>

              <TabsTrigger
                value="2fa"
                className="py-3 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2"
              >
                <FiSmartphone className="h-4 w-4" />
                <span>Two-Factor (2FA)</span>
                {twoFactorEnabled && <span className="h-2 w-2 rounded-full bg-emerald-400" />}
              </TabsTrigger>

              <TabsTrigger
                value="privacy"
                className="py-3 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2"
              >
                <FiShield className="h-4 w-4" />
                <span>Privacy &amp; Security</span>
              </TabsTrigger>

              <TabsTrigger
                value="system"
                className="py-3 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2"
              >
                <FiActivity className="h-4 w-4" />
                <span>Diagnostics</span>
              </TabsTrigger>
            </TabsList>

            {/* TAB 1: USER DETAILS & CHANGE PASSWORD */}
            <TabsContent value="profile" className="space-y-6 mt-0">
              {/* User Details Card */}
              <div className="p-6 sm:p-8 rounded-3xl bg-[#12131c] border border-white/10 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
                  <div className="flex items-center gap-4">
                    <div className="h-16 w-16 rounded-2xl bg-gradient-to-tr from-red-600 via-rose-600 to-amber-600 flex items-center justify-center text-white text-2xl font-bold shadow-xl shadow-red-600/30">
                      {adminEmail.charAt(0).toUpperCase() || 'A'}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <span>{profile?.name || 'Administrator'}</span>
                        <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-mono font-bold border border-emerald-500/30">
                          Active
                        </span>
                      </h3>
                      <p className="text-xs font-mono text-slate-400 mt-0.5">{adminEmail}</p>
                    </div>
                  </div>

                  <div className="flex flex-col sm:items-end gap-1.5 text-xs font-mono text-slate-400">
                    <p className="flex items-center sm:justify-end gap-1.5">
                      <FiClock className="h-3.5 w-3.5 text-slate-500" />
                      <span>Last Login: {adminDetails?.lastLogin ? new Date(adminDetails.lastLogin).toLocaleString() : 'Current Session'}</span>
                    </p>
                    <p className="flex items-center sm:justify-end gap-1.5">
                      <FiDatabase className="h-3.5 w-3.5 text-slate-500" />
                      <span>Database: MongoDB Atlas</span>
                    </p>
                  </div>
                </div>

                {/* Account & Session Details Attributes Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Card 1: Last Login IP & Device */}
                  <div className="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-1.5">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold flex items-center gap-1">
                      <FiGlobe className="h-3.5 w-3.5 text-sky-400" />
                      <span>Login Network</span>
                    </span>
                    <p className="text-xs font-mono font-bold text-sky-300 truncate">
                      {adminDetails?.lastLoginIp || '127.0.0.1 (Localhost)'}
                    </p>
                    <p className="text-[11px] text-slate-400 truncate flex items-center gap-1">
                      <FiMonitor className="h-3 w-3 shrink-0 text-slate-500" />
                      <span className="truncate">{adminDetails?.lastLoginDevice || 'Current Web Browser'}</span>
                    </p>
                  </div>

                  {/* Card 2: Login Location */}
                  <div className="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-1.5">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold flex items-center gap-1">
                      <FiMapPin className="h-3.5 w-3.5 text-emerald-400" />
                      <span>Login Location</span>
                    </span>
                    <p className="text-xs font-bold text-white truncate">
                      {adminDetails?.lastLoginLocation || 'Localhost / Local Network'}
                    </p>
                    <p className="text-[11px] text-emerald-400 flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shrink-0" />
                      <span>Login Alert Email Dispatched</span>
                    </p>
                  </div>

                  {/* Card 3: Single Session Policy */}
                  <div className="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-1.5">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold flex items-center gap-1">
                      <FiShield className="h-3.5 w-3.5 text-amber-400" />
                      <span>Concurrent Session</span>
                    </span>
                    <p className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-xs shadow-emerald-400/50" />
                      <span>Single Active User</span>
                    </p>
                    <p className="text-[11px] text-slate-400 leading-tight">
                      Only one user can login at a time
                    </p>
                  </div>

                  {/* Card 4: Account Role */}
                  <div className="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-1.5">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold flex items-center gap-1">
                      <FiCheckCircle className="h-3.5 w-3.5 text-red-400" />
                      <span>Account Role</span>
                    </span>
                    <p className="text-xs font-bold text-white">Super Administrator</p>
                    <p className="text-[11px] text-slate-400 leading-tight">
                      Full control over apps and portfolio
                    </p>
                  </div>
                </div>
              </div>

              {/* Change Password Form Card */}
              <div className="p-6 sm:p-8 rounded-3xl bg-[#12131c] border border-white/10 space-y-6">
                <div className="space-y-1 border-b border-white/10 pb-4">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <FiKey className="h-4 w-4 text-red-400" />
                    <span>Change Password</span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Choose a strong, unique password to secure your administrator account. You can use your updated password for subsequent logins.
                  </p>
                </div>

                <form onSubmit={handleChangePassword} className="space-y-5 max-w-xl">
                  {/* Current Password */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-mono uppercase tracking-wider text-slate-300 font-bold">
                      Current Password
                    </label>
                    <div className="relative">
                      <input
                        type={showCurrent ? 'text' : 'password'}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="Enter current password"
                        required
                        className="w-full px-4 py-3 rounded-xl bg-black/60 border border-white/10 text-white text-xs font-mono focus:outline-none focus:border-red-500 transition-colors pr-11"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrent(!showCurrent)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors cursor-pointer"
                        title={showCurrent ? 'Hide password' : 'Show password'}
                      >
                        {showCurrent ? <FiEyeOff className="h-4 w-4" /> : <FiEye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  {/* New Password */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-mono uppercase tracking-wider text-slate-300 font-bold">
                      New Password (Minimum 8 characters)
                    </label>
                    <div className="relative">
                      <input
                        type={showNew ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Enter new password"
                        required
                        minLength={8}
                        className="w-full px-4 py-3 rounded-xl bg-black/60 border border-white/10 text-white text-xs font-mono focus:outline-none focus:border-red-500 transition-colors pr-11"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNew(!showNew)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors cursor-pointer"
                        title={showNew ? 'Hide password' : 'Show password'}
                      >
                        {showNew ? <FiEyeOff className="h-4 w-4" /> : <FiEye className="h-4 w-4" />}
                      </button>
                    </div>

                    {/* Password Strength Indicator */}
                    {newPassword && (
                      <div className="space-y-1 pt-1">
                        <div className="flex items-center justify-between text-[11px] font-mono">
                          <span className="text-slate-400">Password Strength:</span>
                          <span className={`font-bold ${strength.score === 3 ? 'text-emerald-400' : strength.score === 2 ? 'text-amber-400' : 'text-rose-400'}`}>
                            {strength.text}
                          </span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${strength.color} transition-all duration-300`}
                            style={{ width: `${(strength.score / 3) * 100}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Confirm New Password */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-mono uppercase tracking-wider text-slate-300 font-bold">
                      Confirm New Password
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirm ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Re-enter new password"
                        required
                        minLength={8}
                        className="w-full px-4 py-3 rounded-xl bg-black/60 border border-white/10 text-white text-xs font-mono focus:outline-none focus:border-red-500 transition-colors pr-11"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirm(!showConfirm)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors cursor-pointer"
                        title={showConfirm ? 'Hide password' : 'Show password'}
                      >
                        {showConfirm ? <FiEyeOff className="h-4 w-4" /> : <FiEye className="h-4 w-4" />}
                      </button>
                    </div>

                    {confirmPassword && newPassword !== confirmPassword && (
                      <p className="text-[11px] text-rose-400 font-mono">Passwords do not match</p>
                    )}
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isChangingPassword || !currentPassword || !newPassword || newPassword !== confirmPassword}
                      className="px-6 py-3 rounded-xl text-xs font-bold bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white shadow-lg shadow-red-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isChangingPassword ? (
                        <>
                          <FiRefreshCw className="h-4 w-4 animate-spin" />
                          <span>Updating Password...</span>
                        </>
                      ) : (
                        <>
                          <FiCheckSquare className="h-4 w-4" />
                          <span>Update Password</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </TabsContent>

            {/* TAB 2: TWO-FACTOR AUTHENTICATION (2FA) */}
            <TabsContent value="2fa" className="space-y-6 mt-0">
              {/* Master 2FA Policy Switch */}
              <div className="p-6 rounded-3xl bg-[#12131c] border border-red-500/25 shadow-xl relative overflow-hidden flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                <div className="space-y-1.5 max-w-xl">
                  <div className="flex items-center gap-2.5">
                    <div className="h-8 w-8 rounded-xl bg-red-500/15 border border-red-500/30 flex items-center justify-center text-red-400">
                      <FiLock className="h-4 w-4" />
                    </div>
                    <h2 className="text-base font-bold text-white tracking-wide">
                      Two-Factor Authentication (2FA)
                    </h2>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Require secondary verification when logging in using Google Authenticator or registered biometric passkeys.
                  </p>
                </div>

                <label className="relative inline-flex items-center cursor-pointer select-none shrink-0">
                  <input
                    type="checkbox"
                    disabled={loading}
                    checked={twoFactorEnabled}
                    onChange={(e) => handleToggle2FA(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-14 h-7 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-emerald-600" />
                </label>
              </div>

              {/* Option A: Google Authenticator */}
              <div className="p-6 sm:p-8 rounded-3xl bg-[#12131c] border border-white/10 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
                  <div className="space-y-1">
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <FiSmartphone className="h-4 w-4 text-red-400" />
                      <span>Option A: Authenticator App</span>
                    </h3>
                    <p className="text-xs text-slate-400">
                      Use Google Authenticator, Microsoft Authenticator, Authy, or 1Password to generate verification codes.
                    </p>
                  </div>

                  {totpVerified && (
                    <button
                      type="button"
                      onClick={handleGenerateTotp}
                      disabled={isGeneratingTotp}
                      className="px-4 py-2 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer shrink-0"
                    >
                      Reconfigure Key
                    </button>
                  )}
                </div>

                {totpVerified && !totpQrCode ? (
                  <div className="p-5 rounded-2xl bg-emerald-950/25 border border-emerald-500/30 flex items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                        <FiCheckCircle className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white">Authenticator App is Active</p>
                        <p className="text-xs text-slate-400">
                          Codes from your authenticator app will be required when logging in.
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowDisableTotpConfirm(true)}
                      className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 hover:text-rose-300 transition-all cursor-pointer"
                      title="Remove authenticator app"
                    >
                      <FiTrash2 className="h-3 w-3" />
                      <span>Remove</span>
                    </button>
                  </div>
                ) : totpQrCode ? (
                  <div className="p-6 rounded-2xl bg-black/40 border border-white/10 space-y-6 max-w-xl mx-auto">
                    <div className="text-center space-y-1">
                      <h4 className="text-sm font-bold text-white">Scan QR Code</h4>
                      <p className="text-xs text-slate-400">
                        Open your Authenticator app, tap (+), and point your camera at this QR code.
                      </p>
                    </div>

                    <div className="flex justify-center">
                      <div className="p-3 rounded-2xl bg-white shadow-2xl">
                        <img src={totpQrCode} alt="Authenticator QR Code" className="w-52 h-52 rounded-xl" />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold text-center">
                        Or Enter Key Manually
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          readOnly
                          value={totpSecret}
                          className="flex-1 px-3.5 py-2.5 rounded-xl bg-black/60 border border-white/10 text-white text-xs font-mono text-center select-all focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(totpSecret);
                            setCopiedSecret(true);
                            setTimeout(() => setCopiedSecret(false), 2000);
                          }}
                          className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer"
                          title="Copy Key"
                        >
                          {copiedSecret ? <FiCheck className="h-4 w-4 text-emerald-400" /> : <FiCopy className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    <form onSubmit={handleVerifyTotp} className="space-y-4 pt-3 border-t border-white/10">
                      <div className="space-y-1.5 text-center">
                        <label className="block text-xs font-bold text-white uppercase font-mono">
                          Confirm 6-Digit Code from App
                        </label>
                        <input
                          type="text"
                          inputMode="numeric"
                          maxLength={6}
                          value={testCode}
                          onChange={(e) => setTestCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                          placeholder="••••••"
                          className="w-full max-w-[220px] mx-auto px-4 py-3 rounded-xl bg-black/60 border border-white/20 text-white text-center font-mono text-xl tracking-[0.3em] font-bold focus:outline-none focus:border-red-500"
                        />
                      </div>

                      <div className="flex gap-2.5">
                        <button
                          type="button"
                          onClick={() => setTotpQrCode('')}
                          className="flex-1 py-2.5 rounded-xl text-xs font-semibold bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={loading || testCode.length !== 6}
                          className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white shadow-lg shadow-red-600/30 transition-all cursor-pointer disabled:opacity-50"
                        >
                          {loading ? 'Verifying...' : 'Confirm & Enable'}
                        </button>
                      </div>
                    </form>
                  </div>
                ) : (
                  <div className="p-8 rounded-2xl bg-black/40 border border-white/10 text-center space-y-4">
                    <div className="h-14 w-14 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 mx-auto">
                      <FiSmartphone className="h-7 w-7" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-base font-bold text-white">Authenticator App Setup</h4>
                      <p className="text-xs text-slate-400 max-w-md mx-auto">
                        Generate a secure setup key and scan the QR code to pair your device.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleGenerateTotp}
                      disabled={isGeneratingTotp}
                      className="px-5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white shadow-lg shadow-red-600/30 transition-all cursor-pointer"
                    >
                      {isGeneratingTotp ? 'Generating...' : 'Set Up Authenticator App'}
                    </button>
                  </div>
                )}
              </div>

              {/* Option B: Biometric Passkeys */}
              <div className="p-6 sm:p-8 rounded-3xl bg-[#12131c] border border-white/10 space-y-6">
                <div className="flex items-start justify-between gap-3 border-b border-white/10 pb-4">
                  <div className="space-y-1">
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <FaFingerprint className="h-4 w-4 text-red-400" />
                      <span>Option B: Biometric Passkeys &amp; Touch ID</span>
                    </h3>
                    <p className="text-xs text-slate-400">
                      Authenticate instantly with Touch ID, Face ID, Windows Hello, or external security keys.
                    </p>
                  </div>
                  {passkeys.length < 3 && (
                    <button
                      type="button"
                      onClick={() => {
                        const name = detectDeviceName();
                        setDetectedDevice(name);
                        setShowPasskeyModal(true);
                      }}
                      className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white shadow-md shadow-red-600/25 transition-all cursor-pointer"
                    >
                      <FaFingerprint className="h-3 w-3" />
                      <span>Add New</span>
                    </button>
                  )}
                </div>


                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-slate-400 uppercase tracking-wider font-semibold">
                      Registered Devices
                    </span>
                    <span className="text-slate-500">{passkeys.length} Registered</span>
                  </div>

                  {passkeys.length === 0 ? (
                    <div className="p-6 rounded-2xl bg-white/5 border border-white/5 text-center text-xs text-slate-400 font-mono">
                      No passkeys registered yet. Use the &quot;Add&quot; button above to pair your device.
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {passkeys.map((p) => (
                        <div
                          key={p.credentialId}
                          className="p-4 rounded-2xl bg-black/40 border border-white/10 flex items-center justify-between gap-4 text-xs"
                        >
                          <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                              <FaFingerprint className="h-4 w-4" />
                            </div>
                            <div>
                              <p className="font-bold text-white text-sm">{p.deviceName}</p>
                              <p className="text-[11px] font-mono text-slate-500 mt-0.5">
                                Registered on {new Date(p.createdAt).toLocaleDateString()} &bull; Biometric Device
                              </p>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => setDeletingPasskeyId(p.credentialId)}
                            title="Remove Passkey"
                            className="p-2.5 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-all cursor-pointer"
                          >
                            <FiTrash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* TAB 3: PRIVACY & SECURITY */}
            <TabsContent value="privacy" className="mt-0">
              <div className="p-6 sm:p-8 rounded-3xl bg-[#12131c] border border-white/10 space-y-6">
                <div className="space-y-1 border-b border-white/10 pb-4">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <FiShield className="h-4 w-4 text-red-400" />
                    <span>Privacy &amp; Security Standards</span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Data protection policies and session security overview.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-2">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold">
                      Session Security
                    </span>
                    <p className="text-sm font-bold text-white">Active Protection</p>
                    <p className="text-xs text-slate-400">
                      Secure token-based authentication with automatic expiry.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-2">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold">
                      Database Security
                    </span>
                    <p className="text-sm font-bold text-white">Encrypted Cloud Connection</p>
                    <p className="text-xs text-slate-400">
                      Isolated access control with secured credentials.
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-3">
                  <h4 className="text-xs font-mono uppercase tracking-wider text-slate-300 font-bold">
                    Zero Telemetry &amp; Privacy Disclosures
                  </h4>
                  <ul className="space-y-2 text-xs text-slate-300">
                    <li className="flex items-center gap-2">
                      <FiCheck className="h-4 w-4 text-emerald-400 shrink-0" />
                      <span>Administrative credentials are securely managed on the server and never exposed in client bundles.</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <FiCheck className="h-4 w-4 text-emerald-400 shrink-0" />
                      <span>Biometric verification is processed directly on your local device.</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <FiCheck className="h-4 w-4 text-emerald-400 shrink-0" />
                      <span>Zero third-party analytics or tracking scripts are loaded in the admin dashboard.</span>
                    </li>
                  </ul>
                </div>
              </div>
            </TabsContent>

            {/* TAB 4: SYSTEM DIAGNOSTICS */}
            <TabsContent value="system" className="mt-0">
              <div className="p-6 sm:p-8 rounded-3xl bg-[#12131c] border border-white/10 space-y-6">
                <div className="space-y-1 border-b border-white/10 pb-4">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <FiCpu className="h-4 w-4 text-red-400" />
                    <span>System Diagnostics</span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Status of database connection and application services.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-1">
                    <span className="text-[10px] font-mono text-slate-400 uppercase">Database</span>
                    <p className="text-sm font-bold text-white flex items-center gap-2">
                      <span className={`h-2.5 w-2.5 rounded-full ${dbConnected ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`} />
                      <span>{dbConnected ? 'Connected & Healthy' : 'Disconnected'}</span>
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-1">
                    <span className="text-[10px] font-mono text-slate-400 uppercase">Registered Apps</span>
                    <p className="text-sm font-bold text-white">{appsCount} Production Apps</p>
                  </div>

                  <div className="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-1">
                    <span className="text-[10px] font-mono text-slate-400 uppercase">Portfolio Projects</span>
                    <p className="text-sm font-bold text-white">{projectsCount} Projects Active</p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-2">
                  <span className="text-[10px] font-mono text-slate-400 uppercase font-bold">API Services</span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono text-slate-300">
                    <div className="p-2 rounded-xl bg-white/5 border border-white/5">Auth Service (Active)</div>
                    <div className="p-2 rounded-xl bg-white/5 border border-white/5">Apps Service (Active)</div>
                    <div className="p-2 rounded-xl bg-white/5 border border-white/5">Projects Service (Active)</div>
                    <div className="p-2 rounded-xl bg-white/5 border border-white/5">Profile Service (Active)</div>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>

        </main>
      </div>

      {/* TOTP Disable Confirmation */}
      <ConfirmDialog
        open={showDisableTotpConfirm}
        onOpenChange={setShowDisableTotpConfirm}
        title="Remove Authenticator App"
        description={passkeys.length > 0
          ? 'The authenticator app will be removed. Your biometric passkeys will still protect your account.'
          : 'Warning: removing the authenticator app will disable 2FA entirely on your account. Make sure you have a passkey registered first.'}
        confirmLabel="Remove Authenticator"
        variant="danger"
        loading={isDisablingTotp}
        onConfirm={handleDisableTotp}
        icon={<FiSmartphone className="h-6 w-6" />}
      />

      {/* Passkey Registration Confirmation */}
      <ConfirmDialog
        open={showPasskeyModal}
        onOpenChange={(open) => {
          if (!open) { setShowPasskeyModal(false); setDetectedDevice(''); }
        }}
        title="Register Biometric Device"
        description="Your device will prompt for Touch ID, Face ID, or Windows Hello to register this passkey."
        confirmLabel={isRegisteringPasskey ? 'Follow device prompt...' : 'Continue with Biometrics'}
        cancelLabel="Cancel"
        variant="default"
        loading={isRegisteringPasskey}
        onConfirm={handleRegisterPasskey}
        icon={<FaFingerprint className="h-6 w-6" />}
      >
        {/* Device info card */}
        <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-3">
          <FiCpu className="h-4 w-4 text-slate-400 shrink-0" />
          <div className="min-w-0">
            <p className="text-[10px] font-mono uppercase tracking-wider text-slate-500">Detected Device</p>
            <p className="text-sm font-bold text-white truncate mt-0.5">{detectedDevice}</p>
          </div>
        </div>
        <p className="text-[11px] text-slate-500 text-center font-mono mt-1">
          Slot {passkeys.length + 1} of 3 · Saved as your passkey device name.
        </p>
      </ConfirmDialog>

      {/* Passkey Delete Confirmation */}
      <ConfirmDialog
        open={!!deletingPasskeyId}
        onOpenChange={(open) => { if (!open) setDeletingPasskeyId(null); }}
        title="Remove Biometric Device"
        description="This passkey will be permanently removed. You will no longer be able to use this device for biometric authentication."
        confirmLabel="Remove Device"
        variant="danger"
        loading={isDeletingPasskey}
        onConfirm={handleDeletePasskey}
      />

      {/* Logout Confirmation */}
      <ConfirmDialog
        open={showLogoutConfirm}
        onOpenChange={setShowLogoutConfirm}
        title="Confirm Administrative Logout"
        description="Are you sure you want to end your active administrative session? You will be returned to the login screen and must authenticate again."
        confirmLabel="Yes, Sign Out"
        cancelLabel="Cancel"
        variant="danger"
        onConfirm={handleLogout}
      />
    </div>
  );
}
