FROM node:20-alpine AS backend-deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev

FROM node:20-alpine AS backend
WORKDIR /app
COPY --from=backend-deps /app/node_modules ./node_modules
COPY . .
EXPOSE 3001
ENV NODE_ENV=production
ENV PORT=3001
CMD ["node", "src/server.js"]
