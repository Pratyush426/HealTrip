# Build Stage 1: Frontend
FROM node:18-alpine AS frontend-build
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
# We set this to blank so it uses relative paths (relative to the domain it's hosted on)
ENV REACT_APP_API_URL=/api
RUN npm run build

# Build Stage 2: Backend
FROM node:18-alpine
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm install --production
COPY backend/ ./

# Copy frontend build to backend static folder
# Note: server.js is configured to look at ../../frontend/build
# In Docker, we can structure it similarly
WORKDIR /app
COPY --from=frontend-build /app/frontend/build ./frontend/build

# Final setup
WORKDIR /app/backend
ENV NODE_ENV=production
ENV PORT=5000
EXPOSE 5000

CMD ["node", "src/server.js"]
