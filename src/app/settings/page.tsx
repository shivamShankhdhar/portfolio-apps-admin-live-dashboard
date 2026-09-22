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
import Sidebar, { AdminTab } from '@/components/admin/Sidebar';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

interface PasskeyDevice {
  credentialId: string;
  deviceName: string;
  createdAt: string;
}

interface AdminDetails {
  email: string;
  role: string;
  createdAt: string | null;
  lastLogin: string | null;
  lastLoginIp?: string | null;
  lastLoginDevice?: string | null;
  lastLoginLocation?: string | null;
  activeSessionId?: string | null;
  twoFactorEnabled: boolean;
  twoFactorMethod: string;
  totpVerified: boolean;
  passkeysCount: number;
  passwordUpdatedAt: string | null;
}

type AuthStatus = 'validating' | 'authorized' | 'unauthorized';

export default function SettingsPage() {
  const router = useRouter();
  const [authStatus, setAuthStatus] = useState<AuthStatus>('validating');
  const [adminEmail, setAdminEmail] = useState('');
  const [dbConnected, setDbConnected] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | '2fa' | 'privacy' | 'system'>('profile');
  const [loading, setLoading] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // Admin user details from API
  const [adminDetails, setAdminDetails] = useState<AdminDetails | null>(null);

  // Password Change Form State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // 2FA State
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [twoFactorMethod, setTwoFactorMethod] = useState<'totp' | 'passkey' | 'both'>('totp');
  const [totpVerified, setTotpVerified] = useState(false);
  const [passkeys, setPasskeys] = useState<PasskeyDevice[]>([]);

  // TOTP Setup State
  const [isGeneratingTotp, setIsGeneratingTotp] = useState(false);
  const [totpSecret, setTotpSecret] = useState('');
  const [totpQrCode, setTotpQrCode] = useState('');
  const [testCode, setTestCode] = useState('');
  const [copiedSecret, setCopiedSecret] = useState(false);

  // Passkey Setup State
  const [isRegisteringPasskey, setIsRegisteringPasskey] = useState(false);
  const [passkeyDeviceName, setPasskeyDeviceName] = useState('');

  // Sidebar Counts State
  const [appsCount, setAppsCount] = useState(0);
  const [gamesCount, setGamesCount] = useState(0);
  const [projectsCount, setProjectsCount] = useState(0);
  const [messagesCount, setMessagesCount] = useState(0);
  const [profile, setProfile] = useState<any>(null);

  // 1. Verify Session & Fetch User Details
  useEffect(() => {
    let isMounted = true;

    async function verifySession() {
      const token = localStorage.getItem('adminToken');
      const email = localStorage.getItem('adminEmail');

      if (!token) {
        if (!isMounted) return;
        setAuthStatus('unauthorized');
        setTimeout(() => router.replace('/login'), 250);
        return;
      }

      try {
        const res = await fetch('/api/auth', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();

        if (!res.ok || !data.authenticated) {
          localStorage.removeItem('adminToken');
          if (data.sessionTerminated) {
            toast.error('Session expired: Another administrator session was started.');
          }
          if (!isMounted) return;
          setAuthStatus('unauthorized');
          setTimeout(() => router.replace('/login'), 250);
          return;
        }

        if (!isMounted) return;
        const finalEmail = data.email || email || 's.shankhdhar1981@gmail.com';
        setAdminEmail(finalEmail);
        setDbConnected(Boolean(data.dbConnected));
        if (data.adminDetails) {
          setAdminDetails(data.adminDetails);
        }
        setAuthStatus('authorized');

        // Fetch counts & profile for sidebar
        fetch('/api/apps')
          .then((r) => r.json())
          .then((d) => {
            if (Array.isArray(d)) {
              setAppsCount(d.filter((a: any) => (a.category || '').toLowerCase() !== 'games').length);
              setGamesCount(d.filter((a: any) => (a.category || '').toLowerCase() === 'games').length);
            }
          })
          .catch(() => {});
        fetch('/api/projects').then((r) => r.json()).then((d) => Array.isArray(d) && setProjectsCount(d.length)).catch(() => {});
        fetch('/api/messages').then((r) => r.json()).then((d) => Array.isArray(d) && setMessagesCount(d.length)).catch(() => {});
        fetch('/api/profile?t=' + Date.now(), { cache: 'no-store' }).then((r) => r.json()).then((d) => d && setProfile(d)).catch(() => {});

        // Fetch 2FA status
        fetch2FAStatus(token);
      } catch (err) {
        if (!isMounted) return;
        setAuthStatus('unauthorized');
        setTimeout(() => router.replace('/login'), 250);
      }
    }

    verifySession();

    return () => {
      isMounted = false;
    };
  }, [router]);

  // 2. Fetch 2FA Status
  const fetch2FAStatus = async (tokenOverride?: string) => {
    try {
      const token = tokenOverride || localStorage.getItem('adminToken');
      if (!token) return;

      const res = await fetch('/api/auth/2fa', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setTwoFactorEnabled(Boolean(data.twoFactorEnabled));
        setTwoFactorMethod(data.twoFactorMethod || 'totp');
        setTotpVerified(Boolean(data.totpVerified));
        setPasskeys(data.passkeys || []);
      }
    } catch (err) {
      console.error('Error fetching 2FA status:', err);
    }
  };

  // 3. Change Password Handler
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

    setIsChangingPassword(true);
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          action: 'change-password',
          currentPassword,
          newPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to update password');
      }

      toast.success(data.message || 'Password updated successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');

      // Refresh admin details
      const refreshRes = await fetch('/api/auth', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const refreshData = await refreshRes.json();
      if (refreshData.adminDetails) {
        setAdminDetails(refreshData.adminDetails);
      }
    } catch (err: any) {
      toast.error(err.message || 'Error updating password');
    } finally {
      setIsChangingPassword(false);
    }
  };

  // 4. Master Toggle 2FA
  const handleToggle2FA = async (enable: boolean) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch('/api/auth/2fa', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          action: 'toggle-2fa',
          enabled: enable,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to update 2FA status');
      }

      setTwoFactorEnabled(enable);
      toast.success(data.message);
      await fetch2FAStatus();
    } catch (err: any) {
      toast.error(err.message || 'Error updating 2FA');
    } finally {
      setLoading(false);
    }
  };

  // 5. Generate TOTP Secret & QR Code
  const handleGenerateTotp = async () => {
    setIsGeneratingTotp(true);
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch('/api/auth/2fa', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ action: 'generate-totp' }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to generate key');
      }

      setTotpSecret(data.secret);
      setTotpQrCode(data.qrCode);
      setTestCode('');
    } catch (err: any) {
      toast.error(err.message || 'Error generating key');
    } finally {
      setIsGeneratingTotp(false);
    }
  };

  // 6. Verify & Activate TOTP
  const handleVerifyTotp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testCode || testCode.trim().length !== 6) {
      toast.error('Please enter the 6-digit code from your Authenticator app');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch('/api/auth/2fa', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          action: 'verify-enable-totp',
          code: testCode.trim(),
          secret: totpSecret,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Invalid code');
      }

      toast.success(data.message);
      setTotpVerified(true);
      setTwoFactorEnabled(true);
      setTotpQrCode('');
      setTotpSecret('');
      await fetch2FAStatus();
    } catch (err: any) {
      toast.error(err.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  // 7. Register Passkey / Biometrics via WebAuthn
  const handleRegisterPasskey = async () => {
    if (typeof window === 'undefined' || !window.PublicKeyCredential) {
      toast.error('Biometric passkeys are not supported in this browser.');
      return;
    }

    setIsRegisteringPasskey(true);
    try {
      const token = localStorage.getItem('adminToken');

      const optRes = await fetch('/api/auth/2fa', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          action: 'passkey-register-options',
          deviceName: passkeyDeviceName.trim() || 'Admin Biometric Device',
        }),
      });

      const optData = await optRes.json();
      if (!optRes.ok) {
        throw new Error(optData.message || 'Failed to prepare registration');
      }

      const challengeBytes = Uint8Array.from(atob(optData.challenge), (c) => c.charCodeAt(0));
      const userIdBytes = new TextEncoder().encode(adminEmail || 'admin');

      const credential = (await navigator.credentials.create({
        publicKey: {
          challenge: challengeBytes,
          rp: { name: 'Portfolio & Apps Admin Hub' },
          user: {
            id: userIdBytes,
            name: adminEmail,
            displayName: 'System Administrator',
          },
          pubKeyCredParams: [
            { type: 'public-key', alg: -7 },
            { type: 'public-key', alg: -257 },
          ],
          authenticatorSelection: {
            authenticatorAttachment: 'platform',
            userVerification: 'preferred',
          },
          timeout: 60000,
        },
      })) as PublicKeyCredential;

      if (!credential) {
        throw new Error('Sensor verification was cancelled.');
      }

      const rawId = btoa(String.fromCharCode(...new Uint8Array(credential.rawId)));
      const response = credential.response as AuthenticatorAttestationResponse;
      const clientDataJSON = btoa(String.fromCharCode(...new Uint8Array(response.clientDataJSON)));
      const attestationObject = btoa(String.fromCharCode(...new Uint8Array(response.attestationObject)));

      const verifyRes = await fetch('/api/auth/2fa', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          action: 'passkey-register-verify',
          credential: {
            id: credential.id,
            rawId,
            response: { clientDataJSON, attestationObject },
          },
          deviceName: passkeyDeviceName.trim() || 'Admin Biometric Device',
        }),
      });

      const verifyData = await verifyRes.json();
      if (!verifyRes.ok) {
        throw new Error(verifyData.message || 'Failed to verify passkey');
      }

      toast.success(verifyData.message);
      setPasskeyDeviceName('');
      setTwoFactorEnabled(true);
      await fetch2FAStatus();
    } catch (err: any) {
      if (err.name === 'NotAllowedError') {
        toast.info('Passkey registration cancelled');
      } else {
        toast.error(err.message || 'Passkey registration error');
      }
    } finally {
      setIsRegisteringPasskey(false);
    }
  };

  // 8. Delete Passkey
  const handleDeletePasskey = async (credentialId: string) => {
    if (!confirm('Are you sure you want to remove this passkey device?')) return;

    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch('/api/auth/2fa', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          action: 'delete-passkey',
          credentialId,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success(data.message);
        await fetch2FAStatus();
      }
    } catch (err) {
      toast.error('Error removing passkey');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminEmail');
    toast.info('Signed out from Admin Hub');
    router.replace('/login');
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
  if (authStatus !== 'authorized') {
    return (
      <div className="min-h-screen w-full bg-[#09090b] flex">
        {/* Skeleton Sidebar */}
        <div className="hidden md:flex w-64 shrink-0 flex-col bg-[#0d0e17] border-r border-white/10 p-4 gap-3">
          <div className="flex items-center gap-3 px-2 py-3 mb-2">
            <div className="h-8 w-8 rounded-xl bg-white/10 animate-pulse" />
            <div className="h-4 w-28 rounded-lg bg-white/10 animate-pulse" />
          </div>
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 px-3 py-2.5 rounded-xl">
              <div className="h-4 w-4 rounded-md bg-white/10 animate-pulse shrink-0" />
              <div className="h-3.5 rounded-lg bg-white/10 animate-pulse" style={{ width: `${55 + (i % 3) * 20}px` }} />
            </div>
          ))}
          <div className="mt-auto flex items-center gap-3 px-3 py-2.5">
            <div className="h-8 w-8 rounded-full bg-white/10 animate-pulse shrink-0" />
            <div className="flex-1 space-y-1.5">
              <div className="h-3 w-32 rounded-lg bg-white/10 animate-pulse" />
              <div className="h-2.5 w-20 rounded-lg bg-white/10 animate-pulse" />
            </div>
          </div>
        </div>

        {/* Skeleton Settings Content */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <div className="px-8 py-6 border-b border-white/10 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-white/10 animate-pulse" />
              <div className="h-9 w-9 rounded-xl bg-white/10 animate-pulse" />
              <div className="space-y-2">
                <div className="h-6 w-48 rounded-xl bg-white/10 animate-pulse" />
                <div className="h-3 w-64 rounded-lg bg-white/10 animate-pulse" />
              </div>
            </div>
            <div className="h-7 w-28 rounded-full bg-white/10 animate-pulse" />
          </div>

          {/* Settings body */}
          <div className="flex-1 p-8 space-y-6 max-w-4xl mx-auto w-full">
            {/* Tabs */}
            <div className="flex gap-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-9 rounded-xl bg-white/10 animate-pulse" style={{ width: `${80 + i * 20}px` }} />
              ))}
            </div>
            {/* Profile card */}
            <div className="p-6 rounded-3xl bg-[#12131c] border border-white/10 space-y-5">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-2xl bg-white/10 animate-pulse shrink-0" />
                <div className="space-y-2 flex-1">
                  <div className="h-5 w-40 rounded-xl bg-white/10 animate-pulse" />
                  <div className="h-3 w-52 rounded-lg bg-white/10 animate-pulse" />
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="p-4 rounded-2xl bg-black/30 border border-white/10 space-y-2">
                    <div className="h-3 w-16 rounded-lg bg-white/10 animate-pulse" />
                    <div className="h-4 w-24 rounded-lg bg-white/10 animate-pulse" />
                  </div>
                ))}
              </div>
            </div>
            {/* Password section */}
            <div className="p-6 rounded-3xl bg-[#12131c] border border-white/10 space-y-4">
              <div className="h-5 w-36 rounded-xl bg-white/10 animate-pulse" />
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="space-y-1.5">
                  <div className="h-3 w-28 rounded-lg bg-white/10 animate-pulse" />
                  <div className="h-11 w-full rounded-xl bg-white/10 animate-pulse" />
                </div>
              ))}
              <div className="h-10 w-40 rounded-xl bg-white/10 animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider defaultOpen={true} className="min-h-screen w-full bg-[#09090b]">
      {/* Persistent Sidebar */}
      <Sidebar
        activeTab={'apps' as AdminTab}
        setActiveTab={(tab) => {
          router.push(`/?tab=${tab}`);
        }}
        appsCount={appsCount}
        gamesCount={gamesCount}
        projectsCount={projectsCount}
        messagesCount={messagesCount}
        profile={profile}
        adminEmail={adminEmail}
        onLogout={handleLogout}
      />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="px-8 py-6 border-b border-red-500/20 bg-[#0d0e17]/80 backdrop-blur-md flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <SidebarTrigger className="md:hidden text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 p-2 rounded-xl border border-white/10 shrink-0" />
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
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-mono font-semibold border ${
                twoFactorEnabled
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
                <div className="space-y-1 border-b border-white/10 pb-4">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <FaFingerprint className="h-4 w-4 text-red-400" />
                    <span>Option B: Biometric Passkeys &amp; Touch ID</span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Authenticate instantly with Touch ID, Face ID, Windows Hello, or external security keys.
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-black/40 border border-white/10 space-y-4">
                  <div className="flex flex-col sm:flex-row gap-3">
                    <input
                      type="text"
                      value={passkeyDeviceName}
                      onChange={(e) => setPasskeyDeviceName(e.target.value)}
                      placeholder="Device Name (e.g. MacBook Pro Touch ID)"
                      className="flex-1 px-4 py-2.5 rounded-xl bg-black/60 border border-white/10 text-white text-xs focus:outline-none focus:border-red-500 font-mono"
                    />
                    <button
                      type="button"
                      onClick={handleRegisterPasskey}
                      disabled={isRegisteringPasskey}
                      className="px-5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white shadow-lg shadow-red-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shrink-0"
                    >
                      {isRegisteringPasskey ? (
                        <span>Follow Sensor Prompt...</span>
                      ) : (
                        <>
                          <FaFingerprint className="h-4 w-4" />
                          <span>Register Passkey</span>
                        </>
                      )}
                    </button>
                  </div>
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
                      No passkeys registered yet. Click &quot;Register Passkey&quot; above to pair your device.
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
                            onClick={() => handleDeletePasskey(p.credentialId)}
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

      {/* Confirmation Dialog Before Logout */}
      {showLogoutConfirm && (
        <div
          className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setShowLogoutConfirm(false)}
        >
          <div
            className="w-full max-w-sm rounded-3xl bg-[#12131c] border border-red-500/30 p-6 shadow-2xl shadow-red-950/60 space-y-5 text-center relative overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-24 bg-red-600/20 rounded-full blur-2xl pointer-events-none" />

            <div className="relative mx-auto h-16 w-16 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 shadow-lg shadow-rose-950/40">
              <FiLogOut className="h-8 w-8" />
            </div>

            <div className="space-y-1.5 relative z-10">
              <h3 className="text-base font-bold text-white tracking-tight">
                Confirm Administrative Logout
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Are you sure you want to end your active administrative session? You will be returned to the login screen and must authenticate again.
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2 relative z-10">
              <button
                type="button"
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 py-2.5 px-4 rounded-xl text-xs font-semibold bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowLogoutConfirm(false);
                  handleLogout();
                }}
                className="flex-1 py-2.5 px-4 rounded-xl text-xs font-bold bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white shadow-lg shadow-red-600/30 transition-all cursor-pointer"
              >
                Yes, Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </SidebarProvider>
  );
}
