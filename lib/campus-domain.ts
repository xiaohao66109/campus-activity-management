export type Role = 'student' | 'teacher' | 'admin';
export type ActivityStatus = 'draft' | 'published' | 'cancelled';
export type RegistrationStatus = 'active' | 'cancelled' | 'waitlisted' | 'pending';

export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  salt: string;
  role: Role;
  managementStatus?: 'enabled' | 'disabled';
}

export interface Activity {
  id: string;
  title: string;
  category: string;
  description: string;
  location: string;
  startAt: string;
  endAt: string;
  capacity: number;
  status: ActivityStatus;
  organizerId: string;
  createdAt: string;
  updatedAt: string;
  requiresReview?: boolean;
  eligibilityText?: string;
}

export interface Registration {
  id: string;
  activityId: string;
  studentId: string;
  status: RegistrationStatus;
  registeredAt: string;
  cancelledAt: string | null;
  reviewDecision?: 'pending' | 'approved' | 'rejected';
  reviewedAt?: string;
  reviewedBy?: string;
}

export interface AppState {
  version: 2;
  users: User[];
  activities: Activity[];
  registrations: Registration[];
}

export interface ActivityInput {
  title: string;
  category: string;
  description: string;
  location: string;
  startAt: string;
  endAt: string;
  capacity: number;
  requiresReview?: boolean;
  eligibilityText?: string;
}

export type DomainResult =
  | { ok: true; state: AppState }
  | { ok: false; error: string };

export function activeRegistrationCount(state: AppState, activityId: string) {
  return state.registrations.filter(
    (item) => item.activityId === activityId && item.status === 'active',
  ).length;
}

export function activeRegistration(
  state: AppState,
  activityId: string,
  studentId: string,
) {
  return state.registrations.find(
    (item) =>
      item.activityId === activityId &&
      item.studentId === studentId &&
      item.status === 'active',
  );
}

export function canRegister(
  state: AppState,
  activityId: string,
  studentId: string,
  now = new Date(),
) {
  const student = state.users.find((item) => item.id === studentId);
  const activity = state.activities.find((item) => item.id === activityId);

  if (!student || student.role !== 'student') return '只有学生账号可以报名活动';
  if (!activity) return '活动不存在';
  if (activity.status !== 'published') return '该活动当前不可报名';
  if (new Date(activity.startAt).getTime() <= now.getTime()) return '活动已经开始，无法报名';
  if (activeRegistration(state, activityId, studentId)) return '你已经报名该活动';
  if (state.registrations.some((r) => r.activityId === activityId && r.studentId === studentId && r.status !== 'cancelled')) return '已有申请或候补记录，请查看我的报名';
  if (activity.requiresReview) return '此活动有参加条件，新申请流程待确认，暂未开放';
  if (state.registrations.some((r) => r.activityId === activityId && r.status === 'waitlisted')) return '此活动已有候补，名额分配流程待确认';
  if (activeRegistrationCount(state, activityId) >= activity.capacity) return '活动名额已满';
  return null;
}

export function registerForActivity(
  state: AppState,
  activityId: string,
  studentId: string,
  now = new Date(),
): DomainResult {
  const error = canRegister(state, activityId, studentId, now);
  if (error) return { ok: false, error };

  return {
    ok: true,
    state: {
      ...state,
      registrations: [
        ...state.registrations,
        {
          id: crypto.randomUUID(),
          activityId,
          studentId,
          status: 'active',
          registeredAt: now.toISOString(),
          cancelledAt: null,
        },
      ],
    },
  };
}

export function cancelRegistration(
  state: AppState,
  activityId: string,
  studentId: string,
  now = new Date(),
): DomainResult {
  const activity = state.activities.find((item) => item.id === activityId);
  const registration = activeRegistration(state, activityId, studentId);

  if (!activity) return { ok: false, error: '活动不存在' };
  if (!registration) return { ok: false, error: '未找到有效报名' };
  if (state.users.find((u) => u.id === studentId)?.role !== 'student') return { ok: false, error: '只有学生账号可以取消报名' };
  if (activity.status !== 'published') return { ok: false, error: '活动当前不可取消报名，原记录保留' };
  if (new Date(activity.startAt).getTime() <= now.getTime()) {
    return { ok: false, error: '活动已经开始，无法取消报名' };
  }
  if (state.registrations.some((r) => r.activityId === activityId && r.status === 'waitlisted')) return { ok: false, error: '存在候补，取消后的名额处理待确认，暂不开放' };

  return {
    ok: true,
    state: {
      ...state,
      registrations: state.registrations.map((item) =>
        item.id === registration.id
          ? { ...item, status: 'cancelled', cancelledAt: now.toISOString() }
          : item,
      ),
    },
  };
}

export function validateActivityInput(input: ActivityInput, now = new Date()) {
  const errors: string[] = [];
  if (input.title.trim().length < 2) errors.push('活动名称至少需要 2 个字');
  if (!input.category.trim()) errors.push('请选择或填写活动类型');
  if (input.description.trim().length < 10) errors.push('活动说明至少需要 10 个字');
  if (!input.location.trim()) errors.push('请填写活动地点');
  if (input.requiresReview && !input.eligibilityText?.trim()) errors.push('请说明参加条件');
  if (!Number.isInteger(input.capacity) || input.capacity < 1) errors.push('活动容量必须是大于 0 的整数');

  const start = new Date(input.startAt);
  const end = new Date(input.endAt);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    errors.push('请填写有效的开始和结束时间');
  } else {
    if (start.getTime() <= now.getTime()) errors.push('活动开始时间必须晚于当前时间');
    if (end.getTime() <= start.getTime()) errors.push('活动结束时间必须晚于开始时间');
  }
  return errors;
}

