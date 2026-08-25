# Release Windows TCP excluded ranges blocking workbench port (run as Admin)
param([int]$Port = 8888)
$ErrorActionPreference = 'SilentlyContinue'
[Console]::OutputEncoding = [Text.UTF8Encoding]::new($false)

function Test-PortBind([int]$P) {
    try {
        $l = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Loopback, $P)
        $l.Start()
        $l.Stop()
        return $true
    } catch {
        return $false
    }
}

function Show-Ranges([string]$Label) {
    Write-Host ""
    Write-Host "=== $Label ==="
    netsh interface ipv4 show excludedportrange protocol=tcp
}

Show-Ranges "BEFORE stop winnat/hns"

Write-Host ""
Write-Host "[1] Stopping winnat, hns, SharedAccess ..."
foreach ($svc in @('winnat', 'hns', 'SharedAccess')) {
    Write-Host "    stop $svc"
    net stop $svc 2>$null | Out-Null
}
Start-Sleep -Seconds 2

Show-Ranges "AFTER stop"

if (Test-PortBind $Port) {
    Write-Host ""
    Write-Host "[OK] Port $Port can bind."
    $ans = Read-Host "Restart winnat? WSL/Docker need it. Y=restart, N=keep stopped [Y/n]"
    if ($ans -match '^[Nn]') {
        Write-Host "winnat stays stopped. Now run: open workbench bat ($Port)."
        exit 0
    }
    net start winnat 2>$null | Out-Null
    net start hns 2>$null | Out-Null
    Write-Host "winnat/hns restarted."
    exit 0
}

Write-Host ""
Write-Host "[2] Port $Port still blocked - try delete excluded range ..."
$out = netsh interface ipv4 show excludedportrange protocol=tcp | Out-String
$rows = [regex]::Matches($out, '(?m)^\s*(\d+)\s+(\d+)\s*$')
foreach ($m in $rows) {
    $s = [int]$m.Groups[1].Value
    $e = [int]$m.Groups[2].Value
    if ($s -le $Port -and $e -ge $Port) {
        $n = $e - $s + 1
        Write-Host "    delete startport=$s numberofports=$n"
        netsh interface ipv4 delete excludedportrange protocol=tcp startport=$s numberofports=$n 2>&1
    }
}
Start-Sleep -Seconds 1

if (Test-PortBind $Port) {
    Write-Host "[OK] Port $Port can bind after delete."
    exit 0
}

Write-Host "[FAIL] Port $Port still cannot bind."
Write-Host "Check: netsh interface ipv4 show excludedportrange protocol=tcp"
exit 1
