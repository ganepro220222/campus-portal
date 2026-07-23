# Install embeddable Python into exhibits/_runtime/python
$ErrorActionPreference = 'Stop'
$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$PyVer = '3.12.9'
$ZipName = "python-$PyVer-embed-amd64.zip"
$Url = "https://www.python.org/ftp/python/$PyVer/$ZipName"
$Runtime = Join-Path $Root '_runtime'
$PyDir = Join-Path $Runtime 'python'
$PyExe = Join-Path $PyDir 'python.exe'
$TmpZip = Join-Path $env:TEMP "exhibits-$ZipName"

Write-Host ''
Write-Host '============================================'
Write-Host "  Portable Python $PyVer"
Write-Host '============================================'
Write-Host ''

if (Test-Path $PyExe) {
    Write-Host "[OK] Already installed: $PyExe"
    & $PyExe --version
    Write-Host ''
    Write-Host 'Skip install. Delete _runtime\python to reinstall.'
    exit 0
}

New-Item -ItemType Directory -Force -Path $Runtime | Out-Null
Write-Host 'Downloading...'
Write-Host $Url
Invoke-WebRequest -Uri $Url -OutFile $TmpZip -UseBasicParsing

Write-Host "Extracting to $PyDir ..."
if (Test-Path $PyDir) { Remove-Item -Recurse -Force $PyDir }
New-Item -ItemType Directory -Force -Path $PyDir | Out-Null
Expand-Archive -LiteralPath $TmpZip -DestinationPath $PyDir -Force
Remove-Item -Force $TmpZip -ErrorAction SilentlyContinue

if (-not (Test-Path $PyExe)) {
    Write-Host '[ERROR] python.exe not found after extract' -ForegroundColor Red
    exit 1
}

Write-Host '[OK] Done:'
& $PyExe --version
Write-Host ''
Write-Host 'You can now run: open studio bat, or copy whole exhibits folder to other PCs.'
exit 0
