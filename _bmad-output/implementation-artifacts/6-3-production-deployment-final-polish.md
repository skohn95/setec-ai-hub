# Story 6.3: Production Deployment & Final Polish

Status: in-progress

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **product owner**,
I want **the platform deployed and production-ready**,
So that **users can reliably access and use the system**.

**NFRs addressed:** NFR1, NFR6, NFR8

## Acceptance Criteria

1. **Given** the application needs production deployment, **When** deployment is configured, **Then** the app is deployed to Vercel with production environment variables **And** HTTPS is enforced on all routes (handled by Vercel) **And** the custom domain is configured (if applicable) **And** environment variables are set for production Supabase project

2. **Given** production Supabase needs configuration, **When** the production project is set up, **Then** all migrations from development are applied **And** RLS policies are verified as active **And** Storage bucket policies are verified **And** the MVP user account is created with secure credentials **And** email templates are configured and tested

3. **Given** the application needs final testing, **When** end-to-end testing is performed, **Then** the complete Maria user journey works:
   1. Login with credentials
   2. Create new conversation
   3. Chat with agent about MSA
   4. Navigate to Templates, download MSA template
   5. Upload filled template in chat
   6. Receive analysis results with charts
   7. Ask follow-up questions
   8. View results in conversation history
   9. Logout
**And** password recovery flow is tested with real email **And** error scenarios are tested (invalid file, API timeout)

4. **Given** the UI needs final polish, **When** visual review is performed, **Then** all text is in Spanish with no English remnants **And** Setec branding (colors, logo) is consistently applied **And** loading states show appropriate feedback (skeletons, spinners) **And** the interface works on desktop (1024px+) and is viewable on mobile **And** no console errors appear during normal use

5. **Given** monitoring needs to be in place, **When** the app is in production, **Then** Vercel provides basic analytics and error tracking **And** critical errors are visible in Vercel logs **And** OpenAI API usage can be monitored via their dashboard **And** Supabase usage can be monitored via their dashboard

6. **Given** documentation needs to be complete, **When** handoff is prepared, **Then** README includes: how to run locally, environment variables required, how to deploy, how to create additional users (manual process for MVP) **And** the MVP user credentials are documented securely

## Tasks / Subtasks

