# Implementation Tasks: Workspace Permission System

## Phase 1: Database Schema & Core Functions

### 1. Create Database Schema
- [x] 1.1 Create problem_members table with composite PK
- [x] 1.2 Create validate_problem_member_workspace() trigger function
- [x] 1.3 Create validate_problem_member_workspace_trigger
- [x] 1.4 Backfill problems.workspace_id into default personal workspaces
- [x] 1.5 Add NOT NULL constraint to problems.workspace_id (after backfill)
- [x] 1.6 Update problems table visibility columns
- [x] 1.7 Update prompts table flags (remove visibility, add is_listed/is_hidden/is_deleted)

### 2. Create Helper Functions
- [x] 2.1 Create is_workspace_member() function
- [x] 2.2 Create get_workspace_role() function
- [x] 2.3 Create get_explicit_problem_role() function
- [x] 2.4 Create get_problem_role() function
- [x] 2.5 Create can_view_problem() function
- [x] 2.6 Create can_edit_problem() function
- [x] 2.7 Create can_manage_workspace() function
- [x] 2.8 Create can_view_workspace() function
- [x] 2.9 Create can_manage_problem() function
- [x] 2.10 Create can_submit_prompt() function
- [x] 2.11 Create can_edit_prompt() function
- [x] 2.12 Create can_manage_prompt() function

### 3. Create Performance Indexes
- [x] 3.1 Create idx_workspace_members_lookup index
- [x] 3.2 Create idx_problem_members_lookup index
- [x] 3.3 Create idx_problem_members_user index
- [x] 3.4 Create idx_problems_workspace index
- [x] 3.5 Create idx_prompts_problem index
- [x] 3.6 Create idx_problems_visibility index
- [x] 3.7 Create idx_prompts_flags index

### 4. Update RLS Policies
- [x] 4.1 Update workspace_members RLS policies
- [x] 4.2 Update problem_members RLS policies
- [x] 4.3 Update problems RLS policies (use helper functions)
- [x] 4.4 Update prompts RLS policies (inherit from problem)
- [x] 4.5 Enable and force RLS on all tables

## Phase 2: Application Layer

### 5. Create TypeScript Service Layer
- [x] 5.1 Create WorkspaceMembershipManager service
- [ ] 5.2 Create ProblemMembershipManager service
- [ ] 5.3 Create AuthorizationService
- [ ] 5.4 Add request-scoped caching layer
- [ ] 5.5 Create role validation utilities

### 6. Update API Routes
- [ ] 6.1 Update workspace member management endpoints
- [ ] 6.2 Update problem member management endpoints
- [ ] 6.3 Update problem CRUD endpoints with permission checks
- [ ] 6.4 Update prompt CRUD endpoints with permission checks
- [ ] 6.5 Add batch permission check endpoints

### 7. Update UI Components
- [ ] 7.1 Update workspace selector with role badges
- [ ] 7.2 Update workspace settings page (member management)
- [ ] 7.3 Update problem page with role-based actions
- [ ] 7.4 Update prompt editor with permission checks
- [ ] 7.5 Add workspace invite UI (Phase 4 prep)
- [ ] 7.6 Update navigation based on can_view_workspace()

## Phase 3: Testing & Validation

### 8. Unit Tests
- [ ] 8.1 Test is_workspace_member() function
- [ ] 8.2 Test get_workspace_role() function
- [ ] 8.3 Test get_explicit_problem_role() function
- [ ] 8.4 Test get_problem_role() function
- [ ] 8.5 Test can_view_problem() with all visibility types
- [ ] 8.6 Test can_edit_problem() with all roles
- [ ] 8.7 Test can_manage_workspace() function
- [ ] 8.8 Test can_view_workspace() function
- [ ] 8.9 Test can_manage_problem() function
- [ ] 8.10 Test can_submit_prompt() function
- [ ] 8.11 Test can_edit_prompt() with created_by checks
- [ ] 8.12 Test can_manage_prompt() function

### 9. Integration Tests
- [ ] 9.1 Test workspace member addition/removal cascade
- [ ] 9.2 Test problem-level role override scenarios
- [ ] 9.3 Test private problem access control
- [ ] 9.4 Test hidden problem visibility (admin/owner only)
- [ ] 9.5 Test last owner removal prevention
- [ ] 9.6 Test workspace membership prerequisite for problem members
- [ ] 9.7 Test prompt ownership after access loss
- [ ] 9.8 Test concurrent role updates

### 10. Property-Based Tests
- [ ] 10.1 Test role inheritance consistency property
- [ ] 10.2 Test permission monotonicity property
- [ ] 10.3 Test cascade consistency property
- [ ] 10.4 Test attribution preservation property

### 11. Security Tests
- [ ] 11.1 Test privilege escalation prevention
- [ ] 11.2 Test admin cannot promote to owner
- [ ] 11.3 Test workspace membership bypass prevention
- [ ] 11.4 Test SQL injection resistance
- [ ] 11.5 Test RLS policy enforcement
- [ ] 11.6 Test authorization logic bypass prevention

## Phase 4: Documentation & Deployment

### 12. Documentation
- [ ] 12.1 Document API endpoints with permission requirements
- [ ] 12.2 Create migration guide for existing data
- [ ] 12.3 Document role hierarchy and permissions
- [ ] 12.4 Create troubleshooting guide
- [ ] 12.5 Update developer onboarding docs

### 13. Deployment
- [ ] 13.1 Create production migration script
- [ ] 13.2 Test migration on staging environment
- [ ] 13.3 Create rollback plan
- [ ] 13.4 Deploy to production
- [ ] 13.5 Monitor performance metrics
- [ ] 13.6 Verify all permission checks working correctly

## Phase 5: Future Enhancements (Optional)

### 14. Audit Logging
- [ ] 14.1* Create permission_audit_log table
- [ ] 14.2* Create log_permission_change() trigger function
- [ ] 14.3* Add triggers to workspace_members table
- [ ] 14.4* Add triggers to problem_members table
- [ ] 14.5* Create audit log viewer UI

### 15. Workspace Invites
- [ ] 15.1* Create workspace_invites table
- [ ] 15.2* Create invite generation endpoint
- [ ] 15.3* Create invite acceptance endpoint
- [ ] 15.4* Create invite management UI
- [ ] 15.5* Add email notifications for invites

### 16. Performance Optimization
- [ ] 16.1* Implement batch_can_view_problems() function
- [ ] 16.2* Add Redis caching layer for role lookups
- [ ] 16.3* Optimize N+1 query patterns
- [ ] 16.4* Add database query monitoring
- [ ] 16.5* Create performance benchmarks
