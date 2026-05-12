# Use Node 20 explicitly
FROM node:20-alpine

WORKDIR /app

# Copy root package files
COPY package.json package-lock.json ./

# Copy backend
COPY backend ./backend

# Copy frontend
COPY frontend ./frontend

# Install backend dependencies and generate Prisma client
RUN cd backend && npm install --include=dev && npx prisma generate

# Install frontend dependencies and build
RUN cd frontend && npm install --include=dev && npm run build

# Expose port
EXPOSE ${PORT:-5000}

# Start: run migrations then start server
CMD cd backend && npx prisma migrate deploy && node src/app.js
