# 🚀 Apna Saathi — Complete Render Backend Deployment Guide

This guide provides step-by-step instructions to deploy the **Apna Saathi Express & Socket.io Backend** to [Render](https://render.com).

---

## 📋 Table of Contents
1. [Prerequisites](#1-prerequisites)
2. [Step 1: Set Up MongoDB Atlas](#step-1-set-up-mongodb-atlas-critical)
3. [Step 2: Push Your Code to GitHub](#step-2-push-your-code-to-github)
4. [Step 3: Deploy on Render](#step-3-deploy-on-render)
   - [Option A: One-Click Blueprint (Recommended)](#option-a-one-click-blueprint-via-renderyaml-recommended)
   - [Option B: Manual Dashboard Setup](#option-b-manual-dashboard-setup)
5. [Step 4: Environment Variables Reference](#step-4-environment-variables-reference)
6. [Step 5: Seed the Production Database](#step-5-seed-the-production-database)
7. [Step 6: Verify Deployment & Health Check](#step-6-verify-deployment--health-check)
8. [Step 7: Connect the Frontend (Client)](#step-7-connect-the-frontend-client)
9. [Troubleshooting & Common Issues](#troubleshooting--common-issues)

---

## 1. Prerequisites
- A [Render](https://render.com) account (free tier available).
- A [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) account (free M0 cluster available).
- A GitHub repository containing this codebase.

---

## Step 1: Set Up MongoDB Atlas (Critical)

Render runs in the cloud, so it **cannot** connect to `mongodb://localhost:27017`. You must use a cloud database like MongoDB Atlas.

1. **Log in to MongoDB Atlas**: Go to [cloud.mongodb.com](https://cloud.mongodb.com).
2. **Create a Free Cluster**:
   - Click **Create Deployment** > Select **M0 Free Tier** > Choose a provider & region (e.g., AWS / Singapore or Mumbai) > Click **Create**.
3. **Configure Database Access (User)**:
   - Go to **Security > Database Access** > **Add New Database User**.
   - Authentication Method: **Password**.
   - Username: e.g. `apna_admin`.
   - Password: Choose a strong password (avoid special characters like `@` or `:`, or URL-encode them).
   - Built-in Role: **Read and write to any database**.
   - Click **Add User**.
4. **Configure Network Access (Whitelist IP)**:
   - Go to **Security > Network Access** > **Add IP Address**.
   - Click **Allow Access from Anywhere** (`0.0.0.0/0`).
   - *(Why? Render uses dynamic IP addresses that change frequently. Allowing `0.0.0.0/0` ensures Render's web servers can always reach the database).*
   - Click **Confirm**.
5. **Get Your Connection String**:
   - Go to **Database > Clusters** > Click **Connect**.
   - Choose **Drivers** (Node.js).
   - Copy the connection string. It looks like:
     ```text
     mongodb+srv://apna_admin:<password>@cluster0.abcde.mongodb.net/apna_saathi?retryWrites=true&w=majority
     ```
   - Replace `<password>` with your database user password, and set the database name to `apna_saathi`.

---

## Step 2: Push Your Code to GitHub

Make sure all changes are committed and pushed to your GitHub repository:

```bash
git add .
git commit -m "Configure backend for Render deployment"
git push origin main
```

---

## Step 3: Deploy on Render

Choose either **Option A** (automated Blueprint) or **Option B** (manual UI).

### Option A: One-Click Blueprint via `render.yaml` (Recommended)

This repository includes a pre-configured `render.yaml` blueprint.

1. Log in to [dashboard.render.com](https://dashboard.render.com).
2. Click **New +** (top right) > Select **Blueprint**.
3. Connect your GitHub repository (`Apna-Saathi-platform` or `Delivery-Partner`).
4. Render will read `render.yaml` and configure the Web Service automatically.
5. In the configuration prompt, provide the values for:
   - `MONGO_URI`: Your MongoDB Atlas connection string from Step 1.
   - `CLIENT_URL`: URL of your frontend (e.g. `https://your-app.vercel.app` or `http://localhost:3000`).
6. Click **Apply**. Render will automatically provision, build, and deploy your backend!

---

### Option B: Manual Dashboard Setup

If you prefer to configure manually via the Render UI:

1. In Render Dashboard, click **New +** > Select **Web Service**.
2. Select **Build and deploy from a Git repository** > Click **Next**.
3. Connect your GitHub repository.
4. Fill in the service configuration:
   - **Name**: `apna-saathi-backend` (or your preferred name)
   - **Region**: Choose the region closest to your users (e.g., *Singapore* or *Frankfurt*).
   - **Branch**: `main` (or your active branch).
   - **Root Directory**: `server` ⚠️ *(CRITICAL: Since this is a monorepo, specify `server`)*.
   - **Runtime**: `Node`.
   - **Build Command**: `npm install`.
   - **Start Command**: `npm start`.
   - **Instance Type**: `Free`.
5. Click **Advanced**:
   - **Health Check Path**: `/api/health`.
   - **Auto-Deploy**: `Yes`.
6. Add the **Environment Variables** (see table below).
7. Click **Create Web Service**.

---

## Step 4: Environment Variables Reference

Add the following environment variables in the Render Dashboard (**Environment** tab of your Web Service):

| Key | Example Value | Description |
|---|---|---|
| `NODE_ENV` | `production` | Enables production optimizations & error handling |
| `PORT` | `10000` | Render assigns this automatically, or set to 10000 |
| `MONGO_URI` | `mongodb+srv://admin:pass@cluster0.../apna_saathi?retryWrites=true&w=majority` | **Required**: MongoDB Atlas connection URI |
| `JWT_SECRET` | `a_super_secure_64_character_random_string` | **Required**: Secret used to sign authentication tokens |
| `JWT_EXPIRE` | `7d` | Token expiration period |
| `CLIENT_URL` | `https://apna-saathi.vercel.app,http://localhost:3000` | Allowed frontend origins (comma-separated; no trailing slash) |
| `RAZORPAY_KEY_ID` | `rzp_test_placeholder` | Razorpay Key ID (optional if testing mock payments) |
| `RAZORPAY_KEY_SECRET` | `placeholder_secret` | Razorpay Secret Key |
| `RAZORPAY_WEBHOOK_SECRET`| `placeholder_webhook` | Razorpay Webhook Secret |
| `SEED_PASSWORD` | `Password123!` | Default password for seeded demo accounts |

> [!TIP]
> **Multiple Origins**: You can specify multiple origins in `CLIENT_URL` separated by commas (e.g. `https://your-frontend.vercel.app,http://localhost:3000,http://localhost:5173`). This allows you to test both local and production frontends against your Render backend!

---

## Step 5: Seed the Production Database

To populate the database with default demo data (Admin, Businesses, Riders, and Orders):

### Option 1: Via Render Shell (Easiest)
1. Go to your Web Service in the Render Dashboard.
2. In the left navigation menu, click **Shell**.
3. Run the following command:
   ```bash
   npm run seed
   ```
4. You will see:
   ```text
   ✅ Connected to MongoDB
   ✅ Database Seeded Successfully!
   👤 Users: 8 (1 admin, 3 business, 4 riders)
   🏪 Businesses: 3
   🏍️ Riders: 4
   📦 Orders: 12
   ```

### Option 2: Run Seed Locally against Atlas
You can also run the seed script from your local machine targeting MongoDB Atlas:
1. In your local `server/.env`, temporarily set `MONGO_URI` to your Atlas connection string.
2. In your terminal run:
   ```bash
   cd server
   npm run seed
   ```
3. Once done, Atlas will have all the seed data ready!

---

## Step 6: Verify Deployment & Health Check

Once Render finishes deploying (Status: **Live**):

1. Find your backend URL at the top of the Render page:
   `https://<your-service-name>.onrender.com`
2. Test the health check endpoint in your browser or curl:
   ```bash
   curl https://<your-service-name>.onrender.com/api/health
   ```
   **Expected Response:**
   ```json
   {
     "success": true,
     "service": "Apna Saathi Backend API",
     "status": "healthy",
     "environment": "production",
     "timestamp": "2026-10-29T..."
   }
   ```
3. Also test the root URL:
   `https://<your-service-name>.onrender.com/` (should return the same 200 OK JSON response).

---

## Step 7: Connect the Frontend (Client)

Now point your React/Vite frontend to your live Render backend:

In your `client/.env` (or environment variables in Vercel / Netlify / Render Static Site):

```env
# Backend API Base URL (must end with /api)
VITE_API_URL=https://<your-service-name>.onrender.com/api

# WebSocket Server URL (root domain without trailing slash)
VITE_SOCKET_URL=https://<your-service-name>.onrender.com

# Demo Credentials Password
VITE_DEMO_PASSWORD=Password123!
```

---

## Troubleshooting & Common Issues

### 1. Render Free Tier "Cold Start" (Spin-Down)
- **Issue**: On the Render free tier, web services spin down after 15 minutes of inactivity. The first request after sleep takes 30-50 seconds to respond.
- **Solution**:
  - This is standard Render free tier behavior.
  - You can keep it warm using a free pinging service like [UptimeRobot](https://uptimerobot.com) or [cron-job.org](https://cron-job.org) hitting `https://<your-service-name>.onrender.com/api/health` every 10 minutes.

### 2. "MongoServerSelectionError" or "Connection Timeout"
- **Cause**: MongoDB Atlas Network Access has not whitelisted `0.0.0.0/0`.
- **Fix**: Open MongoDB Atlas > **Network Access** > Add IP Address > Enter `0.0.0.0/0` (Allow Access from Anywhere).

### 3. "CORS blocked request from origin"
- **Cause**: `CLIENT_URL` does not match the frontend origin or contains a trailing slash.
- **Fix**: Check `CLIENT_URL` in the Render Environment tab. If your frontend is `https://apna-saathi.vercel.app`, ensure `CLIENT_URL` is exactly `https://apna-saathi.vercel.app` (without trailing slash `/`). Multiple comma-separated URLs are supported!

### 4. Deploy Failed: "Cannot find module" or "Missing start script"
- **Cause**: Root Directory was not specified.
- **Fix**: Ensure **Root Directory** is set to `server` in your Render Web Service settings (Settings tab > Root Directory).

### 5. WebSocket (Socket.io) Disconnections
- **Cause**: WebSockets require HTTP/1.1 or WSS over HTTPS.
- **Fix**: Render natively supports WebSockets on all plans including Free. Ensure `VITE_SOCKET_URL` uses `https://` (which Socket.io automatically upgrades to `wss://`).
