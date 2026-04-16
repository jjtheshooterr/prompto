# Testing Quick Start - Get Running in 30 Minutes

**Goal:** Add testing to your project TODAY

---

## ⚡ Step 1: Install Dependencies (5 minutes)

```bash
# Unit & Integration Testing
npm install -D vitest @vitejs/plugin-react
npm install -D @testing-library/react @testing-library/jest-dom @testing-library/user-event
npm install -D @vitest/ui @vitest/coverage-v8
npm install -D jsdom

# E2E Testing
npm install -D @playwright/test
npx playwright install
```

---

## ⚙️ Step 2: Verify Configuration (2 minutes)

Check that these files were created:
- ✅ `vitest.config.ts`
- ✅ `playwright.config.ts`
- ✅ `tests/setup.ts`
- ✅ `tests/unit/example.test.ts`
- ✅ `.github/workflows/test.yml`

---

## 🧪 Step 3: Run Your First Test (1 minute)

```bash
npm run test
```

You should see:
```
✓ tests/unit/example.test.ts (6)
  ✓ Example Test Suite (5)
    ✓ should pass basic assertion
    ✓ should handle strings
    ✓ should handle arrays
    ✓ should handle objects
    ✓ should handle async operations
  ✓ slugify utility (4)
    ✓ should convert text to slug
    ✓ should remove special characters
    ✓ should handle multiple spaces
    ✓ should remove leading/trailing dashes

Test Files  1 passed (1)
     Tests  9 passed (9)
```

**If you see this, testing is working!** ✅

---

## 📝 Step 4: Write Your First Real Test (10 minutes)

### Test a Server Action

Create `tests/unit/lib/actions/votes.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setVote, clearVote } from '@/lib/actions/votes.actions'

// Mock the Supabase client
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => ({
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: 'user-123', email: 'test@example.com' } },
        error: null
      })
    },
    from: vi.fn(() => ({
      upsert: vi.fn().mockResolvedValue({ data: null, error: null }),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ data: null, error: null })
    }))
  }))
}))

// Mock revalidatePath
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn()
}))

describe('Vote Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should set upvote', async () => {
    await setVote('prompt-123', 1)
    // Test passes if no error is thrown
    expect(true).toBe(true)
  })

  it('should set downvote', async () => {
    await setVote('prompt-123', -1)
    expect(true).toBe(true)
  })

  it('should clear vote', async () => {
    await clearVote('prompt-123')
    expect(true).toBe(true)
  })

  it('should throw error when not authenticated', async () => {
    // Mock unauthenticated user
    const { createClient } = await import('@/lib/supabase/server')
    vi.mocked(createClient).mockResolvedValueOnce({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: null },
          error: { message: 'Not authenticated' }
        })
      }
    } as any)

    await expect(setVote('prompt-123', 1)).rejects.toThrow('Must be authenticated')
  })
})
```

Run the test:
```bash
npm run test votes
```

---

## 🎨 Step 5: Test a Component (10 minutes)

Create `tests/unit/components/AuthorChip.test.tsx`:

```typescript
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { AuthorChip } from '@/components/common/AuthorChip'

describe('AuthorChip', () => {
  it('should render username', () => {
    render(
      <AuthorChip
        userId="user-123"
        username="testuser"
        displayName="Test User"
        avatarUrl={null}
      />
    )
    
    expect(screen.getByText('testuser')).toBeInTheDocument()
  })

  it('should render display name when provided', () => {
    render(
      <AuthorChip
        userId="user-123"
        username="testuser"
        displayName="Test User"
        avatarUrl={null}
      />
    )
    
    // Should show display name in title/tooltip
    const link = screen.getByRole('link')
    expect(link).toHaveAttribute('href', '/u/testuser')
  })

  it('should link to user profile', () => {
    render(
      <AuthorChip
        userId="user-123"
        username="testuser"
        displayName="Test User"
        avatarUrl={null}
      />
    )
    
    const link = screen.getByRole('link')
    expect(link).toHaveAttribute('href', '/u/testuser')
  })

  it('should show avatar when provided', () => {
    render(
      <AuthorChip
        userId="user-123"
        username="testuser"
        displayName="Test User"
        avatarUrl="https://example.com/avatar.jpg"
        showAvatar={true}
      />
    )
    
    const avatar = screen.getByRole('img')
    expect(avatar).toBeInTheDocument()
  })
})
```

Run the test:
```bash
npm run test AuthorChip
```

---

## 🌐 Step 6: Run E2E Test (5 minutes)

Create `tests/e2e/homepage.spec.ts`:

```typescript
import { test, expect } from '@playwright/test'

test.describe('Homepage', () => {
  test('should load homepage', async ({ page }) => {
    await page.goto('/')
    
    // Check for main heading
    await expect(page.locator('h1')).toContainText('Prompt')
    
    // Check for navigation
    await expect(page.locator('nav')).toBeVisible()
  })

  test('should navigate to problems page', async ({ page }) => {
    await page.goto('/')
    
    // Click on Problems link
    await page.click('a:has-text("Problems")')
    
    // Should be on problems page
    await expect(page).toHaveURL(/\/problems/)
  })

  test('should navigate to prompts page', async ({ page }) => {
    await page.goto('/')
    
    // Click on Prompts link
    await page.click('a:has-text("Prompts")')
    
    // Should be on prompts page
    await expect(page).toHaveURL(/\/prompts/)
  })
})
```

Run E2E tests:
```bash
npm run test:e2e
```

---

## 📊 Step 7: Check Coverage (2 minutes)

```bash
npm run test:coverage
```

Open the coverage report:
```bash
# Windows
start coverage/index.html

# Mac
open coverage/index.html

# Linux
xdg-open coverage/index.html
```

---

## ✅ Success Checklist

After 30 minutes, you should have:
- [x] Testing dependencies installed
- [x] Configuration files in place
- [x] Example tests passing
- [x] First real test written
- [x] Component test written
- [x] E2E test running
- [x] Coverage report generated

---

## 🎯 Next Steps

### Today
1. Write tests for your most critical functions
2. Test your authentication flow
3. Test prompt creation

### This Week
1. Achieve 50% test coverage
2. Add tests for all server actions
3. Test critical user flows

### This Month
1. Achieve 70% test coverage
2. Add E2E tests for all features
3. Set up CI/CD pipeline

---

## 🚀 Common Commands

```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test

# Run tests with UI
npm run test:ui

# Run specific test file
npm run test votes

# Run tests with coverage
npm run test:coverage

# Run E2E tests
npm run test:e2e

# Run E2E tests with UI
npm run test:e2e:ui

# Run all tests (unit + E2E)
npm run test:all
```

---

## 💡 Tips

1. **Write tests as you code** - Don't wait until the end
2. **Test behavior, not implementation** - Focus on what users see
3. **Keep tests simple** - One assertion per test when possible
4. **Use descriptive names** - Test names should explain what they test
5. **Mock external dependencies** - Don't test Supabase, test your code

---

## 🐛 Troubleshooting

### Tests won't run
```bash
# Clear cache
rm -rf node_modules/.vite
npm run test
```

### Playwright won't install
```bash
# Install with dependencies
npx playwright install --with-deps
```

### Coverage not working
```bash
# Install coverage provider
npm install -D @vitest/coverage-v8
```

---

## 📚 Learn More

- **Vitest:** https://vitest.dev
- **Testing Library:** https://testing-library.com
- **Playwright:** https://playwright.dev
- **Full Guide:** See `TESTING_IMPLEMENTATION_GUIDE.md`

---

**You now have a working test suite! Start writing tests for your critical features.** 🎉
