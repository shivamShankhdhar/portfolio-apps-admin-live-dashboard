'use client';

import React, { useState, useEffect } from 'react';
import {
  FiShield,
  FiX,
  FiCheck,
  FiCopy,
  FiSmartphone,
  FiCheckCircle,
  FiAlertCircle,
  FiTrash2,
  FiKey,
  FiRefreshCw,
  FiCpu,
} from 'react-icons/fi';
import { FaFingerprint } from 'react-icons/fa6';
import { toast } from 'sonner';
import ConfirmDialog from './ConfirmDialog';

interface PasskeyDevice {
  credentialId: string;
  deviceName: string;
  createdAt: string;
}

interface SecuritySettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStatusChange?: (enabled: boolean) => void;
}

export default function SecuritySettingsModal({
  isOpen,
  onClose,
  onStatusChange,
}: SecuritySettingsModalProps) {
  const [activeTab, setActiveTab] = useState<'totp' | 'passkey'>('totp');
  const [loading, setLoading] = useState(false);
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
  const [showPasskeyModal, setShowPasskeyModal] = useState(false);
  const [detectedDevice, setDetectedDevice] = useState('');

  // Auto-detect device name from browser user-agent
  const detectDeviceName = (): string => {
    if (typeof window === 'undefined') return 'Unknown Device';
    const ua = navigator.userAgent;
    let os = 'Unknown OS';
    let browser = 'Unknown Browser';

    if (/iPhone/.test(ua)) os = 'iPhone';
    else if (/iPad/.test(ua)) os = 'iPad';
    else if (/Macintosh|Mac OS X/.test(ua)) os = 'MacBook';
    else if (/Windows NT 10/.test(ua)) os = 'Windows 10';
    else if (/Windows NT/.test(ua)) os = 'Windows';
    else if (/Android/.test(ua)) os = 'Android';
    else if (/Linux/.test(ua)) os = 'Linux';

    if (/Edg\//.test(ua)) browser = 'Edge';
    else if (/Chrome\//.test(ua) && !/Chromium/.test(ua)) browser = 'Chrome';
    else if (/Firefox\//.test(ua)) browser = 'Firefox';
    else if (/Safari\//.test(ua) && !/Chrome/.test(ua)) browser = 'Safari';
    else if (/OPR\/|Opera/.test(ua)) browser = 'Opera';

    return `${os} · ${browser}`;
  };


  // Fetch current 2FA status
  const fetch2FAStatus = async () => {
    try {
      const token = localStorage.getItem('adminToken');
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
        if (onStatusChange) {
          onStatusChange(Boolean(data.twoFactorEnabled));
        }
      }
    } catch (err) {
      console.error('Error fetching 2FA status:', err);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetch2FAStatus();
    }
  }, [isOpen]);

  // Master Toggle 2FA
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
      if (onStatusChange) onStatusChange(enable);
    } catch (err: any) {
      toast.error(err.message || 'Error updating 2FA');
    } finally {
      setLoading(false);
    }
  };

  // Generate TOTP Secret & QR Code
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
        throw new Error(data.message || 'Failed to generate TOTP secret');
      }

      setTotpSecret(data.secret);
      setTotpQrCode(data.qrCode);
      setTestCode('');
    } catch (err: any) {
      toast.error(err.message || 'Error generating TOTP');
    } finally {
      setIsGeneratingTotp(false);
    }
  };

  // Verify and Confirm TOTP Activation
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

  // Register Passkey / Biometrics via WebAuthn
  const handleRegisterPasskey = async () => {
    if (typeof window === 'undefined' || !window.PublicKeyCredential) {
      toast.error('WebAuthn / Passkeys are not supported in this browser.');
      return;
    }

    setIsRegisteringPasskey(true);
    try {
      const token = localStorage.getItem('adminToken');

      // 1. Get Registration Challenge Options from Server
      const optRes = await fetch('/api/auth/2fa', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ action: 'passkey-register-options' }),
      });

      const optData = await optRes.json();
      if (!optRes.ok || !optData.options) {
        throw new Error(optData.message || 'Could not initiate passkey registration');
      }

      const { options } = optData;

      // Pure-JS base64url → Uint8Array<ArrayBuffer>: never calls atob, immune to all padding/encoding quirks
      const b64urlToUint8 = (b64url: string): Uint8Array<ArrayBuffer> => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
        const b64 = b64url.replace(/-/g, '+').replace(/_/g, '/');
        const stripped = b64.replace(/=/g, '');
        const padded = stripped + '==='.slice(0, (4 - (stripped.length % 4)) % 4);
        const out: number[] = [];
        for (let i = 0; i < padded.length; i += 4) {
          const a = chars.indexOf(padded[i]);
          const b = chars.indexOf(padded[i + 1]);
          const c = chars.indexOf(padded[i + 2]);
          const d = chars.indexOf(padded[i + 3]);
          out.push((a << 2) | (b >> 4));
          if (padded[i + 2] !== '=') out.push(((b & 0xf) << 4) | (c >> 2));
          if (padded[i + 3] !== '=') out.push(((c & 0x3) << 6) | d);
        }
        const buf = new ArrayBuffer(out.length);
        const view = new Uint8Array(buf);
        out.forEach((v, i) => { view[i] = v; });
        return view as Uint8Array<ArrayBuffer>;
      };

      const challengeBuffer = b64urlToUint8(options.challenge);
      const userIdBuffer = b64urlToUint8(options.user.id);

      const publicKeyCredentialCreationOptions: PublicKeyCredentialCreationOptions = {
        challenge: challengeBuffer,
        rp: options.rp,
        user: {
          id: userIdBuffer,
          name: options.user.name,
          displayName: options.user.displayName,
        },
        pubKeyCredParams: options.pubKeyCredParams,
        authenticatorSelection: options.authenticatorSelection,
        timeout: options.timeout,
        attestation: options.attestation,
      };

      // 2. Trigger Native Touch ID / Biometric / Passkey Prompt
      const credential = (await navigator.credentials.create({
        publicKey: publicKeyCredentialCreationOptions,
      })) as PublicKeyCredential | null;

      if (!credential) {
        throw new Error('Biometric passkey registration was cancelled.');
      }

      const rawResponse = credential.response as AuthenticatorAttestationResponse;
      const clientDataJSON = btoa(String.fromCharCode(...new Uint8Array(rawResponse.clientDataJSON)))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');

      // 3. Send Attestation to Server to Persist Passkey
      const verifyRes = await fetch('/api/auth/2fa', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          action: 'passkey-register-verify',
          credentialId: credential.id,
          clientDataJSON,
          deviceName: detectedDevice || detectDeviceName(),
        }),
      });

      const verifyData = await verifyRes.json();
      if (!verifyRes.ok) {
        throw new Error(verifyData.message || 'Server passkey verification failed');
      }

      toast.success(verifyData.message);
      setShowPasskeyModal(false);
      setDetectedDevice('');
      setTwoFactorEnabled(true);
      await fetch2FAStatus();
    } catch (err: any) {
      if (err.name === 'NotAllowedError') {
        toast.error('Passkey creation timed out or was dismissed.');
      } else {
        toast.error(err.message || 'Error registering passkey');
      }
    } finally {
      setIsRegisteringPasskey(false);
    }
  };

  // Delete Passkey
  const handleDeletePasskey = async (credentialId: string) => {
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

  if (!isOpen) return null;

  return (
    <>
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="w-full max-w-xl bg-[#12131c] border border-red-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 my-8 relative overflow-hidden">
        {/* Glow ambient */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4 relative z-10">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-red-500/15 border border-red-500/30 flex items-center justify-center text-red-400">
              <FiShield className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                <span>Two-Factor Authentication (2FA)</span>
              </h2>
              <p className="text-xs text-slate-400 font-mono">
                Hardened Security Protection &bull; TOTP &amp; Biometrics
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all cursor-pointer"
          >
            <FiX className="h-4 w-4" />
          </button>
        </div>

        {/* Master 2FA Toggle Bar */}
        <div className="p-4 rounded-2xl bg-black/40 border border-white/10 flex items-center justify-between gap-4 relative z-10">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                2FA Enforcement Status
              </span>
              <span
                className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                  twoFactorEnabled
                    ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                    : 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                }`}
              >
                {twoFactorEnabled ? 'Active (Protected)' : 'Inactive'}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Require secondary verification on administrative login attempts.
            </p>
          </div>

          <label className="relative inline-flex items-center cursor-pointer select-none">
            <input
              type="checkbox"
              disabled={loading}
              checked={twoFactorEnabled}
              onChange={(e) => handleToggle2FA(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600" />
          </label>
        </div>

        {/* Method Switcher Tabs */}
        <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-black/50 border border-white/10 relative z-10">
          <button
            type="button"
            onClick={() => setActiveTab('totp')}
            className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'totp'
                ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <FiSmartphone className="h-3.5 w-3.5" />
            <span>Authenticator App (TOTP)</span>
            {totpVerified && <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('passkey')}
            className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'passkey'
                ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <FaFingerprint className="h-3.5 w-3.5" />
            <span>Fingerprint / Passkeys</span>
            {passkeys.length > 0 && (
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 font-mono">
                {passkeys.length}
              </span>
            )}
          </button>
        </div>

        {/* Tab 1: Authenticator App (TOTP) */}
        {activeTab === 'totp' && (
          <div className="space-y-4 relative z-10">
            {totpVerified && !totpQrCode ? (
              <div className="p-4 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <FiCheckCircle className="h-5 w-5 text-emerald-400" />
                    <div>
                      <p className="text-xs font-bold text-white">Google Authenticator Configured</p>
                      <p className="text-[11px] text-slate-400">
                        Codes generated by your authenticator app will be required at login.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleGenerateTotp}
                    disabled={isGeneratingTotp}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer"
                  >
                    Reconfigure
                  </button>
                </div>
              </div>
            ) : totpQrCode ? (
              <div className="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-4">
                <div className="text-center space-y-1">
                  <p className="text-xs font-bold text-white">Scan with Google Authenticator or 1Password</p>
                  <p className="text-[11px] text-slate-400">
                    Open your authenticator app, tap Add Account, and scan the QR code below.
                  </p>
                </div>

                <div className="flex justify-center">
                  <div className="p-2 rounded-2xl bg-white shadow-xl">
                    <img src={totpQrCode} alt="TOTP QR Code" className="w-48 h-48 rounded-xl" />
                  </div>
                </div>

                {/* Manual Secret Code */}
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold text-center">
                    Or Enter Secret Manually
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={totpSecret}
                      className="flex-1 px-3 py-2 rounded-xl bg-black/60 border border-white/10 text-white text-xs font-mono text-center select-all focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(totpSecret);
                        setCopiedSecret(true);
                        setTimeout(() => setCopiedSecret(false), 2000);
                      }}
                      className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer"
                    >
                      {copiedSecret ? <FiCheck className="h-4 w-4 text-emerald-400" /> : <FiCopy className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* Test Verification Form */}
                <form onSubmit={handleVerifyTotp} className="space-y-3 pt-2 border-t border-white/10">
                  <div className="space-y-1 text-center">
                    <label className="block text-xs font-bold text-white uppercase font-mono">
                      Enter 6-Digit Code from App
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      value={testCode}
                      onChange={(e) => setTestCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="&bull;&bull;&bull;&bull;&bull;&bull;"
                      className="w-full max-w-[200px] mx-auto px-4 py-2.5 rounded-xl bg-black/60 border border-white/15 text-white text-center font-mono text-lg tracking-[0.3em] font-bold focus:outline-none focus:border-red-500"
                    />
                  </div>

                  <div className="flex gap-2">
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
                      {loading ? 'Verifying...' : 'Verify & Enable'}
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              <div className="p-6 rounded-2xl bg-black/40 border border-white/10 text-center space-y-4">
                <div className="h-12 w-12 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 mx-auto">
                  <FiSmartphone className="h-6 w-6" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-bold text-white">Google Authenticator Setup</p>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    Use industry-standard Time-based One-Time Passwords (TOTP). Compatible with Google Authenticator, Microsoft Authenticator, and 1Password.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleGenerateTotp}
                  disabled={isGeneratingTotp}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white shadow-lg shadow-red-600/30 transition-all cursor-pointer"
                >
                  {isGeneratingTotp ? 'Generating QR Code...' : 'Set Up Authenticator App'}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Fingerprint / Passkeys (WebAuthn) */}
        {activeTab === 'passkey' && (
          <div className="space-y-4 relative z-10">


            {/* Register Passkey Trigger Card */}
            <div className="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-3">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 shrink-0">
                  <FaFingerprint className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-white">Biometric Passkey Registration</p>
                  <p className="text-[11px] text-slate-400">
                    Authenticate instantly with Apple Touch ID, Face ID, Windows Hello, or FIDO2 Security Keys.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  const name = detectDeviceName();
                  setDetectedDevice(name);
                  setShowPasskeyModal(true);
                }}
                disabled={passkeys.length >= 3}
                className="w-full py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white shadow-lg shadow-red-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {passkeys.length >= 3 ? (
                  <span>Limit Reached (3 max)</span>
                ) : (
                  <><FaFingerprint className="h-3.5 w-3.5" /><span>Register Fingerprint / Passkey</span></>
                )}
              </button>
              {passkeys.length >= 3 && (
                <p className="text-[11px] text-amber-400/80 font-mono">
                  Maximum of 3 fingerprint / passkey devices allowed. Remove one to register a new device.
                </p>
              )}
            </div>

            {/* List of Registered Passkeys */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-slate-400 uppercase tracking-wider font-semibold">
                  Registered Security Keys &amp; Biometrics
                </span>
                <span className="text-slate-500">{passkeys.length} Registered</span>
              </div>

              {passkeys.length === 0 ? (
                <div className="p-4 rounded-xl bg-white/5 border border-white/5 text-center text-xs text-slate-400 font-mono">
                  No biometric passkeys registered yet. Click above to register your Touch ID or Security Key.
                </div>
              ) : (
                <div className="space-y-2">
                  {passkeys.map((p) => (
                    <div
                      key={p.credentialId}
                      className="p-3 rounded-xl bg-black/40 border border-white/10 flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-center gap-2.5">
                        <FaFingerprint className="h-4 w-4 text-emerald-400" />
                        <div>
                          <p className="font-bold text-white">{p.deviceName}</p>
                          <p className="text-[10px] font-mono text-slate-500">
                            Registered {new Date(p.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleDeletePasskey(p.credentialId)}
                        title="Remove Passkey"
                        className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-all cursor-pointer"
                      >
                        <FiTrash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Security Note Footer */}
        <div className="p-3 rounded-xl bg-white/5 border border-white/5 text-[11px] text-slate-400 flex items-start gap-2 relative z-10">
          <FiAlertCircle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
          <p className="leading-snug">
            Two-factor authentication adds cryptographic protection to your administrative credentials. Ensure you have an active Authenticator app or registered biometric device.
          </p>
        </div>
      </div>
    </div>

    {/* Passkey Registration Confirmation — same style as other confirm dialogs */}
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
    </>
  );
}
