# Implementation Plan: Práctica cómoda (Entrega 2)

**Branch**: `003-practica-comoda` | **Date**: 2026-10-24 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/003-practica-comoda/spec.md` (issue #3, sub-issues #20–#25)

## Summary

La práctica de la entrega 1 (4/4 fijo, bajo una vez por compás, mezcla fija) pasa a ser configurable:

- **Sonido**: los 8 compases con su agrupamiento, la figura y la octava del bajo, y el volumen y el silencio por canal. La cuenta de entrada suena aunque el metrónomo esté silenciado.
- **Práctica**: parar sola tras N vueltas, pantalla encendida mientras suena, barra espaciadora y tempo rápido en la pantalla de práctica.
- **Ajustes recordados**: en `localStorage`, validados con zod campo por campo.

Arquitectura (aprobada por el usuario el 2026-10-24): **plan por compás**.

- El store arma cada compás como dato (`Bar`: golpes, largo del golpe, cuenta de entrada y eventos) con una función sin efectos.
- El motor encadena compases con `transport.scheduleOnce` y toca cada evento en su tick. El spike dio menos de 1 ms en Chromium y WebKit, también en 12/8 a 240 BPM (research §2).
- La costura sigue siendo una sola, en el borde del audio. El motor falso de los tests cambia de forma, pero no de conducta: en 4/4 con redondas, la secuencia es idéntica a la de la entrega 1 (research §3).

Las decisiones están en [research.md](./research.md), el estado en [data-model.md](./data-model.md) y los contratos en [contracts/interfaces.md](./contracts/interfaces.md).

## Technical Context

**Language/Version**: TypeScript 7.0.2 (strict), Node 24

**Primary Dependencies**:

- Lo que ya está: React 19.3.1, Vite 8.3.5, Tailwind CSS 4.3.3, shadcn 4.22.1, tone 15.1.22 y zustand 5.0.16.
- Se agregan: zod 4.6.7, y los componentes de shadcn `slider`, `switch` y `toggle-group` (research §1).

**Storage**: `localStorage`, una clave (`countdown-notes:ajustes`) con los ajustes, validada con zod al cargar (research §9).

**Testing**:

- Vitest 5.0.5: proyecto `ui` (jsdom, motor falso), que suma `src/test/setup.ts`, y proyecto `audio` (Chromium y WebKit, motor real con `Tone.Offline`).
- Playwright 1.64.1 para E2E (`chromium` e `iphone`).

**Target Platform**: navegador de escritorio actual, y Safari en iOS 17 o superior. Se publica en Vercel como estáticos.

**Project Type**: SPA web, solo frontend

**Performance Goals**:

- En los 8 compases, cada golpe y cada ataque del bajo a menos de 1 ms de su momento teórico (SC-001 y SC-002).
- Un cambio de volumen o de silencio se oye en menos de 100 ms (SC-003). El `rampTo` es de 20 ms.
- El fin tras N vueltas cae exacto en el reloj de audio, sin sonido después (SC-004).

**Constraints**:

- Las mismas de la entrega 1: nunca `setTimeout` ni `setInterval` para el tiempo musical, el primer Play desbloquea el audio, suena con el interruptor de silencio y las dependencias van en versión exacta.
- La pantalla de práctica solo suma el tempo rápido (botones, sin campo editable).
- Lo guardado se valida al cargar; un dato inválido no rompe la app.

**Scale/Scope**: 6 historias sobre la misma pantalla de práctica y el mismo panel. Sigue siendo solo el modo aleatorio.

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

| Principio                 | Cómo se cumple                                                                                                                                                                                                                                                                                                                                                                                                                | Estado |
| ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| I. Test-first             | Cada historia empieza con un test de UI que falla, sobre `<App engine={fake.engine} />`, buscando por rol y nombre ([contracts](./contracts/interfaces.md) §4). El motor real se prueba por `createToneEngine` con audio renderizado, y la regla de la figura del bajo por `bassAttacks`. Los tests de la entrega 1 se traducen al contrato nuevo sin cambiar lo que comprueban, con la aprobación del usuario (research §3). | ✅     |
| II. Entregas verticales   | Cada historia termina en una conducta que se prueba en la app abierta (quickstart §2). El cambio de contrato del motor es la excepción nombrada **refactor puro**: va primero, en 4/4, con la misma conducta. Las dependencias entran en la historia que las usa.                                                                                                                                                             | ✅     |
| III. Precisión del tiempo | Cada compás y cada evento se programan en ticks del `Transport`, con anticipación, y la UI sigue con `Draw` (research §2). El fin tras N vueltas lo marca el motor en el reloj de audio (§7). La pantalla encendida y la barra espaciadora no tocan el tiempo musical. El test `audio` mide cada compás, la figura del bajo, el silencio y el fin.                                                                            | ✅     |
| IV. Manos libres          | Pantalla encendida mientras suena y barra espaciadora. El único ajuste nuevo en la pantalla de práctica es el tempo rápido, que pide #24 y el diseño (§7.1); todo lo demás va al panel. Las marcas y la cuenta van por grupo, para leerse a 1–2 m.                                                                                                                                                                            | ✅     |
| V. Simplicidad            | Solo estáticos; lo guardado vive en el dispositivo y se valida con zod. YAGNI: sin `persist` de Zustand, sin migraciones, sin librería de Wake Lock, sin cuenta de entrada configurable (research §1, §9, §10).                                                                                                                                                                                                               | ✅     |
| Restricciones técnicas    | zod y los componentes de shadcn están en el stack. Interfaz en español.                                                                                                                                                                                                                                                                                                                                                       | ✅     |
| Flujo de trabajo          | Rama `003-practica-comoda`. Commit por paso en verde que referencia el issue de su historia; nunca en `main` ni push. El contrato del motor, el esquema de lo guardado y la traducción de los tests los aprobó el usuario el 2026-10-24.                                                                                                                                                                                      | ✅     |

**Re-check post-diseño**: sin cambios. No hay violaciones que justificar.

## Project Structure

### Documentation (this feature)

```text
specs/003-practica-comoda/
├── plan.md              # Este archivo
├── research.md          # Fase 0: decisiones, spike y fuentes
├── data-model.md        # Fase 1: compases, figura, ajustes guardados, vueltas y compás programado
├── quickstart.md        # Fase 1: cómo validar la entrega de punta a punta
├── contracts/
│   └── interfaces.md    # Fase 1: motor, pantalla accesible y datos guardados
├── checklists/
│   └── requirements.md  # Calidad del spec
└── tasks.md             # Fase 2 (/speckit-tasks)
```

### Source Code (repository root)

Estado final. `(nuevo)` = archivo nuevo; `(cambia)` = archivo que ya existe y se modifica.

```text
vite.config.ts                       # (cambia) proyecto ui: setupFiles
e2e/
└── practice.spec.ts                 # (cambia) barra espaciadora y ajustes recordados
src/
├── App.tsx                          # (cambia) línea de estado con compás, contador con N, tempo rápido, hooks de manos libres
├── App.test.tsx                     # (cambia) accent true/false → 'strong'/'none' (research §3)
├── meters.test.tsx                  # (nuevo) US1
├── bass.test.tsx                    # (nuevo) US2
├── mix.test.tsx                     # (nuevo) US3
├── repeats.test.tsx                 # (nuevo) US4
├── hands-free.test.tsx              # (nuevo) US5
├── saved-settings.test.tsx          # (nuevo) US6
├── audio/
│   ├── engine.ts                    # (cambia) Bar, barAt, Accent, Mix, setMix, onEnd
│   ├── tone-engine.ts               # (cambia) compases encadenados, mezcla por canal, fin
│   └── tone-engine.browser.test.ts  # (cambia) se traduce; suma compases, bajo, mezcla y fin
├── music/
│   ├── meters.ts                    # (nuevo) METERS, acento y grupo del golpe, bassAttacks
│   └── meters.test.ts               # (nuevo) los 32 casos de figura × compás (FR-013)
├── practice/
│   ├── settings.ts                  # (nuevo) settingsSchema, DEFAULT_SETTINGS, loadSettings, saveSettings
│   └── store.ts                     # (cambia) barAt, ajustes nuevos, onEnd, carga y guardado
├── lib/
│   └── hands-free.ts                # (nuevo) useWakeLock, useSpaceToggle
├── components/
│   ├── now.tsx                      # (cambia) cuenta por grupos
│   ├── lane.tsx                     # (cambia) marcas por grupo, barra por golpe
│   ├── settings-panel.tsx           # (cambia) compás, figura, octava, volúmenes y repeticiones
│   └── ui/
│       ├── slider.tsx               # (nuevo, shadcn)
│       ├── switch.tsx               # (nuevo, shadcn)
│       └── toggle-group.tsx         # (nuevo, shadcn)
└── test/
    ├── fake-engine.ts               # (cambia) contrato nuevo: barAt, mix, onEnd
    └── setup.ts                     # (nuevo) ResizeObserver vacío y limpieza de localStorage
