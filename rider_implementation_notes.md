# Rider Execution Portal - Implementation Notes

This document will track the progress and details of the Rider backend and frontend components.

## Section 1: Backend Modifications

### `orders.js`
1. Added `GET /api/orders/batches/available`:
   - Fetches orders with `status: 'pending'` and a valid `batchId`.
   - Aggregates them to count distance (mocked string based on count for now), earnings (sum of `deliveryFee`), and stops.
2. Added `POST /api/orders/verify-otp`:
   - Accepts `orderId` and `otp`.
   - Verifies the OTP payload securely.
   - Triggers `status: 'picked_up'` or `'delivered'`.
   - Emits `order:statusChanged` via `req.app.get('io')`.

### `riders.js`
1. Added `PATCH /api/riders/accept-batch`:
   - Accepts `batchId`. Finds available orders.
   - Marks them `status: 'assigned'` and sets rider ID.
   - Pushes order IDs to `Rider.activeOrders`.
   - Alerts merchants using Socket.io `order:assigned` event.

*(this file will be updated as work progresses...)*

## Section 2: Frontend Modifications

### Core Routing (`App.jsx`)
- Imported Rider pages.
- Added role-based gateway for `user?.role === 'rider'` on `/login` to `/rider/jobs`.
- Wrapped Rider pages in `<ProtectedRoute allowedRoles={['rider']}>`.

### Rider Layout (`RiderLayout.jsx`)
- Built a mobile-first sticky bottom navigation.
- Initialized `<Outlet />` for sub-routes.
- Starts Geolocator hook globally when accessed.

### Realtime Location Hook (`useRiderLocation.js`)
- Initializes Socket.io client.
- Hooks into `navigator.geolocation.watchPosition()`.
- Emits `rider:location` every 10s via Socket event.

### Jobs Board (`JobsBoard.jsx`)
- Pulls open batches from `/api/orders/batches/available`.
- Allows "Accept Batch" leading to `PATCH /api/riders/accept-batch`.
- Renders distance, payload stops, and projected earnings.

### Active Route (`ActiveRoute.jsx`)
- Pulls Rider's route sequence off `/api/riders/me`.
- Splits between Pickup and Dropoff stops intuitively.
- Maps deep-link URLs to Google Maps native schemes.
- Captures the Handshake via an OTP Modal `POST /api/orders/verify-otp`.

