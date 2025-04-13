# FlexibleLog: Diario Personal (con Prácticas DevOps)

FlexibleLog es una aplicación de Diario Personal desarrollada con Next.js y Appwrite Cloud como backend (BaaS). Este proyecto sirve como un ejercicio práctico intensivo para implementar y comprender prácticas fundamentales de DevOps aplicadas a una aplicación web moderna.

El objetivo principal no es solo construir la funcionalidad de la aplicación, sino hacerlo aplicando correctamente:

*   **Contenerización:** Uso de Docker y Docker Compose para crear entornos consistentes y portables.
*   **Simulación de Entorno de Producción:** Configuración de Nginx como Reverse Proxy para manejar HTTPS localmente, reflejando despliegues reales y solucionando problemas relacionados (cookies `Secure`, Server Actions).
*   **(Próximas Fases):** Pruebas Automatizadas (Jest, React Testing Library), Integración Continua y Despliegue Continuo (CI/CD con GitHub Actions), y Estrategias de Ramificación (Git Flow simplificado).

## Funcionalidades Actuales (MVP Diario)

*   **Autenticación de Usuarios:** Registro e inicio de sesión seguro usando Appwrite Authentication (Email/Password).
*   **Gestión de Entradas:** Crear, ver (y próximamente editar/eliminar) entradas de texto en el diario.
*   **Persistencia de Datos:** Las entradas se almacenan de forma segura en Appwrite Cloud Database, asociadas a cada usuario.
*   **Entorno Dockerizado:** La aplicación completa (Next.js + Proxy Nginx) se ejecuta localmente usando Docker Compose.

## Tecnologías Utilizadas

*   **Frontend:** Next.js (v15+ con App Router), React (v19), Tailwind CSS (v4)
*   **Backend (BaaS):** Appwrite Cloud
    *   Authentication
    *   Databases
*   **Contenerización:** Docker, Docker Compose
*   **Reverse Proxy:** Nginx (para HTTPS local)
*   **Certificados Locales:** `mkcert`
*   **Control de Versiones:** Git, GitHub
*   **Lenguaje:** TypeScript

## Entorno de Desarrollo Local (¡Importante!)

Este proyecto está diseñado para ejecutarse dentro de contenedores Docker, simulando un entorno de producción con HTTPS.

### Prerrequisitos

