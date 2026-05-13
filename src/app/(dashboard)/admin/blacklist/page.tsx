'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ShieldX, Plus, Trash2, Phone, Tag } from 'lucide-react';
import Header from '@/components/layout/header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

type BlockedName = { id: number; keyword: string; createdAt: string };
type BlockedAreaCode = { id: number; areaCode: string; createdAt: string };

export default function BlacklistPage() {
  const { data: session } = useSession();
  const userRole = (session?.user as { role?: number })?.role;
  const queryClient = useQueryClient();

  const [newKeyword, setNewKeyword] = useState('');
  const [newAreaCode, setNewAreaCode] = useState('');

  // ─── Blocked Names ───────────────────────────────────────────────────────────
  const { data: names = [], isLoading: namesLoading } = useQuery<BlockedName[]>({
    queryKey: ['blacklist-names'],
    queryFn: () => fetch('/api/admin/blacklist/names').then((r) => r.json()),
    enabled: userRole === 1,
  });

  const addName = useMutation({
    mutationFn: (keyword: string) =>
      fetch('/api/admin/blacklist/names', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyword }),
      }).then((r) => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blacklist-names'] });
      setNewKeyword('');
    },
  });

  const deleteName = useMutation({
    mutationFn: (id: number) =>
      fetch(`/api/admin/blacklist/names/${id}`, { method: 'DELETE' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['blacklist-names'] }),
  });

  // ─── Blocked Area Codes ──────────────────────────────────────────────────────
  const { data: areaCodes = [], isLoading: codesLoading } = useQuery<BlockedAreaCode[]>({
    queryKey: ['blacklist-areacodes'],
    queryFn: () => fetch('/api/admin/blacklist/areacodes').then((r) => r.json()),
    enabled: userRole === 1,
  });

  const addAreaCode = useMutation({
    mutationFn: (areaCode: string) =>
      fetch('/api/admin/blacklist/areacodes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ areaCode }),
      }).then((r) => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blacklist-areacodes'] });
      setNewAreaCode('');
    },
  });

  const deleteAreaCode = useMutation({
    mutationFn: (id: number) =>
      fetch(`/api/admin/blacklist/areacodes/${id}`, { method: 'DELETE' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['blacklist-areacodes'] }),
  });

  if (userRole !== 1) {
    return (
      <>
        <Header title="Blacklist" />
        <div className="flex items-center justify-center pt-20">
          <p style={{ color: 'var(--text-secondary)' }}>
            You do not have permission to access this page.
          </p>
        </div>
      </>
    );
  }

  return (
    <>
      <Header title="Blacklist" />

      <div className="mx-auto max-w-4xl space-y-6 pt-6">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardContent className="flex items-center gap-4 py-5">
              <div
                className="flex h-12 w-12 items-center justify-center rounded-xl"
                style={{ backgroundColor: 'var(--accent-subtle)' }}
              >
                <Tag className="h-5 w-5" style={{ color: 'var(--accent)' }} />
              </div>
              <div>
                <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                  {names.length}
                </p>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  Blocked Keywords
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 py-5">
              <div
                className="flex h-12 w-12 items-center justify-center rounded-xl"
                style={{ backgroundColor: 'var(--accent-subtle)' }}
              >
                <Phone className="h-5 w-5" style={{ color: 'var(--accent)' }} />
              </div>
              <div>
                <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                  {areaCodes.length}
                </p>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  Blocked Area Codes
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="names">
          <TabsList className="w-full">
            <TabsTrigger value="names" className="flex-1">
              <Tag className="mr-2 h-4 w-4" />
              Business Name Keywords ({names.length})
            </TabsTrigger>
            <TabsTrigger value="areacodes" className="flex-1">
              <Phone className="mr-2 h-4 w-4" />
              Area Codes ({areaCodes.length})
            </TabsTrigger>
          </TabsList>

          {/* ── Names Tab ── */}
          <TabsContent value="names">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShieldX className="h-5 w-5" style={{ color: 'var(--accent)' }} />
                  Blocked Business Name Keywords
                </CardTitle>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  Any business whose name contains one of these keywords (case-insensitive)
                  will be skipped during import.
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Add form */}
                <div className="flex gap-2">
                  <Input
                    placeholder="e.g. walmart, lowes, autozone..."
                    value={newKeyword}
                    onChange={(e) => setNewKeyword(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && newKeyword.trim()) {
                        addName.mutate(newKeyword.trim());
                      }
                    }}
                  />
                  <Button
                    onClick={() => addName.mutate(newKeyword.trim())}
                    disabled={!newKeyword.trim() || addName.isPending}
                  >
                    <Plus className="h-4 w-4" />
                    Add
                  </Button>
                </div>

                {/* List */}
                {namesLoading ? (
                  <p className="py-4 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
                    Loading...
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {names.map((n) => (
                      <Badge
                        key={n.id}
                        variant="secondary"
                        className="flex items-center gap-1.5 py-1 pl-3 pr-1.5 text-sm"
                      >
                        {n.keyword}
                        <button
                          onClick={() => deleteName.mutate(n.id)}
                          className="ml-1 rounded-full p-0.5 transition-colors hover:bg-red-100 hover:text-red-600"
                          title="Remove"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Area Codes Tab ── */}
          <TabsContent value="areacodes">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShieldX className="h-5 w-5" style={{ color: 'var(--accent)' }} />
                  Blocked Area Codes
                </CardTitle>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  Phone numbers with these area codes will be skipped during import.
                  These correspond to California and Oregon numbers.
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Add form */}
                <div className="flex gap-2">
                  <Input
                    placeholder="3-digit area code, e.g. 213"
                    value={newAreaCode}
                    maxLength={3}
                    onChange={(e) => setNewAreaCode(e.target.value.replace(/\D/g, ''))}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && newAreaCode.trim().length === 3) {
                        addAreaCode.mutate(newAreaCode.trim());
                      }
                    }}
                  />
                  <Button
                    onClick={() => addAreaCode.mutate(newAreaCode.trim())}
                    disabled={newAreaCode.trim().length !== 3 || addAreaCode.isPending}
                  >
                    <Plus className="h-4 w-4" />
                    Add
                  </Button>
                </div>

                {/* Grid of area codes */}
                {codesLoading ? (
                  <p className="py-4 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
                    Loading...
                  </p>
                ) : (
                  <div className="grid grid-cols-4 gap-2 sm:grid-cols-6 md:grid-cols-8">
                    {areaCodes.map((c) => (
                      <div
                        key={c.id}
                        className="group relative flex items-center justify-center rounded-lg border p-3 text-sm font-mono font-semibold transition-colors hover:border-red-300 hover:bg-red-50"
                        style={{
                          borderColor: 'var(--border)',
                          color: 'var(--text-primary)',
                          backgroundColor: 'var(--bg-card)',
                        }}
                      >
                        {c.areaCode}
                        <button
                          onClick={() => deleteAreaCode.mutate(c.id)}
                          className="absolute -right-1.5 -top-1.5 hidden h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white group-hover:flex"
                          title="Remove"
                        >
                          <Trash2 className="h-2.5 w-2.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
