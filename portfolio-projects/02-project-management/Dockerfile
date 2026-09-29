FROM node:22-bookworm-slim AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
ENV PORT=4202 DATABASE_PATH=/data/project-management.sqlite SESSION_SECRET=replace-this-secret-before-deployment
EXPOSE 4202
CMD ["npm","start"]
