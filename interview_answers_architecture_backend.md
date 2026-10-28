# Answers: System Design, Architecture & Backend (Q1-Q50)

This document contains answers for the System Design and Node.js Backend sections of the interview prep guide based on the Delivery Platform project.

---

## Part 1: System Design & High-Level Architecture

**1. Can you draw the high-level architecture of your Delivery Platform?**
The architecture is a MERN monolith handling dual protocols (HTTP/REST for CRUD and WebSockets for real-time telemetry). The frontend is a React SPA logically partitioned by React-Router into isolated portals (Admin, Merchant, Rider, Public tracker) guarded by JWT RBAC. The Node.js/Express backend handles business logic and Socket.io routing, saving data to MongoDB utilizing `$2dsphere` indexes for spatial logic. 

**2. Why choose a monolithic architecture over microservices?**
For a V1 logistics platform, managing distributed transactions, network latency, and eventual consistency between separated microservices creates unnecessary overhead. A monolith allows rapid iteration on complex relational spatial logic (like batching orders and tracking riders) within a single memory space. 

**3. Flow of an order from creation to delivery?**
Merchant creates -> Node intercepts via `Order.pre('save')` to generate Shadow ID -> Saved to DB as `pending` -> System/Admin clusters nearby orders into a `batchId` -> Rider hits 'Accept' on mobile -> DB status updates to `assigned` -> Rider travels (telemetry emitted via Socket) -> Reaches destination & requests 4-digit OTP -> OTP validated -> DB updates to `delivered` -> Earnings recalculated.

**4. Key bottlenecks scaling to 100,000 concurrent orders?**
1. Node.js Single Thread: Intense O(N^2) CPU tasks (like Haversine algorithms over 100k arrays) will block the Event Loop. 2. Socket Memory: Holding 100k open TCP connections natively in Express RAM will cause an Out-Of-Memory (OOM) crash. 3. Database Write-Locks: High-velocity GPS updates might bottleneck MongoDB write performance.

**5. How to design a load balancer setup?**
Use NGINX acting as a reverse proxy routing incoming traffic to 3+ Node.js instances. For standard REST API calls, use Round-Robin. For Socket.io, you *must* use `ip_hash` (sticky sessions) so the WebSocket handshake doesn't bounce between servers and fail, or implement a Redis Adapter.

**6. Decoupling portals vs unified app?**
Separation of concerns and bundle size. A rider running a mobile app on cellular data shouldn't download heavy Admin data-visualization libraries (`recharts`). Separating them allows optimized bundling and distinct, air-gapped security validations.

**7. DB goes down handling disaster recovery?**
If MongoDB crashes, active websocket connections still exist in Node RAM, but state cannot be persisted. I would ensure MongoDB is running in a Replica Set (Primary + 2 Secondary nodes). If the Primary fails, an automatic election promotes a Secondary to Primary in seconds, averting downtime.

**8. Offline mode for the Rider app?**
If a Rider enters an elevator/dead-zone, the React app utilizes `localStorage` or IndexedDB to queue up GPS coordinates or status changes (e.g., "Delivered"). A Web Worker/Service Worker checks for `navigator.onLine`. When connectivity restores, the queue syncs to the server.

**9. Distributed caching layer (Redis)?**
Mem-caching frequently accessed, rarely changing data. Example: The active list of Online Riders checking for jobs doesn't need to query MongoDB every 2 seconds. Node queries Redis first; if missing (cache miss), it queries Mongo and writes to Redis. Also used as a Pub/Sub adapter for scaling Socket.io horizontally.

**10. Tracking and logging system errors?**
Utilize external logging services (Winston/Pino locally, Datadog/Sentry in production). Wrap controllers in `try/catch` and forward to a global Express error-handling middleware. Client-side React errors are caught via ErrorBoundaries to prevent white-screens.

**11. Notification system (Push, SMS, Email)?**
Integrate AWS SNS or Twilio dynamically inside Mongoose `post('save')` hooks. When an order status flips to `in_transit`, a queue worker (RabbitMQ) picks up the job and dispatches the SMS containing the `trackingId` natively to the Consumer's phone.

**12. Rate limiting the Merchant API?**
Implement standard API throttling (e.g., `express-rate-limit`). Assign an IP or JWT-based Token Bucket algorithm allowing max 5 order-creations per minute to prevent DDoS or spam logic.

**13. Migrating from MongoDB to PostgreSQL?**
The polymorphic unstructured `User` doc becomes rigid tables with Foreign Keys. Spatial queries change entirely: MongoDB's native `$near` index would require migrating to the `PostGIS` extension for spatial tracking in SQL. The nested Array of Objects (`statusHistory`) becomes a distinct relational timeline table.

**14. Multi-region geographical architecture?**
Segment AWS regions (e.g., `us-east-1`, `ap-south-1`). Utilize Geo-DNS (Route53) to route riders in India to the Mumbai cluster. Databases would reside locally to reduce latency, aggregating to a master global analytical cluster asynchronously.

