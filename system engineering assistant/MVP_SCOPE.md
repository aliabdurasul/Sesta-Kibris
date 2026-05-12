# MVP_SCOPE.md — SestaKıbrıs Frozen MVP
# DO NOT CHANGE THIS WITHOUT A DELIBERATE DECISION.
# Scope creep kills AI-built products. This file is law.

## WHAT THE MVP DOES (AND NOTHING ELSE)

### MODULE 1 — AUTH (All roles)
- [ ] Phone number input → OTP via SMS (Netgsm)
- [ ] 6-digit OTP verify → Supabase session
- [ ] Role-based redirect (customer/merchant/courier/admin)
- [ ] Session persistence (httpOnly cookie)
- [ ] Logout
**NOT INCLUDED:** Social login, email login, password reset, 2FA app

### MODULE 2 — CUSTOMER APP (Mobile-first PWA)
- [ ] Home: market listing (active markets, category filter)
- [ ] Market page: product grid by category
- [ ] Product: add to cart with quantity selector
- [ ] Cart: drawer/page with item list, total, delivery fee
- [ ] Checkout: address select, order notes, iyzico payment
- [ ] Post-payment: order confirmation screen
- [ ] Order tracking: realtime status timeline (Supabase Realtime)
- [ ] Order history: list of past orders
- [ ] Profile: manage addresses
**NOT INCLUDED:** Search across markets, product reviews, loyalty points, referrals, promo codes (V2)

### MODULE 3 — MERCHANT PANEL (Desktop)
- [ ] Dashboard: today's orders count, revenue, pending count
- [ ] Orders kanban: PAID → CONFIRMED → PREPARING → READY columns
- [ ] Order detail: items, customer note, address
- [ ] Order actions: Confirm, Start Preparing, Mark Ready
- [ ] Products: list, add, edit, toggle available/unavailable
- [ ] Categories: manage product categories
- [ ] Pickup OTP: show/verify code when courier arrives
**NOT INCLUDED:** Analytics charts, promotions, inventory alerts, staff management (V2)

### MODULE 4 — COURIER APP (Mobile PWA)
- [ ] Online/Offline toggle (affects dispatch eligibility)
- [ ] Available order notification + accept/reject (120s window)
- [ ] Active order detail: market address + navigation link
- [ ] Pickup OTP: enter 6-digit code from merchant
- [ ] Delivery OTP: enter 6-digit code from customer
- [ ] Order status updates (picked up → in transit → delivered)
- [ ] Earnings summary (today + total)
**NOT INCLUDED:** Route optimization, multi-order batching, shift scheduling (V2)

### MODULE 5 — ADMIN PANEL (Desktop)
- [ ] Live dashboard: active orders, online couriers, float balance
- [ ] All orders: filterable list with manual state override
- [ ] Manual dispatch: assign courier to order manually
- [ ] Merchant management: activate/deactivate, view stats
- [ ] Courier management: approve new couriers, suspend
- [ ] Payout management: pending payouts, mark as processed
- [ ] Dispute queue: view disputes, resolve with refund or no-action
**NOT INCLUDED:** Financial reports, automated payouts (V2), multi-city management

### MODULE 6 — INFRASTRUCTURE
- [ ] Supabase project linked (migrations applied, RLS enabled)
- [ ] Vercel deployment (preview + production)
- [ ] Environment variables configured
- [ ] iyzico sandbox → production key switch
- [ ] Netgsm SMS working
- [ ] Custom domain pointed
- [ ] Sentry error tracking
**NOT INCLUDED:** BullMQ queues (V2), analytics dashboard, CDN optimization

---

## BUILD ORDER (Dependency Graph)

```
Week 1:
  ┌─ Supabase setup + migrations applied
  ├─ Auth (OTP login + role redirect)
  └─ Customer: Market list + product page

Week 2:
  ├─ Customer: Cart + Checkout + iyzico payment
  ├─ iyzico webhook → order state machine
  └─ Customer: Order tracking (realtime)

Week 3:
  ├─ Merchant: Kanban + order actions
  ├─ Merchant: Product CRUD
  └─ Courier: Online toggle + order accept

Week 4:
  ├─ Courier: OTP pickup + delivery
  ├─ Admin: Dashboard + overrides + payouts
  └─ Deploy + smoke test + go live with 1 market
```

---

## DEFINITION OF "DONE" FOR EACH MODULE

A module is DONE when:
1. Works in production (Vercel preview URL, not just local)
2. No console errors
3. Mobile viewport tested (375px width)
4. Correct role cannot access wrong panel (auth boundary works)
5. Tested with real data (not mocked)

A module is NOT done because "it works on my machine."

---

## FEATURES EXPLICITLY EXCLUDED UNTIL V2

```
NEVER add these to the MVP codebase without a team decision:
✗ AI recommendations / smart search
✗ Complex analytics / charts
✗ Loyalty points / gamification
✗ Referral system
✗ Multi-vendor automatic payout (bank API)
✗ Native mobile apps (React Native / Expo)
✗ WhatsApp Business API (stub only — SMS covers MVP)
✗ Multi-city expansion logic
✗ Franchise / white-label tenants
✗ In-app chat / messaging
✗ Product reviews / ratings
✗ Promo code engine
✗ B2B / bulk ordering
✗ Inventory management system
```

If Cursor suggests any of these during MVP, reject it.
