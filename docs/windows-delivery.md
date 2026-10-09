# Windows 64 位 CMD交付

当前唯一启动入口为 `启动系统.cmd`。按用户最新要求，已删除HTML入口、相关构建脚本和通用运行包。历史方案保存在Git历史中，不属于当前交付内容。

## 给接收者的文件

提供 `校园活动管理系统V2.0_Windows64运行版.zip`，目标系统为Windows 10/11 x64，使用现代Edge或Chrome。包内含64位Node.js 24.15.0及其许可证、完整依赖、应用源码和启动器。先全部解压到固定目录，再双击CMD，无需安装Node.js/npm或在接收方联网安装依赖。

源码ZIP和GitHub仓库不包含大型runtime与node_modules，仅供开发。源码使用相同CMD；没有包内运行环境时回退到系统Node.js，缺少依赖时由npm ci安装。没有系统Node/npm的接收者应使用Windows64运行版，而不是源码包。

## 启动流程

CMD首先检查项目文件是否完整，优先使用runtime/node.exe，然后调用scripts/start-windows.mjs。启动器验证Windows x64和Node版本，检查3000端口；被占用时依次尝试后续端口。通过包内Node直接运行Vinext，不调用全局npm。页面成功返回后自动打开默认浏览器。保持终端窗口打开，Ctrl+C结束服务。

启动器不会改变业务规则。管理员标记、新申请、候补与递补仍遵循原已确认范围；数据继续保存在当前浏览器中，各电脑的数据不自动共享。

## 实际验证

2026年10月9日，在本机Windows 11 x64复制完整项目、runtime和依赖到独立的中文目录“校园活动管理系统V2.0_Windows64运行版”，不复制Vite缓存、Git或测试文件。启动进程的PATH仅保留Windows系统目录，排除系统Node/npm；where npm确认不可找到npm。通过CMD启动后，监听3030端口的实际进程ExecutablePath指向新目录内runtime/node.exe，页面返回HTTP 200。

对该独立服务执行原有7个浏览器场景，全部通过：学生普通报名取消刷新、教师资格确认、管理员标记和只读监管、学生注册及教师创建发布编辑取消、损坏存储保护、V1迁移备份、手机布局。结果见test-results/windows-browser-results.json，截图见screenshots/windows-runtime。

24项领域与迁移测试、类型检查和代码规范检查通过；完整项目npm ci锁文件预演检查通过。没有实际访问另一台物理电脑；独立目录和去除系统Node/npm的PATH用于验证运行包不依赖本机安装路径。

## 包装

scripts/package-windows.py检查Node.exe为Windows x64 PE程序，并包含Node许可证。源码安装依赖并准备runtime后，可以运行此脚本生成运行ZIP；运行方不需要Python。打包时仅排除根目录的开发产物；node_modules内部的dist等目录必须保留。打包后检查ZIP CRC及启动所需文件完整性。

原npm EUSAGE原因是直接在ZIP内启动，Windows临时目录只有CMD、没有package-lock.json。当前脚本对此明确提示全部解压；运行版随包提供依赖，不在接收者电脑上执行npm安装。
