# ⚡ QUICK TEST SCRIPT - 30 MIN VERSION

**Goal:** Verify critical flows work before launch  
**Time:** 30 minutes  
**Focus:** Must-work features only

---

## 🎯 CRITICAL FLOWS (Must Work)

### Test 1: Anonymous Browsing (5 min)

**Open incognito window → http://localhost:3000**

```
✅ Homepage loads without errors
✅ "Top Rated Prompts" section shows
✅ "Trending Problems" section shows
✅ Click a prompt card → navigates to detail
✅ Click a problem card → navigates to detail
✅ Open console (F12) → no "permission denied" errors
```

**Navigate to /problems**
```
✅ Problems list loads
✅ Author attribution shows on cards
✅ Click a problem → shows detail page
✅ Prompts list shows on problem detail
```

**Navigate to /prompts**
```
✅ Prompts list loads (12 per page)
✅ Author attribution shows on cards
✅ Pagination works (if >12 prompts)
✅ Click a prompt → shows detail page
```

**Click on any author chip**
```
✅ Navigates to profile page (/u/[username])
✅ Profile header shows (avatar, name, @username)
✅ Tabs work (Prompts, Forks, Problems)
✅ Content displays in tabs
```

**Result:** ⬜ PASS / ⬜ FAIL

---

### Test 2: Sign Up & Sign In (5 min)

**Sign Up:**
```
1. Navigate to /signup
2. Enter: test-user-[timestamp]@example.com
3. Password: TestPassword123!
4. Submit form
5. ✅ Shows "Check your email" message OR redirects to dashboard
6. ✅ No errors in console
```

**Sign In:**
```
1. Navigate to /login
2. Enter credentials from above
3. Submit form
4. ✅ Redirects to /dashboard
5. ✅ User menu shows in nav
6. ✅ Dashboard loads without errors
```

**Result:** ⬜ PASS / ⬜ FAIL

---

### Test 3: Create Problem (3 min)

**From Dashboard:**
```
1. Click "Create Problem" button
2. Fill in:
   - Title: "Test Problem [timestamp]"
   - Description: "This is a test problem"
   - Goal: "Test goal"
   - Inputs: "Test inputs"
   - Constraints: "Test constraints"
   - Success criteria: "Test criteria"
   - Industry: Select any
   - Tags: "test, demo"
   - Visibility: Public
3. Submit form
4. ✅ Redirects to problem detail or workspace
5. ✅ Problem appears in workspace
6. ✅ No errors in console
```

**Result:** ⬜ PASS / ⬜ FAIL

---

### Test 4: Create Prompt (3 min)

**From Problem Detail:**
```
1. Navigate to the problem you just created
2. Click "Create Prompt" or "Submit Prompt"
3. Fill in:
   - Title: "Test Prompt [timestamp]"
   - System prompt: "You are a helpful assistant"
   - Model: Select any
   - Best for: Select any tags
4. Submit form
5. ✅ Prompt appears in problem's prompts list
6. ✅ Stats show (0 upvotes, 0 forks, etc.)
7. ✅ No null errors
8. ✅ No errors in console
```

**Result:** ⬜ PASS / ⬜ FAIL

---

### Test 5: Vote on Prompt (2 min)

**From Prompt Detail:**
```
1. Navigate to the prompt you just created
2. Click upvote button (↑)
3. ✅ Vote count increases to 1
4. ✅ Button shows as active/selected
5. Click upvote again
6. ✅ Vote count decreases to 0
7. ✅ Button shows as inactive
8. Click downvote (↓)
9. ✅ Vote count shows -1
10. ✅ No errors in console
```

**Result:** ⬜ PASS / ⬜ FAIL

---

### Test 6: Fork Prompt (3 min)

**From Prompt Detail:**
```
1. Navigate to any prompt (yours or someone else's)
2. Click "Fork" button
3. Fill in fork modal:
   - Reason: "Testing fork functionality"
   - Changes: "Modified system prompt"
4. Submit fork
5. ✅ Forked prompt is created
6. ✅ Fork count incremented on parent
7. ✅ Fork shows parent attribution
8. ✅ No errors in console
```

**Result:** ⬜ PASS / ⬜ FAIL

---

### Test 7: Settings & Username (3 min)

**From Dashboard:**
```
1. Navigate to /settings
2. Try to claim username:
   - Enter: "admin" → ✅ Should be blocked (reserved)
   - Enter: "test-user-123" → ✅ Should be available
3. Claim the available username
4. Change display name to "Test User"
5. Click "Save Changes"
6. ✅ Shows success message
7. Refresh page
8. ✅ Changes persist
9. ✅ No errors in console
```

