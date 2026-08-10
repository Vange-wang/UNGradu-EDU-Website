FROM node:22-alpine AS deps

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

FROM node:22-alpine AS builder

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
RUN mkdir -p public
# Build-only synthetic inputs are scoped to this layer and are never runtime
# environment variables or production secrets. Runtime credentials are injected
# by the deployment platform after the image is built.
RUN APP_ENV=test \
  CLOUDBASE_ENV_ID=ungradu-edu-test-d0ed1mqeceb0ae1 \
  TENCENTCLOUD_SECRETID=build-only-placeholder \
  TENCENTCLOUD_SECRETKEY=build-only-placeholder \
  AUTH_SESSION_SECRET=build-only-placeholder \
  npm run build

FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

CMD ["node", "server.js"]
