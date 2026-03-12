'use client';

import { useQuery } from '@tanstack/react-query';

interface DashboardStats {
  todayCalls: number;
  weekCalls: number;
  callbacksDue: number;
  totalActiveLeads?: number;
  totalReps?: number;
}

interface Quote {
  id: number;
  quote: string;
}

async function fetchDashboardStats(): Promise<DashboardStats> {
  const res = await fetch('/api/dashboard');
  if (!res.ok) throw new Error('Failed to fetch dashboard stats');
  return res.json();
}

async function fetchQuotes(): Promise<Quote[]> {
  const res = await fetch('/api/quotes');
  if (!res.ok) throw new Error('Failed to fetch quotes');
  const json = await res.json();
  return json.data ?? json;
}

export function useDashboardStats() {
  return useQuery<DashboardStats>({
    queryKey: ['dashboard-stats'],
    queryFn: fetchDashboardStats,
  });
}

export function useQuoteOfDay() {
  return useQuery<Quote | null>({
    queryKey: ['quote-of-day'],
    queryFn: async () => {
      const quotes = await fetchQuotes();
      if (!quotes.length) return null;
      // Use the current date as a seed so the quote stays consistent for the day
      const today = new Date();
      const dayIndex =
        today.getFullYear() * 10000 +
        (today.getMonth() + 1) * 100 +
        today.getDate();
      return quotes[dayIndex % quotes.length];
    },
    staleTime: 5 * 60 * 1000,
  });
}
