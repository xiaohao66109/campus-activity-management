# 校园活动管理系统 V2.0

代码仓库：https://github.com/xiaohao66109/campus-activity-management

基于 V1.0 的有限范围迭代。用户选择仅实现已确认内容，未明确流程暂不启用。原始代码在 Git 标签 v1.0-baseline 中，原始 ZIP 未修改。

## 运行

安装 Node.js 22.13 以上版本（建议24），在本目录运行 `npm ci`、`npm run dev`，访问 http://localhost:3000/ 。也可双击“启动系统.cmd”。运行窗口需要保持打开。生产产物可执行 `npm run build` 后 `npm start`，终端会显示端口。

## 新安装演示账号

| 角色 | 邮箱 | 密码 |
| --- | --- | --- |
| 学生 | student@campus.edu.cn | Student123 |
| 教师 | teacher@campus.edu.cn | Teacher123 |
| 另一位教师 | teacher2@campus.edu.cn | Teacher123 |
| 管理员 | admin@campus.edu.cn | Admin123 |

迁移旧数据保留原账号密码；管理员邮箱若冲突会用 admin-migration-数字@campus.edu.cn，密码仍为 Admin123，可在本地V2数据中查看。

## 已完成

保留注册登录、活动搜索详情、普通报名取消、教师创建编辑发布取消；新增三角色分流、个人与教师名单统一状态、本人活动已有申请资格确认、参加条件文字、管理员账号状态记录和全平台只读监管；新增V1校验备份迁移及损坏数据保护。

## 未启用范围

候补入队、排序、退出、递补、审核后的名额分配、停用后的登录和会话效果待确认。条件活动的新申请暂停；已有候补的活动暂停名额变动。管理员停用/恢复只记录状态，界面明确说明。

实践工作坊中的待确认、候补和正式记录为预置演示夹具，不代表已实现完整报名流程。普通活动仍可走通V1闭环。数据保存在当前浏览器，无跨设备共享、真实后端认证或事务。

迁移仅读取同源的 campus-activity-v1-store，保留原键及 campus-activity-v1-backup；V2写入 campus-activity-v2-store，不自动迁移其他域名/端口的数据。

## 测试

`npm test`、`npm run lint`、`npm run typecheck`、`npm run build`、`npm run test:browser`。

浏览器测试默认使用已安装的 Microsoft Edge，并自动启动本地服务。其他系统运行 `npx playwright install chromium` 后设置 PLAYWRIGHT_CHANNEL=chromium。测试使用隔离上下文，证据在 docs/test-results。

## 演示

1. 学生搜索普通活动、报名、查看确定参加、取消和刷新恢复记录。
2. 教师查看实践工作坊名单，对预置申请通过或拒绝资格。
3. 学生再登录查看资格结果；通过资格不自动变为确定参加。
4. 管理员搜索账号、标记停用再恢复、查看全部教师及草稿活动。
5. 查看 `git log --oneline --decorate`、访谈证据、影响分析、测试报告和实验报告。说明未启用的规则。

## 文档

- docs/interviews/2026-10-09：两轮37组问答、需求整理、故事与验收。
- docs/v2-impact-and-design.md：页面、模块、数据和流程影响分析。
- docs/v2-test-report.md：实际测试结果。
- docs/v2-acceptance-status.md：18项验收场景当前状态。
- docs/screenshots：实际测试截图。

实验报告在上一级校园管理系统目录。未知姓名、班级、组名、真实分工、签名和人工复核内容留空，提交前本人填写。
