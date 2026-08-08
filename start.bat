@echo off
cd /d "%~dp0"
if not exist .env copy .env.example .env
echo Starting Shopee Local Uploader...
node.exe src\start.js
pause
