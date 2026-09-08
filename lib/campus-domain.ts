export type Role = 'student' | 'teacher';
export type ActivityStatus = 'draft' | 'published' | 'cancelled';
export type RegistrationStatus = 'active' | 'cancelled';

export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  salt: string;
  role: Role;
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
}

export interface Registration {
  id: string;
  activityId: string;
  studentId: string;
  status: RegistrationStatus;
  registeredAt: string;
  cancelledAt: string | null;
}

export interface AppState {
  version: 1;
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
  if (new Date(activity.startAt).getTime() <= now.getTime()) {
    return { ok: false, error: '活动已经开始，无法取消报名' };
  }

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
  const activity = state.activities.find((item) => item.id === activityId);
  if (!activity) return { ok: false, error: '活动不存在' };
  if (activity.organizerId !== organizerId) return { ok: false, error: '不能管理其他教师的活动' };
  if (activity.status === 'cancelled') return { ok: false, error: '已取消活动不能再次变更状态' };
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

