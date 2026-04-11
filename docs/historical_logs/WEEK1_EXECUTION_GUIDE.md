# Week 1 Execution Guide

**When:** First week after launch  
**Priority:** High (but not urgent)  
**Time Required:** 15 minutes  
**Risk Level:** Low (all migrations are safe)

---

## 🎯 Goals

1. **Stop report spam** - Prevent duplicate reports from inflating counts
2. **Reduce CPU waste** - Consolidate 3 redundant triggers to 1
3. **Improve UX** - Enable "Already Reported" UI state

---

## 📋 Pre-Flight Checklist

Before applying migrations:

- [ ] Backup your database (Supabase does this automatically, but verify)
- [ ] Test migrations on local/staging first (if available)
- [ ] Schedule during low-traffic window (optional)
- [ ] Have rollback plan ready (see below)

---

## 🚀 Execution Order

### Priority #1: Report Deduplication (15 min)

**File:** `week1_report_deduplication.sql`

**What it does:**
1. Removes any existing duplicate reports (keeps earliest)
2. Adds partial unique index (prevents future spam)
3. Recalculates report_count on prompts and problems
4. Creates helper function for UI state

**Apply via Supabase MCP:**

```javascript
// Using Kiro with supabase-hosted power
await kiroPowers.use({
  powerName: 'supabase-hosted',
  serverName: 'supabase',
  toolName: 'apply_migration',
  arguments: {
    project_id: 'yknsbonffoaxxcwvxrls',
    name: 'week1_report_deduplication',
    query: '<paste contents of week1_report_deduplication.sql>'
  }
});
```

**Or via Supabase CLI:**

```bash
supabase db push --file week1_report_deduplication.sql
```

**Expected output:**
```
NOTICE: Deleted X duplicate reports
CREATE INDEX
UPDATE X (prompts updated)
UPDATE X (problems updated)
CREATE FUNCTION
```

**Verification:**
```sql
-- Should return 0 rows
SELECT 
  content_type, content_id, reporter_id, COUNT(*) 
FROM reports
WHERE status IN ('pending', 'reviewed')
GROUP BY content_type, content_id, reporter_id
HAVING COUNT(*) > 1;
```

---

### Priority #2: Consolidate Triggers (5 min)

**File:** `week1_consolidate_triggers.sql`

**What it does:**
1. Drops 2 redundant triggers
2. Enhances remaining trigger function
3. Reduces CPU overhead by 66%

**Apply via Supabase MCP:**

```javascript
await kiroPowers.use({
  powerName: 'supabase-hosted',
  serverName: 'supabase',
  toolName: 'apply_migration',
  arguments: {
    project_id: 'yknsbonffoaxxcwvxrls',
    name: 'week1_consolidate_triggers',
    query: '<paste contents of week1_consolidate_triggers.sql>'
  }
});
```

**Expected output:**
```
DROP TRIGGER
DROP TRIGGER
CREATE FUNCTION
NOTICE: Trigger consolidation complete. Reduced from 3 triggers to 1.
```

**Verification:**
```sql
-- Should return 1 row
SELECT tgname 
FROM pg_trigger
WHERE tgrelid = 'problems'::regclass
  AND tgname LIKE '%pinned%';
```

---

## 🧪 Post-Migration Testing

### Test Report Deduplication

```sql
-- Try to create duplicate report (should fail)
INSERT INTO reports (content_type, content_id, reporter_id, reason, status)
VALUES ('prompt', '<some-prompt-id>', auth.uid(), 'test', 'pending');

-- Try again (should fail with unique constraint error)
INSERT INTO reports (content_type, content_id, reporter_id, reason, status)
VALUES ('prompt', '<same-prompt-id>', auth.uid(), 'test', 'pending');
-- Expected: ERROR: duplicate key value violates unique constraint
```

### Test UI Helper Function

```sql
-- Check if user has reported something
SELECT has_active_report('prompt', '<some-prompt-id>');
-- Should return true if reported, false otherwise
```

### Test Trigger Consolidation

