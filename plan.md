# End-to-End Plan for SestaKibris Local Marketplace (Multitenant)

## 1. Executive Summary
This document outlines the detailed plan to develop SestaKibris, a multitenant local marketplace focusing on fast delivery of essentials (water, gas, fresh produce, market items) tailored for the KKTC (Northern Cyprus) region.

## 2. Technical Stack
*   **Frontend:** React, Tailwind CSS, Framer Motion (for haptic feedback/animations), React Router.
*   **Backend:** Python, FastAPI, Motor (Async MongoDB Driver).
*   **Database:** MongoDB (for flexible document schemas like Orders, Merchants, and Products).

## 3. Core Contexts (Roles)
1.  **Customer App:** Mobile-first shell. Features include searching merchants by type, viewing products, placing orders (Cart -> Checkout), and tracking deliveries via timeline.
2.  **Merchant App:** Desktop fluid shell. Features include a dashboard for order management (Accept, Prepare, Ready), inventory catalog management, and onboarding.
3.  **Courier App:** Mobile-first shell. Features include viewing active deliveries, marking pickups, requiring OTPs for delivery, and viewing earnings.
4.  **Admin App:** Desktop fluid shell. Features include a platform control tower, dispute resolution, overriding order states, and analytics.

## 4. Phase 1: Planning and Architecture
*   *Data Modeling:* Define entities for Users, Stores (Merchants), Products, Orders, and Addresses.
*   *State Machine:* Map the order lifecycle (`created` -> `paid` -> `accepted` -> `preparing` -> `ready` -> `out_for_delivery` -> `delivered` / `cancelled`).
*   *UI/UX Mapping:* Conform to `design_guidelines.json`, using Plus Jakarta Sans, specific pastel/high-contrast colors, and layout shells.

## 5. Phase 2: Backend Implementation (FastAPI)
*   Setup modular routing structure (`users`, `merchants`, `orders`, `products`).
*   Implement Pydantic models for request/response validation.
*   Integrate MongoDB with asynchronous queries using Motor.
*   Implement authentication and Role-Based Access Control (RBAC).

## 6. Phase 3: Frontend Implementation (React)
*   **Global Context (`GapGelContext`):** Develop a robust state management system to handle cart logic, order transitions, and role switching (mocking login for testing).
*   **Shared Components:** Create UI components (Buttons, StatusBadges, BottomNav, RoleSwitcher) with Tailwind and Framer Motion.
*   **Customer Views:** Implement Home, Cart, Checkout, and Order Tracking pages. Ensure mobile-first styling (`max-w-md`).
*   **Merchant Views:** Implement Dashboard for incoming orders, inventory tabs, and onboarding flows.
*   **Courier Views:** Implement active deliveries feed, OTP verification integration, and haptic actions for accepting/delivering.
*   **Admin Views:** Implement data tables for monitoring all system entities and overriding states.

## 7. Phase 4: Localization and Regional Features
*   **Currency & Language:** Fully localized in Turkish, supporting TRY (₺) as the primary currency.
*   **Payment Methods:** Emphasize Cash on Delivery (common in KKTC) alongside online payment mocks.
*   **Delivery Modes:** Support platform couriers vs. merchant self-delivery.

## 8. Phase 5: Verification & Testing
*   *Unit Testing:* Run React Testing Library tests on the frontend.
*   *Visual Testing:* Use Playwright to verify UI accuracy and state transitions across different roles.
*   *Accessibility:* Ensure color contrast ratios and structural integrity via `data-testid` implementations.
*   *Pre-commit Checks:* Run linters, formatters, and type checkers before finalizing code.

## 9. Deployment Strategy
*   *Backend:* Deploy FastAPI app via Docker containers to a scalable cloud provider (e.g., AWS, Render).
*   *Frontend:* Deploy React app as static files via Vercel or Netlify.
*   *Database:* Provision a managed MongoDB Atlas cluster.
