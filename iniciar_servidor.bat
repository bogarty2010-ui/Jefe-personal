@echo off
title CECYTEM Ecatepec II - Grupo 101
where py >nul 2>nul
if %errorlevel%==0 (
  py -m http.server 8080
  goto :eof
)
where python >nul 2>nul
if %errorlevel%==0 (
  python -m http.server 8080
  goto :eof
)
echo No se encontro Python.
echo Abre index.html directamente si solo necesitas consultar el portal.
pause
