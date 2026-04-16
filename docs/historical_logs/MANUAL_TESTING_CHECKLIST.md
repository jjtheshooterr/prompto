# 🧪 MANUAL TESTING CHECKLIST

**Date:** January 28, 2026  
**Purpose:** Verify all critical flows before launch  
**Time Required:** ~1 hour

---

## 🎭 TEST SCENARIOS BY USER ROLE

### 1️⃣ ANONYMOUS USER (Not Logged In)

#### Homepage
- [ ] Visit homepage (/)
- [ ] Verify page loads without errors
- [ ] Check "Top Rated Prompts" section displays
- [ ] Check "Trending Problems" section displays
- [ ] Verify no "permission denied" errors in console
- [ ] Click on a prompt card → should navigate to prompt detail
- [ ] Click on a problem card → should navigate to problem detail

#### Browse Problems
- [ ] Visit /problems
- [ ] Verify problems list loads
- [ ] Check pagination works (if more than 10 problems)
- [ ] Verify author attribution shows on cards
- [ ] Click on a problem → should show problem detail
- [ ] Verify no private problems are visible

#### Problem Detail
- [ ] Visit a public problem (e.g., /problems/[slug])
- [ ] Verify problem details display
- [ ] Check prompts list shows for this problem
- [ ] Verify author attribution on problem
- [ ] Click on a prompt → should navigate to prompt detail
- [ ] Try to access a private problem → should show 404 or redirect

#### All Prompts
- [ ] Visit /prompts
- [ ] Verify prompts list loads (12 per page)
- [ ] Check pagination works
- [ ] Verify author attribution shows on cards
- [ ] Check "Compare" button exists
- [ ] Click "Compare" on 2-3 prompts
- [ ] Verify prompts added to comparison

#### Compare
- [ ] Visit /compare (after adding prompts)
- [ ] Verify selected prompts display
- [ ] Check side-by-side comparison works
- [ ] Verify author attribution shows
- [ ] Try to remove a prompt from comparison
- [ ] Clear all prompts

#### Profile Pages
- [ ] Visit a profile page (e.g., /u/[username])
- [ ] Verify profile header displays (avatar, name, @username)
- [ ] Check stats display (reputation, upvotes, forks)
- [ ] Click "Prompts" tab → should show user's prompts
- [ ] Click "Forks" tab → should show user's forks
- [ ] Click "Problems" tab → should show user's problems
- [ ] Verify only public content is visible
- [ ] Click on author chip from any card → should navigate to profile

#### Navigation
- [ ] Verify "Sign In" button shows in nav
- [ ] Click "Sign In" → should navigate to /login
- [ ] Verify "Sign Up" link exists
- [ ] Check all nav links work

---

### 2️⃣ AUTHENTICATED USER (Logged In)

#### Sign Up Flow
- [ ] Visit /signup
- [ ] Enter email and password
- [ ] Submit form
- [ ] Check for email confirmation message
- [ ] Verify no errors
- [ ] Check email for confirmation link (if email configured)

#### Sign In Flow
- [ ] Visit /login
- [ ] Enter credentials
- [ ] Submit form
- [ ] Verify redirect to dashboard
- [ ] Check user menu shows in nav
- [ ] Verify "Sign Out" option exists

#### Dashboard
- [ ] Visit /dashboard
- [ ] Verify stats display:
  - [ ] Problems created count
  - [ ] Prompts submitted count
  - [ ] Forks created count
- [ ] Check "Recent Prompts" section
- [ ] Check "Top Rated Prompts" section
- [ ] Verify "Create Problem" button exists
- [ ] Click on a prompt → should navigate to detail

#### Settings
- [ ] Visit /settings
- [ ] Verify profile info displays
- [ ] Try to change display name
- [ ] Try to claim a username (if not claimed)
- [ ] Check username availability (try "admin" - should be blocked)
- [ ] Try to upload avatar
- [ ] Click "Save Changes"
- [ ] Verify success message
- [ ] Refresh page → changes should persist

