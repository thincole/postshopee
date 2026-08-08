@echo off
chcp 65001 > nul
title Day Code Len GitHub - thincole/postshopee
cd /d "%~dp0"

echo =======================================================
echo          TU DONG DAY CODE LEN GITHUB
echo          Repository: https://github.com/thincole/postshopee
echo =======================================================
echo.

:: 1. Kiem tra va thiet lap Git Author Identity neu chua co
git config user.name >nul 2>&1
if %errorlevel% neq 0 (
    git config user.name "thincole"
)
git config user.email >nul 2>&1
if %errorlevel% neq 0 (
    git config user.email "thincole@github.com"
)

:: 2. Kiem tra Git repo
if exist ".git" goto :GIT_EXISTS

echo [1/4] Chua khoi tao Git repo. Dang khoi tao...
git init
git branch -M main
git remote add origin https://github.com/thincole/postshopee.git
goto :CHECK_MSG

:GIT_EXISTS
echo [1/4] Da tim thay Git repo. Cap nhat remote origin...
git remote set-url origin https://github.com/thincole/postshopee.git 2>nul || git remote add origin https://github.com/thincole/postshopee.git
git branch -M main 2>nul

:CHECK_MSG
echo.
for /f "tokens=*" %%a in ('powershell -NoProfile -Command "Get-Date -Format 'yyyyMMdd-HHmm'"') do set "TS=%%a"
set "BUILD_VER=V13.3-%TS%"

set "USER_MSG="
set /p USER_MSG="[2/4] Nhap ghi chu commit (An Enter de dung mac dinh): "

if defined USER_MSG (
    set "COMMIT_MSG=[%BUILD_VER%] %USER_MSG%"
) else (
    set "COMMIT_MSG=Cap nhat code %BUILD_VER%"
)

echo.
echo [3/4] Dang gom file va tao Commit...
git add .
git commit -m "%COMMIT_MSG%"

echo.
echo [4/4] Dang push code len GitHub (Nhanh main)...
git push -u origin main

if %errorlevel% equ 0 goto :PUSH_SUCCESS
goto :PUSH_ERROR

:PUSH_SUCCESS
echo.
echo =======================================================
echo    DAY CODE PHIEN BAN MOI LEN GITHUB THANH CONG!
echo    Version: %COMMIT_MSG%
echo    URL: https://github.com/thincole/postshopee
echo =======================================================
goto :END

:PUSH_ERROR
echo.
echo =======================================================
echo    [!] DAY CODE THAT BAI!
echo    Vui long kiem tra:
echo    1. Ket noi Internet
echo    2. Quyen truy cap push tren GitHub thincole/postshopee
echo =======================================================
goto :END

:END
echo.
pause
