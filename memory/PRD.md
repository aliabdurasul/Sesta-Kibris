# GapGel — Hyperlocal Marketplace + Logistics OS

## Problem Statement (verbatim)
Build a complete multi-role frontend application. GapGel is a hyperlocal marketplace + logistics operating system. It must support Customers, Merchants, Couriers, and Admin. Full order lifecycle: `created → paid → accepted → preparing → ready → out_for_delivery → delivered`. Mobile-first, Uber Eats + Getir inspired. Pure frontend, in-memory state.

## Architecture
- Pure React + Context + useReducer global store
- Pre-seeded: 3 merchants (Fresh Market market / Aqua Express water / GasGo gas), 3 couriers, 1 customer
- Top-bar role switcher; mobile shell for Customer/Courier; desktop sidebar/tabs for Admin/Merchant
- Auto-timers (useEffect): 30s auto-cancel for unaccepted paid orders, 15s reassign for unpicked-up courier orders
- Constants: `COURIER_FEE_PER_DELIVERY=$2`, `DELIVERY_FEE=$1.50`, `AUTO_CANCEL_MS=30000`, `REASSIGN_MS=15000`

## User Personas
- Customer (u1) — orders, pays, tracks, rates
- Merchant (Fresh Market / Aqua Express / GasGo) — accepts/rejects, prepares, dispatches; water/gas self-deliver. Manages catalog with bulk CSV.
- Courier (Ali / Maya / Ravi) — auto-assigned, OTP-verified deliveries, sees earnings
- Admin — control tower: live orders table, force overrides, force-assign, partial refunds, CSV export, revenue chart, merchant confirmation rate

## Core Requirements
- Strict linear state-machine guard; only admin can override
- Payment gate: merchants cannot accept unless `paid`
- Courier `idle/busy` state; only idle couriers auto-assigned
- Self-delivery rule for `water` / `gas` merchants (no courier)
- Role-based order visibility
- 4-digit OTP at delivery, non-skippable for couriers
- Auto-cancel after 30s if merchant unresponsive (refund full)
- 15s courier abandonment auto-reassign to next idle
- Tap-to-call (`tel:`) for merchant→customer and courier→customer
- Substitution flow: merchant offers, customer accepts/declines
- Partial refund (admin), updates totals everywhere
- Confirmation-rate metric per merchant

## What's been implemented (2026-02-06)
**Iteration 1**
- Customer Home (search/chips/featured/merchants), Merchant page (quick-add), Cart (Pay Now), Orders, OrderDetail with Timeline, Profile
- Merchant tabs (New / Preparing / Ready) with Accept/Reject/Mark Preparing/Mark Ready/Self-dispatch/Self-deliver
- Courier deliveries with Pickup / Delivered, history, profile
- Admin sidebar, live orders table, status filter, force override, force assign, metric cards
- Auto-dispatch with toast, water/gas self-delivery branch, deterministic SVG product tiles
- Testing: 19/19 flows pass

**Iteration 2 (this iteration)**
- ⭐ **Customer rating flow**: per-order, merchant + courier stars + comments (`/customer/orders/:id/rate`)
- 💰 **Courier earnings widget**: today / week / lifetime ($2/delivery)
- 📊 **Admin revenue chart**: 7-day BarChart (recharts) of revenue + orders
- 📥 **Admin CSV export**: downloads full orders ledger
- 📦 **Merchant catalog tab**: add/edit/delete + **bulk CSV** paste/upload (handles 1000s)
- 🔐 **OTP at delivery**: 4-digit code shown on customer page, courier-side gated dialog
- 📞 **Tap-to-call**: `tel:` links on merchant + courier order cards
- 🔁 **Substitution flow**: merchant offers, customer accepts/declines
- 💸 **Admin partial refund** dialog (and refund column in table)
- ⏱ **Auto-cancel** unaccepted paid orders after 30s with full refund + toast
- 🛵 **Courier reassign** if no pickup in 15s; previous courier freed, next idle assigned
- 📈 **Merchant confirmation-rate** widget on admin (red bar if <70%)
- 🛑 **Cancelled state** added to state machine + StatusBadge + OrderTimeline banner
- Testing: 11/13 features automation-verified, 2 timer-based features static-reviewed

## Known Notes
- All state in-memory; refresh wipes data (intentional for demo)
- Auto-timers use `Date.now() − createdAt/assignedAt` so they survive re-renders (won't restart from zero on every tick)
- `merchantReject` now cancels the order with full refund (was: revert to created)

## Prioritized Backlog
### P1
- localStorage hydration so demo survives refresh
- Per-merchant view of own ratings
- Customer reorder button on past delivered orders
### P2
- Multi-customer demo accounts
- Image upload for catalog products (currently auto-generated SVG tiles)
- Geofenced merchant filter

## Next Tasks
- Optional: localStorage persistence
- Optional: merchant onboarding wizard with bulk-CSV starter template
- Iterate on user feedback
