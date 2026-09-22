'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export interface AdminProfile {
  name: string;
  bio: string;
  email: string;
  linkedinUrl?: string;
  githubUrl?: string;
  portfolioUrl?: string;
  appsUrl?: string;
  adminUrl?: string;
  roles?: string[];
  available?: boolean;
  avatarUrl?: string;
}

export function useProfile() {
  return useQuery<AdminProfile>({
    queryKey: ['profile'],
    queryFn: async () => {
      const res = await fetch('/api/profile?t=' + Date.now(), { cache: 'no-store' });
      if (!res.ok) throw new Error('Failed to fetch profile');
      return res.json();
    },
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (updatedData: Partial<AdminProfile>) => {
      const res = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedData),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Failed to update profile');
      }
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['profile'], data);
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      toast.success('Profile updated successfully');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Error updating profile');
    },
  });
}
