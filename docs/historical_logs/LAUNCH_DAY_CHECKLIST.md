# 🚀 LAUNCH DAY CHECKLIST

**Date:** January 29, 2026  
**Project:** Prompto  
**Target:** Production Launch

---

## ⏰ TIMELINE

### Pre-Launch (2-3 hours before)
- [ ] Complete manual testing
- [ ] Fix any critical bugs
- [ ] Enable security features
- [ ] Final verification

### Launch (30 min)
- [ ] Deploy to production
- [ ] Verify deployment
- [ ] Smoke test in production
- [ ] Monitor initial traffic

### Post-Launch (First 24 hours)
- [ ] Monitor errors
- [ ] Watch analytics
- [ ] Respond to issues
- [ ] Celebrate! 🎉

---

## 📋 PRE-LAUNCH CHECKLIST

### 1. Manual Testing ✅
**Time:** 30-60 minutes  
**File:** `QUICK_TEST_SCRIPT.md`

- [ ] Test 1: Anonymous browsing
- [ ] Test 2: Sign up & sign in
- [ ] Test 3: Create problem
- [ ] Test 4: Create prompt
- [ ] Test 5: Vote on prompt
- [ ] Test 6: Fork prompt
- [ ] Test 7: Settings & username
- [ ] Test 8: Private content protection
- [ ] Test 9: Console errors check
- [ ] Test 10: Mobile check

**Result:** __ / 10 tests passed

**Issues Found:** [Document in QUICK_TEST_SCRIPT.md]

---

### 2. Fix Critical Bugs (if any) 🔧
**Time:** Variable (0-2 hours)

- [ ] Review issues from testing
- [ ] Fix HIGH priority issues
- [ ] Re-test affected flows
- [ ] Verify fixes work

**Bugs Fixed:**
```
1. [Bug description] - FIXED
2. [Bug description] - FIXED
```

---

### 3. Enable Security Features 🔒
**Time:** 5 minutes

#### Leaked Password Protection
- [ ] Go to: https://supabase.com/dashboard/project/yknsbonffoaxxcwvxrls
- [ ] Navigate to: Authentication → Policies → Password
- [ ] Enable: "Check for leaked passwords (HaveIBeenPwned)"
- [ ] Save changes
- [ ] Verify: Try to sign up with "password123" → should be blocked

**Status:** ⬜ ENABLED

---

### 4. Final Code Review 👀
**Time:** 10 minutes

- [ ] Check `.env.local` has correct Supabase URL
- [ ] Verify no console.log() in production code
- [ ] Check no TODO comments for critical features
- [ ] Verify all migrations applied to database
- [ ] Check package.json has correct dependencies

**Status:** ⬜ REVIEWED

---

### 5. Database Verification ✅
**Time:** 5 minutes

Run these queries in Supabase SQL Editor:

```sql
-- Verify RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('problems', 'prompts', 'profiles', 'votes', 'reports');
-- Should show rowsecurity = true for all

-- Verify indexes exist
SELECT indexname FROM pg_indexes 
WHERE schemaname = 'public' 
AND indexname LIKE 'idx_%';
-- Should show 12+ indexes

-- Verify functions exist
SELECT routine_name, security_type 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN ('get_ranked_prompts', 'update_vote_stats', 'increment_fork_stats');
-- Should show all 3 functions

-- Verify no orphaned data
SELECT COUNT(*) FROM prompts WHERE problem_id NOT IN (SELECT id FROM problems);
-- Should return 0

SELECT COUNT(*) FROM votes WHERE prompt_id NOT IN (SELECT id FROM prompts);
-- Should return 0
```

**Status:** ⬜ VERIFIED

---

### 6. Performance Check ⚡
**Time:** 5 minutes

- [ ] Check ISR caching configured:
  - Homepage: 60s
  - Problems: 120s
  - Prompts: 120s
  - Profiles: 300s
- [ ] Verify rate limiting middleware active
- [ ] Check Vercel Analytics installed
- [ ] Verify image optimization configured

**Status:** ⬜ VERIFIED

---

## 🚀 LAUNCH SEQUENCE

### Step 1: Commit & Push 📤
**Time:** 2 minutes

```bash
# Make sure all changes are committed
git status

# If there are uncommitted changes:
git add .
git commit -m "Final pre-launch verification"

# Push to main branch (triggers Vercel deployment)
git push origin main
```

**Status:** ⬜ PUSHED

---

### Step 2: Monitor Deployment 👀
**Time:** 5-10 minutes

- [ ] Go to Vercel Dashboard
- [ ] Watch build logs
- [ ] Verify build succeeds
- [ ] Check for TypeScript errors
- [ ] Wait for deployment to complete
- [ ] Note production URL

**Production URL:** https://________.vercel.app

**Status:** ⬜ DEPLOYED

---

### Step 3: Production Smoke Test 🧪
**Time:** 10 minutes

**Open production URL in incognito:**

```
Quick Checks:
- [ ] Homepage loads (no errors)
- [ ] Browse problems works
- [ ] Browse prompts works
- [ ] Sign up works
- [ ] Sign in works
- [ ] Create problem works
- [ ] Create prompt works
- [ ] Vote works
- [ ] Profile page works
- [ ] No console errors
```

**Status:** ⬜ VERIFIED

---

### Step 4: Monitor Initial Traffic 📊
**Time:** 30-60 minutes

- [ ] Open Vercel Analytics
- [ ] Watch for errors in Vercel logs
- [ ] Check Supabase dashboard for activity
- [ ] Monitor response times
- [ ] Watch for any 500 errors

**Metrics to Watch:**
- Response time: Should be <2s
- Error rate: Should be <1%
- Database connections: Should be stable
- Memory usage: Should be normal

