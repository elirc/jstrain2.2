FROM node:22-bookworm-slim AS build
WORKDIR /app
COPY package*.json ./
COPY apps ./apps
COPY packages ./packages
COPY migrations ./migrations
COPY scripts ./scripts
RUN npm ci && npm run build
ENV PORT=4303 DATABASE_PATH=/data/schedule.db NODE_ENV=production
EXPOSE 4303
CMD ["sh","-c","npm run migrate && node dist/api/index.js"]
