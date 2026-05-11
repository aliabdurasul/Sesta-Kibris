# FIRST_ANALYSIS_PROMPT.md
# Use this FIRST when you open the project in Cursor for the first time.
# This recovers structure and gives you a clean starting point.

---

## STEP 1 — Paste this into Cursor Chat (first thing, every new project):

```
You are the persistent AI CTO for SestaKıbrıs.
Read .cursorrules carefully before anything else.

FIRST TASK: Full project forensic analysis.
Do NOT change any code. Analysis only.

Analyze the entire project and give me:

1. ARCHITECTURE OVERVIEW
   - What framework/stack is actually being used
   - What's in src/app/ route groups
   - What API routes exist
   - What services/lib files exist
   - What's in package.json vs what's actually used

2. WHAT WORKS
   - Features that appear complete and correct
   - Files that look solid

3. WHAT'S BROKEN OR RISKY
   - Missing files that are imported somewhere
   - Broken imports
   - Type errors visible in files
   - Missing environment variables referenced in code
   - Direct db.order.update() calls (violates state machine rule)
   - tenant_id from request body (security violation)
   - localStorage usage for business state

4. TECHNICAL DEBT LIST
   - God context / massive state files
   - Components over 200 lines
   - any TypeScript
   - Hardcoded values (IDs, slugs, amounts)
   - Duplicate logic across files

5. DEPLOYMENT RISKS
   - Missing or incorrect next.config.ts settings
   - Environment variable issues
   - Middleware problems
   - RLS policies not enforced
   - Missing error boundaries

6. RECOVERY ROADMAP
   - Ordered list of what to fix first
   - Estimated effort (small/medium/large) for each

7. FOLDER CLEANUP SUGGESTIONS
   - Files that can be deleted
   - Files that should be moved
   - Naming inconsistencies

8. MVP READINESS ASSESSMENT
   - Which modules from MVP_SCOPE.md are actually complete
   - Which are partially done
   - Which haven't started
   - Honest % estimate: "how close to deployable are we?"

Format this as a structured report. Be brutally honest.
```

---

## STEP 2 — After you get the analysis, prioritize fixes:

Copy the "WHAT'S BROKEN" section from the analysis.
Then ask Cursor:

```
From this risk list, sort by:
1. BLOCKER (prevents deployment)
2. CRITICAL (data integrity / security)
3. HIGH (breaks key user flow)
4. MEDIUM (poor UX but works)
5. LOW (cosmetic / nice to have)

Then give me a fix order for blockers and criticals only.
We fix those first before adding any features.
```

---

## STEP 3 — Fix blockers one at a time:

```
Fix ONLY this one issue: [PASTE ONE BLOCKER FROM THE LIST]

Before fixing:
- Which files need to change?
- What is the root cause?
- What is the minimal safe fix?

Do NOT touch other files.
Do NOT refactor while fixing.
After fixing, tell me what to test.
```

---

## WHAT "STABLE" MEANS FOR THIS PROJECT

The project is stable when ALL of these pass:

```bash
npm run build        # Zero errors, zero warnings
npm run type-check   # Zero TypeScript errors
npm run lint         # Zero ESLint errors
```

AND in the browser:
- [ ] No console errors on page load
- [ ] Login flow works end-to-end
- [ ] Can place a test order (iyzico sandbox)
- [ ] Merchant panel receives the order (realtime)
- [ ] Merchant can confirm the order
- [ ] Courier can accept and deliver
- [ ] Admin can see everything

Until all of these pass: NO new features.

---

## ENVIRONMENT VARIABLE CHECKLIST

Before any deployment, verify these exist in Vercel:

```
NEXT_PUBLIC_SUPABASE_URL          ✓/✗
NEXT_PUBLIC_SUPABASE_ANON_KEY     ✓/✗
SUPABASE_SERVICE_ROLE_KEY         ✓/✗  (server only, NEVER public)
UPSTASH_REDIS_REST_URL            ✓/✗
UPSTASH_REDIS_REST_TOKEN          ✓/✗
IYZICO_API_KEY                    ✓/✗
IYZICO_SECRET_KEY                 ✓/✗
IYZICO_BASE_URL                   ✓/✗
NETGSM_API_KEY                    ✓/✗
NETGSM_USER_CODE                  ✓/✗
NEXT_PUBLIC_POSTHOG_KEY           ✓/✗
SENTRY_DSN                        ✓/✗
```

Missing any of these = deployment will silently fail in production.
