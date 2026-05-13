# Use Node 20 explicitly
FROM node:20-alpine

# Install openssl - required by Prisma on Alpine
RUN apk add --no-cache openssl

WORKDIR /app

# Copy root package files
COPY package.json package-lock.json ./

# Copy backend
COPY backend ./backend

# Copy frontend
COPY frontend ./frontend

# Install backend dependencies and generate Prisma client
WORKDIR /app/backend
RUN npm install --include=dev && npx prisma generate

# Install frontend dependencies and build
WORKDIR /app/frontend
RUN npm install --include=dev && npm run build

# Set working directory to backend for runtime
WORKDIR /app/backend

# Expose port
EXPOSE ${PORT:-5000}

# Start: run migrations, seed database, then start server
CMD npx prisma migrate deploy && node prisma/seed.js; node src/app.js
