# Base image
FROM node:20-slim

# Accept user ID and group ID as build arguments
ARG USER_ID=1000
ARG GROUP_ID=1000

# Install Chromium, build tools, and dependencies
RUN apt-get update && apt-get install -y \
    chromium \
    chromium-sandbox \
    fonts-liberation \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libatspi2.0-0 \
    libcups2 \
    libdbus-1-3 \
    libdrm2 \
    libgbm1 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libwayland-client0 \
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    libxkbcommon0 \
    libxrandr2 \
    xdg-utils \
    libu2f-udev \
    libvulkan1 \
    ca-certificates \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Install pnpm globally
RUN npm install -g pnpm

# Update node user to match host user ID and group ID
RUN groupmod -g ${GROUP_ID} node && \
    usermod -u ${USER_ID} -g ${GROUP_ID} node

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install dependencies (build native modules from source)
RUN pnpm install --frozen-lockfile

# Rebuild better-sqlite3 using npm (works more reliably than pnpm rebuild)
RUN npm rebuild better-sqlite3

# Copy application code
COPY . .

# Build SvelteKit application
RUN pnpm run build

# Create data directories with proper ownership
RUN mkdir -p data .wwebjs_auth .wwebjs_cache && \
    chown -R node:node /app

# Switch to node user
USER node

# Set Puppeteer environment variables
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
ENV NODE_ENV=production

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})" || exit 1

# Start application
CMD ["node", "scripts/start.js"]
