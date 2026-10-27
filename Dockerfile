# ---------- Stage 1: build ----------
FROM node:24-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY tsconfig.json tsconfig.build.json nest-cli.json ./
COPY src ./src
RUN npm run build && npm prune --omit=dev

# ---------- Stage 2: production ----------
FROM node:24-alpine AS production
ENV NODE_ENV=production
WORKDIR /app

COPY --from=builder --chown=node:node /app/package.json ./
COPY --from=builder --chown=node:node /app/node_modules ./node_modules
COPY --from=builder --chown=node:node /app/dist ./dist

USER node
EXPOSE 3000
# Apply pending migrations (compiled data source), then start the API.
CMD ["sh", "-c", "npm run migration:run:prod && npm run start:prod"]
