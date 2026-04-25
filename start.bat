@echo off
echo.
echo  ================================
echo   Kesher Ivrit - Hebrew Learning
echo   קשר עברית
echo  ================================
echo.

if not exist ".env" (
  echo  WARNING: No .env file found!
  echo  Create a .env file with:
  echo    ANTHROPIC_API_KEY=sk-ant-your-key-here
  echo.
  echo  Or enter your API key in the browser when prompted.
  echo.
)

echo  Starting server on http://localhost:3000
echo  Press Ctrl+C to stop.
echo.

node server.js
