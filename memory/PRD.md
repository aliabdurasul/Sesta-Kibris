# HADE — Hyperlocal Marketplace + Logistics OS (formerly GapGel)

## Problem Statement (verbatim)
Build a complete multi-role frontend application. HADE is a hyperlocal marketplace + logistics operating system for Northern Cyprus (TRNC). Supports Müşteri (Customer), Satıcı (Merchant), Kurye (Courier), and Yönetici (Admin). Full order lifecycle simulated end-to-end. Pure frontend, in-memory + localStorage. UI in Turkish.

## Architecture
- Pure React + Context (`GapGelContext.jsx`) + useReducer + localStorage hydration (key: `gapgel-state-v1`).
- No backend. Auth, payments, push notifications all simulated in Context.
- Pre-seeded: 3 merchants (Fresh Market / Aqua Express / GasGo), 3 couriers (Ali Yılmaz / Maya Çelik / Rauf Patel), 1 customer (Demo Kullanıcı).
- Top-bar role switcher (shadcn `<Select>`); mobile shell for Müşteri/Kurye, desktop tabs/sidebar for Satıcı/Yönetici.
- Auto-timers: 30s otomatik iptal for unaccepted paid orders, 15s yeniden atama for unpicked-up courier orders.
- Constants: `COURIER_FEE_PER_DELIVERY=$2`, `DELIVERY_FEE=$1.50`, `AUTO_CANCEL_MS=30000`, `REASSIGN_MS=15000`.

## Localization
- Full Turkish UI — all visible strings, status labels, toasts, dialogs, button labels, empty states. Type labels: market→Market, water→Su, gas→Tüp.
- Status labels (`STATUS_LABELS` in seed.js): Oluşturuldu / Ödendi / Kabul Edildi / Hazırlanıyor / Hazır / Yolda / Teslim Edildi / İptal Edildi.
- All `data-testid`s remain English/kebab-case for testability.

## What's been implemented (cumulative)
- **Iter 1 (MVP)**: 4-role system, full order lifecycle, customer/merchant/courier/admin screens, auto-dispatch, water/gas self-delivery, role-based visibility.
- **Iter 2**: Customer rating, courier earnings widget, admin CSV export & 7-day chart, merchant catalog CRUD + bulk CSV, OTP-gated delivery, tap-to-call, substitution flow, partial refund, 30s auto-cancel, 15s reassign, merchant confirmation rate, cancelled state.
- **Iter 3**: localStorage persistence, per-merchant ratings tab, customer reorder CTA, full Turkish translation, reset-demo button.
- **Iter 4 (HADE rebrand + ops upgrade)** — Feb 2026:
  - 🏷️ Rebrand GapGel → HADE (logo, "hiperlokal OS" tagline, order IDs `HADE-1001+`).
  - 🚚 Per-merchant `deliveryMode`: `platform_only` / `merchant_only` / `hybrid`.
  - ✅ Merchant `approvalStatus`: `approved` / `pending` / `suspended`, with admin approve/suspend buttons.
  - 📦 Product `stockStatus`: `in_stock` / `out_of_stock` / `hidden`.
  - 🟢 Courier `online` toggle (offline couriers excluded from auto-dispatch).
  - 🎟️ Promo codes: `HADE10` = 10% off (cart promo input + applied label).
  - 📈 Platform analytics: GMV (delivered orders), repeat-customer count, courier utilization %, total refunds.
  - 💯 Composite merchant health score with histogram per merchant.
  - 🛠️ Admin merchants panel with delivery-mode select + approval toggle per row.
  - Tested via Playwright on deployed preview: **13/13 features PASS** (`/app/test_reports/iteration_4.json`).
- **Iter 4 polish (this run)**:
  - Fixed Recharts `width(-1)/height(-1)` console warning by adding `minHeight={200}` and explicit `minHeight: 224` on parent container in `RevenueChart.jsx`.
  - Added `STATUS_LABELS` Turkish map and used it in admin force-status toast (no more raw English status keys leaking into UI).

## Known Notes
- localStorage key versioned (`gapgel-state-v1`) so future schema changes can bump key.
- All `data-testid` attributes stayed English for tester compatibility.
- AUTO_CANCEL_MS=30000ms / REASSIGN_MS=15000ms — for production raise to 600000/180000 (10min/3min).

## Prioritized Backlog
### P1
- 6-role split: Merchant Owner vs Merchant Staff, Platform Courier vs Merchant Courier.
- Multi-address system for customers (saved addresses, delivery notes).
- Customer notifications toast queue for status changes.
### P2
- Merchant Onboarding Wizard (Apply → Business → Store → Category → Delivery → Address → Documents → Approval).
- Courier Onboarding Wizard (Apply → ID upload → Vehicle type → Phone verification → Approval).
- Push notification simulation UI (courier assignment, merchant new order).
- Real-time ETA calculation simulation for customers.
- Disputes & resolutions module in Admin panel.
- Image upload for catalog products (currently SVG gradient tiles).
- Geofenced merchant filter / nearest-first sorting.

## Refactoring TODO
- `/app/frontend/src/store/GapGelContext.jsx` is ~1140 lines — split into multiple hooks/reducers (orders, merchants, couriers, cart) when next major feature lands.

## Testing status
- Iter 4 testing agent run: 13/13 PASS, 0 blockers, only cosmetic Recharts warning (now fixed).
- No backend, no API tests — frontend Playwright + code review only.

## Credentials
- N/A. Role switcher (top-right combobox) is the entry point. No login.
