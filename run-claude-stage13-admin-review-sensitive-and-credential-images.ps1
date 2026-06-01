$ErrorActionPreference = "Stop"

$ProjectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$PromptPath = Join-Path $ProjectRoot "claude-stage13-admin-review-sensitive-and-credential-images-prompt.md"

Set-Location $ProjectRoot

if (-not (Test-Path $PromptPath)) {
  Write-Host "Missing prompt file: $PromptPath" -ForegroundColor Red
  Read-Host "Press Enter to close"
  exit 1
}

if (-not (Get-Command claude -ErrorAction SilentlyContinue)) {
  Write-Host "Claude Code CLI was not found." -ForegroundColor Red
  Write-Host "Install or sign in to Claude Code first, then run this script again."
  Read-Host "Press Enter to close"
  exit 1
}

Write-Host ""
Write-Host "Starting Claude Code for Stage 13 admin review fixes in:"
Write-Host $ProjectRoot
Write-Host ""
Write-Host "File edits will be accepted automatically."
Write-Host "Allowed safe work: edit project source, create verifier/report, run local verifier/build/type-check."
Write-Host "Reject .env reads, npx prisma, git reset/checkout, file deletion, commits, and out-of-scope modules."
Write-Host ""

$Prompt = Get-Content $PromptPath -Raw
claude --effort high --permission-mode acceptEdits $Prompt

Write-Host ""
Write-Host "Claude Stage 13 task finished or was interrupted."
Read-Host "Press Enter to close"
