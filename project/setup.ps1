# StreamLink Project Setup Script
# This script installs all dependencies and sets up the project

Write-Host "StreamLink Setup Starting..." -ForegroundColor Cyan
Write-Host ""

# Check if pnpm is installed
Write-Host "Checking for pnpm..." -ForegroundColor Yellow
if (!(Get-Command pnpm -ErrorAction SilentlyContinue)) {
    Write-Host "[ERROR] pnpm not found. Installing pnpm..." -ForegroundColor Red
    npm install -g pnpm
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[ERROR] Failed to install pnpm. Please install it manually: npm install -g pnpm" -ForegroundColor Red
        exit 1
    }
}
Write-Host "[OK] pnpm is installed" -ForegroundColor Green
Write-Host ""

# Install dependencies
Write-Host "Installing dependencies (this may take a few minutes)..." -ForegroundColor Yellow
pnpm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Failed to install dependencies" -ForegroundColor Red
    exit 1
}
Write-Host "[OK] Dependencies installed successfully" -ForegroundColor Green
Write-Host ""

# Check if .env exists in services/api
Write-Host "Checking environment configuration..." -ForegroundColor Yellow
if (!(Test-Path "services/api/.env")) {
    Write-Host "[WARNING] No .env file found in services/api/" -ForegroundColor Yellow
    if (Test-Path ".env.example") {
        Write-Host "Copying .env.example to services/api/.env" -ForegroundColor Yellow
        Copy-Item ".env.example" "services/api/.env"
        Write-Host "[OK] Created services/api/.env - Please update with your API keys" -ForegroundColor Green
    } else {
        Write-Host "[WARNING] Please create services/api/.env with your configuration" -ForegroundColor Yellow
    }
} else {
    Write-Host "[OK] Environment file exists" -ForegroundColor Green
}
Write-Host ""

# Build packages
Write-Host "Building shared packages..." -ForegroundColor Yellow
pnpm run build --filter @streamlink/config --filter @streamlink/ui
if ($LASTEXITCODE -ne 0) {
    Write-Host "[WARNING] Some packages failed to build, but continuing..." -ForegroundColor Yellow
} else {
    Write-Host "[OK] Packages built successfully" -ForegroundColor Green
}
Write-Host ""

Write-Host "Setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "  1. Update services/api/.env with your API credentials" -ForegroundColor White
Write-Host "     - Twitch, YouTube, and Kick API keys are required for stream data" -ForegroundColor Gray
Write-Host ""
Write-Host "  2. Start the development servers:" -ForegroundColor White
Write-Host "     .\start.ps1" -ForegroundColor Green
Write-Host ""
Write-Host "  Or run individual services:" -ForegroundColor White
Write-Host "     pnpm dev --filter @streamlink/api      # API server only" -ForegroundColor Gray
Write-Host "     pnpm dev --filter @streamlink/mobile   # Mobile app only" -ForegroundColor Gray
Write-Host ""
