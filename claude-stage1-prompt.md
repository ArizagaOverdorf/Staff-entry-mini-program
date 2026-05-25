请先阅读当前项目目录下的 CLAUDE.md 和 ClaudeCode_编码交接说明.md，并基于当前 Git 提交继续阶段 1。

本轮只完成阶段 1：账号权限与字典。

当前已完成：
1. 阶段 0 已提交为 Git 基线。
2. DictItem 已增加 parentId 层级字典 schema。
3. 本地数据库已有对应迁移。

本轮目标：
1. 修复 auth 模块：登录返回、绑定手机号、当前用户 me 接口。
2. 修复 account 模块：getMe、隐私协议状态、JWT 用户上下文。
3. 完善 admin 模块：登录态、logout/me/permissions、角色与用户基础 CRUD、必要 guard。
4. 完善 dict 模块：后台 CRUD、小程序可读接口、树形字典支持。
5. 继续保持统一响应格式和基础异常处理。

强约束：
- 不读取 .env 内容。只允许用 Test-Path 检查 .env 是否存在。
- 不打印数据库密码、JWT secret、微信 AppSecret、OSS key。
- 不开发支付、押金、订单、分销、派单、大家评评理。
- 不修改需求文档、技术方案文档和阶段计划文档，除非用户明确要求。
- 不删除文件、不移动旧文档、不改 Git 历史。
- 不用 mock_decrypted 手机号写入数据库。encryptedData/iv 可先保留字段并 TODO，正式解密后续再做。
- 绑定手机号时必须从当前 JWT 用户上下文获取 accountId，不信任前端传 staffAccountId。
- 缺少参数时使用 NestJS BadRequestException/UnauthorizedException 等明确异常，不要直接 throw Error。

每个小阶段完成后请执行或提示执行：
1. 优先运行 `.\verify-stage1.cmd`。
2. 如果需要单独验证 Prisma，必须使用 `.\apps\server\node_modules\.bin\prisma.CMD`，不要使用 `npx prisma`。
3. 如果需要查看 Git 状态，只运行 `git status` 或 `git diff`，不要修改 Git 历史。

完成后输出：
1. 修改了哪些文件。
2. 数据库是否需要新迁移。
3. 运行过哪些验证命令。
4. 还有哪些未完成事项。
