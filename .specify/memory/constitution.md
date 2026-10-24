# Countdown Notes Constitution

Countdown Notes es una app web para improvisar con la guitarra sobre un bajo o unos acordes,
con metrónomo. La fuente de diseño aprobada es
`docs/superpowers/specs/2026-10-24-acompanamiento-improvisacion-design.md`.

## Core Principles

### I. Test-first (NO NEGOCIABLE)

- Todo cambio de conducta sigue el ciclo en pasos pequeños: primero un test que falla, después el
  código mínimo que lo hace pasar y al final el refactor.
- Los tests prueban la conducta por la interfaz pública: la UI (Testing Library + user-event) o la
  API exportada de un módulo. Nunca prueban detalles internos.
- Un test MUST NOT debilitarse, saltarse ni borrarse para que pase. Si un test parece incorrecto,
  se consulta al usuario antes de tocarlo.

**Razón**: el usuario trabaja test-first, y los tests por la interfaz pública sobreviven a la
reconstrucción del código.

### II. Entregas verticales

- Cada historia de usuario MUST ser una conducta visible de punta a punta, que se pueda probar
  desde un punto de entrada real (la app abierta en el navegador).
- Se entrega primero la porción más delgada que funcione completa.
- Una tarea que toca una sola capa sin conducta visible solo se permite como excepción nombrada
  explícitamente: preparación compartida, refactor puro o spike.

**Razón**: el usuario valida cada entrega tocando la guitarra encima, no leyendo código.

### III. Precisión del tiempo primero

- Todo evento musical (bajo, acorde, metrónomo) MUST programarse con el reloj de audio de Tone.js
  (`Transport`, con anticipación). Usar `setTimeout` o `setInterval` para el tiempo musical está
  prohibido.
- La UI se sincroniza con el reloj de audio, no al revés.
- La precisión se verifica con tests que renderizan el audio sin parlantes (`Tone.Offline` o
  equivalente) y comprueban el momento exacto de cada evento.

**Razón**: el anti-objetivo principal del producto es un metrónomo que se desfase o tiemble.

### IV. Manos libres al practicar

- La pantalla de práctica MUST leerse a 1–2 m de distancia.
- Mientras suena, la práctica no requiere tocar la pantalla.
- La pantalla de práctica nunca se llena de controles. Los ajustes viven en un panel aparte.

**Razón**: el usuario tiene las dos manos en la guitarra mientras usa la app.

### V. Simplicidad

- La app es solo estática: se publica en Vercel sin funciones de servidor, y no tiene cuentas ni
  nube.
- Los datos se guardan en el dispositivo y MUST validarse con zod al cargarlos. Si son inválidos,
  se descartan sin romper la app.
- YAGNI: no se construye nada que no pida una historia de usuario.

**Razón**: es una herramienta personal de práctica, y cada pieza extra es mantenimiento sin
beneficio.

## Restricciones técnicas

- **Gestor de paquetes**: pnpm.
- **Stack**: últimas versiones estables de React, TypeScript (modo strict), Vite, Tailwind CSS v4,
  shadcn/ui, Zustand, Tone.js, tonal, zod, vite-plugin-pwa, Vitest, Testing Library + user-event,
  Playwright, oxlint y oxfmt.
- **Formato (oxfmt)**: comillas simples, sin punto y coma, sin coma final, indentación de 2
  espacios.
- **Idioma**: la interfaz está en español. Los acordes usan cifrado americano.
- **Dispositivos objetivo**: navegador de escritorio actual, y iPhone con iOS 17 o superior, tanto
  en Safari como instalada en la pantalla de inicio.
- **Publicación**: Vercel, solo archivos estáticos, servida en `/` con HTTPS.

## Flujo de trabajo

- Se hace commit después de cada paso en verde, en la rama de la feature.
- Nunca se hace commit en `main` y nunca se hace push.
- Las decisiones difíciles de revertir son del usuario: una dependencia fuera del stack listado,
  el esquema de los datos guardados, la API pública o la arquitectura. Se le presentan opciones
  con una recomendación.
- Los planes se arman con Spec Kit (specify → plan → tasks), con una feature por cada entrega del
  backlog (ver Backlog).

## Backlog

- El backlog del producto vive en **GitHub Issues** del repo `angelozdev/countdown-notes`, no en
  archivos del repo ni en Spec Kit. Usa dos etiquetas:
  - `entrega`: una entrega del producto (#1–#9), priorizada por su número de entrega.
  - `tarea`: una conducta visible dentro de una entrega, enlazada como sub-issue de esa entrega.
- Todo lo que se agrega, cambia o descarta del producto se registra primero en GitHub Issues. Si
  cambia una decisión de diseño, también se actualiza el documento de diseño.
- **Spec Kit por entrega**:
  - Cada feature de Spec Kit corresponde a un issue `entrega`.
  - `/speckit-specify` toma como entrada ese issue y sus sub-issues, y cada `tarea` pasa a ser una
    historia de usuario del spec.
  - `tasks.md` referencia los números de issue.
- `/speckit-taskstoissues` MUST NOT usarse, porque duplicaría las tareas que ya existen. Los pasos
  de implementación viven en `tasks.md`.
- Los commits referencian el issue de su tarea (por ejemplo, `#15`). Un issue se cierra cuando su
  conducta está en verde en `main`, con un comentario que dice qué verificación manual queda
  pendiente. Esas verificaciones siguen en `tasks.md`, y si una falla, el issue se reabre.

## Governance

- Esta constitución prevalece sobre cualquier otra práctica del proyecto. Cuando un plan o una
  tarea entre en conflicto con ella, se corrige el plan o la tarea, o se enmienda la constitución.
- **Enmiendas**: las propone cualquiera, las aprueba el usuario, y quedan registradas con su
  versión y su fecha.
- **Versionado semántico**:
  - MAJOR: se elimina o se redefine un principio.
  - MINOR: se agrega un principio o una sección, o se amplía la guía de forma material.
  - PATCH: aclaraciones de redacción.
- **Cumplimiento**: cada `plan.md` pasa el Constitution Check contra los cinco principios. Toda
  violación se justifica en la tabla de complejidad del plan o no se admite.

**Version**: 1.2.0 | **Ratified**: 2026-10-24 | **Last Amended**: 2026-10-24
