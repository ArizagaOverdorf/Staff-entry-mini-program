$ErrorActionPreference = "Stop"

$ProjectRoot = $PSScriptRoot
$PromptPath = Join-Path $ProjectRoot "claude-stage11-profile-credential-merge-prompt.md"

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
Write-Host "Starting Claude Code for Stage 11 profile and credential merge in:" -ForegroundColor Cyan
Write-Host $ProjectRoot
Write-Host ""
Write-Host "File edits will be accepted automatically." -ForegroundColor Yellow
Write-Host "Allowed safe work: edit project source, create verifier/report, run local verifier/build/type-check." -ForegroundColor Yellow
Write-Host "Reject deletion, file moves, .env reads, npx prisma, git reset/checkout, Word document edits, commits, and out-of-scope modules." -ForegroundColor Yellow
Write-Host ""

claude --effort medium --permission-mode acceptEdits $Prompt
