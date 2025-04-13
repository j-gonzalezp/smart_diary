# Stage 1: Build stage - Entorno para construir la aplicación
# Usar un tag específico para Node.js 18 LTS en Alpine (reemplaza con la última versión LTS si es necesario)
FROM node:18.20.2-alpine AS builder
WORKDIR /app

# Copia package.json y package-lock.json (o yarn.lock) de forma eficiente para caché
COPY package*.json ./
# O si usas yarn:
# COPY package.json yarn.lock ./

# Instala TODAS las dependencias (incluyendo devDependencies) necesarias para build y test
# 'npm ci' es más rápido y seguro para CI/CD que 'npm install'
RUN npm ci
# O si usas yarn:
# RUN yarn install --frozen-lockfile

# Copia el resto del código fuente
COPY . .

# Si necesitaras variables públicas EN EL MOMENTO DEL BUILD (raro para Appwrite, común para otras APIs)
# Descomenta y pásalas con --build-arg en el comando 'docker build'
# ARG NEXT_PUBLIC_VAR_FOR_BUILD
# ENV NEXT_PUBLIC_VAR_FOR_BUILD=$NEXT_PUBLIC_VAR_FOR_BUILD

# Construye la aplicación Next.js para producción
# Asegúrate de que las variables NEXT_PUBLIC_ que SÍ se leen en tiempo de build estén disponibles aquí
# (Mejor pasarlas como ARG o usar las que se leen en tiempo de ejecución)
RUN npm run build

# Stage 2: Production stage - Entorno mínimo para ejecutar la aplicación
# Usa la misma base específica y limpia
FROM node:18.20.2-alpine AS runner
WORKDIR /app

# Establece el entorno a producción (Next.js se optimiza para esto)
ENV NODE_ENV=production
# NO pongas variables de entorno como Endpoints o API Keys aquí.
# Se pasan al ejecutar el contenedor con 'docker run -e ...'

# Crea un grupo y usuario no-root para ejecutar la aplicación (Mejor práctica de seguridad)
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copia solo los artefactos necesarios desde el stage 'builder'
# Copia public, .next (con permisos para el nuevo usuario), node_modules, y package.json
COPY --from=builder /app/public ./public
# ¡Importante! Añade la barra final '/' y usa --chown para dar permisos al usuario 'nextjs'
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next/
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

# Cambia al usuario no-root
USER nextjs


EXPOSE 5000

# Comando para iniciar la aplicación en modo producción usando el script 'start'
CMD ["npm", "start"]