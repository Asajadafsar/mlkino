# Stage 1: Build React App
FROM node:20-alpine AS build

WORKDIR /app

# Copy dependencies files and install
COPY package*.json ./
RUN npm install --force

# Copy all files and build
COPY . .
RUN npm run build

# Stage 2: Serve the App using 'serve'
FROM node:20-alpine AS production

WORKDIR /app

# Install 'serve' globally
RUN npm install -g serve

# Copy the build folder from the previous stage
COPY --from=build /app/build ./build

# Expose the port used by 'serve'
EXPOSE 3000

# Start the app using 'serve'
CMD ["serve", "-s", "build", "-l", "3000"]
