'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FiLock, FiMail, FiArrowRight, FiShield, FiDatabase, FiCheckCircle } from 'react-icons/fi';
import { toast } from 'sonner';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [dbStatus, setDbStatus] = useState<{ configured: boolean; connected: boolean; adminEmail: string } | null>(null);

  useEffect(() => {
    // If already authenticated, redirect
    const token = localStorage.getItem('adminToken');
    if (token) {
      router.push('/');
    }

    // Check DB status
    fetch('/api/auth')
      .then((res) => res.json())
      .then((data) => {
        setDbStatus({
          configured: Boolean(data.dbConfigured),
          connected: Boolean(data.dbConnected),
          adminEmail: data.adminEmail || '',
        });
        if (data.adminEmail) {
          setEmail(data.adminEmail);
        }
      })
      .catch(() => {});
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Authentication failed');
      }

      localStorage.setItem('adminToken', data.token);
      localStorage.setItem('adminEmail', data.email);
      toast.success('Authentication successful! Welcome to Admin Hub.');
      router.push('/');
    } catch (err: any) {
      toast.error(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        
        {/* Logo & Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-gradient-to-tr from-red-600 to-rose-500 shadow-xl shadow-red-500/20 text-white mb-2">
            <FiShield className="h-7 w-7" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Admin <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-rose-400">Control Center</span>
          </h1>
          <p className="text-sm text-slate-400">
            Unified Management for Portfolio & Apps Ecosystem
          </p>
        </div>

        {/* Login Form Card */}
        <div className="rounded-3xl bg-[#12131c]/90 border border-red-500/30 p-8 shadow-2xl backdrop-blur-xl space-y-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                Admin Email
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
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                Password
              </label>
              <div className="relative">
                <FiLock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-black/40 border border-white/10 text-white text-sm focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-colors"
                />
              </div>
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
                  <span>Authenticate Dashboard</span>
                  <FiArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          {/* Database Atlas Status Indicator */}
          <div className="pt-4 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1.5 font-medium">
              <FiDatabase className="h-3.5 w-3.5 text-red-500" />
              <span>MongoDB Atlas</span>
            </span>
            <span className="inline-flex items-center gap-1 font-mono text-[11px] text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Connected</span>
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
