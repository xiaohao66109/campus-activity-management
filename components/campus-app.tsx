'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Clock3,
  LogOut,
  MapPin,
  Pencil,
  Plus,
  Search,
  ShieldCheck,
  UserRound,
  Users,
  XCircle,
} from 'lucide-react';

import {
  activeRegistration,
  activeRegistrationCount,
  canRegister,
  cancelRegistration,
  changeActivityStatus,
  registerForActivity,
  saveActivity,
  type Activity,
  type ActivityInput,
  type AppState,
  type User,
} from '@/lib/campus-domain';
import {
  hashPassword,
  loadOrCreateState,
  loadSession,
  makeSalt,
  saveSession,
  saveState,
} from '@/lib/campus-storage';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';

type Feedback = { kind: 'success' | 'error'; text: string } | null;
type SubmitLikeEvent = { preventDefault(): void };

type WebMcpTool = {
  name: string;
  title: string;
  description: string;
  inputSchema: Record<string, unknown>;
  annotations: { readOnlyHint: boolean; untrustedContentHint: boolean };
  execute(input: unknown): unknown;
};

type WebMcpContext = {
  registerTool(tool: WebMcpTool, options?: { signal?: AbortSignal }): void | Promise<void>;
};

const statusLabels = { draft: '草稿', published: '已发布', cancelled: '已取消' } as const;

function formatDate(value: string) {
  return new Intl.DateTimeFormat('zh-CN', {
    month: 'long', day: 'numeric', weekday: 'short', hour: '2-digit', minute: '2-digit', hour12: false,
  }).format(new Date(value));
}

function localInputValue(date: Date) {
  const adjusted = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return adjusted.toISOString().slice(0, 16);
}

function createBlankActivity(): ActivityInput {
  const start = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  start.setHours(19, 0, 0, 0);
  const end = new Date(start.getTime() + 2 * 60 * 60 * 1000);
  return { title: '', category: '校园文化', description: '', location: '', startAt: localInputValue(start), endAt: localInputValue(end), capacity: 30 };
}

function FeedbackBanner({ feedback }: { feedback: Feedback }) {
  if (!feedback) return null;
  return (
    <output className={`feedback feedback-${feedback.kind}`}>
      {feedback.kind === 'success' ? <CheckCircle2 className="size-4" /> : <XCircle className="size-4" />}
      {feedback.text}
    </output>
  );
}

function Logo() {
  return (
    <div className="flex items-center gap-3">
      <span className="grid size-10 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
        <CalendarDays className="size-5" />
      </span>
      <div>
        <p className="font-semibold tracking-tight">校园活动中心</p>
        <p className="text-xs text-muted-foreground">Campus Activity Hub</p>
      </div>
    </div>
  );
}

