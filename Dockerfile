# Use Node.js Alpine image for smaller size and faster builds
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files first to leverage Docker cache
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Copy only necessary files
COPY server.js .
COPY src/models ./src/models
COPY src/actions ./src/actions
COPY build ./build

# Environment variables
ENV PORT=3000
ENV BACKEND_PORT=5000
ENV NODE_ENV=production

# Expose ports
EXPOSE 3000 5000

# Start the server
CMD ["node", "server.js"] 