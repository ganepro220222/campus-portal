# Deploy admin/dist to staging ECS (keeps assets/ subdirectory).
# Usage:
#   powershell -File scripts/deploy-admin-staging.ps1

param(
  [string]$ServerHost = '47.109.0.192',
  [string]$User = 'root',
  [string]$RemoteDir = '/opt/shuyuan/admin/dist'
)

$ErrorActionPreference = 'Stop'
$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$Admin = Join-Path $Root 'admin'
$Dist = Join-Path $Admin 'dist'

Push-Location $Admin
try {
  if (-not (Test-Path 'node_modules')) {
    npm ci
  }
  npm run build
} finally {
  Pop-Location
}

$indexHtml = Join-Path $Dist 'index.html'
if (-not (Test-Path $indexHtml)) {
  throw 'build failed: admin/dist/index.html missing'
}

$Target = '{0}@{1}:{2}/' -f $User, $ServerHost, $RemoteDir
Write-Host ('=== upload admin/dist -> ' + $Target + ' ===')
Write-Host 'Use dist/. so assets/ subdirectory is preserved.'

& ssh ($User + '@' + $ServerHost) ('mkdir -p ' + $RemoteDir)
& scp -r (Join-Path $Dist '.') $Target

Write-Host ''
Write-Host ('Done. Open http://{0}/admin/' -f $ServerHost)
Write-Host 'Hard-refresh (Ctrl+F5) if the page is blank.'
