# Use Node.js Alpine image
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Install bash (Alpine doesn’t include it by default)
RUN apk add --no-cache bash

# Copy only package files first (for Docker caching)
COPY ./package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the app code
COPY . .

# Build the Nuxt app (generates .output/)
RUN npm run build

# Expose the port Nuxt listens on
EXPOSE 3000

# Environment variable
ENV NODE_ENV=production

# Run migration + start server
CMD ["sh", "-c", "./wait-for-it.sh db:5432 -- npx drizzle-kit migrate --config drizzle.config.ts && node .output/server/index.mjs"]
