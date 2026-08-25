# Deploy admin/dist to staging ECS (keeps assets/ subdirectory).
# Usage:
#   powershell -File scripts/deploy-admin-staging.ps1

param(
  [string]$ServerHost = '47.109.0.192',
  [string]$User = 'root',
  [string]$RemoteDir = '/opt/shuyuan/admin/dist'
)

$ErrorActionPreference = 'Stop'

function Assert-LastExitCode {
  param([string]$Step)
  if ($LASTEXITCODE -ne 0) {
    throw ($Step + ' failed with exit code ' + $LASTEXITCODE)
  }
}

function Quote-BashSingle {
  param([string]$Value)
  return "'" + ($Value -replace "'", "'\\''") + "'"
}

function Assert-AdminDistAssets {
  param([string]$DistRoot)
  $indexHtml = Join-Path $DistRoot 'index.html'
  $content = Get-Content -LiteralPath $indexHtml -Raw -Encoding UTF8
  $assetMatches = [regex]::Matches($content, '/admin/assets/[^"''\s>]+')
  foreach ($m in $assetMatches) {
    $rel = $m.Value.Substring('/admin/'.Length) -replace '/', [IO.Path]::DirectorySeparatorChar
    $path = Join-Path $DistRoot $rel
    if (-not (Test-Path -LiteralPath $path)) {
      throw ('missing built asset referenced by index.html: ' + $path)
    }
  }
}

$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$Admin = Join-Path $Root 'admin'
$Dist = Join-Path $Admin 'dist'

if (Test-Path -LiteralPath $Dist) {
  Remove-Item -LiteralPath $Dist -Recurse -Force
}

Push-Location $Admin
try {
  if (-not (Test-Path 'node_modules')) {
    npm ci
    Assert-LastExitCode 'npm ci'
  }
  npm run build
  Assert-LastExitCode 'npm run build'
} finally {
  Pop-Location
}

$indexHtml = Join-Path $Dist 'index.html'
if (-not (Test-Path -LiteralPath $indexHtml)) {
  throw 'build failed: admin/dist/index.html missing'
}

Assert-AdminDistAssets -DistRoot $Dist

$RemoteStaging = "${RemoteDir}.staging"
$RemoteOld = "${RemoteDir}.old"
$qDir = Quote-BashSingle $RemoteDir
$qStaging = Quote-BashSingle $RemoteStaging
$qOld = Quote-BashSingle $RemoteOld
$SshTarget = $User + '@' + $ServerHost
$TargetStaging = '{0}@{1}:{2}/' -f $User, $ServerHost, $RemoteStaging

Write-Host ('=== upload admin/dist -> ' + $TargetStaging + ' ===')

$mkdirCmd = 'set -e; mkdir -p ' + $qStaging + '; rm -rf ' + $qStaging + '/*'
& ssh $SshTarget $mkdirCmd
Assert-LastExitCode 'ssh mkdir staging'

& scp -r (Join-Path $Dist '.') $TargetStaging
Assert-LastExitCode 'scp upload'

$swapCmd = 'set -e; test -f ' + $qStaging + '/index.html; rm -rf ' + $qOld + '; if [ -d ' + $qDir + ' ]; then mv ' + $qDir + ' ' + $qOld + '; fi; if ! mv ' + $qStaging + ' ' + $qDir + '; then if [ -d ' + $qOld + ' ]; then mv ' + $qOld + ' ' + $qDir + '; fi; exit 1; fi; rm -rf ' + $qOld
& ssh $SshTarget $swapCmd
Assert-LastExitCode 'ssh swap dist'

Write-Host ''
Write-Host ('Done. Open http://{0}/admin/' -f $ServerHost)
Write-Host 'Hard-refresh (Ctrl+F5) if the page is blank.'
