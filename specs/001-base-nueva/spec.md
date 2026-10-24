# Feature Specification: Base nueva (Entrega 0)

**Feature Branch**: `001-base-nueva`

**Created**: 2026-10-24

**Status**: Draft

**Input**: Issue #1 "Entrega 0 · Base nueva: stack actualizado + deploy en Vercel" y sus sub-issues #10–#14 (repo `angelozdev/countdown-notes`).

**Excepción nombrada (constitución, principio II): preparación compartida.** Esta entrega no agrega una conducta musical. Deja lista la base sobre la que se construyen las entregas 1–8. El "usuario" de las historias es el dueño de la app, que también la desarrolla. Las herramientas y comandos que se nombran abajo son la interfaz pública de esta entrega, y vienen fijados por la constitución (Restricciones técnicas) y por el issue #1.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Abrir la app reconstruida (Priority: P1) · #10

El usuario arranca la app en su computador y ve una pantalla base nueva, en español. La app vieja (la nota aleatoria con cuenta regresiva) y las dependencias que solo ella usaba ya no existen.

**Why this priority**: es la porción más delgada que funciona completa: sin una app nueva que abra, ninguna otra historia tiene dónde verse.

**Independent Test**: arrancar la app en modo desarrollo y abrirla en el navegador; generar la versión de producción y comprobar que termina sin errores.

**Acceptance Scenarios**:

1. **Given** el repo con las dependencias instaladas, **When** el usuario ejecuta `pnpm dev` y abre la dirección que indica, **Then** ve la pantalla base con el nombre de la app y un texto en español.
2. **Given** la app nueva, **When** el usuario busca `react-countdown-circle-timer` o `classnames` en las dependencias o en el código, **Then** no aparecen, y tampoco queda código de la app vieja.
3. **Given** la app nueva, **When** el usuario ejecuta `pnpm build`, **Then** el comando termina sin errores, incluida la verificación de tipos estricta.

---

### User Story 2 - Revisar lint y formato con un comando (Priority: P2) · #11

El usuario revisa la calidad del código de todo el proyecto con un comando para el lint y otro para el formato. El formato conserva el estilo que ya usaba el proyecto.

**Why this priority**: todas las entregas siguientes escriben código. Fijar las reglas antes evita reformatear después.

**Independent Test**: ejecutar el lint y el chequeo de formato sobre el proyecto limpio (pasan), y luego sobre un archivo con un error de lint o mal formateado (fallan).

**Acceptance Scenarios**:

1. **Given** el proyecto limpio, **When** el usuario ejecuta `pnpm lint`, **Then** termina sin errores.
2. **Given** el proyecto limpio, **When** el usuario ejecuta el chequeo de formato (sin escribir archivos), **Then** termina sin errores.
3. **Given** un archivo con comillas dobles, punto y coma, coma final o indentación distinta de 2 espacios, **When** el usuario ejecuta el chequeo de formato, **Then** el comando falla y señala el archivo.
4. **Given** ese mismo archivo, **When** el usuario ejecuta `pnpm format`, **Then** el archivo queda con comillas simples, sin punto y coma, sin coma final y con indentación de 2 espacios, y el chequeo de formato vuelve a pasar.
5. **Given** la app nueva, **When** el usuario busca Prettier o `.prettierrc.json`, **Then** no existen.

---

### User Story 3 - Correr tests de UI y E2E con un comando cada uno (Priority: P3) · #12

El usuario corre los tests de interfaz con un comando y los tests de punta a punta, en un navegador real, con otro. Ya existe al menos un test de cada tipo sobre la pantalla base.

**Why this priority**: la constitución exige test-first (principio I). Sin esto no se puede empezar la entrega 1.

**Independent Test**: ejecutar los dos comandos de test; luego cambiar el texto de la pantalla base y comprobar que el test de UI falla.

**Acceptance Scenarios**:

