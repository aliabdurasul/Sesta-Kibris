<#
.SYNOPSIS
  Push Supabase env vars from frontend/.env to Vercel (Production + Preview) via REST API.

.DESCRIPTION
  This environment has no Vercel login. You run this locally with a personal token.

  1) Create token: https://vercel.com/account/tokens
  2) cd frontend; npx vercel link   (creates .vercel\project.json)
  3) $env:VERCEL_TOKEN = "..."   # optional: $env:VERCEL_TEAM_ID for team projects
  4) .\scripts\push-env-to-vercel.ps1

  Uses POST .../env?upsert=true so existing keys are updated (no manual delete).
#>
param(
  [string]$EnvFile = (Join-Path $PSScriptRoot "..\.env")
)

$ErrorActionPreference = "Stop"

if (-not $env:VERCEL_TOKEN) {
  Write-Error "Set environment variable VERCEL_TOKEN (Vercel Account > Settings > Tokens)."
}

$projectId = $env:VERCEL_PROJECT_ID
if (-not $projectId) {
  $projJson = Join-Path $PSScriptRoot "..\.vercel\project.json"
  if (Test-Path $projJson) {
    $j = Get-Content $projJson -Raw | ConvertFrom-Json
    $projectId = $j.projectId
  }
}
if (-not $projectId) {
  Write-Error "No project id. Run 'npx vercel link' in frontend/ or set VERCEL_PROJECT_ID to your project name or id."
}

$team = $env:VERCEL_TEAM_ID
$postUrl = "https://api.vercel.com/v10/projects/$([uri]::EscapeDataString($projectId))/env?upsert=true"
if ($team) { $postUrl += "&teamId=$([uri]::EscapeDataString($team))" }

$headers = @{
  Authorization = "Bearer $($env:VERCEL_TOKEN)"
  "Content-Type"  = "application/json"
}

if (-not (Test-Path $EnvFile)) {
  Write-Error "Env file not found: $EnvFile"
}

$vars = @{}
Get-Content $EnvFile | ForEach-Object {
  $line = $_.Trim()
  if (-not $line -or $line.StartsWith("#")) { return }
  $i = $line.IndexOf("=")
  if ($i -lt 1) { return }
  $k = $line.Substring(0, $i).Trim()
  $v = $line.Substring($i + 1).Trim()
  if ($k -match "^(NEXT_PUBLIC_SUPABASE_URL|NEXT_PUBLIC_SUPABASE_ANON_KEY|SUPABASE_SERVICE_ROLE_KEY)$") {
    $vars[$k] = $v
  }
}

if ($vars.Count -eq 0) {
  Write-Error "No matching keys in $EnvFile (expected NEXT_PUBLIC_SUPABASE_* and SUPABASE_SERVICE_ROLE_KEY)."
}

foreach ($key in $vars.Keys) {
  $body = @{
    key    = $key
    value  = $vars[$key]
    type   = "encrypted"
    target = @("production", "preview")
  } | ConvertTo-Json

  $resp = Invoke-RestMethod -Uri $postUrl -Headers $headers -Method Post -Body $body
  if ($resp.failed -and $resp.failed.Count -gt 0) {
    Write-Error "Vercel API failed for ${key}: $($resp.failed | ConvertTo-Json -Compress)"
  }
  Write-Host "Upserted: $key"
}

Write-Host ""
Write-Host "Done. Trigger a redeploy in the Vercel dashboard or run: npx vercel --prod"