**15. CQRS (Command Query Responsibility Segregation)?**
Separating Write logic from Read logic. Helpful when scaling Admin dashboards doing complex statistical reads. The primary DB handles heavy Writes (GPS tracking). A secondary DB replicates it and optimizes strictly for heavy Admin Aggregation Queries (Reads) preventing locks. 

**16. High availability (99.99%) dispatch system?**
Stateless backend services running across multiple Availability Zones. Containerized apps (Docker/Kubernetes) instantly auto-scaling new pods if CPU hits 80%. Multi-node DB replica sets.

**17. Surge pricing schema?**
Add a real-time `zoneDensity` controller. When active pending orders outnumber `isOnline: true` riders physically nearby, apply a multiplier logic `baseDeliveryFee * 1.5` before generating the internal Invoice document.

**18. Two riders accepting the same batch?**
Pessimistic vs Optimistic Locking. In Mongoose, use version casing (`__v`). If Rider A accepts, `__v` increments. When Rider B presses accept simultaneously, they carry the old `__v`. MongoDB rejects Rider B's update with a VersionError gracefully.

**19. System health metrics?**
Process memory usage, CPU load, active Event Loop lag, total parallel open Socket TCP connections, and MongoDB slow-query execution times. 

**20. Data pipeline for Analytics?**
ETL (Extract, Transform, Load) pipelines. Every midnight, a CRON job offloads historical closed deliveries from the transactional cluster and pushes them into a data warehouse like AWS Redshift for statistical graphing without punishing the live platform logic.

---
### Real-Time Domain

**21. Location payload path: Rider to Consumer?**
Phone `navigator.geolocation` fires -> React Client emits HTTP WSS frame over TCP (`socket.emit('rider:location')`) -> Node Server intercepts event -> Node queries DB for nested specific `trackingId`s in that Batch -> Node fires isolated `io.to('tracking:<id>').emit()` natively downward -> Consumer React instance detects hook -> Leaflet map translates `[Lat, Lng]` into a pixel pan.

**22. Connection drops mid-delivery?**
Sockets are transient. The Node server continues persisting GPS to MongoDB. The client relies on a hard React `useEffect` REST fetch mechanism upon reconnection to reload the authoritative DB state before trusting live socket deltas again.

**23. WebSockets vs SSE vs Long Polling?**
SSE is strictly Server-to-Client one-way (good for Consumer trackers, bad for Rider emitters). Long Polling is expensive (creating/destroying HTTP headers relentlessly). WebSockets establish a full-duplex, low-latency, persistent bidirectional TCP pipeline perfect for constant GPS telemetry.

**24. The Socket Whisperer requirement?**
If a batch contains Order A and Order B, broadcasting Rider location to the whole Batch allows Customer A to intercept Customer B's delivery location details by sniffing network frames. The server *must* intercept the batch broadcast and split it into isolated, anonymized tracking tunnels per order.

**25. Scaling Socket.io horizontally?**
Node servers don't share RAM. Standard Socket.io assumes a singular server. You build a Redis Pub/Sub adapter. Server A handles Rider A. Server B handles Consumer A. Server A publishes location to Redis. Server B subscribes to Redis, pulls the location, and sends it to Consumer A natively.

**26. Redis Pub/Sub internals?**
Publish/Subscribe. It's a high-speed memory message broker. Emitters don't know who receives signals, they just broadcast to a Topic. Subscribers don't know emitters, they just listen to Topics. It bridges isolated backend servers instantly.

**27. Physical reality constraints (bridges/traffic)?**
Currently, Haversine checks Euclidean boundaries (as-the-crow-flies). We would upgrade by tying the batching algorithm to Google Maps Distance Matrix APIs or open-source OSRM network graphs to calculate true driving vectors.

**28. Tracking historical routes?**
Store GPS history physically. A Rider sub-document: `historicalPaths: [{ lat, lng, timestamp }]`. Append every 30 seconds. On the frontend, map the array sequentially into a `Polyline` inside Leaflet to draw a literal trace trail.

**29. Tracking accuracy vs Battery life?**
Throttle `navigator.geolocation` polling to 5000ms. High-accuracy 0ms firing overheats Android physical logic boards immediately. The frontend utilizes SVG CSS `transition-all duration-1000` properties to smoothly glide the tracking dot between gaps, masking the 5-second polling delay.

**30. Handling UDP out-of-order packets?**
While raw WebSockets use TCP (which mathematically guarantees sequential ordering natively at the hardware protocol layer), if manipulating manual packets, you bind a `timestamp` integer. On the frontend, if incoming `timestamp < lastRenderedTimestamp`, discard it as an outdated ghost ping.

---
## Part 2: Backend Engineering (Node.js & Express)

**31. Event Loop in Node.js?**
Node is single-threaded but non-blocking. It processes cheap synchronous code instantly. Heavy I/O (Database reads, Network requests) are offloaded to C++ worker pools (libuv) via callbacks. The Event Loop continuously checks if workers are finished, feeding responses back to the single thread, allowing concurrency against 10,000 users.

