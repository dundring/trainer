# HACK: Pinned to 3.20 since 3.21 moves libfiles from /lib to /usr/lib.
# Unpin when Prisma is upgraded
FROM node:20-alpine3.20 AS base

FROM base AS builder
RUN apk add --no-cache libc6-compat
RUN apk update
WORKDIR /app
RUN yarn global add turbo
COPY . .
RUN turbo prune --scope=@dundring/backend --scope=@dundring/frontend --docker

FROM base AS installer
RUN apk add --no-cache libc6-compat
RUN apk update
WORKDIR /app

# First install dependencies (as they change less often)
COPY .gitignore .gitignore
COPY --from=builder /app/out/json/ .
COPY --from=builder /app/out/yarn.lock ./yarn.lock
RUN yarn install --ignore-scripts --frozen-lockfile

# Build the project and its dependencies
COPY --from=builder /app/out/full/ .
COPY turbo.json turbo.json

RUN yarn turbo run build --filter=@dundring/frontend --filter=@dundring/backend

FROM base AS runner
WORKDIR /app

RUN addgroup --system --gid 1001 expressjs
RUN adduser --system --uid 1001 expressjs
COPY --from=installer /app .

ENTRYPOINT ["/app/apps/backend/docker-entrypoint.sh"]
CMD ["node", "/app/apps/backend/build/server.js"]
