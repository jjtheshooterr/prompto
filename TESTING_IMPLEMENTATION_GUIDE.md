# Testing Implementation Guide
**Goal:** Add comprehensive testing infrastructure  
**Timeline:** 2-3 weeks  
**Priority:** HIGH - Essential for maintaining quality at scale

---

## 🎯 Why Testing Matters

**Without tests:**
- ❌ Every change risks breaking production
- ❌ Refactoring is scary
- ❌ Bugs slip through to customers
- ❌ Confidence decreases over time
- ❌ Development slows down

**With tests:**
- ✅ Deploy with confidence
- ✅ Refactor safely
- ✅ Catch bugs before customers
- ✅ Document expected behavior
- ✅ Move faster over time

---

## 📊 Testing Strategy

### Test Pyramid
```
        /\
       /E2E\      <- 10% (Critical user flows)
      /------\
     /  API   \   <- 20% (Integration tests)
    /----------\
   /   Unit     \ <- 70% (Business logic)
  /--------------\
```

**70% Unit Tests** - Fast, isolated, test business logic  
**20% Integration Tests** - Test API endpoints and database  
**10% E2E Tests** - Test critical user flows in browser

---

## 🛠️ Tech Stack

### Unit & Integration Tests
- **Vitest** - Fast, modern test runner (Vite-powered)
- **Testing Library** - React component testing
- **MSW** - Mock Service Worker for API mocking

### E2E Tests
- **Playwright** - Cross-browser testing
- **Playwright Test** - Built-in test runner

### CI/CD
- **GitHub Actions** - Automated testing on push/PR

---

## 📦 Step 1: Install Dependencies (15 minutes)

### Install Testing Tools
```bash
# Unit & Integration Testing
npm install -D vitest @vitejs/plugin-react
npm install -D @testing-library/react @testing-library/jest-dom @testing-library/user-event
npm install -D @vitest/ui
npm install -D jsdom

# E2E Testing
npm install -D @playwright/test
npx playwright install

# Test Utilities
npm install -D msw
```

### Update package.json
```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:all": "npm run test && npm run test:e2e"
  }
}
```

---

## ⚙️ Step 2: Configure Vitest (30 minutes)

### Create vitest.config.ts
```typescript
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'tests/',
        '**/*.config.{js,ts}',
        '**/*.d.ts',
        '**/types/**'
      ]
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './')
    }
  }
})
```

### Create tests/setup.ts
```typescript
import '@testing-library/jest-dom'
import { cleanup } from '@testing-library/react'
import { afterEach, vi } from 'vitest'

// Cleanup after each test
afterEach(() => {
  cleanup()
})

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn()
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams()
}))

// Mock Supabase client
vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: {
      getUser: vi.fn(),
      signIn: vi.fn(),
      signOut: vi.fn()
    },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn()
    }))
  })
}))
```

---

## 🧪 Step 3: Write Unit Tests (1 week)

### Test Structure
```
tests/
├── unit/
│   ├── lib/
│   │   ├── actions/
│   │   │   ├── prompts.test.ts
│   │   │   ├── problems.test.ts
│   │   │   └── votes.test.ts
│   │   └── utils/
│   │       └── helpers.test.ts
│   └── components/
│       ├── PromptCard.test.tsx
│       ├── ProblemCard.test.tsx
│       └── AuthorChip.test.tsx
├── integration/
│   └── api/
│       └── prompts.test.ts
└── e2e/
    ├── auth.spec.ts
    ├── prompts.spec.ts
    └── problems.spec.ts
```

