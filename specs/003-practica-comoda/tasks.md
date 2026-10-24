---
description: 'Lista de tareas de la Entrega 2 · Práctica cómoda'
---

# Tasks: Práctica cómoda (Entrega 2)

**Input**: Documentos de diseño en `specs/003-practica-comoda/`: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/interfaces.md](./contracts/interfaces.md) y [quickstart.md](./quickstart.md).

**Tests**: se incluyen, porque la constitución exige test-first (principio I). Cada test se escribe primero y se ve fallar antes de implementar.

**Organización**: una fase fundacional (refactor puro del contrato del motor) y después una fase por historia (sub-issue), en el orden del spec. Cada historia termina en una conducta que se prueba con la app abierta.

**Reglas que aplican a todas las tareas**:

- **Git**:
  - Todo en la rama `003-practica-comoda`; nunca en `main` y nunca push.
  - Commit después de cada paso en verde, con el número de issue en el mensaje (por ejemplo, `#20`) y la línea de atribución de la sesión.
- **Dependencias**: versión exacta (`pnpm add -E`), con las versiones de research.md §1. Si una falla al instalar, se consulta al usuario; no se cambia por un rango.
- **Tests**:
  - Nunca se debilita, salta ni borra un test para que pase. Si un test parece incorrecto, se consulta al usuario. La única excepción es la traducción de T003 y T005, que aprobó el usuario (research.md §3).
  - Los tests de UI usan `renderApp()` de `src/test/app.tsx` (monta `<App engine={fake.engine} />`) y buscan por rol y nombre accesible ([contracts](./contracts/interfaces.md) §4), nunca por clases ni por estructura.
  - Usan `userEvent.setup()` (viene en `renderApp`) y, para avanzar la música, `fake.beat(n)`, que avanza n golpes de metrónomo.
  - Cada test tiene al menos un `expect`, porque `vitest/expect-expect` solo acepta `expect` y `screen.getBy*` como aserción.
- **Código**:
  - Formato de oxfmt: comillas simples, sin punto y coma, sin coma final, indentación de 2 espacios.
  - Los archivos que genera shadcn se pasan por `pnpm format`.
  - Nunca se usa `setTimeout` ni `setInterval` para el tiempo musical (constitución III).
  - Solo `src/main.tsx` y `src/audio/tone-engine.ts` importan `tone`. Los tests `*.browser.test.ts` también, porque prueban el motor real.
- **Verde** significa que pasan `pnpm lint`, `pnpm format:check`, `pnpm test`, `pnpm test:e2e` y `pnpm build`.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: se puede hacer en paralelo (otro archivo, sin depender de tareas pendientes).
- **[Story]**: la historia del spec (US1–US6). Entre paréntesis va su issue.

---

## Phase 1: Setup

**Purpose**: comprobar que la rama parte en verde. Las dependencias nuevas entran en la historia que las usa (plan, Constitution Check II).

- [x] T001 En la rama `003-practica-comoda`, correr `pnpm install`, `pnpm lint`, `pnpm format:check`, `pnpm test`, `pnpm test:e2e` y `pnpm build`: los 6 en verde. Sin commit.

---

## Phase 2: Foundational · refactor puro del motor (excepción nombrada, #20)

**Purpose**: cambiar el contrato del motor de "un callback por negra" a "plan por compás" (research.md §2), en 4/4 y **con la misma conducta** que la entrega 1. Bloquea todas las historias, porque los compases, la figura, la mezcla y el fin se montan sobre este contrato.

**Independent Test**: todos los tests de la entrega 1 en verde (los traducidos y los que no cambian); con `pnpm dev`, la app suena igual que antes.

- [x] T002 Reescribir los tipos de `src/audio/engine.ts` (solo tipos, sin código), con un comentario por campo como en [contracts](./contracts/interfaces.md) §2:

  ```ts
  export type Accent = 'strong' | 'none'

  export type Sound =
    | { kind: 'click'; accent: Accent }
    | { kind: 'bass'; pitch: string } // altura de Tone, p. ej. 'Bb2'

  export type Bar = {
    beats: number
    beatLength: number
    events: { at: number; sound: Sound }[]
  }

  export type EngineStart = {
    bpm: number
    barAt: (bar: number) => Bar
    onBeat: (bar: number, beat: number) => void
  }
  ```

  `Engine` (`start`, `stop`, `setBpm`) no cambia. Lo demás del contrato llega en su historia: `'soft'` en T009, `length` en T018, `Mix`/`setMix`/`countIn` en T023 y `undefined`/`onEnd` en T029.

- [x] T003 Traducir `src/audio/tone-engine.browser.test.ts` al contrato nuevo (research.md §3), sin cambiar lo que comprueba:
  - `renderPractice(bpm, barAt, seconds, during?)` arranca con `engine.start({ bpm, barAt, onBeat: () => {} })`.
  - `clicks` pasa a ser un `barAt` de 4/4: `() => ({ beats: 4, beatLength: 1, events: [0, 1, 2, 3].map((at) => ({ at, sound: { kind: 'click', accent: at === 0 ? 'strong' : 'none' } })) })`.
  - El test del bajo arma, con un `barAt`, lo mismo que hoy: compás 0, un click `'strong'` en `at: 0`; compases impares, un `bass` `'Bb2'` en `at: 0`; compases pares desde el 2, sin eventos.

  Correr `pnpm test --project audio` y **verlo fallar**, porque el motor todavía llama a `soundsAt`.

- [x] T004 Reescribir la programación de `src/audio/tone-engine.ts` (research.md §2). La creación de sintetizadores y buses, `stop` y `setBpm` no cambian.
  - Borrar `scheduleRepeat` y `transport.timeSignature`. Mantener `transport.bpm.setValueAtTime(bpm, startAt)` y `transport.start(startAt)`.
  - `scheduleBar(bar, tick)` hace `transport.scheduleOnce((time) => { … }, `${tick}i`)`. Adentro:
    - `const plan = barAt(bar)` y `const perBeat = Math.round(transport.PPQ * plan.beatLength)`;
    - un helper `at(beats, fn)`: si `beats === 0`, llama `fn(time)`; si no, `transport.scheduleOnce(fn, `${tick + Math.round(beats * perBeat)}i`)`;
    - para cada evento, `at(event.at, (t) => play(event.sound, t))`;
    - para cada golpe `b` de 0 a `plan.beats − 1`, `at(b, (t) => draw.schedule(() => onBeat(bar, b), t))`;
    - `scheduleBar(bar + 1, tick + plan.beats * perBeat)`.
  - `play(sound, time)`: el click como hoy (`'strong'` → 1760 Hz y velocidad 1; `'none'` → 1175 Hz y 0,55). El bajo dura el 90 % del compás: `transport.toSeconds(`${Math.round(plan.beats * perBeat * 0.9)}i`)`.
  - Empezar con `scheduleBar(0, 0)`.

  Correr `pnpm test --project audio`: debe quedar **en verde en Chromium y WebKit**.

