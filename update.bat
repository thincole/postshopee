@echo off
title Update Shopee Video Manager from GitHub
cd /d "%~dp0"
echo =======================================================
echo          SHOPEE VIDEO MANAGER - GITHUB UPDATER
echo =======================================================
echo.
echo Repo: https://github.com/thincole/postshopee
echo.
echo Dang kiem tra cap nhat qua Node.js...
node.exe -e "const u = require('./src/services/updater.service'); u.performUpdate().then(res => console.log('==>', res.message)).catch(err => console.error('==>', err.message));"
echo.
pause
