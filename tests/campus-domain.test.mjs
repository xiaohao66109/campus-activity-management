import assert from 'node:assert/strict';
import test from 'node:test';

import {
  activeRegistrationCount,
  cancelRegistration,
  canRegister,
  changeActivityStatus,
  registerForActivity,
  saveActivity,
  validateActivityInput,
} from '../lib/campus-domain.ts';

const NOW = new Date('2030-01-01T00:00:00.000Z');

function state(overrides = {}) {
  return {
    version: 1,
    users: [
      { id: 'teacher', name: '教师', email: 'teacher@example.com', passwordHash: '', salt: '', role: 'teacher' },
      { id: 'student', name: '学生', email: 'student@example.com', passwordHash: '', salt: '', role: 'student' },
      { id: 'student-2', name: '学生二', email: 'student2@example.com', passwordHash: '', salt: '', role: 'student' },
    ],
    activities: [{
      id: 'activity',
      title: '校园讲座',
      category: '学术',
      description: '这是一场用于测试的校园主题讲座活动。',
      location: '报告厅',
      startAt: '2030-02-01T10:00:00.000Z',
      endAt: '2030-02-01T12:00:00.000Z',
      capacity: 2,
      status: 'published',
      organizerId: 'teacher',
      createdAt: NOW.toISOString(),
      updatedAt: NOW.toISOString(),
    }],
    registrations: [],
    ...overrides,
  };
}

test('已发布且有余量的未来活动允许学生报名', () => {
  const result = registerForActivity(state(), 'activity', 'student', NOW);
  assert.equal(result.ok, true);
  assert.equal(activeRegistrationCount(result.state, 'activity'), 1);
});

test('同一学生不能重复报名同一活动', () => {
  const first = registerForActivity(state(), 'activity', 'student', NOW);
  assert.equal(first.ok, true);
  const second = registerForActivity(first.state, 'activity', 'student', NOW);
  assert.deepEqual(second, { ok: false, error: '你已经报名该活动' });
});

test('达到人数上限后拒绝新报名', () => {
  const fullState = state({
    registrations: [
      { id: 'r1', activityId: 'activity', studentId: 'student', status: 'active', registeredAt: NOW.toISOString(), cancelledAt: null },
      { id: 'r2', activityId: 'activity', studentId: 'student-2', status: 'active', registeredAt: NOW.toISOString(), cancelledAt: null },
    ],
  });
  assert.equal(canRegister(fullState, 'activity', 'student-2', NOW), '你已经报名该活动');
  const newStudentState = { ...fullState, users: [...fullState.users, { id: 'student-3', name: '学生三', email: 'student3@example.com', passwordHash: '', salt: '', role: 'student' }] };
  assert.equal(canRegister(newStudentState, 'activity', 'student-3', NOW), '活动名额已满');
});

test('活动开始后不能报名或取消报名', () => {
  const startedAt = new Date('2030-03-01T00:00:00.000Z');
  const base = state();
  assert.equal(canRegister(base, 'activity', 'student', startedAt), '活动已经开始，无法报名');
  const withRegistration = { ...base, registrations: [{ id: 'r1', activityId: 'activity', studentId: 'student', status: 'active', registeredAt: NOW.toISOString(), cancelledAt: null }] };
  assert.deepEqual(cancelRegistration(withRegistration, 'activity', 'student', startedAt), { ok: false, error: '活动已经开始，无法取消报名' });
});

test('取消报名会保留历史记录并释放名额', () => {
  const base = state({ registrations: [{ id: 'r1', activityId: 'activity', studentId: 'student', status: 'active', registeredAt: NOW.toISOString(), cancelledAt: null }] });
  const result = cancelRegistration(base, 'activity', 'student', NOW);
  assert.equal(result.ok, true);
  assert.equal(result.state.registrations[0].status, 'cancelled');
  assert.equal(activeRegistrationCount(result.state, 'activity'), 0);
});

test('活动表单校验时间、容量和必填信息', () => {
  const errors = validateActivityInput({ title: 'A', category: '', description: '太短', location: '', startAt: 'bad', endAt: 'bad', capacity: 0 }, NOW);
  assert.ok(errors.length >= 5);
});

test('教师可以创建草稿，学生不能管理活动', () => {
  const input = { title: '新活动', category: '文化', description: '这是一项满足长度要求的新活动说明。', location: '礼堂', startAt: '2030-02-02T10:00:00.000Z', endAt: '2030-02-02T12:00:00.000Z', capacity: 20 };
  const created = saveActivity(state(), 'teacher', input, undefined, NOW);
  assert.equal(created.ok, true);
  assert.equal(created.state.activities[0].status, 'draft');
  assert.deepEqual(saveActivity(state(), 'student', input, undefined, NOW), { ok: false, error: '只有教师账号可以管理活动' });
});

test('已取消活动不能再次发布', () => {
  const base = state({ activities: [{ ...state().activities[0], status: 'cancelled' }] });
  assert.deepEqual(changeActivityStatus(base, 'teacher', 'activity', 'published', NOW), { ok: false, error: '已取消活动不能再次变更状态' });
});
