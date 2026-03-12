'use client';

import { useSession } from 'next-auth/react';
import { Phone, BarChart3, AlertCircle, Building, Quote } from 'lucide-react';
import Header from '@/components/layout/header';
import { Card, CardContent } from '@/components/ui/card';
import { Loading } from '@/components/ui/loading';
import { useDashboardStats, useQuoteOfDay } from '@/hooks/use-dashboard';

export default function DashboardPage() {
  const { data: session } = useSession();
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: quoteOfDay, isLoading: quoteLoading } = useQuoteOfDay();

  const userName = session?.user?.name ?? 'User';
  const userRole = (session?.user as { role?: number })?.role;
  const isAdminOrManager = userRole === 1 || userRole === 2;

  const statCards = [
    {
      label: "Today's Calls",
      value: stats?.todayCalls ?? 0,
      icon: Phone,
      color: '#00d4ff',
      bg: 'rgba(0, 212, 255, 0.1)',
    },
    {
      label: "This Week's Calls",
      value: stats?.weekCalls ?? 0,
      icon: BarChart3,
      color: '#a855f7',
      bg: 'rgba(168, 85, 247, 0.1)',
    },
    {
      label: 'Callbacks Due',
      value: stats?.callbacksDue ?? 0,
      icon: AlertCircle,
      color: '#eab308',
      bg: 'rgba(234, 179, 8, 0.1)',
    },
    ...(isAdminOrManager
      ? [
          {
            label: 'Active Leads',
            value: stats?.totalActiveLeads ?? 0,
            icon: Building,
            color: '#22c55e',
            bg: 'rgba(34, 197, 94, 0.1)',
          },
        ]
      : []),
  ];

  return (
    <>
      <Header title="Dashboard" />

      <div className="mx-auto max-w-7xl space-y-8 pt-6">
        {/* Welcome */}
        <div>
          <h2
            className="text-2xl font-bold"
            style={{ color: 'var(--text-primary)' }}
          >
            Welcome back, {userName}
          </h2>
          <p
            className="mt-1 text-sm"
            style={{ color: 'var(--text-secondary)' }}
          >
            Here is an overview of your activity.
          </p>
        </div>

        {/* Quote of the Day */}
        {quoteLoading ? (
          <Card>
            <CardContent className="flex items-center justify-center py-8">
              <Loading size="sm" />
            </CardContent>
          </Card>
        ) : quoteOfDay ? (
          <Card className="relative overflow-hidden">
            <div
              className="absolute inset-0 opacity-5"
              style={{
                background:
                  'linear-gradient(135deg, #00d4ff 0%, transparent 50%)',
              }}
            />
            <CardContent className="relative py-6">
              <div className="flex items-start gap-4">
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
                  style={{ backgroundColor: 'rgba(0, 212, 255, 0.1)' }}
                >
                  <Quote className="h-5 w-5" style={{ color: '#00d4ff' }} />
                </div>
                <div className="min-w-0 flex-1">
                  <p
                    className="mb-2 text-xs font-semibold uppercase tracking-wider"
                    style={{ color: '#00d4ff' }}
                  >
                    Quote of the Day
                  </p>
                  <p
                    className="text-lg font-medium italic leading-relaxed"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    &ldquo;{quoteOfDay.quote}&rdquo;
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : null}

        {/* Stat Cards */}
        {statsLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loading />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {statCards.map((stat) => (
              <Card key={stat.label} className="transition-all hover:scale-[1.02]">
                <CardContent className="flex items-center gap-4 py-5">
                  <div
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl"
                    style={{ backgroundColor: stat.bg }}
                  >
                    <stat.icon
                      className="h-6 w-6"
                      style={{ color: stat.color }}
                    />
                  </div>
                  <div>
                    <p
                      className="text-sm font-medium"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      {stat.label}
                    </p>
                    <p
                      className="text-3xl font-bold"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      {stat.value.toLocaleString()}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
