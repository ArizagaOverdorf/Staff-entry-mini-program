请继续阶段 2，但本轮只做“阶段 2-A：后端基础接口与存储 + 最小接口对齐”，不要一次性开发完整阶段 2 页面闭环。

开始前请先运行：
.\verify-stage2.cmd

当前前置状态：
1. 阶段 0 已完成并提交。
2. 阶段 1 已完成并提交，包含登录、手机号绑定、隐私授权、后台管理员/角色/字典、统一响应封装。
3. 阶段 2 的目标是资料填写与证件上传，但本轮只做后端基础能力和最小前端接口对齐。

本轮允许做的事情：
1. 后端 file 模块：
   - 完成 POST /api/app/files/upload。
   - 完成本地私有存储 local storage。
   - 写入 file_asset。
   - 校验文件类型、大小。
   - GET /api/app/files/:fileId/preview 返回短时预览能力的本地开发实现。
2. 后端 staff/profile 模块：
   - 完成 GET /api/app/profile。
   - 完成 PUT /api/app/profile。
   - 完成 PUT /api/app/profile/skills。
   - 完成 PUT /api/app/profile/service-areas。
   - 本人接口可返回完整本人资料；不要给外部接口返回未脱敏敏感信息。
3. 后端 credential 模块：
   - 完成 GET /api/app/credentials。
   - 完成 POST /api/app/credentials。
   - 证件记录支持身份证、健康证、无犯罪证明、保险、技能证书、学历。
   - 保存证件时关联 file_asset。
   - 先实现版本字段/当前有效字段的基础逻辑；不做后台审核动作。
4. 后端 intake 模块：
   - 完成 GET /api/app/intake/preview。
   - 完成 GET /api/app/intake/status。
   - 完成 POST /api/app/intake/submit。
   - submit 只负责校验手机号、隐私授权、必填资料、强准入证件是否存在，然后进入 under_review。
   - 不实现审核通过/驳回/补充资料操作，这些属于阶段 3。
5. 后台 staff 只读接口：
   - GET /api/admin/staff。
   - GET /api/admin/staff/:staffId。
   - GET /api/admin/staff/:staffId/credentials。
   - 只读展示，不实现审核按钮和审核流。
6. 如 schema 不足，可以修改 Prisma schema 并生成迁移。
7. 如小程序常量或请求字段与后端路径不一致，可以做最小对齐；不要重做 UI。

严格禁止：
- 不开发阶段 3 后台审核操作。
- 不开发支付、押金、订单、分销、派单、大家评评理。
- 不实现证件过期自动停派。
- 不实现真实预约订单或服务履约。
- 不修改需求文档、技术方案文档和阶段计划文档。
- 不读取 .env 内容；只允许 Test-Path 检查 .env 是否存在。
- 不使用 npx prisma。需要验证时只运行 .\verify-stage2.cmd 或使用本地 .\apps\server\node_modules\.bin\prisma.CMD。
- 不删除文件、不移动文件、不修改 Git 历史。
- 不把证件图片做成公开静态资源；预览必须经过后端接口。

数据与安全要求：
- 手机号、身份证号、姓名等敏感字段加密存储；展示时按场景脱敏。
- 证件文件私有存储，路径不要直接暴露给小程序或后台。
- 文件预览接口必须校验当前用户或后台权限。
- 后台查看敏感文件预览时至少预留 operation_log 写入位置。
- 文件上传目录必须在项目内的 ignored storage/uploads 目录下，不要写到系统目录。

验证要求：
1. 必须运行 .\verify-stage2.cmd。
2. 如果修改 Prisma schema，必须生成迁移并确认 migrate status up to date。
3. 如果修改后台前端，必须确认 admin TypeScript build 通过。
4. 输出 git status。
5. 列出修改文件、迁移文件、剩余问题。

完成后请停止，不要继续进入阶段 2-B 小程序完整页面联调。
