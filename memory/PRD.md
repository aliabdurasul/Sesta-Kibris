# GapGel — Hyperlocal Marketplace + Logistics OS

## Problem Statement (verbatim)
Build a complete multi-role frontend application. GapGel is a hyperlocal marketplace + logistics operating system for Northern Cyprus (TRNC). Supports Customers, Merchants, Couriers, and Admin. Full order lifecycle simulated end-to-end. Pure frontend, in-memory + localStorage. Turkish UI.

## Architecture
- Pure React + Context + useReducer + localStorage hydration (key: `gapgel-state-v1`)
- Pre-seeded: 3 merchants (Fresh Market market / Aqua Express water / GasGo gas), 3 couriers (Ali Yılmaz / Maya Çelik / Rauf Patel), 1 customer (Demo Kullanıcı)
- Top-bar role switcher; mobile shell for Müşteri/Kurye; desktop tabs/sidebar for Satıcı/Yönetici
- Auto-timers: 30s otomatik iptal for unaccepted paid orders, 15s yeniden atama for unpicked-up courier orders
- Constants: COURIER_FEE_PER_DELIVERY=$2, DELIVERY_FEE=$1.50

## Localization
- **Full Turkish UI** — all visible strings, status labels, toasts, dialogs, button labels, empty states, role badges. Type labels: market→Market, water→Su, gas→Tüp.
- All `data-testid`s remain English/kebab-case for testability.

## What's been implemented
**Iter 1**: 4-role system, full order lifecycle, customer/merchant/courier/admin screens, auto-dispatch, water/gas self-delivery, role-based visibility. (19/19 pass)

**Iter 2**: Customer rating, courier earnings, admin CSV export & 7-day chart, merchant catalog CRUD + bulk CSV, OTP-gated delivery, tap-to-call, substitution flow, partial refund, 30s auto-cancel, 15s reassign, merchant confirmation rate, cancelled state. (11/13 pass + static review)

**Iter 3 (this iteration)**:
- 💾 **localStorage persistence** — orders, cart, role selections survive page refresh; defensive shape migration; reset-demo button (`reset-demo-button`)
- ⭐ **Per-merchant ratings tab** (`tab-ratings`) — avg score, histogram, customer review list with stars + comment + date
- 🔁 **Customer reorder CTA** — on Orders list (`reorder-{id}`) and order detail (`reorder-from-detail`); skips deleted products with warning toast
- 🇹🇷 **Full Turkish translation** — 100+ strings across all components, status labels, toasts, dialogs, buttons. Couriers and customer renamed to Turkish names. Merchant taglines/products in Turkish.
- Testing: 9/9 directly executed assertions PASS, 6/6 verified via code review

## Known Notes
- localStorage key versioned (`gapgel-state-v1`) so future schema changes can bump key
- All `data-testid` attributes stayed English for tester compatibility
- AUTO_CANCEL_MS=30000ms, REASSIGN_MS=15000ms — for production raise to 600000/180000 (10min/3min as per operator analysis)

## Prioritized Backlog
### P1
- Merchant onboarding wizard with starter CSV template
- Per-customer multi-account demo (currently 1 user)
- Customer notifications (toast queue) for status changes
### P2
- Image upload for catalog products (currently SVG gradient tiles)
- Geofenced merchant filter / nearest-first sorting
- Courier shift on/off toggle (idle/off/busy 3-state)
- Locale switcher (TR/EN) — strings ready to be extracted to i18n module if needed

## Next Tasks
- Optional: extract Turkish strings to a single `i18n/tr.js` module for easier maintenance
- Optional: bump auto-cancel/reassign times to operator-analysis values (10min/3min) and add a "demo speed" toggle in admin
