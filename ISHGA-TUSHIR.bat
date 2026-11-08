@echo off
setlocal enabledelayedexpansion
title Sanat Hoca Turkce - ishga tushirish
cd /d "%~dp0"
set "LOG=%~dp0ishga-tushirish-logi.txt"
echo ===== %DATE% %TIME% ===== > "%LOG%"

echo.
echo   ==========================================
echo    SANAT HOCA TURKCE - lokal ishga tushirish
echo   ==========================================
echo.

rem ---------------------------------------------------------------
rem  0-qadam: fayl to'g'ri papkada turganini tekshirish
rem ---------------------------------------------------------------
if not exist "package.json" (
  echo.
  echo   XATO: bu fayl loyiha papkasida emas.
  echo.
  echo   ISHGA-TUSHIR.bat fayli package.json bilan BITTA papkada
  echo   turishi kerak. Zip faylni to'liq oching va ichkaridagi
  echo   ISHGA-TUSHIR.bat ni bosing.
  echo.
  goto :tugadi
)

rem ---------------------------------------------------------------
rem  1-qadam: Node.js bormi va yangimi?
rem  Chuqur ichma-ich IF bloklari batch'da ishonchsiz, shuning uchun
rem  bu yerda GOTO ishlatiladi.
rem ---------------------------------------------------------------
echo [1/6] Node.js tekshirilmoqda...
where node >nul 2>&1
if errorlevel 1 goto :node_yoq

set "NODEVER="
for /f "delims=" %%v in ('node -v 2^>nul') do set "NODEVER=%%v"
echo       Topildi: !NODEVER! >> "%LOG%"
if "!NODEVER!"=="" goto :node_ishlamadi

rem "v24.2.0" -> "24"
set "NODEMAJ=!NODEVER:v=!"
for /f "tokens=1 delims=." %%a in ("!NODEMAJ!") do set "NODEMAJ=%%a"
rem Raqam ekanini tekshiramiz: raqam bo'lmasa taqqoslash yolg'on natija beradi
set /a NODENUM=NODEMAJ 2>nul
if "!NODENUM!"=="" goto :node_ishlamadi
if !NODENUM! LSS 22 goto :node_eski
echo       Node.js !NODEVER! - yaxshi
goto :node_ok

:node_yoq
echo.
echo   XATO: Node.js topilmadi.
echo.
echo   1^) https://nodejs.org saytini oching
echo   2^) Katta yashil "LTS" tugmasini bosib yuklab oling
echo   3^) O'rnating ^(hamma joyda "Next" bosaverasiz^)
echo   4^) KOMPYUTERNI QAYTA ISHGA TUSHIRING - bu muhim, aks holda
echo      Windows Node.js ni hali ham ko'rmaydi
echo   5^) Shu faylni qaytadan bosing
echo.
goto :tugadi

:node_eski
echo.
echo   XATO: Node.js juda eski. Hozirgi: !NODEVER!, kerak: 22 yoki yangiroq.
echo.
echo   https://nodejs.org dan "LTS" ni o'rnating ^(eskisini o'chirish shart emas^),
echo   keyin kompyuterni qayta ishga tushiring.
echo.
goto :tugadi

:node_ishlamadi
echo.
echo   XATO: Node.js bor, lekin javob bermadi.
echo   "node -v" buyrug'i quyidagini qaytardi: [!NODEVER!]
echo.
echo   Node.js ni qaytadan o'rnatib ko'ring.
echo.
goto :tugadi

:node_ok

rem ---------------------------------------------------------------
rem  2-qadam: pnpm
rem  Uch yo'l ketma-ket sinaladi. Oxirgisi - npx - administrator
rem  huquqisiz ham ishlaydi, shuning uchun zaxira sifatida turibdi.
rem ---------------------------------------------------------------
echo [2/6] pnpm tekshirilmoqda...
set "COREPACK_ENABLE_DOWNLOAD_PROMPT=0"
set "PNPM=pnpm"

where pnpm >nul 2>&1
if not errorlevel 1 goto :pnpm_ok

echo       pnpm topilmadi. 1-usul: corepack...
call corepack enable pnpm >> "%LOG%" 2>&1
where pnpm >nul 2>&1
if not errorlevel 1 goto :pnpm_ok

echo       2-usul: npm orqali o'rnatish...
call npm install -g pnpm >> "%LOG%" 2>&1
where pnpm >nul 2>&1
if not errorlevel 1 goto :pnpm_ok

