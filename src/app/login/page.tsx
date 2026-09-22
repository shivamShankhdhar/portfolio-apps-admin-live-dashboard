'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  FiShield,
  FiTerminal,
  FiEye,
  FiEyeOff,
  FiSmartphone,
  FiRotateCw,
} from 'react-icons/fi';
import { FaFingerprint } from 'react-icons/fa6';

interface TerminalLog {
  id: string;
  type: 'system' | 'user' | 'info' | 'success' | 'error' | 'warning' | 'prompt';
  text: string;
}

type TerminalStep =
  | 'email'
  | 'password'
  | 'checking'
  | 'failed'
  | '2fa_select'
  | '2fa_totp'
  | '2fa_passkey_waiting'
  | 'success_redirect';

export default function TerminalLoginPage() {
  const router = useRouter();

  // Terminal state
  const [logs, setLogs] = useState<TerminalLog[]>([
    {
      id: 'boot-1',
      type: 'system',
      text: '================================================================================',
    },
    {
      id: 'boot-2',
      type: 'system',
      text: 'PORTFOLIO ADMINISTRATIVE GATEWAY // HOST: PROD-NODE-01 // TLS 1.3 ACTIVE',
    },
    {
      id: 'boot-3',
      type: 'system',
      text: '================================================================================',
    },
    {
      id: 'boot-4',
      type: 'info',
      text: '[SYS] Architecture: Darwin x86_64 / Node.js Engine / MongoDB Atlas Connected',
    },
    {
      id: 'boot-5',
      type: 'info',
      text: '[SYS] Security Protocol: Dual-Layer Authentication Gate (Password + 2FA / WebAuthn)',
    },
    {
      id: 'boot-6',
      type: 'warning',
      text: '[!] Unauthorized access strictly monitored and recorded with client telemetry.',
    },
    {
      id: 'boot-7',
      type: 'system',
      text: '--------------------------------------------------------------------------------',
    },
  ]);

  const [step, setStep] = useState<TerminalStep>('email');
  const [inputVal, setInputVal] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Auth credentials collected in terminal
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [tempToken, setTempToken] = useState('');

  // 2FA options detected dynamically for this specific email
  const [available2FAMethods, setAvailable2FAMethods] = useState<
    { optionNumber: string; type: 'passkey' | 'totp'; label: string; desc: string }[]
  >([]);

  const terminalEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll terminal to bottom whenever logs update
  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs, step]);

  // Keep terminal input focused
  useEffect(() => {
    inputRef.current?.focus();
  }, [step]);

  // Check if already authenticated on initial load
  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (token) {
      addLog('info', '[~] Existing session token detected in local storage. Validating...');
      fetch('/api/auth', { headers: { Authorization: `Bearer ${token}` } })
        .then((res) => res.json())
        .then((data) => {
          if (data.authenticated) {
            addLog('success', `[✓] Session valid: Authenticated as ${data.email || 'Super Administrator'}`);
            addLog('info', '[~] Launching Control Center...');
            setStep('success_redirect');
            setTimeout(() => router.replace('/'), 600);
          } else {
            localStorage.removeItem('adminToken');
            addLog('warning', '[!] Prior session token expired or terminated. Please authenticate.');
          }
        })
        .catch(() => {
          localStorage.removeItem('adminToken');
        });
    }
  }, [router]);

  const addLog = (
    type: TerminalLog['type'],
    text: string
  ) => {
    setLogs((prev) => [
      ...prev,
      {
        id: `${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        type,
        text,
      },
    ]);
  };

  // 1. Password Verification Handler
  const verifyPasswordAuth = async (targetEmail: string, targetPass: string) => {
    setStep('checking');
    setLoading(true);

    addLog('info', '[~] Handshaking with authentication authority...');
    addLog('info', `[~] Checking administrative credentials for <${targetEmail}>...`);

    try {
      // Simulate realistic terminal verification delay
      await new Promise((r) => setTimeout(r, 450));

      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'password',
          email: targetEmail,
          password: targetPass,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Authentication failed: Invalid credentials');
      }

      addLog('success', '[✓] Primary credentials verified successfully.');

      // Check if Two-Factor Authentication is required for this email
      if (data.requires2FA) {
        setTempToken(data.tempToken);

        addLog('warning', '[!] SECONDARY CHALLENGE: Two-Factor Authentication (2FA) is enforced.');
        addLog('info', '--------------------------------------------------------------------------------');
        addLog('info', 'Available 2FA Methods registered for this account:');

        const methods: { optionNumber: string; type: 'passkey' | 'totp'; label: string; desc: string }[] = [];
        let optIndex = 1;

        // Only show options that are ACTUALLY registered for this email
        if (data.hasPasskeys) {
          methods.push({
            optionNumber: String(optIndex++),
            type: 'passkey',
            label: 'Biometric Passkey',
            desc: 'Hardware Touch ID / Face ID / Platform Security Key',
          });
        }

        if (data.hasTotp) {
          methods.push({
            optionNumber: String(optIndex++),
            type: 'totp',
            label: 'Authenticator App (TOTP)',
            desc: '6-digit time-based code from Google Authenticator',
          });
        }

        // Fallback if requires2FA is true but specific flags weren't detailed
        if (methods.length === 0) {
          if (data.twoFactorMethod === 'passkey') {
            methods.push({
              optionNumber: '1',
              type: 'passkey',
              label: 'Biometric Passkey',
              desc: 'Hardware Touch ID / Face ID',
            });
          } else {
            methods.push({
              optionNumber: '1',
              type: 'totp',
              label: 'Authenticator App (TOTP)',
              desc: '6-digit time-based code from Google Authenticator',
            });
          }
        }

        setAvailable2FAMethods(methods);

        methods.forEach((m) => {
          addLog('info', `  [${m.optionNumber}] ${m.label} — ${m.desc}`);
        });

        addLog('info', '--------------------------------------------------------------------------------');
        addLog(
          'prompt',
          `admin@gateway:~$ Select option [${methods.map((m) => m.optionNumber).join('/')}]:`
        );

        setStep('2fa_select');
        setLoading(false);
        setInputVal('');
        return;
      }

      // No 2FA required: Direct authorized session
      localStorage.setItem('adminToken', data.token);
      localStorage.setItem('adminEmail', data.email);

      addLog('success', '[✓] Identity confirmed. Super Administrator role granted.');
      addLog('success', '[✓] Cryptographic session token issued.');
      addLog('info', '[~] Launching Control Center...');

      setStep('success_redirect');
      setTimeout(() => router.replace('/'), 700);
    } catch (err: any) {
      addLog('error', `[✗] ERROR: 401 Unauthorized — ${err.message || 'Invalid credentials.'}`);
      addLog('warning', '[!] Authentication aborted.');
      addLog('prompt', 'admin@gateway:~$ Press Enter or click Restart to retry...');

      setStep('failed');
      setLoading(false);
      setInputVal('');
    }
  };

  // 2. WebAuthn Biometric Passkey Handler
  const triggerBiometricPasskey = async () => {
    if (typeof window === 'undefined' || !window.PublicKeyCredential) {
      addLog('error', '[✗] WebAuthn / Passkeys are not supported in this browser.');
      return;
    }

    setStep('2fa_passkey_waiting');
    setLoading(true);

    addLog('info', '[~] Requesting cryptographic WebAuthn challenge from server...');

    try {
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
      const challengeBuffer = Uint8Array.from(
        atob(challenge.replace(/-/g, '+').replace(/_/g, '/')),
        (c) => c.charCodeAt(0)
      );

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

      addLog('info', '[~] Prompting hardware biometric device (Touch ID / Face ID)...');

      const assertion = (await navigator.credentials.get({
        publicKey: publicKeyCredentialRequestOptions,
      })) as PublicKeyCredential | null;

      if (!assertion) {
        throw new Error('Biometric verification cancelled.');
      }

      addLog('info', '[~] Biometric assertion captured. Verifying signature with server...');

      const rawResponse = assertion.response as AuthenticatorAssertionResponse;
      const clientDataJSON = btoa(String.fromCharCode(...new Uint8Array(rawResponse.clientDataJSON)))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');

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

      addLog('success', '[✓] Biometric assertion validated successfully!');
      addLog('success', '[✓] Super Administrator session authorized.');
      addLog('info', '[~] Launching Control Center...');

      setStep('success_redirect');
      setTimeout(() => router.replace('/'), 700);
    } catch (err: any) {
      if (err.name === 'NotAllowedError') {
        addLog('warning', '[!] Biometric verification prompt was dismissed or timed out.');
      } else {
        addLog('error', `[✗] Biometric failure: ${err.message || 'Verification rejected'}`);
      }

      addLog(
        'prompt',
        `admin@gateway:~$ Select option [${available2FAMethods.map((m) => m.optionNumber).join('/')}] or type "retry":`
      );

      setStep('2fa_select');
      setLoading(false);
      setInputVal('');
    }
  };

  // 3. TOTP Verification Handler
  const verifyTotpCode = async (code: string) => {
    const cleanCode = code.replace(/\D/g, '').trim();
    if (cleanCode.length !== 6) {
      addLog('error', '[✗] Error: 6-digit code is required. Please check your Authenticator app.');
      addLog('prompt', 'admin@gateway:~$ Enter 6-digit Authenticator code:');
      setInputVal('');
      return;
    }

    setStep('checking');
    setLoading(true);

    addLog('info', `[~] Verifying one-time security code [${cleanCode}]...`);

    try {
      const res = await fetch('/api/auth/2fa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'login-verify-totp',
          tempToken,
          code: cleanCode,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Invalid or expired 6-digit code');
      }

      localStorage.setItem('adminToken', data.token);
      localStorage.setItem('adminEmail', data.email);

      addLog('success', '[✓] Two-Factor TOTP code verified successfully!');
      addLog('success', '[✓] Super Administrator session authorized.');
      addLog('info', '[~] Launching Control Center...');

      setStep('success_redirect');
      setTimeout(() => router.replace('/'), 700);
    } catch (err: any) {
      addLog('error', `[✗] Error: ${err.message || 'Verification failed.'}`);
      addLog('prompt', 'admin@gateway:~$ Enter 6-digit Authenticator code (or type "back"):');

      setStep('2fa_totp');
      setLoading(false);
      setInputVal('');
    }
  };

  // Handle Terminal Form Submit
  const handleTerminalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    const trimmed = inputVal.trim();

    // Built-in terminal commands
    if (trimmed.toLowerCase() === 'clear') {
      setLogs([
        {
          id: `clear-${Date.now()}`,
          type: 'system',
          text: 'PORTFOLIO ADMINISTRATIVE GATEWAY // TERMINAL BUFFER CLEARED',
        },
      ]);
      setInputVal('');
      return;
    }

    if (trimmed.toLowerCase() === 'restart' || trimmed.toLowerCase() === 'reset') {
      restartSession();
      return;
    }

    if (trimmed.toLowerCase() === 'help') {
      addLog('user', `> ${trimmed}`);
      addLog('info', 'Supported Terminal Commands:');
      addLog('info', '  clear    - Clear terminal log buffer');
      addLog('info', '  restart  - Reboot authentication session to email prompt');
      addLog('info', '  help     - Display this command manual');
      setInputVal('');
      return;
    }

    // Step: Failed -> User presses Enter to restart
    if (step === 'failed') {
      restartSession();
      return;
    }

    // Step 1: Email Prompt
    if (step === 'email') {
      if (!trimmed) {
        addLog('error', '[✗] Error: Administrative email is required.');
        addLog('prompt', 'admin@gateway:~$ Enter administrative email:');
        return;
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(trimmed)) {
        addLog('user', `> ${trimmed}`);
        addLog('error', '[✗] Error: Invalid email syntax. Please enter a valid address.');
        addLog('prompt', 'admin@gateway:~$ Enter administrative email:');
        setInputVal('');
        return;
      }

      addLog('user', `> ${trimmed}`);
      setEmail(trimmed.toLowerCase());
      addLog('prompt', `admin@gateway:~$ Enter password for <${trimmed.toLowerCase()}>:`);
      setStep('password');
      setInputVal('');
      return;
    }

    // Step 2: Password Prompt
    if (step === 'password') {
      if (!trimmed) {
        addLog('error', '[✗] Error: Password cannot be blank.');
        addLog('prompt', `admin@gateway:~$ Enter password for <${email}>:`);
        return;
      }

      addLog('user', `> ${'•'.repeat(trimmed.length)}`);
      setPassword(trimmed);
      setInputVal('');
      verifyPasswordAuth(email, trimmed);
      return;
    }

    // Step 3: 2FA Selection
    if (step === '2fa_select') {
      addLog('user', `> ${trimmed}`);

      if (trimmed.toLowerCase() === 'retry') {
        const passkeyMethod = available2FAMethods.find((m) => m.type === 'passkey');
        if (passkeyMethod) {
          triggerBiometricPasskey();
          return;
        }
      }

      const selectedMethod = available2FAMethods.find((m) => m.optionNumber === trimmed);

      if (!selectedMethod) {
        addLog('error', `[✗] Unrecognized option "${trimmed}".`);
        addLog(
          'prompt',
          `admin@gateway:~$ Select option [${available2FAMethods.map((m) => m.optionNumber).join('/')}]:`
        );
        setInputVal('');
        return;
      }

      setInputVal('');

      if (selectedMethod.type === 'passkey') {
        triggerBiometricPasskey();
      } else if (selectedMethod.type === 'totp') {
        addLog('info', '[~] Selected: Authenticator App (TOTP).');
        addLog('prompt', 'admin@gateway:~$ Enter 6-digit Authenticator code:');
        setStep('2fa_totp');
      }
      return;
    }

    // Step 4: 2FA TOTP Code Entry
    if (step === '2fa_totp') {
      addLog('user', `> ${trimmed}`);

      if (trimmed.toLowerCase() === 'back') {
        addLog(
          'prompt',
          `admin@gateway:~$ Select option [${available2FAMethods.map((m) => m.optionNumber).join('/')}]:`
        );
        setStep('2fa_select');
        setInputVal('');
        return;
      }

      verifyTotpCode(trimmed);
    }
  };

  const restartSession = () => {
    setEmail('');
    setPassword('');
    setTempToken('');
    setAvailable2FAMethods([]);
    setStep('email');
    setLoading(false);
    setInputVal('');

    setLogs([
      {
        id: `restart-${Date.now()}`,
        type: 'system',
        text: 'PORTFOLIO ADMINISTRATIVE GATEWAY // SESSION REINITIALIZED',
      },
      {
        id: `restart-2-${Date.now()}`,
        type: 'info',
        text: '[SYS] Ready for administrative authentication.',
      },
      {
        id: `restart-3-${Date.now()}`,
        type: 'prompt',
        text: 'admin@gateway:~$ Enter administrative email:',
      },
    ]);
  };

  return (
    <div className="min-h-screen bg-[#07080D] flex items-center justify-center p-3 sm:p-6 lg:p-10 font-mono text-xs sm:text-sm select-none antialiased relative overflow-hidden">
      {/* Background terminal matrix glow with subtle crimson ambient light */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-red-600/5 rounded-full blur-[130px] pointer-events-none" />
      <div className="fixed inset-0 pointer-events-none opacity-20 bg-[radial-gradient(#271015_1px,transparent_1px)] [background-size:16px_16px]" />

      {/* Red & Black Terminal Window Frame */}
      <div className="relative w-full max-w-4xl bg-[#090A10] border border-red-500/20 rounded-2xl shadow-2xl shadow-black/95 overflow-hidden flex flex-col h-[85vh] max-h-[760px]">
        {/* Terminal Header Bar */}
        <div className="shrink-0 bg-[#0E1018] border-b border-red-500/20 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-[#EF4444] border border-[#DC2626]/60 inline-block shadow-xs shadow-red-900/50" />
            <span className="h-3 w-3 rounded-full bg-[#F59E0B] border border-[#D97706]/60 inline-block" />
            <span className="h-3 w-3 rounded-full bg-[#10B981] border border-[#059669]/60 inline-block" />
          </div>

          <div className="flex items-center gap-2 text-slate-300 text-xs font-semibold">
            <FiTerminal className="h-3.5 w-3.5 text-red-500" />
            <span>admin@portfolio-security-gateway: ~</span>
          </div>

          <div className="flex items-center gap-3 text-[11px] text-slate-400">
            <span className="hidden sm:inline font-mono">TLS 1.3</span>
            <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" title="Gateway Online" />
          </div>
        </div>

        {/* Terminal Logs Canvas */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-2 font-mono custom-scrollbar text-[#E2E8F0]">
          {logs.map((log) => {
            if (log.type === 'system') {
              return (
                <div key={log.id} className="text-[#52525B] select-none text-[11px] sm:text-xs">
                  {log.text}
                </div>
              );
            }
            if (log.type === 'info') {
              return (
                <div key={log.id} className="text-slate-300">
                  {log.text}
                </div>
              );
            }
            if (log.type === 'success') {
              return (
                <div key={log.id} className="text-[#34D399] font-bold">
                  {log.text}
                </div>
              );
            }
            if (log.type === 'error') {
              return (
                <div key={log.id} className="text-red-400 font-bold">
                  {log.text}
                </div>
              );
            }
            if (log.type === 'warning') {
              return (
                <div key={log.id} className="text-rose-400">
                  {log.text}
                </div>
              );
            }
            if (log.type === 'user') {
              return (
                <div key={log.id} className="text-white font-bold pl-2 border-l-2 border-red-500/60">
                  {log.text}
                </div>
              );
            }
            return (
              <div key={log.id} className="text-red-400 font-semibold mt-2">
                {log.text}
              </div>
            );
          })}

          {/* Active Prompt Line */}
          {step !== 'success_redirect' && (
            <div className="pt-2">
              <div className="text-red-400 font-semibold mb-1">
                {step === 'email' && 'admin@gateway:~$ Enter administrative email:'}
                {step === 'password' && `admin@gateway:~$ Enter password for <${email}>:`}
                {step === '2fa_select' &&
                  `admin@gateway:~$ Select option [${available2FAMethods.map((m) => m.optionNumber).join('/')}]:`}
                {step === '2fa_totp' && 'admin@gateway:~$ Enter 6-digit Authenticator code:'}
                {step === '2fa_passkey_waiting' && 'admin@gateway:~$ Awaiting biometric verification on device...'}
                {step === 'checking' && 'admin@gateway:~$ [~] Verifying credentials with authorization authority...'}
                {step === 'failed' && 'admin@gateway:~$ Press Enter to restart authentication session...'}
              </div>

              {/* Terminal Interactive Input Form */}
              {step !== 'checking' && step !== '2fa_passkey_waiting' && (
                <form onSubmit={handleTerminalSubmit} className="flex items-center gap-2 text-white">
                  <span className="text-red-500 select-none font-bold">&gt;</span>
                  <input
                    ref={inputRef}
                    type={step === 'password' && !showPassword ? 'password' : 'text'}
                    value={inputVal}
                    onChange={(e) => setInputVal(e.target.value)}
                    disabled={loading}
                    autoComplete="off"
                    autoCapitalize="off"
                    spellCheck="false"
                    placeholder={
                      step === 'email'
                        ? 'Type your email and press Enter...'
                        : step === 'password'
                        ? 'Type administrator password...'
                        : step === '2fa_select'
                        ? 'Type 1 or 2 and press Enter...'
                        : step === '2fa_totp'
                        ? '123456'
                        : 'Press Enter...'
                    }
                    className="flex-1 bg-transparent border-none outline-none text-[#F8FAFC] font-mono text-xs sm:text-sm placeholder-slate-600 caret-red-500"
                  />

                  {step === 'password' && (
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-slate-500 hover:text-white px-2 py-1 text-xs cursor-pointer"
                      title={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <FiEyeOff className="h-3.5 w-3.5" /> : <FiEye className="h-3.5 w-3.5" />}
                    </button>
                  )}

                  <button
                    type="submit"
                    className="hidden sm:inline-block px-3 py-1 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white border border-red-500/30 rounded text-xs cursor-pointer transition-all shadow-sm shadow-red-950/50"
                  >
                    Enter ↵
                  </button>
                </form>
              )}
            </div>
          )}

          {/* Quick-action buttons when 2FA is needed or failed */}
          {step === '2fa_select' && (
            <div className="flex flex-wrap gap-2.5 pt-3">
              {available2FAMethods.map((m) => (
                <button
                  key={m.optionNumber}
                  type="button"
                  onClick={() => {
                    if (m.type === 'passkey') {
                      triggerBiometricPasskey();
                    } else {
                      addLog('info', '[~] Selected: Authenticator App (TOTP).');
                      addLog('prompt', 'admin@gateway:~$ Enter 6-digit Authenticator code:');
                      setStep('2fa_totp');
                    }
                  }}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-300 hover:text-white font-mono text-xs cursor-pointer transition-all shadow-sm shadow-red-950/40"
                >
                  {m.type === 'passkey' ? <FaFingerprint className="h-3.5 w-3.5 text-red-400" /> : <FiSmartphone className="h-3.5 w-3.5 text-red-400" />}
                  <span>Option [{m.optionNumber}]: {m.label}</span>
                </button>
              ))}
            </div>
          )}

          {step === 'failed' && (
            <div className="pt-2">
              <button
                type="button"
                onClick={restartSession}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-600/20 hover:bg-red-600/30 border border-red-500/40 text-red-300 hover:text-white font-mono text-xs cursor-pointer transition-all"
              >
                <FiRotateCw className="h-3.5 w-3.5" />
                <span>Restart Session</span>
              </button>
            </div>
          )}

          <div ref={terminalEndRef} />
        </div>

        {/* Terminal Status Footer */}
        <div className="shrink-0 bg-[#07080C] border-t border-red-500/20 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-[11px] text-slate-400">
          <div className="flex items-center gap-3">
            <span className="text-red-400">admin@gateway</span>
            <span>•</span>
            <span>Type <code className="text-white">clear</code> to clean</span>
            <span>•</span>
            <span>Type <code className="text-white">restart</code> to reboot</span>
          </div>

          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-red-400">
              <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
              <span>Auth Node Ready</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
