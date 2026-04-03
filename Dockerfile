FROM node:18-alpine

WORKDIR /app

# Copy package files first (for better caching)
COPY package*.json ./
RUN npm ci --only=production

# Copy the rest of the application
COPY . .

EXPOSE 5000

# Start the application
CMD ["node", "server.js"]