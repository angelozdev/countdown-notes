# Implementation Plan: "Ya me sirve" (Entrega 1)

**Branch**: `002-ya-me-sirve` | **Date**: 2026-10-24 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/002-ya-me-sirve/spec.md` (issue #2, sub-issues #15–#19)

## Summary

La pantalla base de la entrega 0 se reemplaza por la pantalla de práctica del modo aleatorio:

- **Sonido**: metrónomo en 4/4 con acento, cuenta de entrada y bajo Analógico cálido en la raíz.
- **Ajustes**: BPM, compases por nota y filtros de notas, en un panel que sube desde abajo.
- **Pantalla de práctica**: "Ahora" muy grande y el carril de compases, legibles a 1–2 m.

Arquitectura (aprobada por el usuario): **motor inyectado**. Hay una sola costura, en el borde del audio.

- El **motor** (`Engine`) programa cada tiempo con el `Transport` de Tone.js y avisa a la UI con `Draw`.
- Un **store de Zustand** decide qué suena en cada tiempo: cuenta de entrada, sorteo de vueltas y ajustes.
- `App` recibe el motor: el real en `main.tsx`, uno falso en los tests de UI.
- La precisión del motor real se prueba con `Tone.Offline` en Chromium y WebKit, con Vitest en modo navegador.

Las decisiones y sus razones están en [research.md](./research.md). El estado está en [data-model.md](./data-model.md), y los contratos en [contracts/interfaces.md](./contracts/interfaces.md).

## Technical Context

**Language/Version**: TypeScript 7.0.2 (strict), Node 24

**Primary Dependencies**:

- Lo que ya está: React 19.3.1, Vite 8.3.5, Tailwind CSS 4.3.3 y shadcn 4.22.1.
- Se agregan: tone 15.1.22, zustand 5.0.16, y los componentes de shadcn `button`, `sheet` y `toggle` (research §1).

**Storage**: N/A. Todo vive en memoria; recordar los ajustes es de la entrega 2.

**Testing**:

- Vitest 5.0.5 con dos proyectos: `ui` (jsdom + Testing Library + user-event, con el motor falso) y `audio` (modo navegador con `@vitest/browser-playwright` 5.0.5, en Chromium y WebKit, con el motor real y `Tone.Offline`).
- Playwright 1.64.1 para E2E (`chromium` e `iphone`).

**Target Platform**: navegador de escritorio actual, y Safari en iOS 17 o superior. Se publica en Vercel como estáticos.

**Project Type**: SPA web, solo frontend

**Performance Goals**:

- Cada golpe y cada ataque del bajo a menos de 1 ms de su momento teórico, entre 30 y 240 BPM (SC-002).
- La UI cambia con el golpe con menos de 50 ms de desfase (SC-007).

**Constraints**:

- Nunca `setTimeout` ni `setInterval` para el tiempo musical.
- El primer Play desbloquea el audio.
- Suena con el interruptor de silencio del iPhone.
- La pantalla de práctica no tiene controles de ajuste y se lee a 1–2 m.
- Las dependencias van en versión exacta.

**Scale/Scope**: 1 pantalla de práctica, 1 panel de ajustes, 5 historias. Solo modo aleatorio y 4/4.

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

| Principio                 | Cómo se cumple                                                                                                                                                                                                                                                                                                                                                                                   | Estado |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------ |
| I. Test-first             | Cada historia empieza con un test de UI que falla, sobre `<App engine={fake.engine} />`, buscando por rol y nombre ([contracts](./contracts/interfaces.md) §4). El motor real se prueba por su API exportada (`createToneEngine`) con audio renderizado. El sorteo se prueba por `drawRound`. Los tests de la pantalla base se reemplazan, no se debilitan; lo aprobó el usuario (research §11). | ✅     |
| II. Entregas verticales   | Cada historia termina en una conducta que se prueba en la app abierta (quickstart §2). Las dependencias y la configuración entran en la historia que las usa, sin una fase de preparación aparte.                                                                                                                                                                                                | ✅     |
| III. Precisión del tiempo | `scheduleRepeat` por tiempo en el `Transport`, con anticipación, y la UI vía `Draw` (research §3). El test `audio` mide cada evento en el audio renderizado (research §4). La barra de progreso anima con CSS entre tiempos, pero es solo visual: el reloj la vuelve a sincronizar en cada tiempo.                                                                                               | ✅     |
| IV. Manos libres          | La pantalla de práctica solo tiene Play/Stop y Ajustes. "Ahora" va lo más grande posible, y el carril se desplaza solo.                                                                                                                                                                                                                                                                          | ✅     |
| V. Simplicidad            | Solo estáticos y nada guardado. YAGNI: sin tonal, sin zod, sin jest-dom, sin selector de modo y con el mismo panel en todos los tamaños (research §1, §10).                                                                                                                                                                                                                                      | ✅     |
| Restricciones técnicas    | tone y zustand están en el stack. `@vitest/browser-playwright` y `playwright` quedan fuera de la lista, pero los aprobó el usuario el 2026-10-24. Interfaz en español, notas en cifrado americano.                                                                                                                                                                                               | ✅     |
| Flujo de trabajo          | Rama `002-ya-me-sirve`. Commit por paso en verde que referencia el issue de su historia; nunca en `main` ni push. La arquitectura la aprobó el usuario.                                                                                                                                                                                                                                          | ✅     |

**Re-check post-diseño**: sin cambios. No hay violaciones que justificar.

## Project Structure

### Documentation (this feature)

```text
specs/002-ya-me-sirve/
├── plan.md              # Este archivo
├── research.md          # Fase 0: decisiones, spike y fuentes
├── data-model.md        # Fase 1: notas, ajustes, vueltas y estado de la práctica
├── quickstart.md        # Fase 1: cómo validar la entrega de punta a punta
├── contracts/
│   └── interfaces.md    # Fase 1: comandos, motor, App y pantalla accesible
├── checklists/
│   └── requirements.md  # Calidad del spec
└── tasks.md             # Fase 2 (/speckit-tasks)
```

### Source Code (repository root)

Estado final. `(nuevo)` = archivo nuevo; `(cambia)` = archivo que ya existe y se modifica.

```text
vite.config.ts                       # (cambia) proyectos de Vitest: ui (jsdom) y audio (navegador)
e2e/
└── practice.spec.ts                 # (reemplaza base-screen.spec.ts) tema, lang, scroll; Play → cuenta → nota → Stop
src/
├── main.tsx                         # (cambia) <App engine={createToneEngine()} />
├── App.tsx                          # (cambia) crea el store; pantalla de práctica + panel
├── App.test.tsx                     # (cambia) US1: Play/Stop, cuenta de entrada, metrónomo
├── bpm.test.tsx                     # (nuevo) US2
├── random-mode.test.tsx             # (nuevo) US3
├── note-filters.test.tsx            # (nuevo) US4
├── lane.test.tsx                    # (nuevo) US5
├── audio/
│   ├── engine.ts                    # (nuevo) contrato Engine y Sound
│   ├── tone-engine.ts               # (nuevo) motor real: Transport + Draw + sintetizadores
│   └── tone-engine.browser.test.ts  # (nuevo) precisión con Tone.Offline
├── music/
│   └── notes.ts                     # (nuevo) las 12 notas
├── practice/
│   ├── round.ts                     # (nuevo) drawRound
│   ├── round.test.ts                # (nuevo) 1.000 vueltas
│   └── store.ts                     # (nuevo) createPracticeStore, PracticeContext, usePractice
├── components/
│   ├── now.tsx                      # (nuevo) "Ahora"
│   ├── lane.tsx                     # (nuevo) carril
│   ├── settings-panel.tsx           # (nuevo) panel de ajustes
│   ├── stepper.tsx                  # (nuevo) − valor + (BPM y compases por nota)
│   └── ui/
│       ├── button.tsx               # (nuevo, shadcn)
│       ├── sheet.tsx                # (nuevo, shadcn)
│       ├── toggle.tsx               # (nuevo, shadcn)
│       └── badge.tsx                # se borra: solo lo usaba la pantalla base
└── test/
    └── fake-engine.ts               # (nuevo) motor falso para los tests de UI
