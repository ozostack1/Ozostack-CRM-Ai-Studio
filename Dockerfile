# syntax=docker/dockerfile:1

FROM node:22-slim AS builder
WORKDIR /app

COPY . .
ENV NODE_ENV=production
RUN if [ ! -f dist/index.html ]; then rm -f package-lock.json && npm install && npm run build; fi

FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8080
ENV HOSTNAME="0.0.0.0"

RUN npm init -y > /dev/null && npm install mongodb@6.6.0 nodemailer@6.9.16 imapflow@1.0.171 mailparser@3.7.2 --no-save

COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server.mjs ./server.mjs

EXPOSE 8080

CMD ["node", "server.mjs"]