- [x] T005 Traducir los acentos de `src/App.test.tsx`: `accent: true` → `'strong'` y `accent: false` → `'none'`, en `'Play arranca el metrónomo…'` y en `'Play después de Stop…'` (research.md §3). Reescribir `src/test/fake-engine.ts` para el contrato nuevo ([contracts](./contracts/interfaces.md) §2, motor falso):
  - el estado es `options`, `bpm`, el compás y golpe siguientes (`bar`, `beat`) y el `plan` del compás actual. `start` los reinicia en 0;
  - `beat(n = 1)`, dentro de `act` y mientras haya `options`, para cada golpe:
    - si `beat === 0`, `plan = options.barAt(bar)`;
    - agrega a `played` cada evento con `beat ≤ at < beat + 1`, como `{ bar, beat: event.at, sound: event.sound }`;
    - llama a `options.onBeat(bar, beat)`;
    - avanza `beat`, y al llegar a `plan.beats` pasa a `bar + 1, beat 0`.

  Correr `pnpm test --project ui` y **verlo fallar**, porque el store todavía entrega `soundsAt`.

- [x] T006 En `src/practice/store.ts`, reemplazar `soundsAt` por `barAt(bar): Bar`:
  - los clicks de un compás de 4/4: `[0, 1, 2, 3]`, con `accent: at === 0 ? 'strong' : 'none'`;
  - compás 0: `{ beats: 4, beatLength: 1, events: clicks }`;
  - compás ≥ 1: la misma búsqueda de la vuelta y el mismo sorteo de la siguiente que hoy. Los eventos son los clicks más `{ at: 0, sound: { kind: 'bass', pitch: `${nota}2` } }`, ordenados por `at`, con el click antes que el bajo en el mismo `at` (el orden de la entrega 1);
  - `play` arranca con `engine.start({ bpm, barAt, onBeat })`.

  **Verde completo** (`pnpm test` en los dos proyectos, `pnpm test:e2e`, lint, formato y build). Escuchar con `pnpm dev`: suena igual que la entrega 1. **Commit**: `refactor: motor con plan por compás (#20)`. Done: la escucha con `pnpm dev` queda para el usuario; se comprobó con los tests de audio en Chromium y WebKit.

**Checkpoint**: el contrato nuevo está en uso y la conducta de la entrega 1 está intacta.

---

## Phase 3: User Story 1 · Compases comunes (P1, #20) 🎯 MVP

**Goal**: en ajustes se elige entre 2/4, 3/4, 4/4, 5/4, 6/8, 7/8, 9/8 y 12/8. El metrónomo marca su agrupamiento con acento fuerte y suave, y la cuenta, las marcas del carril y la línea de estado lo siguen. Un cambio mientras suena aplica desde la siguiente vuelta.

**Independent Test**: `pnpm test` en verde; con `pnpm dev`, quickstart §2, filas 1–4.

- [x] T007 [P] [US1] Correr `pnpm dlx shadcn@4.22.1 add toggle-group`, que crea `src/components/ui/toggle-group.tsx`, y después `pnpm format`.
- [x] T008 [US1] Escribir `src/meters.test.tsx`. Helpers en el archivo:
  - `chooseMeter(app, id)`: abre el panel, hace clic en `getByRole('radio', { name: id })` dentro del `radiogroup` `Compás`, y lo cierra;
  - `clicksOf(fake, bar)`: los `accent` de los clicks de ese compás, en orden.

  Tests:
  - `'el compás empieza en 4/4 y se elige entre los 8'`: los `radio` del grupo `Compás` se llaman, en orden, `2/4, 3/4, 4/4, 5/4, 6/8, 7/8, 9/8, 12/8`, y solo `4/4` tiene `aria-checked="true"`.
  - `'en 6/8 marca cada corchea, con acento fuerte en la 1 y suave en la 4'`:
    - 6/8, Play y `fake.beat(12)`;
    - `clicksOf` de los compases 0 y 1 es `['strong', 'none', 'none', 'soft', 'none', 'none']`;
    - se ve `Aleatorio · Analógico cálido · 60 BPM · 6/8`.
  - `'en 6/8 la cuenta y las marcas van por grupo'`:
    - 6/8 y Play;
    - `fake.beat(1)` → "Ahora" muestra `2`; `fake.beat(3)` → `1`;
    - `fake.beat(3)` (compás 1, golpe 0) → el compás con `aria-current="true"` tiene un `img` llamado `Tiempo 1 de 2`, y los demás compases un `img` llamado `2 tiempos`;
    - `fake.beat(3)` → `Tiempo 2 de 2`.
  - `'en 7/8 agrupa 2+2+3'`:
    - 7/8 y Play;
    - `fake.beat(1)` → "Ahora" muestra `3`; `fake.beat(2)` → `2`; `fake.beat(2)` → `1`; `fake.beat(2)` (fin del compás 0);
    - `clicksOf(fake, 0)` es `['strong', 'none', 'soft', 'none', 'soft', 'none', 'none']`;
    - `fake.beat(1)` → el compás actual tiene un `img` llamado `Tiempo 1 de 3`.
  - `'en 3/4 hay 3 golpes por compás y el bajo ataca en el 1'`:
    - 3/4, Play, `fake.beat(3 + 3)`;
    - `clicksOf(fake, 1)` es `['strong', 'none', 'none']`;
    - el compás 1 tiene un solo `bass`, con `beat: 0`.
  - `'el compás cambiado mientras suena aplica desde la siguiente vuelta'`:
    - Play (4/4), `fake.beat(4 + 1)`, `chooseMeter(app, '3/4')`;
    - se sigue viendo `… · 60 BPM · 4/4`;
    - `fake.beat(24 * 4 - 1 + 3)`;
    - el compás 24 tiene 4 clicks, el 25 tiene 3, y se ve `… · 60 BPM · 3/4`.

  Correr `pnpm test --project ui` y **verlo fallar**. Done: los 6 tests fallaron con `Unable to find an accessible element with the role "radiogroup" and name "Compás"`; las aserciones de `within(...).getBy*` van envueltas en `expect(...).toBeDefined()` por `vitest/expect-expect`.

