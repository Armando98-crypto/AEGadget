FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
COPY prisma ./prisma/
RUN npm install --legacy-peer-deps

# Generate Prisma client
RUN npx prisma generate

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build

# Run migrations and start server
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/server.js"]
