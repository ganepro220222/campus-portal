# 从运行中的后端导出 OpenAPI JSON（归档 / Apifox 导入）
# 用法（PowerShell）：
#   .\scripts\export-openapi.ps1
#   .\scripts\export-openapi.ps1 -BaseUrl http://localhost:8080

param(
    [string]$BaseUrl = "http://localhost:8080"
)

$ErrorActionPreference = "Stop"
$outDir = Join-Path $PSScriptRoot "..\docs\api\openapi"
New-Item -ItemType Directory -Force -Path $outDir | Out-Null

$files = @(
    @{ Name = "openapi.json"; Path = "/v3/api-docs" },
    @{ Name = "openapi-miniapp.json"; Path = "/v3/api-docs/miniapp" },
    @{ Name = "openapi-admin.json"; Path = "/v3/api-docs/admin" }
)

foreach ($f in $files) {
    $url = "$BaseUrl$($f.Path)"
    $dest = Join-Path $outDir $f.Name
    Write-Host "GET $url -> $dest"
    Invoke-WebRequest -Uri $url -UseBasicParsing -OutFile $dest
    $size = (Get-Item $dest).Length
    if ($size -lt 100) {
        throw "导出文件过小，可能后端未启动或路径错误: $($f.Name)"
    }
}

Write-Host "OpenAPI 导出完成: $outDir"
