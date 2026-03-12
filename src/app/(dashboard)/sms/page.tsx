'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import {
  MessageSquare,
  Send,
  Plus,
  Phone,
  Loader2,
  Search,
} from 'lucide-react';
import Header from '@/components/layout/header';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loading } from '@/components/ui/loading';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { formatPhone, formatDateTime } from '@/lib/utils';
import {
  useConversations,
  useMessages,
  useSendSms,
  type Conversation,
} from '@/hooks/use-sms';

/* -------------------------------------------------- */
/*  Helpers                                            */
/* -------------------------------------------------- */

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return formatDateTime(dateStr);
}

/* -------------------------------------------------- */
/*  Main Page                                          */
/* -------------------------------------------------- */

export default function SmsPage() {
  const [selectedPhone, setSelectedPhone] = useState<string | null>(null);
  const [messageText, setMessageText] = useState('');
  const [newDialogOpen, setNewDialogOpen] = useState(false);
  const [newPhone, setNewPhone] = useState('');
  const [searchFilter, setSearchFilter] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  /* ---- Queries ---- */
  const { data: conversations, isLoading: loadingConversations } = useConversations();
  const { data: messages, isLoading: loadingMessages } = useMessages(selectedPhone);

  /* ---- Mutations ---- */
  const sendSms = useSendSms();

  /* ---- Auto-scroll ---- */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  /* ---- Send handler ---- */
  const handleSend = useCallback(() => {
    if (!selectedPhone || !messageText.trim()) return;
    sendSms.mutate(
      { phone: selectedPhone, body: messageText.trim() },
      {
        onSuccess: () => setMessageText(''),
      },
    );
  }, [selectedPhone, messageText, sendSms]);

  /* ---- New conversation ---- */
  const handleNewConversation = useCallback(() => {
    const digits = newPhone.replace(/\D/g, '');
    if (digits.length < 10) return;
    setSelectedPhone(digits);
    setNewDialogOpen(false);
    setNewPhone('');
  }, [newPhone]);

  /* ---- Key handler for message input ---- */
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend],
  );

  /* ---- Filtered conversations ---- */
  const filteredConversations = conversations?.filter((c) => {
    if (!searchFilter) return true;
    const q = searchFilter.toLowerCase();
    return (
      c.phone.includes(q) ||
      formatPhone(c.phone).toLowerCase().includes(q) ||
      c.lastMessage.toLowerCase().includes(q)
    );
  });

  const selectedConversation = conversations?.find(
    (c) => c.phone === selectedPhone,
  );

  return (
    <>
      <Header title="SMS Messages" />

      <div className="mx-auto max-w-[1600px] pt-6">
        <Card className="flex overflow-hidden" style={{ height: 'calc(100vh - 160px)' }}>
          {/* ============================================ */}
          {/*  LEFT PANEL - Conversation List              */}
          {/* ============================================ */}
          <div
            className="flex w-[340px] shrink-0 flex-col border-r"
            style={{ borderColor: 'var(--border)' }}
          >
            {/* Header bar */}
            <div
              className="flex items-center justify-between border-b px-4 py-3"
              style={{ borderColor: 'var(--border)' }}
            >
              <h2
                className="text-sm font-semibold"
                style={{ color: 'var(--text-primary)' }}
              >
                Conversations
              </h2>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setNewDialogOpen(true)}
              >
                <Plus className="h-4 w-4" />
                New Message
              </Button>
            </div>

            {/* Search */}
            <div className="border-b px-3 py-2" style={{ borderColor: 'var(--border)' }}>
              <div className="relative">
                <Search
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2"
                  style={{ color: 'var(--text-muted)' }}
                />
                <Input
                  placeholder="Search conversations..."
                  className="pl-9"
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                />
              </div>
            </div>

            {/* Conversation list */}
            <div className="flex-1 overflow-y-auto">
              {loadingConversations ? (
                <Loading className="py-12" />
              ) : !filteredConversations || filteredConversations.length === 0 ? (
                <div className="flex flex-col items-center justify-center px-4 py-12">
                  <div
                    className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl"
                    style={{ backgroundColor: 'var(--accent-subtle)' }}
                  >
                    <MessageSquare
                      className="h-6 w-6"
                      style={{ color: 'var(--accent)' }}
                    />
                  </div>
                  <p
                    className="text-sm font-medium"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    No conversations yet
                  </p>
                  <p
                    className="mt-1 text-center text-xs"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    Start a new message to begin
                  </p>
                </div>
              ) : (
                filteredConversations.map((conv: Conversation) => {
                  const isActive = conv.phone === selectedPhone;
                  return (
                    <button
                      key={conv.phone}
                      type="button"
                      onClick={() => setSelectedPhone(conv.phone)}
                      className="flex w-full items-start gap-3 border-b px-4 py-3 text-left transition-colors"
                      style={{
                        borderColor: 'var(--border)',
                        backgroundColor: isActive
                          ? 'rgba(0, 212, 255, 0.06)'
                          : 'transparent',
                        borderLeft: isActive
                          ? '3px solid var(--accent)'
                          : '3px solid transparent',
                      }}
                    >
                      <div
                        className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
                        style={{
                          backgroundColor: isActive
                            ? 'var(--accent-subtle)'
                            : 'var(--bg-secondary)',
                        }}
                      >
                        <Phone
                          className="h-4 w-4"
                          style={{
                            color: isActive
                              ? 'var(--accent)'
                              : 'var(--text-muted)',
                          }}
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <span
                            className="text-sm font-medium"
                            style={{
                              color: isActive
                                ? 'var(--accent)'
                                : 'var(--text-primary)',
                            }}
                          >
                            {formatPhone(conv.phone)}
                          </span>
                          <span
                            className="shrink-0 text-xs"
                            style={{ color: 'var(--text-muted)' }}
                          >
                            {timeAgo(conv.lastMessageAt)}
                          </span>
                        </div>
                        <p
                          className="mt-0.5 truncate text-xs"
                          style={{ color: 'var(--text-secondary)' }}
                        >
                          {conv.lastMessage}
                        </p>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* ============================================ */}
          {/*  RIGHT PANEL - Message Thread                */}
          {/* ============================================ */}
          <div className="flex min-w-0 flex-1 flex-col">
            {!selectedPhone ? (
              /* Empty state */
              <div className="flex flex-1 flex-col items-center justify-center">
                <div
                  className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl"
                  style={{ backgroundColor: 'var(--accent-subtle)' }}
                >
                  <MessageSquare
                    className="h-8 w-8"
                    style={{ color: 'var(--accent)' }}
                  />
                </div>
                <h3
                  className="mb-1 text-lg font-semibold"
                  style={{ color: 'var(--text-primary)' }}
                >
                  Select a conversation
                </h3>
                <p
                  className="text-sm"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  Choose a conversation from the list or start a new one.
                </p>
              </div>
            ) : (
              <>
                {/* Thread header */}
                <div
                  className="flex items-center gap-3 border-b px-5 py-3"
                  style={{ borderColor: 'var(--border)' }}
                >
                  <div
                    className="flex h-9 w-9 items-center justify-center rounded-full"
                    style={{ backgroundColor: 'var(--accent-subtle)' }}
                  >
                    <Phone
                      className="h-4 w-4"
                      style={{ color: 'var(--accent)' }}
                    />
                  </div>
                  <div>
                    <p
                      className="text-sm font-semibold"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      {formatPhone(selectedPhone)}
                    </p>
                    {selectedConversation && (
                      <p
                        className="text-xs"
                        style={{ color: 'var(--text-muted)' }}
                      >
                        Last active {timeAgo(selectedConversation.lastMessageAt)}
                      </p>
                    )}
                  </div>
                </div>

                {/* Messages area */}
                <div className="flex-1 overflow-y-auto px-5 py-4">
                  {loadingMessages ? (
                    <Loading className="py-12" />
                  ) : !messages || messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12">
                      <p
                        className="text-sm"
                        style={{ color: 'var(--text-muted)' }}
                      >
                        No messages yet. Send one to start the conversation.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {messages.map((msg) => {
                        const isOutbound = msg.direction === 'outbound';
                        return (
                          <div
                            key={msg.id}
                            className={`flex ${isOutbound ? 'justify-end' : 'justify-start'}`}
                          >
                            <div
                              className="max-w-[70%] rounded-2xl px-4 py-2.5"
                              style={{
                                backgroundColor: isOutbound
                                  ? 'var(--accent)'
                                  : 'var(--bg-secondary)',
                                color: isOutbound
                                  ? '#0a0a12'
                                  : 'var(--text-primary)',
                                borderBottomRightRadius: isOutbound
                                  ? '4px'
                                  : undefined,
                                borderBottomLeftRadius: !isOutbound
                                  ? '4px'
                                  : undefined,
                              }}
                            >
                              <p className="text-sm leading-relaxed whitespace-pre-wrap">
                                {msg.body}
                              </p>
                              <p
                                className="mt-1 text-right text-[10px]"
                                style={{
                                  opacity: 0.7,
                                  color: isOutbound
                                    ? '#0a0a12'
                                    : 'var(--text-muted)',
                                }}
                              >
                                {formatDateTime(msg.createdAt)}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                      <div ref={messagesEndRef} />
                    </div>
                  )}
                </div>

                {/* Input bar */}
                <div
                  className="border-t px-4 py-3"
                  style={{ borderColor: 'var(--border)' }}
                >
                  <div className="flex items-end gap-2">
                    <textarea
                      placeholder="Type a message..."
                      rows={1}
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      onKeyDown={handleKeyDown}
                      className="flex-1 resize-none rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-card)] px-3 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-subtle)]"
                      style={{ maxHeight: '120px' }}
                    />
                    <Button
                      onClick={handleSend}
                      disabled={!messageText.trim() || sendSms.isPending}
                    >
                      {sendSms.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                      Send
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>
        </Card>
      </div>

      {/* ---- New Conversation Dialog ---- */}
      <Dialog open={newDialogOpen} onOpenChange={setNewDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Message</DialogTitle>
            <DialogDescription>
              Enter a phone number to start a new conversation.
            </DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <Label htmlFor="new-phone" className="mb-1.5 block text-xs">
              Phone Number
            </Label>
            <Input
              id="new-phone"
              type="tel"
              placeholder="(555) 555-5555"
              value={newPhone}
              onChange={(e) => setNewPhone(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleNewConversation();
              }}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setNewDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleNewConversation}
              disabled={newPhone.replace(/\D/g, '').length < 10}
            >
              <MessageSquare className="h-4 w-4" />
              Start Conversation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
