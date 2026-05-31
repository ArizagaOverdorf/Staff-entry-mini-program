$ErrorActionPreference = "Stop"

$ProjectRoot = $PSScriptRoot
$PromptPath = Join-Path $ProjectRoot "claude-stage9-3-id-card-profile-sync-final-prompt.md"

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
Write-Host "Starting Claude Code for Stage 9.3 ID card profile sync final fix in:" -ForegroundColor Cyan
Write-Host $ProjectRoot
Write-Host ""
Write-Host "File edits will be accepted automatically." -ForegroundColor Yellow
Write-Host "Claude may run local verifier/build/type-check and local Prisma commands without asking you." -ForegroundColor Yellow
Write-Host "Reject deletion, file moves, .env reads, npx prisma, git reset/checkout, Word document edits, and out-of-scope payment/order/distribution work." -ForegroundColor Yellow
Write-Host ""

claude --effort medium --permission-mode acceptEdits $Prompt
