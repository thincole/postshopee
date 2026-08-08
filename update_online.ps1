[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
$ProgressPreference = 'SilentlyContinue'

$scriptDir = $PSScriptRoot
if (-not $scriptDir) { $scriptDir = $pwd }

Write-Host "=======================================================" -ForegroundColor Cyan
Write-Host "     TU DONG CAP NHAT PHAN MEM TU GITHUB" -ForegroundColor Cyan
Write-Host "     Phien Ban: V13.3 - Latest GitHub Release" -ForegroundColor Cyan
Write-Host "     Repository: https://github.com/thincole/postshopee" -ForegroundColor Cyan
Write-Host "=======================================================" -ForegroundColor Cyan
Write-Host ""

$tempDir = Join-Path $scriptDir 'temp_update_bat'
if (Test-Path $tempDir) {
    Remove-Item -Recurse -Force $tempDir
}
New-Item -ItemType Directory -Path $tempDir | Out-Null

$zipPath = Join-Path $tempDir 'update.zip'
$extractDir = Join-Path $tempDir 'extracted'

Write-Host "[1/4] Dang ket noi va tai ban cap nhat tu GitHub..." -ForegroundColor Yellow
$url = 'https://github.com/thincole/postshopee/archive/refs/heads/main.zip'
try {
    Invoke-WebRequest -Uri $url -OutFile $zipPath -UseBasicParsing
} catch {
    $url = 'https://github.com/thincole/postshopee/archive/refs/heads/master.zip'
    Invoke-WebRequest -Uri $url -OutFile $zipPath -UseBasicParsing
}

Write-Host "[2/4] Dang giai nen du lieu..." -ForegroundColor Yellow
Expand-Archive -LiteralPath $zipPath -DestinationPath $extractDir -Force

$root = Get-ChildItem -Path $extractDir | Where-Object { $_.PSIsContainer } | Select-Object -First 1
$sourcePath = if ($root) { $root.FullName } else { $extractDir }

Write-Host "[3/4] Dang ghi de ma nguon (Giu nguyen CSDL & .env)..." -ForegroundColor Yellow
$exclude = @(
    'node.exe',
    '.env',
    '.machine_id',
    'database.sqlite',
    'database.sqlite-shm',
    'database.sqlite-wal',
    'uploads',
    'node_modules',
    '.git',
    'temp_update_bat',
    'update_online.ps1',
    'update_online.bat'
)

Get-ChildItem -Path $sourcePath | ForEach-Object {
    if ($exclude -contains $_.Name -or $_.Name -like '*.rar' -or $_.Name -like '*.zip') {
        return
    }
    $dest = Join-Path $scriptDir $_.Name
    Copy-Item -Path $_.FullName -Destination $scriptDir -Recurse -Force
}

Write-Host "[4/4] Dang don dep bo nho tam..." -ForegroundColor Yellow
Remove-Item -Recurse -Force $tempDir

$commitFile = Join-Path $scriptDir '.current_commit'
Set-Content -Path $commitFile -Value 'v13.3-latest'

Write-Host ""
Write-Host "=======================================================" -ForegroundColor Green
Write-Host "   CAP NHAT HOAN TAT THANH CONG - PHIEN BAN V13.3" -ForegroundColor Green
Write-Host "   Vui long khoi dong lai phan mem qua file start.bat" -ForegroundColor Green
Write-Host "=======================================================" -ForegroundColor Green
Write-Host ""
