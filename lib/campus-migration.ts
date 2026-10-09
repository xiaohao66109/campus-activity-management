import type { AppState } from './campus-domain';

function record(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
function text(value: unknown): value is string { return typeof value === 'string'; }
function date(value: unknown) { return text(value) && Number.isFinite(Date.parse(value)); }

// Refuse corrupt/unknown structures. The storage layer keeps the original bytes.
export function migrateState(input: unknown): AppState {
  if (!record(input) || ![1, 2].includes(Number(input.version)) ||
    !Array.isArray(input.users) || !Array.isArray(input.activities) || !Array.isArray(input.registrations)) throw Error('数据版本或结构不支持');
  const { users, activities, registrations } = input;
  const unique = (items: unknown[]) => items.every(record) && new Set(items.map((v) => (v as Record<string, unknown>).id)).size === items.length;
  if (![users, activities, registrations].every(unique)) throw Error('记录 ID 重复');
  for (const u of users) {
    if (!record(u) || !['id', 'name', 'email', 'passwordHash', 'salt'].every((key) => text(u[key])) ||
      !['student', 'teacher', 'admin'].includes(String(u.role)) ||
      (u.managementStatus !== undefined && (!text(u.managementStatus) || !['enabled', 'disabled'].includes(u.managementStatus)))) throw Error('账号数据无效');
  }
  for (const a of activities) {
    if (!record(a) || !['id', 'title', 'category', 'description', 'location', 'organizerId'].every((key) => text(a[key])) ||
      ![a.startAt, a.endAt, a.createdAt, a.updatedAt].every(date) || !Number.isInteger(a.capacity) || Number(a.capacity) < 1 ||
      !['draft', 'published', 'cancelled'].includes(String(a.status)) ||
      (a.requiresReview !== undefined && typeof a.requiresReview !== 'boolean') ||
      (a.eligibilityText !== undefined && !text(a.eligibilityText)) ||
      !users.some((u) => u.id === a.organizerId && u.role === 'teacher')) throw Error('活动数据无效');
  }
  for (const r of registrations) {
    if (!record(r) || !text(r.id) || !date(r.registeredAt) || (r.cancelledAt !== null && !date(r.cancelledAt)) ||
      !['active', 'cancelled', 'pending', 'waitlisted'].includes(String(r.status)) ||
      (r.reviewDecision !== undefined && (!text(r.reviewDecision) || !['pending', 'approved', 'rejected'].includes(r.reviewDecision))) ||
      !users.some((u) => u.id === r.studentId && u.role === 'student') || !activities.some((a) => a.id === r.activityId)) throw Error('报名数据无效');
  }
  return {
    ...structuredClone(input), version: 2,
    users: users.map((u) => ({ ...u, managementStatus: u.managementStatus ?? 'enabled' })),
    activities: activities.map((a) => ({ ...a, requiresReview: a.requiresReview ?? false, eligibilityText: a.eligibilityText ?? '' })),
    registrations: registrations.map((r) => ({ ...r })),
  } as AppState;
}