function AuthScreen({ state, onStateChange, onLogin, feedback, setFeedback }: {
  state: AppState;
  onStateChange: (state: AppState) => void;
  onLogin: (user: User) => void;
  feedback: Feedback;
  setFeedback: (feedback: Feedback) => void;
}) {
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [registerName, setRegisterName] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');

  const published = state.activities.filter((item) => item.status === 'published').slice(0, 3);

  async function submitLogin(event: SubmitLikeEvent) {
    event.preventDefault();
    const user = state.users.find((item) => item.email.toLowerCase() === loginEmail.trim().toLowerCase());
    if (!user || !user.passwordHash) return setFeedback({ kind: 'error', text: '邮箱或密码不正确' });
    const candidate = await hashPassword(loginPassword, user.salt);
    if (candidate !== user.passwordHash) return setFeedback({ kind: 'error', text: '邮箱或密码不正确' });
    onLogin(user);
  }

  async function submitRegistration(event: SubmitLikeEvent) {
    event.preventDefault();
    const name = registerName.trim();
    const email = registerEmail.trim().toLowerCase();
    if (name.length < 2) return setFeedback({ kind: 'error', text: '姓名至少需要 2 个字' });
    if (!/^\S+@\S+\.\S+$/.test(email)) return setFeedback({ kind: 'error', text: '请输入有效邮箱' });
    if (registerPassword.length < 8) return setFeedback({ kind: 'error', text: '密码至少需要 8 位' });
    if (state.users.some((item) => item.email.toLowerCase() === email)) return setFeedback({ kind: 'error', text: '该邮箱已经注册' });

    const salt = makeSalt();
    const user: User = {
      id: crypto.randomUUID(), name, email, salt,
      passwordHash: await hashPassword(registerPassword, salt), role: 'student',
    };
    onStateChange({ ...state, users: [...state.users, user] });
    onLogin(user);
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto grid min-h-screen max-w-[1480px] lg:grid-cols-[1.18fr_0.82fr]">
        <section className="relative overflow-hidden px-6 py-8 sm:px-10 lg:px-14 lg:py-12">
          <div className="campus-grid" aria-hidden="true" />
          <div className="relative z-10"><Logo /></div>
          <div className="relative z-10 mt-14 max-w-3xl lg:mt-20">
            <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/5 px-3 py-1.5 text-sm font-medium text-primary"><span className="size-1.5 rounded-full bg-primary" />新学期活动开放报名</p>
            <h1 className="max-w-2xl text-4xl font-semibold leading-[1.15] tracking-[-0.035em] sm:text-5xl lg:text-6xl">发现校园精彩，<span className="text-primary">让每次参与都有记录</span></h1>
            <p className="mt-5 max-w-xl text-base leading-8 text-muted-foreground sm:text-lg">集中查看活动信息、确认剩余名额并管理报名。教师可以在同一平台发布活动和查看参与名单。</p>
          </div>
          <div className="relative z-10 mt-10 grid gap-4 md:grid-cols-3">
            {published.map((activity, index) => (
              <Card key={activity.id} className="activity-card border-0 bg-card/90 shadow-sm backdrop-blur">
                <CardHeader><div className={`activity-mark activity-mark-${['blue', 'cyan', 'violet'][index]}`} /><CardTitle className="mt-3 text-base">{activity.title}</CardTitle><CardDescription>{formatDate(activity.startAt)}</CardDescription></CardHeader>
                <CardContent className="space-y-3 text-sm"><p className="flex items-center gap-2 text-muted-foreground"><MapPin className="size-4" />{activity.location}</p><div className="flex items-center justify-between"><span className="flex items-center gap-2 text-muted-foreground"><Users className="size-4" />{activeRegistrationCount(state, activity.id)}/{activity.capacity} 人</span><span className="font-medium text-primary">可报名</span></div></CardContent>
              </Card>
            ))}
          </div>
        </section>

        <aside className="flex items-center border-t border-border bg-card px-6 py-10 sm:px-10 lg:border-l lg:border-t-0 lg:px-14">
          <div className="mx-auto w-full max-w-md">
            <div className="mb-7"><p className="text-sm font-medium text-primary">欢迎回来</p><h2 className="mt-2 text-3xl font-semibold tracking-tight">登录活动中心</h2><p className="mt-2 text-base text-muted-foreground">学生可以注册账号，教师请使用预置账号登录。</p></div>
            <FeedbackBanner feedback={feedback} />
            <Tabs defaultValue="login" onValueChange={() => setFeedback(null)}>
              <TabsList className="mb-6 grid h-11 w-full grid-cols-2 rounded-xl"><TabsTrigger value="login" className="h-full rounded-lg">登录</TabsTrigger><TabsTrigger value="register" className="h-full rounded-lg">学生注册</TabsTrigger></TabsList>
              <TabsContent value="login">
                <form className="space-y-5" onSubmit={submitLogin}>
                  <div className="space-y-2"><Label htmlFor="login-email">邮箱</Label><Input id="login-email" type="email" value={loginEmail} onChange={(event) => setLoginEmail(event.target.value)} placeholder="name@campus.edu.cn" className="h-11" required /></div>
                  <div className="space-y-2"><Label htmlFor="login-password">密码</Label><Input id="login-password" type="password" value={loginPassword} onChange={(event) => setLoginPassword(event.target.value)} placeholder="请输入密码" className="h-11" required /></div>
                  <Button type="submit" size="lg" className="h-11 w-full rounded-xl">进入活动中心</Button>
                </form>
                <div className="mt-6 rounded-2xl bg-secondary/70 p-4 text-sm leading-6 text-secondary-foreground">
                  <p className="flex items-center gap-2 font-medium"><ShieldCheck className="size-4 text-primary" />演示账号</p>
                  <button type="button" className="demo-account" onClick={() => { setLoginEmail('teacher@campus.edu.cn'); setLoginPassword('Teacher123'); }}>教师：teacher@campus.edu.cn / Teacher123</button>
                  <button type="button" className="demo-account" onClick={() => { setLoginEmail('student@campus.edu.cn'); setLoginPassword('Student123'); }}>学生：student@campus.edu.cn / Student123</button>
                </div>
              </TabsContent>
              <TabsContent value="register">
                <form className="space-y-4" onSubmit={submitRegistration}>
                  <div className="space-y-2"><Label htmlFor="register-name">姓名</Label><Input id="register-name" value={registerName} onChange={(event) => setRegisterName(event.target.value)} placeholder="请输入真实姓名" className="h-11" required /></div>
                  <div className="space-y-2"><Label htmlFor="register-email">校园邮箱</Label><Input id="register-email" type="email" value={registerEmail} onChange={(event) => setRegisterEmail(event.target.value)} placeholder="student@campus.edu.cn" className="h-11" required /></div>
                  <div className="space-y-2"><Label htmlFor="register-password">设置密码</Label><Input id="register-password" type="password" value={registerPassword} onChange={(event) => setRegisterPassword(event.target.value)} placeholder="至少 8 位" className="h-11" required /></div>
                  <Button type="submit" size="lg" className="h-11 w-full rounded-xl">创建学生账号</Button>
                </form>
              </TabsContent>
            </Tabs>
            <p className="mt-7 text-center text-sm text-muted-foreground">V1.0 教学原型 · 数据仅保存在当前浏览器</p>
          </div>
        </aside>
      </div>
    </main>
  );
}

