FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm install

# Copy application code (explicitly include prolog folder)
COPY . .

# Verify the prolog file exists after copy
RUN ls -la prolog/ && head -5 prolog/diagnosis_rules.pl

EXPOSE 5000
CMD ["npm", "start"]