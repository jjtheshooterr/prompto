# Quick Test Commands - Cheat Sheet

**Copy and paste these commands to run your tests!**

---

## 🚀 Most Common Commands

```powershell
# Run all tests (recommended)
npm run test:run

# Run tests in watch mode (during development)
npm test

# Quick verification
npm run test:verify

# Generate coverage report
npm run test:coverage
```

---

## 📝 Run Specific Tests

```powershell
# Run specific test file
npm run test -- --run votes
npm run test -- --run auth
npm run test -- --run AuthorChip
npm run test -- --run PromptCard
npm run test -- --run example

# Run by category
npm run test:actions
npm run test:components
```

---

## 📊 Coverage & Reports

```powershell
# Generate coverage
npm run test:coverage

# Generate and open coverage in browser
npm run test:coverage:open

# Or manually open
start coverage/index.html
```

---

## 🎨 Interactive UI

```powershell
# Open Vitest UI
npm run test:ui
```

---

## 🌐 E2E Tests

```powershell
# Run E2E tests
npm run test:e2e

# Run E2E with UI
npm run test:e2e:ui

# Run E2E in browser (headed mode)
npm run test:e2e:headed
```

---

## 🔄 Alternative Runners

```powershell
# PowerShell script
.\run-tests.ps1

# Batch script
run-tests.bat
```

---

## ✅ Verification

```powershell
# Verify everything works
npm run test:verify
```

Expected output:
```
Test Files  5 passed (5)
     Tests  36 passed (36)
All tests passing!
```

---

## 📚 Documentation

- **Full Guide:** `README_TESTS.md`
- **Test List:** `TEST_INVENTORY.md`
- **Summary:** `TESTS_SAVED_AND_READY.md`

---

**Save this file for quick reference!** 📌
