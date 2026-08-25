# 从本机 Windows 推送编辑器到 staging ECS（不经过 GitHub）
# 用法（PowerShell，在 D:\shuyuan 下）：
#   .\scripts\push-staging-editor.ps1
#   .\scripts\push-staging-editor.ps1 -Server 47.109.0.192 -User root

param(
    [string]$Server = '47.109.0.192',
    [string]$User = 'root',
    [string]$RemoteRoot = '/opt/shuyuan/exhibits'
)

$ErrorActionPreference = 'Stop'
$Repo = Split-Path $PSScriptRoot -Parent
$Exhibits = Join-Path $Repo 'exhibits'
$Pack = Join-Path $Repo 'exhibits\_staging-editor-pack'

function Test-SaveApiAssigned([string]$Path) {
    return [bool](Select-String -Path $Path -Pattern 'window\.__SAVE_API__\s*=' -Quiet) `
        -or [bool](Select-String -Path $Path -Pattern 'STUDIO-SAVE-ENDPOINT' -Quiet)
}

function Inject-SaveApi([string]$Path) {
    $p = Get-Content $Path -Raw
    if (-not (Test-SaveApiAssigned $Path)) {
        $p = $p -replace '</head>', '<!-- STUDIO-SAVE-ENDPOINT --><script>window.__SAVE_API__="/studio-api/save"</script>`n</head>'
        Set-Content -Path $Path -Value $p -NoNewline
    }
}

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
Inject-SaveApi $packedPlayer

Write-Host "Pack $($relPaths.Count) paths -> $Pack"

$dest = "${User}@${Server}:${RemoteRoot}/"
Write-Host "Upload -> $dest"
scp -r "$Pack\*" $dest
if ($LASTEXITCODE -ne 0) { throw "scp failed (exit $LASTEXITCODE)" }

Write-Host "Remote apply..."
ssh "${User}@${Server}" "bash /opt/shuyuan/scripts/apply-staging-editor.sh"
if ($LASTEXITCODE -ne 0) { throw "remote apply failed (exit $LASTEXITCODE)" }
Write-Host "Done. Open http://${Server}/exhibits/studio.html"