- [x] **Task 1: Audit Current Codebase State** (AC: #3, #4)
  - [x] Run full test suite and verify all tests pass
  - [x] Review console for any warnings or errors during dev
  - [x] Check for any TODO/FIXME comments that need resolution
  - [x] Verify all components render without errors
  - [x] Create inventory of any incomplete features or known issues

- [x] **Task 2: Spanish Language Audit** (AC: #4)
  - [x] Review all UI text in components for English remnants
  - [x] Review all error messages in constants/messages.ts
  - [x] Review toast notifications and alerts
  - [x] Review page titles and metadata
  - [x] Review form labels and placeholders
  - [x] Review button text and CTAs
  - [x] Fix any English text found

- [x] **Task 3: Setec Branding Verification** (AC: #4)
  - [x] Verify Setec colors (Orange #F7931E, Charcoal #3D3D3D, White #FFFFFF)
  - [x] Verify logo placement in header
  - [x] Check color consistency across all pages
  - [x] Verify dark mode colors if applicable
  - [x] Check button hover and focus states use brand colors
  - [x] Verify chart colors match brand palette

- [x] **Task 4: Loading States Review** (AC: #4)
  - [x] Verify skeleton loaders on conversation list
  - [x] Verify loading spinner on message send
  - [x] Verify streaming indicator during AI response
  - [x] Verify file upload progress indicator
  - [x] Verify analysis processing indicator
  - [x] Add any missing loading states

- [x] **Task 5: Responsive Design Verification** (AC: #4)
  - [x] Test desktop layout at 1024px, 1280px, 1440px
  - [x] Test mobile layout at 375px, 414px
  - [x] Verify sidebar collapse on mobile
  - [x] Verify chat interface on mobile
  - [x] Verify templates page on mobile
  - [x] Verify privacy page on mobile
  - [x] Fix any layout issues found

- [x] **Task 6: Console Error Cleanup** (AC: #4)
  - [x] Run app in development, check console for errors
  - [x] Run app in production build, check console for errors
  - [x] Fix React hydration warnings if any
  - [x] Fix missing key props if any
  - [x] Fix deprecated API usage if any
  - [x] Verify no console.log statements in production code

- [x] **Task 7: Environment Variables Documentation** (AC: #6)
  - [x] Update .env.example with all required variables
  - [x] Add comments explaining each variable
  - [x] Document which variables are public vs secret
  - [x] Create separate production values checklist
  - [x] Verify all env vars are used in code

- [x] **Task 8: Vercel Production Configuration** (AC: #1)
  - [x] Review vercel.json for production settings
  - [ ] Configure production environment variables in Vercel
  - [x] Set correct region (iad1) for latency
  - [x] Configure Python function runtime settings
  - [ ] Test deploy to preview environment first
  - [ ] Deploy to production environment

- [ ] **Task 9: Supabase Production Setup** (AC: #2)
  - [ ] Create production Supabase project (or use existing)
  - [ ] Run all database migrations
  - [ ] Verify RLS policies are enabled and correct
  - [ ] Create Storage bucket with correct policies
  - [ ] Configure Auth settings (email templates, redirect URLs)
  - [ ] Create MVP user account with secure password
  - [ ] Test auth flow in production

- [ ] **Task 10: Email Templates Testing** (AC: #2)
  - [ ] Verify password reset email template in Spanish
  - [ ] Test password reset flow end-to-end
  - [ ] Verify email deliverability (check spam folder)
  - [ ] Update email template branding if needed
  - [ ] Document email configuration for future reference

- [ ] **Task 11: Maria User Journey E2E Testing** (AC: #3)
  - [ ] Test login with valid credentials
  - [ ] Test create new conversation
  - [ ] Test chat with agent about MSA (without file)
  - [ ] Test navigate to Templates section
  - [ ] Test download MSA template
  - [ ] Test upload filled template
  - [ ] Test receive analysis results with charts
  - [ ] Test chart interactivity (hover, tooltips)
  - [ ] Test chart export as PNG
  - [ ] Test ask follow-up questions
  - [ ] Test view results in conversation history
  - [ ] Test logout and session clearance

- [ ] **Task 12: Error Scenario Testing** (AC: #3)
  - [ ] Test invalid file format upload
  - [ ] Test file exceeding size limit
  - [ ] Test invalid file content (wrong columns)
  - [ ] Test network disconnect during operation
  - [ ] Test OpenAI API timeout (if possible to simulate)
  - [ ] Test session expiration handling
  - [ ] Verify all error messages display correctly

- [ ] **Task 13: Password Recovery Testing** (AC: #3)
  - [ ] Test request password reset
  - [ ] Verify reset email received
  - [ ] Test reset link functionality
  - [ ] Test setting new password
  - [ ] Test login with new password
  - [ ] Test expired reset link handling

- [ ] **Task 14: Performance Verification** (AC: #4)
  - [ ] Run Lighthouse audit on main pages
  - [ ] Verify initial page load under 3 seconds
  - [ ] Verify chat response starts streaming within 2 seconds
  - [ ] Check bundle sizes are reasonable
  - [ ] Verify no memory leaks during extended use

- [ ] **Task 15: Security Verification** (AC: #1)
  - [ ] Verify HTTPS is enforced
  - [ ] Verify API routes check authentication
  - [ ] Verify RLS prevents unauthorized data access
  - [ ] Verify no secrets exposed in client bundle
  - [ ] Verify storage policies prevent unauthorized access
  - [ ] Run basic security checklist

- [x] **Task 16: Update README Documentation** (AC: #6)
  - [x] Add project overview section
  - [x] Add local development setup instructions
  - [x] Add environment variables guide
  - [x] Add deployment instructions
  - [x] Add MVP user creation instructions
  - [x] Add troubleshooting section
  - [x] Add contact/support information

- [ ] **Task 17: Final Production Deploy** (AC: #1, #5)
  - [ ] Merge all changes to main branch
  - [ ] Deploy to production
  - [ ] Verify production app loads correctly
  - [ ] Run abbreviated E2E test on production
  - [ ] Verify Vercel analytics/logs are working
  - [ ] Monitor for errors during first hour

- [ ] **Task 18: Create Handoff Documentation** (AC: #6)
  - [ ] Document MVP user credentials securely
  - [ ] Document Supabase project details
  - [ ] Document Vercel project configuration
  - [ ] Document OpenAI API key location
  - [ ] Create maintenance checklist
  - [ ] Document known limitations

## Dev Notes

### Critical Architecture Patterns

**Story 6.3 Focus:**
This is the final story of the MVP, focusing on production deployment, testing, polish, and documentation. All features should already be implemented - this story is about verification, polish, and deployment.

**Current Project State (from Sprint Status):**
- Epic 1-5: All stories done
- Epic 6: Stories 6.1 (Privacy Page) and 6.2 (Error Handling) done
- 976+ tests passing
- All core features implemented

**Key Files to Review:**

1. **Configuration Files:**
   - `vercel.json` - Vercel configuration
   - `.env.example` - Environment variables template
   - `next.config.ts` - Next.js configuration
   - `tailwind.config.ts` - Tailwind/brand colors

2. **Supabase Setup:**
   - Database migrations (if any SQL files exist)
   - RLS policies (in Supabase dashboard or SQL files)
   - Storage bucket configuration
   - Auth configuration

3. **Documentation:**
   - `README.md` - Main documentation file

### Production Environment Variables

```bash
# Required for Production
NEXT_PUBLIC_SUPABASE_URL=https://[project-id].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...  # Server-side only
OPENAI_API_KEY=sk-...
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
```

### Vercel Configuration Checklist

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "framework": "nextjs",
  "regions": ["iad1"],
  "functions": {
    "api/*.py": {
      "runtime": "python3.11",
      "maxDuration": 60
    }
  }
}
```

### Supabase Production Checklist

1. **Database:**
   - [ ] All tables created (conversations, messages, files, analysis_results, token_usage)
   - [ ] All indexes created
   - [ ] RLS enabled on all tables
   - [ ] RLS policies verified

2. **Storage:**
   - [ ] Bucket "analysis-files" created
   - [ ] 10MB file limit set
   - [ ] MIME types restricted to Excel
   - [ ] Storage policies verified

3. **Auth:**
   - [ ] Email provider enabled
   - [ ] Redirect URLs configured (localhost + production)
   - [ ] Spanish email templates configured
   - [ ] MVP user created

### Maria User Journey Test Script

```
1. Open https://your-app.vercel.app
2. Login with MVP user credentials
3. Verify redirect to dashboard
4. Click "Nueva conversacion"
5. Send: "Necesito hacer un analisis MSA"
6. Verify agent response guides to templates
7. Navigate to "Plantillas" section
8. Download MSA template
9. Fill template with test data (or use pre-filled test file)
10. Return to chat, upload template
11. Verify analysis results appear with charts
12. Hover charts to verify tooltips
13. Export chart as PNG
14. Ask: "Que significan estos resultados?"
15. Verify follow-up answer uses context
16. Navigate to sidebar, verify conversation visible
17. Click conversation to reload it
18. Verify messages and charts reload correctly
19. Click logout
20. Verify redirect to login page
```

### Known Test Data

For E2E testing, create or use a test MSA file with:
- 10+ parts
- 2+ operators
- 2+ measurements per part/operator
- Known expected %GRR result for verification

### Previous Story Learnings (Story 6.2)

From Story 6.2:
- 976 tests passing after implementation
- Comprehensive error handling in place
- ErrorBoundary wraps entire app
- OfflineBanner shows when network unavailable
- Retry utilities available for network operations
- Error logging structured for future monitoring
- All error messages in Spanish

**Key Patterns to Follow:**
- All UI text in Spanish
- Use Setec brand colors consistently
- Console-free production code
- Comprehensive test coverage

### Spanish Text Audit Checklist

Review these locations for English text:
- `app/(auth)/login/page.tsx`
- `app/(auth)/recuperar-password/page.tsx`
- `app/(dashboard)/page.tsx`
- `app/(dashboard)/plantillas/page.tsx`
- `app/(dashboard)/privacidad/page.tsx`
- All components in `components/`
- All constants in `constants/messages.ts`
- Error messages in `lib/utils/error-utils.ts`
- Toast messages in hooks

### Brand Colors Reference

```css
/* Setec Brand Colors */
--setec-orange: #F7931E;
--setec-charcoal: #3D3D3D;
--setec-white: #FFFFFF;

/* Usage */
/* Primary buttons: orange background */
/* Text: charcoal on white, white on dark */
/* Accents: orange for links, highlights */
/* Charts: orange, charcoal, variations */
```

### Performance Benchmarks

Target metrics for production:
- First Contentful Paint: < 1.5s
- Largest Contentful Paint: < 2.5s
- Time to Interactive: < 3s
- Cumulative Layout Shift: < 0.1
- Bundle size (main): < 500KB gzipped

### Security Checklist

1. **Authentication:**
   - [ ] All dashboard routes require auth
   - [ ] Login redirects work correctly
   - [ ] Session persists across refreshes
   - [ ] Logout clears session

2. **API Security:**
   - [ ] All API routes verify authentication
   - [ ] Service role key not exposed to client
   - [ ] CORS configured correctly

3. **Data Security:**
   - [ ] RLS prevents cross-user data access
   - [ ] Storage policies enforce user isolation
   - [ ] No raw file content sent to OpenAI

### Monitoring Setup

**Vercel:**
- Analytics enabled (automatic)
- Error tracking via logs
- Function usage visible in dashboard

**Supabase:**
- Database usage in dashboard
- Storage usage in dashboard
- Auth logs available

**OpenAI:**
- API usage visible in platform
- Cost tracking available
- Rate limit monitoring

### README Template Structure

```markdown
# Setec AI Hub

## Overview
Brief description of the platform

## Local Development

### Prerequisites
- Node.js 20+
- npm 10+
- Supabase account
- OpenAI API key

### Setup
1. Clone repository
2. Install dependencies
3. Configure environment variables
4. Run development server

### Environment Variables
Table of all required variables

## Deployment

### Vercel
Deployment instructions

### Supabase
Database/Auth setup instructions

## Creating Additional Users
Manual process for MVP

## Troubleshooting
Common issues and solutions

## Support
Contact information
```

### File Structure Changes

**Files to Create:**
- None expected (polish and deploy only)

**Files to Modify:**
- `README.md` - Complete documentation
- `.env.example` - Complete with comments
- Possibly some components for Spanish text fixes
- Possibly some styles for brand color consistency

**No new components or features should be added in this story.**

### Dependencies

**No new dependencies required.**

This is a polish and deployment story - all features should already be complete.

### Testing Strategy

**Manual Testing Focus:**
- Complete Maria user journey
- Password recovery flow
- Error scenarios
- Responsive design
- Browser compatibility (Chrome, Firefox, Safari)

**Automated Testing:**
- Run full test suite before deploy
- Verify no regressions

### Architectural Decisions

1. **Deploy Order:** Deploy frontend to Vercel first, then verify Supabase connection.

2. **Environment Separation:** Use separate Supabase projects for dev and production.

3. **MVP User:** Create manually in Supabase dashboard, document credentials securely.

4. **Monitoring:** Use built-in Vercel/Supabase analytics for MVP. Add dedicated monitoring (Sentry, DataDog) post-MVP if needed.

5. **Documentation:** README is primary documentation. Keep it concise and actionable.

### References

- [Source: epics.md#story-63-production-deployment-final-polish] - Story requirements and ACs
- [Source: architecture.md#configuracion-de-vercel] - Vercel configuration details
- [Source: architecture.md#configuracion-de-auth] - Supabase Auth configuration
- [Source: architecture.md#patrones-de-nombrado] - Naming conventions
- [Source: prd.md#requisitos-no-funcionales] - NFR requirements
- [Source: prd.md#maria-primer-analisis] - Complete Maria user journey
- [Source: 6-2-error-handling-user-feedback.md] - Previous story patterns and learnings

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List

