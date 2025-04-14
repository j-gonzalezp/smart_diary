# FlexibleLog: Diario Personal (con Implementación DevOps)

FlexibleLog es una aplicación de Diario Personal desarrollada con Next.js (App Router, React 19, TypeScript) y Appwrite Cloud como backend (BaaS). Este proyecto sirve como un **ejercicio práctico intensivo (similar al "Ejercicio Práctico 2")** para implementar y comprender prácticas fundamentales de DevOps aplicadas a una aplicación web moderna.

El objetivo principal no es solo construir la funcionalidad de la aplicación, sino hacerlo aplicando rigurosamente conceptos DevOps clave.

## Tecnologías Utilizadas

*   **Frontend:** Next.js (v15+ con App Router), React (v19), Tailwind CSS (v4)
*   **Backend (BaaS):** Appwrite Cloud (Authentication, Databases)
*   **Contenerización:** Docker, Docker Compose
*   **Reverse Proxy:** Nginx (para HTTPS local)
*   **Certificados Locales:** `mkcert`
*   **Pruebas Automatizadas:** Jest, React Testing Library (RTL)
*   **Integración Continua (CI):** GitHub Actions
*   **Registro de Contenedores:** GitHub Container Registry (GHCR)
*   **Control de Versiones:** Git, GitHub
*   **Lenguaje:** TypeScript

## Funcionalidades de la Aplicación (MVP Diario)

*   **Autenticación:** Registro e inicio de sesión (Email/Password) vía Appwrite.
*   **Gestión de Entradas:** Crear y visualizar entradas de diario.
*   **Persistencia:** Datos almacenados en Appwrite Cloud Database.

## Configuración y Ejecución Local (Dockerizado con HTTPS)

Este proyecto está diseñado para ejecutarse localmente mediante Docker, simulando un entorno de producción con HTTPS gestionado por Nginx.

*(Esta sección es crucial para que cualquiera pueda levantar el proyecto)*

### Prerrequisitos

*   Git
*   Docker Desktop (o Docker Engine + Docker Compose)
*   `mkcert` instalado (y `mkcert -install` ejecutado una vez)

### Pasos para Ejecutar

1.  **Clonar:**
    ```bash
    git clone https://github.com/j-gonzalezp/smart_diary # Asegúrate que la URL sea la correcta
    cd flexiblelog # O el nombre de tu directorio raíz
    ```
2.  **Generar Certificados SSL:**
    ```bash
    mkdir .certs
    mkcert -key-file ./.certs/localhost-key.pem -cert-file ./.certs/localhost.pem "localhost" 127.0.0.1 ::1
    ```
3.  **Configurar Variables de Entorno:**
    *   Crea un archivo `.env` en la raíz. (Asegúrate que esté en `.gitignore`).
    *   Añade tus credenciales de Appwrite Cloud (ver sección detallada en versión anterior si es necesario - `NEXT_PUBLIC_APPWRITE_ENDPOINT`, `NEXT_PUBLIC_APPWRITE_PROJECT`, `NEXT_APPWRITE_KEY`, etc.).
4.  **Construir y Ejecutar:**
    ```bash
    docker-compose up --build
    ```
    *   (Para inicios posteriores: `docker-compose up`)
5.  **Acceder:** `https://localhost:5000`

### Justificación Nginx/HTTPS Local

Necesario para que las cookies `Secure` de Appwrite funcionen y para compatibilidad con Server Actions de Next.js detrás de un proxy, además de simular un entorno de producción.

---

## Implementación DevOps (Fases Completadas)

A continuación, se detallan las fases de implementación DevOps completadas, alineadas con los objetivos del ejercicio práctico.

### Fase 3: Pruebas Automatizadas (Req. 1 - Pruebas Unitarias y de Integración)

Se implementaron pruebas automatizadas utilizando **Jest** y **React Testing Library (RTL)** para verificar la funcionalidad y robustez de los componentes frontend.

*   **Pruebas Unitarias/Integración (Componentes):**
    *   Se creó un conjunto de pruebas para el componente `EntryList` (`components/EntryList.test.tsx`).
    *   Estas pruebas verifican el comportamiento del componente en diversos escenarios: estado de carga inicial, renderizado correcto de entradas tras una carga exitosa, manejo de estado vacío (sin entradas), y visualización de mensajes de error.
    *   **Mocking:** Se utilizó `jest.mock()` para simular la Server Action `listEntriesAction`, aislando el componente frontend de llamadas reales al backend (Appwrite) durante la prueba. Esto permite probar la lógica del componente de forma independiente y determinista.
*   **Herramientas y Configuración:**
    *   `jest.config.js` utiliza `next/jest` para la integración con Next.js.
    *   `jest.setup.ts` importa `@testing-library/jest-dom` para matchers de aserción del DOM más legibles.
