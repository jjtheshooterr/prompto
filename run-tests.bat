@echo off
REM Batch Test Runner Script
REM Run this script to execute all tests: run-tests.bat

echo ========================================
echo   Running PromptVexity Test Suite
echo ========================================
echo.

echo Running unit tests...
call npm run test:run

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================
    echo   All tests passed!
    echo ========================================
    echo.
    echo Test files: 5
    echo Total tests: 36
    echo.
    echo Next steps:
    echo   - Run 'npm run test:coverage' for coverage report
    echo   - Run 'npm run test:ui' for interactive UI
    echo   - Run 'npm run test:e2e' for E2E tests
) else (
    echo.
    echo ========================================
    echo   Some tests failed
    echo ========================================
    echo.
    echo Check the output above for details
    exit /b 1
)