```

**Structure Decision**:

- Se mantienen las carpetas de la entrega 1:
  - `audio/`: el borde con Web Audio;
  - `practice/`: qué suena y cuándo, más los ajustes;
  - `music/`: datos y reglas musicales sin estado;
  - `components/`: la UI.
- `lib/hands-free.ts` reúne los dos bordes con el navegador que no son audio: Wake Lock y teclado.
- Solo `audio/tone-engine.ts` y `main.tsx` importan Tone.js; los tests `*.browser.test.ts` también.
- Los tests de UI van uno por historia, en `src/`, y todos montan `App` completa.

## Orden sugerido para `/speckit-tasks` (porciones verticales)

Cada paso es test que falla → código mínimo → verde → commit con el issue (`#20`…`#25`). La rama ya existe.

1. **Fundacional · refactor puro (excepción nombrada) · #20: motor con plan por compás, en 4/4**. Misma conducta que la entrega 1.
   1. `engine.ts` con `Bar` y `barAt`, y `Accent = 'strong' | 'none'`. Traducir `tone-engine.browser.test.ts`: `barAt` arma el 4/4 de antes y los acentos pasan a `'strong'`/`'none'`. Falla.

      Código: `tone-engine.ts` con compases encadenados por `scheduleOnce` (research §2). Verde en Chromium y WebKit.

   2. Traducir `App.test.tsx` (acentos). Falla.

      Código: `fake-engine.ts` con el contrato nuevo y `soundsAt` del store convertido en `barAt`. Todos los tests de UI de la entrega 1 en verde sin otros cambios.
