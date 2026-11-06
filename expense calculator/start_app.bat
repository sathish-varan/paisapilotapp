@echo off
title Daily Expense & Income Tracker
cd /d "%~dp0"
echo Starting Daily Expense Tracker Server...
python serve.py
if errorlevel 1 (
    echo.
    echo Python was not found in PATH or failed to start.
    echo Trying to open index.html directly in browser...
    start index.html
    pause
)