```

**Structure Decision**:

- La estructura de la entrega 0 se mantiene, con carpetas por responsabilidad:
  - `audio/`: el borde con Web Audio;
  - `practice/`: qué suena y cuándo;
  - `music/`: datos musicales;
  - `components/`: la UI.
- Solo `audio/tone-engine.ts` y `main.tsx` importan Tone.js.
- Los tests de UI van uno por historia, en `src/`, y todos montan `App` completa.

## Orden sugerido para `/speckit-tasks` (porciones verticales)

Cada paso es test que falla → código mínimo → verde → commit con el issue (`#15`…`#19`). La rama ya existe.

1. **US1 · #15: Play/Stop con metrónomo y cuenta de entrada** (la porción más delgada).
   1. Reemplazar `App.test.tsx` (falla). Debe comprobar:
      - el `h1` oculto;
      - que Play arranca el motor a 60 BPM en 4/4;
      - que 4 tiempos piden acento + 3 clicks;
      - que Stop lo detiene y el botón vuelve a Play.

      Código: agregar `tone` y `zustand`, y shadcn `button`; escribir `engine.ts`, `fake-engine.ts`, un `store.ts` mínimo (estado y clicks) y `App` con Play/Stop; borrar `badge.tsx`.

   2. Test de precisión `tone-engine.browser.test.ts` (falla): clicks a 30, 60, 200 y 240 BPM a menos de 1 ms, con acento más fuerte y sin sonido tras `stop`.

      Código: agregar `@vitest/browser-playwright` y `playwright`, el proyecto `audio` en `vite.config.ts` y `tone-engine.ts`, con `audioSession` y solo el metrónomo.

   3. Reemplazar el E2E por `e2e/practice.spec.ts` (falla): tema oscuro, Play en ámbar, `lang`, sin desplazamiento horizontal, y que Play cambia a Stop y vuelta.

      Código: `main.tsx` con el motor real.

   4. Manual: oír el metrónomo en el computador y en el iPhone con el interruptor de silencio activado (quickstart §3).
