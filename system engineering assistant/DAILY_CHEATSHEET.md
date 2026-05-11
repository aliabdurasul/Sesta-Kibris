# ⚡ DAILY WORKFLOW CHEATSHEET
# Print this or keep it open. Follow it every day.

## BEFORE YOU START CODING (5 min)
```
□ What exactly am I building today? (one sentence)
□ Which files will change? (list them)
□ Does this touch orders/payments? → read state machine rules first
□ Does this touch merchants? → check tenant_id rules first
□ Is this in MVP_SCOPE.md? → if not, don't build it
```

## CURSOR SESSION STARTUP (every session)
```
1. Open Cursor
2. Paste CURSOR_CTO_PROMPT.md header into chat
3. State today's specific task
4. Wait for analysis before saying "go"
```

## THE ONLY PROMPTS YOU NEED

**To build something:**
> "Read [file]. I need to add [feature]. Show me the plan first, then implement."

**To fix a bug:**
> "Here is the exact error: [ERROR]. Root cause first. Minimal fix only."

**To understand something:**
> "Explain how [feature] works. Data flow from user action to database. Don't change anything."

**To check if it's safe:**
> "Review [file] for security issues, type errors, and state machine violations."

**When Cursor goes off-track:**
> "Stop. Read .cursorrules. Answer only this: [question]."

## GIT (do this every working feature)
```bash
git add -A
git commit -m "feat(module): description"
git push origin your-branch
```

## DAILY TESTING CHECKLIST
```
□ npm run build → zero errors?
□ npm run type-check → zero errors?
□ Open browser console → zero red errors?
□ Test the specific flow I built today
□ Test on mobile viewport (375px)
□ Check Vercel preview URL (not just local)
```

## WHEN THINGS BREAK
```
1. Don't panic and ask Cursor to "fix everything"
2. git diff → what changed?
3. Copy EXACT error (terminal + console + network)
4. One issue at a time: "Root cause only this error"
5. If it's a mess: git reset --hard HEAD
```

## RED FLAGS — Stop and question Cursor when it:
```
✗ Wants to install a new package you didn't ask for
✗ Suggests localStorage for any business data
✗ Creates a giant Context file
✗ Writes order status directly to DB (not via transitionOrder)
✗ Takes tenant_id from req.body
✗ Suggests adding a feature not in MVP_SCOPE.md
✗ Refactors files you didn't ask about
✗ Says "let me rewrite this component from scratch"
```

## WEEKLY RHYTHM
```
Monday:    Plan the week's module — read MVP_SCOPE.md, pick ONE
Tuesday-Thursday: Build + commit daily
Friday:    Test, deploy preview, fix bugs from testing
Weekend:   No new features — only bugfixes if critical
```

## SUCCESS METRICS (are you moving forward?)
```
Week 1 done: Login works + market list loads in production
Week 2 done: Can place a real iyzico sandbox order + merchant sees it
Week 3 done: Full order flow: order → confirm → courier → deliver
Week 4 done: Admin can manage everything + deployed with 1 real market
```

If you're not hitting these: stop adding features, fix what's broken.