2. **US1 · #20: compases comunes**.
   1. `meters.test.tsx` (falla). Debe comprobar:
      - el compás por defecto 4/4 y los 8 radios;
      - en 6/8: los acentos `strong, none, none, soft, none, none`, la cuenta 2-1 y 2 marcas (`Tiempo 1 de 2`);
      - en 7/8: acentos en 0, 2 y 4, y 3 marcas;
      - en 3/4: 3 golpes y la línea de estado con `3/4`;
      - que el cambio mientras suena aplica desde la siguiente vuelta.

      Código: `meters.ts`, `meter` en el store y en la vuelta, el `toggle-group` de shadcn en el panel, y la cuenta, las marcas y la línea de estado.

   2. Test de precisión por cada compás (falla en el acento suave): golpes a menos de 1 ms, y el pico del fuerte mayor que el del suave, y el del suave mayor que el sin acento.

      Código: el click suave en `tone-engine.ts`.
3. **US2 · #21: figura y octava del bajo**.
   1. `music/meters.test.ts` (falla): los 32 casos de `bassAttacks` según la tabla de FR-013.

      Código: `bassAttacks`.

   2. `bass.test.tsx` (falla). Debe comprobar:
      - Redondas y octava 2 por defecto;
      - en 4/4, 8, 4, 2 y 1 ataques por compás;
      - la octava en la altura (`Bb3`);
      - que el cambio mientras suena aplica desde el compás siguiente.

      Código: `bassFigure` y `bassOctave` en el store, en `barAt` y en el panel.

   3. Test de precisión del bajo en `at` fraccionario y con `length` (falla).

      Código: el bajo usa `length` del evento en `tone-engine.ts`.