2. **US2 · #16: BPM en el panel de ajustes**.
   - Test `bpm.test.tsx` (falla). Debe comprobar:
     - la línea de estado con `60 BPM`;
     - el panel con el BPM en 60;
     - los límites 30 y 240, y que un valor inválido vuelve al anterior;
     - − y +;
     - que con la música sonando el cambio llega a `setBpm` sin parar el motor;
     - que no hay controles de ajuste fuera del panel.
   - Código: shadcn `sheet`, `stepper.tsx`, `settings-panel.tsx` y `setBpm` en el store.
3. **US3 · #17: bajo en la raíz de una nota sorteada**.
   1. `round.test.ts` (falla): en 1.000 vueltas, cada nota una vez y la primera ≠ `avoidFirst`; con 2 notas, alternan.

      Código: `round.ts`.

   2. `random-mode.test.tsx` (falla). Debe comprobar:
      - sin bajo en la cuenta;
      - `bass` con la raíz en octava 2 en cada tiempo 0 desde el compás 1;
      - que la nota cambia cada 2 compases;
      - que en 3 vueltas no hay repeticiones dentro de una vuelta ni dos seguidas;
      - "Ahora" con la nota y su nombre;
      - compases por nota (1–16), que aplica desde la siguiente vuelta.

      Código: `notes.ts`, las vueltas en el store (con el sorteo en la última nota, FR-033), `now.tsx` y el stepper de compases por nota.

   3. Test de precisión del bajo (falla): ataques en el tiempo 1, a menos de 1 ms (umbral 1e-5, compás sí y compás no).

      Código: el bajo Analógico cálido en `tone-engine.ts`.
4. **US4 · #18: filtros de notas**.
   - Test `note-filters.test.tsx` (falla). Debe comprobar:
     - 12 toggles incluidos, con la grafía de las negras;
     - excluir e incluir una nota;
     - los 4 atajos y sus estados deshabilitados;
     - que con solo naturales la vuelta tiene 7;
     - que con menos de 2, Play queda deshabilitado y aparece el aviso;
     - que el cambio con la música sonando aplica desde la siguiente vuelta;
     - que con menos de 2 mientras suena, la siguiente vuelta usa las notas anteriores.
   - Código: shadcn `toggle`, filtros en el panel y `toggleNote`/`setGroup` en el store.
5. **US5 · #19: carril de compases**.
   1. `lane.test.tsx` (falla). Debe comprobar:
      - la cuenta 4-3-2-1 en "Ahora";
      - el carril con los 24 compases de la vuelta y su nota;
      - que `aria-current` avanza con los tiempos;
      - el contador `Vuelta 1 · nota 1 de 12` → `nota 2`;
      - que `Vuelta 2: {nota}` aparece al empezar la última nota y es distinta de esa nota.

      Código: `lane.tsx`, la cuenta en `now.tsx` y el contador.

   2. E2E (falla): BPM 240 desde el panel → Play → cuenta → nota con nombre → Stop, en `chromium` e `iphone`.

      Código: lo que falte. Después, el pulido visual con el skill `frontend-design`: filas de 4, compás actual con barra y marcas, atenuados, desplazamiento solo, tamaños a 1–2 m.

   3. Validación completa: quickstart §1–§4, incluida la prueba de oído de 10 minutos. La hace el usuario con la guitarra (§5).

## Complexity Tracking

Sin violaciones de la constitución.
