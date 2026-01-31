# PowerShell Test Runner Script
# Run this script to execute all tests: .\run-tests.ps1

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Running PromptVexity Test Suite" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Run tests
Write-Host "Running unit tests..." -ForegroundColor Yellow
npm run test:run

# Check exit code
if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "  ✓ All tests passed!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Test files: 5" -ForegroundColor White
    Write-Host "Total tests: 36" -ForegroundColor White
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "  - Run 'npm run test:coverage' for coverage report" -ForegroundColor White
    Write-Host "  - Run 'npm run test:ui' for interactive UI" -ForegroundColor White
    Write-Host "  - Run 'npm run test:e2e' for E2E tests" -ForegroundColor White
} else {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Red
    Write-Host "  ✗ Some tests failed" -ForegroundColor Red
    Write-Host "========================================" -ForegroundColor Red
    Write-Host ""
    Write-Host "Check the output above for details" -ForegroundColor Yellow
    exit 1
}
