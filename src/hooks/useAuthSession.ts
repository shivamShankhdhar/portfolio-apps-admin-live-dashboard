'use client';

import { useState, useEffect } from 'react';
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

function getAuthHeader(token?: string | null): Record<string, string> {
  const activeToken = token || (typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null);
  return activeToken ? { Authorization: `Bearer ${activeToken}` } : {};
}

export function useAuthSession(options?: { enabled?: boolean }) {
  const [token, setToken] = useState<string | null>(null);
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
    setToken(localStorage.getItem('adminToken'));
  }, []);

  return useQuery<AuthSessionResponse>({
    queryKey: ['auth', token],
    queryFn: async () => {
      const activeToken = token || (typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null);
      if (!activeToken) {
        return {
          authenticated: false,
          email: '',
          adminEmail: '',
          dbConfigured: false,
          dbConnected: false,
          smtpConfigured: false,
          adminDetails: null,
        };
      }

      const res = await fetch('/api/auth', {
        headers: getAuthHeader(activeToken),
      });
      const data = await res.json();
      if (!res.ok && data.sessionTerminated) {
        throw new Error(data.message || 'Session terminated');
      }
      return data;
    },
    enabled: options?.enabled !== false && hasMounted && Boolean(token),
    staleTime: 5000,
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
