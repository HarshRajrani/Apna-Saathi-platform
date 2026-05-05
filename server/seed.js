/**
 * Seed Script — Populate database with sample data
 * Run: npm run seed (from server directory)
 *
 * Creates:
 * - 1 Admin user
 * - 3 Business owner users + 3 Businesses
 * - 4 Rider users + 4 Riders (in Bangalore area)
 * - 12 Sample orders in various statuses
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const Business = require('./models/Business');
const Order = require('./models/Order');
const Rider = require('./models/Rider');
const Invoice = require('./models/Invoice');

dotenv.config();

// Demo seed password — stored in .env, never hardcoded
const SEED_PASSWORD = process.env.SEED_PASSWORD || 'changeme';

const seedDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    await User.deleteMany({});
    await Business.deleteMany({});
    await Order.deleteMany({});
    await Rider.deleteMany({});
    await Invoice.deleteMany({});
    console.log('🗑️  Cleared existing data');

    // =====================
    // 1. CREATE USERS
    // =====================

    const adminUser = await User.create({
      name: 'Admin User',
      email: 'admin@apnasaathi.com',
      password: SEED_PASSWORD,
      role: 'admin',
      phone: '9876543210',
    });

    const businessUser1 = await User.create({
      name: 'Rajesh Kumar',
      email: 'rajesh@apnasaathi.com',
      password: SEED_PASSWORD,
      role: 'business',
      phone: '9876543211',
    });

    const businessUser2 = await User.create({
      name: 'Priya Sharma',
      email: 'priya@apnasaathi.com',
      password: 'business123',
      role: 'business',
      phone: '9876543212',
    });

    const businessUser3 = await User.create({
      name: 'Amit Patel',
      email: 'amit@apnasaathi.com',
      password: 'business123',
      role: 'business',
      phone: '9876543213',
    });

    const riderUser1 = await User.create({
      name: 'Suresh M',
      email: 'suresh@apnasaathi.com',
      password: SEED_PASSWORD,
      role: 'rider',
      phone: '9876543220',
    });

    const riderUser2 = await User.create({
      name: 'Ramesh K',
      email: 'ramesh@apnasaathi.com',
      password: 'rider123',
      role: 'rider',
      phone: '9876543221',
    });

    const riderUser3 = await User.create({
      name: 'Vikram S',
      email: 'vikram@apnasaathi.com',
      password: 'rider123',
      role: 'rider',
      phone: '9876543222',
    });

    const riderUser4 = await User.create({
      name: 'Deepak R',
      email: 'deepak@apnasaathi.com',
      password: 'rider123',
      role: 'rider',
      phone: '9876543223',
    });

    console.log('👤 Created users');

    // =====================
    // 2. CREATE BUSINESSES
    // =====================

    // Bangalore area coordinates
    const business1 = await Business.create({
      owner: businessUser1._id,
      name: 'Tasty Kitchen',
      type: 'restaurant',
      phone: '9876543211',
      address: {
        street: '23 MG Road',
        area: 'Indiranagar',
        city: 'Bangalore',
        pincode: '560038',
        location: {
          type: 'Point',
          coordinates: [77.6408, 12.9784], // [lng, lat] Indiranagar
        },
      },
      plan: 'monthly-150',
      deliveriesThisMonth: 45,
      totalDeliveries: 320,
    });

    const business2 = await Business.create({
      owner: businessUser2._id,
      name: 'MedPlus Pharmacy',
      type: 'pharmacy',
      phone: '9876543212',
      address: {
        street: '15 Brigade Road',
        area: 'Koramangala',
        city: 'Bangalore',
        pincode: '560034',
        location: {
          type: 'Point',
          coordinates: [77.6167, 12.9352], // [lng, lat] Koramangala
        },
      },
      plan: 'pay-per-delivery',
      deliveriesThisMonth: 28,
      totalDeliveries: 156,
    });

    const business3 = await Business.create({
      owner: businessUser3._id,
      name: 'Fresh Grocery Mart',
      type: 'grocery',
      phone: '9876543213',
      address: {
        street: '8 Marathahalli Bridge',
        area: 'Marathahalli',
        city: 'Bangalore',
        pincode: '560037',
        location: {
          type: 'Point',
          coordinates: [77.7011, 12.9591], // [lng, lat] Marathahalli
        },
      },
      plan: 'monthly-300',
      deliveriesThisMonth: 102,
      totalDeliveries: 540,
    });

    console.log('🏪 Created businesses');

    // Link businesses back to their owner users
    await User.findByIdAndUpdate(businessUser1._id, { businessId: business1._id });
    await User.findByIdAndUpdate(businessUser2._id, { businessId: business2._id });
    await User.findByIdAndUpdate(businessUser3._id, { businessId: business3._id });

    // =====================
    // 3. CREATE RIDERS
    // =====================

    const rider1 = await Rider.create({
      user: riderUser1._id,
      name: 'Suresh M',
      phone: '9876543220',
      vehicleType: 'bike',
      vehicleNumber: 'KA-01-AB-1234',
      currentLocation: {
        type: 'Point',
        coordinates: [77.6350, 12.9750], // Near Indiranagar
      },
      status: 'available',
      earningsToday: 450,
      earningsTotal: 24500,
      totalDeliveries: 380,
      rating: 4.8,
      zone: 'Indiranagar',
    });

    const rider2 = await Rider.create({
      user: riderUser2._id,
      name: 'Ramesh K',
      phone: '9876543221',
      vehicleType: 'scooter',
      vehicleNumber: 'KA-01-CD-5678',
      currentLocation: {
        type: 'Point',
        coordinates: [77.6200, 12.9400], // Near Koramangala
      },
      status: 'available',
      earningsToday: 320,
      earningsTotal: 18900,
      totalDeliveries: 290,
      rating: 4.6,
      zone: 'Koramangala',
    });

    const rider3 = await Rider.create({
      user: riderUser3._id,
      name: 'Vikram S',
      phone: '9876543222',
      vehicleType: 'bike',
      vehicleNumber: 'KA-01-EF-9012',
      currentLocation: {
        type: 'Point',
        coordinates: [77.6950, 12.9550], // Near Marathahalli
      },
      status: 'busy',
      earningsToday: 580,
      earningsTotal: 31200,
      totalDeliveries: 510,
      rating: 4.9,
      zone: 'Marathahalli',
    });

    const rider4 = await Rider.create({
      user: riderUser4._id,
      name: 'Deepak R',
      phone: '9876543223',
      vehicleType: 'bicycle',
      vehicleNumber: '',
      currentLocation: {
        type: 'Point',
        coordinates: [77.6100, 12.9700], // Near MG Road
      },
      status: 'offline',
      earningsToday: 0,
      earningsTotal: 8500,
      totalDeliveries: 120,
      rating: 4.3,
      zone: 'MG Road',
    });

    console.log('🏍️  Created riders');

    // =====================
    // 4. CREATE ORDERS
    // =====================

    const orders = [];

    // Pending orders (for batching demo)
    for (let i = 0; i < 4; i++) {
      const order = await Order.create({
        business: business1._id,
        pickup: {
          address: '23 MG Road, Indiranagar, Bangalore',
          location: {
            type: 'Point',
            coordinates: [77.6408 + (Math.random() * 0.01), 12.9784 + (Math.random() * 0.01)],
          },
          contactName: 'Tasty Kitchen',
          contactPhone: '9876543211',
        },
        drop: {
          address: `${100 + i} ${['HSR Layout', 'BTM Layout', 'Whitefield', 'Electronic City'][i]}, Bangalore`,
          location: {
            type: 'Point',
            coordinates: [77.63 + (Math.random() * 0.05), 12.92 + (Math.random() * 0.05)],
          },
          contactName: `Customer ${i + 1}`,
          contactPhone: `98765${43300 + i}`,
        },
        status: 'pending',
        priority: i === 0 ? 'urgent' : 'normal',
        deliveryFee: 35 + Math.floor(Math.random() * 20),
        platform: ['own', 'swiggy', 'zomato', 'whatsapp'][i],
        notes: i === 0 ? 'Hot food - deliver fast' : undefined,
      });
      orders.push(order);
    }

    // Assigned orders
    for (let i = 0; i < 2; i++) {
      const order = await Order.create({
        business: business2._id,
        rider: rider1._id,
        pickup: {
          address: '15 Brigade Road, Koramangala, Bangalore',
          location: {
            type: 'Point',
            coordinates: [77.6167, 12.9352],
          },
          contactName: 'MedPlus Pharmacy',
          contactPhone: '9876543212',
        },
        drop: {
          address: `${200 + i} JP Nagar, Bangalore`,
          location: {
            type: 'Point',
            coordinates: [77.5850 + (Math.random() * 0.02), 12.9100 + (Math.random() * 0.02)],
          },
          contactName: `Patient ${i + 1}`,
          contactPhone: `98765${43400 + i}`,
        },
        status: 'assigned',
        priority: 'urgent',
        deliveryFee: 40,
        platform: 'own',
        batchId: 'BATCH-SEED-1',
        sequenceInBatch: i + 1,
      });
      orders.push(order);
    }

    // Update rider1 with active orders
    rider1.activeOrders = orders.slice(4, 6).map((o) => o._id);
    await rider1.save();

    // In-transit orders
    for (let i = 0; i < 2; i++) {
      const order = await Order.create({
        business: business3._id,
        rider: rider3._id,
        pickup: {
          address: '8 Marathahalli Bridge, Bangalore',
          location: {
            type: 'Point',
            coordinates: [77.7011, 12.9591],
          },
          contactName: 'Fresh Grocery Mart',
          contactPhone: '9876543213',
        },
        drop: {
          address: `${300 + i} Whitefield, Bangalore`,
          location: {
            type: 'Point',
            coordinates: [77.7400 + (Math.random() * 0.02), 12.9700 + (Math.random() * 0.02)],
          },
          contactName: `Customer ${i + 5}`,
          contactPhone: `98765${43500 + i}`,
        },
        status: 'in_transit',
        deliveryFee: 45,
        platform: 'website',
        batchId: 'BATCH-SEED-2',
        sequenceInBatch: i + 1,
      });
      orders.push(order);
    }

    // Update rider3 with active orders
    rider3.activeOrders = orders.slice(6, 8).map((o) => o._id);
    await rider3.save();

    // Delivered orders (for billing demo)
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    for (let i = 0; i < 4; i++) {
      const businesses = [business1, business2, business3, business1];
      const order = await Order.create({
        business: businesses[i]._id,
        rider: [rider1, rider2, rider3, rider2][i]._id,
        pickup: {
          address: `Pickup Location ${i + 1}, Bangalore`,
          location: {
            type: 'Point',
            coordinates: [77.6 + (Math.random() * 0.1), 12.93 + (Math.random() * 0.05)],
          },
          contactName: businesses[i].name,
          contactPhone: businesses[i].phone,
        },
        drop: {
          address: `Drop Location ${i + 1}, Bangalore`,
          location: {
            type: 'Point',
            coordinates: [77.6 + (Math.random() * 0.1), 12.93 + (Math.random() * 0.05)],
          },
          contactName: `Customer ${i + 8}`,
          contactPhone: `98765${43600 + i}`,
        },
        status: 'delivered',
        deliveryFee: 35 + (i * 5),
        platform: 'own',
        actualDeliveryTime: yesterday,
        createdAt: yesterday,
      });
      orders.push(order);
    }

    console.log(`📦 Created ${orders.length} orders`);

    // =====================
    // 5. CREATE SAMPLE INVOICE
    // =====================

    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    const lastMonthEnd = new Date(lastMonth.getFullYear(), lastMonth.getMonth() + 1, 0);

    const deliveredOrderIds = orders
      .filter((o) => o.status === 'delivered' && o.business.toString() === business1._id.toString())
      .map((o) => o._id);

    if (deliveredOrderIds.length > 0) {
      const subtotal = 250;
      const tax = Math.round(subtotal * 0.18 * 100) / 100;
      await Invoice.create({
        business: business1._id,
        orders: deliveredOrderIds,
        period: { from: lastMonth, to: lastMonthEnd },
        totalDeliveries: deliveredOrderIds.length,
        subtotal,
        tax,
        total: subtotal + tax,
        status: 'unpaid',
        dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
      });
      console.log('🧾 Created sample invoice');
    }

    // =====================
    // DONE
    // =====================

    console.log(`
    ╔════════════════════════════════════════════════╗
    ║                                                ║
    ║   ✅ Database Seeded Successfully!              ║
    ║                                                ║
    ║   👤 Users: 8 (1 admin, 3 business, 4 riders)  ║
    ║   🏪 Businesses: 3                              ║
    ║   🏍️  Riders: 4                                 ║
    ║   📦 Orders: ${orders.length}                                ║
    ║   🧾 Invoices: 1                                ║
    ║   🔐 Credentials: Use SEED_PASSWORD from .env   ║
    ║                                                ║
    ╚════════════════════════════════════════════════╝
    `);

    process.exit(0);
  } catch (error) {
    console.error('❌ Seed Error:', error.message);
    process.exit(1);
  }
};

seedDB();
