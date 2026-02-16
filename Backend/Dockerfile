# Backend multi-stage Dockerfile (Node + TypeScript / NestJS placeholder)
FROM node:18-alpine AS builder
WORKDIR /app

# Install dependencies based on package.json
COPY package*.json ./
RUN npm ci --silent

# Copy source and build
COPY . .
RUN npm run build --silent || true

FROM node:18-alpine
WORKDIR /app
ENV NODE_ENV=production

# Copy package files and built output
COPY package*.json ./
COPY --from=builder /app/dist ./dist

# Install only production deps
RUN npm ci --omit=dev --silent || true

EXPOSE 3000
CMD ["node", "dist/main.js"]
