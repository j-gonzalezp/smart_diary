# FlexibleLog: Diario Personal (con Implementación DevOps Completa)

FlexibleLog es una aplicación de Diario Personal desarrollada con Next.js (App Router, React 19, TypeScript) y Appwrite Cloud como backend (BaaS). Este proyecto sirve como un **ejercicio práctico intensivo (similar al "Ejercicio Práctico 2")** para implementar y comprender un ciclo DevOps completo aplicado a una aplicación web moderna.

El objetivo principal no es solo construir la funcionalidad, sino hacerlo aplicando rigurosamente: Contenerización (Docker), Pruebas Automatizadas (Jest/RTL), Integración Continua (GitHub Actions + GHCR) y Despliegue Continuo (Render).

## Tecnologías Utilizadas

*   **Frontend:** Next.js (v15+ con App Router), React (v19), Tailwind CSS (v4)
*   **Backend (BaaS):** Appwrite Cloud (Authentication, Databases)
*   **Contenerización:** Docker, Docker Compose
*   **Reverse Proxy (Local):** Nginx (para HTTPS local)
*   **Certificados Locales:** `mkcert`
*   **Pruebas Automatizadas:** Jest, React Testing Library (RTL)
*   **CI/CD:** GitHub Actions
*   **Registro de Contenedores:** GitHub Container Registry (GHCR)
*   **Hosting/Despliegue:** Render
*   **Control de Versiones:** Git, GitHub
*   **Lenguaje:** TypeScript

## Funcionalidades de la Aplicación (MVP Diario)

*   **Autenticación Segura:** Registro/Inicio de sesión vía OTP por Email usando Appwrite.
*   **Gestión de Entradas:** Crear y visualizar entradas de diario personales.
*   **Persistencia:** Datos almacenados de forma segura en Appwrite Cloud Database.

## Acceso a la Aplicación Desplegada (Render)

La aplicación está desplegada continuamente en Render:

