'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export interface ContactMessage {
  _id: string;
  name: string;
  email: string;
  message: string;
  createdAt: string;
  read?: boolean;
}

export function useMessages() {
  return useQuery<ContactMessage[]>({
    queryKey: ['messages'],
    queryFn: async () => {
      const res = await fetch('/api/messages');
      if (!res.ok) {
        throw new Error('Failed to fetch messages');
      }
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    },
  });
}

export function useDeleteMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/messages/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to delete message');
      }
      return id;
    },
    onSuccess: (id) => {
      queryClient.setQueryData<ContactMessage[]>(['messages'], (old) => {
        if (!old) return [];
        return old.filter((msg) => msg._id !== id);
      });
      queryClient.invalidateQueries({ queryKey: ['messages'] });
      toast.success('Message deleted successfully');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to delete message');
    },
  });
}
