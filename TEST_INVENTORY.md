# Test Inventory - Complete List

**Last Updated:** January 30, 2026  
**Total Tests:** 36 passing  
**Test Files:** 5

---

## 📋 Complete Test List

### 1. Example Tests (9 tests)
**File:** `tests/unit/example.test.ts`

1. ✅ Example Test Suite > should pass basic assertion
2. ✅ Example Test Suite > should handle strings
3. ✅ Example Test Suite > should handle arrays
4. ✅ Example Test Suite > should handle objects
5. ✅ Example Test Suite > should handle async operations
6. ✅ slugify utility > should convert text to slug
7. ✅ slugify utility > should remove special characters
8. ✅ slugify utility > should handle multiple spaces
9. ✅ slugify utility > should remove leading/trailing dashes

**Run:** `npm run test -- --run example`

---

### 2. Auth Action Tests (2 tests)
**File:** `tests/unit/lib/actions/auth.test.ts`

1. ✅ Auth Actions > getUser > should return authenticated user
2. ✅ Auth Actions > signOut > should call signOut without errors

**Run:** `npm run test -- --run auth`

---

### 3. Vote Action Tests (4 tests)
**File:** `tests/unit/lib/actions/votes.test.ts`

1. ✅ Vote Actions > setVote > should set upvote successfully
2. ✅ Vote Actions > setVote > should set downvote successfully
3. ✅ Vote Actions > clearVote > should clear vote successfully
4. ✅ Vote Actions > getUserVote > should return null for non-existent vote

**Run:** `npm run test -- --run votes`

---

### 4. AuthorChip Component Tests (10 tests)
**File:** `tests/unit/components/AuthorChip.test.tsx`

1. ✅ AuthorChip > should render display name
2. ✅ AuthorChip > should render username with @ symbol
3. ✅ AuthorChip > should link to user profile with username
4. ✅ AuthorChip > should link to profile by ID when no username
5. ✅ AuthorChip > should show avatar when provided
6. ✅ AuthorChip > should not show avatar when showAvatar is false
7. ✅ AuthorChip > should show default avatar icon when no avatarUrl
8. ✅ AuthorChip > should render "Anonymous" when no display name
9. ✅ AuthorChip > should apply size classes correctly
10. ✅ AuthorChip > should apply custom className

**Run:** `npm run test -- --run AuthorChip`

---

### 5. PromptCard Component Tests (11 tests)
**File:** `tests/unit/components/PromptCard.test.tsx`

1. ✅ PromptCard > should render prompt title
2. ✅ PromptCard > should render model and date
3. ✅ PromptCard > should render stats correctly
4. ✅ PromptCard > should render system prompt
5. ✅ PromptCard > should render best_for tags
6. ✅ PromptCard > should render author attribution
7. ✅ PromptCard > should render View Details link
8. ✅ PromptCard > should render fork indicator when prompt is a fork
9. ✅ PromptCard > should render improvement summary when present
10. ✅ PromptCard > should render fork count when greater than 0
11. ✅ PromptCard > should render view and copy counts

**Run:** `npm run test -- --run PromptCard`

---

## 📊 Test Coverage by Category

### Server Actions (6 tests)
- Auth Actions: 2 tests
- Vote Actions: 4 tests

**Coverage:** ~30% of server actions  
**Target:** 70% coverage

### Components (21 tests)
- AuthorChip: 10 tests
- PromptCard: 11 tests

**Coverage:** ~15% of components  
**Target:** 60% coverage

### Utilities (9 tests)
- Example/Slugify: 9 tests

**Coverage:** ~50% of utilities  
**Target:** 80% coverage

---

## 🎯 Test Execution Commands

### Run All Tests
```powershell
npm run test:run
# or
npm run test -- --run
# or
.\run-tests.ps1
# or
run-tests.bat
```

### Run Specific Test Files
```powershell
npm run test -- --run example
npm run test -- --run auth
npm run test -- --run votes
npm run test -- --run AuthorChip
npm run test -- --run PromptCard
```

### Run by Category
```powershell
npm run test:actions        # Run all action tests
npm run test:components     # Run all component tests
```

### Run with Coverage
```powershell
npm run test:coverage                # Generate coverage
npm run test:coverage:open           # Generate and open in browser
```

### Run with UI
```powershell
npm run test:ui             # Interactive test UI
```

### Watch Mode
```powershell
npm test                    # Auto-rerun on file changes
npm run test:watch          # Same as above
```

---

## 📁 Test File Structure

```
tests/
├── setup.ts                                    # Global test configuration
│
├── unit/
│   ├── example.test.ts                        # 9 tests
│   │
│   ├── lib/
│   │   └── actions/
│   │       ├── auth.test.ts                   # 2 tests
│   │       └── votes.test.ts                  # 4 tests
│   │
│   └── components/
│       ├── AuthorChip.test.tsx                # 10 tests
│       └── PromptCard.test.tsx                # 11 tests
│
└── e2e/                                        # (Future E2E tests)
```

---

## 🔄 Test Maintenance

### Adding New Tests

1. **Create test file** in appropriate directory
2. **Follow naming convention:** `*.test.ts` or `*.test.tsx`
3. **Run test:** `npm run test -- --run YourTest`
4. **Update this inventory**

### Updating Tests

1. **Modify test file**
2. **Run specific test:** `npm run test -- --run TestName`
3. **Verify all tests pass:** `npm run test:run`

### Removing Tests

1. **Delete test file**
2. **Verify remaining tests:** `npm run test:run`
3. **Update this inventory**

---

## ✅ Verification Checklist

Run these commands to verify everything works:

```powershell
# 1. Run all tests
npm run test:run

# 2. Check coverage
npm run test:coverage

# 3. Open test UI
npm run test:ui

# 4. Run quick verification
npm run test:verify
```

Expected output:
```
Test Files  5 passed (5)
     Tests  36 passed (36)
  Duration  ~4 seconds
```

---

## 📈 Growth Plan

### Current State
- ✅ 36 tests passing
- ✅ 5 test files
- ✅ ~10-15% coverage

### Next Milestone (50 tests)
- [ ] Add Prompt Actions tests
- [ ] Add Problem Actions tests
- [ ] Add ProblemCard tests
- [ ] Target: 25% coverage

### Future Milestone (100 tests)
- [ ] Add Review Actions tests
- [ ] Add Report Actions tests
- [ ] Add Form Component tests
- [ ] Add E2E tests
- [ ] Target: 50% coverage

---

## 🚀 Quick Reference

| Command | Description |
|---------|-------------|
| `npm run test:run` | Run all tests once |
| `npm test` | Run tests in watch mode |
| `npm run test:coverage` | Generate coverage report |
| `npm run test:ui` | Open interactive UI |
| `npm run test:verify` | Quick verification |
| `.\run-tests.ps1` | PowerShell test runner |
| `run-tests.bat` | Batch test runner |

---

## 📚 Documentation

- **Quick Reference:** `README_TESTS.md`
- **Full Guide:** `TESTING_IMPLEMENTATION_GUIDE.md`
- **Quick Start:** `TESTING_QUICK_START.md`
- **Complete Summary:** `TESTING_COMPLETE_SUMMARY.md`
- **Execution Plan:** `TEST_EXECUTION_PLAN.md`

---

**All tests are documented, saved, and ready to run!** 🎉