### Example: Test Server Action
```typescript
// tests/unit/lib/actions/prompts.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createPrompt } from '@/lib/actions/prompts.actions'

// Mock Supabase
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => ({
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: 'user-123', email: 'test@example.com' } },
        error: null
      })
    },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: { id: 'workspace-123' },
        error: null
      })
    })),
    rpc: vi.fn().mockResolvedValue({ data: null, error: null })
  }))
}))

describe('createPrompt', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should create a prompt with valid data', async () => {
    const formData = new FormData()
    formData.append('problem_id', 'problem-123')
    formData.append('title', 'Test Prompt')
    formData.append('system_prompt', 'You are a helpful assistant')
    formData.append('user_prompt_template', 'Help me with {{task}}')
    formData.append('model', 'gpt-4')
    formData.append('params', '{}')
    formData.append('example_input', 'Test input')
    formData.append('example_output', 'Test output')
    formData.append('status', 'published')

    const result = await createPrompt(formData)

    expect(result).toBeDefined()
    expect(result.title).toBe('Test Prompt')
  })

  it('should throw error when not authenticated', async () => {
    // Mock unauthenticated user
    vi.mocked(createClient).mockReturnValueOnce({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: null },
          error: { message: 'Not authenticated' }
        })
      }
    } as any)

    const formData = new FormData()
    formData.append('title', 'Test')

    await expect(createPrompt(formData)).rejects.toThrow('Authentication error')
  })

  it('should validate required fields', async () => {
    const formData = new FormData()
    // Missing required fields

    await expect(createPrompt(formData)).rejects.toThrow()
  })
})
```

### Example: Test React Component
```typescript
// tests/unit/components/PromptCard.test.tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import PromptCard from '@/components/prompts/PromptCard'

const mockPrompt = {
  id: 'prompt-123',
  title: 'Test Prompt',
  system_prompt: 'You are helpful',
  model: 'gpt-4',
  created_at: '2024-01-01',
  created_by: 'user-123',
  author: {
    id: 'user-123',
    username: 'testuser',
    display_name: 'Test User',
    avatar_url: null
  },
  prompt_stats: [{
    upvotes: 10,
    downvotes: 2,
    score: 8,
    copy_count: 5,
    view_count: 100,
    fork_count: 3,
    works_count: 8,
    fails_count: 1
  }]
}

describe('PromptCard', () => {
  it('should render prompt title', () => {
    render(<PromptCard prompt={mockPrompt} />)
    expect(screen.getByText('Test Prompt')).toBeInTheDocument()
  })

  it('should display stats correctly', () => {
    render(<PromptCard prompt={mockPrompt} />)
    expect(screen.getByText('8 Works')).toBeInTheDocument()
    expect(screen.getByText('1 Fails')).toBeInTheDocument()
    expect(screen.getByText('100 views')).toBeInTheDocument()
  })

  it('should show fork indicator for forked prompts', () => {
    const forkedPrompt = {
      ...mockPrompt,
      parent_prompt_id: 'parent-123'
    }
    render(<PromptCard prompt={forkedPrompt} />)
    expect(screen.getByText('Fork')).toBeInTheDocument()
  })

  it('should call onAddToCompare when compare button clicked', () => {
    const onAddToCompare = vi.fn()
    render(<PromptCard prompt={mockPrompt} onAddToCompare={onAddToCompare} />)
    
    const compareButton = screen.getByText('Compare')
    fireEvent.click(compareButton)
    
    expect(onAddToCompare).toHaveBeenCalledWith('prompt-123')
  })

  it('should copy system prompt to clipboard', async () => {
    // Mock clipboard API
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined)
      }
    })

    render(<PromptCard prompt={mockPrompt} />)
    
    const copyButton = screen.getByText('Copy')
    fireEvent.click(copyButton)
    
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('You are helpful')
  })
})
```

### Example: Test Utility Function
```typescript
// tests/unit/lib/utils/helpers.test.ts
import { describe, it, expect } from 'vitest'

// Example utility function
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .substring(0, 50)
}

describe('generateSlug', () => {
  it('should convert title to slug', () => {
    expect(generateSlug('Hello World')).toBe('hello-world')
  })

  it('should remove special characters', () => {
    expect(generateSlug('Hello @World!')).toBe('hello-world')
  })

  it('should handle multiple spaces', () => {
    expect(generateSlug('Hello    World')).toBe('hello-world')
  })

  it('should truncate long titles', () => {
    const longTitle = 'a'.repeat(100)
    expect(generateSlug(longTitle).length).toBeLessThanOrEqual(50)
  })
})
```

