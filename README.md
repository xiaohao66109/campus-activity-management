# 校园活动管理系统 V2.0

代码仓库：https://github.com/xiaohao66109/campus-activity-management

基于 V1.0 的有限范围迭代。用户选择仅实现已确认内容，未明确流程暂不启用。原始代码在 Git 标签 v1.0-baseline 中，原始 ZIP 未修改。

## 运行

**推荐统一入口：双击项目根目录的“打开校园活动系统.html”。** Windows、macOS 和 Linux 均使用这一文件，通过现代浏览器运行；无需 Node.js、命令行、服务器或联网安装。页面、脚本和样式全部内嵌在同一个文件中。也可只把此 HTML 文件发送给接收者。

离线版数据保存在打开它的当前浏览器中。更换电脑、浏览器或文件位置不会自动同步原数据；它与 `http://localhost:3000` 开发版的数据也不自动共享。请使用普通浏览器窗口，允许网站保存本地数据。

下面的 Node.js 启动方式供开发和修改源码使用：

如果使用源码 ZIP，请先右键选择“全部解压缩”，再进入解压后的项目文件夹。开发用 CMD 为 `启动系统.cmd`，不要直接在压缩包内运行它，否则 Windows 的临时目录中只有脚本，缺少依赖配置，`npm ci` 会报错。

安装 Node.js 22.13 以上版本（建议24），在本目录运行 `npm ci`、`npm run dev`，访问 http://localhost:3000/ 。Windows 也可双击 `启动系统.cmd`；macOS/Linux 使用上述终端命令。开发运行窗口需要保持打开。生产产物可执行 `npm run build` 后 `npm start`，终端会显示端口。

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

修改源码后执行 `npm run build:portable` 更新单文件入口；`npm run test:portable` 通过 `file://` 执行相同的 7 项浏览器测试，默认覆盖 Edge 和 WebKit。测试阻断外部网络请求并断言无 HTTP 请求或页面脚本错误，首次需用 `npx playwright install webkit` 安装测试引擎。可用环境变量 `PORTABLE_TEST_FIREFOX=1` 加测 Firefox，需要额外安装相应测试浏览器及操作系统运行库。

本机 Windows 上 Edge/WebKit 的14项离线浏览器场景通过；没有实际 macOS/Linux 设备测试，Firefox 测试引擎因本机运行库缺失未完成。通用入口不包含 Windows 专用运行程序，使用浏览器标准 API；建议在接收方的现代 Chrome、Edge 或 Safari 中打开。

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