echo       3-usul: npx orqali ishlatish ^(o'rnatish shart emas^)...
where npx >nul 2>&1
if errorlevel 1 goto :pnpm_yoq
call npx --yes pnpm@12.11.2 --version >> "%LOG%" 2>&1
if errorlevel 1 goto :pnpm_yoq
set "PNPM=npx --yes pnpm@12.11.2"
echo       npx orqali ishlatiladi ^(biroz sekinroq, lekin ishlaydi^)
goto :pnpm_ok

:pnpm_yoq
echo.
echo   XATO: pnpm ni hech qanday yo'l bilan ishga tushirib bo'lmadi.
echo.
echo   Qo'lda urinib ko'ring - Start menyusida "cmd" yozib oching va:
echo       npm install -g pnpm
echo.
echo   Agar "Access denied" chiqsa: cmd ni o'ng tugma bilan bosib,
echo   "Run as administrator" tanlang.
echo.
echo   Batafsil: %LOG%
echo.
goto :tugadi

:pnpm_ok
echo       pnpm tayyor

rem ---------------------------------------------------------------
rem  3-qadam: portlar bo'shmi?
rem ---------------------------------------------------------------
echo [3/6] 3000 va 4000 portlari tekshirilmoqda...
set "P_PORT=4000"
call :portbosh
if errorlevel 1 (
  echo.
  echo   XATO: 4000 port band. Loyiha allaqachon ishlayotgan bo'lishi mumkin.
  echo   Ochiq qora oynalarni yoping va shu faylni qaytadan bosing.
  echo.
  goto :tugadi
)
set "P_PORT=3000"
call :portbosh
if errorlevel 1 (
  echo.
  echo   XATO: 3000 port band. Ochiq qora oynalarni yoping va
  echo   shu faylni qaytadan bosing.
  echo.
  goto :tugadi
)
echo       Ikkala port ham bo'sh

rem ---------------------------------------------------------------
rem  4-qadam: paketlar
rem ---------------------------------------------------------------
echo [4/6] Paketlar o'rnatilmoqda ^(birinchi safar bir necha daqiqa olishi mumkin^)...
call !PNPM! install
if errorlevel 1 (
  if not exist "node_modules" (
    echo.
    echo   XATO: paketlarni o'rnatib bo'lmadi. Internetni tekshiring.
    echo.
    goto :tugadi
  )
  echo       Ogohlantirish: yangilab bo'lmadi, mavjud paketlar bilan davom etamiz.
)

rem ---------------------------------------------------------------
rem  5-qadam: sozlash
rem ---------------------------------------------------------------
echo [5/6] Loyiha sozlanmoqda...
if not exist "apps\web\.env.local" (
  copy /y "apps\web\.env.example" "apps\web\.env.local" >nul
  echo       apps\web\.env.local yaratildi
)
call !PNPM! --filter @sanat/api exec prisma generate >> "%LOG%" 2>&1
if errorlevel 1 (
  echo.
  echo   XATO: Prisma tiplarini yaratib bo'lmadi.
  echo   Sabab quyida ^(to'liq matn: ishga-tushirish-logi.txt^):
  echo   ----------------------------------------------------
  type "%LOG%"
  echo   ----------------------------------------------------
  echo   Odatda sabab: internet yo'q yoki proksi Prisma fayllarini bloklagan.
  echo.
  goto :tugadi
)
echo       Prisma tayyor

rem ---------------------------------------------------------------
rem  6-qadam: ikkala serverni ishga tushirish
rem ---------------------------------------------------------------
echo [6/6] Serverlar ishga tushirilmoqda...
echo.

start "Sanat BACKEND - bu oynani yopmang" /D "%~dp0." cmd /k !PNPM! demo

echo       Backend kutilmoqda ^(http://localhost:4000^)...
set "W_URL=http://localhost:4000/health"
set "W_TRIES=90"
call :kutish
if errorlevel 1 (
  echo.
  echo   XATO: backend ishga tushmadi ^(60 soniya kutildi^).
  echo   "Sanat BACKEND" nomli oynadagi qizil xato matnini o'qing
  echo   va menga yuboring. U oyna ochiq turibdi.
  echo.
  goto :tugadi
)
echo       Backend tayyor

start "Sanat SAYT - bu oynani yopmang" /D "%~dp0." cmd /k !PNPM! dev:web

echo       Sayt kutilmoqda ^(http://localhost:3000^)...
set "W_URL=http://localhost:3000/"
set "W_TRIES=120"
call :kutish
if errorlevel 1 (
  echo.
  echo   XATO: sayt ishga tushmadi ^(2 daqiqa kutildi^).
  echo   "Sanat SAYT" nomli oynadagi qizil xato matnini o'qing
  echo   va menga yuboring. U oyna ochiq turibdi.
  echo.
  goto :tugadi
)

echo.
echo   ==========================================
echo    TAYYOR.  Brauzer ochilmoqda...
echo   ==========================================
echo.
echo    Manzil:  http://localhost:3000
echo.
echo    DIQQAT: 127.0.0.1 EMAS, aynan localhost bo'lsin.
echo    Aks holda kirish ishlamaydi.
echo.
echo    Admin:   admin@demo.uz
echo    Parol:   demo-parol-sakkiz-kuz
echo    ^(admin uchun 2FA majburiy: Google Authenticator kerak.
echo     Yoki "Ro'yxatdan o'tish" orqali o'quvchi hisobi oching -
echo     unga 2FA shart emas.^)
echo.
echo    Ma'lumotlar faqat xotirada turadi. Oynalarni yopsangiz
echo    hammasi o'chadi. Haqiqiy baza uchun: README.md, 2-bo'lim.
echo.
echo    To'xtatish: ochilgan ikkita qora oynani yoping.
echo.

timeout /t 2 /nobreak >nul
start "" "http://localhost:3000"

echo   Shu oynani yopsangiz bo'ladi.
echo.
pause
exit /b 0


rem ===============================================================
rem  Yordamchi: port bo'shmi? (P_PORT)  0 = bo'sh, 1 = band
rem ===============================================================
:portbosh
node -e "var n=require('net');var s=n.createServer();s.once('error',function(){process.exit(1);});s.once('listening',function(){s.close(function(){process.exit(0);});});s.listen(Number(process.env.P_PORT),'127.0.0.1');"
exit /b %errorlevel%

rem ===============================================================
rem  Yordamchi: manzil javob berguncha kutish (W_URL, W_TRIES)
rem ===============================================================
:kutish
node -e "var h=require('http');var u=process.env.W_URL;var m=Number(process.env.W_TRIES);var n=0;var t=setInterval(function(){var q=h.get(u,function(r){r.resume();clearInterval(t);process.exit(0);});q.on('error',function(){n=n+1;if(n===m){clearInterval(t);process.exit(1);}});},1000);"
exit /b %errorlevel%

:tugadi
echo.
echo   Batafsil ma'lumot shu faylda: %LOG%
echo   Shu faylni menga yuborsangiz, muammoni aniq topaman.
echo.
pause
exit /b 1
