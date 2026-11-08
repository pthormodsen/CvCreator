# Steg 1: bygg appen med Node. Resultatet er statiske filer i /app/dist.
FROM node:22-alpine AS build
WORKDIR /app
# Kopier bare pakkefilene først, så Docker kan gjenbruke npm ci-laget
# når bare kildekoden er endret
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

# Steg 2: server filene med nginx. Node og node_modules blir ikke med hit.
# nginx-unprivileged kjører som en vanlig bruker (ikke root) og lytter på 8080.
FROM nginxinc/nginx-unprivileged:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 8080