function ActivityCard({ activity, state, student, onOpen }: { activity: Activity; state: AppState; student: User; onOpen: () => void }) {
  const count = activeRegistrationCount(state, activity.id);
  const registered = Boolean(activeRegistration(state, activity.id, student.id));
  const error = canRegister(state, activity.id, student.id);
  return (
    <Card className="activity-card border-0 shadow-sm ring-1 ring-border">
      <CardHeader>
        <div className="flex items-center justify-between gap-3"><Badge variant="secondary">{activity.category}</Badge>{registered ? <Badge>已报名</Badge> : error ? <Badge variant="outline">{error.includes('名额') ? '已满' : '不可报名'}</Badge> : <Badge variant="outline" className="text-primary">报名中</Badge>}</div>
        <CardTitle className="mt-3 text-lg">{activity.title}</CardTitle>
        <CardDescription className="line-clamp-2 leading-6">{activity.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 text-sm text-muted-foreground">
        <p className="flex items-center gap-2"><CalendarDays className="size-4 text-primary" />{formatDate(activity.startAt)}</p>
        <p className="flex items-center gap-2"><MapPin className="size-4 text-primary" />{activity.location}</p>
        <div className="pt-2"><div className="mb-2 flex justify-between"><span>{count} 人已报名</span><span>剩余 {Math.max(0, activity.capacity - count)} 个名额</span></div><div className="h-2 overflow-hidden rounded-full bg-secondary"><div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(100, (count / activity.capacity) * 100)}%` }} /></div></div>
        <Button onClick={onOpen} variant={registered ? 'secondary' : 'default'} className="mt-2 h-10 w-full">查看活动详情</Button>
      </CardContent>
    </Card>
  );
}

function StudentDashboard({ user, state, onStateChange, feedback, setFeedback }: { user: User; state: AppState; onStateChange: (state: AppState) => void; feedback: Feedback; setFeedback: (feedback: Feedback) => void }) {
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const published = state.activities.filter((item) => item.status === 'published');
  const visible = published.filter((item) => `${item.title}${item.category}${item.location}`.toLowerCase().includes(search.trim().toLowerCase()));
  const myRegistrations = state.registrations.filter((item) => item.studentId === user.id && item.status === 'active');
  const selected = state.activities.find((item) => item.id === selectedId) ?? null;

  function update(result: ReturnType<typeof registerForActivity>, success: string) {
    if (!result.ok) return setFeedback({ kind: 'error', text: result.error });
    onStateChange(result.state);
    setFeedback({ kind: 'success', text: success });
  }

  return (
    <div className="workspace-content">
      <div className="page-heading"><div><p className="eyebrow">学生工作台</p><h1>你好，{user.name}</h1><p>查看近期校园活动，管理你的报名安排。</p></div><div className="stat-pill"><CalendarDays className="size-5 text-primary" /><span><strong>{published.length}</strong> 个活动开放</span></div></div>
      <FeedbackBanner feedback={feedback} />
      <Tabs defaultValue="discover" onValueChange={() => setFeedback(null)}>
        <TabsList variant="line" className="mb-7"><TabsTrigger value="discover">活动广场</TabsTrigger><TabsTrigger value="mine">我的报名 <Badge variant="secondary">{myRegistrations.length}</Badge></TabsTrigger></TabsList>
        <TabsContent value="discover">
          <div className="mb-6 flex max-w-md items-center gap-2 rounded-xl border bg-card px-3"><Search className="size-4 text-muted-foreground" /><Input aria-label="搜索活动" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="搜索活动、类型或地点" className="h-10 border-0 px-0 shadow-none focus-visible:ring-0" /></div>
          {visible.length ? <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">{visible.map((activity) => <ActivityCard key={activity.id} activity={activity} state={state} student={user} onOpen={() => setSelectedId(activity.id)} />)}</div> : <div className="empty-state"><Search className="size-8" /><h3>没有找到相关活动</h3><p>尝试更换关键词。</p></div>}
        </TabsContent>
        <TabsContent value="mine">
          {myRegistrations.length ? <div className="space-y-4">{myRegistrations.map((registration) => { const activity = state.activities.find((item) => item.id === registration.activityId); if (!activity) return null; return <Card key={registration.id} className="border-0 shadow-sm ring-1 ring-border"><CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between"><div><div className="mb-2 flex items-center gap-2"><Badge variant="secondary">{activity.category}</Badge><Badge>报名成功</Badge></div><h3 className="text-lg font-semibold">{activity.title}</h3><p className="mt-2 text-sm text-muted-foreground">{formatDate(activity.startAt)} · {activity.location}</p></div><div className="flex gap-2"><Button variant="outline" onClick={() => setSelectedId(activity.id)}>查看详情</Button><Button variant="destructive" onClick={() => update(cancelRegistration(state, activity.id, user.id), '报名已取消，名额已释放')}>取消报名</Button></div></CardContent></Card>; })}</div> : <div className="empty-state"><ClipboardList className="size-8" /><h3>还没有报名活动</h3><p>前往活动广场选择感兴趣的活动。</p></div>}
        </TabsContent>
      </Tabs>

      <Sheet open={Boolean(selected)} onOpenChange={(open) => !open && setSelectedId(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
          {selected && <><SheetHeader className="border-b p-6"><div className="mb-2 flex gap-2"><Badge variant="secondary">{selected.category}</Badge><Badge variant="outline">{activeRegistrationCount(state, selected.id)}/{selected.capacity} 人</Badge></div><SheetTitle className="pr-8 text-2xl">{selected.title}</SheetTitle><SheetDescription>由王老师组织</SheetDescription></SheetHeader><div className="space-y-6 p-6"><div className="detail-row"><CalendarDays /><div><span>活动时间</span><strong>{formatDate(selected.startAt)}</strong></div></div><div className="detail-row"><MapPin /><div><span>活动地点</span><strong>{selected.location}</strong></div></div><div className="detail-row"><Users /><div><span>报名情况</span><strong>{activeRegistrationCount(state, selected.id)} 人已报名，剩余 {Math.max(0, selected.capacity - activeRegistrationCount(state, selected.id))} 个名额</strong></div></div><div><h3 className="mb-3 font-semibold">活动说明</h3><p className="leading-7 text-muted-foreground">{selected.description}</p></div></div><SheetFooter className="border-t bg-card p-6">{activeRegistration(state, selected.id, user.id) ? <Button variant="destructive" className="h-11" onClick={() => update(cancelRegistration(state, selected.id, user.id), '报名已取消，名额已释放')}>取消报名</Button> : <Button className="h-11" disabled={Boolean(canRegister(state, selected.id, user.id))} onClick={() => update(registerForActivity(state, selected.id, user.id), '报名成功，可在“我的报名”中查看')}>{canRegister(state, selected.id, user.id) ?? '确认报名'}</Button>}</SheetFooter></>}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function TeacherDashboard({ user, state, onStateChange, feedback, setFeedback }: { user: User; state: AppState; onStateChange: (state: AppState) => void; feedback: Feedback; setFeedback: (feedback: Feedback) => void }) {
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | undefined>();
  const [form, setForm] = useState<ActivityInput>(createBlankActivity());
  const [cancelId, setCancelId] = useState<string | null>(null);
  const [rosterId, setRosterId] = useState<string | null>(null);
  const owned = state.activities.filter((item) => item.organizerId === user.id);
  const rosterActivity = owned.find((item) => item.id === rosterId) ?? null;
  const roster = rosterActivity ? state.registrations.filter((item) => item.activityId === rosterActivity.id && item.status === 'active').map((item) => state.users.find((userItem) => userItem.id === item.studentId)).filter(Boolean) as User[] : [];

  function openEditor(activity?: Activity) {
    setEditingId(activity?.id);
    setForm(activity ? { title: activity.title, category: activity.category, description: activity.description, location: activity.location, startAt: activity.startAt.slice(0, 16), endAt: activity.endAt.slice(0, 16), capacity: activity.capacity } : createBlankActivity());
    setEditorOpen(true);
  }

  function commit(result: ReturnType<typeof saveActivity>, message: string) {
    if (!result.ok) return setFeedback({ kind: 'error', text: result.error });
    onStateChange(result.state);
    setFeedback({ kind: 'success', text: message });
    return true;
  }

  function submitActivity(event: SubmitLikeEvent) {
    event.preventDefault();
    if (commit(saveActivity(state, user.id, { ...form, capacity: Number(form.capacity) }, editingId), editingId ? '活动信息已更新' : '活动草稿已创建')) setEditorOpen(false);
  }

  function changeStatus(activityId: string, status: 'published' | 'cancelled') {
    const result = changeActivityStatus(state, user.id, activityId, status);
    if (!result.ok) return setFeedback({ kind: 'error', text: result.error });
    onStateChange(result.state);
    setFeedback({ kind: 'success', text: status === 'published' ? '活动已发布，学生现在可以看到并报名' : '活动已取消' });
  }

  return (
    <div className="workspace-content">
      <div className="page-heading"><div><p className="eyebrow">教师工作台</p><h1>活动管理</h1><p>维护活动信息、发布状态与学生报名名单。</p></div><Button size="lg" className="h-11 rounded-xl" onClick={() => openEditor()}><Plus />创建活动</Button></div>
      <FeedbackBanner feedback={feedback} />
      <div className="mb-6 grid gap-4 sm:grid-cols-3"><div className="metric-card"><span>全部活动</span><strong>{owned.length}</strong></div><div className="metric-card"><span>已发布</span><strong>{owned.filter((item) => item.status === 'published').length}</strong></div><div className="metric-card"><span>有效报名</span><strong>{owned.reduce((total, item) => total + activeRegistrationCount(state, item.id), 0)}</strong></div></div>
      <Card className="border-0 shadow-sm ring-1 ring-border"><CardHeader><CardTitle>我的活动</CardTitle><CardDescription>草稿仅教师可见，发布后学生可以报名。</CardDescription></CardHeader><CardContent className="px-2 sm:px-4"><Table><TableHeader><TableRow><TableHead>活动</TableHead><TableHead>时间与地点</TableHead><TableHead>状态</TableHead><TableHead>报名</TableHead><TableHead className="text-right">操作</TableHead></TableRow></TableHeader><TableBody>{owned.map((activity) => <TableRow key={activity.id}><TableCell><div className="max-w-[240px] whitespace-normal"><strong>{activity.title}</strong><p className="mt-1 text-xs text-muted-foreground">{activity.category}</p></div></TableCell><TableCell><div className="whitespace-normal text-sm"><p>{formatDate(activity.startAt)}</p><p className="mt-1 text-xs text-muted-foreground">{activity.location}</p></div></TableCell><TableCell><Badge variant={activity.status === 'published' ? 'default' : activity.status === 'cancelled' ? 'destructive' : 'secondary'}>{statusLabels[activity.status]}</Badge></TableCell><TableCell>{activeRegistrationCount(state, activity.id)}/{activity.capacity}</TableCell><TableCell><div className="flex justify-end gap-1"><Button size="sm" variant="ghost" onClick={() => setRosterId(activity.id)}><Users />名单</Button><Button size="sm" variant="ghost" disabled={activity.status === 'cancelled'} onClick={() => openEditor(activity)}><Pencil />编辑</Button>{activity.status === 'draft' && <Button size="sm" onClick={() => changeStatus(activity.id, 'published')}>发布</Button>}{activity.status !== 'cancelled' && <Button size="sm" variant="destructive" onClick={() => setCancelId(activity.id)}>取消</Button>}</div></TableCell></TableRow>)}</TableBody></Table></CardContent></Card>

      <Dialog open={editorOpen} onOpenChange={setEditorOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl"><DialogHeader><DialogTitle className="text-xl">{editingId ? '编辑活动' : '创建活动草稿'}</DialogTitle><DialogDescription>先保存为草稿，确认信息后再发布给学生。</DialogDescription></DialogHeader><form className="grid gap-4 sm:grid-cols-2" onSubmit={submitActivity}><div className="space-y-2 sm:col-span-2"><Label htmlFor="activity-title">活动名称</Label><Input id="activity-title" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} required /></div><div className="space-y-2"><Label htmlFor="activity-category">活动类型</Label><Input id="activity-category" value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} required /></div><div className="space-y-2"><Label htmlFor="activity-location">活动地点</Label><Input id="activity-location" value={form.location} onChange={(event) => setForm({ ...form, location: event.target.value })} required /></div><div className="space-y-2"><Label htmlFor="activity-start">开始时间</Label><Input id="activity-start" type="datetime-local" value={form.startAt} onChange={(event) => setForm({ ...form, startAt: event.target.value })} required /></div><div className="space-y-2"><Label htmlFor="activity-end">结束时间</Label><Input id="activity-end" type="datetime-local" value={form.endAt} onChange={(event) => setForm({ ...form, endAt: event.target.value })} required /></div><div className="space-y-2"><Label htmlFor="activity-capacity">人数上限</Label><Input id="activity-capacity" type="number" min="1" step="1" value={form.capacity} onChange={(event) => setForm({ ...form, capacity: Number(event.target.value) })} required /></div><div className="space-y-2 sm:col-span-2"><Label htmlFor="activity-description">活动说明</Label><Textarea id="activity-description" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} className="min-h-28" required /></div><DialogFooter className="sm:col-span-2"><Button type="button" variant="outline" onClick={() => setEditorOpen(false)}>返回</Button><Button type="submit">保存{editingId ? '修改' : '草稿'}</Button></DialogFooter></form></DialogContent>
      </Dialog>

      <Sheet open={Boolean(rosterActivity)} onOpenChange={(open) => !open && setRosterId(null)}><SheetContent className="w-full sm:max-w-lg"><SheetHeader className="border-b p-6"><SheetTitle className="text-xl">{rosterActivity?.title}</SheetTitle><SheetDescription>当前有效报名 {roster.length} 人</SheetDescription></SheetHeader><div className="space-y-3 p-6">{roster.length ? roster.map((student) => <div key={student.id} className="flex items-center gap-3 rounded-xl border p-4"><span className="grid size-10 place-items-center rounded-full bg-secondary text-primary"><UserRound className="size-5" /></span><div><p className="font-medium">{student.name}</p><p className="text-sm text-muted-foreground">{student.email}</p></div></div>) : <div className="empty-state"><Users className="size-8" /><h3>暂无报名学生</h3><p>活动发布后，学生报名将显示在这里。</p></div>}</div></SheetContent></Sheet>

      <AlertDialog open={Boolean(cancelId)} onOpenChange={(open) => !open && setCancelId(null)}><AlertDialogContent><AlertDialogHeader><AlertDialogMedia><XCircle className="text-destructive" /></AlertDialogMedia><AlertDialogTitle>确认取消活动？</AlertDialogTitle><AlertDialogDescription>活动取消后将无法再次发布，已有报名记录会保留用于说明历史。</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>返回</AlertDialogCancel><AlertDialogAction variant="destructive" onClick={() => { if (cancelId) changeStatus(cancelId, 'cancelled'); setCancelId(null); }}>确认取消</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
    </div>
  );
}

function Workspace({ user, state, onStateChange, onLogout, feedback, setFeedback }: { user: User; state: AppState; onStateChange: (state: AppState) => void; onLogout: () => void; feedback: Feedback; setFeedback: (feedback: Feedback) => void }) {
  return (
    <main className="min-h-screen bg-background"><header className="sticky top-0 z-40 border-b bg-card/90 backdrop-blur"><div className="mx-auto flex h-18 max-w-[1400px] items-center justify-between px-5 sm:px-8"><Logo /><div className="flex items-center gap-3"><div className="hidden text-right sm:block"><p className="text-sm font-medium">{user.name}</p><p className="text-xs text-muted-foreground">{user.role === 'teacher' ? '活动组织教师' : '学生用户'}</p></div><Badge variant="secondary">{user.role === 'teacher' ? '教师' : '学生'}</Badge><Button variant="ghost" size="icon" aria-label="退出登录" onClick={onLogout}><LogOut /></Button></div></div></header>{user.role === 'teacher' ? <TeacherDashboard user={user} state={state} onStateChange={onStateChange} feedback={feedback} setFeedback={setFeedback} /> : <StudentDashboard user={user} state={state} onStateChange={onStateChange} feedback={feedback} setFeedback={setFeedback} />}</main>
  );
}

export default function CampusApp() {
  const [state, setState] = useState<AppState | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<Feedback>(null);

  useEffect(() => {
    void loadOrCreateState()
      .then((nextState) => {
        setState(nextState);
        const savedUserId = loadSession();
        if (savedUserId && nextState.users.some((item) => item.id === savedUserId)) setCurrentUserId(savedUserId);
      })
      .catch(() => setFeedback({ kind: 'error', text: '活动数据初始化失败，请刷新页面重试' }));
  }, []);

  const currentUser = useMemo(() => state?.users.find((item) => item.id === currentUserId) ?? null, [state, currentUserId]);

  function updateState(nextState: AppState) {
    setState(nextState);
    saveState(nextState);
  }

  useEffect(() => {
    if (!state || !currentUser || currentUser.role !== 'student') return;
    const context = (document as Document & { modelContext?: WebMcpContext }).modelContext;
    if (!context?.registerTool) return;

    const lifecycle = new AbortController();
    const tools: WebMcpTool[] = [
      {
        name: 'list_available_activities',
        title: '查看可报名活动',
        description: '列出当前已发布的校园活动、剩余名额及当前学生的报名状态。',
        inputSchema: { type: 'object', properties: {}, additionalProperties: false },
        annotations: { readOnlyHint: true, untrustedContentHint: true },
        execute: () => state.activities
          .filter((activity) => activity.status === 'published')
          .map((activity) => ({
            id: activity.id,
            title: activity.title,
            startAt: activity.startAt,
            location: activity.location,
            remaining: Math.max(0, activity.capacity - activeRegistrationCount(state, activity.id)),
            registered: Boolean(activeRegistration(state, activity.id, currentUser.id)),
          })),
      },
      {
        name: 'register_for_activity',
        title: '报名校园活动',
        description: '使用活动 ID 为当前登录学生完成报名，并同步更新页面中的报名状态。',
        inputSchema: {
          type: 'object',
          properties: { activityId: { type: 'string', minLength: 1 } },
          required: ['activityId'],
          additionalProperties: false,
        },
        annotations: { readOnlyHint: false, untrustedContentHint: false },
        execute: (input) => {
          const activityId = typeof input === 'object' && input !== null && 'activityId' in input
            ? (input as { activityId?: unknown }).activityId
            : undefined;
          if (typeof activityId !== 'string' || !activityId) throw new Error('activityId 必须是非空字符串');
          const result = registerForActivity(state, activityId, currentUser.id);
          if (!result.ok) throw new Error(result.error);
          setState(result.state);
          saveState(result.state);
          setFeedback({ kind: 'success', text: '报名成功，可在“我的报名”中查看' });
          return { activityId, status: 'registered' };
        },
      },
      {
        name: 'cancel_activity_registration',
        title: '取消活动报名',
        description: '使用活动 ID 取消当前登录学生的有效报名，并释放对应名额。',
        inputSchema: {
          type: 'object',
          properties: { activityId: { type: 'string', minLength: 1 } },
          required: ['activityId'],
          additionalProperties: false,
        },
        annotations: { readOnlyHint: false, untrustedContentHint: false },
        execute: (input) => {
          const activityId = typeof input === 'object' && input !== null && 'activityId' in input
            ? (input as { activityId?: unknown }).activityId
            : undefined;
          if (typeof activityId !== 'string' || !activityId) throw new Error('activityId 必须是非空字符串');
          const result = cancelRegistration(state, activityId, currentUser.id);
          if (!result.ok) throw new Error(result.error);
          setState(result.state);
          saveState(result.state);
          setFeedback({ kind: 'success', text: '报名已取消，名额已释放' });
          return { activityId, status: 'cancelled' };
        },
      },
    ];

    try {
      void Promise.all(
        tools.map((tool) => Promise.resolve(context.registerTool(tool, { signal: lifecycle.signal }))),
      ).catch(() => undefined);
    } catch {
      return () => lifecycle.abort();
    }
    return () => lifecycle.abort();
  }, [currentUser, state]);

  function login(user: User) {
    setCurrentUserId(user.id);
    saveSession(user.id);
    setFeedback({ kind: 'success', text: `登录成功，欢迎 ${user.name}` });
  }

  function logout() {
    setCurrentUserId(null);
    saveSession(null);
    setFeedback(null);
  }

  if (!state) return <main className="grid min-h-screen place-items-center bg-background"><output className="flex items-center gap-3 text-muted-foreground"><Clock3 className="size-5 animate-pulse text-primary" />正在准备活动数据…</output></main>;
  return currentUser ? <Workspace user={currentUser} state={state} onStateChange={updateState} onLogout={logout} feedback={feedback} setFeedback={setFeedback} /> : <AuthScreen state={state} onStateChange={updateState} onLogin={login} feedback={feedback} setFeedback={setFeedback} />;
}
