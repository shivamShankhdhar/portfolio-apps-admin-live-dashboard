'use client';

import React, { useState } from 'react';
import {
  FiShield,
  FiX,
  FiCheck,
  FiCopy,
  FiSmartphone,
  FiCheckCircle,
  FiAlertCircle,
  FiTrash2,
  FiCpu,
} from 'react-icons/fi';
import { FaFingerprint } from 'react-icons/fa6';
import ConfirmDialog from './ConfirmDialog';
import {
  useTwoFactorStatus,
  useToggle2FA,
  useGenerateTotp,
  useVerifyTotp,
  useRegisterPasskey,
  useDeletePasskey,
  detectDeviceName,
} from '@/hooks/useTwoFactor';

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

  // TOTP local state
  const [totpSecret, setTotpSecret] = useState('');
  const [totpQrCode, setTotpQrCode] = useState('');
  const [testCode, setTestCode] = useState('');
  const [copiedSecret, setCopiedSecret] = useState(false);

  // Passkey local state
  const [showPasskeyModal, setShowPasskeyModal] = useState(false);
  const [detectedDevice, setDetectedDevice] = useState('');

  // TanStack Query Hooks
  const { data: twoFactorData } = useTwoFactorStatus({ enabled: isOpen });
  const toggle2FAMutation = useToggle2FA();
  const generateTotpMutation = useGenerateTotp();
  const verifyTotpMutation = useVerifyTotp();
  const registerPasskeyMutation = useRegisterPasskey();
  const deletePasskeyMutation = useDeletePasskey();

  const twoFactorEnabled = Boolean(twoFactorData?.twoFactorEnabled);
  const totpVerified = Boolean(twoFactorData?.totpVerified);
  const passkeys = twoFactorData?.passkeys || [];

  const handleToggle2FA = async (enable: boolean) => {
    try {
      await toggle2FAMutation.mutateAsync(enable);
      if (onStatusChange) onStatusChange(enable);
    } catch {
      // Handled in mutation
    }
  };

  const handleGenerateTotp = async () => {
    try {
      const data = await generateTotpMutation.mutateAsync();
      setTotpSecret(data.secret);
      setTotpQrCode(data.qrCode);
      setTestCode('');
    } catch {
      // Handled in mutation
    }
  };

  const handleVerifyTotp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testCode || testCode.trim().length !== 6) {
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
      // Handled in mutation
    }
  };

  const handleRegisterPasskey = async () => {
    try {
      await registerPasskeyMutation.mutateAsync(detectedDevice);
      setShowPasskeyModal(false);
      setDetectedDevice('');
    } catch {
      // Handled in mutation
    }
  };

  const handleDeletePasskey = async (credentialId: string) => {
    try {
      await deletePasskeyMutation.mutateAsync(credentialId);
    } catch {
      // Handled in mutation
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
                disabled={toggle2FAMutation.isPending}
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
                      disabled={generateTotpMutation.isPending}
                      className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer"
                    >
                      {generateTotpMutation.isPending ? 'Generating...' : 'Reconfigure'}
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
                        placeholder="••••••"
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
                        disabled={verifyTotpMutation.isPending || testCode.length !== 6}
                        className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white shadow-lg shadow-red-600/30 transition-all cursor-pointer disabled:opacity-50"
                      >
                        {verifyTotpMutation.isPending ? 'Verifying...' : 'Verify & Enable'}
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
                    disabled={generateTotpMutation.isPending}
                    className="px-4 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white shadow-lg shadow-red-600/30 transition-all cursor-pointer"
                  >
                    {generateTotpMutation.isPending ? 'Generating QR Code...' : 'Set Up Authenticator App'}
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
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 shrink-0">
                      <FaFingerprint className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">Biometric Passkey Registration</p>
                      <p className="text-[11px] text-slate-400">
                        Touch ID, Face ID, Windows Hello, or FIDO2 Security Keys.
                      </p>
                    </div>
                  </div>
                  {passkeys.length < 3 ? (
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
                  ) : (
                    <span className="shrink-0 text-[10px] font-mono text-amber-400/80 text-right">
                      Limit<br />Reached
                    </span>
                  )}
                </div>
                {passkeys.length >= 3 && (
                  <p className="text-[11px] text-amber-400/80 font-mono">
                    Maximum of 3 devices allowed. Remove one to register a new device.
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
                          disabled={deletePasskeyMutation.isPending}
                          title="Remove Passkey"
                          className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-all cursor-pointer disabled:opacity-50"
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

      {/* Passkey Registration Confirmation */}
      <ConfirmDialog
        open={showPasskeyModal}
        onOpenChange={(open) => {
          if (!open) {
            setShowPasskeyModal(false);
            setDetectedDevice('');
          }
        }}
        title="Register Biometric Device"
        description="Your device will prompt for Touch ID, Face ID, or Windows Hello to register this passkey."
        confirmLabel={registerPasskeyMutation.isPending ? 'Follow device prompt...' : 'Continue with Biometrics'}
        cancelLabel="Cancel"
        variant="default"
        loading={registerPasskeyMutation.isPending}
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
