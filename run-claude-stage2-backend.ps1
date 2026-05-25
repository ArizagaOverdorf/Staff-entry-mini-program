$ErrorActionPreference = "Stop"

$ProjectRoot = $PSScriptRoot
$PromptPath = Join-Path $ProjectRoot "claude-stage2-backend-prompt.md"

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
Write-Host "Starting Claude Code for Stage 2-A backend pass in:" -ForegroundColor Cyan
Write-Host $ProjectRoot
Write-Host ""
Write-Host "File edits will be accepted automatically. Review command approvals carefully." -ForegroundColor Yellow
Write-Host "Approve .\verify-stage2.cmd, local Prisma migrate commands, and read-only git checks." -ForegroundColor Yellow
Write-Host "Reject .env reads, deletes/moves, git reset/checkout, npx prisma, and unrelated folders." -ForegroundColor Yellow
Write-Host ""

claude --effort medium --permission-mode acceptEdits $Prompt
