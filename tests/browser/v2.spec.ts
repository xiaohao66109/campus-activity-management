import { test, expect, type Page } from '@playwright/test';
import { mkdir } from 'node:fs/promises';

let screenshotDir = 'docs/screenshots';
const networkRequests = new WeakMap<Page, string[]>();
const pageErrors = new WeakMap<Page, string[]>();
test.beforeEach(async ({ page }, testInfo) => {
  screenshotDir = process.env.PORTABLE_APP_URL ? `docs/screenshots/portable/${testInfo.project.name}` : 'docs/screenshots';
  await mkdir(screenshotDir, { recursive: true });
  if (process.env.PORTABLE_APP_URL) {
    networkRequests.set(page, []); pageErrors.set(page, []);
    await page.route(/^https?:/, (route) => route.abort());
    page.on('request', (request) => { if (/^https?:/.test(request.url())) networkRequests.get(page)!.push(request.url()); });
    page.on('pageerror', (error) => pageErrors.get(page)!.push(error.message));
  }
});
test.afterEach(async ({ page }) => {
  if (process.env.PORTABLE_APP_URL) {
    expect(networkRequests.get(page)).toEqual([]);
    expect(pageErrors.get(page)).toEqual([]);
  }
});

async function login(page: Page, role: '学生' | '教师' | '管理员') {
  await page.goto(process.env.PORTABLE_APP_URL || '/');
  await page.getByRole('button', { name: new RegExp(`^${role}：`) }).click();
  await page.getByRole('button', { name: '进入活动中心', exact: true }).click();
}
test('B01 学生普通报名取消及刷新保留记录', async ({ page }) => {
  await login(page, '学生');
  await page.getByRole('textbox', { name: '搜索活动' }).fill('迎新志愿者');
  await page.getByRole('button', { name: '查看活动详情' }).click();
  await page.getByRole('button', { name: '确认报名', exact: true }).click();
  await expect(page.getByRole('button', { name: '取消报名', exact: true })).toBeVisible();
  await page.keyboard.press('Escape');
  await page.getByRole('tab', { name: /我的报名/ }).click();
  await expect(page.getByText('确定参加', { exact: true }).first()).toBeVisible();
  await mkdir(screenshotDir, { recursive: true });
  await page.screenshot({ path: `${screenshotDir}/student.png`, fullPage: true });
  await page.reload();
  await page.getByRole('tab', { name: /我的报名/ }).click();
  // Select the newly registered activity's card without relying on unrelated records.
  const card = page.locator('[data-slot="card"]').filter({ hasText: '迎新志愿者招募' });
  await card.getByRole('button', { name: '取消报名', exact: true }).click();
  await expect(card.getByText('已取消报名', { exact: true })).toBeVisible();
});
test('B02 教师资格通过与学生结果一致且不自动分配名额', async ({ page }) => {
  await login(page, '教师');
  const row = page.getByRole('row').filter({ hasText: '实践工作坊（预置申请演示）' });
  await row.getByRole('button', { name: '名单' }).click();
  await expect(page.getByText('候补中', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: '通过资格', exact: true }).click();
  await expect(page.getByText('资格通过，参加安排待确认', { exact: true })).toBeVisible();
  await page.screenshot({ path: `${screenshotDir}/teacher.png`, fullPage: true });
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: '退出登录' }).click();
  await page.getByRole('button', { name: /^学生：/ }).click();
  await page.getByRole('button', { name: '进入活动中心', exact: true }).click();
  await page.getByRole('tab', { name: /我的报名/ }).click();
  await expect(page.getByText('资格通过，参加安排待确认', { exact: true })).toBeVisible();
});
test('B03 管理员记录状态恢复和全平台只读监管', async ({ page }) => {
  await login(page, '管理员');
  await page.getByRole('textbox', { name: '搜索账号' }).fill('student@campus.edu.cn');
  await page.getByRole('button', { name: '标记停用', exact: true }).click();
  await expect(page.getByText('停用标记', { exact: true })).toBeVisible();
  await page.reload();
  await page.getByRole('textbox', { name: '搜索账号' }).fill('student@campus.edu.cn');
  await page.getByRole('button', { name: '恢复可用标记' }).click();
  await expect(page.getByText('可用标记', { exact: true })).toBeVisible();
  await page.getByRole('tab', { name: '活动监管' }).click();
  await expect(page.getByText(/赵老师/)).toBeVisible();
  await expect(page.getByRole('button', { name: '通过资格' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: '创建活动' })).toHaveCount(0);
  await page.screenshot({ path: `${screenshotDir}/admin.png`, fullPage: true });
});
test('B04 新学生注册以及教师创建发布活动回归', async ({ page }) => {
  await page.goto(process.env.PORTABLE_APP_URL || '/'); await page.getByRole('tab', { name: '学生注册' }).click();
  await page.getByLabel('姓名', { exact: true }).fill('测试学生');
  await page.getByLabel('校园邮箱').fill('new@campus.edu.cn');
  await page.getByLabel('设置密码').fill('Student123');
  await page.getByRole('button', { name: '创建学生账号' }).click();
  await expect(page.getByRole('heading', { name: '你好，测试学生' })).toBeVisible();
  await page.getByRole('button', { name: '退出登录' }).click();
  await page.getByRole('button', { name: /^教师：/ }).click(); await page.getByRole('button', { name: '进入活动中心', exact: true }).click();
  await page.getByRole('button', { name: '创建活动', exact: true }).click();
  await page.getByLabel('活动名称').fill('测试发布活动'); await page.getByLabel('活动地点').fill('报告厅');
  await page.getByLabel('活动说明').fill('这是一条用于回归验证创建和发布流程的活动说明。');
  await page.getByRole('button', { name: '保存草稿' }).click();
  const row = page.getByRole('row').filter({ hasText: '测试发布活动' });
  await row.getByRole('button', { name: '发布', exact: true }).click(); await expect(row.getByText('已发布', { exact: true })).toBeVisible();
  await row.getByRole('button', { name: '编辑', exact: true }).click(); await page.getByLabel('活动名称').fill('测试修改活动');
  await page.getByRole('button', { name: '保存修改' }).click();
  const changed = page.getByRole('row').filter({ hasText: '测试修改活动' }); await changed.getByRole('button', { name: '取消', exact: true }).click();
  await page.getByRole('button', { name: '确认取消', exact: true }).click(); await expect(changed.getByText('已取消', { exact: true })).toBeVisible();
});
test('B05 损坏存储显示错误并保留原数据', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('campus-activity-v2-store', '{broken'));
  await page.goto(process.env.PORTABLE_APP_URL || '/'); await expect(page.getByRole('heading', { name: '数据需要检查' })).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem('campus-activity-v2-store'))).toBe('{broken');
});

