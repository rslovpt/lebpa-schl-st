@echo off
title Task Server Runner
setlocal EnableDelayedExpansion

echo Starting backend server...
:: Start backend.py in a new terminal window
start "" cmd /k "python .\Server\backend.py"

echo Waiting 5 seconds for server to start...
timeout /t 5 /nobreak >nul

echo Starting ngrok tunnel...
:: Replace PATH_TO_NGROK if ngrok.exe is not in PATH
start "" cmd /k "ngrok http 5000"

echo Waiting 5 seconds for ngrok to start...
timeout /t 5 /nobreak >nul

:: Fetch public ngrok URL
for /f "delims=" %%a in ('curl --silent http://127.0.0.1:4040/api/tunnels') do set "json=%%a"

:: Extract the first public_url
for /f "tokens=2 delims=:" %%b in ('echo !json! ^| findstr /i "public_url"') do (
    set URL=%%b
    set URL=!URL:"=!
    set URL=!URL:,=!
)

echo Your public ngrok URL is !URL!

pause