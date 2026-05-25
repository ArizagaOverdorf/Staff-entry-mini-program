请继续阶段 1，但本轮只做“阶段 1 联调收尾”，不要开发阶段 2。

开始前请先运行：
.\verify-stage1.cmd

本轮目标：
1. 检查后台登录、管理员、角色权限、字典管理页面是否和后端接口路径/返回结构一致。
2. 检查小程序 request.js 已正确解包 { code, message, data }。
3. 检查 admin request.ts 已正确解包 { code, message, data }。
4. 检查 seed-admin.js 和 seed-dict.js 是否能安全初始化开发数据，不读取或打印 .env 内容。
5. 检查 stage 1 后端 auth/account/admin/dict 改动是否还有半截实现、命名不一致或接口不一致。
6. 如果 pnpm-lock.yaml 只是格式化噪音，不要继续重写它。

严格禁止：
- 不开发阶段 2 的资料填写、证件上传业务。
- 不开发支付、押金、订单、分销、派单、大家评评理。
- 不修改需求文档、技术方案文档和阶段计划文档。
- 不读取 .env 内容；只允许 Test-Path 检查 .env 是否存在。
- 不使用 npx prisma。需要验证时只运行 .\verify-stage1.cmd。
- 不删除文件、不移动文件、不修改 Git 历史。

验证要求：
1. 必须运行 .\verify-stage1.cmd。
2. 后台如果有改动，运行 apps/admin 的 Vite build。
3. 输出 git status。
4. 列出修改文件和剩余问题。

如果遇到需要读取 .env、删除/移动文件、git reset/git checkout、npx prisma 的情况，请停止并说明原因，不要继续执行。
