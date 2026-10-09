import type { AppState, User } from '@/lib/campus-domain';
import { migrateState } from '@/lib/campus-migration';

export const STORE_KEY = 'campus-activity-v2-store';
const LEGACY_KEY = 'campus-activity-v1-store';
const SESSION_KEY = 'campus-activity-v2-session';

function bytesToHex(bytes: Uint8Array) {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

export async function hashPassword(password: string, salt: string) {
  const data = new TextEncoder().encode(`${salt}:${password}`);
  return bytesToHex(new Uint8Array(await crypto.subtle.digest('SHA-256', data)));
}

export function makeSalt() {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return bytesToHex(bytes);
}

export async function createSeedState(): Promise<AppState> {
  const teacherSalt = 'campus-v1-teacher-salt';
  const studentSalt = 'campus-v1-student-salt';
  const [teacherHash, studentHash] = await Promise.all([
    hashPassword('Teacher123', teacherSalt),
    hashPassword('Student123', studentSalt),
  ]);

  const users: User[] = [
    { id: 'teacher-001', name: '王老师', email: 'teacher@campus.edu.cn', passwordHash: teacherHash, salt: teacherSalt, role: 'teacher' },
    { id: 'student-001', name: '李明', email: 'student@campus.edu.cn', passwordHash: studentHash, salt: studentSalt, role: 'student' },
    { id: 'student-002', name: '陈晨', email: 'chenchen@campus.edu.cn', passwordHash: '', salt: '', role: 'student' },
    { id: 'student-003', name: '周宁', email: 'zhouning@campus.edu.cn', passwordHash: '', salt: '', role: 'student' },
  ];

  const state: AppState = {
    version: 2,
    users,
    activities: [
      {
        id: 'activity-001', title: '迎新志愿者招募', category: '志愿服务',
        description: '协助新生完成报到指引、校园路线介绍和物资发放，参与者可获得志愿服务时长。',
        location: '大学生活动中心', startAt: '2026-09-12T14:00:00+08:00', endAt: '2026-09-12T17:00:00+08:00',
        capacity: 40, status: 'published', organizerId: 'teacher-001', createdAt: '2026-09-08T09:00:00+08:00', updatedAt: '2026-09-08T09:00:00+08:00',
      },
      {
        id: 'activity-002', title: '校园摄影主题分享会', category: '文化艺术',
        description: '由摄影社成员分享校园纪实、人像构图与后期整理经验，并进行现场作品交流。',
        location: '图书馆报告厅', startAt: '2026-09-15T19:00:00+08:00', endAt: '2026-09-15T21:00:00+08:00',
        capacity: 80, status: 'published', organizerId: 'teacher-001', createdAt: '2026-09-08T09:20:00+08:00', updatedAt: '2026-09-08T09:20:00+08:00',
      },
      {
        id: 'activity-003', title: '秋季荧光夜跑', category: '体育健康',
        description: '以校园夜跑和趣味打卡为主线，完成三公里路线即可领取活动纪念徽章。',
        location: '东区田径场', startAt: '2026-09-18T18:30:00+08:00', endAt: '2026-09-18T20:30:00+08:00',
        capacity: 120, status: 'published', organizerId: 'teacher-001', createdAt: '2026-09-08T09:40:00+08:00', updatedAt: '2026-09-08T09:40:00+08:00',
      },
      {
        id: 'activity-004', title: '社团负责人交流会', category: '社团发展',
        description: '围绕新学期社团招新、活动协作和场地申请流程进行讨论，当前仍在完善议程。',
        location: '行政楼 302', startAt: '2026-09-20T15:00:00+08:00', endAt: '2026-09-20T17:00:00+08:00',
        capacity: 30, status: 'draft', organizerId: 'teacher-001', createdAt: '2026-09-08T10:00:00+08:00', updatedAt: '2026-09-08T10:00:00+08:00',
      },
    ],
    registrations: [
      { id: 'registration-001', activityId: 'activity-001', studentId: 'student-002', status: 'active', registeredAt: '2026-09-08T11:00:00+08:00', cancelledAt: null },
      { id: 'registration-002', activityId: 'activity-001', studentId: 'student-003', status: 'active', registeredAt: '2026-09-08T11:20:00+08:00', cancelledAt: null },
      { id: 'registration-003', activityId: 'activity-002', studentId: 'student-001', status: 'active', registeredAt: '2026-09-08T12:00:00+08:00', cancelledAt: null },
    ],
  };
  // New-install demonstration fixtures, not records created by an unconfirmed flow.
  const base = Date.now();
  state.activities = state.activities.map((a, i) => ({ ...a,
    startAt: new Date(base + (i + 7) * 86400000).toISOString(),
    endAt: new Date(base + (i + 7) * 86400000 + 7200000).toISOString(),
    createdAt: new Date(base).toISOString(), updatedAt: new Date(base).toISOString(),
    requiresReview: false, eligibilityText: '',
  }));
  state.users.push(await createAdmin());
  const teacher2Salt = makeSalt();
  state.users.push({ id: 'teacher-002', name: '赵老师', email: 'teacher2@campus.edu.cn', role: 'teacher', salt: teacher2Salt,
    passwordHash: await hashPassword('Teacher123', teacher2Salt), managementStatus: 'enabled' });
  state.activities[2].organizerId = 'teacher-002';
  const sample = { ...state.activities[0], id: 'activity-review', title: '实践工作坊（预置申请演示）',
    requiresReview: true, eligibilityText: '组织教师依据已说明的参加条件逐个确认。本活动用于演示已有申请的资格结果记录。', capacity: 2 };
  state.activities.push(sample);
  state.registrations.push(
    { id: 'demo-pending', activityId: sample.id, studentId: 'student-001', status: 'pending', reviewDecision: 'pending', registeredAt: new Date(base).toISOString(), cancelledAt: null },
    { id: 'demo-waitlist', activityId: sample.id, studentId: 'student-002', status: 'waitlisted', registeredAt: new Date(base).toISOString(), cancelledAt: null },
    { id: 'demo-active', activityId: sample.id, studentId: 'student-003', status: 'active', registeredAt: new Date(base).toISOString(), cancelledAt: null },
  );
  return migrateState(state);
}

async function createAdmin(): Promise<User> {
  const salt = makeSalt();
  return { id: 'admin-001', name: '平台管理员', email: 'admin@campus.edu.cn', role: 'admin',
    passwordHash: await hashPassword('Admin123', salt), salt, managementStatus: 'enabled' };
}

export async function loadOrCreateState() {
  const saved = window.localStorage.getItem(STORE_KEY);
  const legacy = saved === null ? window.localStorage.getItem(LEGACY_KEY) : null;
  if (saved !== null || legacy !== null) {
    const state = migrateState(JSON.parse((saved ?? legacy)!));
    if (legacy !== null) {
      // Keep the original legacy key, and a separate byte-for-byte backup.
      window.localStorage.setItem('campus-activity-v1-backup', legacy);
      if (!state.users.some((u) => u.role === 'admin')) {
        const admin = await createAdmin();
        admin.id = crypto.randomUUID();
        let n = 1;
        while (state.users.some((u) => u.email === admin.email)) admin.email = `admin-migration-${n++}@campus.edu.cn`;
        state.users.push(admin);
      }
    }
    saveState(state);
    return state;
  }
  const state = await createSeedState();
  saveState(state);
  return state;
}

export function saveState(state: AppState) {
  window.localStorage.setItem(STORE_KEY, JSON.stringify(state));
}

export function loadSession() {
  return window.localStorage.getItem(SESSION_KEY);
}

export function saveSession(userId: string | null) {
  if (userId) window.localStorage.setItem(SESSION_KEY, userId);
  else window.localStorage.removeItem(SESSION_KEY);
}

