# Imagen de la app web de Alquilaap (carpeta web/). Railway la usa a través de railway.json.
# Imagen completa (no «slim»): ya trae OpenSSL, que necesita Prisma, sin instalar nada más.
FROM node:22-bookworm

WORKDIR /app
COPY web/package.json web/package-lock.json ./
RUN npm ci

COPY web/ ./
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

ENV NODE_ENV=production
EXPOSE 3000
# Aplica las migraciones pendientes y arranca. Railway indica el puerto en la variable PORT.
CMD ["npm", "run", "start:prod"]