- [x] T009 [P] [US1] Crear `src/music/meters.ts` (data-model.md, "Compás"):
  - `export type MeterId = '2/4' | '3/4' | '4/4' | '5/4' | '6/8' | '7/8' | '9/8' | '12/8'`;
  - `export type Meter = { id: MeterId; beats: number; beatLength: number; groups: number[]; soft: boolean }`;
  - `export const METERS: Meter[]`, con la tabla exacta de data-model.md, en el orden `2/4, 3/4, 4/4, 5/4, 6/8, 7/8, 9/8, 12/8`, y `METER_BY_ID: Record<MeterId, Meter>`;
  - `groupStarts(meter): number[]`: el golpe donde empieza cada grupo (sumas acumuladas de `groups`, desde 0);
  - `groupOf(meter, beat): number`: el índice del grupo que contiene el golpe;
  - `accentAt(meter, beat): Accent`: `'strong'` si `beat === 0`; `'soft'` si `meter.soft` y `beat` está en `groupStarts`; si no, `'none'`. `Accent` sale de `@/audio/engine`.

  En T009 `Accent` todavía no tiene `'soft'`: agregarlo a `engine.ts` aquí (`'strong' | 'soft' | 'none'`), sin tocar el motor.

- [x] T010 [US1] Implementar (data-model.md, "Ajustes", "Vuelta" y "Derivados"):
  - **`store.ts`**:
    - `meter: MeterId` (inicial `'4/4'`) y `setMeter(id)`;
    - `Round` suma `meter`. `play` y `nextRound` copian el `meter` del estado;
    - `barAt`: el compás de la vuelta (el 0 usa `rounds[0].meter`). Los clicks son `beats` eventos con `accent: accentAt(meter, at)`; `beats` y `beatLength` salen del compás;
    - exportar `meterOf(state)`: `METER_BY_ID[state.rounds[0]?.meter ?? state.meter]`.
  - **`now.tsx`**: la cuenta es `meter.groups.length − groupOf(meter, position.beat)`, con `meterOf`. Antes del primer golpe (`position === null`) muestra `groups.length`.
  - **`lane.tsx`**:
    - el compás de la vuelta es `METER_BY_ID[round.meter]`;
    - `BeatSlashes` dibuja `groups.length` marcas, dentro de un `<span role="img">` con `aria-label` `Tiempo {g} de {grupos}` en el compás actual (`g = groupOf + 1`) y `{grupos} tiempos` en los demás. Se iluminan hasta `g`;
    - la barra de progreso usa `--from: beat / beats`, `--to: (beat + 1) / beats` y `--beat: ${beatLength * 60 / bpm}s`.
  - **`App.tsx`**: la línea de estado termina en `· {meterOf(state).id}`.
  - **`settings-panel.tsx`**: una sección `Compás` con `ToggleGroup type="single"`, `aria-label="Compás"`, `value={meter}` y `onValueChange={(v) => v && setMeter(v as MeterId)}`. Son 8 `ToggleGroupItem` en una grilla de 4 columnas, con el texto del compás. Ajustar la `SheetDescription`: el tempo y el volumen cambian al instante; el sonido, desde el siguiente compás; la estructura, desde la siguiente vuelta.

  `pnpm test --project ui` debe quedar **en verde**, incluidos los tests de la entrega 1. **Commit**: `feat: compases comunes en ajustes, carril y cuenta (#20)`. Done: el `<span role="img">` de `BeatSlashes` lleva un `oxlint-disable-next-line jsx-a11y/prefer-tag-over-role` (un `<img>` no puede contener las marcas).

- [x] T011 [US1] En `src/audio/tone-engine.browser.test.ts`, agregar:
  - `test.each(METERS)('en $id, cada golpe cae en su tiempo')`:
    - a 60 BPM, 2 compases;
    - `barAt` devuelve el compás con un click por golpe y `accent: accentAt(meter, at)`;
    - `seconds = (2 * beats - 0.5) * beatLength`;
    - `onsets(buffer, 1e-3, 0.1)` da `2 * beats` inicios, y cada uno cae a menos de 1 ms de `inicios[0] + k * beatLength`.
  - `'en 12/8 a 240 BPM, los golpes caen cada 83 ms'`: 3 compases, `onsets(buffer, 1e-3, 0.02)`, 36 inicios a menos de 1 ms (el caso del spike).
  - `'el acento fuerte suena más que el suave, y el suave más que el sin acento'`: en 6/8 a 60 BPM, 1 compás. Con los `peak` de los inicios: `peak[0] > 1.1 × peak[3]`, y `peak[3] > 1.1 ×` el mayor de `peak[1], peak[2], peak[4], peak[5]`.

  Correr `pnpm test --project audio` y **verlo fallar** en el acento suave.

- [x] T012 [US1] En `tone-engine.ts`, el click usa una tabla por acento (research.md §4): `strong` → 1760 Hz y velocidad 1; `soft` → 1480 Hz y 0,8; `none` → 1175 Hz y 0,55. `pnpm test` **en verde en los dos proyectos**. **Commit**: `feat: acento suave del metrónomo (#20)`.
- [ ] T013 [US1] Verificación manual: quickstart §2, filas 1–4, con `pnpm dev`. Anotar en research.md §4 si el acento suave necesita otros valores.

**Checkpoint**: US1 completa. Se puede practicar en cualquier compás.

---

## Phase 4: User Story 2 · Figura rítmica y octava del bajo (P2, #21)

**Goal**: en ajustes se elige la figura del bajo (corcheas, negras, blancas o redondas; por defecto redondas) y la octava (1, 2 o 3; por defecto 2). Aplican desde el siguiente compás.

**Independent Test**: `pnpm test` en verde; con `pnpm dev`, quickstart §2, filas 5–7.

