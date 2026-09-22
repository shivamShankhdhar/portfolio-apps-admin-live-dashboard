'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AppItem } from '@/lib/defaultData';
import { toast } from 'sonner';

export function useApps() {
  return useQuery<AppItem[]>({
    queryKey: ['apps'],
    queryFn: async () => {
      const res = await fetch('/api/apps');
      if (!res.ok) throw new Error('Failed to fetch apps');
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    },
  });
}

export function useSaveApp() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id?: string; data: Partial<AppItem> }) => {
      const url = id ? `/api/apps/${id}` : '/api/apps';
      const method = id ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Failed to save app');
      }
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['apps'] });
      toast.success(variables.id ? 'App updated successfully' : 'App created successfully');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Error saving app');
    },
  });
}

export function useDeleteApp() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/apps/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Failed to delete app');
      }
      return id;
    },
    onSuccess: (id) => {
      queryClient.setQueryData<AppItem[]>(['apps'], (old) => {
        if (!old) return [];
        return old.filter((item) => item._id !== id);
      });
      queryClient.invalidateQueries({ queryKey: ['apps'] });
      toast.success('App deleted successfully');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Error deleting app');
    },
  });
}