#### Create Problem
- [ ] Click "Create Problem" from dashboard
- [ ] Fill in problem details:
  - [ ] Title
  - [ ] Description
  - [ ] Goal
  - [ ] Inputs
  - [ ] Constraints
  - [ ] Success criteria
  - [ ] Industry
  - [ ] Tags
- [ ] Select visibility (private/unlisted/public)
- [ ] Submit form
- [ ] Verify redirect to problem detail or workspace
- [ ] Check problem appears in workspace

#### Create Prompt
- [ ] Navigate to a problem detail page
- [ ] Click "Create Prompt" or "Submit Prompt"
- [ ] Fill in prompt details:
  - [ ] Title
  - [ ] System prompt
  - [ ] User prompt template (optional)
  - [ ] Model
  - [ ] Best for tags
  - [ ] Improvement summary
- [ ] Submit form
- [ ] Verify prompt appears in problem's prompts list
- [ ] Check prompt stats are created (no null errors)

#### Fork Prompt
- [ ] Navigate to a prompt detail page
- [ ] Click "Fork" button
- [ ] Fill in fork details:
  - [ ] Reason for fork
  - [ ] Changes made
- [ ] Submit fork
- [ ] Verify forked prompt is created
- [ ] Check fork count incremented on parent
- [ ] Verify fork shows parent attribution

#### Vote on Prompt
- [ ] Navigate to a prompt detail page
- [ ] Click upvote button
- [ ] Verify vote count increases
- [ ] Click upvote again → should remove vote
- [ ] Click downvote → should change to downvote
- [ ] Verify score updates correctly
- [ ] Refresh page → vote should persist

#### Review Prompt
- [ ] Navigate to a prompt detail page
- [ ] Find "Review" section
- [ ] Submit "Works" review
- [ ] Verify works count increases
- [ ] Try to submit another review → should update existing
- [ ] Change to "Fails" review
- [ ] Verify counts update correctly

#### Report Content
- [ ] Navigate to a prompt or problem
- [ ] Click "Report" button
- [ ] Select reason
- [ ] Add description
- [ ] Submit report
- [ ] Verify success message
- [ ] Try to report same content again → should show error (duplicate)

#### Workspace
- [ ] Visit /workspace
- [ ] Verify owned problems display
- [ ] Check problem cards show correctly
- [ ] Try to change problem visibility
- [ ] Verify changes save

---

### 3️⃣ MEMBER OF PRIVATE PROBLEM

#### Setup
- [ ] Create a private problem (as User A)
- [ ] Add User B as member (if member management exists)
- [ ] Log in as User B

#### Access Tests
- [ ] Visit private problem URL
- [ ] Verify User B can see the problem
- [ ] Check User B can see prompts in the problem
- [ ] Verify User B can create prompts
- [ ] Try to access as anonymous → should be blocked
- [ ] Try to access as User C (non-member) → should be blocked

---

### 4️⃣ PROBLEM OWNER/ADMIN

#### Problem Management
- [ ] Visit owned problem
- [ ] Try to edit problem details
- [ ] Change visibility
- [ ] Pin a prompt (if feature exists)
- [ ] Verify changes save

#### Member Management (if exists)
- [ ] Add a member to problem
- [ ] Change member role
- [ ] Remove a member
- [ ] Verify member access updates

---

## 🔍 EDGE CASES & ERROR STATES

### Username System
- [ ] Try to claim username "admin" → should be blocked
- [ ] Try to claim username "API" → should be blocked (case-insensitive)
- [ ] Try to claim username with spaces → should be blocked
- [ ] Try to claim username with special chars → should be blocked
- [ ] Try to claim already-taken username → should show "not available"
- [ ] Claim valid username → should succeed

### Content Safety
- [ ] Try to create prompt with `<script>alert('xss')</script>` → should be blocked
- [ ] Try to create problem with `javascript:alert(1)` → should be blocked
- [ ] Create normal content → should succeed

### Deleted Content
- [ ] Create a prompt
- [ ] Soft delete it (set is_deleted = true via SQL)
- [ ] Verify it doesn't appear in:
  - [ ] Browse prompts
  - [ ] Problem detail prompts list
  - [ ] Profile prompts tab
  - [ ] Compare
  - [ ] Search (if exists)

