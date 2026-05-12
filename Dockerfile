FROM node:20-alpine

WORKDIR /app

# Copy backend
COPY backend/package*.json ./backend/
RUN cd backend && npm ci --omit=dev

COPY backend ./backend

# Copy frontend
COPY frontend/package*.json ./frontend/
RUN cd frontend && npm ci

COPY frontend ./frontend

# Build frontend
RUN cd frontend && npm run build

# Generate Prisma client
RUN cd backend && npx prisma generate

EXPOSE 5000

CMD ["sh", "-c", "cd backend && npx prisma migrate deploy && node src/app.js"]
