@echo off
echo Starting Portfolio Backend Server...
echo.

cd server

echo Installing dependencies...
npm install

echo.
echo Starting MongoDB (if not already running)...
start "" "mongod"

echo.
echo Starting the backend server...
npm run dev

pause