---

## 🔗 Step 4: Write Integration Tests (3 days)

### Test Database Operations
```typescript
// tests/integration/database/prompts.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Use service role for tests
)

describe('Prompts Database Operations', () => {
  let testUserId: string
  let testProblemId: string
  let testPromptId: string

  beforeAll(async () => {
    // Create test user
    const { data: user } = await supabase.auth.admin.createUser({
      email: 'test@example.com',
      password: 'testpassword123',
      email_confirm: true
    })
    testUserId = user.user!.id

    // Create test problem
    const { data: problem } = await supabase
      .from('problems')
      .insert({
        title: 'Test Problem',
        slug: 'test-problem-' + Date.now(),
        created_by: testUserId,
        owner_id: testUserId
      })
      .select()
      .single()
    testProblemId = problem!.id
  })

  afterAll(async () => {
    // Cleanup
    if (testPromptId) {
      await supabase.from('prompts').delete().eq('id', testPromptId)
    }
    if (testProblemId) {
      await supabase.from('problems').delete().eq('id', testProblemId)
    }
    if (testUserId) {
      await supabase.auth.admin.deleteUser(testUserId)
    }
  })

  it('should create a prompt', async () => {
    const { data, error } = await supabase
      .from('prompts')
      .insert({
        problem_id: testProblemId,
        title: 'Test Prompt',
        slug: 'test-prompt-' + Date.now(),
        system_prompt: 'You are helpful',
        user_prompt_template: 'Help with {{task}}',
        model: 'gpt-4',
        created_by: testUserId
      })
      .select()
      .single()

    expect(error).toBeNull()
    expect(data).toBeDefined()
    expect(data!.title).toBe('Test Prompt')
    testPromptId = data!.id
  })

  it('should enforce RLS policies', async () => {
    // Try to create prompt as anonymous user
    const anonClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const { error } = await anonClient
      .from('prompts')
      .insert({
        problem_id: testProblemId,
        title: 'Unauthorized Prompt',
        slug: 'unauthorized-' + Date.now()
      })

    expect(error).toBeDefined()
    expect(error!.message).toContain('permission')
  })

  it('should auto-create prompt_stats', async () => {
    const { data: stats } = await supabase
      .from('prompt_stats')
      .select('*')
      .eq('prompt_id', testPromptId)
      .single()

    expect(stats).toBeDefined()
    expect(stats!.upvotes).toBe(0)
    expect(stats!.downvotes).toBe(0)
  })
})
```

---

## 🌐 Step 5: Write E2E Tests (3 days)

### Configure Playwright
```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure'
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] }
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] }
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] }
    }
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI
  }
})
```

### Example: Auth E2E Test
```typescript
// tests/e2e/auth.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Authentication', () => {
  test('should sign up new user', async ({ page }) => {
    await page.goto('/signup')

    // Fill signup form
    await page.fill('input[name="email"]', 'newuser@example.com')
    await page.fill('input[name="password"]', 'SecurePassword123!')
    await page.fill('input[name="display_name"]', 'New User')
    await page.fill('input[name="username"]', 'newuser')

    // Submit form
    await page.click('button[type="submit"]')

    // Should redirect to confirmation page
    await expect(page).toHaveURL(/\/confirm/)
    await expect(page.locator('text=Check your email')).toBeVisible()
  })

  test('should sign in existing user', async ({ page }) => {
    await page.goto('/login')

    // Fill login form
    await page.fill('input[name="email"]', 'test@example.com')
    await page.fill('input[name="password"]', 'testpassword123')

    // Submit form
    await page.click('button[type="submit"]')

    // Should redirect to dashboard
    await expect(page).toHaveURL('/dashboard')
    await expect(page.locator('text=Welcome back')).toBeVisible()
  })

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/login')

    await page.fill('input[name="email"]', 'wrong@example.com')
    await page.fill('input[name="password"]', 'wrongpassword')
    await page.click('button[type="submit"]')

    // Should show error message
    await expect(page.locator('text=Invalid')).toBeVisible()
  })

  test('should sign out user', async ({ page }) => {
    // First sign in
    await page.goto('/login')
    await page.fill('input[name="email"]', 'test@example.com')
    await page.fill('input[name="password"]', 'testpassword123')
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL('/dashboard')

    // Then sign out
    await page.click('button:has-text("Sign out")')
    await expect(page).toHaveURL('/')
  })
})
```

