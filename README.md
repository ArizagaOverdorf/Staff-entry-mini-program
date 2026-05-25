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

当前仓库中 `apps/**` 下已有部分 0 字节文件，这些只视为目录占位，不代表已完成编码。

Claude Code 开始编码时，应先完成：

1. 补齐根工程和各子应用 package/config。
2. 补齐 `apps/server/prisma/schema.prisma`。
3. 让 `pnpm install`、`pnpm --filter @staff-entry/server dev`、`pnpm --filter @staff-entry/admin dev` 有明确可执行目标。
4. 再进入阶段 1 和阶段 2 功能编码。

## 推荐命令

```bash
pnpm install
pnpm dev:server
pnpm dev:admin
pnpm lint
pnpm format:check
```

上述命令需要在 Claude Code 补齐子项目配置后才能全部运行。
