export function normalizeAssignedUserIds(userIds?: number[]) {
  return Array.from(new Set(userIds ?? []));
}