- [x] T014 [US2] Escribir `src/music/meters.test.ts`, que importa `METER_BY_ID` y `bassAttacks` de `./meters`. Un `test.each` con los 32 casos: para cada compás y figura, los `at` de `bassAttacks(METER_BY_ID[id], figure)` son:

  | Compás | `eighth`            | `quarter`     | `half`  | `whole` |
  | ------ | ------------------- | ------------- | ------- | ------- |
  | 2/4    | 0, 0.5, 1, 1.5      | 0, 1          | 0       | 0       |
  | 3/4    | 0, 0.5, …, 2.5 (6)  | 0, 1, 2       | 0, 2    | 0       |
  | 4/4    | 0, 0.5, …, 3.5 (8)  | 0, 1, 2, 3    | 0, 2    | 0       |
  | 5/4    | 0, 0.5, …, 4.5 (10) | 0, 1, 2, 3, 4 | 0, 2, 4 | 0       |
  | 6/8    | 0, 1, 2, 3, 4, 5    | 0, 3          | 0       | 0       |
  | 7/8    | 0, 1, …, 6          | 0, 2, 4       | 0, 4    | 0       |
  | 9/8    | 0, 1, …, 8          | 0, 3, 6       | 0, 6    | 0       |
  | 12/8   | 0, 1, …, 11         | 0, 3, 6, 9    | 0, 6    | 0       |

  En cada caso, además, `length` de cada ataque es `siguiente at − at` (el último llega hasta `beats`), y la suma de los `length` es `beats`.

  Correr `pnpm test --project ui` y **verlo fallar**.

- [x] T015 [US2] En `src/music/meters.ts`, agregar `export type BassFigure = 'eighth' | 'quarter' | 'half' | 'whole'` y `bassAttacks(meter, figure): { at: number; length: number }[]` (research.md §5):
  - la corchea dura `0.5` golpe si todos los `groups` valen 1 (compases simples); si no, `1`;
  - `eighth`: de 0 a `beats` en pasos de una corchea; `quarter`: `groupStarts`; `half`: los `groupStarts` de índice par; `whole`: `[0]`;
  - `length` = `(siguiente at ?? beats) − at`.

  `pnpm test --project ui` **en verde**. **Commit**: `feat: ataques del bajo por figura y compás (#21)`.

- [x] T016 [US2] Escribir `src/bass.test.tsx`. Para elegir: abrir el panel y hacer clic en el `radio` dentro del `radiogroup` `Figura del bajo` u `Octava del bajo`. Helper: `bassOf(fake, bar)` = los `{ beat, pitch }` de los `bass` de ese compás. Tests:
  - `'la figura empieza en redondas y la octava en 2'`: `Redondas` y `2` tienen `aria-checked="true"`; los radios de figura son `Corcheas, Negras, Blancas, Redondas` y los de octava `1, 2, 3`.
  - `test.each([['Corcheas', 8], ['Negras', 4], ['Blancas', 2], ['Redondas', 1]])('en 4/4 con %s el bajo ataca %i veces por compás')`: elegir la figura, Play, `fake.beat(4 + 4)`; `bassOf(fake, 1)` tiene ese largo, el primero en `beat: 0`, y todos con la misma altura.
  - `'la octava cambia la altura del bajo'`: octava `3`, Play, `fake.beat(5)`; el `pitch` del compás 1 termina en `3`. Lo mismo con `1`.
  - `'figura y octava cambiadas mientras suena aplican desde el siguiente compás'`:
    - Play, `fake.beat(4 + 1)`; elegir `Negras` y octava `3`;
    - `fake.beat(3 + 4)`;
    - el compás 1 tiene 1 ataque en octava 2, y el compás 2 tiene 4 ataques en octava 3.

  Correr `pnpm test --project ui` y **verlo fallar**.

- [x] T017 [US2] Implementar:
  - **`store.ts`**:
    - `bassFigure: BassFigure` (inicial `'whole'`), `bassOctave: 1 | 2 | 3` (inicial `2`), `setBassFigure` y `setBassOctave`;
    - en `barAt`, los `bass` salen de `bassAttacks(meter, bassFigure)`, con `pitch: `${nota}${bassOctave}``, leídos al armar el compás (FR-015).
  - **`settings-panel.tsx`**: una sección `Bajo` con dos `ToggleGroup type="single"`: `aria-label="Figura del bajo"` (`Corcheas`, `Negras`, `Blancas`, `Redondas`, con valores `eighth`, `quarter`, `half` y `whole`) y `aria-label="Octava del bajo"` (`1`, `2`, `3`). Ignorar el valor vacío, como en T010.

  `pnpm test --project ui` **en verde**. **Commit**: `feat: figura y octava del bajo (#21)`.

- [x] T018 [US2] En `engine.ts`, el bajo pasa a `{ kind: 'bass'; pitch: string; length: number }` (length en golpes). En el store, cada `bass` lleva el `length` de `bassAttacks`. En `tone-engine.browser.test.ts`:
  - traducir el test del bajo: su `bass` lleva `length: 4`;
  - agregar `'el bajo ataca a mitad de golpe y dura lo que dice length'`:
    - a 60 BPM, 4/4;
    - compás 0: un click `'strong'` en `at: 0`; compás 1: un `bass` `'Bb2'` en `at: 1.5` con `length: 0.5`; después, compases vacíos;
    - `onsets(buffer, 1e-5, 1)` da 2 inicios, y el segundo cae a menos de 1 ms de `inicios[0] + 5.5`;
    - desde `inicios[0] + 5.5 + 0.45 + 0.3 + 0.2` s, ninguna muestra supera 1e-3.

  Correr `pnpm test --project audio` y **verlo fallar** en el largo, porque el motor todavía suena el 90 % del compás.

- [x] T019 [US2] En `tone-engine.ts`, el bajo dura el 90 % de su `length`: `transport.toSeconds(`${Math.round(sound.length * perBeat * 0.9)}i`)`. `pnpm test` **en verde en los dos proyectos**. **Commit**: `feat: duración del bajo según la figura (#21)`.
- [ ] T020 [US2] Verificación manual: quickstart §2, filas 5–7, con `pnpm dev`.

**Checkpoint**: US1 y US2 en verde.

---

## Phase 5: User Story 3 · Volumen por canal y metrónomo apagable (P3, #22)

**Goal**: un volumen (0–100, por defecto 80) y un botón para silenciar el bajo y el metrónomo. Aplican de inmediato y no detienen la práctica. La cuenta de entrada suena aunque el metrónomo esté silenciado.

**Independent Test**: `pnpm test` en verde; con `pnpm dev`, quickstart §2, filas 8–9.

- [x] T021 [P] [US3] Preparación:
  - correr `pnpm dlx shadcn@4.22.1 add slider` y después `pnpm format`;
  - en `src/components/ui/slider.tsx`, hacer que el `aria-label` que recibe el componente llegue a cada `Thumb`, que es el elemento con `role="slider"`;
  - crear `src/test/setup.ts` con un `ResizeObserver` vacío en `globalThis` (`observe`, `unobserve` y `disconnect` sin hacer nada), porque el `Slider` de Radix lo usa y jsdom no lo tiene;
  - en `vite.config.ts`, proyecto `ui`, agregar `setupFiles: ['src/test/setup.ts']`.

  `pnpm test --project ui` sigue en verde.

