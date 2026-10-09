import type { Metadata } from 'next';

import './globals.css';

export const metadata: Metadata = {
  title: '校园活动中心',
  description: '校园活动管理系统 V1.0，支持学生报名与教师活动管理。',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}

