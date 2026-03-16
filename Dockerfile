# Use an official Node.js runtime (Debian-based)
FROM node:18-bullseye

# Install SWI-Prolog (and clean up apt cache to keep image small)
RUN apt-get update && apt-get install -y swi-prolog && rm -rf /var/lib/apt/lists/*

# Set working directory inside container
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of the application (including your prolog folder)
COPY . .

# Expose the port your app listens on
EXPOSE 5000

# Start the app
CMD ["npm", "start"]