- [x] T022 [US3] Escribir `src/mix.test.tsx`. Los sliders se buscan con `getByRole('slider', { name: 'Volumen del bajo' })` y `getByRole('slider', { name: 'Volumen del metrónomo' })`; para moverlos, `slider.focus()` y `user.keyboard('{ArrowLeft}')`. Tests:
  - `'los dos canales empiezan en 80 y sin silenciar'`: los dos sliders tienen `aria-valuenow="80"`, y `Silenciar bajo` y `Silenciar metrónomo` tienen `aria-pressed="false"`.
  - `'Play arranca con la mezcla del panel'`: Play → `fake.mix` es `{ click: { volume: 80, muted: false }, bass: { volume: 80, muted: false } }`.
  - `'el volumen cambia de inmediato sin detener la música'`: Play, `fake.beat(5)`, `{ArrowLeft}` en el bajo → `fake.mix.bass.volume` es 79 y `fake.running` es `true`.
  - `'silenciar un canal no detiene la práctica, y quitar el silencio devuelve el volumen'`:
    - Play, `fake.beat(5)`, clic en `Silenciar metrónomo` → `fake.mix.click` es `{ volume: 80, muted: true }` y `fake.running` es `true`;
    - `Cerrar`, `fake.beat(8)` → se ve `Vuelta 1 · nota 2 de 12`;
    - otro clic en `Silenciar metrónomo` → `fake.mix.click` es `{ volume: 80, muted: false }`.
  - `'la cuenta de entrada va marcada para sonar aunque el metrónomo esté silenciado'`: silenciar el metrónomo, Play, `fake.beat(5)` → `fake.bars[0].countIn` es `true` y `fake.bars[1].countIn` no es `true`.

  Correr `pnpm test --project ui` y **verlo fallar**.

- [x] T023 [US3] Implementar:
  - **`engine.ts`**: `Channel = 'click' | 'bass'`, `Mix = Record<Channel, { volume: number; muted: boolean }>`, `Bar` suma `countIn?: boolean`, `EngineStart` suma `mix: Mix` y `Engine` suma `setMix: (mix: Mix) => void`.
  - **`tone-engine.ts`**: `setMix` vacío por ahora. La cadena real llega en T025.
  - **`fake-engine.ts`**: guarda `mix` en `start` y `setMix` (getter `mix`), y agrega a `bars` cada `Bar` que devuelve `barAt`.
  - **`store.ts`**:
    - `mix: Mix`, inicial `{ click: { volume: 80, muted: false }, bass: { volume: 80, muted: false } }`;
    - `setVolume(channel, volume)`: entero limitado a 0–100;
    - `toggleMute(channel)`;
    - las dos crean un `mix` nuevo y, si `status !== 'stopped'`, llaman a `engine.setMix`;
    - `play` pasa `mix` a `start`, y `barAt(0)` lleva `countIn: true`.
  - **`settings-panel.tsx`**: una sección `Volumen` con una fila por canal (`Bajo`, `Metrónomo`): un `Slider` (`min 0`, `max 100`, `step 1`, `aria-label` `Volumen del bajo` o `Volumen del metrónomo`) y un `Toggle` con ícono (`Volume2` o `VolumeX` de lucide) y `aria-label` `Silenciar bajo` o `Silenciar metrónomo`.

  `pnpm test --project ui` **en verde**. **Commit**: `feat: volumen y silencio por canal en ajustes (#22)`.

- [x] T024 [US3] En `tone-engine.browser.test.ts`, `renderPractice` recibe `mix` (por defecto, los dos canales en 80 sin silenciar) y lo pasa a `start`. Agregar:
  - `'un canal silenciado no suena'`:
    - a 60 BPM, con el bajo silenciado;
    - compás 0, la cuenta (4 clicks, `countIn: true`); desde el compás 1, solo un `bass` en `at: 0`;
    - desde 3,9 s, ninguna muestra supera 1e-4.
  - `'la cuenta de entrada suena con el metrónomo silenciado, y después no'`: con el metrónomo silenciado, compás 0 con `countIn: true` y compás 1 sin él, los dos con 4 clicks → `onsets(buffer, 1e-3, 0.1)` da exactamente 4 inicios, todos antes de 4 s.
  - `'el volumen cambia de inmediato'`:
    - clicks de 4/4 a 60 BPM, 6 s;
    - `context.setTimeout(() => engine.setMix({ click: { volume: 40, muted: false }, bass: … }), 2.5)`;
    - los `peak` de los inicios en 3, 4 y 5 s son menores que la mitad de los de 0, 1 y 2 s.

  Correr `pnpm test --project audio` y **verlo fallar**.

- [x] T025 [US3] En `tone-engine.ts` (research.md §6):
  - una salida común `out = new Tone.Gain(1).toDestination()`. `stop` silencia `out` en `now − lookAhead`, en lugar de los buses;
  - por canal: sintetizador → `mute` (`Tone.Gain`, 1 o 0) → `volume` (`Tone.Gain`) → `out`;
    - `volume` vale `v === 0 ? 0 : Tone.dbToGain(base + 40 * Math.log10(v / 80))`, con `base` −8 dB para el click y 0 dB para el bajo;
    - los valores iniciales salen de `mix` en `start`;
  - un segundo `Synth` de click, igual al primero, conectado directo al `volume` del click. Toca los clicks de los `Bar` con `countIn`;
  - `setMix(mix)`: `rampTo(valor, 0.02)` en el `volume` y el `mute` de cada canal.

  `pnpm test` **en verde en los dos proyectos**. **Commit**: `feat: mezcla por canal en el motor, con la cuenta siempre audible (#22)`.

- [ ] T026 [US3] Verificación manual: quickstart §2, filas 8–9, con `pnpm dev`.

**Checkpoint**: US1–US3 en verde.

---

## Phase 6: User Story 4 · Parar tras N vueltas (P4, #23)

**Goal**: con "Parar tras N vueltas" activado (1–999; apagado por defecto), el contador muestra el total y la práctica se detiene sola al final exacto de la vuelta N.

**Independent Test**: `pnpm test` en verde; con `pnpm dev`, quickstart §2, fila 10.

