'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Shield, Save, Loader2, Info } from 'lucide-react';

interface PermissionsData {
  roles: { id: number; name: string }[];
  permissions: { key: string; label: string }[];
  matrix: Record<number, Record<string, boolean>>;
}

export default function PermissionsPage() {
  const queryClient = useQueryClient();
  const [localMatrix, setLocalMatrix] = useState<Record<number, Record<string, boolean>> | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  const { data, isLoading } = useQuery<PermissionsData>({
    queryKey: ['permissions'],
    queryFn: async () => {
      const res = await fetch('/api/admin/permissions');
      if (!res.ok) throw new Error('Failed to fetch permissions');
      return res.json();
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (matrix: Record<number, Record<string, boolean>>) => {
      const res = await fetch('/api/admin/permissions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ matrix }),
      });
      if (!res.ok) throw new Error('Failed to save');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['permissions'] });
      setHasChanges(false);
    },
  });

  const matrix = localMatrix ?? data?.matrix ?? {};

  function togglePermission(roleId: number, permKey: string) {
    const newMatrix = { ...matrix };
    if (!newMatrix[roleId]) newMatrix[roleId] = {};
    newMatrix[roleId] = { ...newMatrix[roleId], [permKey]: !newMatrix[roleId][permKey] };
    setLocalMatrix(newMatrix);
    setHasChanges(true);
  }

  function handleSave() {
    if (localMatrix) {
      saveMutation.mutate(localMatrix);
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-6 w-6 animate-spin" style={{ color: 'var(--accent)' }} />
      </div>
    );
  }

  if (!data) return null;

  // Separate main nav permissions from admin permissions
  const mainPerms = data.permissions.filter((p) => !p.key.startsWith('admin_'));
  const adminPerms = data.permissions.filter((p) => p.key.startsWith('admin_'));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-xl"
            style={{ backgroundColor: 'var(--accent-subtle)' }}
          >
            <Shield className="h-5 w-5" style={{ color: 'var(--accent)' }} />
          </div>
          <div>
            <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
              Permissions Manager
            </h1>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              Control what each role can access
            </p>
          </div>
        </div>
        <button
          onClick={handleSave}
          disabled={!hasChanges || saveMutation.isPending}
          className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white transition-opacity disabled:opacity-40"
          style={{ backgroundColor: 'var(--accent)' }}
        >
          {saveMutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          Save Changes
        </button>
      </div>

      {/* Success / Error messages */}
      {saveMutation.isSuccess && (
        <div
          className="flex items-center gap-2 rounded-lg border px-4 py-3 text-sm"
          style={{
            backgroundColor: 'rgba(34, 197, 94, 0.1)',
            borderColor: 'rgba(34, 197, 94, 0.3)',
            color: 'rgb(34, 197, 94)',
          }}
        >
          <Info className="h-4 w-4 shrink-0" />
          Permissions saved. Users must log out and back in for changes to take effect.
        </div>
      )}
      {saveMutation.isError && (
        <div
          className="rounded-lg border px-4 py-3 text-sm"
          style={{
            backgroundColor: 'var(--danger-subtle)',
            borderColor: 'var(--danger)',
            color: 'var(--danger)',
          }}
        >
          Failed to save permissions. Please try again.
        </div>
      )}

      {/* Main Navigation Permissions */}
      <div
        className="rounded-xl border"
        style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border)' }}
      >
        <div className="border-b px-6 py-4" style={{ borderColor: 'var(--border)' }}>
          <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
            Navigation
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ borderColor: 'var(--border)' }}>
                <th
                  className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider"
                  style={{ color: 'var(--text-muted)' }}
                >
                  Feature
                </th>
                {data.roles.map((role) => (
                  <th
                    key={role.id}
                    className="px-6 py-3 text-center text-xs font-semibold uppercase tracking-wider"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    {role.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {mainPerms.map((perm, i) => (
                <tr
                  key={perm.key}
                  className="border-t"
                  style={{ borderColor: 'var(--border)' }}
                >
                  <td className="px-6 py-3 text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                    {perm.label}
                  </td>
                  {data.roles.map((role) => (
                    <td key={role.id} className="px-6 py-3 text-center">
                      <label className="inline-flex cursor-pointer items-center">
                        <input
                          type="checkbox"
                          checked={matrix[role.id]?.[perm.key] ?? false}
                          onChange={() => togglePermission(role.id, perm.key)}
                          className="h-4 w-4 rounded accent-[var(--accent)]"
                        />
                      </label>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Admin Permissions */}
      <div
        className="rounded-xl border"
        style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border)' }}
      >
        <div className="border-b px-6 py-4" style={{ borderColor: 'var(--border)' }}>
          <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
            Administration
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ borderColor: 'var(--border)' }}>
                <th
                  className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider"
                  style={{ color: 'var(--text-muted)' }}
                >
                  Feature
                </th>
                {data.roles.map((role) => (
                  <th
                    key={role.id}
                    className="px-6 py-3 text-center text-xs font-semibold uppercase tracking-wider"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    {role.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {adminPerms.map((perm) => (
                <tr
                  key={perm.key}
                  className="border-t"
                  style={{ borderColor: 'var(--border)' }}
                >
                  <td className="px-6 py-3 text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                    {perm.label}
                  </td>
                  {data.roles.map((role) => (
                    <td key={role.id} className="px-6 py-3 text-center">
                      <label className="inline-flex cursor-pointer items-center">
                        <input
                          type="checkbox"
                          checked={matrix[role.id]?.[perm.key] ?? false}
                          onChange={() => togglePermission(role.id, perm.key)}
                          className="h-4 w-4 rounded accent-[var(--accent)]"
                        />
                      </label>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
