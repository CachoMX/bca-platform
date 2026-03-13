// Permission key definitions and route mappings
// This file has NO Prisma imports so it can be used in middleware (Edge runtime)

export const PERMISSION_LABELS: Record<string, string> = {
  dashboard: 'Dashboard',
  calls: 'Calls',
  clock: 'Time Clock',
  clients: 'Existing Clients',
  training: 'Training',
  sms: 'SMS',
  resources: 'Resources',
  reports: 'Reports',
  admin_users: 'User Management',
  admin_time: 'Time Management',
  admin_quotes: 'Quotes Management',
  admin_rebuttals: 'Rebuttals',
  admin_import: 'Import Leads',
  admin_permissions: 'Permissions',
};

export const ALL_PERMISSION_KEYS = Object.keys(PERMISSION_LABELS);

// Page route → permission key
export function getPermissionKeyForRoute(pathname: string): string | null {
  if (pathname === '/') return 'dashboard';
  if (pathname.startsWith('/calls')) return 'calls';
  if (pathname.startsWith('/clock')) return 'clock';
  if (pathname.startsWith('/clients')) return 'clients';
  if (pathname.startsWith('/training')) return 'training';
  if (pathname.startsWith('/sms')) return 'sms';
  if (pathname.startsWith('/resources')) return 'resources';
  if (pathname.startsWith('/reports')) return 'reports';
  if (pathname.startsWith('/admin/users')) return 'admin_users';
  if (pathname.startsWith('/admin/time')) return 'admin_time';
  if (pathname.startsWith('/admin/quotes')) return 'admin_quotes';
  if (pathname.startsWith('/admin/rebuttals')) return 'admin_rebuttals';
  if (pathname.startsWith('/admin/import')) return 'admin_import';
  if (pathname.startsWith('/admin/permissions')) return 'admin_permissions';
  return null;
}

// API route → permission key
export function getPermissionKeyForApiRoute(pathname: string): string | null {
  if (pathname.startsWith('/api/users')) return 'admin_users';
  if (pathname.startsWith('/api/import')) return 'admin_import';
  if (pathname.startsWith('/api/settings')) return 'admin_users';
  if (pathname.startsWith('/api/admin/time')) return 'admin_time';
  if (pathname.startsWith('/api/admin/permissions')) return 'admin_permissions';
  if (pathname.startsWith('/api/reports')) return 'reports';
  // SMS API has a public webhook, don't restrict at middleware level
  return null;
}
