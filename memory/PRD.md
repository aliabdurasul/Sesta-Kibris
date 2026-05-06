# GapGel — Hyperlocal Marketplace + Logistics OS

## Problem Statement (verbatim)
Build a complete multi-role frontend application. GapGel is a hyperlocal marketplace + logistics operating system. It must support Customers, Merchants, Couriers, and Admin. This is NOT a simple UI demo — it must simulate a real working system with full order lifecycle.

Order state machine: `created → paid → accepted → preparing → ready → out_for_delivery → delivered`

Style: Uber Eats + Getir inspired, clean, minimal, modern, mobile-first. Colors: Primary #6C3BFF, Accent #00C2A8, Bg #F7F7FB.

## Architecture
- **Pure frontend**, in-memory React state (Context + useReducer). No backend.
- Pre-seeded demo data: 3 merchants (Fresh Market / Aqua Express / GasGo), 3 couriers, 1 customer.
- Route layout:
  - Customer / Courier → mobile shell (max-w-md) + bottom nav
  - Merchant → desktop tabs
  - Admin → desktop sidebar + table
- Top-bar `RoleSwitcher` always visible to switch between all 4 roles instantly.

## User Personas
- **Customer (Demo User u1)** — browses merchants, adds to cart, pays, tracks order.
- **Merchant (Fresh Market / Aqua Express / GasGo)** — accepts/rejects, prepares, marks ready; water/gas merchants self-deliver.
- **Courier (Ali / Maya / Ravi)** — auto-assigned on merchant Ready, picks up, delivers.
- **Admin** — "control tower": sees all orders, filters by status, force-assigns couriers, forces status.

## Core Requirements (static)
- Strict linear state-machine guard (only admin can override).
- Payment gate: merchant cannot accept unless order is `paid`.
- Courier availability: `idle / busy`. Only idle couriers are auto-assigned; they become busy on assignment and idle on delivery.
- Self-delivery rule: `water` / `gas` merchants bypass courier and self-deliver.
- Role-based order visibility enforced at store level (customer sees own; merchant sees own store; courier sees assigned; admin sees all).
- Cart badge, empty states, toast on new paid order, tap pulse animation on courier actions.

## What's been implemented (2026-02-06)
- [x] Global state store with strict state machine + reducer
- [x] Role switcher with merchant/courier account selectors
- [x] Customer: Home (search, chips, featured, merchant list), Merchant page (quick-add products), Cart (Pay Now), Orders list, Order detail with 7-step Timeline, Profile
- [x] Merchant: tabbed dashboard (New / Preparing / Ready) with Accept / Reject / Mark Preparing / Mark Ready / Self-dispatch / Self-deliver
- [x] Courier: delivery list with pickup/dropoff addresses and Picked Up / Delivered buttons
- [x] Admin: sidebar + live orders table with status filter, force status override, force courier assign, metric cards
- [x] Auto-dispatch on Ready with toast, water/gas self-delivery branch
- [x] Deterministic SVG gradient product tiles (reliable, no network)
- [x] 100% testing agent pass (19/19 flows)

## Prioritized Backlog
### P1 (next)
- Persistence (localStorage) so demo state survives refresh
- Order history export (CSV) in Admin
- "Nearby" geo filter stub (distance radius chip) for a realistic merchant list
### P2
- Customer rating after delivery
- Courier earnings widget on profile
- Merchant revenue chart (recharts)
- Multi-customer demo support

## Next Tasks
- Gather user feedback and iterate on any design tweaks
- Potential enhancement (revenue-oriented): add a tiny "Promoted" tag + upsell banner slot for merchants to self-promote inside Customer home — a natural monetization surface for a hyperlocal OS.
