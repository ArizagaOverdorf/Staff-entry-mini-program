# Claude Code 编码交接说明

生成日期：2026-05-24  
当前目标：让 Claude Code 专注编码，不再重新做产品范围判断。

## 1. 必读文件

编码前请按顺序读取：

1. `CLAUDE.md`
2. `家政服务人员入驻_需求文档（独立版）.docx` v1.2
3. `家政服务人员入驻小程序_开发技术方案.md`
4. `实施计划_阶段0_项目初始化.md`
5. `实施计划_阶段1_账号权限与字典.md`
6. `实施计划_阶段2_资料填写与证件上传.md`

历史参考文件可以看，但不能覆盖当前范围：

- `家政服务人员入驻_需求文档_v2_3_开发确认版.docx`
- `大家评评理_供应商需求文档_v1_5_开发确认版.docx`
- `审查报告_家政服务人员入驻_独立版.md`

如有冲突，以 v1.2 独立版 PRD、开发技术方案和 `CLAUDE.md` 为准。

## 2. 当前已整理内容

已补齐：

- 根 `package.json`
- `pnpm-workspace.yaml`
- `.gitignore`
- `.prettierrc`
- `.eslintrc.js`
- `README.md`
- 阶段 0/1/2 实施计划中的 PRD 版本已修正为 v1.2

当前仍需 Claude Code 编码补齐：

- `apps/server/package.json`
- `apps/server/tsconfig.json`
- `apps/server/nest-cli.json`
- `apps/server/prisma/schema.prisma`
- `apps/admin/package.json`
- `apps/admin/tsconfig.json`
- `apps/admin/vite.config.ts`
- `apps/miniapp/app.json`
- 所有 `apps/**` 下 0 字节源码文件

## 3. 空文件处理原则

当前 `apps/**` 下有很多 0 字节文件，它们只是目录和文件结构占位。

Claude Code 下一步必须：

- 需要的文件：补齐有效内容。
- 不需要的文件：删除，并在变更说明里列出。
- 不允许继续保留 0 字节源码文件作为“已完成”。
- 每完成一个阶段，必须说明仍有哪些文件是占位。

## 4. 下一步编码任务

只做阶段 0 到阶段 2。

### 阶段 0

目标：项目可以安装依赖，后端/后台有基础启动命令，Prisma schema 存在。

必须补齐：

- server/admin 子项目 package/config
- Prisma schema
- 基础 NestJS 入口
- 基础 React/Vite 入口
- 小程序 app 配置
- `.env.example` 如有缺项则补充

阶段 0 验收：

- `pnpm install` 可以执行。
- server/admin 的 package scripts 存在。
- `apps/server/prisma/schema.prisma` 存在并覆盖阶段一核心表。
- 不要求真实连接微信，不要求真实 OSS。

### 阶段 1

目标：账号、权限、字典。

必须做：

- 小程序微信登录接口骨架。
- 手机号绑定接口骨架。
- 隐私授权接口。
- 后台登录。
- 管理员、角色、权限。
- 字典管理。

不得做：

- 支付。
- 保证金。
- 订单。
- 派单。
- 大家评评理完整流程。

### 阶段 2

目标：资料填写与证件上传。

必须做：

- 服务人员资料 CRUD。
- 服务类目和服务区域保存。
- 证件 CRUD。
- 文件上传本地存储实现。
- 入驻提交校验。
- 后台只读服务人员列表和详情。

不得做：

- 后台审核操作。
- 服务记录摘要维护。
- 真实订单系统。
- 真实评理流程。

## 5. 范围红线

当前阶段不要实现：

- C 端下单。
- 地图选人。
- 派单。
- 订单履约。
- 支付。
- 保证金。
- 分账。
- 欠款。
- 中间号。
- 《大家评评理》举证、投票、指令单、资金执行。
- 证件过期自动停派。

允许保留：

- 相关表字段。
- 预留接口路径。
- 空模块目录。
- 事件日志模型。

但不允许实现完整业务流程。

## 6. 数据模型重点

Prisma schema 必须至少覆盖：

- `admin_user`
- `admin_role`
- `admin_permission`
- `admin_user_role`
- `admin_role_permission`
- `staff_account`
- `staff_profile`
- `staff_skill`
- `staff_service_area`
- `staff_credential`
- `staff_credential_file`
- `staff_intake_status`
- `audit_record`
- `staff_listing_status`
- `staff_listing_status_log`
- `staff_service_record`
- `staff_service_record_log`
- `message`
- `operation_log`
- `external_event_log`
- `file_asset`
- `dict_item`
- `app_config`

阶段 0 可以一次性建表，阶段 1/2 只实现对应模块逻辑。

## 7. 安全要求

- 不要把真实 AppSecret、数据库密码、OSS AccessKey 写入代码。
- 不要把 `.env` 提交。
- 手机号、身份证号、姓名等敏感字段必须预留加密/脱敏能力。
- 证件图片必须按私有文件处理。
- 后台查看敏感文件必须写操作日志。

## 8. 建议给 Claude Code 的提示词

```text
请根据 CLAUDE.md、家政服务人员入驻小程序_开发技术方案.md、实施计划_阶段0_项目初始化.md、实施计划_阶段1_账号权限与字典.md、实施计划_阶段2_资料填写与证件上传.md 开始编码。

先只完成阶段 0 的可运行工程骨架和 Prisma schema。

要求：
1. 补齐 root/server/admin/miniapp 必要配置。
2. 补齐 apps/server/prisma/schema.prisma，覆盖阶段一核心表和服务记录摘要表。
3. 补齐所有阶段 0 必需源码文件，删除或说明不需要的 0 字节占位文件。
4. 不实现支付、保证金、真实订单、派单或大家评评理完整流程。
5. 完成后输出变更清单、剩余占位文件清单、可运行命令和无法运行的原因。
```

## 9. Codex 复查重点

后续复查时重点看：

- 是否还存在 0 字节源码文件。
- 是否把服务记录摘要误写成真实订单。
- 是否误实现支付/保证金/评理流程。
- schema 是否覆盖 v1.2 关键表。
- 可服务状态是否对外统一为 `is_available / listing_status`。
- 证件过期是否默认不自动停派。
