# Use official Node.js image
FROM node:18

# Set working directory
WORKDIR /app

# Accept a build argument for NODE_ENV (default to 'production')
ARG NODE_ENV=development
ENV NODE_ENV=$NODE_ENV

# Copy package.json and yarn.lock first (for caching dependencies)
COPY package.json yarn.lock ./

# Install all dependencies (including dev dependencies) if NODE_ENV is development
RUN yarn install

# Copy the rest of the application files
COPY . .

# Build the Next.js application (only for production)
RUN if [ "$NODE_ENV" = "production" ]; then yarn build; fi

# Expose the port Next.js runs on
EXPOSE 4000

# Start the frontend with the appropriate command based on NODE_ENV
CMD if [ "$NODE_ENV" = "development" ]; then yarn dev; else yarn start; fi
