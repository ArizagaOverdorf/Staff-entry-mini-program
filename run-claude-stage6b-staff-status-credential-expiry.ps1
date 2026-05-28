$ErrorActionPreference = "Stop"

$ProjectRoot = $PSScriptRoot
$PromptPath = Join-Path $ProjectRoot "claude-stage6b-staff-status-credential-expiry-prompt.md"

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
Write-Host "Starting Claude Code for Stage 6B staff status and credential expiry in:" -ForegroundColor Cyan
Write-Host $ProjectRoot
Write-Host ""
Write-Host "File edits will be accepted automatically. Review command approvals carefully." -ForegroundColor Yellow
Write-Host "Approve .\verify-stage6a-admin-service-records.cmd, .\verify-stage6b-staff-status-credential-expiry.cmd, local build commands, Prisma generate/deploy commands, node --check, and read-only git checks." -ForegroundColor Yellow
Write-Host "Reject .env reads, deletes/moves, git reset/checkout, npx prisma, Word document edits, and unrelated folders." -ForegroundColor Yellow
Write-Host ""

claude --effort medium --permission-mode acceptEdits $Prompt
