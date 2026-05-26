$ErrorActionPreference = "Stop"

$ProjectRoot = $PSScriptRoot
Set-Location -LiteralPath $ProjectRoot

function Assert-FileExists {
  param([string]$Path)
  if (-not (Test-Path -LiteralPath $Path)) {
    throw "Missing required file: $Path"
  }
}

function Assert-Contains {
  param(
    [string]$Path,
    [string]$Pattern,
    [string]$Message
  )

  $content = Get-Content -LiteralPath $Path -Raw -Encoding UTF8
  if ($content -notmatch $Pattern) {
    throw "$Message in $Path"
  }
}

function Assert-NotContains {
  param(
    [string[]]$Paths,
    [string]$Pattern,
    [string]$Message
  )

  foreach ($path in $Paths) {
    if (-not (Test-Path -LiteralPath $path)) {
      continue
    }
    $content = Get-Content -LiteralPath $path -Raw -Encoding UTF8
    if ($content -match $Pattern) {
      throw "$Message in $path"
    }
  }
}

$skillPath = "claude-skills\self-review\SKILL.md"
$templatePath = "claude-skills\self-review\references\report-template.md"
$taskTemplatePath = "claude-task-prompt-template.md"
$claudePath = "CLAUDE.md"

Assert-FileExists $skillPath
Assert-FileExists $templatePath
Assert-FileExists $taskTemplatePath
Assert-FileExists $claudePath
Assert-FileExists "claude-reports\.gitkeep"

Assert-Contains $skillPath "^---\s*name:\s*self-review" "Self-review skill frontmatter is incomplete"
Assert-Contains $skillPath "at most two focused repair attempts" "Self-review skill must limit repair attempts to two"
Assert-Contains $skillPath "Always create one Markdown report" "Self-review skill must require a report on success and failure"
Assert-Contains $skillPath "FAILED_AFTER_TWO_REPAIRS" "Self-review skill must define failure status"
Assert-Contains $skillPath "UNVERIFIED_ENV_BLOCKED" "Self-review skill must define environment-blocked status"
Assert-Contains $skillPath "PARTIAL_NEEDS_CODEX_REVIEW" "Self-review skill must define partial status"

Assert-Contains $templatePath "## Status" "Report template is missing Status section"
Assert-Contains $templatePath "## Commands Run" "Report template is missing Commands Run section"
Assert-Contains $templatePath "## Repair Attempts" "Report template is missing Repair Attempts section"
Assert-Contains $templatePath "## Codex Review Checklist" "Report template is missing Codex review checklist"

Assert-Contains $claudePath "make at most two focused repair attempts" "CLAUDE.md must point Claude to two-attempt repair protocol"
Assert-Contains $claudePath "Always write one structured self-review report" "CLAUDE.md must require report output even on success"

Assert-Contains $taskTemplatePath "Always write one structured report" "Task template must require a structured report"
Assert-Contains $taskTemplatePath "make at most two focused repair attempts" "Task template must use the enhanced repair loop"

$promptFiles = Get-ChildItem -LiteralPath $ProjectRoot -Filter "claude-stage*.md" -File | ForEach-Object { $_.FullName }
Assert-NotContains $promptFiles "repair once" "Old one-repair language remains"
Assert-NotContains $promptFiles "one focused repair attempt" "Old one-repair language remains"

Write-Host "Claude self-review protocol verification passed." -ForegroundColor Green