export function saveActivity(
  state: AppState,
  organizerId: string,
  input: ActivityInput,
  activityId?: string,
  now = new Date(),
): DomainResult {
  const teacher = state.users.find((item) => item.id === organizerId);
  if (!teacher || teacher.role !== 'teacher') return { ok: false, error: '只有教师账号可以管理活动' };

  const errors = validateActivityInput(input, now);
  if (errors.length) return { ok: false, error: errors[0] };

  if (activityId) {
    const current = state.activities.find((item) => item.id === activityId);
    if (!current) return { ok: false, error: '活动不存在' };
    if (current.organizerId !== organizerId) return { ok: false, error: '不能编辑其他教师的活动' };
    if (current.status === 'cancelled') return { ok: false, error: '已取消活动不能修改' };
    if (state.registrations.some((r) => r.activityId === activityId && r.status !== 'cancelled') &&
      (Boolean(current.requiresReview) !== Boolean(input.requiresReview) || (current.eligibilityText ?? '') !== (input.eligibilityText ?? ''))) {
      return { ok: false, error: '已有报名或申请，参加条件变更规则待确认' };
    }
    if (state.registrations.some((r) => r.activityId === activityId && r.status === 'waitlisted') && current.capacity !== input.capacity) return { ok: false, error: '存在候补，容量调整规则待确认' };
    if (activeRegistrationCount(state, activityId) > input.capacity) {
      return { ok: false, error: '活动容量不能小于当前有效报名人数' };
    }
    return {
      ok: true,
      state: {
        ...state,
        activities: state.activities.map((item) =>
          item.id === activityId
            ? { ...item, ...input, updatedAt: now.toISOString() }
            : item,
        ),
      },
    };
  }

  const activity: Activity = {
    id: crypto.randomUUID(),
    ...input,
    status: 'draft',
    organizerId,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  };
  return { ok: true, state: { ...state, activities: [activity, ...state.activities] } };
}

export function changeActivityStatus(
  state: AppState,
  organizerId: string,
  activityId: string,
  status: ActivityStatus,
  now = new Date(),
): DomainResult {
  if (state.users.find((u) => u.id === organizerId)?.role !== 'teacher') return { ok: false, error: '只有教师账号可以管理活动' };
  const activity = state.activities.find((item) => item.id === activityId);
  if (!activity) return { ok: false, error: '活动不存在' };
  if (activity.organizerId !== organizerId) return { ok: false, error: '不能管理其他教师的活动' };
  if (activity.status === 'cancelled') return { ok: false, error: '已取消活动不能再次变更状态' };
  if (status !== 'published' && status !== 'cancelled') return { ok: false, error: '不支持该状态变更' };
  if (status === 'published' && validateActivityInput(activity, now).length) return { ok: false, error: '活动信息或时间不满足发布要求' };
  return {
    ok: true,
    state: {
      ...state,
      activities: state.activities.map((item) =>
        item.id === activityId ? { ...item, status, updatedAt: now.toISOString() } : item,
      ),
    },
  };
}

export const roleLabels: Record<Role, string> = { student: '学生', teacher: '活动组织教师', admin: '系统管理员' };

// Display uses the same business meanings in the student and teacher views.
export function registrationLabel(registration: Registration, activity?: Activity) {
  if (activity?.status === 'cancelled') return '活动已取消（原记录保留）';
  if (registration.status === 'cancelled') return '已取消报名';
  if (registration.status === 'active') return '确定参加';
  if (registration.status === 'waitlisted') return '候补中';
  if (registration.reviewDecision === 'approved') return '资格通过，参加安排待确认';
  if (registration.reviewDecision === 'rejected') return '资格未通过';
  return '资格待确认';
}

export function reviewApplication(state: AppState, teacherId: string, registrationId: string,
  decision: 'approved' | 'rejected', now = new Date()): DomainResult {
  if (state.users.find((u) => u.id === teacherId)?.role !== 'teacher') return { ok: false, error: '仅活动组织教师可确认申请' };
  const registration = state.registrations.find((r) => r.id === registrationId);
  const activity = state.activities.find((a) => a.id === registration?.activityId);
  if (!registration || !activity) return { ok: false, error: '申请或活动不存在' };
  if (activity.organizerId !== teacherId) return { ok: false, error: '不能处理其他教师的申请' };
  if (!activity.requiresReview || registration.status !== 'pending' || (registration.reviewDecision && registration.reviewDecision !== 'pending')) return { ok: false, error: '该记录当前不可确认资格' };
  if (activity.status !== 'published' || new Date(activity.startAt).getTime() <= now.getTime()) return { ok: false, error: '活动当前不开放资格确认' };
  if (decision !== 'approved' && decision !== 'rejected') return { ok: false, error: '资格结果无效' };
  return { ok: true, state: { ...state, registrations: state.registrations.map((r) => r.id === registrationId
    ? { ...r, reviewDecision: decision, reviewedAt: now.toISOString(), reviewedBy: teacherId } : r) } };
}

export function markUserStatus(state: AppState, adminId: string, userId: string,
  status: 'enabled' | 'disabled'): DomainResult {
  if (state.users.find((u) => u.id === adminId)?.role !== 'admin') return { ok: false, error: '只有管理员可以记录账号状态' };
  if (!state.users.some((u) => u.id === userId)) return { ok: false, error: '账号不存在' };
  if (status !== 'enabled' && status !== 'disabled') return { ok: false, error: '账号状态无效' };
  // Interview confirms the management mark, not login/session revocation rules.
  return { ok: true, state: { ...state, users: state.users.map((u) => u.id === userId ? { ...u, managementStatus: status } : u) } };
}

