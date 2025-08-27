# Stage 1 - Build
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .

# Stage 2 - Runtime
FROM node:20-alpine
WORKDIR /app
COPY --from=build /app .
EXPOSE 8080
CMD ["npm", "start"]