```sql
-- Try to pin invalid prompt (should fail with clear error)
UPDATE problems 
SET pinned_prompt_id = '00000000-0000-0000-0000-000000000000'
WHERE id = (SELECT id FROM problems LIMIT 1);
-- Expected: ERROR: Pinned prompt must belong to this problem...
```

---

## 🔄 Rollback Plan (If Needed)

### Rollback Report Deduplication

```sql
-- Drop the unique index
DROP INDEX IF EXISTS reports_active_unique;

-- Drop the helper function
DROP FUNCTION IF EXISTS has_active_report;

-- Note: Don't rollback the de-duplication or count fixes
-- Those are data corrections, not schema changes
```

### Rollback Trigger Consolidation

```sql
-- Recreate the dropped triggers
CREATE TRIGGER trg_enforce_pinned_prompt
  BEFORE INSERT OR UPDATE OF pinned_prompt_id
  ON problems
  FOR EACH ROW
  EXECUTE FUNCTION enforce_pinned_prompt_belongs_to_problem();

CREATE TRIGGER trg_validate_pinned_prompt
  BEFORE INSERT OR UPDATE
  ON problems
  FOR EACH ROW
  EXECUTE FUNCTION validate_pinned_prompt();
```

---

## 📊 Success Metrics

After applying migrations, monitor:

### Report Spam Prevention
- [ ] No duplicate reports in `reports` table
- [ ] Report counts match reality
- [ ] UI shows "Already Reported" state correctly

### Performance
- [ ] Problem updates are faster (check logs)
- [ ] No increase in error rates
- [ ] Trigger overhead reduced

### User Experience
- [ ] Users can't spam reports
- [ ] Clear error messages when trying to duplicate
- [ ] Report button shows correct state

---

## 🎨 UI Integration (Optional)

After applying report deduplication, update your UI:

### React/Next.js Example

```typescript
// In your report form component
const { data: alreadyReported } = await supabase
  .rpc('has_active_report', {
    p_content_type: 'prompt',
    p_content_id: promptId
  });

if (alreadyReported) {
  return (
    <button disabled className="opacity-50">
      Already Reported
    </button>
  );
}

return (
  <button onClick={handleReport}>
    Report
  </button>
);
```

### Benefits
- Reduces confusion ("Why can't I report this?")
- Prevents unnecessary API calls
- Improves perceived performance
- Reduces moderator noise

---

## 🐛 Troubleshooting

### "Duplicate key value violates unique constraint"

**Cause:** Existing duplicate reports weren't cleaned up  
**Fix:** Run Step 0 of report deduplication migration manually

### "Trigger not found"

**Cause:** Trigger names don't match your schema  
**Fix:** Check actual trigger names with:
```sql
SELECT tgname FROM pg_trigger 
WHERE tgrelid = 'problems'::regclass;
```

### "Report counts still wrong"

**Cause:** Migration ran but counts weren't recalculated  
**Fix:** Run Step 2 of report deduplication migration manually

---

## 📅 Timeline

**Day 1 (Launch):**
- Monitor for any issues
- Watch for report spam patterns

**Day 3-5 (Week 1):**
- Apply report deduplication migration
- Test thoroughly
- Monitor for 24 hours

**Day 6-7 (Week 1):**
- Apply trigger consolidation migration
- Verify performance improvement
- Clean up unused functions (optional)

---

## ✅ Completion Checklist

- [ ] Report deduplication migration applied
- [ ] Trigger consolidation migration applied
- [ ] All verification queries pass
- [ ] UI updated to show "Already Reported" state
- [ ] No errors in logs
- [ ] Performance metrics stable or improved
- [ ] Users can't spam reports
- [ ] Report counts are accurate

---

## 🎉 What Happens Next

After Week 1 migrations:

**Week 2:**
- Optimize `auth.uid()` calls in RLS policies
- Drop duplicate indexes
- Monitor query performance

**Week 3-4:**
- Review unused indexes
- Consider additional performance optimizations
- Plan for scale

**Month 2:**
- Evaluate if any post-launch features need schema changes
- Review security advisors again
- Celebrate successful launch! 🚀

---

**Prepared by:** Kiro AI  
**Last Updated:** January 27, 2026  
**Status:** Ready to execute
