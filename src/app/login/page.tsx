'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  FiShield,
  FiMail,
  FiKey,
  FiArrowRight,
  FiArrowLeft,
  FiRotateCw,
  FiDatabase,
  FiCheckCircle,
} from 'react-icons/fi';
import { toast } from 'sonner';

export default function LoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [devOtpHint, setDevOtpHint] = useState<string | null>(null);
  const [dbStatus, setDbStatus] = useState<{ configured: boolean; connected: boolean } | null>(null);
  const otpInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // If already authenticated, redirect to dashboard
    const token = localStorage.getItem('adminToken');
    if (token) {
      router.push('/');
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

  // Focus OTP input on transition
  useEffect(() => {
    if (step === 'otp') {
      setTimeout(() => otpInputRef.current?.focus(), 150);
    }
  }, [step]);

  // 1. Send OTP Request
  const handleSendOTP = async (e?: React.FormEvent, overrideEmail?: string) => {
    if (e) e.preventDefault();
    const targetEmail = (overrideEmail || email).trim().toLowerCase();

    if (!targetEmail) {
      toast.error('Please enter an admin email address');
      return;
    }

    setLoading(true);
    setDevOtpHint(null);

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
        throw new Error(data.message || 'Failed to send OTP');
      }

      if (data.devOtp) {
        setDevOtpHint(data.devOtp);
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

  // 2. Verify OTP Request
  const handleVerifyOTP = async (e?: React.FormEvent, manualOtp?: string) => {
    if (e) e.preventDefault();
    const codeToVerify = (manualOtp || otp).replace(/\D/g, '').trim();

    if (!codeToVerify) {
      toast.error('Please enter the 6-digit OTP code');
      return;
    }

    if (codeToVerify.length !== 6) {
      toast.error('OTP code must be exactly 6 digits');
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
        throw new Error(data.message || 'Invalid or expired OTP');
      }

      localStorage.setItem('adminToken', data.token);
      localStorage.setItem('adminEmail', data.email);
      toast.success('Authentication successful! Welcome to Admin Hub.');
      router.push('/');
    } catch (err: any) {
      toast.error(err.message || 'OTP verification failed');
    } finally {
      setLoading(false);
    }
  };

  // Quick auto-fill & verify
  const handleAutoFillAndVerify = (code: string) => {
    setOtp(code);
    handleVerifyOTP(undefined, code);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-[#09090b]">
      {/* Background Ambient Glows */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-red-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-rose-600/15 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md space-y-6 relative z-10">
        {/* Logo & Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-gradient-to-tr from-red-600 to-rose-500 shadow-xl shadow-red-500/20 text-white mb-2">
            <FiShield className="h-7 w-7" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Admin <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-rose-400">Control Center</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Secure One-Time Passcode (OTP) Authentication
          </p>
        </div>

        {/* Login Form Card */}
        <div className="rounded-3xl bg-[#12131c]/90 border border-red-500/30 p-7 sm:p-8 shadow-2xl backdrop-blur-xl space-y-6">
          {step === 'email' ? (
            /* STEP 1: ENTER ADMIN EMAIL */
            <form onSubmit={handleSendOTP} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                  Admin Email Address
                </label>
                <div className="relative">
                  <FiMail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@example.com"
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-black/40 border border-white/10 text-white text-sm focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-colors"
                  />
                </div>
                <p className="text-[11px] text-slate-400">
                  A 6-digit verification passcode will be issued to this email.
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-4 rounded-xl font-bold text-sm bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white shadow-lg shadow-red-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
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
          ) : (
            /* STEP 2: ENTER OTP CODE */
            <form onSubmit={handleVerifyOTP} className="space-y-5">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                    6-Digit OTP Passcode
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setStep('email');
                      setOtp('');
                      setDevOtpHint(null);
                    }}
                    className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <FiArrowLeft className="h-3 w-3" />
                    <span>Change Email</span>
                  </button>
                </div>

                <div className="relative">
                  <FiKey className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
                  <input
                    ref={otpInputRef}
                    type="text"
                    required
                    maxLength={6}
                    value={otp}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                      setOtp(val);
                      if (val.length === 6) {
                        handleVerifyOTP(undefined, val);
                      }
                    }}
                    placeholder="123456"
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-black/40 border border-white/10 text-white text-center font-mono text-xl tracking-[0.4em] font-bold focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-colors"
                  />
                </div>

                <p className="text-[11px] text-slate-400">
                  Verification sent to <span className="text-slate-200 font-mono font-medium">{email}</span>
                </p>
              </div>

              {/* Dev Auto-Fill Helper Chip */}
              {devOtpHint && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/25 flex items-center justify-between gap-2">
                  <div className="text-xs">
                    <span className="text-slate-400">Active Code: </span>
                    <span className="font-mono font-bold text-red-400">{devOtpHint}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleAutoFillAndVerify(devOtpHint)}
                    className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-red-600 hover:bg-red-500 text-white transition-colors cursor-pointer"
                  >
                    Auto-Fill & Verify
                  </button>
                </div>
              )}

              {/* Submit Button */}
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
                    <span>Verify & Access Dashboard</span>
                  </>
                )}
              </button>

              {/* Resend OTP Action */}
              <div className="pt-2 text-center">
                {resendCooldown > 0 ? (
                  <p className="text-xs text-slate-500 font-mono">
                    Resend code available in {resendCooldown}s
                  </p>
                ) : (
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => handleSendOTP(undefined, email)}
                    className="text-xs font-medium text-red-400 hover:text-red-300 inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <FiRotateCw className="h-3.5 w-3.5" />
                    <span>Resend OTP Code</span>
                  </button>
                )}
              </div>
            </form>
          )}

          {/* Database Atlas Status Indicator */}
          <div className="pt-4 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1.5 font-medium">
              <FiDatabase className="h-3.5 w-3.5 text-red-500" />
              <span>MongoDB Atlas</span>
            </span>
            <span className="inline-flex items-center gap-1 font-mono text-[11px] text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>{dbStatus?.connected ? 'Connected' : 'Active'}</span>
            </span>
          </div>
        </div>

        {/* Footer info */}
        <p className="text-center text-xs text-slate-500">
          Shivam Shankhdhar &bull; Production Admin v1.0
        </p>
      </div>
    </div>
  );
}