1. **Given** la pantalla base, **When** el usuario ejecuta `pnpm test`, **Then** corre un test que renderiza la pantalla base y la encuentra por su texto o su rol accesible, y pasa.
2. **Given** la pantalla base, **When** el usuario ejecuta `pnpm test:e2e`, **Then** un test abre la app en un navegador real, comprueba que la pantalla base se ve, y pasa.
3. **Given** que alguien cambia o borra el texto que el test de UI busca, **When** se ejecuta `pnpm test`, **Then** el test falla.

---

### User Story 4 - Ver la pantalla base con la dirección visual aprobada (Priority: P4) · #13

El usuario abre la app y la pantalla base ya tiene el estilo de escenario: fondo casi negro, texto claro, acento ámbar y tipografía grande y de mucho peso. La librería de componentes queda lista para las entregas siguientes.

**Why this priority**: fija la identidad visual una sola vez. Las pantallas siguientes la reutilizan en lugar de inventarla.

**Independent Test**: abrir la app y comprobar los colores y la tipografía de la pantalla base; agregar un componente de la librería y comprobar que toma los mismos colores.

**Acceptance Scenarios**:

1. **Given** la app abierta, **When** el usuario mira la pantalla base, **Then** ve fondo casi negro, texto claro, al menos un elemento con el acento ámbar `#f5a524`, y el título en tipografía grande y de mucho peso.
2. **Given** la librería de componentes inicializada, **When** se usa un componente base (por ejemplo, un botón) en la pantalla, **Then** toma los colores del tema sin estilos sueltos.
3. **Given** un navegador o sistema configurado en modo claro, **When** el usuario abre la app, **Then** la app se ve igual en tema oscuro (v1 es solo oscuro).

---

### User Story 5 - Abrir la app desde el iPhone en Vercel (Priority: P5) · #14

El usuario conecta el repo a Vercel y hace push él mismo. El build de Vercel pasa sin tocar la configuración, y la app abre en Safari del iPhone desde la URL pública.

**Why this priority**: el iPhone es uno de los dos dispositivos de práctica. Probarlo desde la entrega 0 evita descubrir tarde un problema de despliegue.

**Independent Test**: generar la versión de producción, comprobar que solo contiene archivos estáticos, servirla localmente, y luego abrir la URL de Vercel en el iPhone.

**Acceptance Scenarios**:

1. **Given** la configuración de despliegue del repo, **When** el usuario conecta el repo a Vercel y hace push, **Then** el build de Vercel pasa sin cambiar ningún ajuste en el panel de Vercel.
2. **Given** el resultado del build, **When** el usuario lo revisa, **Then** solo hay archivos estáticos y ninguna función de servidor.
3. **Given** la URL de Vercel, **When** el usuario la abre en Safari del iPhone, **Then** la pantalla base carga por HTTPS en `/`, se lee sin hacer zoom y sin desplazamiento horizontal.
4. **Given** la app publicada, **When** el usuario abre directamente una ruta distinta de `/` o recarga la página, **Then** se sirve la app en vez de un error 404.

---

### Edge Cases

- **Ruta inexistente o recarga**: la app es de una sola página. Cualquier ruta debe servir la app, no un 404 del servidor (US5, escenario 4).
- **Modo claro del sistema**: la app ignora la preferencia y se ve en oscuro (US4, escenario 3).
- **Pantalla del iPhone**: con muesca o Dynamic Island, el contenido no queda tapado por las zonas del sistema, y nada se desborda a lo ancho.
- **Archivo mal formateado o con error de lint**: los chequeos fallan con un código de salida distinto de cero, para que el error no pase inadvertido.
- **Test roto a propósito**: un cambio en el texto de la pantalla base hace fallar el test de UI. Así se comprueba que el test prueba algo real (US3, escenario 3).
- **Datos guardados por la app vieja**: la app vieja no guardaba nada en el dispositivo, así que no hay datos que migrar ni descartar.

## Requirements *(mandatory)*

### Functional Requirements

