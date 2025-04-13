# Stage 1: Build stage - Entorno para construir la aplicación
FROM node:18-alpine AS builder
WORKDIR /app

# Copia package.json y package-lock.json (o yarn.lock)
COPY package*.json ./
# O si usas yarn:
# COPY package.json yarn.lock ./

# Instala dependencias de forma optimizada para CI/CD
RUN npm ci
# O si usas yarn:
# RUN yarn install --frozen-lockfile

# Copia el resto del código fuente
COPY . .

# Variables de entorno públicas para el build (si las necesitas aquí)
# ¡MEJOR PRÁCTICA!: Pásalas como variables de entorno en tiempo de ejecución o --build-arg si son necesarias EN el build.
# Ejemplo si fueran necesarias para build (ej. getStaticProps con env vars):
# ARG NEXT_PUBLIC_APPWRITE_ENDPOINT
# ARG NEXT_PUBLIC_APPWRITE_PROJECT_ID
# ENV NEXT_PUBLIC_APPWRITE_ENDPOINT=$NEXT_PUBLIC_APPWRITE_ENDPOINT
# ENV NEXT_PUBLIC_APPWRITE_PROJECT_ID=$NEXT_PUBLIC_APPWRITE_PROJECT_ID

# Construye la aplicación Next.js para producción
RUN npm run build

# Stage 2: Production stage - Entorno para ejecutar la aplicación
FROM node:18-alpine AS runner
WORKDIR /app

# Establece variables de entorno (mejor pasarlas al ejecutar el contenedor)
ENV NODE_ENV=production
# ¡NO INCLUYAS SECRETOS O CONFIGURACIÓN ESPECÍFICA DEL ENTORNO AQUÍ!
# Pásalos con 'docker run -e VARIABLE=valor'
# ENV NEXT_PUBLIC_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1 # Ejemplo de qué NO hacer si cambia
# ENV NEXT_PUBLIC_APPWRITE_PROJECT_ID=YOUR_PROJECT_ID         # Ejemplo de qué NO hacer si cambia
# ENV APPWRITE_API_KEY=YOUR_SERVER_SIDE_API_KEY_IF_NEEDED     # NUNCA INCLUIR CLAVES API AQUÍ

# Copia solo los artefactos necesarios desde el stage de build
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next # Añadido --chown si usas el usuario no-root
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

# (Opcional pero recomendado: Ejecutar como usuario no root por seguridad)
# RUN addgroup --system --gid 1001 nodejs
# RUN adduser --system --uid 1001 nextjs
# USER nextjs
# Si descomentas estas 3 líneas, también añade --chown=nextjs:nodejs a la copia de .next arriba
# para asegurar que el usuario tenga permisos.

# Expone el puerto en el que corre Next.js (por defecto 3000)
EXPOSE 3000

# Comando para iniciar la aplicación en producción
# Usa el script "start" de tu package.json
CMD ["npm", "start"]