import assert from 'node:assert/strict';
import test from 'node:test';
import { migrateState } from '../lib/campus-migration.ts';
import { reviewApplication, markUserStatus, registrationLabel, activeRegistrationCount, canRegister, cancelRegistration, changeActivityStatus, saveActivity } from '../lib/campus-domain.ts';

const now = new Date('2030-01-01T00:00:00Z');
function fixture() {
  const users = [['t', 'teacher'], ['t2', 'teacher'], ['s', 'student'], ['s2', 'student'], ['a', 'admin']].map(([id, role]) => ({ id, role, name: id, email: `${id}@school.test`, salt: 'salt', passwordHash: 'hash', managementStatus: 'enabled' }));
  const activity = { id: 'activity', title: '工作坊', description: '用于确认报名规则的测试活动描述', category: '实践', location: '礼堂', capacity: 1, status: 'published', organizerId: 't', startAt: '2030-02-01T00:00:00Z', endAt: '2030-02-01T02:00:00Z', createdAt: now.toISOString(), updatedAt: now.toISOString(), requiresReview: true, eligibilityText: '已说明条件' };
  return { version: 2, users, activities: [activity], registrations: [{ id: 'r', studentId: 's', activityId: activity.id, status: 'pending', reviewDecision: 'pending', registeredAt: now.toISOString(), cancelledAt: null }] };
}

void test('V2-01 资格通过不自动分配名额，学生教师使用同一状态含义', () => {
  const s = fixture(); const r = reviewApplication(s, 't', 'r', 'approved', now);
  assert.ok(r.ok); assert.equal(r.state.registrations[0].status, 'pending');
  assert.equal(activeRegistrationCount(r.state, 'activity'), 0);
  assert.equal(registrationLabel(r.state.registrations[0]), '资格通过，参加安排待确认');
  assert.equal(r.state.registrations[0].reviewedBy, 't'); assert.equal(s.registrations[0].reviewDecision, 'pending');
});
void test('V2-02 拒绝申请有明确结果，不允许再次审核', () => {
  const r = reviewApplication(fixture(), 't', 'r', 'rejected', now);
  assert.ok(r.ok); assert.equal(registrationLabel(r.state.registrations[0]), '资格未通过');
  assert.equal(reviewApplication(r.state, 't', 'r', 'approved', now).ok, false);
});
for (const id of ['s', 'a', 't2', 'missing']) void test(`V2-03 ${id} 无权处理他人申请`, () => assert.equal(reviewApplication(fixture(), id, 'r', 'approved', now).ok, false));
void test('V2-04 候补、确定参加、取消以及活动取消显示各不混淆', () => {
  const r = fixture().registrations[0];
  assert.equal(registrationLabel({ ...r, status: 'waitlisted' }), '候补中');
  assert.equal(registrationLabel({ ...r, status: 'active' }), '确定参加');
  assert.equal(registrationLabel({ ...r, status: 'cancelled' }), '已取消报名');
  assert.equal(registrationLabel({ ...r, status: 'active' }, { status: 'cancelled' }), '活动已取消（原记录保留）');
});
void test('V2-05 管理员标记停用恢复保留历史和账号凭据', () => {
  const s = fixture(); const r = markUserStatus(s, 'a', 's', 'disabled'); assert.ok(r.ok);
  assert.equal(r.state.users.find((u) => u.id === 's').managementStatus, 'disabled');
  assert.deepEqual(r.state.registrations, s.registrations); assert.deepEqual(r.state.activities, s.activities);
  assert.equal(r.state.users.find((u) => u.id === 's').passwordHash, 'hash');
  assert.equal(markUserStatus(r.state, 'a', 's', 'enabled').state.users.find((u) => u.id === 's').managementStatus, 'enabled');
});
void test('V2-06 学生教师无法修改账号管理标记', () => {
  for (const id of ['s', 't', 't2']) assert.equal(markUserStatus(fixture(), id, 's', 'disabled').ok, false);
  assert.equal(markUserStatus(fixture(), 'a', 'missing', 'disabled').ok, false);
});
void test('V2-07 有条件活动新申请与已有候补的分配流程暂停', () => {
  const s = fixture(); assert.match(canRegister(s, 'activity', 's2', now), /新申请流程待确认/);
  s.activities[0].requiresReview = false; s.registrations[0].status = 'waitlisted';
  assert.match(canRegister(s, 'activity', 's2', now), /已有候补/);
  assert.equal(reviewApplication(s, 't', 'r', 'approved', now).ok, false);
});
void test('V2-08 候补存在时不擅自执行取消释放或递补', () => {
  const s = fixture(); s.registrations[0].status = 'active';
  s.registrations.push({ ...s.registrations[0], id: 'r2', studentId: 's2', status: 'waitlisted' });
  assert.match(cancelRegistration(s, 'activity', 's', now).error, /处理待确认/);
  assert.equal(activeRegistrationCount(s, 'activity'), 1);
});
void test('V2-09 已开始或取消活动不得审核或再次发布', () => {
  const s = fixture(); assert.equal(reviewApplication(s, 't', 'r', 'approved', new Date('2031-01-01')).ok, false);
  s.activities[0].status = 'cancelled'; assert.equal(reviewApplication(s, 't', 'r', 'approved', now).ok, false);
  assert.equal(changeActivityStatus(s, 't', 'activity', 'published', now).ok, false);
});
void test('V2-10 管理员不可发布或取消教师活动', () => {
  for (const status of ['published', 'cancelled']) assert.equal(changeActivityStatus(fixture(), 'a', 'activity', status, now).ok, false);
});
void test('V2-11 原有活动归属、容量保护及条件变更保护', () => {
  const s = fixture(); const input = { ...s.activities[0] };
  assert.equal(saveActivity(s, 't2', input, 'activity', now).ok, false);
  assert.equal(saveActivity(s, 't', { ...input, eligibilityText: '改变条件' }, 'activity', now).ok, false);
  assert.equal(saveActivity(s, 't', { ...input, title: '新的工作坊' }, 'activity', now).ok, true);
  s.registrations[0].status = 'active'; s.registrations.push({ ...s.registrations[0], id: 'r2', studentId: 's2' });
  assert.match(saveActivity(s, 't', input, 'activity', now).error, /容量不能小于/);
});
void test('V2-12 V1迁移保留所有业务ID、时间、记录和凭据且幂等', () => {
  const s = fixture(); s.version = 1; s.users = s.users.filter((u) => u.role !== 'admin');
  s.users.forEach((u) => delete u.managementStatus); delete s.activities[0].requiresReview; delete s.activities[0].eligibilityText;
  s.registrations[0].status = 'active'; delete s.registrations[0].reviewDecision;
  const r = migrateState(s); assert.equal(r.version, 2); assert.equal(r.activities[0].requiresReview, false);
  assert.deepEqual(r.registrations, s.registrations); assert.equal(r.users[0].passwordHash, s.users[0].passwordHash);
  assert.deepEqual(migrateState(r), r); assert.equal(s.version, 1);
});
void test('V2-13 损坏、未来版本、重复ID、孤立报名与非法状态数据拒绝读取', () => {
  for (const bad of [null, {}, { ...fixture(), version: 3 }]) assert.throws(() => migrateState(bad));
  const s = fixture(); s.registrations[0].studentId = 'missing'; assert.throws(() => migrateState(s));
  const dup = fixture(); dup.users.push(dup.users[0]); assert.throws(() => migrateState(dup));
  const invalid = fixture(); invalid.registrations[0].status = 'unknown'; assert.throws(() => migrateState(invalid));
});
