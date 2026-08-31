# 从本机 Windows 推送编辑器到 staging ECS（不经过 GitHub）
# 用法（PowerShell，在 D:\shuyuan 下）：
#   .\scripts\push-staging-editor.ps1
#   .\scripts\push-staging-editor.ps1 -Server 47.109.0.192 -User root

param(
    [string]$Server = '47.109.0.192',
    [string]$User = 'root',
    [string]$RemoteRoot = '/opt/shuyuan/exhibits',
    [string]$RemoteRepo = '/opt/shuyuan',
    [string]$StudioPrefix = '/studio'
)

$ErrorActionPreference = 'Stop'
$Repo = Split-Path $PSScriptRoot -Parent
$Exhibits = Join-Path $Repo 'exhibits'
$Pack = Join-Path $Repo 'exhibits\_staging-editor-pack'

function Test-SaveApiAssigned([string]$Path) {
    return [bool](Select-String -Path $Path -Pattern 'window\.__SAVE_API__\s*=' -Quiet) `
        -or [bool](Select-String -Path $Path -Pattern 'STUDIO-SAVE-ENDPOINT' -Quiet)
}

# player.html 由 ECS 上 studio-server 在响应时注入 __SAVE_API__，打包阶段勿改文件（避免 PowerShell 编码/换行破坏 HTML）

$listScript = Join-Path $Repo 'scripts\collect-staging-editor-files.mjs'
if (-not (Test-Path $listScript)) { throw "missing $listScript" }

$relPaths = @(node $listScript | ForEach-Object { $_.Trim() } | Where-Object { $_ })
if ($relPaths.Count -eq 0) { throw 'collect-staging-editor-files.mjs returned no paths' }

if (Test-Path $Pack) { Remove-Item $Pack -Recurse -Force }
New-Item -ItemType Directory -Force -Path $Pack | Out-Null

foreach ($rel in $relPaths) {
    $src = Join-Path $Exhibits $rel
    $dest = Join-Path $Pack $rel
    if (-not (Test-Path $src)) {
        Write-Warning "skip missing $rel"
        continue
    }
    if (Test-Path $src -PathType Container) {
        Copy-Item $src $dest -Recurse -Force
    } else {
        $destDir = Split-Path $dest -Parent
        if ($destDir) { New-Item -ItemType Directory -Force -Path $destDir | Out-Null }
        Copy-Item $src $dest -Force
    }
}

$packedPlayer = Join-Path $Pack 'player.html'
if (-not (Test-Path $packedPlayer)) { throw 'pack missing player.html' }
$packedText = [System.IO.File]::ReadAllText($packedPlayer)
if ($packedText -match '`n') {
    throw 'pack player.html contains corrupted literal `n (re-copy from git source)'
}
if (Test-SaveApiAssigned $packedPlayer) {
    Write-Warning 'pack player.html already has SAVE_API marker (should be clean source); studio-server will inject at serve time'
}

Write-Host "Pack $($relPaths.Count) paths -> $Pack"

$scriptFiles = @(
    'apply-staging-editor.sh',
    'staging-save-api.sh',
    'collect-staging-editor-files.mjs'
)
Write-Host "Upload scripts -> ${User}@${Server}:${RemoteRepo}/scripts/"
foreach ($name in $scriptFiles) {
    $local = Join-Path $Repo "scripts\$name"
    if (-not (Test-Path $local)) { throw "missing $local" }
    scp $local "${User}@${Server}:${RemoteRepo}/scripts/"
    if ($LASTEXITCODE -ne 0) { throw "scp scripts failed for $name (exit $LASTEXITCODE)" }
}

$dest = "${User}@${Server}:${RemoteRoot}/"
Write-Host "Upload -> $dest"
scp -r "$Pack\*" $dest
if ($LASTEXITCODE -ne 0) { throw "scp failed (exit $LASTEXITCODE)" }

Write-Host "Remote apply..."
ssh "${User}@${Server}" "set -a; [ -f /etc/shuyuan/studio.env ] && . /etc/shuyuan/studio.env; set +a; bash ${RemoteRepo}/scripts/apply-staging-editor.sh"
if ($LASTEXITCODE -ne 0) { throw "remote apply failed (exit $LASTEXITCODE)" }
Write-Host "Done. Open http://${Server}${StudioPrefix}/studio.html"
