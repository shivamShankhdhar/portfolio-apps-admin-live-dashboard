'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  FiShield,
  FiMail,
  FiLock,
  FiEye,
  FiEyeOff,
  FiKey,
  FiArrowRight,
  FiArrowLeft,
  FiRotateCw,
  FiDatabase,
  FiCheckCircle,
  FiSmartphone,
  FiAlertCircle,
} from 'react-icons/fi';
import { FaFingerprint } from 'react-icons/fa6';
import { toast } from 'sonner';

export default function LoginPage() {
  const router = useRouter();
  const [authMode, setAuthMode] = useState<'password' | 'otp'>('password');
  const [step, setStep] = useState<'email' | 'otp' | '2fa_challenge'>('email');
  const [email, setEmail] = useState('s.shankhdhar1981@gmail.com');
  const [password, setPassword] = useState('admin123');
  const [showPassword, setShowPassword] = useState(false);
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSettingUp, setIsSettingUp] = useState(false);
  const [setupMessage, setSetupMessage] = useState('Validating credentials...');
  const [resendCooldown, setResendCooldown] = useState(0);
  const [dbStatus, setDbStatus] = useState<{ configured: boolean; connected: boolean } | null>(null);

  // 2FA Challenge State
  const [tempToken, setTempToken] = useState('');
  const [twoFactorMethod, setTwoFactorMethod] = useState<'totp' | 'passkey' | 'both'>('totp');
  const [challengeMode, setChallengeMode] = useState<'totp' | 'passkey'>('totp');
  const [totpCode, setTotpCode] = useState('');

  const otpInputRef = useRef<HTMLInputElement>(null);
  const totpInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // If token exists, verify validity before redirecting
    const token = localStorage.getItem('adminToken');
    if (token) {
      setIsSettingUp(true);
      setSetupMessage('Checking active session...');
      fetch('/api/auth', { headers: { Authorization: `Bearer ${token}` } })
        .then((res) => res.json())
        .then((data) => {
          if (data.authenticated) {
            setSetupMessage('Setting up the Admin Panel...');
            setTimeout(() => router.replace('/'), 400);
          } else {
            localStorage.removeItem('adminToken');
            setIsSettingUp(false);
          }
        })
        .catch(() => {
          localStorage.removeItem('adminToken');
          setIsSettingUp(false);
        });
    }

    // Check DB status & pre-fill configured admin email
    fetch('/api/auth')
      .then((res) => res.json())
      .then((data) => {
        setDbStatus({
          configured: Boolean(data.dbConfigured),
          connected: Boolean(data.dbConnected),
        });
        if (data.adminEmail) {
          setEmail(data.adminEmail);
        }
      })
      .catch(() => {});
  }, [router]);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const interval = setInterval(() => {
      setResendCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [resendCooldown]);

  // Focus inputs on transition
  useEffect(() => {
    if (step === 'otp') {
      setTimeout(() => otpInputRef.current?.focus(), 150);
    } else if (step === '2fa_challenge' && challengeMode === 'totp') {
      setTimeout(() => totpInputRef.current?.focus(), 150);
    }
  }, [step, challengeMode]);

  // 1. Password Login Handler
  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetEmail = email.trim().toLowerCase();

    if (!targetEmail) {
      toast.error('Please enter your administrative email');
      return;
    }

    if (!password) {
      toast.error('Please enter your administrator password');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'password',
          email: targetEmail,
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Authentication failed');
      }

      // Check if Two-Factor Authentication challenge is required
      if (data.requires2FA) {
        setTempToken(data.tempToken);
        setTwoFactorMethod(data.twoFactorMethod || 'totp');
        setChallengeMode(data.twoFactorMethod === 'passkey' ? 'passkey' : 'totp');
        setStep('2fa_challenge');
        setLoading(false);
        toast.info('Secondary authentication required. Please verify your 2FA credential.');
        return;
      }

      localStorage.setItem('adminToken', data.token);
      localStorage.setItem('adminEmail', data.email);
      toast.success('Authentication verified!');

      setIsSettingUp(true);
      setSetupMessage('Setting up the Admin Panel...');
      setTimeout(() => {
        router.replace('/');
      }, 500);
    } catch (err: any) {
      toast.error(err.message || 'Failed to authenticate');
      setLoading(false);
    }
  };

  // 2. Send OTP Request
  const handleSendOTP = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const targetEmail = email.trim().toLowerCase();

    if (!targetEmail) {
      toast.error('Please enter an admin email address');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'sendOTP',
          email: targetEmail,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Failed to send verification code');
      }

      setStep('otp');
      setResendCooldown(30);
      toast.success(data.message || `Verification code sent to ${targetEmail}`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to send verification code');
    } finally {
      setLoading(false);
    }
  };

  // 3. Verify OTP Request
  const handleVerifyOTP = async (e?: React.FormEvent, manualOtp?: string) => {
    if (e) e.preventDefault();
    const codeToVerify = (manualOtp || otp).replace(/\D/g, '').trim();

    if (!codeToVerify || codeToVerify.length !== 6) {
      toast.error('Please enter the 6-digit verification code');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'verifyOTP',
          email: email.trim().toLowerCase(),
          otp: codeToVerify,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Invalid or expired verification code');
      }

      localStorage.setItem('adminToken', data.token);
      localStorage.setItem('adminEmail', data.email);
      toast.success('Security code verified!');

      setIsSettingUp(true);
      setSetupMessage('Setting up the Admin Panel...');
      setTimeout(() => {
        router.replace('/');
      }, 500);
    } catch (err: any) {
      toast.error(err.message || 'Verification failed');
      setLoading(false);
    }
  };

  // 4. Verify 2FA TOTP (Authenticator App)
  const handleVerify2FATOTP = async (e?: React.FormEvent, manualCode?: string) => {
    if (e) e.preventDefault();
    const code = (manualCode || totpCode).replace(/\D/g, '').trim();

    if (!code || code.length !== 6) {
      toast.error('Please enter the 6-digit code from your Authenticator app');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/2fa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'login-verify-totp',
          tempToken,
          code,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Invalid 6-digit code');
      }

      localStorage.setItem('adminToken', data.token);
      localStorage.setItem('adminEmail', data.email);
      toast.success('Two-factor authentication verified!');

      setIsSettingUp(true);
      setSetupMessage('Setting up the Admin Panel...');
      setTimeout(() => {
        router.replace('/');
      }, 500);
    } catch (err: any) {
      toast.error(err.message || '2FA verification failed');
      setLoading(false);
    }
  };

  // 5. Verify 2FA Passkey (Touch ID / Fingerprint / WebAuthn)
  const handleVerify2FAPasskey = async () => {
    if (typeof window === 'undefined' || !window.PublicKeyCredential) {
      toast.error('WebAuthn / Passkeys are not supported in this browser.');
      return;
    }

    setLoading(true);

    try {
      // 1. Get challenge and allowed credentials from server
      const chalRes = await fetch('/api/auth/2fa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'login-passkey-challenge',
          tempToken,
        }),
      });

      const chalData = await chalRes.json();
      if (!chalRes.ok) {
        throw new Error(chalData.message || 'Could not initiate biometric challenge');
      }

      const { challenge, allowCredentials } = chalData;
      const challengeBuffer = Uint8Array.from(atob(challenge.replace(/-/g, '+').replace(/_/g, '/')), (c) => c.charCodeAt(0));

      const publicKeyCredentialRequestOptions: PublicKeyCredentialRequestOptions = {
        challenge: challengeBuffer,
        timeout: 60000,
        rpId: window.location.hostname,
        allowCredentials: allowCredentials.map((c: any) => ({
          id: Uint8Array.from(atob(c.id.replace(/-/g, '+').replace(/_/g, '/')), (x) => x.charCodeAt(0)),
          type: 'public-key',
          transports: c.transports,
        })),
        userVerification: 'required',
      };

      // 2. Trigger native Touch ID / Face ID / Passkey prompt
      const assertion = (await navigator.credentials.get({
        publicKey: publicKeyCredentialRequestOptions,
      })) as PublicKeyCredential | null;

      if (!assertion) {
        throw new Error('Biometric verification cancelled.');
      }

      const rawResponse = assertion.response as AuthenticatorAssertionResponse;
      const clientDataJSON = btoa(String.fromCharCode(...new Uint8Array(rawResponse.clientDataJSON)))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');

      // 3. Verify assertion with server
      const verifyRes = await fetch('/api/auth/2fa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'login-passkey-verify',
          tempToken,
          credentialId: assertion.id,
          clientDataJSON,
        }),
      });

      const verifyData = await verifyRes.json();
      if (!verifyRes.ok) {
        throw new Error(verifyData.message || 'Biometric verification failed');
      }

      localStorage.setItem('adminToken', verifyData.token);
      localStorage.setItem('adminEmail', verifyData.email);
      toast.success('Biometric passkey verified!');

      setIsSettingUp(true);
      setSetupMessage('Setting up the Admin Panel...');
      setTimeout(() => {
        router.replace('/');
      }, 500);
    } catch (err: any) {
      if (err.name === 'NotAllowedError') {
        toast.error('Biometric verification timed out or was dismissed.');
      } else {
        toast.error(err.message || 'Biometric authentication failed');
      }
      setLoading(false);
    }
  };

  // Transition screen when setting up panel
  if (isSettingUp) {
    return (
      <div className="min-h-screen bg-[#0c0d14] flex flex-col items-center justify-center p-6 text-center select-none relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-sm w-full space-y-6 flex flex-col items-center">
          <div className="relative">
            <div className="h-20 w-20 rounded-3xl bg-gradient-to-br from-red-600/20 via-rose-600/20 to-transparent border border-red-500/30 flex items-center justify-center text-red-400 shadow-2xl shadow-red-950/50">
              <FiShield className="h-10 w-10 text-red-400 animate-pulse" />
            </div>
            <span className="absolute -top-1 -right-1 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 border-2 border-[#0c0d14]" />
            </span>
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-bold text-white tracking-tight">Access Granted</h2>
            <p className="text-xs sm:text-sm text-slate-300 font-mono flex items-center justify-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
              <span>{setupMessage}</span>
            </p>
          </div>

          <div className="w-full bg-white/5 border border-white/10 rounded-full h-1.5 overflow-hidden">
            <div className="h-full bg-gradient-to-r from-red-600 via-rose-500 to-emerald-500 rounded-full animate-pulse w-3/4" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#09090b] flex flex-col items-center justify-center p-4 sm:p-6 relative overflow-hidden selection:bg-red-500 selection:text-white">
      {/* Background Ambience */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-rose-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md space-y-6 relative z-10">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-gradient-to-br from-red-600/20 via-rose-600/20 to-transparent border border-red-500/30 text-red-500 shadow-xl shadow-red-950/30 mb-2">
            <FiShield className="h-8 w-8" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Control Center
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 font-medium">
            Administrative Management &amp; Cloud Deployment Hub
          </p>
        </div>

        {/* Card Stage */}
        <div className="bg-[#12131c] border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl space-y-6">

          {/* ========================================================================= */}
          {/* STAGE 1: 2FA CHALLENGE VERIFICATION SCREEN */}
          {/* ========================================================================= */}
          {step === '2fa_challenge' ? (
            <div className="space-y-5">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <button
                  type="button"
                  onClick={() => {
                    setStep('email');
                    setTempToken('');
                  }}
                  className="text-xs text-slate-400 hover:text-white flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <FiArrowLeft className="h-3 w-3" />
                  <span>Back to Sign In</span>
                </button>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  Password OK
                </span>
              </div>

              <div className="text-center space-y-1">
                <h3 className="text-lg font-bold text-white tracking-tight flex items-center justify-center gap-2">
                  <FiShield className="h-4 w-4 text-red-400" />
                  <span>Two-Factor Authentication</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Verify your identity to complete administrative sign in.
                </p>
              </div>

              {/* Mode Switcher if both or passkey available */}
              {(twoFactorMethod === 'both' || twoFactorMethod === 'passkey') && (
                <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-black/40 border border-white/10">
                  <button
                    type="button"
                    onClick={() => setChallengeMode('passkey')}
                    className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      challengeMode === 'passkey'
                        ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-md'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <FaFingerprint className="h-3.5 w-3.5" />
                    <span>Touch ID / Passkey</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setChallengeMode('totp')}
                    className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      challengeMode === 'totp'
                        ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-md'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <FiSmartphone className="h-3.5 w-3.5" />
                    <span>Authenticator App</span>
                  </button>
                </div>
              )}

              {/* Option A: Passkey / Biometrics Challenge */}
              {challengeMode === 'passkey' && (
                <div className="space-y-4 pt-2 text-center">
                  <div className="p-6 rounded-2xl bg-black/50 border border-white/10 space-y-3">
                    <div className="h-16 w-16 rounded-3xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 mx-auto">
                      <FaFingerprint className="h-8 w-8 animate-pulse" />
                    </div>
                    <p className="text-xs text-slate-300">
                      Click below to verify with your registered device Touch ID, Face ID, or Security Key.
                    </p>
                  </div>

                  <button
                    type="button"
                    disabled={loading}
                    onClick={handleVerify2FAPasskey}
                    className="w-full py-3.5 px-4 rounded-xl font-bold text-sm bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white shadow-lg shadow-red-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {loading ? (
                      <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <FaFingerprint className="h-4 w-4" />
                        <span>Verify with Touch ID / Passkey</span>
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* Option B: TOTP Authenticator App Challenge */}
              {challengeMode === 'totp' && (
                <form onSubmit={handleVerify2FATOTP} className="space-y-4 pt-1">
                  <div className="space-y-1.5 text-center">
                    <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 font-semibold">
                      Enter 6-Digit Code from Authenticator App
                    </label>
                    <div className="relative">
                      <FiKey className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                      <input
                        ref={totpInputRef}
                        type="text"
                        inputMode="numeric"
                        maxLength={6}
                        autoFocus
                        value={totpCode}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                          setTotpCode(val);
                          if (val.length === 6) {
                            handleVerify2FATOTP(undefined, val);
                          }
                        }}
                        placeholder="&bull;&bull;&bull;&bull;&bull;&bull;"
                        className="w-full pl-10 pr-4 py-3 rounded-xl bg-black/40 border border-white/10 text-white text-center font-mono text-xl tracking-[0.4em] font-bold focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-colors"
                      />
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Open Google Authenticator, Microsoft Authenticator, or 1Password.
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={loading || totpCode.length !== 6}
                    className="w-full py-3.5 px-4 rounded-xl font-bold text-sm bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white shadow-lg shadow-red-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {loading ? (
                      <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <FiCheckCircle className="h-4 w-4" />
                        <span>Verify 2FA &amp; Access Dashboard</span>
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          ) : (
            <>
              {/* Mode Switcher Tabs */}
              <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-black/40 border border-white/10">
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('password');
                    setStep('email');
                  }}
                  className={`py-2 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    authMode === 'password'
                      ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Password Access
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('otp');
                    setStep('email');
                  }}
                  className={`py-2 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    authMode === 'otp'
                      ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  OTP Code Access
                </button>
              </div>

              {/* Mode A: Password Login Form */}
              {authMode === 'password' && (
                <form onSubmit={handlePasswordLogin} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 font-semibold">
                      Administrator Email
                    </label>
                    <div className="relative">
                      <FiMail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="admin@example.com"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-sm focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-colors font-mono"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 font-semibold">
                      Administrator Password
                    </label>
                    <div className="relative">
                      <FiLock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter security password"
                        className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-sm focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-colors font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors cursor-pointer"
                      >
                        {showPassword ? <FiEyeOff className="h-4 w-4" /> : <FiEye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 px-4 rounded-xl font-bold text-sm bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white shadow-lg shadow-red-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-2"
                  >
                    {loading ? (
                      <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <span>Verify &amp; Access Console</span>
                        <FiArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </button>
                </form>
              )}

              {/* Mode B: OTP Verification Step 1: Email */}
              {authMode === 'otp' && step === 'email' && (
                <form onSubmit={handleSendOTP} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 font-semibold">
                      Administrator Email
                    </label>
                    <div className="relative">
                      <FiMail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="admin@example.com"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-sm focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-colors font-mono"
                      />
                    </div>
                    <p className="text-[11px] text-slate-500">
                      A 6-digit one-time security code will be sent to your email.
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 px-4 rounded-xl font-bold text-sm bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white shadow-lg shadow-red-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {loading ? (
                      <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <span>Send Verification Code</span>
                        <FiArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </button>
                </form>
              )}

              {/* Mode B: OTP Verification Step 2: Code Verification */}
              {authMode === 'otp' && step === 'otp' && (
                <form onSubmit={(e) => handleVerifyOTP(e)} className="space-y-4">
                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setStep('email')}
                      className="text-xs text-slate-400 hover:text-white flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <FiArrowLeft className="h-3 w-3" />
                      <span>Change Email</span>
                    </button>
                    <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                      Code Dispatched
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 font-semibold text-center">
                      Enter 6-Digit Code
                    </label>
                    <div className="relative">
                      <FiKey className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                      <input
                        ref={otpInputRef}
                        type="text"
                        inputMode="numeric"
                        maxLength={6}
                        autoFocus
                        value={otp}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                          setOtp(val);
                          if (val.length === 6) {
                            handleVerifyOTP(undefined, val);
                          }
                        }}
                        placeholder="&bull;&bull;&bull;&bull;&bull;&bull;"
                        className="w-full pl-10 pr-4 py-3 rounded-xl bg-black/40 border border-white/10 text-white text-center font-mono text-xl tracking-[0.4em] font-bold focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-colors"
                      />
                    </div>
                    <p className="text-[11px] text-slate-400 text-center">
                      Verification sent to <span className="text-slate-200 font-mono font-medium">{email}</span>
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={loading || otp.length !== 6}
                    className="w-full py-3.5 px-4 rounded-xl font-bold text-sm bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white shadow-lg shadow-red-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {loading ? (
                      <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <FiCheckCircle className="h-4 w-4" />
                        <span>Verify &amp; Access Dashboard</span>
                      </>
                    )}
                  </button>

                  <div className="pt-1 text-center">
                    {resendCooldown > 0 ? (
                      <p className="text-xs text-slate-500 font-mono">
                        Resend available in {resendCooldown}s
                      </p>
                    ) : (
                      <button
                        type="button"
                        disabled={loading}
                        onClick={() => handleSendOTP()}
                        className="text-xs font-medium text-red-400 hover:text-red-300 inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <FiRotateCw className="h-3.5 w-3.5" />
                        <span>Resend Code</span>
                      </button>
                    )}
                  </div>
                </form>
              )}

              {/* Database Connectivity Status Indicator */}
              <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs font-mono">
                <span className="text-slate-500">Security Node:</span>
                <div className="flex items-center gap-2">
                  <span
                    className={`h-2 w-2 rounded-full ${
                      dbStatus?.connected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                    }`}
                  />
                  <span className={dbStatus?.connected ? 'text-emerald-400' : 'text-slate-400'}>
                    {dbStatus?.connected ? 'Database Connected' : 'Connecting DB...'}
                  </span>
                </div>
              </div>
            </>
          )}

        </div>

        {/* Security Disclaimers */}
        <p className="text-center text-[11px] text-slate-500 font-mono">
          Antigravity Security Shield &bull; AES-256 JWT Authenticated
        </p>
      </div>
    </div>
  );
}
