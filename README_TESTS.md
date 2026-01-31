# Testing Guide - Quick Reference

**Last Updated:** January 30, 2026

---

## 🚀 Quick Start

```powershell
# Run all tests
npm run test -- --run

# Run tests in watch mode
npm test

# Run with coverage report
npm run test:coverage

# Open coverage report in browser
start coverage/index.html
```

---

## 📁 Test File Locations

```
tests/
├── setup.ts                                    # Test configuration & mocks
├── unit/
│   ├── example.test.ts                        # Example tests (9 tests)
│   ├── components/
│   │   ├── AuthorChip.test.tsx               # AuthorChip tests (10 tests)
│   │   └── PromptCard.test.tsx               # PromptCard tests (11 tests)
│   └── lib/
│       └── actions/
│           ├── auth.test.ts                   # Auth action tests (2 tests)
│           └── votes.test.ts                  # Vote action tests (4 tests)
```

**Total: 36 tests passing**

---

## 📝 All Available Test Commands

### Unit Tests

```powershell
# Run all unit tests once
npm run test -- --run

# Run all unit tests in watch mode (auto-rerun on file changes)
npm test

# Run specific test file
npm run test -- --run votes
npm run test -- --run auth
npm run test -- --run AuthorChip
npm run test -- --run PromptCard
npm run test -- --run example

# Run tests matching a pattern
npm run test -- --run actions
npm run test -- --run components
```

### Coverage Reports

```powershell
# Generate coverage report
npm run test:coverage

# Open coverage report in browser (Windows)
start coverage/index.html

# View coverage in terminal
npm run test:coverage -- --reporter=text
```

### Visual Test UI

```powershell
# Open Vitest UI (interactive test runner)
npm run test:ui
```

### E2E Tests (Playwright)

```powershell
# Run E2E tests (requires dev server running)
npm run test:e2e

# Run E2E tests with UI
npm run test:e2e:ui

# Run E2E tests in headed mode (see browser)
npx playwright test --headed

# Run specific E2E test file
npx playwright test tests/e2e/homepage.spec.ts
```

### Combined Tests

```powershell
# Run all tests (unit + E2E)
npm run test:all
```

---

## 🔧 Debugging Tests

### Debug Single Test

```powershell
# Run single test file with verbose output
npm run test -- --run votes --reporter=verbose

# Run with Node debugger
node --inspect-brk node_modules/vitest/vitest.mjs --run votes
```

### Debug in VS Code

Add to `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Debug Vitest Tests",
      "runtimeExecutable": "npm",
      "runtimeArgs": ["run", "test", "--", "--run"],
      "console": "integratedTerminal",
      "internalConsoleOptions": "neverOpen"
    }
  ]
}
```

---

## 📊 Test Status

### Current Coverage
- **Total Tests:** 36 passing
- **Test Files:** 5
- **Execution Time:** ~4 seconds
- **Coverage:** ~10-15% (baseline)

### Test Breakdown
- ✅ Server Actions: 6 tests
- ✅ Components: 21 tests
- ✅ Utilities: 9 tests

---

## 🎯 Writing New Tests

### Test a Server Action

Create `tests/unit/lib/actions/yourAction.test.ts`:

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { yourAction } from '@/lib/actions/yourAction'

describe('Your Action', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should do something', async () => {
    const result = await yourAction('test-id')
    expect(result).toBeDefined()
  })
})
```

### Test a Component

Create `tests/unit/components/YourComponent.test.tsx`:

```typescript
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import YourComponent from '@/components/YourComponent'

describe('YourComponent', () => {
  it('should render correctly', () => {
    render(<YourComponent title="Test" />)
    expect(screen.getByText('Test')).toBeInTheDocument()
  })
})
```

### Run Your New Test

```powershell
npm run test -- --run YourComponent
```

---

## 🔄 CI/CD Integration

### GitHub Actions

File already created: `.github/workflows/test.yml`

Tests run automatically on:
- Every push to main
- Every pull request
- Manual workflow dispatch

### Local Pre-commit Hook

Add to `.git/hooks/pre-commit`:

```bash
#!/bin/sh
npm run test -- --run
```

Make executable:
```powershell
chmod +x .git/hooks/pre-commit
```

---

## 🐛 Troubleshooting

### Tests Won't Run

```powershell
# Clear cache and reinstall
Remove-Item -Recurse -Force node_modules
Remove-Item package-lock.json
npm install

# Clear Vitest cache
Remove-Item -Recurse -Force node_modules/.vitest
npm run test -- --run
```

### Coverage Not Working

```powershell
# Reinstall coverage provider
npm install -D @vitest/coverage-v8
npm run test:coverage
```

### Playwright Issues

```powershell
# Reinstall browsers
npx playwright install --with-deps

# Clear Playwright cache
npx playwright install --force
```

### Mock Issues

If Supabase mocks aren't working, check `tests/setup.ts` is being loaded.

---

## 📚 Documentation

- **Full Guide:** `TESTING_IMPLEMENTATION_GUIDE.md`
- **Quick Start:** `TESTING_QUICK_START.md`
- **Windows Guide:** `WINDOWS_INSTALL_TESTING.md`
- **Complete Summary:** `TESTING_COMPLETE_SUMMARY.md`
- **Execution Plan:** `TEST_EXECUTION_PLAN.md`

---

## 🎯 Next Steps

### Add More Tests
1. Test more server actions (prompts, problems, reviews)
2. Test more components (ProblemCard, forms)
3. Add E2E tests for critical flows

### Improve Coverage
```powershell
# Check current coverage
npm run test:coverage

# Target: 50-70% coverage
```

### Set Up CI/CD
- Tests already configured in `.github/workflows/test.yml`
- Push to GitHub to enable automatic testing

---

## 💡 Pro Tips

1. **Run tests before committing**
   ```powershell
   npm run test -- --run
   ```

2. **Use watch mode during development**
   ```powershell
   npm test
   ```

3. **Check coverage regularly**
   ```powershell
   npm run test:coverage
   ```

4. **Write tests as you code** - Don't wait until the end

5. **Keep tests simple** - One assertion per test when possible

---

## ✅ Verification

Run this to verify everything works:

```powershell
# Should show 36 tests passing
npm run test -- --run
```

Expected output:
```
✓ tests/unit/example.test.ts (9 tests)
✓ tests/unit/lib/actions/auth.test.ts (2 tests)
✓ tests/unit/lib/actions/votes.test.ts (4 tests)
✓ tests/unit/components/AuthorChip.test.tsx (10 tests)
✓ tests/unit/components/PromptCard.test.tsx (11 tests)

Test Files  5 passed (5)
     Tests  36 passed (36)
```

---

**All tests are saved and ready to run anytime!** 🚀
