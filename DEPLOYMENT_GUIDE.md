# MitraScan AI — Complete Cloud Deployment Guide

This guide walks you through deploying **MitraScan AI** (both Frontend and Backend) to the cloud for free using modern, reliable hosting platforms.

---

## 🏗 Deployment Architectures

You have two simple ways to deploy:

| Architecture | Frontend | Backend | Database | Best For |
| :--- | :--- | :--- | :--- | :--- |
| **Option A (Recommended)** | **Vercel** | **Render Web Service** | **MongoDB Atlas** | Fast global CDN for React, independent scaling, zero cost |
| **Option B (All-in-One)** | Built into Backend | **Render Web Service** | **MongoDB Atlas** | Single service deployment, zero CORS configuration needed |
| **Option C (Docker/VPS)** | Container | Container | Docker / Atlas | Self-hosting, Railway, Fly.io, AWS, DigitalOcean |

---

## 📋 Prerequisites

1. Your code pushed to a GitHub repository (e.g., `https://github.com/princeyadav-oss/MitraScan-AI`).
2. Free accounts on:
   - [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) (Cloud Database)
   - [Render](https://render.com) (Backend API hosting)
   - [Vercel](https://vercel.com) (Frontend hosting)

---

## Step 1: Set Up MongoDB Atlas (Database)

1. Sign in to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. Create a new project and click **Create a Deployment** (Select **M0 Free Cluster**).
3. **Database Access**:
   - Go to **Security** → **Database Access** → Click **Add New Database User**.
   - Create a username and strong password (save these!).
   - Set Built-in Role to **Read and write to any database**.
4. **Network Access (Crucial)**:
   - Go to **Security** → **Network Access** → Click **Add IP Address**.
   - Choose **Allow Access from Anywhere** (`0.0.0.0/0`).
   - Click **Confirm**. *(If this is not set, cloud hosts like Render will not be able to connect!)*
5. **Get Connection String**:
   - Go to **Database** → Click **Connect** on your cluster.
   - Choose **Drivers** (Node.js).
   - Copy the connection string:
     ```text
     mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
     ```
   - Replace `<username>` and `<password>` with the credentials created in step 3.

---

## Step 2: Deploy Backend to Render

1. Sign in to [Render](https://render.com).
2. Click **New +** → **Web Service**.
3. Connect your GitHub repository (`MitraScan-AI`).
4. Configure the service:
   - **Name**: `mitrascan-backend`
   - **Region**: Choose closest to you (e.g., Oregon, Frankfurt, or Singapore)
   - **Branch**: `main`
   - **Root Directory**: *(Leave empty)*
   - **Runtime**: `Node`
   - **Build Command**:
     ```bash
     cd Backend && npm install
     ```
   - **Start Command**:
     ```bash
     cd Backend && npm start
     ```
   - **Instance Type**: `Free`
5. Click **Advanced** and add the following **Environment Variables**:
   | Key | Value | Description |
   | :--- | :--- | :--- |
   | `NODE_ENV` | `production` | Enables production optimizations |
   | `PORT` | `5000` | Render assigns port dynamically, but 5000 is default |
   | `MONGODB_URI` | `mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority` | Your Atlas connection string from Step 1 |
   | `MONGODB_DB_NAME` | `mitrascan` | Database name |
   | `JWT_SECRET` | *(Generate a 32+ char random string)* | Used to sign JWT auth tokens |
   | `JWT_EXPIRES_IN` | `8h` | Token validity |
   | `FRONTEND_URL` | `*` *(or your Vercel URL later)* | Allowed CORS origin |
6. Click **Deploy Web Service**.
7. Wait 2–3 minutes for the build to finish.
8. Once live, Render gives you a URL like:
   ```text
   https://mitrascan-backend-xxxx.onrender.com
   ```
9. **Verify Backend Health**: Open in your browser:
   `https://mitrascan-backend-xxxx.onrender.com/api/health`
   You should receive:
   ```json
   {
     "ok": true,
     "service": "mitrascan-api",
     "storage": "mongodb",
     "pdfBrowser": "configured",
     "timestamp": "..."
   }
   ```

---

## Step 3: Deploy Frontend to Vercel (Option A - Recommended)

1. Sign in to [Vercel](https://vercel.com).
2. Click **Add New...** → **Project**.
3. Import your GitHub repository (`MitraScan-AI`).
4. Configure the Project:
   - **Project Name**: `mitrascan-ai`
   - **Framework Preset**: `Vite` (auto-detected)
   - **Root Directory**: Click **Edit** and select `frontend` *(Important!)*
   - **Build & Output Settings**: Leave default (`npm run build` / `dist`)
5. Expand **Environment Variables** and add:
   | Key | Value |
   | :--- | :--- |
   | `VITE_API_URL` | `https://mitrascan-backend-xxxx.onrender.com/api` |
6. Click **Deploy**.
7. In ~30 seconds, Vercel will give you a live production domain, e.g.:
   ```text
   https://mitrascan-ai.vercel.app
   ```
8. **Final Link**: Go back to Render → your `mitrascan-backend` Web Service → **Environment Variables** → update `FRONTEND_URL` to `https://mitrascan-ai.vercel.app`.

---

## Option B: Unified All-in-One Deployment on Render

If you want **one single URL** and **no separate frontend deployment**:

1. In Render, create a **Web Service** with your repo:
   - **Build Command**:
     ```bash
     npm run build && cd Backend && npm install
     ```
   - **Start Command**:
     ```bash
     cd Backend && npm start
     ```
   - **Environment Variables**:
     - `NODE_ENV` = `production`
     - `MONGODB_URI` = `<your-atlas-uri>`
     - `MONGODB_DB_NAME` = `mitrascan`
     - `JWT_SECRET` = `<your-jwt-secret>`
     - `JWT_EXPIRES_IN` = `8h`
2. Render builds the React frontend into `frontend/dist`.
3. The Express backend automatically serves the React SPA at `/` and the API at `/api/*`!

---

## Option C: Deploy with Docker (Railway / Fly.io / VPS)

The project includes a multi-stage production `Dockerfile` with pre-installed Chromium and glibc dependencies.

### Local or VPS Docker run:
```bash
docker compose up --build
```
The app will be live at `http://localhost:5000` with MongoDB running in a container.

### Deploy to Railway / Fly.io:
Simply connect your GitHub repo and choose Dockerfile deployment. The container starts automatically and handles all Sharp, Tesseract, and Puppeteer dependencies.

---

## ✅ Post-Deployment Verification Checklist

Once deployed, verify that the critical features work end-to-end:

- [ ] **Health Endpoint**: Visit `https://your-backend-url/api/health` — ensure `"storage": "mongodb"` is returned.
- [ ] **Registration & Login**: Create a new account on the live frontend and log in.
- [ ] **Image Upload & OCR**: Upload a food label image (e.g. JPG or PNG) and verify OCR extracts text and runs the Legal Metrology compliance checks.
- [ ] **Product URL Audit**: Enter an e-commerce food product URL (e.g., Blinkit, Amazon, Flipkart) and run the audit.
- [ ] **PDF Report Download**: Click **Download Legal Report (PDF)** on an audit to ensure PDF generation works seamlessly.
- [ ] **Health Shield & Calorie Tracker**: Toggle health shields (e.g., Diabetic, Celiac) and check real-time hazard detection.

---

## 🛠 Troubleshooting

- **CORS Error in Browser**:
  Verify that your frontend's `VITE_API_URL` environment variable matches your Render backend URL (including `https://`). The backend CORS middleware accepts requests from any origin or configured `FRONTEND_URL`.
- **Backend sleeping on Render Free Tier**:
  Render free tier Web Services spin down after 15 minutes of inactivity. The first request after sleep may take ~30–45 seconds to wake up. You can use a free uptime monitor (like [UptimeRobot](https://uptimerobot.com)) pinging `https://your-backend-url/api/health` every 10 minutes to keep it warm!
- **MongoDB connection timeout**:
  Check MongoDB Atlas → **Network Access** → ensure `0.0.0.0/0` is listed and status is Active.
