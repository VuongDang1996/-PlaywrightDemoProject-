@echo off
echo 🚀 Playwright Codegen Auto Locator Collector
echo ============================================
echo.

set "OUTPUT_DIR=.github\CodeGenLocator"
set "TIMESTAMP=%date:~-4,4%%date:~-10,2%%date:~-7,2%_%time:~0,2%%time:~3,2%%time:~6,2%"
set "SESSION_NAME=%1"
set "TARGET_URL=%2"

if "%SESSION_NAME%"=="" set "SESSION_NAME=session_%TIMESTAMP%"
if "%TARGET_URL%"=="" set "TARGET_URL=http://automationpractice.pl/"

echo 📁 Creating output directory...
if not exist "%OUTPUT_DIR%" mkdir "%OUTPUT_DIR%"

set "OUTPUT_FILE=%OUTPUT_DIR%\%SESSION_NAME%.js"

echo 🎬 Starting Codegen session...
echo 📄 Output file: %OUTPUT_FILE%
echo 🌐 Target URL: %TARGET_URL%
echo.
echo ⏳ Recording... Press Ctrl+C in the Codegen window when done.
echo.

npx playwright codegen "%TARGET_URL%" --target=javascript --output="%OUTPUT_FILE%"

echo.
echo ✅ Codegen session completed!
echo 📄 Generated file: %OUTPUT_FILE%
echo.
echo 🔍 Analyzing generated locators...
node scripts\analyze-single-file.js "%OUTPUT_FILE%" "%SESSION_NAME%"

pause
