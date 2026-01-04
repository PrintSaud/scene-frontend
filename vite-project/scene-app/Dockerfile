FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files from root
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy scene-app source
COPY scene-app/ ./scene-app/

# Build the app
WORKDIR /app/scene-app
RUN npm run build

# Install serve
RUN npm install -g serve

# Expose port
EXPOSE 8080

# Serve the built files
CMD ["serve", "-s", "dist", "-l", "8080"]