### Deleted Author
- [ ] Create content as User A
- [ ] Delete User A's profile (or simulate)
- [ ] Verify content shows "Deleted User" as author
- [ ] Verify content is still accessible
- [ ] Verify no email leak

### Rate Limiting
- [ ] Make 200+ requests quickly → should get 429 error
- [ ] Wait 1 minute → should work again

### Private Content Leakage
- [ ] Create private problem
- [ ] Try to access via:
  - [ ] Direct URL (anonymous) → should be blocked
  - [ ] Profile page → should not appear
  - [ ] Browse problems → should not appear
  - [ ] Compare → should not be addable
  - [ ] Search → should not appear

---

## 🐛 COMMON ISSUES TO CHECK

### Console Errors
- [ ] Open browser console (F12)
- [ ] Navigate through app
- [ ] Check for:
  - [ ] No "permission denied" errors
  - [ ] No 500 errors
  - [ ] No uncaught exceptions
  - [ ] No infinite loops
  - [ ] No memory leaks

### Network Tab
- [ ] Open Network tab
- [ ] Check for:
  - [ ] No 404s on assets
  - [ ] No failed API calls
  - [ ] Reasonable response times (<2s)
  - [ ] Proper caching headers

### Performance
- [ ] Homepage loads in <3s
- [ ] Browse pages load in <2s
- [ ] Detail pages load in <2s
- [ ] No layout shifts (CLS)
- [ ] Images load properly

### Mobile Responsiveness
- [ ] Test on mobile viewport
- [ ] Check navigation works
- [ ] Verify forms are usable
- [ ] Check cards display properly

---

## ✅ CRITICAL FLOWS SUMMARY

**Must Work:**
1. ✅ Anonymous can browse public content
2. ✅ Sign up and sign in work
3. ✅ Create problem works
4. ✅ Create prompt works
5. ✅ Fork prompt works
6. ✅ Vote works
7. ✅ Profile pages work
8. ✅ Username claiming works
9. ✅ Private content is protected
10. ✅ No XSS vulnerabilities

**Should Work:**
- Settings page
- Avatar upload
- Report content
- Compare prompts
- Workspace management

**Nice to Have:**
- Member management
- Moderator tools
- Analytics

---

## 📝 TESTING NOTES

### Issues Found:
```
[Record any issues you find here]

Example:
- [ ] Issue: Username validation not working
  - Steps: Tried to claim "test123"
  - Expected: Should work
  - Actual: Got error
  - Priority: HIGH

- [ ] Issue: Avatar upload fails
  - Steps: Uploaded 2MB PNG
  - Expected: Should upload
  - Actual: Got 500 error
  - Priority: MEDIUM
```

### Browser Tested:
- [ ] Chrome
- [ ] Firefox
- [ ] Safari
- [ ] Edge
- [ ] Mobile Safari
- [ ] Mobile Chrome

### Test Data Created:
```
Users:
- test1@example.com / password123
- test2@example.com / password123

Problems:
- [List problem IDs/slugs created]

Prompts:
- [List prompt IDs created]
```

---

## 🎯 PASS/FAIL CRITERIA

### ✅ PASS (Ready to Launch)
- All critical flows work
- No permission denied errors
- No XSS vulnerabilities
- Private content protected
- Username system works
- No console errors on happy path

### ❌ FAIL (Need to Fix)
- Any critical flow broken
- Permission denied on public content
- XSS vulnerability found
- Private content leaking
- Username system broken
- Frequent console errors

---

## 🚀 AFTER TESTING

### If All Tests Pass:
1. ✅ Enable leaked password protection in Supabase
2. ✅ Deploy to production
3. ✅ Monitor for first 24 hours
4. ✅ Set up error monitoring (Week 1)

### If Issues Found:
1. Document all issues
2. Prioritize (HIGH/MEDIUM/LOW)
3. Fix HIGH priority issues
4. Re-test
5. Then launch

---

**Good luck with testing! 🎉**