### Example: Prompt Creation E2E Test
```typescript
// tests/e2e/prompts.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Prompt Management', () => {
  test.beforeEach(async ({ page }) => {
    // Sign in before each test
    await page.goto('/login')
    await page.fill('input[name="email"]', 'test@example.com')
    await page.fill('input[name="password"]', 'testpassword123')
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL('/dashboard')
  })

  test('should create new prompt', async ({ page }) => {
    await page.goto('/prompts/new')

    // Select problem
    await page.selectOption('select[name="problem_id"]', { index: 1 })

    // Fill prompt form
    await page.fill('input[name="title"]', 'E2E Test Prompt')
    await page.fill('textarea[name="system_prompt"]', 'You are a helpful assistant')
    await page.fill('textarea[name="user_prompt_template"]', 'Help me with {{task}}')
    await page.selectOption('select[name="model"]', 'gpt-4')
    await page.fill('textarea[name="example_input"]', 'Test input')
    await page.fill('textarea[name="example_output"]', 'Test output')

    // Submit form
    await page.click('button[type="submit"]')

    // Should redirect to prompt detail page
    await expect(page).toHaveURL(/\/prompts\//)
    await expect(page.locator('text=E2E Test Prompt')).toBeVisible()
  })

  test('should vote on prompt', async ({ page }) => {
    // Go to a prompt page
    await page.goto('/prompts')
    await page.click('.prompt-card:first-child a')

    // Click upvote button
    await page.click('button:has-text("Upvote")')

    // Should show updated vote count
    await expect(page.locator('text=1 upvote')).toBeVisible()
  })

  test('should fork prompt', async ({ page }) => {
    await page.goto('/prompts')
    await page.click('.prompt-card:first-child a')

    // Click fork button
    await page.click('button:has-text("Fork")')

    // Fill fork modal
    await page.fill('input[name="title"]', 'Forked Prompt')
    await page.fill('textarea[name="notes"]', 'Improved version')
    await page.click('button:has-text("Create Fork")')

    // Should redirect to new fork
    await expect(page).toHaveURL(/\/prompts\//)
    await expect(page.locator('text=Forked Prompt')).toBeVisible()
    await expect(page.locator('text=Fork')).toBeVisible()
  })

  test('should compare prompts', async ({ page }) => {
    await page.goto('/prompts')

    // Add first prompt to comparison
    await page.click('.prompt-card:first-child button:has-text("Compare")')
    await expect(page.locator('text=1 prompt selected')).toBeVisible()

    // Add second prompt
    await page.click('.prompt-card:nth-child(2) button:has-text("Compare")')
    await expect(page.locator('text=2 prompts selected')).toBeVisible()

    // Go to comparison page
    await page.click('a:has-text("Compare")')
    await expect(page).toHaveURL('/compare')
    await expect(page.locator('.comparison-view')).toBeVisible()
  })
})
```

---

## 🤖 Step 6: Set Up CI/CD (1 day)