*   **Ejecución:**
    *   Desarrollo (watch mode): `npm test`
    *   CI / Única ejecución con cobertura: `npm run test:ci`

*   **Resultados de Pruebas (Ejemplo de ejecución):** *(Req. 4 - Parte de Monitoreo de Resultados)*
    ```
     PASS  components/EntryList.test.tsx
      EntryList Component
        √ should display loading state initially (53 ms)
        √ should display entries when fetch is successful (156 ms)
        √ should display empty message when no entries are fetched (25 ms)
        √ should display error message when fetch fails (31 ms)
        √ should call onActionComplete when the Refresh List button is clicked (51 ms)

    ---------------------|---------|----------|---------|---------|-------------------
    File                 | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s
    ---------------------|---------|----------|---------|---------|-------------------
    All files            |   32.28 |       75 |   33.33 |   32.28 |
     components          |   92.22 |    85.71 |     100 |   92.22 |
      EntryList.tsx      |   92.22 |    85.71 |     100 |   92.22 | 31-33,39-42
     lib                 |       0 |        0 |       0 |       0 |
    # ... (resto del reporte de cobertura) ...
    ---------------------|---------|----------|---------|---------|-------------------
    Test Suites: 1 passed, 1 total
    Tests:       5 passed, 5 total
    Snapshots:   0 total
    Time:        3.824 s
    ```
    *(El reporte de cobertura indica qué partes del código fueron ejecutadas por las pruebas. Las líneas no cubiertas en `EntryList.tsx` corresponden a bloques `catch` específicos que no fueron explícitamente simulados en este conjunto inicial de pruebas).*

### Fase 4: Integración Continua (CI) (Req. 2 y 3 - Adaptado a GitHub Actions)

Se configuró un pipeline de Integración Continua (CI) usando **GitHub Actions** (en lugar de Jenkins, como alternativa moderna y directamente integrada con el repositorio) para automatizar la validación del código.

*   **Automatización (Req. 2):**
    *   El workflow definido en `.github/workflows/ci.yml` se dispara automáticamente en cada `push` a la rama `main` y en cada `pull_request` que apunte a `main`.
*   **Configuración del Pipeline (Req. 3 - GitHub Actions):**
    *   **Estrategia Basada en Docker:** El pipeline utiliza Docker para construir y probar la aplicación, garantizando la consistencia del entorno.
    *   **Pasos Principales:**
        1.  `Checkout`: Obtiene el código.
        2.  `Linting`: Ejecuta `npm run lint` (fuera de Docker) para verificación rápida de calidad de código.
        3.  `Setup Docker`: Configura QEMU y Buildx.
        4.  `Login to GHCR`: Inicia sesión en GitHub Container Registry usando el `GITHUB_TOKEN` automático.
        5.  `Build, Test, and Push Docker image`:
            *   Construye la imagen usando el `Dockerfile` multi-stage.
            *   La etapa `test` dentro del `Dockerfile` ejecuta `npm run test:ci`. **Si las pruebas fallan, el build falla y el CI falla.**
            *   Las variables de entorno necesarias para el build (`NEXT_PUBLIC_...`) se inyectan de forma segura desde los **Secretos de GitHub**.
            *   Si el build es exitoso y se ejecuta en la rama `main`, la imagen resultante se etiqueta (`:latest`, `:${{ github.sha }}`) y se **publica (push) en GitHub Container Registry (GHCR)**.
*   **Monitoreo de Logs y Resultados (Req. 4):**
    *   Los resultados de cada ejecución del workflow (pass/fail), así como los logs detallados de cada paso (incluyendo la salida de `npm run lint`, `npm run test:ci` y `docker build`), se pueden **monitorear directamente en la pestaña "Actions"** del repositorio de GitHub.
    *   Los fallos en cualquier paso (linting, pruebas, build) causarán que el workflow falle, notificando visualmente el problema en la interfaz de GitHub.

---

## Estado Actual y Próximos Pasos (Fase 5: Despliegue Continuo)

El proyecto ha implementado exitosamente pruebas automatizadas para componentes clave y un pipeline de CI robusto que valida el código, ejecuta pruebas y publica una imagen Docker lista para producción en GHCR en cada cambio a `main`.

El siguiente paso es la **Fase 5: Despliegue Continuo (CD)**, que implicará:

1.  Seleccionar y configurar una plataforma de hosting (ej. Render, Fly.io, Google Cloud Run).
2.  Configurar el servicio de hosting para que obtenga la imagen desde GHCR.
3.  Gestionar de forma segura las variables de entorno de producción (incluyendo `NEXT_APPWRITE_KEY`) en la plataforma de hosting.
4.  Idealmente, configurar el despliegue automático en la plataforma cada vez que una nueva imagen `:latest` se publique en GHCR.