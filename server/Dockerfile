FROM node:20.11 as builder

RUN mkdir -p /app
WORKDIR /app

COPY package.json package-lock.json tsconfig.json ./
RUN  npm ci --quiet

COPY ./src src

RUN npm run build

# Production image
FROM node:20.11-alpine

RUN mkdir -p /app
WORKDIR /app
ENV NODE_ENV production
ENV DATABASE_URL="file:./dev.db"

COPY package*.json ./
RUN npm ci --only=production --quiet

RUN ls ./node_modules

COPY --from=builder /app/dist /app/dist
COPY ./prisma prisma

RUN npx prisma generate

EXPOSE 8080
CMD ["node", "dist/index.js"]