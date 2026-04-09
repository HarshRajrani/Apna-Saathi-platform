const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

// Load env vars
dotenv.config();

// Connect to database
connectDB();

// Initialize Express
const app = express();

// Create HTTP server for Socket.io
const server = http.createServer(app);

// Initialize Socket.io
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
    credentials: true,
  },
});

// Make io accessible to routes via req.app.get('io')
app.set('io', io);

// ============================================================
// MIDDLEWARE
// ============================================================

app.use(helmet());
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    credentials: true,
  })
);
// Razorpay webhook needs raw body for signature verification — must come before express.json()
app.use('/api/subscription/webhook', express.raw({ type: 'application/json' }));
app.use(express.json());
app.use(morgan('dev'));

// ============================================================
// ROUTES
// ============================================================

app.use('/api/auth', require('./routes/auth'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/riders', require('./routes/riders'));
app.use('/api/routes', require('./routes/routes'));
app.use('/api/billing', require('./routes/billing'));
app.use('/api/businesses', require('./routes/businesses'));
app.use('/api/subscription', require('./routes/subscription'));
app.use('/api/public', require('./routes/public')); // No auth - public tracking

// Health check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Apna Saathi API is running',
    timestamp: new Date().toISOString(),
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('❌ Server Error:', err.stack);
  res.status(500).json({
    success: false,
    message: 'Internal Server Error',
  });
});

// ============================================================
// SOCKET.IO EVENT HANDLERS
// ============================================================

io.on('connection', (socket) => {
  console.log(`🔌 Client connected: ${socket.id}`);

  socket.on('joinBatch', (batchId) => {
    if (batchId) {
      socket.join(batchId);
      console.log(`🔌 Joined room: ${batchId}`);
    }
  });

  socket.on('joinAdmin', () => {
    socket.join('adminRoom');
    console.log(`🔌 Joined admin room`);
  });

  // Customer joins their personal tracking room (read-only)
  socket.on('joinTracking', (trackingId) => {
    if (trackingId) {
      socket.join(`tracking:${trackingId}`);
      console.log(`👁️ Customer joined tracking room: ${trackingId}`);
    }
  });

  // Rider sends live location update
  socket.on('rider:location', async (data) => {
    const { riderId, lat, lng, activeBatchId } = data;

    try {
      const Rider = require('./models/Rider');
      await Rider.findByIdAndUpdate(riderId, {
        currentLocation: {
          type: 'Point',
          coordinates: [lng, lat],
        },
      });

      // Broadcast to specific batch room AND the admin room
      const updateData = { riderId, lat, lng, status: 'busy' };
      if (activeBatchId) {
        io.to(activeBatchId).emit('rider:locationUpdate', updateData);

        // ====== THE SOCKET WHISPERER ======
        // Bridge: Relay to each customer's private tracking room
        // Customer A only sees their rider — never Customer B's data
        try {
          const Order = require('./models/Order');
          const batchOrders = await Order.find(
            { batchId: activeBatchId },
            { trackingId: 1 }
          );
          batchOrders.forEach((order) => {
            if (order.trackingId) {
              io.to(`tracking:${order.trackingId}`).emit('rider:locationUpdate', {
                lat,
                lng,
                status: 'busy',
                // Never expose riderId or batchId to public customers
              });
            }
          });
        } catch (err) {
          console.error('Whisperer error:', err.message);
        }
        // ====== END WHISPERER ======
      }
      io.to('adminRoom').emit('rider:locationUpdate', updateData);
    } catch (error) {
      console.error('Location update error:', error.message);
    }
  });

  // Rider updates order status
  socket.on('order:statusUpdate', async (data) => {
    const { orderId, status, riderId, batchId } = data;

    try {
      const Order = require('./models/Order');
      const order = await Order.findById(orderId);

      if (order) {
        order.status = status;
        if (status === 'delivered') {
          order.actualDeliveryTime = new Date();
        }
        await order.save();

        const updateEvent = { orderId, status };
        const targetBatch = batchId || order.batchId;
        
        // Broadcast to specific batch room AND the admin room
        if (targetBatch) {
          io.to(targetBatch).emit('order:statusChanged', updateEvent);
        }
        io.to('adminRoom').emit('order:statusChanged', updateEvent);
      }
    } catch (error) {
      console.error('Status update error:', error.message);
    }
  });

  socket.on('disconnect', () => {
    console.log(`🔌 Client disconnected: ${socket.id}`);
  });
});

// ============================================================
// START SERVER
// ============================================================

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`
  ╔════════════════════════════════════════════════╗
  ║                                                ║
  ║   🚀 Apna Saathi API Server                    ║
  ║   📡 Running on port ${PORT}                      ║
  ║   🌍 Environment: ${process.env.NODE_ENV || 'development'}                ║
  ║   🔌 Socket.io: Ready                          ║
  ║                                                ║
  ╚════════════════════════════════════════════════╝
  `);
});
