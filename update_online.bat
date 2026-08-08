@echo off
chcp 65001 > nul
title Cap Nhat Shopee Video Manager Tu GitHub
cd /d "%~dp0"

echo =======================================================
echo     TU DONG CAP NHAT PHAN MEM TU GITHUB
echo     Repository: https://github.com/thincole/postshopee
echo =======================================================
echo.

echo [1/4] Dang ket noi va tai ban cap nhat tu GitHub...

powershell -NoProfile -ExecutionPolicy Bypass -Command "$ProgressPreference='SilentlyContinue'; $t=Join-Path $pwd 'temp_update_bat'; if(Test-Path $t){Remove-Item -Recurse -Force $t}; New-Item -ItemType Directory -Path $t|Out-Null; $z=Join-Path $t 'update.zip'; $e=Join-Path $t 'extracted'; $url='https://github.com/thincole/postshopee/archive/refs/heads/main.zip'; try{Invoke-WebRequest -Uri $url -OutFile $z -UseBasicParsing}catch{$url='https://github.com/thincole/postshopee/archive/refs/heads/master.zip'; Invoke-WebRequest -Uri $url -OutFile $z -UseBasicParsing}; Write-Host '[2/4] Dang giai nen du lieu...'; Expand-Archive -LiteralPath $z -DestinationPath $e -Force; $root=Get-ChildItem -Path $e | Where-Object {$_.PSIsContainer} | Select-Object -First 1; $src=if($root){$root.FullName}else{$e}; Write-Host '[3/4] Dang ghi de ma nguon (Giu nguyen CSDL & .env)...'; $ex=@('node.exe','.env','.machine_id','database.sqlite','database.sqlite-shm','database.sqlite-wal','uploads','node_modules','.git','temp_update_bat'); Get-ChildItem -Path $src | ForEach-Object { if($ex -contains $_.Name -or $_.Name -like '*.rar' -or $_.Name -like '*.zip'){return}; $dest=Join-Path $pwd $_.Name; if($_.PSIsContainer){Copy-Item -Path $_.FullName -Destination $pwd -Recurse -Force}else{Copy-Item -Path $_.FullName -Destination $dest -Force} }; Write-Host '[4/4] Dang don dep bo nho tam...'; Remove-Item -Recurse -Force $t"

if %errorlevel% equ 0 goto :SUCCESS
goto :ERROR

:SUCCESS
echo.
echo =======================================================
echo    CAP NHAT HOAN TAT THANH CONG!
echo    Vui long khoi dong lai phan mem qua file start.bat
echo =======================================================
goto :END

:ERROR
echo.
echo =======================================================
echo    [!] CAP NHAT THAT BAI!
echo    Vui long kiem tra lai ket noi Internet va thu lai.
echo =======================================================
goto :END

:END
echo.
pause