### Create GitHub Actions Workflow
```yaml
# .github/workflows/test.yml
name: Test

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run unit tests
        run: npm run test -- --run
        env:
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/coverage-final.json

  e2e-tests:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Install Playwright
        run: npx playwright install --with-deps
      
      - name: Run E2E tests
        run: npm run test:e2e
        env:
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}
      
      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 30
```

### Add Pre-commit Hook
```bash
# Install husky
npm install -D husky lint-staged

# Initialize husky
npx husky install

# Add pre-commit hook
npx husky add .husky/pre-commit "npx lint-staged"
```

```json
// package.json
{
  "lint-staged": {
    "*.{ts,tsx}": [
      "eslint --fix",
      "vitest related --run"
    ]
  }
}
```

---

## 📊 Step 7: Test Coverage Goals

### Coverage Targets
- **Overall:** 70%+
- **Critical paths:** 90%+
- **Business logic:** 80%+
- **UI components:** 60%+

### Run Coverage Report
```bash
npm run test:coverage
```

### View Coverage Report
```bash
open coverage/index.html
```

---

## ✅ Testing Checklist

### Week 1: Setup & Unit Tests
- [ ] Install dependencies
- [ ] Configure Vitest
- [ ] Write setup files
- [ ] Test 5 server actions
- [ ] Test 5 components
- [ ] Test 5 utility functions
- [ ] Achieve 50% coverage

### Week 2: Integration & E2E Tests
- [ ] Configure Playwright
- [ ] Write database integration tests
- [ ] Write 3 E2E test suites (auth, prompts, problems)
- [ ] Test critical user flows
- [ ] Achieve 70% coverage

### Week 3: CI/CD & Polish
- [ ] Set up GitHub Actions
- [ ] Add pre-commit hooks
- [ ] Fix failing tests
- [ ] Document testing practices
- [ ] Train team on testing

---

## 🎯 Priority Tests to Write First

### Critical (Write These First)
1. **Authentication**
   - Sign up
   - Sign in
   - Sign out
   - Password reset

2. **Prompt Creation**
   - Create prompt
   - Update prompt
   - Delete prompt
   - Fork prompt

3. **Voting**
   - Upvote
   - Downvote
   - Clear vote

4. **RLS Policies**
   - Unauthorized access blocked
   - Authorized access allowed
   - Ownership verified

### Important (Write These Second)
5. **Problem Management**
6. **User Profiles**
7. **Search & Filtering**
8. **Workspace Management**

### Nice to Have (Write These Last)
9. **UI Components**
10. **Utility Functions**
11. **Edge Cases**

---

## 🚀 Quick Start (Today)

### 1. Install Dependencies (15 min)
```bash
npm install -D vitest @vitejs/plugin-react @testing-library/react @testing-library/jest-dom jsdom
npm install -D @playwright/test
npx playwright install
```

### 2. Create Config Files (15 min)
- Copy `vitest.config.ts` from above
- Copy `playwright.config.ts` from above
- Create `tests/setup.ts`

### 3. Write Your First Test (30 min)
```typescript
// tests/unit/example.test.ts
import { describe, it, expect } from 'vitest'

describe('Example Test', () => {
  it('should pass', () => {
    expect(1 + 1).toBe(2)
  })
})
```

### 4. Run Tests
```bash
npm run test
```

**If tests pass, you're ready to write real tests!** 🎉

---

## 📚 Resources

- **Vitest Docs:** https://vitest.dev
- **Testing Library:** https://testing-library.com
- **Playwright:** https://playwright.dev
- **Test Best Practices:** https://kentcdodds.com/blog/common-mistakes-with-react-testing-library

---

## 💡 Testing Best Practices

1. **Test behavior, not implementation**
2. **Write tests before fixing bugs**
3. **Keep tests simple and readable**
4. **Use descriptive test names**
5. **Don't test third-party libraries**
6. **Mock external dependencies**
7. **Test edge cases**
8. **Run tests before committing**

---

**Start with the Quick Start section and write your first test today!** 🚀
