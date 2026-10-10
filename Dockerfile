FROM node:22-alpine AS build
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY package*.json ./
RUN npm install --no-fund --no-audit
COPY . .
RUN npm run test && npm run typecheck && npm run build

FROM nginxinc/nginx-unprivileged:stable-alpine
COPY --from=build /app/out /usr/share/nginx/html
EXPOSE 8080