**32. Why Express.js?**
Ubiquity and massive middleware ecosystem. However, it's older. Frameworks like Fastify process requests faster natively, and NestJS provides aggressive rigid Angular-like architecture for enterprise scaling. Express is perfect for high-speed MVP monolith generation. 

**33. Middleware flow (Protect/Authorize)?**
`protect` intercepts HTTP headers, grabs the `Bearer <token>`, verifies the cryptographic payload against `JWT_SECRET`, decodes the payload, and binds user data to `req.user`. Once passed, `authorize` kicks in, checking strictly if `req.user.role` exists within the passed allowed roles array. If failed, punts 403.

**34. nextTick vs setImmediate vs setTimeout?**
`process.nextTick` executes immediately after the current operation finishes (highest priority). `setTimeout` executes after a fixed delay. `setImmediate` executes after the current polling phase of the Event Loop (yielding thread access). 

**35. Unblocking heavy geographic logic?**
Don't loop 50,000 arrays natively in Node. Offload calculations structurally to MongoDB's C++ indices (`$near`). For complex CPU tasks, use `worker_threads` to spawn a parallel CPU core operation without blocking the main I/O websocket queue.

**36. RESTful Principles?**
Utilizing precise URI mapping (`/api/orders/:id/deliver` not `/api/deliver_order_finally`). Mapping distinct HTTP verbs against physical CRUD mechanics (POST = Create, GET = Read, PATCH = partial update, DELETE). 

**37. Express error handling?**
Never send stack traces to clients. Return generic formats `{ success: false, message: "Error phrasing" }`. Utilize a custom top-level middleware `app.use((err, req, res, next) => {})` to catch all `next(new Error())` invocations globally.

**38. WebSockets vs Express CORS?**
Express governs standard HTTP `OPTIONS` pre-flight checks. Protocols requesting upgrades to `ws://` headers bypass conventional router CORS entirely. You must configure origins and `credentials: true` deeply inside the physical `require('socket.io')({cors:{}})` initialization wrapper.

**39. req.params, req.query, req.body?**
`params`: Variables extracted directly from the URI path structure (`/users/:id`).
`query`: Optional query strings appended dynamically after a question mark (`/users?role=rider`).
`body`: The protected JSON payload hidden inside POST/PATCH streams.

**40. Massive CSV parsing without crashing?**
Do not load a 500MB string into memory parsing `split()`, it causes V8 OOM crashes. Utilize Node **Streams** (`fs.createReadStream`). Pipe the stream natively into `csv-parser` row by row asynchronously without accumulating RAM debt.

**41. Steams inside a Delivery platform?**
Perhaps producing monthly invoice PDF batches, or uploading giant bulk-order manifests from enterprise merchants directly bypassing memory thresholds.

**42. V8 Garbage collection?**
Node allocates JS variables to the heap. When scopes resolve and references drop to 0, the Garbage Collector halts execution periodically to scrub dead memory arrays automatically. 

**43. Debugging Node Memory leaks?**
A memory leak is essentially an infinite array keeping references alive (e.g., continually pushing new user connections to an array and never removing them upon socket disconnect). Use `node --inspect` hooked into Chrome DevTools Memory profiling tabs to take Heap Snapshots, spotting exponential object generation.

**44. Clustering in Node?**
Node uses 1 CPU core inherently. If running on an AWS EC2 instance with 8 cores, 7 cores sit idle. `cluster` modules allow forking the server natively across all 8 cores sharing the exact same port mapping routing, 8x-ing performance instantly.

**45. Environment Variables in Prod?**
Never commit `.env` to Git. In deployment environments (AWS, Railway, Heroku), inject raw Key/Value logic directly into the CI/CD container configuration pipelines physically isolated from source-code execution paths.

**46. package-lock.json purpose?**
It deterministically locks strict dependency tree versions. Ensuring that `npm install` executed on the cloud server downloads the exact identical mathematical hashes of the libraries you tested locally in dev, preventing silent updates from breaking endpoints.

**47. Database connection pooling?**
Establishing a single TCP connection per request is incredibly slow. Mongoose handles connection pooling dynamically. It keeps a "pool" of 5-10 connections permanently open asynchronously against the DB. Incoming requests simply borrow a free pipeline instantly.

**48. Graceful shutdown?**
```javascript
process.on('SIGTERM', () => {
  server.close(() => {
    mongoose.connection.close(false, () => {
      process.exit(0);
    });
  });
});
```
This algorithm formally stops incoming HTTP traffic, allows existing sockets to fulfill closure natively, disconnects MongoDB, and dies cleanly without corrupting active payloads.

**49. API Versioning?**
Mandatory for breaking changes (e.g., when transitioning from flat-fee billing to surge-pricing). Mobile apps updated natively don't auto-refresh their JS. Hardcoding `/api/v1/orders` ensures older native clients don't violently crash if the payload structure changes abruptly under `/api/v2/orders`.

**50. Worker Threads for Haversine logic?**
If Haversine clustering required evaluating 500,000 vectors simultaneously, generating `new Worker()` passes the heavy math CPU processing entirely to physical background execution threads, protecting Node's primary event loop natively against freezing the live GPS sockets.
