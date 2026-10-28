# Official Plan: Merchant Funnel Architecture

We strictly follow the 4 phases provided. No deviations or extra components.

## Phase 1: The Architectural Guardrails
- **Backend Schema Status**: Completed. `User`, `Business`, and `Order` models updated.
- **The Merchant Sidebar Status**: Completed. Custom `MerchantLayout.jsx` created with the Indigo Color Theme representing the workspace.
- **The Auth Switch Status**: Completed. Added strict logic router into `App.jsx` and added `ProtectedRoute` blocks to lock `user.role === 'business'` inside `/merchant/*` routes.

## Phase 2: The Onboarding & Paywall
- **Subscription Selector Status**: Completed. Built `MerchantPricing.jsx` with options for Daily (₹99), Monthly (₹2,999) and Yearly (₹29,999).
- **Checkout Logic Status**: Completed. Handles plan success and automatically links with the `Business` backend node `isPaid: true`.

## Phase 3: The "Consumer Detail" Desk
- **The Consumer Allocation Form Status**: Completed. Built `MerchantNewOrder.jsx` using structured form inputs mapped directly to database variables.
- **Leaflet Map Integration Status**: Completed. Users can drag the map pin to mark exact coordinates. Captures weight (kg) which interacts strictly with batching logic.

## Phase 4: The OTP Handshake 
- **Live Order Card Status**: Completed. Built `MerchantOrders.jsx` tracking Pending -> Rider Assigned -> Picked Up stages dynamically.
- **The OTP Display Status**: Completed. Displays dynamic OTP code directly for the merchant to handshake with incoming riders.
- **Socket.io Synchronization Status**: Completed. Hooked `order:statusChanged` websockets so the merchant view refreshes instantly when routes are batched by the admin.
