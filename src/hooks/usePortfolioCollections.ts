'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export function useSkills() {
  return useQuery<any[]>({
    queryKey: ['skills'],
    queryFn: async () => {
      const res = await fetch('/api/skills');
      if (!res.ok) throw new Error('Failed to fetch skills');
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    },
  });
}

export function useSaveSkill() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id?: string; data: any }) => {
      const url = id ? `/api/skills/${id}` : '/api/skills';
      const method = id ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to save skill');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['skills'] });
    },
  });
}

export function useDeleteSkill() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/skills/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete skill');
      return id;
    },
    onSuccess: (id) => {
      queryClient.setQueryData<any[]>(['skills'], (old) => old?.filter((s) => s._id !== id) || []);
      queryClient.invalidateQueries({ queryKey: ['skills'] });
      toast.success('Skill deleted');
    },
  });
}

export function useExperience() {
  return useQuery<any[]>({
    queryKey: ['experience'],
    queryFn: async () => {
      const res = await fetch('/api/experience');
      if (!res.ok) throw new Error('Failed to fetch experience');
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    },
  });
}

export function useSaveExperience() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id?: string; data: any }) => {
      const url = id ? `/api/experience/${id}` : '/api/experience';
      const method = id ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to save experience');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['experience'] });
    },
  });
}

export function useDeleteExperience() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/experience/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete experience');
      return id;
    },
    onSuccess: (id) => {
      queryClient.setQueryData<any[]>(['experience'], (old) => old?.filter((e) => e._id !== id) || []);
      queryClient.invalidateQueries({ queryKey: ['experience'] });
      toast.success('Experience deleted');
    },
  });
}

export function useEducation() {
  return useQuery<any[]>({
    queryKey: ['education'],
    queryFn: async () => {
      const res = await fetch('/api/education');
      if (!res.ok) throw new Error('Failed to fetch education');
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    },
  });
}

export function useCertifications() {
  return useQuery<any[]>({
    queryKey: ['certifications'],
    queryFn: async () => {
      const res = await fetch('/api/certifications');
      if (!res.ok) throw new Error('Failed to fetch certifications');
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    },
  });
}
