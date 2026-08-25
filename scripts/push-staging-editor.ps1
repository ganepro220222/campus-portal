# 从本机 Windows 推送编辑器到 staging ECS（不经过 GitHub）
# 用法（PowerShell，在 D:\shuyuan 下）：
#   .\scripts\push-staging-editor.ps1
#   .\scripts\push-staging-editor.ps1 -Host 47.109.0.192 -User root

param(
    [string]$Server = '47.109.0.192',
    [string]$User = 'root',
    [string]$RemoteRoot = '/opt/shuyuan/exhibits'
)

$ErrorActionPreference = 'Stop'
$Repo = Split-Path $PSScriptRoot -Parent
$Pack = Join-Path $Repo 'exhibits\_staging-editor-pack'
$Player = Join-Path $Repo 'exhibits\player.html'
$Studio = Join-Path $Repo 'exhibits\studio.html'

if (-not (Test-Path $Player)) { throw "missing $Player" }
if (-not (Test-Path $Studio)) { throw "missing $Studio" }

New-Item -ItemType Directory -Force -Path $Pack | Out-Null
Copy-Item $Player "$Pack\player.html" -Force
Copy-Item $Studio "$Pack\studio.html" -Force
$p = Get-Content "$Pack\player.html" -Raw
if ($p -notmatch '__SAVE_API__') {
    $p = $p -replace '</head>', "<script>window.__SAVE_API__=`"/studio-api/save`"</script>`n</head>"
    Set-Content -Path "$Pack\player.html" -Value $p -NoNewline
}

$dest = "${User}@${Server}:${RemoteRoot}/"
Write-Host "Upload -> $dest"
scp "$Pack\player.html" "$Pack\studio.html" $dest
if ($LASTEXITCODE -ne 0) { throw "scp failed (exit $LASTEXITCODE)" }

Write-Host "Remote apply..."
ssh "${User}@${Server}" "bash /opt/shuyuan/scripts/apply-staging-editor.sh"
Write-Host "Done. Open http://${Server}/exhibits/studio.html"
