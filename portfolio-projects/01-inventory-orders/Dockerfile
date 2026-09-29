FROM node:22-bookworm-slim AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
ENV PORT=4011 DATABASE_PATH=/data/inventory.db SESSION_SECRET=replace-in-runtime-with-32-characters
EXPOSE 4011
CMD ["node","dist/apps/api/src/server.js"]
