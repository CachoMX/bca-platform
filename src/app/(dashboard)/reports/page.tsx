'use client';

import { useState, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import {
  Phone,
  BarChart3,
  User,
  Tag,
  Download,
  Filter,
  FileText,
} from 'lucide-react';
import { ColumnDef } from '@tanstack/react-table';
import Header from '@/components/layout/header';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loading } from '@/components/ui/loading';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DataTable } from '@/components/ui/data-table';
import {
  useReports,
  useReportsSummary,
  useExportCSV,
  type ReportFilters,
  type ReportRow,
} from '@/hooks/use-reports';
import { useUsers } from '@/hooks/use-users';
import { useDispositions } from '@/hooks/use-calls';
import { formatDate } from '@/lib/utils';

const columns: ColumnDef<ReportRow, unknown>[] = [
  {
    accessorKey: 'callDate',
    header: 'Date',
    cell: ({ getValue }) => formatDate(getValue() as string),
  },
  {
    accessorKey: 'repName',
    header: 'Rep',
  },
  {
    accessorKey: 'businessName',
    header: 'Business',
  },
  {
    accessorKey: 'disposition',
    header: 'Disposition',
  },
  {
    accessorKey: 'dmakerName',
    header: 'Decision Maker',
    cell: ({ getValue }) => (getValue() as string) || '\u2014',
  },
  {
    accessorKey: 'comments',
    header: 'Comments',
    cell: ({ getValue }) => {
      const val = getValue() as string | null;
      if (!val) return '\u2014';
      return val.length > 60 ? `${val.slice(0, 60)}...` : val;
    },
  },
];

export default function ReportsPage() {
  const { data: session } = useSession();
  const userRole = (session?.user as { role?: number })?.role;
  const isAdminOrManager = userRole === 1 || userRole === 2;

  const [repId, setRepId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [disposition, setDisposition] = useState('');
  const [appliedFilters, setAppliedFilters] = useState<ReportFilters>({});

  const { data: users } = useUsers();
  const { data: dispositions } = useDispositions();
  const { data: reportsData, isLoading: reportsLoading } =
    useReports(appliedFilters);
  const { data: summary, isLoading: summaryLoading } =
    useReportsSummary(appliedFilters);
  const exportCSV = useExportCSV();

  function handleApplyFilters() {
    setAppliedFilters({
      repId: repId && repId !== 'all' ? repId : undefined,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      disposition: disposition && disposition !== 'all' ? disposition : undefined,
    });
  }

  function handleExport() {
    exportCSV.mutate(appliedFilters);
  }

  const rows = useMemo(() => reportsData?.data ?? [], [reportsData]);

  if (!isAdminOrManager) {
    return (
      <>
        <Header title="Call Reports" />
        <div className="flex items-center justify-center pt-20">
          <p style={{ color: 'var(--text-secondary)' }}>
            You do not have permission to access this page.
          </p>
        </div>
      </>
    );
  }

  const statCards = [
    {
      label: 'Total Calls',
      value: summary?.totalCalls ?? 0,
      icon: Phone,
      color: 'var(--accent)',
      bg: 'var(--accent-subtle)',
    },
    {
      label: 'Avg Per Day',
      value: summary?.avgPerDay?.toFixed(1) ?? '0',
      icon: BarChart3,
      color: '#a855f7',
      bg: 'rgba(168, 85, 247, 0.1)',
    },
    {
      label: 'Top Rep',
      value: summary?.topRep?.name ?? '\u2014',
      subtitle: summary?.topRep ? `${summary.topRep.count} calls` : undefined,
      icon: User,
      color: '#22c55e',
      bg: 'rgba(34, 197, 94, 0.1)',
    },
    {
      label: 'Top Disposition',
      value: summary?.topDisposition?.name ?? '\u2014',
      subtitle: summary?.topDisposition
        ? `${summary.topDisposition.count} calls`
        : undefined,
      icon: Tag,
      color: '#eab308',
      bg: 'rgba(234, 179, 8, 0.1)',
    },
  ];

  return (
    <>
      <Header title="Call Reports" />

      <div className="mx-auto max-w-7xl space-y-6 pt-6">
        {/* Filter Bar */}
        <Card>
          <CardContent className="py-4">
            <div className="flex flex-wrap items-end gap-4">
              <div className="min-w-[160px] space-y-1.5">
                <Label>Rep</Label>
                <Select value={repId} onValueChange={setRepId}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Reps" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Reps</SelectItem>
                    {users?.map((u) => (
                      <SelectItem key={u.userId} value={String(u.userId)}>
                        {u.name} {u.lastname}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="min-w-[160px] space-y-1.5">
                <Label>Start Date</Label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>

              <div className="min-w-[160px] space-y-1.5">
                <Label>End Date</Label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>

              <div className="min-w-[180px] space-y-1.5">
                <Label>Disposition</Label>
                <Select value={disposition} onValueChange={setDisposition}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Dispositions" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Dispositions</SelectItem>
                    {dispositions?.map((d) => (
                      <SelectItem
                        key={d.idDisposition}
                        value={String(d.idDisposition)}
                      >
                        {d.disposition}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2">
                <Button onClick={handleApplyFilters}>
                  <Filter className="h-4 w-4" />
                  Apply Filters
                </Button>
                <Button
                  variant="outline"
                  onClick={handleExport}
                  disabled={exportCSV.isPending}
                >
                  {exportCSV.isPending ? (
                    <Loading size="sm" />
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                  Export CSV
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Summary Cards */}
        {summaryLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loading />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {statCards.map((stat) => (
              <Card key={stat.label}>
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
                  <div className="min-w-0">
                    <p
                      className="text-sm font-medium"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      {stat.label}
                    </p>
                    <p
                      className="truncate text-2xl font-bold"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      {typeof stat.value === 'number'
                        ? stat.value.toLocaleString()
                        : stat.value}
                    </p>
                    {stat.subtitle && (
                      <p
                        className="text-xs"
                        style={{ color: 'var(--text-muted)' }}
                      >
                        {stat.subtitle}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Calls Table */}
        {reportsLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loading />
          </div>
        ) : rows.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div
                className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl"
                style={{ backgroundColor: 'var(--accent-subtle)' }}
              >
                <FileText className="h-7 w-7" style={{ color: 'var(--accent)' }} />
              </div>
              <p
                className="mb-1 text-base font-medium"
                style={{ color: 'var(--text-primary)' }}
              >
                No reports found
              </p>
              <p
                className="text-sm"
                style={{ color: 'var(--text-secondary)' }}
              >
                Adjust your filters or wait for new call data.
              </p>
            </CardContent>
          </Card>
        ) : (
          <DataTable columns={columns} data={rows} pageSize={15} />
        )}
      </div>
    </>
  );
}
