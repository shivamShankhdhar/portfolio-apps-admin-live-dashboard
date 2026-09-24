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
  FiMaximize2,
  FiMinimize2,
  FiMinus,
  FiX,
  FiArrowUp,
  FiArrowDown,
  FiMove,
} from 'react-icons/fi';
import { FaFingerprint } from 'react-icons/fa6';
import { motion, useDragControls } from 'framer-motion';
import { useQueryClient } from '@tanstack/react-query';

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
  const queryClient = useQueryClient();
  const isSubmittingRef = useRef(false);

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
      id: 'boot-6b',
      type: 'info',
      text: '[SYS] Gateway Motto: "Simplicity is prerequisite for reliability. Measure twice, compile once, verify continuously."',
    },
    {
      id: 'boot-7',
      type: 'system',
      text: '--------------------------------------------------------------------------------',
    },
    {
      id: 'boot-8',
      type: 'prompt',
      text: 'admin@gateway:~$ Enter administrative email:',
    },
  ]);

  const [step, setStep] = useState<TerminalStep>('email');
  const [inputVal, setInputVal] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Window Controls State (Maximize, Minimize, Drag)
  const [isMaximized, setIsMaximized] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  // Auth credentials collected in terminal
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [tempToken, setTempToken] = useState('');

  // 2FA options detected dynamically for this specific email
  const [available2FAMethods, setAvailable2FAMethods] = useState<
    { optionNumber: string; type: 'passkey' | 'totp'; label: string; desc: string }[]
  >([]);

  const containerRef = useRef<HTMLDivElement>(null);
  const logsContainerRef = useRef<HTMLDivElement>(null);
  const latestPromptRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const hasCheckedAuthRef = useRef(false);
  const dragControls = useDragControls();

  // Auto-scroll the terminal log container so that the latest prompt/new value is smoothly scrolled to the top
  useEffect(() => {
    if (!logsContainerRef.current) return;

    const timer = setTimeout(() => {
      if (!logsContainerRef.current) return;

      // On initial boot sequence, show the top welcome banner
      if (logs.length <= 8 && step === 'email') {
        logsContainerRef.current.scrollTo({
          top: 0,
          behavior: 'smooth',
        });
        return;
      }

      if (latestPromptRef.current) {
        const container = logsContainerRef.current;
        const target = latestPromptRef.current;
        const containerRect = container.getBoundingClientRect();
        const targetRect = target.getBoundingClientRect();
        // Compute exact target scroll position within container
        const targetTopInContainer = targetRect.top - containerRect.top + container.scrollTop;
        const scrollTarget = Math.max(0, targetTopInContainer - 14);

        container.scrollTo({
          top: scrollTarget,
          behavior: 'smooth',
        });
      }
    }, 45);

    return () => clearTimeout(timer);
  }, [logs.length, step]);

  // Keep terminal input focused
  useEffect(() => {
    if (!isMinimized) {
      inputRef.current?.focus();
    }
  }, [step, isMinimized]);

  // Check if already authenticated on initial load
  useEffect(() => {
    if (hasCheckedAuthRef.current) return;
    hasCheckedAuthRef.current = true;

    const token = localStorage.getItem('adminToken');
    if (token) {
      addLog('info', '[~] Existing session token detected in local storage. Validating...');
      fetch('/api/auth', { headers: { Authorization: `Bearer ${token}` } })
        .then((res) => res.json())
        .then((data) => {
          if (data.authenticated) {
            queryClient.setQueryData(['auth', token], data);
            addLog('success', `[✓] Session valid: Authenticated as ${data.email || 'Super Administrator'}`);
            addLog('info', '[~] Launching Control Center...');
            setStep('success_redirect');
            setTimeout(() => {
              window.location.href = '/';
            }, 500);
          } else {
            localStorage.removeItem('adminToken');
            addLog('warning', '[!] Prior session token expired or terminated. Please authenticate.');
          }
        })
        .catch(() => {
          localStorage.removeItem('adminToken');
        });
    }
  }, [queryClient, router]);

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

        const rawMethods: { optionNumber: string; type: 'passkey' | 'totp'; label: string; desc: string }[] = [];
        let optIndex = 1;

        // Only show options that are ACTUALLY registered for this email
        if (data.hasPasskeys) {
          rawMethods.push({
            optionNumber: String(optIndex++),
            type: 'passkey',
            label: 'Biometric Passkey',
            desc: 'Hardware Touch ID / Face ID / Platform Security Key',
          });
        }

        if (data.hasTotp) {
          rawMethods.push({
            optionNumber: String(optIndex++),
            type: 'totp',
            label: 'Authenticator App (TOTP)',
            desc: '6-digit time-based code from Google Authenticator',
          });
        }

        // Fallback if requires2FA is true but specific flags weren't detailed
        if (rawMethods.length === 0) {
          if (data.twoFactorMethod === 'passkey') {
            rawMethods.push({
              optionNumber: '1',
              type: 'passkey',
              label: 'Biometric Passkey',
              desc: 'Hardware Touch ID / Face ID',
            });
          } else {
            rawMethods.push({
              optionNumber: '1',
              type: 'totp',
              label: 'Authenticator App (TOTP)',
              desc: '6-digit time-based code from Google Authenticator',
            });
          }
        }

        // Strictly deduplicate options by type
        const uniqueMethods: typeof rawMethods = [];
        const seenTypes = new Set<string>();
        for (const m of rawMethods) {
          if (!seenTypes.has(m.type)) {
            seenTypes.add(m.type);
            uniqueMethods.push({
              ...m,
              optionNumber: String(uniqueMethods.length + 1),
            });
          }
        }

        setAvailable2FAMethods(uniqueMethods);

        // If only 1 method is configured and it is TOTP, skip redundant selection step!
        if (uniqueMethods.length === 1 && uniqueMethods[0].type === 'totp') {
          addLog('warning', '[!] SECONDARY CHALLENGE: Two-Factor Authentication (TOTP) enforced.');
          addLog('info', '[~] Open Google Authenticator (or your TOTP app) for your 6-digit code.');
          addLog('prompt', 'admin@gateway:~$ Enter 6-digit Authenticator code:');
          setStep('2fa_totp');
          setLoading(false);
          setInputVal('');
          return;
        }

        // Multiple 2FA methods available
        addLog('warning', '[!] SECONDARY CHALLENGE: Two-Factor Authentication (2FA) is enforced.');
        addLog('info', '--------------------------------------------------------------------------------');
        addLog('info', 'Available 2FA Methods registered for this account:');

        uniqueMethods.forEach((m) => {
          addLog('info', `  [${m.optionNumber}] ${m.label} — ${m.desc}`);
        });

        addLog('info', '--------------------------------------------------------------------------------');
        addLog(
          'prompt',
          `admin@gateway:~$ Select option [${uniqueMethods.map((m) => m.optionNumber).join('/')}]:`
        );

        setStep('2fa_select');
        setLoading(false);
        setInputVal('');
        return;
      }

      // No 2FA required: Direct authorized session
      localStorage.setItem('adminToken', data.token);
      localStorage.setItem('adminEmail', data.email);

      queryClient.setQueryData(['auth', data.token], {
        authenticated: true,
        email: data.email,
        adminEmail: data.email,
        dbConfigured: true,
        dbConnected: true,
        smtpConfigured: true,
        adminDetails: null,
      });
      queryClient.invalidateQueries({ queryKey: ['auth'] });

      addLog('success', '[✓] Identity confirmed. Super Administrator role granted.');
      addLog('success', '[✓] Cryptographic session token issued.');
      addLog('info', '[~] Launching Control Center...');

      setStep('success_redirect');
      setTimeout(() => {
        window.location.href = '/';
      }, 500);
    } catch (err: any) {
      addLog('error', `[✗] ERROR: 401 Unauthorized — ${err.message || 'Invalid administrative credentials.'}`);
      addLog('prompt', `admin@gateway:~$ Enter password for <${targetEmail}>:`);

      setStep('password');
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

      queryClient.setQueryData(['auth', verifyData.token], {
        authenticated: true,
        email: verifyData.email,
        adminEmail: verifyData.email,
        dbConfigured: true,
        dbConnected: true,
        smtpConfigured: true,
        adminDetails: null,
      });
      queryClient.invalidateQueries({ queryKey: ['auth'] });

      addLog('success', '[✓] Biometric assertion validated successfully!');
      addLog('success', '[✓] Super Administrator session authorized.');
      addLog('info', '[~] Launching Control Center...');

      setStep('success_redirect');
      setTimeout(() => {
        window.location.href = '/';
      }, 500);
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

      queryClient.setQueryData(['auth', data.token], {
        authenticated: true,
        email: data.email,
        adminEmail: data.email,
        dbConfigured: true,
        dbConnected: true,
        smtpConfigured: true,
        adminDetails: null,
      });
      queryClient.invalidateQueries({ queryKey: ['auth'] });

      addLog('success', '[✓] Two-Factor TOTP code verified successfully!');
      addLog('success', '[✓] Super Administrator session authorized.');
      addLog('info', '[~] Launching Control Center...');

      setStep('success_redirect');
      setTimeout(() => {
        window.location.href = '/';
      }, 500);
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
    if (loading || isSubmittingRef.current) return;

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
        addLog('info', `[~] Option [${selectedMethod.optionNumber}] selected: Authenticator verification.`);
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

  // Active scroll anchor calculation: locate the latest prompt or preceding error
  const lastPromptIndex = logs.map((l) => l.type).lastIndexOf('prompt');
  const anchorIndex =
    lastPromptIndex > 0 && logs[lastPromptIndex - 1].type === 'error'
      ? lastPromptIndex - 1
      : lastPromptIndex !== -1
      ? lastPromptIndex
      : logs.length - 1;
  const activeScrollAnchorId = logs[anchorIndex]?.id;

  return (
    <div
      ref={containerRef}
      className="min-h-screen bg-[#07080D] flex items-center justify-center p-3 sm:p-6 lg:p-10 font-mono text-xs sm:text-sm select-none antialiased relative overflow-hidden"
    >
      {/* Background terminal matrix glow with subtle crimson ambient light */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-red-600/5 rounded-full blur-[130px] pointer-events-none" />
      <div className="fixed inset-0 pointer-events-none opacity-20 bg-[radial-gradient(#271015_1px,transparent_1px)] [background-size:16px_16px]" />

      {/* Red & Black Terminal Window Frame with Drag, Maximize, and Minimize */}
      <motion.div
        drag={!isMaximized}
        dragListener={false}
        dragControls={dragControls}
        dragConstraints={containerRef}
        dragElastic={0.05}
        dragMomentum={false}
        className={`transition-all duration-150 bg-[#090A10] border border-red-500/20 shadow-2xl shadow-black/95 flex flex-col ${
          isMaximized
            ? 'fixed inset-0 z-50 w-screen h-screen rounded-none border-0'
            : isMinimized
            ? 'relative w-full max-w-md rounded-xl shadow-red-950/40 border-red-500/40 overflow-hidden'
            : 'relative w-full max-w-4xl rounded-2xl h-[85vh] max-h-[760px] overflow-hidden'
        }`}
      >
        {/* Terminal Header Bar with Window Controls & Drag Handle */}
        <div className="shrink-0 bg-[#0E1018] border-b border-red-500/20 px-4 py-3 flex items-center justify-between gap-3">
          {/* macOS Style Traffic Light Control Dots */}
          <div className="flex items-center gap-2" onPointerDown={(e) => e.stopPropagation()}>
            {/* Red: Reset/Reboot */}
            <button
              type="button"
              onClick={restartSession}
              title="Reboot session / Clear"
              className="group relative h-3 w-3 rounded-full bg-[#EF4444] border border-[#DC2626]/60 flex items-center justify-center cursor-pointer shadow-xs shadow-red-900/50 hover:brightness-110"
            >
              <FiX className="h-2 w-2 text-black opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>

            {/* Yellow: Minimize */}
            <button
              type="button"
              onClick={() => {
                setIsMinimized(!isMinimized);
                if (isMaximized) setIsMaximized(false);
              }}
              title={isMinimized ? 'Restore terminal' : 'Minimize terminal'}
              className="group relative h-3 w-3 rounded-full bg-[#F59E0B] border border-[#D97706]/60 flex items-center justify-center cursor-pointer hover:brightness-110"
            >
              <FiMinus className="h-2 w-2 text-black opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>

            {/* Green: Maximize / Restore */}
            <button
              type="button"
              onClick={() => {
                setIsMaximized(!isMaximized);
                if (isMinimized) setIsMinimized(false);
              }}
              title={isMaximized ? 'Restore window size' : 'Maximize terminal'}
              className="group relative h-3 w-3 rounded-full bg-[#10B981] border border-[#059669]/60 flex items-center justify-center cursor-pointer hover:brightness-110"
            >
              {isMaximized ? (
                <FiMinimize2 className="h-2 w-2 text-black opacity-0 group-hover:opacity-100 transition-opacity" />
              ) : (
                <FiMaximize2 className="h-2 w-2 text-black opacity-0 group-hover:opacity-100 transition-opacity" />
              )}
            </button>
          </div>

          {/* Drag Handle & Terminal Title */}
          <div
            onPointerDown={(e) => {
              if (!isMaximized) dragControls.start(e);
            }}
            className={`flex-1 flex items-center justify-center gap-2 text-slate-300 text-xs font-semibold px-2 select-none ${
              !isMaximized ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'
            }`}
            title={!isMaximized ? 'Drag header to move terminal' : 'Terminal maximized'}
          >
            <FiMove className={`h-3 w-3 ${!isMaximized ? 'text-red-400/80 animate-pulse' : 'text-slate-600'}`} />
            <FiTerminal className="h-3.5 w-3.5 text-red-500" />
            <span className="truncate">
              {isMinimized
                ? 'admin@gateway [MIN]'
                : `admin@portfolio-security-gateway: ~ ${isMaximized ? '[MAXIMIZED]' : ''}`}
            </span>
            {!isMaximized && !isMinimized && (
              <span className="hidden md:inline-block text-[10px] text-slate-500 font-normal">
                (drag to move)
              </span>
            )}
          </div>

          {/* Status and Action Buttons */}
          <div className="flex items-center gap-2 text-[11px] text-slate-400" onPointerDown={(e) => e.stopPropagation()}>
            <span className="hidden sm:inline font-mono">TLS 1.3</span>
            <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" title="Gateway Online" />

            <div className="flex items-center border-l border-white/10 pl-2 ml-1 gap-1">
              <button
                type="button"
                onClick={() => {
                  setIsMinimized(!isMinimized);
                  if (isMaximized) setIsMaximized(false);
                }}
                className="p-1 rounded hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
                title={isMinimized ? 'Restore terminal' : 'Minimize'}
              >
                {isMinimized ? <FiMaximize2 className="h-3 w-3" /> : <FiMinus className="h-3 w-3" />}
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsMaximized(!isMaximized);
                  if (isMinimized) setIsMinimized(false);
                }}
                className="p-1 rounded hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
                title={isMaximized ? 'Restore window' : 'Maximize'}
              >
                {isMaximized ? <FiMinimize2 className="h-3 w-3" /> : <FiMaximize2 className="h-3 w-3" />}
              </button>
            </div>
          </div>
        </div>

        {/* Minimized Dock State Display */}
        {isMinimized ? (
          <div className="p-4 bg-[#090A10] flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
              </span>
              <div>
                <div className="text-white text-xs font-semibold">Gateway Session Active</div>
                <div className="text-slate-400 text-[11px]">
                  Step: <span className="text-red-400 font-mono">{step}</span> • {logs.length} events logged
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsMinimized(false)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600/20 hover:bg-red-600/30 border border-red-500/40 text-red-300 hover:text-white text-xs font-mono cursor-pointer transition-all shadow-sm"
            >
              <FiMaximize2 className="h-3.5 w-3.5" />
              <span>Restore</span>
            </button>
          </div>
        ) : (
          <>
            {/* Terminal Logs Canvas with bottom scroll cushion to allow scrolling active prompts to top */}
            <div
              ref={logsContainerRef}
              className="flex-1 overflow-y-auto p-4 sm:p-6 pb-[75vh] space-y-2 font-mono custom-scrollbar text-[#E2E8F0]"
            >
              {logs.map((log) => {
                const isAnchor = log.id === activeScrollAnchorId;
                if (log.type === 'system') {
                  return (
                    <div
                      key={log.id}
                      ref={isAnchor ? latestPromptRef : undefined}
                      className="text-[#52525B] select-none text-[11px] sm:text-xs"
                    >
                      {log.text}
                    </div>
                  );
                }
                if (log.type === 'info') {
                  return (
                    <div
                      key={log.id}
                      ref={isAnchor ? latestPromptRef : undefined}
                      className="text-slate-300"
                    >
                      {log.text}
                    </div>
                  );
                }
                if (log.type === 'success') {
                  return (
                    <div
                      key={log.id}
                      ref={isAnchor ? latestPromptRef : undefined}
                      className="text-[#34D399] font-bold"
                    >
                      {log.text}
                    </div>
                  );
                }
                if (log.type === 'error') {
                  return (
                    <div
                      key={log.id}
                      ref={isAnchor ? latestPromptRef : undefined}
                      className="text-red-400 font-bold"
                    >
                      {log.text}
                    </div>
                  );
                }
                if (log.type === 'warning') {
                  return (
                    <div
                      key={log.id}
                      ref={isAnchor ? latestPromptRef : undefined}
                      className="text-rose-400"
                    >
                      {log.text}
                    </div>
                  );
                }
                if (log.type === 'user') {
                  return (
                    <div
                      key={log.id}
                      ref={isAnchor ? latestPromptRef : undefined}
                      className="text-white font-bold pl-2 border-l-2 border-red-500/60"
                    >
                      {log.text}
                    </div>
                  );
                }
                return (
                  <div
                    key={log.id}
                    ref={isAnchor ? latestPromptRef : undefined}
                    className="text-red-400 font-semibold mt-2"
                  >
                    {log.text}
                  </div>
                );
              })}

              {/* Terminal Interactive Input Form */}
              {step !== 'success_redirect' && step !== 'checking' && step !== '2fa_passkey_waiting' && (
                <div className="pt-2">
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

                  {/* Quick option to change email while at password step */}
                  {step === 'password' && (
                    <div className="pt-1.5 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={restartSession}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-white/5 hover:bg-red-500/20 border border-white/10 hover:border-red-500/40 text-[11px] text-slate-400 hover:text-red-300 font-mono cursor-pointer transition-colors"
                      >
                        <FiRotateCw className="h-3 w-3" />
                        <span>Change Email / Reboot</span>
                      </button>
                    </div>
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
                          addLog('info', `[~] Option [${m.optionNumber}] selected: Authenticator verification.`);
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
            </div>

            {/* Terminal Status Footer with Scroll Navigation & Hints */}
            <div className="shrink-0 bg-[#07080C] border-t border-red-500/20 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-[11px] text-slate-400">
              <div className="flex items-center gap-3">
                <span className="text-red-400">admin@gateway</span>
                <span>•</span>
                <span>Type <code className="text-white">clear</code> to clean</span>
                <span>•</span>
                <span>Type <code className="text-white">restart</code> to reboot</span>
              </div>

              <div className="flex items-center gap-3">
                {/* Scroll to Top / Bottom Buttons */}
                <div className="flex items-center gap-1.5 border-r border-white/10 pr-3">
                  <button
                    type="button"
                    onClick={() => logsContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' })}
                    className="flex items-center gap-1 px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-colors cursor-pointer text-[10px]"
                    title="Scroll to Top"
                  >
                    <FiArrowUp className="h-3 w-3 text-red-400" />
                    <span>Top</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (logsContainerRef.current) {
                        logsContainerRef.current.scrollTo({
                          top: logsContainerRef.current.scrollHeight,
                          behavior: 'smooth',
                        });
                      }
                    }}
                    className="flex items-center gap-1 px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-colors cursor-pointer text-[10px]"
                    title="Scroll to Bottom"
                  >
                    <FiArrowDown className="h-3 w-3 text-red-400" />
                    <span>Bottom</span>
                  </button>
                </div>

                <span className="flex items-center gap-1.5 text-red-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
                  <span>Auth Node Ready</span>
                </span>
              </div>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}