- [x] T027 [P] [US4] Correr `pnpm dlx shadcn@4.22.1 add switch` y después `pnpm format`.
- [x] T028 [US4] Escribir `src/repeats.test.tsx`. Para acortar, cada test pone compases por nota en `1`, así que una vuelta dura 12 compases (`12 * 4` golpes). Helper `setRepeats(app, n | 'off')`: en el panel, `switch` `Parar tras N vueltas` y el `spinbutton` `Vueltas` (`typeNumber`). Tests:
  - `'por defecto la práctica sigue hasta Stop'`: el `switch` tiene `aria-checked="false"`, y no hay `spinbutton` `Vueltas`.
  - `'con N vueltas, el contador muestra el total'`: N = 2, Play, `fake.beat(4 + 1)` → `Vuelta 1 de 2 · nota 1 de 12`; `fake.beat(12 * 4)` → `Vuelta 2 de 2 · nota 1 de 12`.
  - `'la última vuelta no muestra la siguiente, y al terminar vuelve a Play'`:
    - N = 2, Play, `fake.beat(4 + 12 * 4 + 11 * 4 + 1)` (última nota de la vuelta 2);
    - no hay texto `/^Vuelta 3: /`;
    - `fake.beat(4)`: `fake.running` es `false`, se ve el botón `Play` y `Toca Play para empezar.`
  - `'bajar N mientras suena termina la vuelta en curso'`: N = 3, Play, `fake.beat(4 + 12 * 4 + 1)` (vuelta 2), N = 1 → `fake.beat(12 * 4)` y `fake.running` es `false`.
  - `'subir N en la última nota descarta el fin'`: N = 1, Play, `fake.beat(4 + 11 * 4 + 1)`, N = 2 → `fake.beat(4)` y se ve `Vuelta 2 de 2 · nota 1 de 12`.
  - `'apagarlo mientras suena sigue hasta Stop'`: N = 1, Play, `fake.beat(5)`, apagar → `fake.beat(12 * 4)` y se ve `Vuelta 2 · nota 1 de 12`.
  - `'bajar N descarta la vista previa de la vuelta siguiente'`: N = 3, Play, `fake.beat(4 + 11 * 4 + 1)` → se ve `/^Vuelta 2: /`; N = 1 → ya no se ve.

  Correr `pnpm test --project ui` y **verlo fallar**. Done: los 7 tests fallaron con `Unable to find an accessible element with the role "switch" and name "Parar tras N vueltas"` (el panel todavía no tiene el switch).

- [x] T029 [US4] Implementar:
  - **`engine.ts`**: `barAt` devuelve `Bar | undefined`, y `EngineStart` suma `onEnd: () => void`.
  - **`tone-engine.ts`**: si `barAt` devuelve `undefined`, `draw.schedule(onEnd, time)` y no programa nada más. El test de audio llega en T030.
  - **`fake-engine.ts`**: si `barAt` devuelve `undefined`, guarda `onEnd`, borra `options` y llama a `onEnd()`.
  - **`store.ts`** (research.md §7):
    - `repeats: { on: boolean; count: number }`, inicial `{ on: false, count: 10 }`;
    - `setRepeats(patch)`: `count` entero limitado a 1–999. Si suena, `repeats.on` y `rounds[0].number >= count`, deja solo `rounds[0]`;
    - en `barAt`, **antes** de buscar la vuelta del compás: con `last = rounds.at(-1)`, si `bar >= primer compás de la última nota de last` y `!repeats.on || last.number < repeats.count`, y todavía no se sorteó la siguiente, se sortea. Así, si el usuario sube N o apaga la opción durante la última nota, la siguiente existe aunque el compás pedido ya sea el primero de ella;
    - después, si ninguna vuelta contiene el compás, `barAt` devuelve `undefined`;
    - `onEnd` = `stop()`.
  - **`App.tsx`**: el contador es `Vuelta {n} de {count} · nota {i} de {total}` con `repeats.on`.
  - **`settings-panel.tsx`**: una sección `Repeticiones` con un `Switch` (`aria-label="Parar tras N vueltas"`) y, si está activado, un `Stepper` (`label="Vueltas"`, de 1 a 999, `decreaseLabel="Menos vueltas"` e `increaseLabel="Más vueltas"`).

  `pnpm test --project ui` **en verde**. **Commit**: `feat: parar tras N vueltas (#23)`. Done: el nombre del `switch` sale de un `<label htmlFor>` visible (y no de `aria-label`), para que el texto también sea área de toque y pase `jsx-a11y/label-has-associated-control`; `tone-engine.browser.test.ts` ya pasa `onEnd: () => {}` en sus llamadas a `start` (adelanto de T030), porque `tsc -b` compila ese archivo y el build tiene que quedar en verde.

- [ ] T030 [US4] En `tone-engine.browser.test.ts`, `renderPractice` pasa `onEnd: () => {}`. Agregar `'después del último compás no suena nada'`: 4/4 a 60 BPM con clicks y un `bass` `'Bb2'` (`length: 4`) en los compases 0 y 1, y `undefined` desde el 2, en 10 s. `onsets(buffer, 1e-3, 0.1)` da 8 inicios, y desde 8,5 s ninguna muestra supera 1e-3.
  - Es un **test de regresión**: T029 ya corta la programación al recibir `undefined`, así que se espera que pase al primer intento. Si falla, corregir el fin en `tone-engine.ts`.
  - El aviso a la UI (`onEnd`) ya se prueba con el motor falso en T028: en `Tone.Offline`, `Draw` no corre al ritmo del render.

  `pnpm test` **en verde en los dos proyectos**. **Commit**: `test: sin sonido después de la última vuelta (#23)`.

- [ ] T031 [US4] Verificación manual: quickstart §2, fila 10, con `pnpm dev`.

**Checkpoint**: US1–US4 en verde.

---

## Phase 7: User Story 5 · Manos libres (P5, #24)

**Goal**: la pantalla no se apaga mientras suena, la barra espaciadora hace Play/Stop, y la pantalla de práctica tiene un tempo rápido de ±5 BPM.

**Independent Test**: `pnpm test` y `pnpm test:e2e` en verde; con `pnpm dev`, quickstart §2, filas 11–13; en el iPhone, quickstart §3.1–3.2.

