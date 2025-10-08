@echo off
REM Docker deployment script for Windows
setlocal enabledelayedexpansion

echo 🐳 VideoPro Docker Deployment Script
echo ==================================

REM Configuration
set IMAGE_NAME=videography-booking-system
set CONTAINER_NAME=videography-app
if not defined PORT set PORT=80
if not defined ENV set ENV=production

REM Check if Docker is running
docker info >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker is not running. Please start Docker and try again.
    exit /b 1
)
echo ✅ Docker is running

REM Build the application
echo ℹ️  Building the application...
call npm run build
if errorlevel 1 (
    echo ❌ Application build failed
    exit /b 1
)
echo ✅ Application built successfully

REM Stop and remove existing container
docker ps -a --filter "name=%CONTAINER_NAME%" --format "{{.Names}}" | findstr /x "%CONTAINER_NAME%" >nul
if not errorlevel 1 (
    echo ℹ️  Stopping existing container...
    docker stop %CONTAINER_NAME% 2>nul
    docker rm %CONTAINER_NAME% 2>nul
    echo ✅ Existing container removed
)

REM Build Docker image
echo ℹ️  Building Docker image...
docker build -t %IMAGE_NAME%:latest .
if errorlevel 1 (
    echo ❌ Docker image build failed
    exit /b 1
)
echo ✅ Docker image built successfully

REM Run the container
echo ℹ️  Starting container on port %PORT%...
docker run -d --name %CONTAINER_NAME% --restart unless-stopped -p %PORT%:80 -e NODE_ENV=%ENV% %IMAGE_NAME%:latest
if errorlevel 1 (
    echo ❌ Failed to start container
    exit /b 1
)

echo ✅ Container started successfully
echo ℹ️  Application is now running at: http://localhost:%PORT%
echo ℹ️  Health check: http://localhost:%PORT%/health

REM Show container status
echo ℹ️  Container status:
docker ps --filter "name=%CONTAINER_NAME%" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

echo.
echo ✅ Deployment completed successfully! 🎉
echo ℹ️  Useful commands:
echo   View logs:    docker logs -f %CONTAINER_NAME%
echo   Stop app:     docker stop %CONTAINER_NAME%
echo   Restart app:  docker restart %CONTAINER_NAME%
echo   Remove app:   docker stop %CONTAINER_NAME% ^&^& docker rm %CONTAINER_NAME%

pause