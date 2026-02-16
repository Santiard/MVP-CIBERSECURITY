# Frontend multi-stage Dockerfile (React placeholder)
FROM node:18-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm ci --silent

COPY . .
# Build the static assets (CRA uses "build", Vite uses "build" too)
RUN npm run build --silent || true

FROM nginx:stable-alpine
COPY --from=build /app/build /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
