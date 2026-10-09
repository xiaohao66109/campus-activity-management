# 校园活动管理系统 V2.0

代码仓库：https://github.com/xiaohao66109/campus-activity-management

基于 V1.0 的有限范围迭代。用户选择仅实现已确认内容，未明确流程暂不启用。原始代码在 Git 标签 v1.0-baseline 中，原始 ZIP 未修改。

## Windows 64 位启动

唯一启动入口为 **启动系统.cmd**，HTML 启动已删除。

**发给别人使用：请提供“校园活动管理系统V2.0_Windows64运行版.zip”。** 该包内含64位Node.js、运行依赖和完整项目。接收者在Windows 10/11 x64上右键“全部解压缩”，进入文件夹后双击CMD即可，无需安装Node.js/npm或联网安装依赖。请不要直接在ZIP内部双击脚本。

CMD优先使用runtime/node.exe，启动本地服务器，等待页面准备好后自动打开默认浏览器。窗口需要保持打开，Ctrl+C可停止服务器；3000端口被占用时尝试下一个端口。首次启动编译可能需要一段时间。数据仍保存在当前浏览器中，更换电脑或浏览器不自动共享数据。

**源码包和GitHub检出用于开发**，不附带大型运行环境与node_modules；需要自行安装Node.js 22.13以上（建议24）及npm，CMD在缺少依赖时执行npm ci。也可手动运行npm ci、npm run dev，访问http://localhost:3000/。

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

Windows运行包验证使用已复制的独立目录、包内Node.js及完整依赖，测试进程PATH移除系统Node.js/npm目录。7个浏览器业务场景通过本地HTTP页面执行，具体证据见docs/windows-delivery.md。

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

实验报告在上一级校园管理系统目录及docs中，成员、班级、组名、分工、签名和核对状态已按用户确认填写。
