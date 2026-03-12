import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

/* -------------------------------------------------- */
/*  Types                                              */
/* -------------------------------------------------- */

export interface Conversation {
  phone: string;
  lastMessage: string;
  lastMessageAt: string;
  unread: number;
}

export interface SmsMessage {
  id: number;
  phone: string;
  body: string;
  direction: 'inbound' | 'outbound';
  createdAt: string;
}

export interface SendSmsPayload {
  phone: string;
  body: string;
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
/*  Queries                                            */
/* -------------------------------------------------- */

export function useConversations() {
  return useQuery<Conversation[]>({
    queryKey: ['sms-conversations'],
    queryFn: () => fetchJson('/api/sms'),
    refetchInterval: 15_000,
  });
}

export function useMessages(phone: string | null) {
  return useQuery<SmsMessage[]>({
    queryKey: ['sms-messages', phone],
    queryFn: () => fetchJson(`/api/sms/${encodeURIComponent(phone!)}`),
    enabled: !!phone,
    refetchInterval: 10_000,
  });
}

/* -------------------------------------------------- */
/*  Mutations                                          */
/* -------------------------------------------------- */

export function useSendSms() {
  const qc = useQueryClient();
  return useMutation<{ success: boolean }, Error, SendSmsPayload>({
    mutationFn: (payload) =>
      fetchJson('/api/sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneNumber: payload.phone,
          messageBody: payload.body,
        }),
      }),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ['sms-conversations'] });
      qc.invalidateQueries({ queryKey: ['sms-messages', variables.phone] });
    },
  });
}