*   **Git:** Para clonar el repositorio.
*   **Docker Desktop:** Instalado y corriendo (incluye Docker Engine y Docker Compose).
*   **mkcert:** Instalado (ver [instrucciones de mkcert](https://github.com/FiloSottile/mkcert)) y ejecutado `mkcert -install` una sola vez.

### Pasos para Ejecutar

1.  **Clonar el Repositorio:**
    ```bash
    git clone https://github.com/j-gonzalezp/smart_diary
    cd flexiblelog
    ```

2.  **Generar Certificados SSL Locales:**
    ```bash
    # Crear directorio para certificados (incluido en .gitignore)
    mkdir .certs
    # Generar certificados para localhost
    mkcert -key-file ./.certs/localhost-key.pem -cert-file ./.certs/localhost.pem "localhost" 127.0.0.1 ::1
    ```

3.  **Configurar Variables de Entorno de Appwrite:**
    *   Crea un archivo llamado `.env` en la raíz del proyecto. **Este archivo NO debe ser comiteado a Git** (asegúrate de que `.env` está en tu `.gitignore`).
    *   Añade las siguientes variables con tus credenciales de Appwrite Cloud:

        ```dotenv
        # .env
        NEXT_PUBLIC_APPWRITE_ENDPOINT="https://cloud.appwrite.io/v1"
        NEXT_PUBLIC_APPWRITE_PROJECT="TU_PROJECT_ID_AQUI"
        NEXT_PUBLIC_APPWRITE_DATABASE="TU_DATABASE_ID_AQUI"
        NEXT_PUBLIC_APPWRITE_ENTRIES_COLLECTION="TU_ENTRIES_COLLECTION_ID_AQUI"
        NEXT_PUBLIC_APPWRITE_PENDINGTASKS_COLLECTION="" # Añadir si se usa
        NEXT_PUBLIC_APPWRITE_USERS_COLLECTION="TU_USERS_COLLECTION_ID_AQUI"

        # ¡IMPORTANTE! Clave API secreta de Appwrite (si la usas en API Routes/Backend)
        # Asegúrate de que esta clave tenga los permisos mínimos necesarios.
        NEXT_APPWRITE_KEY="TU_CLAVE_API_SECRETA_AQUI"
        ```
    *   **Nota:** El archivo `docker-compose.yml` está configurado para leer estas variables del archivo `.env`.

4.  **Construir y Ejecutar con Docker Compose:**
    ```bash
    docker-compose up --build
    ```
    *   La opción `--build` es necesaria la primera vez o si cambias el código de la aplicación o el `Dockerfile`.
    *   Para iniciar después sin reconstruir (más rápido): `docker-compose up`
    *   Para detener: `Ctrl + C` en la terminal, o `docker-compose down` en otra terminal.

5.  **Acceder a la Aplicación:**
    *   Abre tu navegador y ve a: `https://localhost:5000`
    *   Deberías ver la aplicación corriendo sobre HTTPS sin advertencias de seguridad.

### ¿Por qué Nginx y HTTPS Local?

Usamos Nginx como reverse proxy para:

1.  **Habilitar HTTPS localmente:** Esto es crucial porque Appwrite Cloud establece cookies de sesión con la bandera `Secure`, que los navegadores solo envían a través de conexiones HTTPS. Sin HTTPS local, el login funcionaría pero la aplicación no reconocería la sesión del usuario correctamente.
2.  **Resolver problemas de Server Actions:** Las Server Actions de Next.js tienen protecciones CSRF que requieren que los headers `Host` y `Origin` coincidan. Nginx se configura para pasar los headers correctos (`proxy_set_header Host $http_host;`) y permitir que las Server Actions funcionen detrás del proxy.
3.  **Simular Producción:** Es una práctica estándar desplegar aplicaciones Node.js detrás de un reverse proxy que maneje el SSL/TLS.

## Objetivos de Aprendizaje (DevOps)

*   ✅ **Containerización:** Crear `Dockerfile` optimizado (multi-stage builds), usar `.dockerignore`, ejecutar como usuario no-root.
*   ✅ **Orquestación Local:** Configurar `docker-compose` para multi-container setup (App + Proxy).
*   ✅ **Configuración de Red/Proxy:** Implementar Nginx como reverse proxy, gestionar certificados SSL locales (`mkcert`), entender `proxy_pass` y el paso de headers (`X-Forwarded-For`, `Host`, etc.).
*   ✅ **Gestión de Entorno:** Manejar variables de entorno de forma segura para Docker (`.env` file + `docker-compose`).
*   ⏳ **Pruebas Automatizadas:** (Fase 3) Implementar tests unitarios y de integración con Jest/RTL.
*   ⏳ **CI/CD:** (Fase 4) Crear un pipeline con GitHub Actions para build, test y (opcional) despliegue.
*   ⏳ **Gestión de Ramas:** (Fase 5) Aplicar estrategia Git Flow simplificada (main, develop, feature).

## Estado Actual

El MVP del Diario Personal es funcional y se ejecuta completamente dentro de Docker con Nginx manejando HTTPS. Se han sentado las bases para las siguientes fases de implementación de DevOps.

## Próximos Pasos

*   Implementar Pruebas Automatizadas (Fase 3).
*   Configurar el pipeline de CI/CD (Fase 4).
*   Establecer y practicar la estrategia de ramificación (Fase 5).
*   (Opcional) Añadir funcionalidades del Todo List.