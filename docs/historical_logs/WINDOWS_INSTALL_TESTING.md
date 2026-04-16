# Windows PowerShell - Install Testing

**You're on Windows! Use these PowerShell commands.**

---

## 🚀 Step 1: Install Testing Dependencies

Copy and paste this command:

```powershell
npm install -D vitest @vitejs/plugin-react @testing-library/react @testing-library/jest-dom @testing-library/user-event @vitest/ui @vitest/coverage-v8 jsdom @playwright/test
```

**Wait for it to complete** (2-3 minutes)

---

## 🎭 Step 2: Install Playwright Browsers

Copy and paste this command:

```powershell
npx playwright install
```

**Wait for it to complete** (1-2 minutes)

---

## 🧪 Step 3: Run Your First Test

Copy and paste this command:

```powershell
npm run test
```

**You should see:**
```
✓ tests/unit/example.test.ts (9)
  ✓ Example Test Suite (5)
  ✓ slugify utility (4)

Test Files  1 passed (1)
     Tests  9 passed (9)
```

**If you see this, testing is working!** ✅

---

## 📊 Step 4: Check Coverage

```powershell
npm run test:coverage
```

Then open the report:

```powershell
start coverage/index.html
```

---

## 🌐 Step 5: Run E2E Tests

First, start your dev server in one PowerShell window:

```powershell
npm run dev
```

Then open a NEW PowerShell window and run:

```powershell
npm run test:e2e
```

---

## ✅ All Commands for Windows

```powershell
# Install dependencies
npm install -D vitest @vitejs/plugin-react @testing-library/react @testing-library/jest-dom @testing-library/user-event @vitest/ui @vitest/coverage-v8 jsdom @playwright/test

# Install Playwright
npx playwright install

# Run tests
npm run test

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm run test:coverage

# Open coverage report
start coverage/index.html

# Run E2E tests (after starting dev server)
npm run test:e2e

# Run E2E tests with UI
npm run test:e2e:ui
```

---

## 🐛 Windows-Specific Troubleshooting

### Error: "Execution policy"

If you get an error about execution policy, run PowerShell as Administrator and run:

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Error: "Port 3000 already in use"

```powershell
# Find process using port 3000
netstat -ano | findstr :3000

# Kill the process (replace PID with actual number)
taskkill /PID <PID> /F
```

### Error: "Cannot find module"

```powershell
# Delete and reinstall
Remove-Item -Recurse -Force node_modules
Remove-Item package-lock.json
npm install
```

---

## 🎯 Next Steps

1. ✅ Tests installed and running
2. 📖 Read `TESTING_QUICK_START.md`
3. ✍️ Write your first real test
4. 📊 Achieve 50% coverage this week

---

## 💡 Windows Tips

1. **Use PowerShell, not CMD** - PowerShell has better npm support
2. **Run as Administrator** - If you get permission errors
3. **Use Windows Terminal** - Better than default PowerShell
4. **Install Git Bash** - Alternative that supports `&&` syntax

---

**Testing is now installed! Follow `TESTING_QUICK_START.md` next.** 🚀
