# 校园活动管理系统（第一阶段最小原型）

本项目用于验证校园活动从“教师发布”到“学生报名”的最小业务闭环。数据保存在当前浏览器中，不依赖后端数据库。

## 已实现范围

- 学生注册、登录、退出
- 学生浏览与搜索已发布活动，查看详情
- 学生报名、取消报名、查看自己的报名
- 教师创建、编辑、发布、取消活动
- 教师查看有效报名人数与学生名单
- 重复报名、人数上限、活动状态和开始时间校验

不包含报名审批、消息通知、文件上传、统计报表、多级管理员和真实后端认证，这些属于后续阶段。

## 演示账号

- 教师：`teacher@campus.edu.cn` / `Teacher123`
- 学生：`student@campus.edu.cn` / `Student123`

也可以在登录页注册新的学生账号。

## 本地运行

```bash
npm install
npm run dev
```

访问 `http://localhost:3000/`。如需恢复初始演示数据，可在浏览器开发者工具中清除本网站的本地存储。

## 验证

```bash
npm run lint
npm exec tsc -- --noEmit
npm test
npm run build
```

需求与设计依据见 `docs/engineering-intent.md`，测试记录见 `docs/test-report.md`。
