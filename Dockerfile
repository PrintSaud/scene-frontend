# Use Node 20
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy root package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy everything else (including vite-project/scene-app)
COPY . ./

# Build scene-app
WORKDIR /app/vite-project/scene-app
RUN npm run build

# Install serve globally
RUN npm install -g serve

# Expose port
EXPOSE 8080

# Serve the built files
CMD ["serve", "-s", "dist", "-l", "8080"]
