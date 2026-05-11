# SESTAKIBRIS_PROJECT_MEMORY.md

## Project Identity

SestaKıbrıs is a hyperlocal marketplace + logistics operating system for Northern Cyprus (KKTC/TRNC).

Primary Goal:
Launch an operational marketplace MVP with one real market first, then expand gradually.

Target Roles:

* Müşteri (Customer)
* Market/Satıcı (Merchant)
* Kurye (Courier)
* Yönetici (Admin)

Language:

* Turkish-first UI
* TRY currency
* KKTC market localization

---

# Current Project State

## Reality Check

The current project originated as:

* HADE / GapGel frontend simulation MVP
* Pure frontend architecture
* In-memory + localStorage state
* No real backend initially

Over time the project evolved toward:

* Production-oriented SestaKıbrıs marketplace
* Real backend architecture planning
* Supabase + Vercel infrastructure
* Multi-tenant operational marketplace

The current codebase may contain:

* AI-generated architectural inconsistencies
* Duplicate logic
* Large context/reducer files
* Mixed prototype + production patterns
* Deployment instability
* Middleware/routing inconsistencies
* Unused dependencies or experimental code

This is expected during rapid AI-assisted MVP development.

Current priority is:
SYSTEM STABILIZATION — not feature expansion.

---

# Existing Frontend Capabilities

The frontend MVP already includes:

## Customer Features

* Market listing
* Product browsing
* Cart system
* Promo codes
* Reorder CTA
* Order tracking
* Turkish localization
* Ratings/reviews
* Multi-role mobile shell

## Merchant Features

* Product CRUD
* Order management
* Confirmation workflow
* Delivery mode configuration
* Merchant analytics
* Merchant ratings
* CSV bulk catalog import

## Courier Features

* Online/offline toggle
* Courier assignment
* Earnings widget
* OTP delivery verification
* Reassignment timers

## Admin Features

* Merchant approval/suspension
* Delivery mode management
* Platform analytics
* Refund handling
* CSV export
* Order overrides

---

# Current Technical Direction

The project is transitioning from:
Prototype simulation architecture
→
Production-ready marketplace architecture.

Old Prototype Stack:

* React
* Context + useReducer
* localStorage
* simulated payments/auth

Target Production Stack:

* Next.js 14 App Router
* TypeScript
* Supabase
* Tailwind
* TanStack Query
* Zustand (cart only)
* iyzico
* Netgsm
* Vercel

---

# Critical Engineering Principles

## DO NOT

* Rewrite the entire project
* Randomly refactor architecture
* Add unnecessary complexity
* Expand MVP scope
* Install random dependencies
* Break working UI

## DO

* Stabilize existing system
* Recover architecture progressively
* Preserve good frontend assets
* Fix blockers first
* Prioritize deployment stability
* Keep minimal operational architecture

---

# MVP Goal (Frozen)

The MVP is considered successful when:

1. Customer can browse markets/products
2. Customer can place an order
3. Merchant receives and manages order
4. Courier can deliver order
5. Admin can monitor operations
6. System works in production deployment
7. One real KKTC market can operate through it

NOT required yet:

* AI recommendations
* Native apps
* Multi-city support
* Advanced analytics
* Loyalty systems
* Enterprise scalability

---

# Current Recovery Priorities

Priority Order:

1. Project forensic audit
2. Deployment stabilization
3. Environment variable cleanup
4. Middleware/routing fixes
5. Remove dead/duplicate code
6. State management cleanup
7. Backend integration stabilization
8. Operational MVP testing

---

# Known Technical Risks

* Large monolithic context files
* Mixed prototype + production logic
* Potential dependency chaos
* Middleware/auth instability
* Deployment failures
* Possible TypeScript inconsistencies
* localStorage legacy patterns from prototype phase

---

# AI CTO Instructions

You are NOT a generic code assistant.

You are acting as:

* senior software architect
* recovery engineer
* production stabilization engineer
* technical CTO partner

Always:

1. Analyze before coding
2. Explain root cause first
3. Use minimal safe fixes
4. Preserve architecture consistency
5. Avoid unnecessary rewrites
6. Protect operational MVP flow
7. Optimize for deployment stability

The mission is:
Transform the existing MVP into a stable operational marketplace platform for Northern Cyprus.
