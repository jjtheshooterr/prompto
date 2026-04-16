# Test Execution Plan - Complete Coverage

**Goal:** Achieve 50-70% test coverage by testing all critical parts of the application

**Status:** Ready to Execute

---

## Phase 1: Server Actions (Priority: CRITICAL)

### 1.1 Vote Actions ✅
**File:** `tests/unit/lib/actions/votes.test.ts`
- Test `setVote()` with upvote (value: 1)
- Test `setVote()` with downvote (value: -1)
- Test `clearVote()`
- Test `getUserVote()`
- Test authentication requirement
- Test error handling

### 1.2 Prompt Actions ✅
**File:** `tests/unit/lib/actions/prompts.test.ts`
- Test `listPromptsByProblem()` with different sort options
- Test `getPromptById()`
- Test `createPrompt()` with valid data
- Test `forkPrompt()`
- Test `forkPromptWithModal()`
- Test `updatePrompt()`
- Test authentication requirements
- Test workspace creation

### 1.3 Problem Actions ✅
**File:** `tests/unit/lib/actions/problems.test.ts`
- Test `listProblems()` with filters
- Test `getProblemBySlug()`
- Test `createProblem()` with valid data
- Test search functionality
- Test industry filtering
- Test pagination

### 1.4 Auth Actions ✅
**File:** `tests/unit/lib/actions/auth.test.ts`
- Test `getUser()`
- Test `signOut()`

### 1.5 Review Actions ✅
**File:** `tests/unit/lib/actions/reviews.test.ts`
- Test `submitReview()` with 'worked' type
- Test `submitReview()` with 'failed' type
- Test `submitReview()` with 'note' type
- Test duplicate review prevention
- Test authentication requirement

### 1.6 Report Actions ✅
**File:** `tests/unit/lib/actions/reports.test.ts`
- Test `createReport()` for prompts
- Test `createReport()` for problems
- Test `updateReportStatus()`
- Test admin permission checks
- Test soft delete functionality

### 1.7 Workspace Actions ✅
**File:** `tests/unit/lib/actions/workspace.test.ts`
- Test `addProblemMember()`
- Test `removeProblemMember()`
- Test permission checks
- Test role validation

---

## Phase 2: React Components (Priority: HIGH)

### 2.1 AuthorChip Component ✅
**File:** `tests/unit/components/AuthorChip.test.tsx`
- Test rendering with username
- Test rendering with display name
- Test rendering with avatar
- Test rendering without avatar
- Test link to profile
- Test different sizes (sm, md, lg)

### 2.2 PromptCard Component ✅
**File:** `tests/unit/components/PromptCard.test.tsx`
- Test rendering prompt title
- Test rendering stats (upvotes, downvotes, score)
- Test rendering fork indicator
- Test rendering author attribution
- Test "View Details" link
- Test "Compare" button
- Test copy system prompt functionality
- Test report modal trigger

### 2.3 ProblemCard Component ✅
**File:** `tests/unit/components/ProblemCard.test.tsx`
- Test rendering problem title
- Test rendering description
- Test rendering tags
- Test rendering industry badge
- Test rendering author
- Test rendering prompt count
- Test link to problem page

### 2.4 ForkModal Component ✅
**File:** `tests/unit/components/ForkModal.test.tsx`
- Test modal open/close
- Test form submission
- Test validation
- Test fork creation

### 2.5 ReportModal Component ✅
**File:** `tests/unit/components/ReportModal.test.tsx`
- Test modal open/close
- Test reason selection
- Test details input
- Test form submission

---

## Phase 3: Authentication & Forms (Priority: HIGH)

### 3.1 SignInForm Component ✅
**File:** `tests/unit/components/auth/SignInForm.test.tsx`
- Test email input
- Test password input
- Test form submission
- Test validation errors
- Test loading state

### 3.2 SignUpForm Component ✅
**File:** `tests/unit/components/auth/SignUpForm.test.tsx`
- Test email input
- Test password input
- Test username input
- Test form submission
- Test validation errors

---

## Phase 4: Utility Functions (Priority: MEDIUM)

### 4.1 Slug Generation ✅
**File:** `tests/unit/lib/utils/slug.test.ts`
- Test slug generation from text
- Test special character removal
- Test space handling
- Test uniqueness suffix

### 4.2 Date Formatting ✅
**File:** `tests/unit/lib/utils/date.test.ts`
- Test date formatting
- Test relative time (e.g., "2 days ago")

### 4.3 Validation Helpers ✅
**File:** `tests/unit/lib/utils/validation.test.ts`
- Test email validation
- Test username validation
- Test URL validation

---

## Phase 5: E2E Tests (Priority: MEDIUM)

### 5.1 Homepage Flow ✅
**File:** `tests/e2e/homepage.spec.ts`
- Test homepage loads
- Test navigation to problems page
- Test navigation to prompts page
- Test search functionality

### 5.2 Authentication Flow ✅
**File:** `tests/e2e/auth.spec.ts`
- Test sign up flow
- Test sign in flow
- Test sign out flow
- Test protected routes

### 5.3 Problem Creation Flow ✅
**File:** `tests/e2e/problem-creation.spec.ts`
- Test problem creation form
- Test form validation
- Test successful creation
- Test redirect after creation

### 5.4 Prompt Creation Flow ✅
**File:** `tests/e2e/prompt-creation.spec.ts`
- Test prompt creation form
- Test form validation
- Test successful creation
- Test redirect after creation

### 5.5 Fork Flow ✅
**File:** `tests/e2e/fork.spec.ts`
- Test fork modal opens
- Test fork form submission
- Test forked prompt appears
- Test fork attribution

---

## Execution Order

### Round 1: Critical Server Actions (30 min)
1. ✅ Vote Actions
2. ✅ Auth Actions
3. ✅ Prompt Actions (basic)
4. ✅ Problem Actions (basic)

### Round 2: Core Components (30 min)
5. ✅ AuthorChip
6. ✅ PromptCard
7. ✅ ProblemCard

### Round 3: Advanced Server Actions (30 min)
8. ✅ Review Actions
9. ✅ Report Actions
10. ✅ Workspace Actions

### Round 4: Forms & Auth (30 min)
11. ✅ SignInForm
12. ✅ SignUpForm
13. ✅ ForkModal
14. ✅ ReportModal

### Round 5: Utilities (15 min)
15. ✅ Slug generation
16. ✅ Date formatting
17. ✅ Validation helpers

### Round 6: E2E Tests (45 min)
18. ✅ Homepage flow
19. ✅ Authentication flow
20. ✅ Problem creation flow
21. ✅ Prompt creation flow
22. ✅ Fork flow

---

## Success Metrics

### Coverage Targets
- **Server Actions:** 70% coverage
- **Components:** 60% coverage
- **Utilities:** 80% coverage
- **Overall:** 50-60% coverage

### Test Counts
- **Unit Tests:** ~100-150 tests
- **Component Tests:** ~50-75 tests
- **E2E Tests:** ~15-25 tests
- **Total:** ~165-250 tests

---

## Commands to Run

```powershell
# Run all unit tests
npm run test

# Run specific test file
npm run test votes

# Run with coverage
npm run test:coverage

# Run E2E tests (requires dev server running)
npm run test:e2e

# Run all tests
npm run test:all
```

---

## Notes

- All tests will use mocked Supabase client (configured in `tests/setup.ts`)
- No real database calls will be made
- Tests focus on business logic and component behavior
- E2E tests will use Playwright's test database

---

**Ready to execute! Let's start with Round 1.**