- [ ] T032 [P] [US5] Escribir `src/hands-free.test.tsx`:
  - helper `fakeWakeLock()`: define `navigator.wakeLock` con `Object.defineProperty(navigator, 'wakeLock', { value: { request }, configurable: true })`. `request = vi.fn(async () => sentinel)` crea y guarda un `sentinel = { released: false, release: vi.fn(async () => { sentinel.released = true }) }`. Un `afterEach` lo borra con `Reflect.deleteProperty(navigator, 'wakeLock')`.
  - Tests de la pantalla encendida:
    - `'Play mantiene la pantalla encendida y Stop la libera'`: Play → `await waitFor` hasta que `request` se llamó con `'screen'`; Stop → el `release` del sentinel se llamó.
    - `'al volver a la pestaña la pide de nuevo si sigue sonando'`: Play y esperar el primer `request`; marcar el sentinel como `released = true` (lo liberó el sistema); `Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true })` y `document.dispatchEvent(new Event('visibilitychange'))` → `request` se llamó 2 veces.
    - `'sin Wake Lock, Play funciona igual'`: sin `fakeWakeLock`, Play → `fake.running` es `true`.
  - Tests de la barra espaciadora:
    - `'la barra espaciadora hace Play y Stop'`: `user.keyboard(' ')` → `fake.running` es `true`; otra vez → `false`.
    - `'con el foco en Play, alterna una sola vez por pulsación'`: `screen.getByRole('button', { name: 'Play' }).focus()`, `user.keyboard(' ')` → se ve `Stop` y `fake.running` es `true`; otra vez → `Play` y `false`.
    - `'con el foco en Ajustes, alterna y no abre el panel'`: foco en `Ajustes`, `user.keyboard(' ')` → `fake.running` es `true` y no hay `dialog`.
    - `'con el panel abierto, no hace Play'`: abrir el panel, `user.keyboard(' ')` → `fake.running` es `false`.
    - `'con menos de 2 notas, no hace nada'`: dejar 1 nota, cerrar el panel, `user.keyboard(' ')` → `fake.running` es `false`.
  - Tests del tempo rápido:
    - `'el tempo rápido sube y baja de a 5 sin abrir ajustes'`: Play, `Subir 5 BPM` → `fake.bpm` es 65 y se ve `Aleatorio · Analógico cálido · 65 BPM · 4/4`; `Bajar 5 BPM` dos veces → 55.
    - `'el tempo rápido se limita a 30–240'`: BPM 238 en el panel, `Subir 5 BPM` → 240; BPM 32, `Bajar 5 BPM` → 30.

  Correr `pnpm test --project ui` y **verlo fallar**.

- [ ] T033 [P] [US5] En `e2e/practice.spec.ts`, agregar `'la barra espaciadora hace Play y Stop una vez por pulsación'`: `page.getByRole('button', { name: 'Play' }).focus()`, `page.keyboard.press('Space')` → `Stop` visible; otra vez → `Play` visible. Al final, `window.scrollY` es 0. Correr `pnpm test:e2e` y **verlo fallar**.
- [ ] T034 [US5] Implementar (research.md §8, §10 y §11):
  - **`src/lib/hands-free.ts`**:
    - `useWakeLock(active: boolean)`: un efecto que, si `active` y existe `navigator.wakeLock`, pide `request('screen')` y guarda el sentinel. Si el efecto se limpió antes de que llegue, lo libera. Escucha `visibilitychange`: si la página está visible y el sentinel falta o está `released`, lo pide de nuevo. Al limpiar, quita el listener y libera el sentinel. Todo error se ignora (`.catch(() => {})`);
    - `useSpaceToggle(toggle: () => void)`: listeners de `keydown` y `keyup` en `window`. Una tecla es "nuestra" si `code === 'Space'`, sin `alt`, `ctrl`, `meta` ni `shift`, y el `target` no está dentro de `[role="dialog"]`. En `keydown` nuestro: `preventDefault()` y, si no es `repeat`, `toggle()`. En `keyup` nuestro: `preventDefault()`.
  - **`App.tsx`**:
    - un componente `HandsFree` (dentro del `PracticeContext`, renderiza `null`) que llama a `useWakeLock(status !== 'stopped')` y a `useSpaceToggle`, con un `toggle` estable que lee el store (`play` si está detenida, `stop` si no; `play` ya respeta `canPlay`);
    - un componente `QuickTempo` en el pie, junto a Play: dos `Button` con ícono (`Minus` y `Plus`) y `aria-label` `Bajar 5 BPM` y `Subir 5 BPM`, que llaman a `setBpm(bpm ∓ 5)`. No tiene campo editable.

  `pnpm test` y `pnpm test:e2e` **en verde**. **Commit**: `feat: pantalla encendida, barra espaciadora y tempo rápido (#24)`.

- [ ] T035 [US5] Verificación manual: quickstart §2, filas 11–13, con `pnpm dev`. Pedirle al usuario la prueba en el iPhone (quickstart §3.1–3.2). Si la pantalla se apaga, registrar el plan B en research.md §10 antes de implementarlo.

**Checkpoint**: US1–US5 en verde.

---

## Phase 8: User Story 6 · Recordar los ajustes en el dispositivo (P6, #25)

**Goal**: al reabrir la app, los ajustes son los de la última vez. Lo guardado se valida con zod campo por campo: un campo inválido vuelve a su valor por defecto y los demás se conservan.

**Independent Test**: `pnpm test` y `pnpm test:e2e` en verde; con `pnpm dev`, quickstart §2, filas 14–15.

- [ ] T036 [US6] `pnpm add -E zod@4.6.7`. Comprobar en `package.json` que la versión no tiene `^` ni `~`.
- [ ] T037 [P] [US6] Preparar y escribir los tests:
  - `src/test/setup.ts` suma `afterEach(() => localStorage.clear())`, importando `afterEach` de `vitest`;
  - `renderApp` (`src/test/app.tsx`) también devuelve `unmount`, del resultado de `render`;
  - escribir `src/saved-settings.test.tsx`, con `const KEY = 'countdown-notes:ajustes'`. Tests:
    - `'los ajustes se recuerdan al volver a abrir la app'`:
      - cambiar BPM a 90, compases por nota a 3, `Excluir alteradas`, compás `6/8`, figura `Negras`, octava `3`, `{ArrowLeft}` en `Volumen del bajo` (79), `Silenciar metrónomo`, y `Parar tras N vueltas` con 5;
      - `unmount()` y `renderApp()` de nuevo;
      - en el panel, cada ajuste tiene el valor cambiado.
    - `'la app abre detenida aunque se haya cerrado sonando'`: Play, `fake.beat(5)`, `unmount()`, `renderApp()` → se ve `Play` y `Toca Play para empezar.`
    - `'con datos dañados abre con los valores por defecto'`: `localStorage.setItem(KEY, '{roto')` antes de `renderApp()` → BPM `60`, compás `4/4` y las 12 notas incluidas.
    - `'un ajuste inválido vuelve a su valor por defecto y los demás se conservan'`: `setItem(KEY, JSON.stringify({ version: 1, settings: { bpm: 500, meter: '6/8' } }))` → BPM `60` y compás `6/8`.
    - `'los datos de otra versión se descartan'`: `{ version: 2, settings: { bpm: 90 } }` → BPM `60`.
    - `'sin almacenamiento, la app funciona igual'`: `vi.spyOn(Storage.prototype, 'getItem')` y `'setItem'` lanzan un error; `renderApp()`, BPM a 90 en el panel, `Cerrar` y Play → `fake.running` es `true` y `fake.bpm` es 90. Al final, `vi.restoreAllMocks()`.

  Correr `pnpm test --project ui` y **verlo fallar**.

