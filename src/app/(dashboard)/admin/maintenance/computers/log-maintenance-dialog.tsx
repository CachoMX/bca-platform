'use client';

import { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { useCreateLog, useAdminTickets, type Computer } from '@/hooks/use-maintenance';
import type { User } from '@/hooks/use-users';

const TOOLS = [
  { id: 'CCleaner', label: 'CCleaner' },
  { id: 'Malwarebytes', label: 'Malwarebytes' },
  { id: 'TempFiles', label: 'Temp Files Cleanup' },
  { id: 'WindowsUpdate', label: 'Windows Update' },
  { id: 'DiskCleanup', label: 'Disk Cleanup' },
  { id: 'BrowserCache', label: 'Browser Cache' },
  { id: 'StartupOptimization', label: 'Startup Optimization' },
  { id: 'DriverUpdates', label: 'Driver Updates' },
  { id: 'Other', label: 'Other' },
] as const;

interface Props {
  computer: Computer;
  users: User[];
  onClose: () => void;
  onSuccess: (msg: string) => void;
  onError: (msg: string) => void;
}

function nowLocalInput() {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function LogMaintenanceDialog({ computer, onClose, onSuccess, onError }: Props) {
  const createLog = useCreateLog();

  const { data: ticketsData } = useAdminTickets({
    computerId: computer.id,
    status: 'open',
    pageSize: 50,
  });
  const openTickets = ticketsData?.data ?? [];

  // Show warning step first if computer is recently serviced (status === 'ok')
  const [step, setStep] = useState<'warn' | 'form'>(
    computer.maintenanceStatus === 'ok' ? 'warn' : 'form',
  );

  const [type, setType] = useState<'preventive' | 'corrective' | 'emergency'>('preventive');
  const [performedDate, setPerformedDate] = useState(nowLocalInput());
  const [duration, setDuration] = useState('');
  const [selectedTools, setSelectedTools] = useState<string[]>([]);
  const [issuesFound, setIssuesFound] = useState('');
  const [actionsTaken, setActionsTaken] = useState('');
  const [notes, setNotes] = useState('');
  const [relatedTicketId, setRelatedTicketId] = useState('');
  const [saving, setSaving] = useState(false);

  function toggleTool(id: string) {
    setSelectedTools((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id],
    );
  }

  async function handleSave() {
    if (!performedDate) return;
    setSaving(true);
    try {
      await createLog.mutateAsync({
        computerId: computer.id,
        maintenanceType: type,
        performedDate,
        durationMinutes: duration ? parseInt(duration, 10) : null,
        toolsUsed: selectedTools as never,
        issuesFound: issuesFound.trim() || undefined,
        actionsTaken: actionsTaken.trim() || undefined,
        notes: notes.trim() || undefined,
        relatedTicketId: relatedTicketId ? parseInt(relatedTicketId, 10) : null,
      });
      onSuccess('Maintenance log saved.');
      onClose();
    } catch (e) {
      onError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  if (step === 'warn') {
    const lastDate = computer.lastPreventiveDate
      ? new Date(computer.lastPreventiveDate).toLocaleDateString()
      : '—';
    const nextDate = new Date(computer.nextDueDate).toLocaleDateString();

    return (
      <Dialog open onOpenChange={onClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Log Maintenance — {computer.computerName}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4 py-4 text-center">
            <div
              className="flex items-center justify-center w-14 h-14 rounded-full"
              style={{ backgroundColor: '#f59e0b20' }}
            >
              <AlertTriangle size={28} style={{ color: '#f59e0b' }} />
            </div>
            <div>
              <p className="font-semibold text-base mb-1" style={{ color: 'var(--text-primary)' }}>
                This computer was recently serviced
              </p>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                Last preventive maintenance: <strong>{lastDate}</strong>
              </p>
              <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                Next maintenance isn&apos;t due until <strong>{nextDate}</strong>.
              </p>
              <p className="text-sm mt-3" style={{ color: 'var(--text-muted)' }}>
                Are you sure you want to log a new maintenance session?
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={() => setStep('form')}>Proceed Anyway</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Log Maintenance — {computer.computerName}</DialogTitle>
          <DialogDescription>Record a completed maintenance session.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-2 max-h-[65vh] overflow-y-auto pr-1">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Type *</Label>
              <Select value={type} onValueChange={(v) => setType(v as typeof type)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="preventive">Preventive</SelectItem>
                  <SelectItem value="corrective">Corrective</SelectItem>
                  <SelectItem value="emergency">Emergency</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Duration (minutes)</Label>
              <Input
                type="number"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder="e.g. 45"
              />
            </div>
          </div>
          <div>
            <Label>Date &amp; Time *</Label>
            <Input
              type="datetime-local"
              value={performedDate}
              onChange={(e) => setPerformedDate(e.target.value)}
            />
          </div>
          <div>
            <Label className="mb-2 block">Tools Used</Label>
            <div className="grid grid-cols-3 gap-2">
              {TOOLS.map((t) => (
                <label key={t.id} className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedTools.includes(t.id)}
                    onChange={() => toggleTool(t.id)}
                  />
                  {t.label}
                </label>
              ))}
            </div>
          </div>
          <div>
            <Label>Issues Found</Label>
            <textarea
              className="w-full rounded-md border px-3 py-2 text-sm"
              style={{ borderColor: 'var(--border)', background: 'var(--bg-card)', color: 'var(--text-primary)' }}
              rows={2}
              value={issuesFound}
              onChange={(e) => setIssuesFound(e.target.value)}
            />
          </div>
          <div>
            <Label>Actions Taken</Label>
            <textarea
              className="w-full rounded-md border px-3 py-2 text-sm"
              style={{ borderColor: 'var(--border)', background: 'var(--bg-card)', color: 'var(--text-primary)' }}
              rows={2}
              value={actionsTaken}
              onChange={(e) => setActionsTaken(e.target.value)}
            />
          </div>
          <div>
            <Label>Notes</Label>
            <textarea
              className="w-full rounded-md border px-3 py-2 text-sm"
              style={{ borderColor: 'var(--border)', background: 'var(--bg-card)', color: 'var(--text-primary)' }}
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
          {openTickets.length > 0 && (
            <div>
              <Label>Link to Open Ticket (optional)</Label>
              <Select
                value={relatedTicketId || 'none'}
                onValueChange={(v) => setRelatedTicketId(v === 'none' ? '' : v)}
              >
                <SelectTrigger><SelectValue placeholder="Select ticket…" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">— None —</SelectItem>
                  {openTickets.map((t) => (
                    <SelectItem key={t.id} value={String(t.id)}>
                      #{t.id} — {t.subject}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving || !performedDate}>
            {saving ? 'Saving…' : 'Save Log'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
