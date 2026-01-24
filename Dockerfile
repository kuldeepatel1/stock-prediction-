# Stage 1: builder (install all deps + build)
FROM node:18-alpine AS builder
WORKDIR /app

# Copy package manifests
COPY package.json package-lock.json ./

# Install dev + prod dependencies so that vite CLI is available
RUN npm ci

# Copy rest of source
COPY . .

# Build the Vite app
RUN npm run build

# Stage 2: serve static via Nginx
FROM nginx:alpine
WORKDIR /usr/share/nginx/html

# Remove default content
RUN rm -rf ./*

# Copy built assets from builder
COPY --from=builder /app/dist ./

# Copy custom Nginx config (if any)
COPY nginx.conf /etc/nginx/nginx.conf

# Expose port 80 and run Nginx
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
