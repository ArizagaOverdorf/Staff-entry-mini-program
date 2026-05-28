$ErrorActionPreference = "Stop"

$ProjectRoot = $PSScriptRoot
$PromptPath = Join-Path $ProjectRoot "claude-stage6b2-management-status-prompt.md"

Set-Location -LiteralPath $ProjectRoot

if (-not (Test-Path -LiteralPath $PromptPath)) {
  Write-Host "Missing prompt file: $PromptPath" -ForegroundColor Red
  exit 1
}

if (-not (Get-Command claude -ErrorAction SilentlyContinue)) {
  Write-Host "Claude Code CLI was not found. Please install or sign in to Claude Code first." -ForegroundColor Red
  exit 1
}

$Prompt = Get-Content -LiteralPath $PromptPath -Raw -Encoding UTF8

Write-Host ""
Write-Host "Starting Claude Code for Stage 6B-2 staff management status in:" -ForegroundColor Cyan
Write-Host $ProjectRoot
Write-Host ""
Write-Host "File edits will be accepted automatically. Review command approvals carefully." -ForegroundColor Yellow
Write-Host "Approve .\verify-stage6b1-draft-governance.cmd, .\verify-stage6b2-management-status.cmd, local build commands, local Prisma CLI commands, node --check, and read-only git checks." -ForegroundColor Yellow
Write-Host "Reject .env reads, npx prisma, Word document edits, unrelated deletes/moves, git reset/checkout, and out-of-scope customer ordering/payment/distribution work." -ForegroundColor Yellow
Write-Host ""

claude --effort medium --permission-mode acceptEdits $Prompt
