'use client';

import { useMutation } from '@tanstack/react-query';

/* -------------------------------------------------- */
/*  Types                                              */
/* -------------------------------------------------- */

export interface ImportRow {
  [key: string]: string;
}

export interface ColumnMapping {
  businessName: string;
  phone: string;
  address: string;
  location: string;
  industry: string;
  timezone: string;
}

export interface ValidationResult {
  valid: number;
  errors: { row: number; message: string }[];
  duplicates: number;
}

export interface ImportResult {
  imported: number;
  skipped: number;
  errors: { row: number; message: string }[];
}

export interface ValidatePayload {
  rows: ImportRow[];
  mapping: ColumnMapping;
}

export interface ImportPayload {
  rows: ImportRow[];
  mapping: ColumnMapping;
}

/* -------------------------------------------------- */
/*  Helpers                                            */
/* -------------------------------------------------- */

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed (${res.status})`);
  }
  return res.json();
}

/* -------------------------------------------------- */
/*  Mutations                                          */
/* -------------------------------------------------- */

export function useValidateImport() {
  return useMutation<ValidationResult, Error, ValidatePayload>({
    mutationFn: (payload) =>
      fetchJson('/api/import/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }),
  });
}

export function useImportLeads() {
  return useMutation<ImportResult, Error, ImportPayload>({
    mutationFn: (payload) =>
      fetchJson('/api/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }),
  });
}
