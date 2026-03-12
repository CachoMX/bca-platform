'use client';

import {
  useQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';

export interface Rebuttal {
  idRebuttal: number;
  title: string;
  content: string;
}

async function fetchRebuttals(): Promise<Rebuttal[]> {
  const res = await fetch('/api/rebuttals');
  if (!res.ok) throw new Error('Failed to fetch rebuttals');
  const json = await res.json();
  return json.data ?? json;
}

export function useRebuttals() {
  return useQuery<Rebuttal[]>({
    queryKey: ['rebuttals'],
    queryFn: fetchRebuttals,
  });
}

export function useCreateRebuttal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { title: string; content: string }) => {
      const res = await fetch('/api/rebuttals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to create rebuttal');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rebuttals'] });
    },
  });
}

export function useUpdateRebuttal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      title,
      content,
    }: {
      id: number;
      title: string;
      content: string;
    }) => {
      const res = await fetch(`/api/rebuttals/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, content }),
      });
      if (!res.ok) throw new Error('Failed to update rebuttal');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rebuttals'] });
    },
  });
}

export function useDeleteRebuttal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/rebuttals/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete rebuttal');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rebuttals'] });
    },
  });
}
