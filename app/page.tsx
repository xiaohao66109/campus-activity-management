'use client';

import { CalendarDays, MapPin, ShieldCheck, Users } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const previewActivities = [
  { title: '迎新志愿者招募', date: '9月12日 14:00', location: '大学生活动中心', joined: 28, capacity: 40, tone: 'blue' },
  { title: '校园摄影主题分享会', date: '9月15日 19:00', location: '图书馆报告厅', joined: 56, capacity: 80, tone: 'cyan' },
  { title: '秋季荧光夜跑', date: '9月18日 18:30', location: '东区田径场', joined: 96, capacity: 120, tone: 'violet' },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto grid min-h-screen max-w-[1480px] lg:grid-cols-[1.2fr_0.8fr]">
        <section className="relative overflow-hidden px-6 py-8 sm:px-10 lg:px-14 lg:py-12">
          <div className="campus-grid" aria-hidden="true" />
          <header className="relative z-10 flex items-center gap-3">
            <span className="grid size-11 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
              <CalendarDays className="size-5" />
            </span>
            <div>
              <p className="text-base font-semibold tracking-tight">校园活动中心</p>
              <p className="text-sm text-muted-foreground">Campus Activity Hub</p>
            </div>
          </header>

          <div className="relative z-10 mt-16 max-w-3xl lg:mt-24">
            <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/5 px-3 py-1.5 text-sm font-medium text-primary">
              <span className="size-1.5 rounded-full bg-primary" />新学期活动开放报名
            </p>
            <h1 className="max-w-2xl text-4xl font-semibold leading-[1.15] tracking-[-0.035em] sm:text-5xl lg:text-6xl">
              发现校园精彩，<span className="text-primary">让每次参与都有记录</span>
            </h1>
            <p className="mt-5 max-w-xl text-base leading-8 text-muted-foreground sm:text-lg">
              集中查看活动信息、确认剩余名额并管理报名。教师可以在同一平台发布活动和查看参与名单。
            </p>
          </div>

          <div className="relative z-10 mt-12 grid gap-4 md:grid-cols-3">
            {previewActivities.map((activity) => (
              <Card key={activity.title} className="activity-card border-0 bg-card/90 shadow-sm backdrop-blur">
                <CardHeader>
                  <div className={`activity-mark activity-mark-${activity.tone}`} />
                  <CardTitle className="mt-3 text-base">{activity.title}</CardTitle>
                  <CardDescription>{activity.date}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <p className="flex items-center gap-2 text-muted-foreground"><MapPin className="size-4" />{activity.location}</p>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-muted-foreground"><Users className="size-4" />{activity.joined}/{activity.capacity} 人</span>
                    <span className="font-medium text-primary">可报名</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <aside className="flex items-center border-t border-border bg-card px-6 py-12 sm:px-10 lg:border-l lg:border-t-0 lg:px-14">
          <div className="mx-auto w-full max-w-md">
            <div className="mb-8">
              <p className="text-sm font-medium text-primary">欢迎回来</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight">登录活动中心</h2>
              <p className="mt-2 text-base text-muted-foreground">学生可以注册账号，教师请使用预置账号登录。</p>
            </div>
            <Tabs defaultValue="login">
              <TabsList className="mb-6 grid h-11 w-full grid-cols-2 rounded-xl">
                <TabsTrigger value="login" className="h-full rounded-lg">登录</TabsTrigger>
                <TabsTrigger value="register" className="h-full rounded-lg">学生注册</TabsTrigger>
              </TabsList>
              <TabsContent value="login">
                <form className="space-y-5" onSubmit={(event) => event.preventDefault()}>
                  <div className="space-y-2"><Label htmlFor="login-email">邮箱</Label><Input id="login-email" type="email" placeholder="name@campus.edu.cn" className="h-11" /></div>
                  <div className="space-y-2"><Label htmlFor="login-password">密码</Label><Input id="login-password" type="password" placeholder="请输入密码" className="h-11" /></div>
                  <Button type="submit" size="lg" className="h-11 w-full rounded-xl">进入活动中心</Button>
                </form>
                <div className="mt-6 rounded-2xl bg-secondary/70 p-4 text-sm leading-6 text-secondary-foreground">
                  <p className="flex items-center gap-2 font-medium"><ShieldCheck className="size-4 text-primary" />教师演示账号</p>
                  <p className="mt-1 text-muted-foreground">teacher@campus.edu.cn · Teacher123</p>
                </div>
              </TabsContent>
              <TabsContent value="register">
                <form className="space-y-4" onSubmit={(event) => event.preventDefault()}>
                  <div className="space-y-2"><Label htmlFor="register-name">姓名</Label><Input id="register-name" placeholder="请输入真实姓名" className="h-11" /></div>
                  <div className="space-y-2"><Label htmlFor="register-email">校园邮箱</Label><Input id="register-email" type="email" placeholder="student@campus.edu.cn" className="h-11" /></div>
                  <div className="space-y-2"><Label htmlFor="register-password">设置密码</Label><Input id="register-password" type="password" placeholder="至少 8 位" className="h-11" /></div>
                  <Button type="submit" size="lg" className="h-11 w-full rounded-xl">创建学生账号</Button>
                </form>
              </TabsContent>
            </Tabs>
            <p className="mt-8 text-center text-sm text-muted-foreground">V1.0 教学原型 · 数据仅保存在当前浏览器</p>
          </div>
        </aside>
      </div>
    </main>
  );
}

