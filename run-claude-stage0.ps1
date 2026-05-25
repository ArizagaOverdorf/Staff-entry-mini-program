$ErrorActionPreference = "Stop"

$ProjectRoot = $PSScriptRoot
$PromptPath = Join-Path $ProjectRoot "claude-stage0-prompt.md"

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
Write-Host "Starting Claude Code for Stage 0 in:" -ForegroundColor Cyan
Write-Host $ProjectRoot
Write-Host ""
Write-Host "Claude Code may ask for file edit or command permissions. Only approve project-related actions." -ForegroundColor Yellow
Write-Host ""

claude --effort medium $Prompt
