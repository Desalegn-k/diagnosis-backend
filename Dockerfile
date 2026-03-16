# Use an official Node.js runtime as base (Debian bullseye includes apt)
FROM node:18-bullseye

# Install SWI-Prolog
RUN apt-get update && apt-get install -y swi-prolog && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of the application
COPY . .

# Expose the port your app runs on
EXPOSE 5000

# Start the application
CMD ["npm", "start"]