*   **URL Pública:** [https://smart-diary.onrender.com]

**Flujo de Usuario:**

1.  Visita la URL pública.
2.  Utiliza el formulario para **Registrarte** (la primera vez con un email) o **Iniciar Sesión** (si ya te registraste). Deberás introducir tu nombre completo (solo al registrarte) y tu email.
3.  Recibirás un código **OTP (One-Time Password)** de 6 dígitos en tu email.
4.  Introduce el código OTP en el formulario.
5.  Si el OTP es correcto, serás autenticado y **automáticamente redirigido a la página del diario (`/entries`)**.
6.  En la página `/entries`, podrás ver tus entradas existentes y (eventualmente) crear nuevas.

## Configuración y Ejecución Local (Dockerizado con HTTPS)

Este proyecto está diseñado para ejecutarse localmente mediante Docker, simulando un entorno de producción con HTTPS gestionado por Nginx.

### Prerrequisitos

*   Git
*   Docker Desktop (o Docker Engine + Docker Compose)
*   `mkcert` instalado (y `mkcert -install` ejecutado una vez)

### Pasos para Ejecutar Localmente

1.  **Clonar:**
    ```bash
    git clone https://github.com/j-gonzalezp/smart_diary 
    cd smart_diary 
    ```
2.  **Generar Certificados SSL:**
    ```bash
    mkdir .certs
    mkcert -key-file ./.certs/localhost-key.pem -cert-file ./.certs/localhost.pem "localhost" 127.0.0.1 ::1
    ```
3.  **Configurar Variables de Entorno:**
    *   Crea un archivo `.env` en la raíz (ignorado por Git).
    *   Añade tus credenciales de Appwrite Cloud (`NEXT_PUBLIC_APPWRITE_ENDPOINT`, `NEXT_PUBLIC_APPWRITE_PROJECT_ID`, `NEXT_APPWRITE_KEY`, IDs de Base de Datos/Colecciones, etc.).
4.  **Construir y Ejecutar:**
    ```bash
    docker-compose up --build
    ```
5.  **Acceder:** `https://localhost:3000` 

---

## Implementación DevOps (Fases Completadas)

A continuación, se detallan las fases de implementación DevOps completadas, alineadas con objetivos prácticos.

### Fase 1 & 2: Contenerización y Orquestación Local

*   ✅ **Dockerfile Optimizado:** Multi-stage build, usuario no-root, copiado selectivo de artefactos.
*   ✅ **Docker Compose:** Gestión del entorno multi-contenedor (App + Proxy Nginx).
*   ✅ **Nginx Reverse Proxy:** Configuración para HTTPS local (usando `mkcert`), manejo de headers (`Host`, `X-Forwarded-For`) para compatibilidad con Next.js Server Actions y cookies seguras de Appwrite.
*   ✅ **Gestión de Entorno Local:** Uso de archivo `.env` con Docker Compose.

### Fase 3: Pruebas Automatizadas (Req. 1 - Pruebas Unitarias y de Integración)

Se implementaron pruebas con **Jest** y **React Testing Library (RTL)**.

*   **Pruebas de Componente:** Se probó el componente `EntryList` (`components/EntryList.test.tsx`), verificando estados de carga, renderizado de datos, estado vacío y manejo de errores.
*   **Mocking:** Se utilizó `jest.mock()` para simular Server Actions (`listEntriesAction`), aislando el componente del backend durante las pruebas.
*   **Ejecución:** `npm test` (watch), `npm run test:ci` (CI/cobertura).
*   **Resultados:** *(Incluir el último reporte de `test:ci` si se desea, como en la versión anterior)*.

### Fase 4: Integración Continua (CI) (Req. 2 y 3 - Adaptado a GitHub Actions)

Pipeline de CI configurado con **GitHub Actions** (`.github/workflows/ci.yml`).

*   **Automatización:** Se dispara en `push` a `main` y `pull_request` a `main`.
*   **Estrategia Docker:** Valida el código construyendo y probando dentro de Docker para consistencia.
*   **Pasos:** Checkout -> Lint (`npm run lint`) -> Setup Docker (QEMU, Buildx) -> Login GHCR -> Build & Test Docker image (incluye `npm run test:ci` dentro del Dockerfile) -> Push a GHCR (solo en `main`).
*   **Secretos:** Variables (`NEXT_PUBLIC_...` necesarias para build) gestionadas vía Secretos de GitHub.
*   **Artefacto:** Imagen Docker publicada en **GitHub Container Registry (GHCR)** (`ghcr.io/j-gonzalezp/smart_diary`).
*   **Monitoreo:** Resultados y logs disponibles en la pestaña "Actions" de GitHub.

### Fase 5: Despliegue Continuo (CD) (Completado)

Se configuró el despliegue continuo a la plataforma **Render**.

*   **Plataforma:** Render Web Service configurado para usar la imagen Docker desde GHCR.
*   **Disparo Automático:** Se utiliza un **Deploy Hook** de Render. El pipeline de GitHub Actions, tras publicar exitosamente la imagen en GHCR (en la rama `main`), envía una solicitud `curl` a la URL secreta del Deploy Hook (almacenada como Secreto `RENDER_DEPLOY_HOOK_URL` en GitHub).
*   **Configuración Render:**
    *   Se especificó el **Puerto interno** (`3000` o el que corresponda según Next.js/`PORT`) en los ajustes del servicio. 
    *   Se configuraron **TODAS las variables de entorno** necesarias para runtime (incluyendo `NODE_ENV=production`, `NEXT_PUBLIC_...`, y la crucial `NEXT_APPWRITE_KEY`) en la sección "Environment" de Render.
*   **Resultado:** Cada push exitoso a la rama `main` resulta en un despliegue automático de la última versión validada en la URL pública de Render.

---

## Estado Final del Ejercicio

El proyecto FlexibleLog/SmartDiary ha implementado un ciclo DevOps completo: desde el desarrollo local contenerizado y probado, pasando por la integración continua que valida y empaqueta la aplicación, hasta el despliegue continuo automatizado en una plataforma de hosting moderna. Se han abordado desafíos prácticos como la configuración de HTTPS local, el manejo de secretos y permisos en CI/CD, y la integración con servicios BaaS y PaaS.