**Status:** ⬜ MONITORING

---

## 📊 POST-LAUNCH MONITORING

### First Hour
- [ ] Check every 10 minutes
- [ ] Watch for errors
- [ ] Monitor performance
- [ ] Test critical flows
- [ ] Respond to any issues immediately

### First 24 Hours
- [ ] Check every 2-4 hours
- [ ] Review analytics
- [ ] Check error logs
- [ ] Monitor database performance
- [ ] Watch for abuse patterns

### First Week
- [ ] Daily check-ins
- [ ] Review user feedback
- [ ] Monitor key metrics
- [ ] Plan Week 1 improvements

---

## 🚨 ROLLBACK PLAN

### If Critical Issue Found:

**Option 1: Quick Fix**
```bash
# Fix the issue locally
git add .
git commit -m "Hotfix: [description]"
git push origin main
# Wait for Vercel to redeploy (~5 min)
```

**Option 2: Rollback**
1. Go to Vercel Dashboard
2. Find previous working deployment
3. Click "Promote to Production"
4. Fix issue locally
5. Redeploy when ready

**Option 3: Maintenance Mode**
1. Add maintenance page to Vercel
2. Fix issue thoroughly
3. Test locally
4. Redeploy
5. Remove maintenance page

---

## 📈 SUCCESS METRICS

### Launch Day Goals:
- [ ] Zero critical errors
- [ ] <2s average response time
- [ ] >95% uptime
- [ ] At least 1 successful user signup
- [ ] At least 1 problem created
- [ ] At least 1 prompt created

### Week 1 Goals:
- [ ] 10+ user signups
- [ ] 5+ problems created
- [ ] 20+ prompts created
- [ ] 50+ votes cast
- [ ] Zero security incidents
- [ ] <1% error rate

---

## 🎉 LAUNCH ANNOUNCEMENT

### When to Announce:
- ✅ After production smoke test passes
- ✅ After monitoring for 1 hour with no issues
- ✅ When you're confident it's stable

### Where to Announce:
- [ ] Twitter/X
- [ ] LinkedIn
- [ ] Reddit (relevant subreddits)
- [ ] Product Hunt (optional)
- [ ] Hacker News (optional)
- [ ] Your network

### Announcement Template:
```
🚀 Excited to launch Prompto!

A platform for discovering, comparing, and improving AI prompts.

✨ Features:
- Browse curated prompt libraries
- Compare prompts side-by-side
- Fork and improve existing prompts
- Track what works with community reviews

Built with Next.js, Supabase, and Tailwind CSS.

Check it out: [your-url]

Feedback welcome! 🙏
```

---

## 📝 LAUNCH LOG

### Pre-Launch
- **Testing Started:** [time]
- **Testing Completed:** [time]
- **Issues Found:** [count]
- **Issues Fixed:** [count]
- **Security Enabled:** [time]

### Launch
- **Code Pushed:** [time]
- **Build Started:** [time]
- **Build Completed:** [time]
- **Deployment Live:** [time]
- **Smoke Test Passed:** [time]

### Post-Launch
- **First User Signup:** [time]
- **First Problem Created:** [time]
- **First Prompt Created:** [time]
- **First Issue Reported:** [time]
- **Announcement Posted:** [time]

---

## 🔧 WEEK 1 IMPROVEMENTS

### Planned Enhancements:
1. [ ] Set up error monitoring (Sentry)
2. [ ] Add per-endpoint rate limiting
3. [ ] Build moderator UI
4. [ ] Set up analytics dashboards
5. [ ] Add bot protection (if needed)
6. [ ] Optimize based on real usage data

### Based on User Feedback:
- [ ] [Feature request 1]
- [ ] [Feature request 2]
- [ ] [Bug report 1]
- [ ] [Bug report 2]

---

## ✅ FINAL CHECKLIST

**Before clicking "Deploy":**
- [ ] All tests pass (9-10/10)
- [ ] Critical bugs fixed
- [ ] Leaked password protection enabled
- [ ] Database verified
- [ ] Code reviewed
- [ ] Performance checked
- [ ] Rollback plan ready
- [ ] Monitoring tools ready
- [ ] Team notified (if applicable)
- [ ] Coffee ready ☕

**After deployment:**
- [ ] Production smoke test passed
- [ ] Monitoring active
- [ ] No critical errors
- [ ] Response times good
- [ ] Ready to announce

---

## 🎯 LAUNCH DECISION

### ✅ GO FOR LAUNCH IF:
- 9-10/10 tests pass
- No critical security issues
- No data loss bugs
- Performance is acceptable
- Rollback plan ready

### ⚠️ DELAY LAUNCH IF:
- 7/10 or fewer tests pass
- Critical security issue found
- Data loss possible
- Major performance issues
- Not confident in stability

### 🚫 DO NOT LAUNCH IF:
- Authentication broken
- Data loss occurring
- Security vulnerability found
- RLS not working
- Critical features broken

---

## 📞 SUPPORT CONTACTS

**If Issues Arise:**
- Vercel Support: https://vercel.com/support
- Supabase Support: https://supabase.com/support
- Next.js Docs: https://nextjs.org/docs
- Your team: [contact info]

---

## 🎉 CONGRATULATIONS!

**You've built something amazing!**

Remember:
- Launch is just the beginning
- Iterate based on real usage
- Listen to user feedback
- Keep improving
- Celebrate the wins! 🎊

**Good luck with your launch! 🚀**

---

**Signed off by:** [Your name]  
**Date:** [Date]  
**Time:** [Time]  
**Status:** ⬜ READY TO LAUNCH
