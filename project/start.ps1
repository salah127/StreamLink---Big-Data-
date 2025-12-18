# StreamLink Start Script
# Starts all development servers (API + Mobile app)

Write-Host "Starting StreamLink Development Servers..." -ForegroundColor Cyan
Write-Host ""

# Check if dependencies are installed
if (!(Test-Path "node_modules")) {
    Write-Host "[ERROR] Dependencies not installed. Please run .\setup.ps1 first" -ForegroundColor Red
    exit 1
}

# Check if .env exists
if (!(Test-Path "services/api/.env")) {
    Write-Host "[WARNING] services/api/.env not found" -ForegroundColor Yellow
    Write-Host "   Stream data will not work without API credentials" -ForegroundColor Yellow
    Write-Host ""
}

Write-Host "Starting API server and Web services..." -ForegroundColor Yellow
Write-Host "   API will be available at: http://localhost:3001" -ForegroundColor Gray
Write-Host "   API docs will be at: http://localhost:3001/api/docs" -ForegroundColor Gray
Write-Host ""
Write-Host "[NOTE] Mobile app is excluded (use Expo Go separately if needed)" -ForegroundColor Yellow
Write-Host ""
Write-Host "Press Ctrl+C to stop all servers" -ForegroundColor Gray
Write-Host ""

# Start development servers (excluding mobile)
pnpm dev --filter !@streamlink/mobile
