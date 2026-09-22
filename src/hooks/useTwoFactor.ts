'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export interface PasskeyDevice {
  credentialId: string;
  deviceName: string;
  createdAt: string;
}

export interface TwoFactorStatusResponse {
  twoFactorEnabled: boolean;
  twoFactorMethod: 'totp' | 'passkey' | 'both';
  totpVerified: boolean;
  hasTotpSecret?: boolean;
  passkeys: PasskeyDevice[];
}

export const detectDeviceName = (): string => {
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
  out.forEach((v, i) => {
    view[i] = v;
  });
  return view as Uint8Array<ArrayBuffer>;
};

function getAuthHeader(): Record<string, string> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export function useTwoFactorStatus(options?: { enabled?: boolean }) {
  return useQuery<TwoFactorStatusResponse>({
    queryKey: ['2fa-status'],
    queryFn: async () => {
      const res = await fetch('/api/auth/2fa', {
        headers: getAuthHeader(),
      });
      if (!res.ok) {
        throw new Error('Failed to fetch 2FA status');
      }
      return res.json();
    },
    enabled: options?.enabled !== false,
  });
}

export function useToggle2FA() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (enabled: boolean) => {
      const res = await fetch('/api/auth/2fa', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader(),
        },
        body: JSON.stringify({
          action: 'toggle-2fa',
          enabled,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to update 2FA status');
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['2fa-status'] });
      queryClient.invalidateQueries({ queryKey: ['auth'] });
      toast.success(data.message || '2FA settings updated');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Error updating 2FA');
    },
  });
}

export function useGenerateTotp() {
  return useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/auth/2fa', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader(),
        },
        body: JSON.stringify({ action: 'generate-totp' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to generate key');
      return data as { secret: string; qrCode: string; message?: string };
    },
    onError: (err: any) => {
      toast.error(err.message || 'Error generating key');
    },
  });
}

export function useVerifyTotp() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ code, secret }: { code: string; secret: string }) => {
      const res = await fetch('/api/auth/2fa', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader(),
        },
        body: JSON.stringify({
          action: 'verify-enable-totp',
          code: code.trim(),
          secret,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Invalid code');
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['2fa-status'] });
      queryClient.invalidateQueries({ queryKey: ['auth'] });
      toast.success(data.message || 'Authenticator App enabled successfully');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Verification failed');
    },
  });
}

export function useDisableTotp() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/auth/2fa', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader(),
        },
        body: JSON.stringify({ action: 'disable-totp' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to remove authenticator');
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['2fa-status'] });
      queryClient.invalidateQueries({ queryKey: ['auth'] });
      toast.success(data.message || 'Authenticator app removed');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Error removing authenticator');
    },
  });
}

export function useRegisterPasskey() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (customDeviceName?: string) => {
      if (typeof window === 'undefined' || !window.PublicKeyCredential) {
        throw new Error('Biometric passkeys are not supported in this browser.');
      }

      const optRes = await fetch('/api/auth/2fa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
        body: JSON.stringify({ action: 'passkey-register-options' }),
      });

      const optData = await optRes.json();
      if (!optRes.ok || !optData.options) {
        throw new Error(optData.message || 'Failed to prepare registration');
      }

      const { options } = optData;
      const challengeBuffer = b64urlToUint8(options.challenge);
      const userIdBuffer = b64urlToUint8(options.user.id);

      const credential = (await navigator.credentials.create({
        publicKey: {
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
        },
      })) as PublicKeyCredential;

      if (!credential) throw new Error('Sensor verification was cancelled.');

      const rawResponse = credential.response as AuthenticatorAttestationResponse;
      const clientDataJSON = btoa(String.fromCharCode(...new Uint8Array(rawResponse.clientDataJSON)))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');

      const verifyRes = await fetch('/api/auth/2fa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
        body: JSON.stringify({
          action: 'passkey-register-verify',
          credentialId: credential.id,
          clientDataJSON,
          deviceName: customDeviceName || detectDeviceName(),
        }),
      });

      const verifyData = await verifyRes.json();
      if (!verifyRes.ok) throw new Error(verifyData.message || 'Failed to verify passkey');

      return verifyData;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['2fa-status'] });
      queryClient.invalidateQueries({ queryKey: ['auth'] });
      toast.success(data.message || 'Passkey registered successfully');
    },
    onError: (err: any) => {
      if (err.name === 'NotAllowedError') {
        toast.info('Passkey registration cancelled');
      } else {
        toast.error(err.message || 'Passkey registration error');
      }
    },
  });
}

export function useDeletePasskey() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (credentialId: string) => {
      const res = await fetch('/api/auth/2fa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
        body: JSON.stringify({ action: 'delete-passkey', credentialId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to remove passkey');
      return { credentialId, ...data };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['2fa-status'] });
      queryClient.invalidateQueries({ queryKey: ['auth'] });
      toast.success(data.message || 'Passkey removed');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Error removing passkey');
    },
  });
}
