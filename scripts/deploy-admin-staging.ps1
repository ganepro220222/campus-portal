# 将 admin/dist 完整同步到 staging ECS（保留 assets 子目录结构）
# 用法（在仓库根目录）：
#   powershell -File scripts/deploy-admin-staging.ps1
#   powershell -File scripts/deploy-admin-staging.ps1 -Host 47.109.0.192 -User root

param(
  [string]$Host = '47.109.0.192',
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

if (-not (Test-Path (Join-Path $Dist 'index.html'))) {
  throw "build 失败：缺少 admin/dist/index.html"
}

$Target = "${User}@${Host}:${RemoteDir}/"
Write-Host "=== 上传 admin/dist -> $Target ==="
Write-Host "（使用 dist/. 保留 assets/ 目录，勿用 dist/*）"

& ssh "${User}@${Host}" "mkdir -p '$RemoteDir'"
& scp -r (Join-Path $Dist '.') $Target

Write-Host ""
Write-Host "完成。请访问: http://${Host}/admin/"
Write-Host "若仍白屏，在 ECS 上执行:"
Write-Host "  curl -sI http://127.0.0.1/admin/assets/ | head -3"
Write-Host "  grep -o 'src=\"[^\"]*\"' $RemoteDir/index.html | head -3"
