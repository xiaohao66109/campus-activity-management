# 通用单文件交付

统一启动入口为项目根目录 `打开校园活动系统.html`，页面、样式和脚本全部内嵌。Windows、macOS、Linux 使用相同的文件，以现代浏览器打开；运行无需 Node.js、npm、后台服务器或网络安装。修改源码时仍使用原有开发流程，源码开发保留 Windows CMD `启动系统.cmd`。

复用原有 CampusApp、领域规则、存储与迁移模块，未重写业务系统，也未启用未确认规则。使用独立 Vite 客户端构建，不加载开发服务器、Sites 插件或 Cloudflare 开发环境。构建脚本验证仅有一个 JavaScript 文件，且没有外部导入或动态分块；最终 HTML 约0.6 MB。

## 验证

2026年10月9日，在本机 Windows 上，通过真实 `file://` 地址验证 Edge 和 WebKit，各7项，共14项通过：普通报名取消与刷新、教师资格确认和学生结果一致、管理员标记及只读监管、学生注册及教师创建发布编辑取消、损坏存储保护、V1迁移备份、手机布局。测试阻断所有HTTP请求，并断言不存在外部网络请求和页面脚本错误。Edge 同时设置浏览器离线状态；Windows WebKit 的离线开关会阻止本地文件导航，因此改为拦截网络请求验证。

结果见 `test-results/portable-browser-results.json`，截图见 `screenshots/portable/edge` 和 `screenshots/portable/webkit`。领域与迁移测试24项通过，类型检查和代码规范检查通过。将HTML单独复制到不含项目代码与依赖、路径含空格的新文件夹后，Edge和WebKit登录验证再次通过，均无HTTP请求。源码服务器也已启动，`http://localhost:3000/` 返回 HTTP 200。

已尝试 Firefox，但测试程序启动前被 Windows 的 SideBySide 运行库缺失阻止，未得到应用验证结果。没有实际 macOS/Linux 设备测试，WebKit 引擎测试不等同于真实 macOS Safari 测试。

## 原启动故障

用户在源码ZIP内直接打开CMD，Windows仅把脚本解压到临时文件夹。该文件夹缺少 `package.json` 与 `package-lock.json`，导致npm报 `EUSAGE`。在完整项目中执行 `npm ci --dry-run --ignore-scripts --no-audit --no-fund` 成功，锁文件有效，日志见 `test-results/npm-ci-dry-run.txt`；未用此命令重新安装依赖。开发脚本现先检查完整项目文件，并提示全部解压；同时检查 npm 和实际工具入口，避免残缺的node_modules目录被误判为安装完成。

## 使用与数据边界

将完整HTML文件发给接收者即可；运行包ZIP中仅有这一个启动入口和使用说明。文件位置变化或换浏览器、电脑时，本地数据不会自动同步，离线版和localhost开发版的数据也不会自动共享。不要在无痕窗口中期待关窗后保留数据；浏览器需允许保存本地数据。活动仍使用当前确认范围内的原有业务规则。
