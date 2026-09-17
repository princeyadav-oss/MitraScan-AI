# Multi-stage Dockerfile for MitraScan AI (Fullstack Unified Deployment)
# Stage 1: Build Frontend
FROM node:20-bookworm-slim AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# Stage 2: Production Backend & Static Serving
FROM node:20-bookworm-slim AS runner
WORKDIR /app

# Install Chromium and fonts for Puppeteer PDF report generation
RUN apt-get update && apt-get install -y --no-install-recommends \
    chromium \
    fonts-liberation \
    fonts-noto-color-emoji \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium \
    NODE_ENV=production \
    PORT=5000

# Install backend dependencies
WORKDIR /app/Backend
COPY Backend/package*.json ./
RUN npm ci --omit=dev

# Copy backend code & language data
COPY Backend/ ./

# Copy compiled frontend from builder into /app/frontend/dist
COPY --from=frontend-builder /app/frontend/dist /app/frontend/dist

EXPOSE 5000

CMD ["node", "server.js"]
