'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export interface AdminDetails {
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

export interface AuthSessionResponse {
  authenticated: boolean;
  email: string;
  adminEmail: string;
  dbConfigured: boolean;
  dbConnected: boolean;
  smtpConfigured: boolean;
  sessionTerminated?: boolean;
  message?: string;
  adminDetails: AdminDetails | null;
}

function getAuthHeader(): Record<string, string> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export function useAuthSession(options?: { enabled?: boolean }) {
  return useQuery<AuthSessionResponse>({
    queryKey: ['auth'],
    queryFn: async () => {
      const res = await fetch('/api/auth', {
        headers: getAuthHeader(),
      });
      const data = await res.json();
      if (!res.ok && data.sessionTerminated) {
        throw new Error(data.message || 'Session terminated');
      }
      return data;
    },
    enabled: options?.enabled !== false,
  });
}

export function useChangePassword() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      currentPassword,
      newPassword,
    }: {
      currentPassword: string;
      newPassword: string;
    }) => {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader(),
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
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['auth'] });
      toast.success(data.message || 'Password updated successfully!');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Error updating password');
    },
  });
}
