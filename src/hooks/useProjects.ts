'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export interface ProjectItem {
  _id: string;
  title: string;
  description: string;
  technologies: string[];
  link?: string;
  github?: string;
  projectType: string;
  featured: boolean;
  startDate?: string;
  endDate?: string;
  image?: string;
}

export function useProjects() {
  return useQuery<ProjectItem[]>({
    queryKey: ['projects'],
    queryFn: async () => {
      const res = await fetch('/api/projects');
      if (!res.ok) throw new Error('Failed to fetch projects');
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    },
  });
}

export function useSaveProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id?: string; data: Partial<ProjectItem> }) => {
      const url = id ? `/api/projects/${id}` : '/api/projects';
      const method = id ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Failed to save project');
      }
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast.success(variables.id ? 'Project updated successfully' : 'Project created successfully');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Error saving project');
    },
  });
}

export function useDeleteProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/projects/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Failed to delete project');
      }
      return id;
    },
    onSuccess: (id) => {
      queryClient.setQueryData<ProjectItem[]>(['projects'], (old) => {
        if (!old) return [];
        return old.filter((item) => item._id !== id);
      });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast.success('Project deleted successfully');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Error deleting project');
    },
  });
}
