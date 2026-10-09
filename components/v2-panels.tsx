'use client';

import { useState } from 'react';
import { markUserStatus, registrationLabel, reviewApplication, roleLabels, type AppState, type DomainResult, type User } from '@/lib/campus-domain';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export function RegistrationRoster({ state, activityId, teacherId, onResult }: {
  state: AppState; activityId: string; teacherId: string; onResult: (result: DomainResult) => void;
}) {
  const activity = state.activities.find((a) => a.id === activityId);
  const records = state.registrations.filter((r) => r.activityId === activityId);
  if (!activity || activity.organizerId !== teacherId) return null;
  return <div className="space-y-4 p-6">
    <p className="text-sm leading-6 text-muted-foreground">资格结果与参加名额分开记录。通过资格不会自动变为确定参加；候补入队和递补待规则确认后开放。</p>
    {activity.eligibilityText && <p className="rounded-xl bg-secondary p-4 text-sm">参加条件：{activity.eligibilityText}</p>}
    {records.map((r) => {
      const student = state.users.find((u) => u.id === r.studentId);
      const actionable = r.status === 'pending' && (!r.reviewDecision || r.reviewDecision === 'pending') && activity.status === 'published';
      return <div key={r.id} className="rounded-xl border p-4" data-testid={`registration-${r.id}`}>
        <div className="flex flex-wrap items-center justify-between gap-2"><strong>{student?.name ?? '账号不存在'}</strong><Badge variant="secondary">{registrationLabel(r, activity)}</Badge></div>
        <p className="mt-2 text-sm text-muted-foreground">{student?.email}</p>
        {r.reviewedAt && <p className="mt-2 text-xs text-muted-foreground">资格确认时间：{new Date(r.reviewedAt).toLocaleString('zh-CN')}</p>}
        {actionable && <div className="mt-3 flex gap-2"><Button size="sm" onClick={() => onResult(reviewApplication(state, teacherId, r.id, 'approved'))}>通过资格</Button><Button size="sm" variant="outline" onClick={() => onResult(reviewApplication(state, teacherId, r.id, 'rejected'))}>拒绝申请</Button></div>}
      </div>;
    })}
    {!records.length && <p className="text-muted-foreground">暂无报名或申请记录。</p>}
  </div>;
}

export function AdminDashboard({ user, state, onStateChange }: { user: User; state: AppState; onStateChange: (state: AppState) => void }) {
  const [query, setQuery] = useState('');
  const [message, setMessage] = useState('');
  if (user.role !== 'admin') return null;
  const users = state.users.filter((u) => `${u.name} ${u.email}`.toLowerCase().includes(query.toLowerCase()));
  function change(target: User) {
    const result = markUserStatus(state, user.id, target.id, target.managementStatus === 'disabled' ? 'enabled' : 'disabled');
    if (!result.ok) return setMessage(result.error);
    onStateChange(result.state);
    setMessage(`${target.name}的账号状态记录已更新`);
  }
  return <div className="workspace-content">
    <div className="page-heading"><div><p className="eyebrow">平台管理</p><h1>系统管理员工作台</h1><p>查看账号状态与全平台活动信息。</p></div><Badge variant="secondary">V2.0</Badge></div>
    {message && <output className="feedback feedback-success">{message}</output>}
    <Tabs defaultValue="accounts"><TabsList className="mb-6"><TabsTrigger value="accounts">账号管理</TabsTrigger><TabsTrigger value="activities">活动监管</TabsTrigger></TabsList>
      <TabsContent value="accounts">
        <Card><CardHeader><CardTitle>用户账号</CardTitle><CardDescription>停用与恢复仅记录管理状态。登录限制、会话处理及已有报名的影响尚待确认，本版本暂不启用。</CardDescription></CardHeader><CardContent>
          <Input aria-label="搜索账号" placeholder="搜索姓名或邮箱" value={query} onChange={(e) => setQuery(e.target.value)} className="mb-5 max-w-md" />
          <div className="space-y-3">{users.map((u) => <div key={u.id} className="flex flex-wrap items-center justify-between gap-4 rounded-xl border p-4">
            <div><strong>{u.name}</strong><p className="mt-1 text-sm text-muted-foreground">{u.email}</p></div>
            <div className="flex flex-wrap items-center gap-3"><Badge variant="outline">{roleLabels[u.role]}</Badge><Badge variant={u.managementStatus === 'disabled' ? 'destructive' : 'secondary'}>{u.managementStatus === 'disabled' ? '停用标记' : '可用标记'}</Badge><Button variant="outline" size="sm" onClick={() => change(u)}>{u.managementStatus === 'disabled' ? '恢复可用标记' : '标记停用'}</Button></div>
          </div>)}</div>{!users.length && <p>没有匹配账号。</p>}
        </CardContent></Card>
      </TabsContent>
      <TabsContent value="activities"><p className="mb-5 text-sm text-muted-foreground">可查看全部教师活动；具体报名由活动组织教师处理。监管处置权限待确认。</p>
        <div className="grid gap-4 md:grid-cols-2">{state.activities.map((a) => <Card key={a.id}><CardHeader><CardTitle>{a.title}</CardTitle><CardDescription>{state.users.find((u) => u.id === a.organizerId)?.name} · {({ draft: '草稿', published: '已发布', cancelled: '已取消' })[a.status]}</CardDescription></CardHeader><CardContent className="space-y-2 text-sm"><p>{a.location} · {new Date(a.startAt).toLocaleString('zh-CN')}</p><p>{a.description}</p>{a.eligibilityText && <p>参加条件：{a.eligibilityText}</p>}</CardContent></Card>)}</div>
      </TabsContent>
    </Tabs>
  </div>;
}
