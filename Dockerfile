# ---- Build stage ----
FROM node:20-alpine AS build
WORKDIR /app

# Copy only package files for faster caching (adjust path to your app)
COPY flick-frontend/vite-project/scene-app/package*.json ./ 
# If monorepo uses lock file at root, also copy it
COPY package-lock.json ./ 

# Install dependencies
RUN npm ci --production=false

# Copy the rest of the scene-app source
COPY flick-frontend/vite-project/scene-app/ ./

# Build / export web site
RUN if [ -f package.json ] && grep -q expo package.json; then \
      npx expo export:web --output web-build; \
    else \
      npm run build; \
    fi

# ---- Production stage (serve static) ----
FROM nginx:stable-alpine AS prod
RUN rm -rf /usr/share/nginx/html/*

COPY --from=build /app/web-build/ /usr/share/nginx/html/
COPY --from=build /app/dist/ /usr/share/nginx/html/
COPY --from=build /app/build/ /usr/share/nginx/html/

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

