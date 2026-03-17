'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import {
  Phone,
  BarChart3,
  AlertCircle,
  Building,
  Quote,
  Crown,
  Trophy,
  TrendingUp,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import Header from '@/components/layout/header';
import { Card, CardContent } from '@/components/ui/card';
import { Loading } from '@/components/ui/loading';
import {
  useDashboardStats,
  useQuoteOfDay,
  useLeaderboard,
  useMyMetrics,
} from '@/hooks/use-dashboard';

const MEDAL_STYLES: Record<number, { bg: string; border: string; icon: string; label: string }> = {
  1: { bg: 'linear-gradient(135deg, #ffd700 0%, #ffec80 100%)', border: '#ffd700', icon: '#b8860b', label: 'Gold' },
  2: { bg: 'linear-gradient(135deg, #c0c0c0 0%, #e8e8e8 100%)', border: '#c0c0c0', icon: '#808080', label: 'Silver' },
  3: { bg: 'linear-gradient(135deg, #cd7f32 0%, #e8a862 100%)', border: '#cd7f32', icon: '#8b5a2b', label: 'Bronze' },
};

function formatShortDate(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const { data: stats, isLoading: statsLoading, isError: statsError } = useDashboardStats();
  const { data: quoteOfDay, isLoading: quoteLoading } = useQuoteOfDay();

  const [lbPeriod, setLbPeriod] = useState<'week' | 'month' | 'all'>('month');
  const { data: leaderboard, isLoading: lbLoading, isError: lbError } = useLeaderboard(lbPeriod);

  const [chartRange, setChartRange] = useState<'week' | '2weeks' | 'month'>('week');
  const { data: myMetrics, isLoading: metricsLoading, isError: metricsError } = useMyMetrics(chartRange);

  const userName = session?.user?.name ?? 'User';
  const userRole = (session?.user as { role?: number })?.role;
  const isAdminOrManager = userRole === 1 || userRole === 2;
  const currentUserId = (session?.user as { userId?: number })?.userId;

  const statCards = [
    {
      label: "Today's Calls",
      value: stats?.todayCalls ?? 0,
      icon: Phone,
      color: 'var(--accent)',
      bg: 'var(--accent-subtle)',
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

  const chartData = (myMetrics ?? []).map((m) => ({
    ...m,
    label: formatShortDate(m.date),
  }));

  return (
    <>
      <Header title="Dashboard" />

      <div className="mx-auto max-w-7xl space-y-8 pt-6">
        {/* Welcome */}
        <div>
          <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
            Welcome back, {userName}
          </h2>
          <p className="mt-1 text-sm" style={{ color: 'var(--text-secondary)' }}>
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
                background: 'linear-gradient(135deg, var(--accent) 0%, transparent 50%)',
              }}
            />
            <CardContent className="relative py-6">
              <div className="flex items-start gap-4">
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
                  style={{ backgroundColor: 'var(--accent-subtle)' }}
                >
                  <Quote className="h-5 w-5" style={{ color: 'var(--accent)' }} />
                </div>
                <div className="min-w-0 flex-1">
                  <p
                    className="mb-2 text-xs font-semibold uppercase tracking-wider"
                    style={{ color: 'var(--accent)' }}
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
        ) : statsError ? (
          <Card>
            <CardContent className="py-6 text-center text-sm" style={{ color: 'var(--text-secondary)' }}>
              Failed to load stats. Please refresh.
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {statCards.map((stat) => (
              <Card key={stat.label} className="transition-all hover:scale-[1.02]">
                <CardContent className="flex items-center gap-4 py-5">
                  <div
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl"
                    style={{ backgroundColor: stat.bg }}
                  >
                    <stat.icon className="h-6 w-6" style={{ color: stat.color }} />
                  </div>
                  <div>
                    <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                      {stat.label}
                    </p>
                    <p className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>
                      {stat.value.toLocaleString()}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Leaderboard & Chart side-by-side */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Leaderboard */}
          <Card className="relative overflow-hidden">
            <div
              className="absolute inset-0 opacity-[0.03]"
              style={{
                background: 'linear-gradient(135deg, #ffd700 0%, transparent 60%)',
              }}
            />
            <CardContent className="relative py-6">
              <div className="mb-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-lg"
                    style={{ background: 'linear-gradient(135deg, #ffd700, #ffec80)', boxShadow: '0 2px 8px rgba(255,215,0,0.3)' }}
                  >
                    <Trophy className="h-5 w-5" style={{ color: '#8b6914' }} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
                      Leaderboard
                    </h3>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      Potential Clients
                    </p>
                  </div>
                </div>
                <div className="flex gap-1 rounded-lg p-1" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                  {(['week', 'month', 'all'] as const).map((p) => (
                    <button
                      key={p}
                      onClick={() => setLbPeriod(p)}
                      className="rounded-md px-3 py-1.5 text-xs font-medium transition-all"
                      style={{
                        backgroundColor: lbPeriod === p ? 'var(--bg-card)' : 'transparent',
                        color: lbPeriod === p ? 'var(--accent)' : 'var(--text-muted)',
                        boxShadow: lbPeriod === p ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                      }}
                    >
                      {p === 'week' ? 'Week' : p === 'month' ? 'Month' : 'All Time'}
                    </button>
                  ))}
                </div>
              </div>

              {lbLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loading size="sm" />
                </div>
              ) : lbError ? (
                <p className="py-8 text-center text-sm" style={{ color: 'var(--danger, #ef4444)' }}>
                  Failed to load leaderboard.
                </p>
              ) : !leaderboard?.length ? (
                <p className="py-8 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
                  No data yet for this period.
                </p>
              ) : (
                <div className="space-y-2">
                  {leaderboard.map((entry) => {
                    const medal = MEDAL_STYLES[entry.rank];
                    const isCurrentUser = entry.userId === currentUserId;

                    return (
                      <div
                        key={entry.userId}
                        className="flex items-center gap-3 rounded-xl px-4 py-3 transition-all"
                        style={{
                          backgroundColor: isCurrentUser
                            ? 'var(--accent-subtle)'
                            : medal
                              ? 'rgba(255,255,255,0.02)'
                              : 'transparent',
                          border: isCurrentUser
                            ? '1px solid var(--accent)'
                            : medal
                              ? `1px solid ${medal.border}20`
                              : '1px solid transparent',
                        }}
                      >
                        {/* Rank */}
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center">
                          {medal ? (
                            <div
                              className="flex h-9 w-9 items-center justify-center rounded-full"
                              style={{ background: medal.bg, boxShadow: `0 2px 8px ${medal.border}40` }}
                            >
                              <Crown className="h-4 w-4" style={{ color: medal.icon }} />
                            </div>
                          ) : (
                            <span
                              className="text-sm font-bold"
                              style={{ color: 'var(--text-muted)' }}
                            >
                              #{entry.rank}
                            </span>
                          )}
                        </div>

                        {/* Name */}
                        <div className="min-w-0 flex-1">
                          <p
                            className="truncate text-sm font-semibold"
                            style={{
                              color: isCurrentUser ? 'var(--accent)' : 'var(--text-primary)',
                            }}
                          >
                            {entry.name}
                            {isCurrentUser && (
                              <span className="ml-2 text-xs font-normal" style={{ color: 'var(--text-muted)' }}>
                                (You)
                              </span>
                            )}
                          </p>
                        </div>

                        {/* Count */}
                        <div className="text-right">
                          <span
                            className="text-lg font-bold"
                            style={{
                              color: medal ? medal.icon : 'var(--text-secondary)',
                            }}
                          >
                            {entry.potentialClients}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* My Metrics Chart */}
          <Card>
            <CardContent className="py-6">
              <div className="mb-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-lg"
                    style={{ backgroundColor: 'rgba(168, 85, 247, 0.1)' }}
                  >
                    <TrendingUp className="h-5 w-5" style={{ color: '#a855f7' }} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
                      My Performance
                    </h3>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      Calls & potential clients
                    </p>
                  </div>
                </div>
                <div className="flex gap-1 rounded-lg p-1" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                  {(['week', '2weeks', 'month'] as const).map((r) => (
                    <button
                      key={r}
                      onClick={() => setChartRange(r)}
                      className="rounded-md px-3 py-1.5 text-xs font-medium transition-all"
                      style={{
                        backgroundColor: chartRange === r ? 'var(--bg-card)' : 'transparent',
                        color: chartRange === r ? '#a855f7' : 'var(--text-muted)',
                        boxShadow: chartRange === r ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                      }}
                    >
                      {r === 'week' ? 'This Week' : r === '2weeks' ? '2 Weeks' : '30 Days'}
                    </button>
                  ))}
                </div>
              </div>

              {metricsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loading size="sm" />
                </div>
              ) : metricsError ? (
                <p className="py-12 text-center text-sm" style={{ color: 'var(--danger, #ef4444)' }}>
                  Failed to load metrics.
                </p>
              ) : !chartData.length ? (
                <p className="py-12 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
                  No calls recorded for this period.
                </p>
              ) : (
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={chartData} barGap={4}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis
                      dataKey="label"
                      tick={{ fill: 'var(--text-muted)', fontSize: 12 }}
                      tickLine={false}
                      axisLine={{ stroke: 'var(--border)' }}
                    />
                    <YAxis
                      tick={{ fill: 'var(--text-muted)', fontSize: 12 }}
                      tickLine={false}
                      axisLine={false}
                      allowDecimals={false}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'var(--bg-card)',
                        border: '1px solid var(--border)',
                        borderRadius: '8px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                        color: 'var(--text-primary)',
                      }}
                      labelStyle={{ color: 'var(--text-primary)', fontWeight: 600, marginBottom: 4 }}
                      itemStyle={{ color: 'var(--text-secondary)', fontSize: 13 }}
                      cursor={{ fill: 'var(--accent-subtle)' }}
                    />
                    <Legend
                      iconType="circle"
                      wrapperStyle={{ fontSize: 12, color: 'var(--text-secondary)' }}
                    />
                    <Bar
                      dataKey="totalCalls"
                      name="Total Calls"
                      fill="var(--accent)"
                      radius={[4, 4, 0, 0]}
                      maxBarSize={40}
                    />
                    <Bar
                      dataKey="potentialClients"
                      name="Potential Clients"
                      fill="#a855f7"
                      radius={[4, 4, 0, 0]}
                      maxBarSize={40}
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
