# ------------------------------------------------------------------------------
# Stage 1: Builder
# ------------------------------------------------------------------------------
FROM node:22-alpine AS builder

# Instalar pnpm globalmente
RUN npm install -g pnpm

WORKDIR /usr/src/app

# Copiar archivos de dependencias para aprovechar caché de capas
COPY package.json pnpm-lock.yaml ./
# Copiar la carpeta prisma antes de instalar para que el post-install de pnpm funcione
COPY prisma ./prisma/


# Instalar dependencias (incluyendo devDependencies para el build)
# --frozen-lockfile asegura reproducibilidad
RUN pnpm install --frozen-lockfile

# Copiar el código fuente
COPY . .

# Generar cliente de Prisma (DATABASE_URL dummy necesaria para validación)
ARG DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy"
RUN pnpm prisma generate 

# Compilar la aplicación (NestJS build -> dist/)
RUN pnpm build

# Limpiar dependencias de desarrollo para dejar solo las de prod en prepare
RUN pnpm prune --prod

# ------------------------------------------------------------------------------
# Stage 2: Runner (Production Image)
# ------------------------------------------------------------------------------
FROM node:22-alpine AS runner

# Variables de entorno por defecto (pueden sobreescribirse)
ENV NODE_ENV=production

WORKDIR /usr/src/app

# Crear usuario y grupo no-root por seguridad
# node:node ya suele existir en imágenes oficiales, pero aseguramos permisos
RUN chown -R node:node /usr/src/app

# Copiar desde el stage builder los artefactos necesarios
COPY --from=builder --chown=node:node /usr/src/app/package.json ./
# Copiar node_modules limpios (solo prod)
COPY --from=builder --chown=node:node /usr/src/app/node_modules ./node_modules
# Copiar el build compilado
COPY --from=builder --chown=node:node /usr/src/app/dist ./dist
# Copiar prisma para migraciones en start (opcional, mejor correr en CI/CD)
COPY --from=builder --chown=node:node /usr/src/app/prisma ./prisma

# Usar el usuario no privilegiado
USER node

# Exponer el puerto de la aplicación
EXPOSE 3000

# Comando de inicio
CMD ["node", "dist/main"]
