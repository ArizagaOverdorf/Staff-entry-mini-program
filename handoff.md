# Codex 项目交接说明

交接时间：2026-05-29  
项目路径：`D:\CodexProjects\housekeeping-system\Staff entry mini-program`  
当前分支：`master`  
状态：有未提交修改，接手前不要执行 `git reset`、`git checkout --`、批量格式化或覆盖文件。

## 给新 Codex 的第一条指令

可以直接把下面这段发给新账号/新 Codex：

```text
我正在接手一个已有项目，路径是：
D:\CodexProjects\housekeeping-system\Staff entry mini-program

请先检查 git status、git diff --stat、package scripts 和项目结构。
不要重置、覆盖或删除已有改动；不要读取或打印 .env。
先理解当前未提交改动，再继续开发。
```

## 项目概况

这是“家政服务人员入驻小程序”项目，包含：

- `apps/server`：NestJS + Prisma 后端。
- `apps/admin`：React + Vite + Ant Design 管理后台。
- `apps/miniapp`：微信小程序端。
- 根目录有多阶段验证脚本，例如 `verify-stage8-2-support-chat-experience.cmd`。

根目录脚本摘要：

```powershell
pnpm dev:server
pnpm dev:admin
pnpm build:server
pnpm build:admin
pnpm lint
pnpm prisma:generate
pnpm prisma:migrate
```

环境要求：

- Node.js >= 20
- pnpm >= 9
- PostgreSQL 已启动
- `.env` 已在本地配置，接手时不要让 Codex 打印其中内容

## 当前 Git 状态

当前 `git status --short` 显示以下未提交修改：

```text
M apps/admin/src/pages/support/index.tsx
M apps/miniapp/pages/home/index.js
M apps/miniapp/pages/message/support.js
M apps/miniapp/pages/message/support.wxml
M apps/miniapp/pages/message/support.wxss
M apps/miniapp/pages/profile/edit/index.js
M apps/miniapp/pages/profile/edit/index.wxml
M apps/miniapp/pages/profile/view/index.js
M apps/server/src/modules/file/file.constants.ts
M apps/server/src/modules/file/file.service.ts
M verify-stage8-2-support-chat-experience.ps1
```

当前差异规模约为：

```text
11 files changed, 140 insertions(+), 54 deletions(-)
```

注意：命令输出里出现过 `C:\Users\Administrator/.config/git/ignore: Permission denied` 警告，不影响当前交接判断。

## 当前未提交改动重点

这批修改集中在 Stage 8.2 客服聊天体验后续调整：

- 管理后台客服页：`apps/admin/src/pages/support/index.tsx`
  - 轮询间隔当前被改为 `1000` ms。
  - `fetchConversations` 增加了 silent 参数，避免轮询时频繁触发 loading。
  - 注释也从“每 5 秒”改为“每 1 秒”。

- 小程序客服聊天页：`apps/miniapp/pages/message/support.*`
  - 轮询间隔当前被改为 `1000` ms。
  - 图片限制当前为 `2 * 1024 * 1024`。
  - 视频限制当前为 `5 * 1024 * 1024`。
  - 加号旁边的独立“发送”按钮已取消。
  - 发送消息改为使用输入法键盘右下角“发送”：`textarea` 使用 `confirm-type="send"` 和 `bindconfirm="sendMessage"`。
  - 输入框为空时不会显示独立发送按钮，也不会发送空消息。
  - 语音按钮从文字改成了 CSS 绘制图标。

- 文件上传服务：`apps/server/src/modules/file/*`
  - `FILE_LIMITS.IMAGE_MAX_SIZE` 当前为 2MB。
  - `FILE_LIMITS.VIDEO_MAX_SIZE` 当前为 5MB。
  - `FileService.upload` 返回前把 `fileAsset.size` 转成了 `Number`。

- 验证脚本：`verify-stage8-2-support-chat-experience.ps1`
  - 图片/视频大小断言已从 3MB/10MB 改为 2MB/5MB。

## 接手时必须复核的风险

1. Stage 8.2 原任务和自评报告写的是：
   - 管理后台和小程序轮询使用保守间隔，例如 5 秒。
   - 图片最大 3MB。
   - 视频最大 10MB。

   但当前工作区未提交改动已经变成：
   - 轮询 1 秒。
   - 图片 2MB。
   - 视频 5MB。

   新 Codex 接手后应确认这是用户新要求，还是临时调试改动。如果没有明确新要求，建议恢复到 5 秒、3MB、10MB，并同步验证脚本。

2. `support.wxml` 的发送交互已按微信聊天输入框调整：不再显示加号旁边的独立发送按钮，改由键盘右下角“发送”触发 `sendMessage`。
   早前 Stage 8.2 自评报告提到曾因为缺少 `bindconfirm` 导致 Stage 8.1 baseline 失败；当前已恢复 `bindconfirm="sendMessage"`。接手后仍建议重新运行验证脚本确认是否通过。

3. 管理后台媒体消息展示在 Stage 8.2 自评报告中仍是 MVP 限制：后台可能显示媒体消息 JSON，而不是完整预览。

4. 小程序端真实媒体上传、预览、轮询表现需要微信开发者工具手动验证，不能只依赖脚本 marker。

## 重要参考文件

- `CLAUDE.md`
- `README.md`
- `claude-stage8-2-support-chat-experience-prompt.md`
- `claude-reports/20260528-stage8-2-support-chat-experience-self-review.md`
- `verify-stage8-1-support-conversations.cmd`
- `verify-stage8-2-support-chat-experience.cmd`

注意：部分中文文件在 PowerShell 输出中可能显示乱码，这通常是控制台编码问题，不代表文件内容一定损坏。

## 建议接手步骤

1. 查看状态：

```powershell
git status --short
git diff --stat
git branch --show-current
```

2. 阅读当前任务上下文：

```powershell
Get-Content claude-stage8-2-support-chat-experience-prompt.md
Get-Content claude-reports\20260528-stage8-2-support-chat-experience-self-review.md
```

3. 重点查看未提交改动：

```powershell
git diff -- apps\admin\src\pages\support\index.tsx
git diff -- apps\miniapp\pages\message\support.js apps\miniapp\pages\message\support.wxml apps\miniapp\pages\message\support.wxss
git diff -- apps\server\src\modules\file\file.constants.ts apps\server\src\modules\file\file.service.ts
git diff -- verify-stage8-2-support-chat-experience.ps1
```

4. 运行验证：

```powershell
.\verify-stage8-2-support-chat-experience.cmd
```

5. 如果验证失败，优先检查：

- `textarea` 是否仍满足 Stage 8.1/8.2 脚本要求。
- 轮询间隔断言是否与实际产品要求一致。
- 图片/视频大小限制是否与后端、小程序、验证脚本三处一致。

## 不要做的事

- 不要执行 `git reset --hard`。
- 不要执行 `git checkout -- <file>` 来“清理”改动。
- 不要删除验证脚本或报告。
- 不要读取、打印、复制 `.env`。
- 不要修改 Word 需求文档。
- 不要在未确认前批量格式化全仓库。

## 推荐下一步

优先判断当前未提交改动是否是最终期望：

- 如果用户想要更频繁刷新和更小媒体限制：保留 1 秒、2MB、5MB，然后运行完整验证。
- 如果用户只是要求 Stage 8.2 原始验收：恢复到 5 秒、3MB、10MB，并确认当前“键盘右下角发送、无独立发送按钮”的交互是否仍要保留，再运行验证。

验证通过后再考虑提交。提交前建议向用户确认是否要把这批未提交改动作为一个 Stage 8.2 follow-up commit。