**Result:** ⬜ PASS / ⬜ FAIL

---

### Test 8: Private Content Protection (3 min)

**Create Private Problem:**
```
1. Create a new problem
2. Set visibility to "Private"
3. Submit
4. Copy the problem URL
5. Open new incognito window
6. Paste the URL
7. ✅ Should NOT be accessible (404 or redirect)
8. ✅ Should NOT appear in /problems list
9. ✅ Should NOT appear in your profile (when logged out)
```

**Result:** ⬜ PASS / ⬜ FAIL

---

### Test 9: Console Errors Check (2 min)

**Throughout All Tests:**
```
1. Keep console open (F12)
2. Check for:
   ✅ No "permission denied" errors
   ✅ No 500 errors
   ✅ No uncaught exceptions
   ✅ No infinite loops
   ✅ No RLS policy violations
3. Check Network tab:
   ✅ No 404s on assets
   ✅ No failed API calls
   ✅ Response times reasonable (<2s)
```

**Result:** ⬜ PASS / ⬜ FAIL

---

### Test 10: Mobile Check (1 min)

**Quick Mobile Test:**
```
1. Open DevTools (F12)
2. Toggle device toolbar (Ctrl+Shift+M)
3. Select iPhone or Android
4. Navigate through:
   - Homepage ✅
   - Problems list ✅
   - Prompt detail ✅
   - Dashboard ✅
5. Check:
   ✅ Navigation works
   ✅ Cards display properly
   ✅ Forms are usable
   ✅ No horizontal scroll
```

**Result:** ⬜ PASS / ⬜ FAIL

---

## 📊 QUICK TEST RESULTS

### Summary:
- Test 1 (Anonymous): ⬜ PASS / ⬜ FAIL
- Test 2 (Auth): ⬜ PASS / ⬜ FAIL
- Test 3 (Create Problem): ⬜ PASS / ⬜ FAIL
- Test 4 (Create Prompt): ⬜ PASS / ⬜ FAIL
- Test 5 (Vote): ⬜ PASS / ⬜ FAIL
- Test 6 (Fork): ⬜ PASS / ⬜ FAIL
- Test 7 (Settings): ⬜ PASS / ⬜ FAIL
- Test 8 (Private Content): ⬜ PASS / ⬜ FAIL
- Test 9 (Console): ⬜ PASS / ⬜ FAIL
- Test 10 (Mobile): ⬜ PASS / ⬜ FAIL

**Total Passed:** __ / 10

---

## ✅ PASS CRITERIA

**Ready to Launch if:**
- 9/10 or 10/10 tests pass
- No critical security issues
- No data loss bugs
- No permission denied errors on public content

**Need to Fix if:**
- 7/10 or fewer tests pass
- Any security issue found
- Data loss possible
- Permission denied on public content

---

## 🐛 ISSUES FOUND

**Document any issues here:**

```
Issue #1:
- Test: [which test]
- Steps: [what you did]
- Expected: [what should happen]
- Actual: [what happened]
- Priority: HIGH / MEDIUM / LOW
- Error message: [if any]

Issue #2:
...
```

---

## 🚀 AFTER TESTING

### If All Tests Pass (9-10/10):
1. ✅ Enable leaked password protection in Supabase
2. ✅ Deploy to production (git push)
3. ✅ Run same tests in production
4. ✅ Monitor for 1 hour
5. 🎉 Launch!

### If Issues Found (7-8/10):
1. Document all issues
2. Fix HIGH priority issues
3. Re-test
4. Then launch

### If Major Issues (6/10 or less):
1. Document all issues
2. Fix all HIGH and MEDIUM priority issues
3. Full re-test
4. Consider delaying launch

---

## 💡 TESTING TIPS

1. **Use Incognito:** Always test anonymous flows in incognito
2. **Check Console:** Keep F12 open throughout
3. **Take Screenshots:** Capture any errors
4. **Test Real Data:** Use realistic content, not just "test"
5. **Try Edge Cases:** Empty fields, long text, special characters
6. **Test Twice:** If something fails, try again to confirm

---

## 📝 TEST DATA CREATED

**Record for cleanup later:**

```
Users:
- Email: test-user-[timestamp]@example.com
- Username: test-user-123

Problems:
- ID: [record problem ID]
- Slug: test-problem-[timestamp]

Prompts:
- ID: [record prompt ID]
```

---

**Ready to test? Start with Test 1! ⚡**
