# Install Testing - Copy & Paste Commands

**Run these commands to add testing to your project**

---

## 📦 Step 1: Install All Dependencies

### Windows PowerShell

Copy and paste these commands one at a time:

```powershell
npm install -D vitest @vitejs/plugin-react @testing-library/react @testing-library/jest-dom @testing-library/user-event @vitest/ui @vitest/coverage-v8 jsdom @playwright/test

npx playwright install
```

### Mac/Linux/Git Bash

Copy and paste this entire block:

```bash
npm install -D vitest @vitejs/plugin-react @testing-library/react @testing-library/jest-dom @testing-library/user-event @vitest/ui @vitest/coverage-v8 jsdom @playwright/test && npx playwright install
```

**This installs:**
- Vitest (test runner)
- Testing Library (React testing)
- Playwright (E2E testing)
- Coverage tools
- All necessary dependencies

**Time:** 2-3 minutes

---

## ✅ Step 2: Verify Installation

Check that these files exist:
```bash
ls vitest.config.ts
ls playwright.config.ts
ls tests/setup.ts
ls tests/unit/example.test.ts
ls .github/workflows/test.yml
```

All should show "file exists" ✅

---

## 🧪 Step 3: Run Your First Test

```bash
npm run test
```

**Expected output:**
```
✓ tests/unit/example.test.ts (9)
  ✓ Example Test Suite (5)
  ✓ slugify utility (4)

Test Files  1 passed (1)
     Tests  9 passed (9)
  Start at  10:30:00
  Duration  1.23s
```

**If you see this, testing is working!** 🎉

---

## 🚀 Step 4: Run E2E Tests

First, start your dev server in one terminal:
```bash
npm run dev
```

Then in another terminal, run E2E tests:
```bash
npm run test:e2e
```

---

## 📊 Step 5: Check Coverage

```bash
npm run test:coverage
```

Then open the report:
```bash
# Windows
start coverage/index.html

# Mac
open coverage/index.html

# Linux
xdg-open coverage/index.html
```

---

## 🎯 Quick Commands Reference

```bash
# Run all unit tests
npm run test

# Run tests in watch mode (auto-rerun on changes)
npm run test

# Run tests with UI
npm run test:ui

# Run specific test file
npm run test example

# Run with coverage
npm run test:coverage

# Run E2E tests
npm run test:e2e

# Run E2E tests with UI
npm run test:e2e:ui

# Run ALL tests (unit + E2E)
npm run test:all
```

---

## ✅ Success Checklist

After installation, you should have:
- [x] All dependencies installed
- [x] Configuration files created
- [x] Example test passing
- [x] E2E tests configured
- [x] CI/CD workflow ready
- [x] Coverage reporting working

---

## 🐛 Troubleshooting

### Error: "Cannot find module 'vitest'"
```bash
# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Error: "Playwright browsers not installed"
```bash
npx playwright install --with-deps
```

### Error: "Port 3000 already in use"
```bash
# Kill the process using port 3000
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Mac/Linux
lsof -ti:3000 | xargs kill -9
```

### Tests are slow
```bash
# Run tests in parallel
npm run test -- --threads

# Run only changed tests
npm run test -- --changed
```

---

## 📚 Next Steps

1. **Read:** `TESTING_QUICK_START.md` - 30-minute guide
2. **Read:** `TESTING_IMPLEMENTATION_GUIDE.md` - Complete guide
3. **Write:** Your first real test
4. **Achieve:** 50% coverage this week

---

## 💡 Pro Tips

1. **Run tests before committing**
   ```bash
   npm run test -- --run
   ```

2. **Watch mode for development**
   ```bash
   npm run test
   # Tests auto-rerun when you save files
   ```

3. **Test specific files**
   ```bash
   npm run test votes
   npm run test PromptCard
   ```

4. **Debug failing tests**
   ```bash
   npm run test:ui
   # Opens visual test runner
   ```

---

**Installation complete! Start writing tests with `TESTING_QUICK_START.md`** 🚀
