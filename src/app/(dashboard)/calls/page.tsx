'use client';

import { useState, useCallback, useEffect } from 'react';
import { useForm } from 'react-hook-form';
/** Decode HTML entities (named and numeric) */
function decodeEntities(text: string): string {
  return text
    .replace(/&#(\d+);/g, (_m, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_m, code) => String.fromCharCode(parseInt(code, 16)))
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, ' ');
}

/** Strip all HTML tags and decode entities to render uniform plain text */
function stripHtml(html: string): string {
  let text = html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/?(p|div|h[1-6]|li|tr|ul|ol)[^>]*>/gi, '\n')
    .replace(/<[^>]+>/g, '');
  text = decodeEntities(text);
  text = text.replace(/\n{2,}/g, '\n').trim();
  return text;
}
import {
  Phone,
  MapPin,
  Building2,
  Globe,
  ChevronDown,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Undo2,
  MessageCircle,
  DollarSign,
  User,
  Mail,
  Calendar,
  PhoneCall,
} from 'lucide-react';
import Header from '@/components/layout/header';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Loading } from '@/components/ui/loading';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { formatPhone } from '@/lib/utils';
import {
  useDispositions,
  useFilters,
  useClosers,
  useNextLead,
  useLogCall,
  useRevertBusiness,
  useRebuttals,
  type LeadBusiness,
  type LogCallPayload,
} from '@/hooks/use-calls';

/* -------------------------------------------------- */
/*  Constants                                          */
/* -------------------------------------------------- */

const DISPOSITION_POTENTIAL_CLIENT = 4;
const DISPOSITION_CALL_BACK = 8;
const DISPOSITION_INFO_REQUEST = 10;

const DISPOSITIONS_WITH_FORM = new Set([
  DISPOSITION_POTENTIAL_CLIENT,
  DISPOSITION_INFO_REQUEST,
  DISPOSITION_CALL_BACK,
]);

function getSubmitLabel(id: number | null): string {
  switch (id) {
    case DISPOSITION_POTENTIAL_CLIENT:
      return 'Submit Potential Client';
    case DISPOSITION_INFO_REQUEST:
      return 'Submit Info Request';
    case DISPOSITION_CALL_BACK:
      return 'Submit Call Back';
    default:
      return 'Log & Next Call';
  }
}

/* -------------------------------------------------- */
/*  Form data shape                                    */
/* -------------------------------------------------- */

interface CallFormData {
  dmakerName: string;
  dmakerEmail: string;
  dmakerPhone: string;
  debtorName: string;
  debtAmount: string;
  agreementSent: string;
  idCloser: string;
  callBack: string;
  comments: string;
}

const defaultValues: CallFormData = {
  dmakerName: '',
  dmakerEmail: '',
  dmakerPhone: '',
  debtorName: '',
  debtAmount: '',
  agreementSent: '',
  idCloser: '',
  callBack: '',
  comments: '',
};

/* -------------------------------------------------- */
/*  Toast                                              */
/* -------------------------------------------------- */

interface Toast {
  message: string;
  type: 'success' | 'error';
}

function ToastNotification({ toast, onClose }: { toast: Toast; onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 4000);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div
      className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-xl border px-5 py-3 shadow-lg animate-in slide-in-from-bottom-4 fade-in duration-300"
      style={{
        backgroundColor: 'var(--bg-elevated)',
        borderColor: toast.type === 'success' ? 'var(--success)' : 'var(--danger)',
        color: 'var(--text-primary)',
      }}
    >
      {toast.type === 'success' ? (
        <CheckCircle2 className="h-5 w-5 shrink-0" style={{ color: 'var(--success)' }} />
      ) : (
        <AlertCircle className="h-5 w-5 shrink-0" style={{ color: 'var(--danger)' }} />
      )}
      <span className="text-sm font-medium">{toast.message}</span>
    </div>
  );
}

/* -------------------------------------------------- */
/*  Rebuttal Tabs                                      */
/* -------------------------------------------------- */

/* -------------------------------------------------- */
/*  Main Page                                          */
/* -------------------------------------------------- */

