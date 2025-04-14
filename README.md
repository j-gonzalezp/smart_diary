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

## Fase 3

## Pruebas Automatizadas 🧪

Este proyecto utiliza [Jest](https://jestjs.io/) y [React Testing Library (RTL)](https://testing-library.com/docs/react-testing-library/intro/) para las pruebas automatizadas, siguiendo las mejores prácticas para aplicaciones Next.js.

**Objetivos de las Pruebas:**

*   Verificar el comportamiento de los componentes de React de forma aislada (pruebas unitarias).
*   Probar la interacción entre componentes y la lógica de la UI (pruebas de integración básicas).
*   Asegurar que los cambios futuros no introduzcan regresiones inesperadas.
*   Facilitar la refactorización segura del código.

**Configuración:**

*   **Jest:** Configurado a través de `jest.config.js`, utilizando la integración `next/jest` para manejar automáticamente la compilación de TypeScript, JSX, CSS Modules, etc.
*   **React Testing Library:** Usada para renderizar componentes y realizar consultas/interacciones de manera similar a como lo haría un usuario.
*   **Setup Global:** El archivo `jest.setup.ts` se ejecuta antes de cada suite de pruebas para importar configuraciones globales, como los matchers extendidos de `@testing-library/jest-dom`.
*   **Mocking:** Las dependencias externas (como las Server Actions que interactúan con Appwrite, ej: `listEntriesAction`) se simulan (mockean) usando `jest.mock()` para aislar el componente bajo prueba y evitar llamadas reales a la red/base de datos durante las pruebas unitarias/integración.

**Ubicación de las Pruebas:**

Los archivos de prueba se encuentran junto a los componentes que prueban, utilizando la convención de nomenclatura `*.test.tsx` (por ejemplo, `EntryList.test.tsx` está en el mismo directorio que `EntryList.tsx`).

**Ejecución de las Pruebas:**

*   **Modo Watch (Desarrollo):** Ejecuta las pruebas y se queda escuchando cambios en los archivos para volver a ejecutarlas automáticamente.
    ```bash
    npm test
    # o
    yarn test
    ```
*   **Ejecución Única (CI/Producción):** Ejecuta todas las pruebas una vez y opcionalmente genera un reporte de cobertura. Ideal para entornos de integración continua.
    ```bash
    npm run test:ci
    # o
    yarn test:ci
    ```
## REsultados al elegir las pruebas
 PASS  components/EntryList.test.tsx
  EntryList Component
    √ should display loading state initially (66 ms)
    √ should display entries when fetch is successful (433 ms)
    √ should display empty message when no entries are fetched (43 ms)                                                                         
    √ should display error message when fetch fails (28 ms)                                                                                    
    √ should call onActionComplete when the Refresh List button is clicked (47 ms)                                                             

---------------------|---------|----------|---------|---------|-------------------
File                 | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s 
---------------------|---------|----------|---------|---------|-------------------
All files            |   32.28 |       75 |   33.33 |   32.28 |                   
 components          |   92.22 |    85.71 |     100 |   92.22 |                   
  EntryList.tsx      |   92.22 |    85.71 |     100 |   92.22 | 31-33,39-42       
 lib                 |       0 |        0 |       0 |       0 |                   
  types.ts           |       0 |        0 |       0 |       0 | 1-30             
 lib/actions         |       0 |        0 |       0 |       0 |                  
  entries.actions.ts |       0 |        0 |       0 |       0 | 1-156            
 lib/appwrite        |     100 |      100 |     100 |     100 |                  
  config.ts          |     100 |      100 |     100 |     100 |                  
---------------------|---------|----------|---------|---------|-------------------
Test Suites: 1 passed, 1 total
Tests:       5 passed, 5 total
Snapshots:   0 total
Time:        4.676 s
Ran all test suites related to changed files.
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
  types.ts           |       0 |        0 |       0 |       0 | 1-30             
 lib/actions         |       0 |        0 |       0 |       0 |                  
  entries.actions.ts |       0 |        0 |       0 |       0 | 1-156            
 lib/appwrite        |     100 |      100 |     100 |     100 |                  
  config.ts          |     100 |      100 |     100 |     100 |                  
---------------------|---------|----------|---------|---------|-------------------
Test Suites: 1 passed, 1 total
Tests:       5 passed, 5 total
Snapshots:   0 total
Time:        3.824 s
Ran all test suites related to changed files.


## Próximos Pasos

## Integración Continua (CI) con GitHub Actions y Docker 🐳 CI/CD

Se ha implementado un flujo de trabajo de Integración Continua (CI) utilizando **GitHub Actions** para automatizar la validación del código en cada `push` o `pull_request` dirigido a la rama `main`.

**Estrategia Principal:**

El workflow (`.github/workflows/ci.yml`) utiliza **Docker** para asegurar la máxima consistencia entre el entorno de CI y el de ejecución. En lugar de instalar Node y dependencias directamente en el runner de GitHub, el workflow orquesta el build de la imagen Docker definida en el `Dockerfile`.

**Pasos Clave del Workflow:**

1.  **Checkout:** Obtiene el código fuente del repositorio.
2.  **Linting:** (Ejecutado fuera de Docker para feedback rápido) Instala dependencias y ejecuta `npm run lint` para verificar la calidad y estilo del código.
3.  **Setup Docker:** Configura QEMU (para compatibilidad multi-plataforma) y Docker Buildx (constructor avanzado).
4.  **Cache Docker:** Utiliza la caché de GitHub Actions para almacenar y reutilizar capas de Docker, acelerando builds posteriores.
5.  **Docker Build & Test:**
    *   Ejecuta `docker build` usando el `Dockerfile` del proyecto.
    *   Pasa las variables de entorno públicas (`NEXT_PUBLIC_...`) necesarias para el build como `build-args`, obteniéndolas de forma segura desde los **Secretos de GitHub**.
    *   El `Dockerfile` está estructurado en etapas (multi-stage):
        *   `builder`: Instala dependencias (`npm ci`) y construye la aplicación (`npm run build`).
        *   `test`: **Ejecuta las pruebas automatizadas** (`npm run test:ci`) utilizando el entorno del `builder`. Si las pruebas fallan, el build de Docker falla.
        *   `runner`: Crea la imagen final mínima con solo los artefactos necesarios para producción.
    *   El éxito de este paso implica que el código no tiene errores de linting, la aplicación compila correctamente y todas las pruebas pasan dentro de un entorno Docker controlado.
    *   **Importante:** En esta fase de CI, la imagen Docker se construye pero **no se publica** en ningún registro.

**Resultado:**

Este pipeline asegura que cualquier código integrado a `main` ha pasado verificaciones de calidad, pruebas unitarias/integración y es construible como una imagen Docker válida, aumentando la confianza y detectando errores tempranamente. El `Dockerfile` ahora incluye una etapa dedicada a la ejecución de pruebas (`test`), haciendo el proceso de validación más robusto.

*   Establecer y practicar la estrategia de ramificación (Fase 5).
