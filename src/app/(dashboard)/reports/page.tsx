'use client';

import { useState, useMemo, Fragment } from 'react';
import { useSession } from 'next-auth/react';
import {
  Phone,
  BarChart3,
  User,
  Tag,
  Download,
  Filter,
  FileText,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from '@tanstack/react-table';
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
    id: 'expand',
    header: '',
    cell: () => null, // rendered manually in the custom table
    size: 32,
  },
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
    accessorKey: 'debtAmount',
    header: 'Debt Amount',
    cell: ({ getValue }) => {
      const val = getValue() as string | null;
      if (!val) return '\u2014';
      const num = parseFloat(val);
      return isNaN(num) ? val : `$${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    },
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

function DetailItem({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>{label}</p>
      <p className="text-sm" style={{ color: 'var(--text-primary)' }}>{value || '\u2014'}</p>
    </div>
  );
}

function ExpandedRow({ row }: { row: ReportRow }) {
  const debtDisplay = row.debtAmount
    ? `$${parseFloat(row.debtAmount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    : null;

  return (
    <div className="grid grid-cols-2 gap-x-8 gap-y-3 px-4 py-4 sm:grid-cols-3 lg:grid-cols-4">
      <DetailItem label="Call ID" value={String(row.idCall)} />
      <DetailItem label="Date" value={formatDate(row.callDate)} />
      <DetailItem label="Rep" value={row.repName} />
      <DetailItem label="Disposition" value={row.disposition} />
      <DetailItem label="Business Name" value={row.businessName} />
      <DetailItem label="Business Phone" value={row.businessPhone} />
      <DetailItem label="Business Address" value={row.businessAddress} />
      <DetailItem label="Decision Maker" value={row.dmakerName} />
      <DetailItem label="DM Phone" value={row.dmakerPhone} />
      <DetailItem label="DM Email" value={row.dmakerEmail} />
      <DetailItem label="Debtor Name" value={row.debtorName} />
      <DetailItem label="Debt Amount" value={debtDisplay} />
      <DetailItem label="Agreement Sent" value={row.agreementSent} />
      <DetailItem label="Callback" value={row.callBack ? formatDate(row.callBack) : null} />
      <DetailItem label="Closer" value={row.closerName} />
      <div className="col-span-full">
        <DetailItem label="Comments" value={row.comments} />
      </div>
    </div>
  );
}

export default function ReportsPage() {
  const { data: session } = useSession();
  const userRole = (session?.user as { role?: number })?.role;
  const isAdminOrManager = userRole === 1 || userRole === 2;

  const [repId, setRepId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [disposition, setDisposition] = useState('');
  const [appliedFilters, setAppliedFilters] = useState<ReportFilters>({});
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

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
          <ReportsTable rows={rows} expandedRows={expandedRows} setExpandedRows={setExpandedRows} />
        )}
      </div>
    </>
  );
}

function ReportsTable({
  rows,
  expandedRows,
  setExpandedRows,
}: {
  rows: ReportRow[];
  expandedRows: Set<number>;
  setExpandedRows: React.Dispatch<React.SetStateAction<Set<number>>>;
}) {
  const [sorting, setSorting] = useState<SortingState>([]);

  const table = useReactTable({
    data: rows,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    state: { sorting },
    initialState: { pagination: { pageSize: 15 } },
  });

  function toggleRow(idCall: number) {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(idCall)) next.delete(idCall);
      else next.add(idCall);
      return next;
    });
  }

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-xl border border-[var(--border)]">
        <table className="w-full caption-bottom text-sm">
          <thead className="bg-[var(--bg-secondary)]">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id} className="border-b border-[var(--border)]">
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="h-11 px-4 text-left align-middle text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]"
                    style={header.id === 'expand' ? { width: 32 } : undefined}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="bg-[var(--bg-card)]">
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => {
                const original = row.original;
                const isExpanded = expandedRows.has(original.idCall);
                return (
                  <Fragment key={row.id}>
                    <tr
                      className="cursor-pointer border-b border-[var(--border)] transition-colors hover:bg-[var(--bg-elevated)]"
                      onClick={() => toggleRow(original.idCall)}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <td
                          key={cell.id}
                          className="px-4 py-3 align-middle text-[var(--text-primary)]"
                        >
                          {cell.column.id === 'expand' ? (
                            isExpanded ? (
                              <ChevronDown className="h-4 w-4" style={{ color: 'var(--text-muted)' }} />
                            ) : (
                              <ChevronRight className="h-4 w-4" style={{ color: 'var(--text-muted)' }} />
                            )
                          ) : (
                            flexRender(cell.column.columnDef.cell, cell.getContext())
                          )}
                        </td>
                      ))}
                    </tr>
                    {isExpanded && (
                      <tr className="border-b border-[var(--border)]">
                        <td colSpan={columns.length} className="bg-[var(--bg-secondary)]">
                          <ExpandedRow row={original} />
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })
            ) : (
              <tr>
                <td colSpan={columns.length} className="h-24 text-center text-[var(--text-muted)]">
                  No results.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between px-2">
        <div className="text-sm text-[var(--text-muted)]">
          Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="icon" onClick={() => table.setPageIndex(0)} disabled={!table.getCanPreviousPage()} aria-label="First page">
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()} aria-label="Previous page">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()} aria-label="Next page">
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={() => table.setPageIndex(table.getPageCount() - 1)} disabled={!table.getCanNextPage()} aria-label="Last page">
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
