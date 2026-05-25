# 家政服务人员入驻独立小程序

本项目用于开发《家政服务人员入驻独立小程序》阶段一 MVP。

当前开发范围以以下文件为准：

- `CLAUDE.md`
- `家政服务人员入驻_需求文档（独立版）.docx` v1.2
- `家政服务人员入驻小程序_开发技术方案.md`
- `实施计划_阶段0_项目初始化.md`
- `实施计划_阶段1_账号权限与字典.md`
- `实施计划_阶段2_资料填写与证件上传.md`

## 阶段一必须做

- 微信小程序登录、手机号绑定、隐私授权。
- 服务人员资料填写、服务类目、服务区域。
- 证件上传、证件状态、提交审核。
- 后台账号、角色、权限、字典。
- 后台只读查看服务人员资料和证件。
- 后续阶段需要的稳定 `staff_id`、状态和数据模型基础。

## 阶段一明确不做

- C 端下单。
- 地图选人和派单。
- 支付、保证金、分账、欠款。
- 真实订单系统。
- 《大家评评理》完整流程。
- 自动处罚或自动冻结接单。

## 当前状态

Stage 0–4 已完成。数据库模型、后端 API、管理后台前端和微信小程序均已实现基础功能。

### 本地开发快速开始

**前置条件：** PostgreSQL 数据库已启动，`.env` 文件已配置（参考 `.env.example`）。

```powershell
# 1. 安装依赖
pnpm install

# 2. 初始化数据库（迁移）
.\apps\server\node_modules\.bin\prisma.CMD migrate deploy --schema apps\server\prisma\schema.prisma

# 3. 初始化管理员账号（需要 .env 中配置 ADMIN_SEED_PASSWORD）
pnpm --filter @staff-entry/server seed:admin

# 4. 初始化演示服务人员
.\seed-demo-staff.cmd

# 5. 启动后端服务
pnpm dev:server

# 6. 另开终端，启动管理后台
pnpm dev:admin
```

### 演示数据

运行 `seed-demo-staff.cmd` 或手动执行种子脚本后，数据库中会有 3 位演示服务人员：

| staffId | 姓名 | 入驻状态 |
|---------|------|----------|
| DEMO1001 | 王小梅 | 待审核 |
| DEMO1002 | 李师傅 | 需补充资料 |
| DEMO1003 | 张阿姨 | 已通过 |

### 管理后台本地访问

1. 浏览器打开管理后台地址（默认 http://localhost:5173）。
2. 使用管理员账号登录。管理员账号由 `pnpm --filter @staff-entry/server seed:admin` 创建，用户名看 `.env` 的 `ADMIN_SEED_USERNAME`，密码看本地 `.env` 的 `ADMIN_SEED_PASSWORD`。
3. 进入「服务人员管理」查看演示人员列表。
4. 点击「查看详情」进入详情页，可进行证件审核和入驻审核。

### 验证

```powershell
# 运行 Stage 4 集成验证（需数据库在线）
.\verify-stage4.cmd
```

### 微信小程序本地开发

1. 使用微信开发者工具打开 `apps/miniapp` 目录。
2. 在 `apps/miniapp/utils/constants.js` 中确认 `API_BASE_URL` 指向本地后端（默认 `http://localhost:3000/api`）。
3. 在开发者工具中预览小程序，完成资料填写、证件上传、提交入驻流程。
