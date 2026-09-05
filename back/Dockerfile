FROM oven/bun:1-alpine AS base
WORKDIR /app
COPY package.json bun.lock* ./
RUN bun install
COPY . .
RUN ./node_modules/.bin/prisma generate

FROM base AS dev
EXPOSE 8081
CMD ["bun", "--hot", "src/server.ts"]

FROM base AS prod
EXPOSE 8081
CMD ["sh", "-c", "./node_modules/.bin/prisma migrate deploy && bun src/server.ts"]