export default function CallsPage() {
  /* ---- Queries ---- */
  const { data: dispositions, isLoading: loadingDispos } = useDispositions();
  const { data: filters, isLoading: loadingFilters } = useFilters();
  const { data: closers } = useClosers();
  const { data: rebuttals, isLoading: loadingRebuttals } = useRebuttals();

  /* ---- Mutations ---- */
  const nextLead = useNextLead();
  const logCall = useLogCall();
  const revertBusiness = useRevertBusiness();

  /* ---- Local state ---- */
  const [timezone, setTimezone] = useState('');
  const [industry, setIndustry] = useState('');
  const [lead, setLead] = useState<LeadBusiness | null>(null);
  const [previousLead, setPreviousLead] = useState<LeadBusiness | null>(null);
  const [selectedDisposition, setSelectedDisposition] = useState<number | null>(null);
  const [toast, setToast] = useState<Toast | null>(null);
  const [rebuttalsOpen, setRebuttalsOpen] = useState(true);
  const [selectedRebuttalId, setSelectedRebuttalId] = useState<number | null>(null);

  /* ---- Form ---- */
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
  } = useForm<CallFormData>({ defaultValues });

  const closerValue = watch('idCloser');

  /* ---- Show toast ---- */
  const showToast = useCallback((message: string, type: 'success' | 'error') => {
    setToast({ message, type });
  }, []);

  /* ---- Get next lead ---- */
  const fetchLead = useCallback(() => {
    if (!timezone) {
      showToast('Please select a timezone first.', 'error');
      return;
    }
    nextLead.mutate(
      { timezone, industry: industry && industry !== 'random' ? industry : undefined },
      {
        onSuccess: (data) => {
          setLead(data);
          setSelectedDisposition(null);
          reset(defaultValues);
        },
        onError: (err) => {
          if (err.message.includes('No leads')) {
            setLead(null);
            showToast('No leads available for the selected filters.', 'error');
          } else {
            showToast(err.message || 'Failed to fetch lead.', 'error');
          }
        },
      },
    );
  }, [timezone, industry, nextLead, reset, showToast]);

  /* ---- Revert last ---- */
  const handleRevert = useCallback(() => {
    if (!previousLead) return;
    revertBusiness.mutate(
      { idBusiness: previousLead.idBusiness },
      {
        onSuccess: () => {
          setLead(previousLead);
          setPreviousLead(null);
          setSelectedDisposition(null);
          reset(defaultValues);
          showToast('Business reverted successfully.', 'success');
        },
        onError: () => showToast('Failed to revert.', 'error'),
      },
    );
  }, [previousLead, revertBusiness, reset, showToast]);

  /* ---- Submit call ---- */
  const onSubmit = useCallback(
    (formData: CallFormData) => {
      if (!lead || selectedDisposition === null) return;

      const payload: LogCallPayload = {
        idBusiness: lead.idBusiness,
        idDisposition: selectedDisposition,
      };

      // Populate payload based on disposition
      if (DISPOSITIONS_WITH_FORM.has(selectedDisposition)) {
        if (formData.comments.trim()) payload.comments = formData.comments.trim();
        if (formData.dmakerName.trim()) payload.dmakerName = formData.dmakerName.trim();
        if (formData.dmakerEmail.trim()) payload.dmakerEmail = formData.dmakerEmail.trim();
        if (formData.dmakerPhone.trim()) payload.dmakerPhone = formData.dmakerPhone.trim();
        if (formData.idCloser) payload.idCloser = Number(formData.idCloser);
      }

      if (
        selectedDisposition === DISPOSITION_POTENTIAL_CLIENT ||
        selectedDisposition === DISPOSITION_CALL_BACK
      ) {
        if (formData.callBack) payload.callBack = formData.callBack;
      }

      if (selectedDisposition === DISPOSITION_POTENTIAL_CLIENT) {
        if (formData.debtorName.trim()) payload.debtorName = formData.debtorName.trim();
        if (formData.debtAmount) payload.debtAmount = parseFloat(formData.debtAmount);
        if (formData.agreementSent) payload.agreementSent = formData.agreementSent === 'yes';
      }

      logCall.mutate(payload, {
        onSuccess: () => {
          showToast('Call logged successfully!', 'success');
          setPreviousLead(lead);
          setLead(null);
          setSelectedDisposition(null);
          reset(defaultValues);
          // Auto-load next lead
          if (timezone) {
            nextLead.mutate(
              { timezone, industry: industry && industry !== 'random' ? industry : undefined },
              {
                onSuccess: (data) => {
                  setLead(data);
                },
                onError: () => {
                  setLead(null);
                },
              },
            );
          }
        },
        onError: (err) => showToast(err.message || 'Failed to log call.', 'error'),
      });
    },
    [lead, selectedDisposition, logCall, nextLead, timezone, industry, reset, showToast],
  );

  /* ---- Quick submit for dispositions without a form ---- */
  const handleQuickSubmit = useCallback(() => {
    if (!lead || selectedDisposition === null) return;
    onSubmit(defaultValues);
  }, [lead, selectedDisposition, onSubmit]);

  /* ---- Determine which form fields to show ---- */
  const showDecisionMaker = DISPOSITIONS_WITH_FORM.has(selectedDisposition ?? -1);
  const showDebtorInfo = selectedDisposition === DISPOSITION_POTENTIAL_CLIENT;
  const showAgreement = selectedDisposition === DISPOSITION_POTENTIAL_CLIENT;
  const showCloser = DISPOSITIONS_WITH_FORM.has(selectedDisposition ?? -1);
  const showCallback =
    selectedDisposition === DISPOSITION_POTENTIAL_CLIENT ||
    selectedDisposition === DISPOSITION_CALL_BACK;
  const showComments = DISPOSITIONS_WITH_FORM.has(selectedDisposition ?? -1);
  const showFullForm = DISPOSITIONS_WITH_FORM.has(selectedDisposition ?? -1);

  const isSubmitting = logCall.isPending || nextLead.isPending;

  return (
    <>
      <Header title="Calls" />

      <div className="mx-auto max-w-[1200px] pt-6">
        <div className="space-y-5">
            {/* ---- Filter Bar ---- */}
            <Card>
              <CardContent className="p-4">
                <div className="flex flex-wrap items-end gap-4">
                  {/* Timezone */}
                  <div className="min-w-[200px] flex-1">
                    <Label className="mb-1.5 block text-xs" style={{ color: 'var(--text-secondary)' }}>
                      Timezone <span style={{ color: 'var(--danger)' }}>*</span>
                    </Label>
                    {loadingFilters ? (
                      <div className="flex h-10 items-center">
                        <Loading size="sm" />
                      </div>
                    ) : (
                      <Select value={timezone} onValueChange={setTimezone}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select timezone" />
                        </SelectTrigger>
                        <SelectContent>
                          {filters?.timezones.map((tz) => (
                            <SelectItem key={tz} value={tz}>
                              {tz}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>

                  {/* Industry */}
                  <div className="min-w-[200px] flex-1">
                    <Label className="mb-1.5 block text-xs" style={{ color: 'var(--text-secondary)' }}>
                      Industry
                    </Label>
                    {loadingFilters ? (
                      <div className="flex h-10 items-center">
                        <Loading size="sm" />
                      </div>
                    ) : (
                      <Select value={industry} onValueChange={setIndustry}>
                        <SelectTrigger>
                          <SelectValue placeholder="Random Industry" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="random">Random Industry</SelectItem>
                          {filters?.industries.map((ind) => (
                            <SelectItem key={ind} value={ind}>
                              {ind}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>

                  {/* Get Lead Button */}
                  <Button
                    onClick={fetchLead}
                    disabled={!timezone || nextLead.isPending}
                    size="lg"
                    className="shrink-0"
                  >
                    {nextLead.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <PhoneCall className="h-4 w-4" />
                    )}
                    Get Lead
                  </Button>

                  {/* Revert Button */}
                  {previousLead && (
                    <Button
                      variant="outline"
                      onClick={handleRevert}
                      disabled={revertBusiness.isPending}
                      className="shrink-0"
                    >
                      {revertBusiness.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Undo2 className="h-4 w-4" />
                      )}
                      Revert Last
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* ---- Loading State ---- */}
            {nextLead.isPending && !lead && (
              <Card>
                <CardContent className="flex items-center justify-center p-12">
                  <div className="text-center">
                    <Loading className="mx-auto mb-3" />
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                      Finding your next lead...
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* ---- Empty State ---- */}
            {!lead && !nextLead.isPending && (
              <Card>
                <CardContent className="flex flex-col items-center justify-center p-16">
                  <div
                    className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl"
                    style={{ backgroundColor: 'var(--accent-subtle)' }}
                  >
                    <Phone className="h-8 w-8" style={{ color: 'var(--accent)' }} />
                  </div>
                  <h3
                    className="mb-1 text-lg font-semibold"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    Ready to start calling
                  </h3>
                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                    Select a timezone and click &quot;Get Lead&quot; to load your first business.
                  </p>
                </CardContent>
              </Card>
            )}

            {/* ---- Business Info Card ---- */}
            {lead && (
              <Card className="overflow-hidden">
                <div
                  className="h-1 w-full"
                  style={{ background: 'linear-gradient(90deg, var(--accent), var(--purple))' }}
                />
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-xl">{lead.businessName}</CardTitle>
                      <a
                        href={`tel:${lead.phone}`}
                        className="mt-1 inline-flex items-center gap-1.5 text-base font-semibold"
                        style={{ color: 'var(--accent)' }}
                      >
                        <Phone className="h-4 w-4" />
                        {formatPhone(lead.phone)}
                      </a>
                    </div>
                    <Badge variant="default">Lead</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-x-8 gap-y-3 sm:grid-cols-4">
                    <InfoItem
                      icon={MapPin}
                      label="Address"
                      value={lead.address || 'N/A'}
                    />
                    <InfoItem
                      icon={Globe}
                      label="Location"
                      value={lead.location || 'N/A'}
                    />
                    <InfoItem
                      icon={Building2}
                      label="Industry"
                      value={lead.industry || 'N/A'}
                    />
                    <InfoItem
                      icon={Globe}
                      label="Timezone"
                      value={lead.timezone || 'N/A'}
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* ---- Disposition Selection ---- */}
            {lead && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Disposition</CardTitle>
                </CardHeader>
                <CardContent>
                  {loadingDispos ? (
                    <Loading className="py-4" />
                  ) : (
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
                      {dispositions?.map((d) => {
                        const isActive = selectedDisposition === d.idDisposition;
                        return (
                          <button
                            key={d.idDisposition}
                            type="button"
                            onClick={() => {
                              setSelectedDisposition(d.idDisposition);
                              reset(defaultValues);
                            }}
                            className="rounded-lg border px-3 py-2.5 text-left text-sm font-medium transition-all"
                            style={{
                              borderColor: isActive
                                ? 'var(--accent)'
                                : 'var(--border)',
                              backgroundColor: isActive
                                ? 'rgba(0, 212, 255, 0.08)'
                                : 'var(--bg-card)',
                              color: isActive
                                ? 'var(--accent)'
                                : 'var(--text-primary)',
                              boxShadow: isActive
                                ? '0 0 12px rgba(0, 212, 255, 0.15)'
                                : 'none',
                            }}
                          >
                            <span className="flex items-center gap-2">
                              <span
                                className="inline-block h-2 w-2 rounded-full"
                                style={{
                                  backgroundColor: isActive
                                    ? 'var(--accent)'
                                    : 'var(--text-muted)',
                                }}
                              />
                              {d.disposition}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* ---- Rebuttals ---- */}
            {lead && (
              <Card>
                <CardHeader className="pb-3">
                  <button
                    type="button"
                    className="flex w-full items-center justify-between"
                    onClick={() => setRebuttalsOpen(!rebuttalsOpen)}
                  >
                    <CardTitle className="flex items-center gap-2 text-base">
                      <MessageCircle className="h-4 w-4" style={{ color: 'var(--accent)' }} />
                      Rebuttals
                    </CardTitle>
                    <ChevronDown
                      className="h-4 w-4 transition-transform"
                      style={{
                        color: 'var(--text-muted)',
                        transform: rebuttalsOpen ? 'rotate(0deg)' : 'rotate(-90deg)',
                      }}
                    />
                  </button>
                </CardHeader>
                {rebuttalsOpen && (
                  <CardContent>
                    {loadingRebuttals ? (
                      <Loading className="py-6" />
                    ) : rebuttals && rebuttals.length > 0 ? (
                      <>
                        {/* Tab buttons */}
                        <div className="flex flex-wrap gap-1.5">
                          {rebuttals.map((r) => {
                            const isSelected = selectedRebuttalId === r.idRebuttal;
                            return (
                              <button
                                key={r.idRebuttal}
                                type="button"
                                onClick={() =>
                                  setSelectedRebuttalId(isSelected ? null : r.idRebuttal)
                                }
                                className="rounded-md border px-2.5 py-1 text-xs font-medium transition-colors"
                                style={{
                                  borderColor: isSelected ? 'var(--accent)' : 'var(--border)',
                                  backgroundColor: isSelected ? 'rgba(0, 212, 255, 0.1)' : 'var(--bg-card)',
                                  color: isSelected ? 'var(--accent)' : 'var(--text-secondary)',
                                }}
                              >
                                {decodeEntities(r.title)}
                              </button>
                            );
                          })}
                        </div>

                        {/* Selected rebuttal content */}
                        {selectedRebuttalId && (() => {
                          const selected = rebuttals.find((r) => r.idRebuttal === selectedRebuttalId);
                          if (!selected) return null;
                          return (
                            <div
                              className="mt-4 rounded-lg border p-4 text-sm leading-relaxed whitespace-pre-wrap"
                              style={{
                                borderColor: 'var(--border)',
                                backgroundColor: 'var(--bg-primary)',
                                color: 'var(--text-secondary)',
                              }}
                            >
                              <h4
                                className="mb-2 text-center text-base font-semibold"
                                style={{ color: 'var(--text-primary)' }}
                              >
                                {decodeEntities(selected.title)}
                              </h4>
                              {stripHtml(selected.content)}
                            </div>
                          );
                        })()}
                      </>
                    ) : (
                      <p className="py-4 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
                        No rebuttals available.
                      </p>
                    )}
                  </CardContent>
                )}
              </Card>
            )}

            {/* ---- Dynamic Form ---- */}
            {lead && selectedDisposition !== null && (
              <form onSubmit={showFullForm ? handleSubmit(onSubmit) : undefined}>
                {showFullForm && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">Call Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Decision Maker Section */}
                      {showDecisionMaker && (
                        <fieldset>
                          <legend
                            className="mb-3 flex items-center gap-2 text-sm font-semibold"
                            style={{ color: 'var(--text-primary)' }}
                          >
                            <User className="h-4 w-4" style={{ color: 'var(--accent)' }} />
                            Decision Maker
                          </legend>
                          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                            <div>
                              <Label htmlFor="dmakerName" className="mb-1.5 block text-xs">
                                Name
                              </Label>
                              <Input
                                id="dmakerName"
                                placeholder="Full name"
                                {...register('dmakerName')}
                              />
                            </div>
                            <div>
                              <Label htmlFor="dmakerEmail" className="mb-1.5 block text-xs">
                                Email
                              </Label>
                              <div className="relative">
                                <Mail
                                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2"
                                  style={{ color: 'var(--text-muted)' }}
                                />
                                <Input
                                  id="dmakerEmail"
                                  type="email"
                                  placeholder="email@example.com"
                                  className="pl-9"
                                  {...register('dmakerEmail')}
                                />
                              </div>
                            </div>
                            <div>
                              <Label htmlFor="dmakerPhone" className="mb-1.5 block text-xs">
                                Phone
                              </Label>
                              <div className="relative">
                                <Phone
                                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2"
                                  style={{ color: 'var(--text-muted)' }}
                                />
                                <Input
                                  id="dmakerPhone"
                                  type="tel"
                                  placeholder="(555) 555-5555"
                                  className="pl-9"
                                  {...register('dmakerPhone')}
                                />
                              </div>
                            </div>
                          </div>
                        </fieldset>
                      )}

                      {/* Debtor Info */}
                      {showDebtorInfo && (
                        <fieldset>
                          <legend
                            className="mb-3 flex items-center gap-2 text-sm font-semibold"
                            style={{ color: 'var(--text-primary)' }}
                          >
                            <DollarSign className="h-4 w-4" style={{ color: 'var(--accent)' }} />
                            Debtor Information
                          </legend>
                          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div>
                              <Label htmlFor="debtorName" className="mb-1.5 block text-xs">
                                Debtor Name
                              </Label>
                              <Input
                                id="debtorName"
                                placeholder="Debtor full name"
                                {...register('debtorName')}
                              />
                            </div>
                            <div>
                              <Label htmlFor="debtAmount" className="mb-1.5 block text-xs">
                                Amount Owed
                              </Label>
                              <div className="relative">
                                <span
                                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium"
                                  style={{ color: 'var(--text-muted)' }}
                                >
                                  $
                                </span>
                                <Input
                                  id="debtAmount"
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  placeholder="0.00"
                                  className="pl-7"
                                  {...register('debtAmount')}
                                />
                              </div>
                            </div>
                          </div>
                        </fieldset>
                      )}

                      {/* Agreement Sent */}
                      {showAgreement && (
                        <fieldset>
                          <legend
                            className="mb-3 text-sm font-semibold"
                            style={{ color: 'var(--text-primary)' }}
                          >
                            Agreement Sent
                          </legend>
                          <div className="flex gap-3">
                            {['yes', 'no'].map((val) => (
                              <label
                                key={val}
                                className="flex cursor-pointer items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-all"
                                style={{
                                  borderColor: 'var(--border)',
                                  color: 'var(--text-primary)',
                                }}
                              >
                                <input
                                  type="radio"
                                  value={val}
                                  {...register('agreementSent')}
                                  className="accent-[var(--accent)]"
                                />
                                {val === 'yes' ? 'Yes' : 'No'}
                              </label>
                            ))}
                          </div>
                        </fieldset>
                      )}

                      {/* Closer Assignment */}
                      {showCloser && (
                        <div>
                          <Label className="mb-1.5 block text-xs">Assigned Closer</Label>
                          <Select
                            value={closerValue || undefined}
                            onValueChange={(val) => setValue('idCloser', val)}
                          >
                            <SelectTrigger className="max-w-sm">
                              <SelectValue placeholder="Select a closer" />
                            </SelectTrigger>
                            <SelectContent>
                              {closers?.map((c) => (
                                <SelectItem key={c.userId} value={String(c.userId)}>
                                  {c.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}

                      {/* Callback Date */}
                      {showCallback && (
                        <div>
                          <Label htmlFor="callBack" className="mb-1.5 block text-xs">
                            <span className="flex items-center gap-1.5">
                              <Calendar className="h-3.5 w-3.5" style={{ color: 'var(--accent)' }} />
                              Callback Date
                            </span>
                          </Label>
                          <Input
                            id="callBack"
                            type="datetime-local"
                            className="max-w-sm"
                            {...register('callBack')}
                          />
                        </div>
                      )}

                      {/* Comments */}
                      {showComments && (
                        <div>
                          <Label htmlFor="comments" className="mb-1.5 block text-xs">
                            Comments
                          </Label>
                          <textarea
                            id="comments"
                            rows={3}
                            placeholder="Add notes about this call..."
                            className="flex w-full rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-card)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-subtle)] disabled:cursor-not-allowed disabled:opacity-50"
                            {...register('comments')}
                          />
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* ---- Submit Bar ---- */}
                <div className="mt-5">
                  <Button
                    type={showFullForm ? 'submit' : 'button'}
                    onClick={showFullForm ? undefined : handleQuickSubmit}
                    disabled={isSubmitting}
                    size="lg"
                    className="w-full sm:w-auto"
                  >
                    {isSubmitting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4" />
                    )}
                    {getSubmitLabel(selectedDisposition)}
                  </Button>
                </div>
              </form>
            )}

        </div>
      </div>

      {/* ---- Toast ---- */}
      {toast && (
        <ToastNotification toast={toast} onClose={() => setToast(null)} />
      )}
    </>
  );
}

/* -------------------------------------------------- */
/*  Small helper component                             */
/* -------------------------------------------------- */

function InfoItem({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-2">
      <Icon
        className="mt-0.5 h-4 w-4 shrink-0"
        style={{ color: 'var(--text-muted)' }}
      />
      <div className="min-w-0">
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
          {label}
        </p>
        <p
          className="truncate text-sm font-medium"
          style={{ color: 'var(--text-primary)' }}
        >
          {value}
        </p>
      </div>
    </div>
  );
}
