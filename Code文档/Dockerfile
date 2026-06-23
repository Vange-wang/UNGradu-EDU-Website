FROM node:22-alpine AS deps

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

FROM node:22-alpine AS builder

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
ENV APP_ENV=test
ENV CLOUDBASE_ENV_ID=ungradu-edu-test-d0ed1mqeceb0ae1
ENV TENCENTCLOUD_SECRETID=AKIDBUILDPLACEHOLDER
ENV TENCENTCLOUD_SECRETKEY=build-key-placeholder
ENV AUTH_SESSION_SECRET=build-session-placeholder-for-next-standalone-output
RUN mkdir -p public
RUN npm run build

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