- [ ] T038 [P] [US6] En `e2e/practice.spec.ts`, agregar `'los ajustes siguen después de recargar'`: BPM 90 y compás `6/8` desde el panel, `page.reload()` → se ve `Aleatorio · Analógico cálido · 90 BPM · 6/8`. Correr `pnpm test:e2e` y **verlo fallar**.
- [ ] T039 [US6] Implementar (data-model.md, "Ajustes" y "Guardado"; research.md §9):
  - **`src/practice/settings.ts`**:
    - `SETTINGS_KEY = 'countdown-notes:ajustes'`;
    - `DEFAULT_SETTINGS` con los valores de data-model.md y el tipo `Settings`;
    - `settingsSchema`: un `z.object` donde **cada campo** lleva `.catch(valor por defecto)`, y el objeto entero también:
      - `bpm`: `z.number().int().min(30).max(240)`;
      - `barsPerNote`: entero 1–16;
      - `notes`: `z.array(z.enum(ids))`, con un `transform` que deja únicas y en orden cromático (`NOTES.filter`);
      - `meter`: `z.enum` de los 8;
      - `bassFigure`: `z.enum` de las 4;
      - `bassOctave`: `z.union([z.literal(1), z.literal(2), z.literal(3)])`;
      - `mix`: `click` y `bass`, cada uno `z.object({ volume: entero 0–100, muted: z.boolean() })` con `.catch` por campo y por canal;
      - `repeats`: `{ on: z.boolean(), count: entero 1–999 }`, con `.catch` por campo;
    - `loadSettings()`: en `try`, lee la clave, la parsea con `JSON.parse` y, si `version === 1`, devuelve `settingsSchema.parse(data.settings)`. En cualquier otro caso, o si algo lanza un error, devuelve `DEFAULT_SETTINGS`;
    - `saveSettings(settings)`: `localStorage.setItem(SETTINGS_KEY, JSON.stringify({ version: 1, settings }))` dentro de `try`, ignorando el error.
  - **`store.ts`**:
    - el estado inicial usa `...loadSettings()` en lugar de los valores fijos;
    - después de crear el store, `store.subscribe((state, prev) => { … })` guarda con `saveSettings` cuando la selección de las claves de `DEFAULT_SETTINGS` cambia, comparando con `shallow` de `zustand/shallow`.

  `pnpm test` y `pnpm test:e2e` **en verde**. **Commit**: `feat: ajustes recordados en el dispositivo, validados con zod (#25)`.

- [ ] T040 [US6] Verificación manual: quickstart §2, filas 14–15, con `pnpm dev`, y §3.4 en el iPhone.

**Checkpoint**: las 6 historias en verde.

---

## Phase 9: Polish & cierre

- [ ] T041 Pulido visual con el skill `frontend-design`, dentro de la dirección del diseño (§7.4):
  - el panel ordenado por secciones (Tiempo: BPM, compás y compases por nota; Bajo; Volumen; Notas; Repeticiones), con controles grandes y fáciles de tocar;
  - el tempo rápido en el pie, sin recargar la pantalla de práctica;
  - las marcas por grupo del carril, legibles a 1–2 m en 12/8.

  Ningún test se modifica. **Verde completo**. **Commit**: `feat: pulido visual del panel y del tempo rápido (#3)`.

- [ ] T042 Correr quickstart §1 completo. Si algún hallazgo cambió una decisión, actualizar research.md. Sin commit si no hay cambios.
- [ ] T043 El usuario hace quickstart §2–§5: la prueba de oído en cada compás, la pantalla encendida en el iPhone y la sesión con la guitarra. Si todo está bien, cierra #20–#25 y #3.

---

## Dependencies & Execution Order

- **Setup (T001)** → **Foundational (T002–T006)** → historias.
- **Historias**: en el orden del spec, US1 → US6. Cada una se puede probar sola, pero comparten `store.ts`, `settings-panel.tsx`, `engine.ts` y `tone-engine.ts`, así que van en secuencia:
  - US2 usa `meters.ts` de US1 (`groupStarts`);
  - US6 guarda los ajustes de todas las anteriores, así que va al final.
- **Dentro de cada historia**: preparación → test de UI que falla → implementación → verde y commit → test de audio que falla → motor → verde y commit → verificación manual.
- **Polish (T041–T043)**: después de US6.

### Parallel Opportunities

- T007 (`toggle-group`) con T008; T009 (`meters.ts`) con T008, porque son otros archivos.
- T021 (`slider` y `setup.ts`) antes de T022, en paralelo con el cierre de US2.
- T027 (`switch`) con T028.
- T032 (test de UI) y T033 (E2E).
- T037 (tests de UI) y T038 (E2E).

### Parallel Example: User Story 1

```text
T007 Agregar toggle-group de shadcn             (src/components/ui/toggle-group.tsx)
T008 Escribir src/meters.test.tsx               (test, debe fallar)
T009 Crear src/music/meters.ts                  (tabla de compases)
```

## Implementation Strategy

- **MVP**: Foundational + US1. Con eso ya se practica en cualquier compás, que es lo que más amplía la práctica.
- **Incremental**: cada historia termina en verde, con commit y verificación manual, antes de pasar a la siguiente. Se puede parar después de cualquier checkpoint con la app funcionando.
- **Riesgos registrados**:
  - Pantalla encendida en Safari del iPhone: solo se verifica a mano (T035). El plan B está en research.md §10.
  - Barra espaciadora en el navegador real: la cubre el E2E de T033.
  - El hueco del compás frente al medio compás es de la entrega 4 (research.md §9). Registrarlo en GitHub está pendiente de la decisión del usuario.
