@echo off
setlocal
title Tekshiruv - Sanat Hoca Turkce
cd /d "%~dp0"
set "LOG=%~dp0tekshiruv.txt"

echo ===================================================== > "%LOG%"
echo  TEKSHIRUV  %DATE% %TIME%                            >> "%LOG%"
echo ===================================================== >> "%LOG%"
echo.
echo   Kompyuteringiz tekshirilmoqda. Bir necha soniya...
echo.

echo --- Papka --- >> "%LOG%"
echo %~dp0 >> "%LOG%"
if exist "package.json" (echo package.json: BOR >> "%LOG%") else (echo package.json: YO'Q - fayl notogri papkada >> "%LOG%")
if exist "apps\api\package.json" (echo apps\api: BOR >> "%LOG%") else (echo apps\api: YO'Q >> "%LOG%")
if exist "node_modules" (echo node_modules: BOR >> "%LOG%") else (echo node_modules: yo'q - hali o'rnatilmagan >> "%LOG%")

echo. >> "%LOG%"
echo --- Node.js --- >> "%LOG%"
where node >> "%LOG%" 2>&1
node -v >> "%LOG%" 2>&1

echo. >> "%LOG%"
echo --- pnpm --- >> "%LOG%"
where pnpm >> "%LOG%" 2>&1
call pnpm -v >> "%LOG%" 2>&1

echo. >> "%LOG%"
echo --- corepack --- >> "%LOG%"
where corepack >> "%LOG%" 2>&1

echo. >> "%LOG%"
echo --- Portlar (3000 va 4000 band bo'lsa yozuv chiqadi) --- >> "%LOG%"
netstat -ano -p tcp >> "%LOG%" 2>&1

echo. >> "%LOG%"
echo --- Internet (Prisma uchun kerak) --- >> "%LOG%"
curl -s -o nul -w "registry.npmjs.org: %%{http_code}" https://registry.npmjs.org/ >> "%LOG%" 2>&1
echo. >> "%LOG%"
curl -s -o nul -w "binaries.prisma.sh: %%{http_code}" https://binaries.prisma.sh/ >> "%LOG%" 2>&1
echo. >> "%LOG%"

echo ===================================================== >> "%LOG%"
echo.
echo   Tayyor. Natija shu faylda:
echo   %LOG%
echo.
echo   Shu faylni ochib, matnini menga yuboring.
echo.
start "" notepad "%LOG%"
pause