**Proyecto nuevo (#10)**

- **FR-001**: `pnpm dev` MUST abrir la app nueva con una pantalla base que muestre el nombre de la app y un texto en español.
- **FR-002**: El proyecto MUST usar pnpm y las últimas versiones estables de las herramientas que el issue #1 fija para esta entrega: React, TypeScript (strict), Vite, Tailwind CSS v4, shadcn/ui, Vitest, Testing Library + user-event, Playwright, oxlint y oxfmt.
- **FR-003**: `react-countdown-circle-timer`, `classnames` y todo el código de la app vieja MUST eliminarse.
- **FR-004**: `pnpm build` MUST terminar sin errores, incluida la verificación de tipos.

**Lint y formato (#11)**

- **FR-005**: El proyecto MUST tener un comando de lint (`pnpm lint`), un comando que formatea (`pnpm format`) y un chequeo de formato que no escribe archivos.
- **FR-006**: El formato MUST usar comillas simples, sin punto y coma, sin coma final e indentación de 2 espacios.
- **FR-007**: Prettier y `.prettierrc.json` MUST eliminarse.
- **FR-008**: Todo el código del proyecto MUST pasar el lint y el chequeo de formato al cerrar la entrega.

**Tests (#12)**

- **FR-009**: `pnpm test` MUST correr los tests de UI, y al menos uno MUST renderizar la pantalla base y encontrarla por su texto o su rol accesible.
- **FR-010**: `pnpm test:e2e` MUST abrir la app en un navegador real y comprobar que la pantalla base se ve.

**Tema y componentes (#13)**

- **FR-011**: La librería de componentes (shadcn/ui) MUST quedar inicializada y lista para agregar componentes.
- **FR-012**: El tema MUST definir como tokens reutilizables: fondo casi negro, texto claro, acento ámbar `#f5a524` y tipografía grande y de mucho peso para los títulos.
- **FR-013**: La pantalla base MUST usar esos tokens, no colores sueltos.
- **FR-014**: La app MUST verse en tema oscuro aunque el sistema esté en modo claro.

**Despliegue (#14)**

- **FR-015**: El repo MUST incluir la configuración para que Vercel construya y publique la app sin ajustes manuales en su panel: solo archivos estáticos, app de una sola página servida en `/`, sin funciones de servidor.
- **FR-016**: Cualquier ruta MUST servir la app de una sola página, no un 404.
- **FR-017**: La pantalla base MUST leerse en Safari del iPhone sin zoom ni desplazamiento horizontal, sin contenido tapado por la muesca o las zonas del sistema.
- **FR-018**: El builder MUST NOT hacer push ni conectar el repo a Vercel. Eso lo hace el usuario.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Desde un clon limpio, instalar dependencias y ejecutar `pnpm lint`, el chequeo de formato, `pnpm test`, `pnpm test:e2e` y `pnpm build` termina con los 5 comandos en verde.
- **SC-002**: Las dependencias del proyecto incluyen 0 menciones de `react-countdown-circle-timer`, `classnames` y Prettier.
- **SC-003**: El primer build en Vercel, tras conectar el repo, pasa sin cambiar ningún ajuste del panel.
- **SC-004**: En Safari del iPhone, la pantalla base carga desde la URL de Vercel y el título se lee a 1–2 m de distancia.
- **SC-005**: Romper a propósito el texto que busca el test de UI lo hace fallar en el 100% de las ejecuciones.

## Assumptions

- El usuario autorizó reconstruir la app desde cero en el mismo repo. Perder la funcionalidad vieja (nota aleatoria con cuenta regresiva) es intencional; el historial de git la conserva.
- La pantalla base es mínima: nombre de la app, un texto corto en español y el estilo aprobado. No tiene controles ni conducta musical (YAGNI); la entrega 1 la reemplaza.
- Tone.js, tonal, zod y vite-plugin-pwa no entran en esta entrega. Cada uno se agrega en la entrega que lo necesita (issue #1).
- Zustand forma parte del stack, pero se actualiza o agrega solo cuando una historia lo use. Esta entrega no tiene estado que guardar.
- El usuario tiene una cuenta de Vercel y un iPhone con iOS 17 o superior para la verificación final de US5.
- El orden de implementación lo define el plan. Para cumplir test-first, el plan puede preparar el corredor de tests antes de construir la pantalla base, aunque US3 tenga menor prioridad que US1.
- Los textos exactos de la pantalla base los decide el builder (diseño, sección 11).