4. **US3 · #22: volumen por canal y metrónomo apagable**.
   1. `mix.test.tsx` (falla). Debe comprobar:
      - los dos sliders en 80, sin silenciar;
      - que mover un volumen o silenciar mientras suena llega a `fake.mix` sin detener el motor;
      - que quitar el silencio devuelve el volumen anterior.

      Código: `mix` en el store y en el panel (`slider` de shadcn), `setMix` en el contrato y en el motor falso, y `src/test/setup.ts` con el `ResizeObserver` vacío.

   2. Test de precisión (falla). Debe comprobar:
      - con el bajo silenciado, no suena el bajo;
      - con el metrónomo silenciado, la cuenta suena y los compases siguientes no tienen clicks.

      Código: cadena por canal y cuenta de entrada enrutada aparte en `tone-engine.ts` (research §6).
5. **US4 · #23: parar tras N vueltas**.
   1. `repeats.test.tsx` (falla). Debe comprobar:
      - apagado por defecto;
      - con 3, el contador `Vuelta 2 de 3 · nota 1 de 12`;
      - que la última vuelta no muestra vista previa;
      - que al terminar vuelve a Play y `fake.running` es `false`;
      - que bajar N mientras suena termina la vuelta en curso, y que apagarlo sigue.

      Código: `repeats` en el store, `barAt` → `undefined`, `onEnd`, y `switch` y stepper en el panel.

   2. Test de precisión del fin (falla): sin sonido después del último compás y `onEnd` una vez.

      Código: fin en `tone-engine.ts`.
6. **US5 · #24: manos libres**.
   1. `hands-free.test.tsx` (falla). Debe comprobar:
      - con un `navigator.wakeLock` falso: Play lo pide, Stop lo libera, y volver a la pestaña lo pide de nuevo;
      - que sin `wakeLock`, Play funciona;
      - la barra espaciadora: alterna con el foco en Play y en Ajustes, una vez por pulsación; no actúa con el panel abierto ni con menos de 2 notas;
      - el tempo rápido: `Subir 5 BPM` mientras suena llega a `fake.bpm`, y se limita a 30–240.

      Código: `lib/hands-free.ts` y los botones en `App.tsx`.

   2. E2E (falla): espacio con el foco en Play, una vez por pulsación y sin desplazar la página, en `chromium` e `iphone`.

      Código: lo que falte.
7. **US6 · #25: recordar los ajustes**.
   1. `saved-settings.test.tsx` (falla). Debe comprobar:
      - que cambiar todos los ajustes, desmontar y montar otra `App` los conserva, y que abre detenida;
      - que un JSON roto da todos los valores por defecto;
      - que `bpm: 500` vuelve solo el BPM a 60 y conserva el resto;
      - que con `localStorage` que lanza errores, la app funciona.

      Código: `pnpm add -E zod@4.6.7`, `practice/settings.ts`, carga en `createPracticeStore` y guardado con `subscribe`, y la limpieza de `localStorage` en `setup.ts`.

   2. E2E (falla): BPM 90 y 6/8, recargar, y siguen igual.

      Código: lo que falte.
8. **Cierre**:
   - Pulido visual del panel y del tempo rápido con el skill `frontend-design`.
   - Validación completa: quickstart §1–§4. La parte manual (iPhone, prueba de oído y sesión con la guitarra) la hace el usuario (§5).

## Complexity Tracking

Sin violaciones de la constitución.
