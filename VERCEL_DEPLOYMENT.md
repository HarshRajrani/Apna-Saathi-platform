# 🌐 Apna Saathi — Complete Vercel Frontend Deployment Guide

This guide walks you through deploying the **Apna Saathi React + Vite Frontend** to [Vercel](https://vercel.com).

---

## 📋 Table of Contents
1. [Prerequisites](#1-prerequisites)
2. [Step 1: Push Code to GitHub (Fix Branch)](#step-1-push-code-to-github)
3. [Step 2: Import Project on Vercel](#step-2-import-project-on-vercel)
4. [Step 3: Configure Environment Variables](#step-3-configure-environment-variables)
5. [Step 4: Deploy & Verify](#step-4-deploy--verify)
6. [Step 5: Connect Vercel URL to Render Backend (CORS)](#step-5-connect-vercel-url-to-render-backend-cors)
7. [Troubleshooting & Common Questions](#troubleshooting--common-questions)

---

## 1. Prerequisites
- A free [Vercel](https://vercel.com) account (sign in with your GitHub account).
- Your GitHub repository: `https://github.com/HarshRajrani/Apna-Saathi-platform.git`.
- Your live Render backend URL (e.g., `https://apna-saathi-backend.onrender.com`).

---

## Step 1: Push Code to GitHub

Your local git branch is currently named `master`, while the default branch on your GitHub repository is `main`. Run the following commands in your terminal to stage, commit, and push smoothly to `main`:

```bash
# 1. Stage all changes including vercel.json configurations
git add .

# 2. Commit the changes
git commit -m "Configure full Vercel frontend and Render backend deployment"

# 3. Rename local branch to main (matches GitHub remote)
git branch -M main

# 4. Push to GitHub main branch
git push -u origin main
```

---

## Step 2: Import Project on Vercel

1. Log in to [vercel.com](https://vercel.com).
2. Click **Add New…** (top right) ➔ Select **Project**.
3. Under **Import Git Repository**, find `Apna-Saathi-platform` and click **Import**.
4. Configure the project settings:
   - **Project Name**: `apna-saathi` (or preferred name)
   - **Framework Preset**: **Vite** (automatically detected)
   - **Root Directory**: Click **Edit** ➔ Select the `client` folder ➔ Click **Continue** ⚠️ *(CRITICAL: The frontend code lives inside `client/`)*.
   - **Build Command**: `npm run build` (or left default)
   - **Output Directory**: `dist` (default)
   - **Install Command**: `npm install` (default)

> [!NOTE]
> Even if you forget to select the `client` directory, we have included a root `vercel.json` fallback so Vercel builds `client/dist` regardless!

---

## Step 3: Configure Environment Variables

Before clicking **Deploy**, expand the **Environment Variables** section in the Vercel import form:

| Key | Value | Description |
|---|---|---|
| `VITE_API_URL` | `https://<your-render-backend>.onrender.com/api` | Your Render backend API endpoint (must end in `/api`) |
| `VITE_SOCKET_URL` | `https://<your-render-backend>.onrender.com` | Your Render backend root URL for live Socket.io tracking |
| `VITE_DEMO_PASSWORD`| `Password123!` | Default demo credentials password |

*(If you haven't deployed your Render backend yet, you can temporarily use your local URL `http://localhost:5000/api` or deploy the backend first, then update this variable in Vercel settings anytime).*

---

## Step 4: Deploy & Verify

1. Click **Deploy**.
2. Vercel will build the project in ~30 seconds.
3. Once the confetti appears, click **Continue to Dashboard** or **Visit**.
4. You will receive a live URL like:
   `https://apna-saathi.vercel.app` (or `https://apna-saathi-platform-*.vercel.app`).

### Verify SPA Routing:
Try navigating to `/login`, `/rider`, or `/merchant` and refresh the page.
Because of [`client/vercel.json`](file:///c:/Users/harsh/OneDrive/Desktop/harsh/Delivery-Partner/client/vercel.json), direct links and browser refreshes will load properly without 404 errors!

---

## Step 5: Connect Vercel URL to Render Backend (CORS)

For your frontend on Vercel to communicate with your backend on Render without CORS errors:

1. Copy your Vercel production URL:
   `https://apna-saathi.vercel.app`
2. Go to your **Render Dashboard** ➔ Click on your backend Web Service.
3. Open the **Environment** tab.
4. Update or add the **`CLIENT_URL`** variable:
   ```env
   CLIENT_URL=https://apna-saathi.vercel.app,http://localhost:3000
   ```
5. Click **Save Changes**. Render will automatically restart with the new CORS permissions!

---

## Troubleshooting & Common Questions

### 1. Direct Links Return 404 on Page Refresh
- **Cause**: Standard Vite apps are Single Page Applications (SPAs). Without server rewrites, visiting `/login` asks the web server for `login.html`, which doesn't exist.
- **Fix**: We created `client/vercel.json` with rewrite rules pointing all routes to `/index.html`.

### 2. Failed to Fetch / Network Error on Login
- **Cause**: `VITE_API_URL` is pointing to `localhost` or an incorrect backend URL.
- **Fix**: In Vercel Project Settings ➔ **Environment Variables**, verify that `VITE_API_URL` is set to `https://<your-render-backend>.onrender.com/api`. After editing, trigger a redeploy (Deployments ➔ Redeploy).

### 3. Socket.io Connection Fails
- **Cause**: `VITE_SOCKET_URL` contains `/api` or a trailing slash.
- **Fix**: `VITE_SOCKET_URL` should be just the domain root without `/api` (e.g. `https://your-backend.onrender.com`).

### 4. Updating Code Later
Every time you push code to `main` on GitHub:
```bash
git push origin main
```
Vercel automatically triggers a preview or production build in seconds with zero downtime!
