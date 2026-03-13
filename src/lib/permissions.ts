import { prisma } from './prisma';

// Server-side cached permission loader

let cache: Map<number, string[]> | null = null;
let cacheTime = 0;
const CACHE_TTL = 60 * 1000; // 60 seconds

export async function getPermissionsForRole(roleId: number): Promise<string[]> {
  const now = Date.now();
  if (cache && now - cacheTime < CACHE_TTL) {
    return cache.get(roleId) ?? [];
  }

  const all = await prisma.rolePermission.findMany({
    where: { enabled: true },
  });

  const newCache = new Map<number, string[]>();
  for (const p of all) {
    const existing = newCache.get(p.idRole) || [];
    existing.push(p.permissionKey);
    newCache.set(p.idRole, existing);
  }

  cache = newCache;
  cacheTime = now;
  return cache.get(roleId) ?? [];
}

export async function getAllPermissions(): Promise<Record<number, Record<string, boolean>>> {
  const all = await prisma.rolePermission.findMany();
  const result: Record<number, Record<string, boolean>> = {};

  for (const p of all) {
    if (!result[p.idRole]) result[p.idRole] = {};
    result[p.idRole][p.permissionKey] = p.enabled;
  }

  return result;
}

export function clearPermissionCache() {
  cache = null;
  cacheTime = 0;
}