test('B06 V1浏览器数据迁移备份保留旧记录并新增管理员', async ({ page }) => {
  const legacy = { version: 1, users: [
    { id: 'legacy-t', role: 'teacher', name: '旧教师', email: 'old-t@campus.edu.cn', salt: 's', passwordHash: 'hash' },
    { id: 'legacy-s', role: 'student', name: '旧学生', email: 'old-s@campus.edu.cn', salt: 's', passwordHash: 'hash' },
  ], activities: [{ id: 'legacy-a', organizerId: 'legacy-t', title: '旧活动', category: '文化', description: '迁移前活动原始说明', location: '礼堂', capacity: 10, status: 'published', startAt: '2035-01-01T10:00:00Z', endAt: '2035-01-01T12:00:00Z', createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' }], registrations: [{ id: 'legacy-r', studentId: 'legacy-s', activityId: 'legacy-a', status: 'active', registeredAt: '2026-01-02T00:00:00Z', cancelledAt: null }] };
  await page.addInitScript((data) => { if (!localStorage.getItem('campus-activity-v1-store')) localStorage.setItem('campus-activity-v1-store', JSON.stringify(data)); }, legacy);
  await page.goto(process.env.PORTABLE_APP_URL || '/'); await expect(page.getByRole('button', { name: '进入活动中心', exact: true })).toBeVisible();
  const result = await page.evaluate(() => ({ state: JSON.parse(localStorage.getItem('campus-activity-v2-store')!), old: localStorage.getItem('campus-activity-v1-store'), backup: localStorage.getItem('campus-activity-v1-backup') }));
  expect(result.state.version).toBe(2); expect(result.old).toBe(JSON.stringify(legacy)); expect(result.backup).toBe(result.old);
  expect(result.state.registrations).toEqual(legacy.registrations);
  expect(result.state.users.filter((u: { role: string }) => u.role === 'admin')).toHaveLength(1);
  await page.reload();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('campus-activity-v2-store')!).users.length)).toBe(3);
});

test('B07 移动端学生页面无水平溢出且条件申请入口暂停', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 }); await login(page, '学生');
  await page.getByRole('textbox', { name: '搜索活动' }).fill('实践工作坊');
  await page.getByRole('button', { name: '查看活动详情' }).click();
  const button = page.getByRole('button', { name: '已有申请或候补记录，请查看我的报名' });
  await expect(button).toBeDisabled();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.screenshot({ path: `${screenshotDir}/mobile.png`, fullPage: true });
});
