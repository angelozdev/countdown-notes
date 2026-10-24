---
description: 'Lista de tareas de la Entrega 1 · "Ya me sirve"'
---

# Tasks: "Ya me sirve" (Entrega 1)

**Input**: Documentos de diseño en `specs/002-ya-me-sirve/`: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/interfaces.md](./contracts/interfaces.md) y [quickstart.md](./quickstart.md).

**Tests**: se incluyen, porque la constitución exige test-first (principio I). Cada test se escribe primero y se ve fallar antes de implementar.

**Organización**: una fase por historia (sub-issue), en el orden del spec. Cada historia termina en una conducta que se prueba con la app abierta.

**Reglas que aplican a todas las tareas**:

- **Git**:
  - Todo en la rama `002-ya-me-sirve`; nunca en `main` y nunca push.
  - Commit después de cada paso en verde, con el número de issue en el mensaje (por ejemplo, `#15`) y la línea de atribución de la sesión.
- **Dependencias**: toda dependencia se instala con versión exacta (`pnpm add -E`, más `saveExact: true`), con las versiones de research.md §1. Si una falla al instalar, se consulta al usuario; no se cambia por un rango.
- **Tests**:
  - Nunca se debilita, salta ni borra un test para que pase. Si un test parece incorrecto, se consulta al usuario. Los tests de la pantalla base se reemplazan en US1 porque el usuario lo aprobó (research.md §11).
  - Los tests de UI montan `<App engine={fake.engine} />` y buscan por rol y nombre accesible ([contracts](./contracts/interfaces.md) §4), nunca por clases ni por estructura.
  - Usan `userEvent.setup()` y, para avanzar la música, `fake.beat(n)`.
  - Cada test tiene al menos un `expect`, porque `vitest/expect-expect` solo acepta `expect` y `screen.getBy*` como aserción.
- **Código**:
  - Formato de oxfmt: comillas simples, sin punto y coma, sin coma final, indentación de 2 espacios.
  - Los archivos que genera shadcn se pasan por `pnpm format`.
  - Nunca se usa `setTimeout` ni `setInterval` para el tiempo musical (constitución III).
  - Solo `src/main.tsx` y `src/audio/tone-engine.ts` importan `tone`. Los tests de precisión (`*.browser.test.ts`) también lo importan, porque prueban el motor real.
- **Verde** significa que pasan `pnpm lint`, `pnpm format:check`, `pnpm test` y `pnpm build`, más `pnpm test:e2e` desde T009.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: se puede hacer en paralelo (otro archivo, sin depender de tareas pendientes).
- **[Story]**: la historia del spec (US1–US5). Entre paréntesis va su issue.

---

## Phase 1: Setup

**Purpose**: comprobar que la rama parte en verde. Las dependencias nuevas entran en la historia que las usa (plan, Constitution Check II).

- [ ] T001 En la rama `002-ya-me-sirve`, correr `pnpm install`, `pnpm lint`, `pnpm format:check`, `pnpm test`, `pnpm test:e2e` y `pnpm build`: los 6 en verde. Sin commit.

## Phase 2: Foundational

No hay fase fundacional. El contrato del motor, el motor falso y el store nacen en US1, la porción más delgada, y las demás historias los extienden.

---

## Phase 3: User Story 1 · Play/Stop con metrónomo en 4/4 y cuenta de entrada (P1, #15) 🎯 MVP

**Goal**: tocar Play desbloquea el audio y arranca el metrónomo en 4/4 a 60 BPM, con una cuenta de entrada de 1 compás y acento en el tiempo 1. Stop lo calla.

**Independent Test**: `pnpm test` (proyectos `ui` y `audio`) y `pnpm test:e2e` en verde; con `pnpm dev`, se oye el metrónomo con acento y Stop lo calla (quickstart §2, filas 1–2).

### Preparación de la historia

- [x] T002 [US1] Instalar y configurar (research.md §1 y §4):
  - `pnpm add -E tone@15.1.22 zustand@5.0.16`;
  - `pnpm add -D -E @vitest/browser-playwright@5.0.5 playwright@1.64.1`;
  - `pnpm dlx shadcn@4.22.1 add button`, que crea `src/components/ui/button.tsx`; después `pnpm format`;
  - comprobar en `package.json` que ninguna versión tiene `^` ni `~`.

  En `vite.config.ts`, reemplazar el bloque `test` por dos proyectos. Importar `playwright` de `@vitest/browser-playwright`. El comentario de `globals` se mantiene.

  ```ts
  test: {
    projects: [
      {
        extends: true,
        test: {
          name: 'ui',
          environment: 'jsdom',
          // globals solo para que Testing Library registre su limpieza con afterEach
          globals: true,
          include: ['src/**/*.test.{ts,tsx}'],
          exclude: ['src/**/*.browser.test.ts']
        }
      },
      {
        extends: true,
        test: {
          name: 'audio',
          include: ['src/**/*.browser.test.ts'],
          browser: {
            enabled: true,
            headless: true,
            provider: playwright(),
            instances: [{ browser: 'chromium' }, { browser: 'webkit' }]
          }
        }
      }
    ]
  }
  ```

  Correr `pnpm test --project ui`: debe seguir en verde.

- [x] T003 [US1] Crear `src/audio/engine.ts` con los tipos `Sound`, `EngineStart` y `Engine`, copiados tal cual de [contracts](./contracts/interfaces.md) §2, comentarios incluidos. Solo tipos, sin código.

### Motor real (test de precisión primero)

- [x] T004 [US1] Escribir `src/audio/tone-engine.browser.test.ts` (research.md §4). Importa `* as Tone from 'tone'`, `test` y `expect` de `vitest`, y `createToneEngine` de `./tone-engine`. Tiene dos helpers dentro del archivo:
  - `renderPractice(bpm, soundsAt, seconds, during?)` devuelve `Tone.Offline(async (context) => { … }, seconds)`. Adentro:
    - pone `context.lookAhead = 0.1` (sin esto, los eventos se cuantizan a bloques de 128 muestras);
    - crea `const engine = createToneEngine()`;
    - hace `await engine.start({ bpm, beatsPerBar: 4, soundsAt, onBeat: () => {} })`;
    - llama a `during?.(engine, context)`.
  - `onsets(buffer, threshold, minGap)` recorre `buffer.getChannelData(0)` y devuelve `{ time, peak }[]`. Un inicio es la primera muestra con `|x| > threshold` después de al menos `minGap` segundos sin superar el umbral. `peak` es el máximo de `|x|` en los 30 ms siguientes.

  Tests (clicks con `threshold = 1e-3` y `minGap = 0.1`):
  - `test.each([30, 60, 200, 240])('a %i BPM, cada golpe cae en su tiempo')`:
    - `soundsAt = (_bar, beat) => [{ kind: 'click', accent: beat === 0 }]`, `beat = 60 / bpm` y `seconds = 7.5 * beat`;
    - espera exactamente 8 inicios, con `inicios[0].time < 0.12`;
    - para cada k, `|inicios[k].time − (inicios[0].time + k * beat)| < 0.001`.
  - `'el tiempo 1 suena más fuerte que los demás'`: a 120 BPM, `seconds = 3.75` (8 golpes). El `peak` de los inicios 0 y 4 es mayor que 1.5 veces el de los inicios 1, 2, 3, 5, 6 y 7.
  - `'stop calla todo de inmediato'`:
    - a 60 BPM, 4 s, con `during = (engine, context) => context.setTimeout(() => engine.stop(), 1.5)`;
    - espera exactamente 2 inicios;
    - ninguna muestra después de 1.6 s supera 1e-3.
  - `'un cambio de BPM no duplica ni salta golpes'`:
    - a 60 BPM, 10 s, con `during = (engine, context) => context.setTimeout(() => engine.setBpm(120), 3.5)`;
    - los 3 primeros intervalos entre inicios miden 1 s (± 1 ms) y los 4 últimos 0.5 s (± 1 ms);
    - ningún intervalo es menor a 0.499 ni mayor a 1.001.

  Correr `pnpm test --project audio` y **verlo fallar**, porque `./tone-engine` no existe.

- [x] T005 [US1] Crear `src/audio/tone-engine.ts` con `export function createToneEngine(): Engine` (research.md §3, §5 y §6). Por ahora solo maneja `kind: 'click'`; el bajo llega en T021.
  - **`start(options)`**:
    1. Antes de cualquier `await`, poner `audioSession.type = 'playback'` si existe. Con un tipo mínimo local: `type AudioSessionNavigator = Navigator & { audioSession?: { type: string } }`, y `const { audioSession } = navigator as AudioSessionNavigator; if (audioSession) audioSession.type = 'playback'`.
    2. `await Tone.start()`.
    3. Crear el metrónomo: `new Tone.Synth({ oscillator: { type: 'sine' }, envelope: { attack: 0.001, decay: 0.06, sustain: 0, release: 0.01 } })` conectado a un bus `new Tone.Volume(-8).toDestination()`. Guardar los nodos creados para descartarlos en `stop`.
    4. `const transport = Tone.getTransport()`; `transport.cancel()`, `transport.bpm.value = options.bpm` y `transport.timeSignature = options.beatsPerBar`.
    5. Llevar un contador `k = 0` y programar `transport.scheduleRepeat((time) => { … }, '4n', 0)`. Adentro:
       - `bar = Math.floor(k / beatsPerBar)`, `beat = k % beatsPerBar` y `k++`;
       - por cada sonido de `soundsAt(bar, beat)`, si es un click, `click.triggerAttackRelease(accent ? 1760 : 1175, 0.05, time, accent ? 1 : 0.55)`;
       - `Tone.getDraw().schedule(() => onBeat(bar, beat), time)`.
    6. `transport.start()`.
  - **`stop()`**: `transport.stop()`, `transport.cancel()`, `Tone.getDraw().cancel()` y `dispose()` de cada nodo creado en `start`. Así se cortan también los sonidos ya programados dentro de la anticipación.
  - **`setBpm(bpm)`**: `Tone.getTransport().bpm.value = bpm`.

  Correr `pnpm test --project audio`: debe quedar **en verde en Chromium y WebKit**. Si `context.lookAhead` no tipa dentro de `Offline`, usar `Tone.getContext().lookAhead = 0.1`. **Commit**: `feat: motor de audio con metrónomo preciso (#15)`.

  **Hecho, con 3 ajustes que salieron del test** (research.md §3): el tempo inicial va con `setValueAtTime` en el mismo instante del arranque; el motor guarda su contexto para `stop` y `setBpm`; y `stop` silencia los buses en `now − lookAhead` en lugar de hacer `dispose()`.

### Pantalla: Play/Stop (tests primero)

- [x] T006 [P] [US1] Crear `src/test/fake-engine.ts` según [contracts](./contracts/interfaces.md) §2:
  - `export function createFakeEngine()` devuelve `{ engine, beat, played, bpm, running }`;
  - `engine` es un objeto que satisface `Engine` (`satisfies Engine`):
    - `start` guarda las opciones, reinicia el contador de tiempos y fija `bpm`;
    - `stop` borra las opciones;
    - `setBpm` actualiza `bpm`;
  - `running` y `bpm` son getters;
  - `beat(n = 1)`: dentro de `act` (de `@testing-library/react`), y mientras haya opciones, para cada uno de los n tiempos:
    - calcula `bar` y `beat` con `beatsPerBar`;
    - agrega a `played` cada sonido de `soundsAt(bar, beat)` como `{ bar, beat, sound }`;
    - llama a `onBeat(bar, beat)`.
- [x] T007 [US1] Reescribir `src/App.test.tsx` (reemplaza el test de la pantalla base; research.md §11). Cada test crea `const fake = createFakeEngine()` y hace `render(<App engine={fake.engine} />)`. Tests:
  - `'tiene el título de la app para lectores de pantalla'`: `screen.getByRole('heading', { level: 1, name: 'Countdown Notes' })`.
  - `'Play arranca el metrónomo en 4/4 a 60 BPM con la cuenta de entrada'`:
    - clic en `Play`; `expect(fake.running).toBe(true)` y `expect(fake.bpm).toBe(60)`;
    - `fake.beat(8)`;
    - los clicks de `fake.played` (filtrar `sound.kind === 'click'` y mapear a `{ bar, beat, accent }`) son, en orden, `{ bar: 0, beat: 0, accent: true }`, tres con `accent: false` (tiempos 1–3), y lo mismo en el compás 1.
  - `'Stop detiene el motor y vuelve a ofrecer Play'`: Play, `fake.beat(2)`, clic en `Stop` → `fake.running` es `false` y existe el botón `Play`.
  - `'Play después de Stop empieza de nuevo con la cuenta de entrada'`: Play, `fake.beat(6)`, Stop, Play, `fake.beat(1)` → el último elemento de `fake.played` es `{ bar: 0, beat: 0, sound: { kind: 'click', accent: true } }`.

  Correr `pnpm test --project ui` y **verlo fallar**.

- [x] T008 [P] [US1] Reemplazar el E2E: `git mv e2e/base-screen.spec.ts e2e/practice.spec.ts` y reescribirlo con 3 tests:
  - `'abre la pantalla de práctica'`:
    - `page.goto('/')`;
    - el `heading` nivel 1 `Countdown Notes` cumple `toBeAttached()` (está oculto a la vista);
    - el `button` `Play` cumple `toBeVisible()`;
    - `html` tiene `lang="es"`;
    - no hay desplazamiento horizontal (el mismo `page.evaluate` de hoy).
  - `'se ve en oscuro con acento ámbar aunque el sistema esté en claro'`:
    - `page.emulateMedia({ colorScheme: 'light' })`;
    - `body` con `background-color` `rgb(10, 10, 10)`;
    - el `button` `Play` con `background-color` `rgb(245, 165, 36)`.
  - `'Play cambia a Stop y Stop vuelve a Play'`: con el motor real.

  Correr `pnpm test:e2e` y **verlo fallar**.

### Implementación de la pantalla

- [x] T009 [US1] Implementar (data-model.md, "Práctica"):
  - **`src/practice/store.ts`**:
    - `createPracticeStore(engine: Engine)` con `createStore` de `zustand/vanilla`;
    - estado: `status: 'stopped' | 'countIn' | 'playing'` (inicial `'stopped'`) y `position: { bar: number; beat: number } | null` (inicial `null`);
    - **`play()`**: solo si `status === 'stopped'`. Pone `status: 'countIn'` y `position: null`. Llama a `engine.start({ bpm: 60, beatsPerBar: 4, soundsAt, onBeat })`, y si la promesa falla, ejecuta `stop()`;
    - `soundsAt(_bar, beat)` devuelve `[{ kind: 'click', accent: beat === 0 }]`;
    - `onBeat(bar, beat)` fija `position: { bar, beat }` y `status: bar === 0 ? 'countIn' : 'playing'`;
    - **`stop()`**: `engine.stop()`, `status: 'stopped'` y `position: null`;
    - también exporta `PracticeContext = createContext<PracticeStore | null>(null)` y `usePractice(selector)`, que lee el store del contexto (y lanza un error si no hay) y devuelve `useStore(store, selector)`.
  - **`src/App.tsx`**:
    - `export default function App({ engine }: { engine: Engine })`;
    - crea el store una vez (`const [store] = useState(() => createPracticeStore(engine))`) y lo entrega con `<PracticeContext value={store}>`;
    - renderiza un `<main>` a pantalla completa (`min-h-dvh`, columna) con `<h1 className="sr-only">Countdown Notes</h1>` y, abajo y al centro, un `Button` grande (`size="lg"`, alto ≥ 64 px, `rounded-full`, texto `text-xl font-bold`);
    - el botón tiene un ícono de lucide (`Play` o `Square`, con `aria-hidden`) y el texto `Play` o `Stop` según el estado, y llama a `play` o `stop`.
  - **`src/main.tsx`**: `<App engine={createToneEngine()} />`.
  - **Borrar** `src/components/ui/badge.tsx`, que ya no se usa.

  `pnpm test`, `pnpm test:e2e` y `pnpm build` deben quedar **en verde**. Si el audio en tiempo real falla en WebKit sin interfaz, registrarlo en research.md §12 y consultar al usuario antes de tocar el E2E de `iphone`. **Commit**: `feat: Play/Stop con metrónomo en 4/4 y cuenta de entrada (#15)`.

- [ ] T010 [US1] Verificación manual (quickstart §2, filas 1–2): en `pnpm dev`, el metrónomo suena con acento y Stop lo calla. Pedirle al usuario que lo pruebe en el iPhone con el interruptor de silencio activado (quickstart §3.1). Si no suena, aplicar el plan B de research.md §5, registrándolo antes en research.md.

**Checkpoint**: US1 completa. La app ya suena: es el MVP técnico de la entrega.

---

## Phase 4: User Story 2 · Ajustar el BPM desde el panel de ajustes (P2, #16)

**Goal**: un panel de ajustes que sube desde abajo permite elegir el BPM (30–240, por defecto 60), también mientras suena. Arriba, en pequeño, se ve el tempo.

**Independent Test**: `pnpm test` en verde; con `pnpm dev`, quickstart §2, filas 3–5.

- [x] T011 [US2] Correr `pnpm dlx shadcn@4.22.1 add sheet`, que crea `src/components/ui/sheet.tsx`, y después `pnpm format`. En `sheet.tsx`, cambiar el texto oculto del botón de cierre de `Close` a `Cerrar`.
- [x] T012 [US2] Escribir `src/bpm.test.tsx`. Cada test monta `<App engine={fake.engine} />`; para abrir el panel, clic en `Ajustes` y `within(screen.getByRole('dialog', { name: 'Ajustes' }))`. Tests:
  - `'la pantalla de práctica muestra el tempo arriba y no tiene controles de ajuste'`:
    - `screen.getByText('Aleatorio · Analógico cálido · 60 BPM · 4/4')`;
    - `queryAllByRole('spinbutton')`, `queryAllByRole('slider')` y `queryAllByRole('textbox')` tienen largo 0;
    - existe el botón `Ajustes`.
  - `'el BPM empieza en 60 y se limita a 30–240'`:
    - el `spinbutton` `BPM` tiene `value` `'60'`;
    - `user.clear` + `user.type('300{Enter}')` → `'240'`;
    - `'10{Enter}'` → `'30'`;
    - vacío + `'{Enter}'` → vuelve a `'30'` (el valor anterior).
  - `'− y + cambian el BPM de a uno'`: `Subir BPM` → `'61'`; dos veces `Bajar BPM` → `'59'`.
  - `'Play usa el BPM elegido'`: BPM `'90{Enter}'`, clic en `Cerrar`, Play → `fake.bpm` es 90.
  - `'con la música sonando, el BPM cambia de inmediato sin detenerla'`:
    - Play, `fake.beat(2)`, abrir el panel, BPM `'120{Enter}'`;
    - `fake.bpm` es 120 y `fake.running` es `true`;
    - clic en `Cerrar`: `fake.running` sigue `true`;
    - se ve `Aleatorio · Analógico cálido · 120 BPM · 4/4`.

  Correr `pnpm test --project ui` y **verlo fallar**.

- [x] T013 [P] [US2] Crear `src/components/stepper.tsx`:
  - props: `{ label, min, max, value, onChange, decreaseLabel, increaseLabel }`;
  - renderiza un `<label>` visible con `label`, un `Button` − (con `aria-label={decreaseLabel}`), un `<input type="number" inputMode="numeric">` con `min`, `max` y `aria-label={label}`, y un `Button` + (con `aria-label={increaseLabel}`);
  - el input edita un borrador local. Al confirmar (Enter o `blur`), hace `Number.parseInt`: si no es número, el borrador vuelve a `value`; si lo es, se llama a `onChange` con el valor limitado a `[min, max]`;
  - − y + llaman a `onChange(value ∓ 1)` limitado, y se deshabilitan en los extremos;
  - el borrador se sincroniza cuando cambia `value`;
  - botones grandes (≥ 48 px).
- [x] T014 [US2] Implementar:
  - **`store.ts`**:
    - `bpm: 60`;
    - `setBpm(n)`: entero, se limita a 30–240 (FR-010), y si `status !== 'stopped'` llama a `engine.setBpm`;
    - `play` arranca el motor con `bpm` del estado.
  - **`src/components/settings-panel.tsx`**:
    - `Sheet` con disparador `Button` `Ajustes` (ícono `Settings` de lucide) y `SheetContent side="bottom"` con clases `mx-auto w-full max-w-lg max-h-[85dvh] overflow-y-auto`;
    - `SheetTitle` `Ajustes` y una `SheetDescription` breve (Radix la pide);
    - adentro, el `Stepper` del BPM (`label="BPM"`, `decreaseLabel="Bajar BPM"`, `increaseLabel="Subir BPM"`, de 30 a 240).
  - **`App.tsx`**:
    - arriba, la línea de estado `Aleatorio · Analógico cálido · {bpm} BPM · 4/4`, en pequeño y atenuada;
    - abajo, el panel a un lado del Play.

  `pnpm test` debe quedar **en verde**. Comprobar quickstart §2, filas 3–5, con `pnpm dev`. **Commit**: `feat: BPM en el panel de ajustes (#16)`.

**Checkpoint**: US1 y US2 en verde.

---

## Phase 5: User Story 3 · Modo aleatorio: bajo en la raíz de una nota sorteada (P3, #17)

**Goal**: tras la cuenta de entrada, el bajo toca la raíz de la nota actual en el tiempo 1 de cada compás, en octava 2. La nota cambia cada N compases (1–16, por defecto 2), sin repetir hasta completar la vuelta y nunca dos veces seguidas. "Ahora" muestra la nota y su nombre en español.

**Independent Test**: `pnpm test` en verde; con `pnpm dev`, quickstart §2, filas 6–8.

### Sorteo (test primero)

- [x] T015 [P] [US3] Escribir `src/practice/round.test.ts`, que importa `drawRound` de `./round`. Tests:
  - `'cada vuelta tiene cada nota del pool exactamente una vez, con cualquier pool de 2 a 12 notas'`:
    - para cada tamaño de 2 a 12, toma las primeras n notas de `['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B']`;
    - encadena 100 vueltas, cada una con `avoidFirst` = la última nota de la anterior;
    - cada vuelta, ordenada, es igual al pool ordenado.
  - `'en 1.000 vueltas seguidas, la primera nunca repite la última de la anterior'`: con las 12 notas, `next[0] !== prev.at(-1)` en las 1.000.
  - `'con 2 notas, las vueltas alternan sin repetir'`: 100 vueltas de `['C', 'Db']`, aplanadas: ningún par de notas consecutivas es igual.

  Correr `pnpm test --project ui` y **verlo fallar**.

- [x] T016 [P] [US3] Crear `src/music/notes.ts`:
  - exporta `type NoteId = 'C' | 'Db' | 'D' | 'Eb' | 'E' | 'F' | 'Gb' | 'G' | 'Ab' | 'A' | 'Bb' | 'B'`;
  - exporta `NOTES: { id: NoteId; label: string; name: string; natural: boolean }[]`, con la tabla exacta de data-model.md "Nota", en orden cromático. El `id` de F♯ es `'Gb'` y su `label` es `'F♯'`. Las grafías de las negras son D♭, E♭, F♯, A♭ y B♭, con los caracteres ♭ y ♯.

- [x] T017 [US3] Crear `src/practice/round.ts` con `export function drawRound(pool: NoteId[], avoidFirst?: NoteId): NoteId[]` (research.md §7):
  - copia el pool y lo mezcla con Fisher–Yates usando `Math.random`;
  - si `avoidFirst` está definido y la primera nota es igual, la intercambia con la de una posición al azar entre 1 y `length − 1`.

  `NoteId` sale de `src/music/notes.ts` (T016). `pnpm test` debe quedar **en verde**. **Commit**: `feat: sorteo de la vuelta sin repetir notas (#17)`.

### Bajo y "Ahora" (test primero)

- [x] T018 [US3] Escribir `src/random-mode.test.tsx`. El archivo define su propia tabla de lo que exige FR-025, `{ C: ['C', 'Do'], Db: ['D♭', 'Re bemol'], …, B: ['B', 'Si'] }`, sin importar `NOTES`. También define un helper `bassByBar(fake)`, que devuelve un `Map` del compás al `pitch` de los sonidos `bass`. Tests:
  - `'el bajo no suena en la cuenta y toca la raíz en el tiempo 1 de cada compás'`:
    - Play y `fake.beat(4 + 4 * 4)`;
    - ningún `bass` en el compás 0 ni en los tiempos 1–3;
    - un `bass` en el tiempo 0 de los compases 1 a 4, cada uno con un `pitch` que cumple `/^(C|Db|D|Eb|E|F|Gb|G|Ab|A|Bb|B)2$/`.
  - `'la nota cambia cada 2 compases, en el tiempo 1'`: los compases 1 y 2 tienen el mismo `pitch`, los 3 y 4 también, y el del 3 es distinto del del 1.
  - `'cada vuelta tiene las 12 notas una vez y nunca suena la misma dos veces seguidas'`:
    - Play y `fake.beat(4 + 3 * 24 * 4)`;
    - toma el `pitch` de los compases impares 1, 3, …, 71 (36 notas);
    - cada bloque de 12 tiene 12 notas distintas, y no hay dos notas consecutivas iguales, ni entre bloques.
  - `'"Ahora" muestra la nota con su nombre en español'`:
    - Play y `fake.beat(5)`;
    - con el `pitch` del compás 1 (sin el `2`), busca en la tabla `[label, name]`;
    - `within(screen.getByRole('region', { name: 'Ahora' }))` contiene `label` y `name`.
  - `'compases por nota empieza en 2 y se limita a 1–16'`: en el panel, el `spinbutton` `Compases por nota` tiene `'2'`; `'20{Enter}'` → `'16'`; `'0{Enter}'` → `'1'`.
  - `'cambiar compases por nota mientras suena aplica desde la siguiente vuelta'`:
    - Play y `fake.beat(4)`; en el panel, `'1{Enter}'`; `Cerrar`;
    - `fake.beat(36 * 4)`;
    - en los compases 1–24, el `pitch` cambia cada 2 compases;
    - en los compases 25–36, cambia en cada compás y hay 12 notas distintas.

  Correr `pnpm test --project ui` y **verlo fallar**.

- [x] T019 [US3] Implementar (data-model.md, "Ajustes", "Vuelta" y "Sonido"):
  - **`store.ts`**:
    - `barsPerNote: 2`, `setBarsPerNote(n)` (entero, se limita a 1–16, FR-017), `notes: NoteId[]` con las 12 y `rounds: Round[]`, con `Round = { number, notes, barsPerNote, firstBar }`;
    - **`play()`**: además, pone `rounds: [{ number: 1, notes: drawRound(notes), barsPerNote, firstBar: 1 }]`;
    - **`soundsAt(bar, beat)`**:
      - siempre devuelve el click (con acento en `beat === 0`);
      - si `bar ≥ 1` y `beat === 0`, agrega `{ kind: 'bass', pitch: `${nota}2` }`, donde la nota sale de la vuelta que contiene `bar`: `notes[⌊(bar − firstBar) / barsPerNote⌋]`;
      - si ese compás es el primero de la última nota y es la última vuelta de `rounds`, sortea la siguiente (FR-033): `number + 1`, `drawRound(pool, última nota)`, el `barsPerNote` actual y `firstBar` = `firstBar + notes.length × barsPerNote`;
      - el pool son las `notes` de los ajustes si tienen 2 o más; si no, las de la vuelta anterior;
    - **`onBeat`**: además, descarta las vueltas con `firstBar + largo ≤ bar`;
    - **`stop()`**: además, vacía `rounds`.
  - **`src/components/now.tsx`**:
    - `<section aria-label="Ahora">`;
    - con `status === 'playing'`, muestra `label` de la nota actual en tipografía enorme y de peso 900 (por ejemplo, `text-[min(32vw,38dvh)] font-black leading-none`), y `name` debajo, grande;
    - detenida, muestra `Toca Play para empezar.`;
    - la cuenta de entrada llega en T027.
  - **`settings-panel.tsx`**: agregar el `Stepper` de compases por nota (`label="Compases por nota"`, `decreaseLabel="Bajar compases por nota"`, `increaseLabel="Subir compases por nota"`, de 1 a 16), con el texto `Se aplica desde la siguiente vuelta.`
  - **`App.tsx`**: "Ahora" ocupa el centro de la pantalla.

  `pnpm test` debe quedar **en verde**. **Commit**: `feat: modo aleatorio con la nota en "Ahora" (#17)`.

### Bajo real (test de precisión primero)

- [ ] T020 [US3] En `src/audio/tone-engine.browser.test.ts`, agregar `'el bajo ataca en el tiempo 1 de su compás'`:
  - a 60 BPM, 14 s;
  - `soundsAt = (bar, beat) => [bar === 0 && beat === 0 ? [{ kind: 'click', accent: true }] : [], beat === 0 && bar % 2 === 1 ? [{ kind: 'bass', pitch: 'Bb2' }] : []].flat()`;
  - `onsets` con `threshold = 1e-5` y `minGap = 1` (research.md §4);
  - espera 3 inicios: el click en t₀ y el bajo en t₀ + 4 s y t₀ + 12 s, cada uno a menos de 1 ms.

  Correr `pnpm test --project audio` y **verlo fallar**, porque el motor todavía ignora el bajo.

- [ ] T021 [US3] En `tone-engine.ts`:
  - en `start`, crear el bajo Analógico cálido del Anexo A, `new Tone.MonoSynth({ oscillator: { type: 'sawtooth' }, filter: { type: 'lowpass', Q: 3, rolloff: -24 }, envelope: { attack: 0.005, decay: 0.2, sustain: 0.8, release: 0.3 }, filterEnvelope: { attack: 0.005, decay: 0.3, sustain: 0.3, release: 0.3, baseFrequency: 120, octaves: 3.2 }, volume: -4 })`, conectado a un bus `new Tone.Volume(0).toDestination()`, y guardarlo con los demás nodos;
  - en el callback, para `kind: 'bass'`, `bass.triggerAttackRelease(sound.pitch, transport.toSeconds('1m') * 0.9, time)`.

  `pnpm test` debe quedar **en verde en los dos proyectos**. Escuchar con `pnpm dev` (quickstart §2, filas 6–8). **Commit**: `feat: bajo Analógico cálido en la raíz (#17)`.

**Checkpoint**: US1–US3 en verde. La app ya cumple "modo aleatorio + bajo + metrónomo + BPM", sin el carril.

---

## Phase 6: User Story 4 · Filtros de notas (P4, #18)

**Goal**: en ajustes se elige qué notas entran al sorteo, una por una o con 4 atajos. Con menos de 2 notas no se puede dar Play, y la app explica por qué. Los cambios aplican desde la siguiente vuelta.

**Independent Test**: `pnpm test` en verde; con `pnpm dev`, quickstart §2, filas 9–10.

- [ ] T022 [US4] Correr `pnpm dlx shadcn@4.22.1 add toggle`, que crea `src/components/ui/toggle.tsx`, y después `pnpm format`.
- [ ] T023 [US4] Escribir `src/note-filters.test.tsx`. Para abrir el panel: clic en `Ajustes`; las notas se buscan con `within(dialog).getByRole('group', { name: 'Notas' })`. Tests:
  - `'las 12 notas empiezan incluidas, con la grafía de las negras'`: los `button` del grupo, en orden, se llaman `C, D♭, D, E♭, E, F, F♯, G, A♭, A, B♭, B` y todos tienen `aria-pressed="true"`.
  - `'una nota se excluye y se vuelve a incluir'`: clic en `F♯` → `aria-pressed="false"`; otro clic → `"true"`.
  - `'los atajos incluyen o excluyen naturales y alteradas, y se deshabilitan si no cambiarían nada'`:
    - al inicio, `Incluir naturales` e `Incluir alteradas` están deshabilitados, y los dos `Excluir…` habilitados;
    - `Excluir alteradas` → las 5 negras quedan en `"false"`, `Excluir alteradas` se deshabilita y `Incluir alteradas` se habilita;
    - `Incluir alteradas` → vuelven las 12.
  - `'con solo naturales, la vuelta tiene las 7 naturales'`:
    - `Excluir alteradas`, `Cerrar`, Play y `fake.beat(4 + 7 * 2 * 4)`;
    - el `pitch` de los compases impares 1–13 forma el conjunto `C2, D2, E2, F2, G2, A2, B2`.
  - `'con menos de 2 notas no se puede dar Play, y se explica por qué'`:
    - `Excluir naturales`, `Excluir alteradas`, clic en `C`;
    - en el panel se ve `Elige al menos 2 notas para tocar.`;
    - `Cerrar`: el botón `Play` tiene `disabled` (`toHaveProperty('disabled', true)`) y el aviso también se ve en la pantalla.
  - `'los filtros cambiados mientras suena aplican desde la siguiente vuelta'`:
    - Play, `fake.beat(4)`, `Excluir alteradas`, `Cerrar` y `fake.beat((24 + 14) * 4)`;
    - los compases 1–24 tienen 12 notas distintas;
    - los compases 25–38 tienen solo naturales, 7 distintas.
  - `'con menos de 2 notas mientras suena, la música sigue con las notas anteriores'`:
    - Play, `fake.beat(4)`, `Excluir naturales`, `Excluir alteradas`, `Cerrar` y `fake.beat((24 + 24) * 4)`;
    - `fake.running` es `true`;
    - los compases 25–48 tienen las 12 notas.

  Correr `pnpm test --project ui` y **verlo fallar**.

- [ ] T024 [US4] Implementar:
  - **`store.ts`**:
    - `toggleNote(id)` y `setGroup(natural: boolean, included: boolean)`. Las dos dejan `notes` sin duplicados y en orden cromático (`NOTES.map((n) => n.id).filter(…)`);
    - `play()` no hace nada si `notes.length < 2` (`canPlay`, FR-023). El pool de reserva ya existe desde T019.
  - **`settings-panel.tsx`**:
    - una sección `Notas`, con `<div role="group" aria-label="Notas">` y 12 `Toggle` (`size="lg"`, `pressed` y `onPressedChange`) en una grilla de 6 columnas;
    - debajo, los 4 atajos (`Incluir naturales`, `Excluir naturales`, `Incluir alteradas`, `Excluir alteradas`), cada uno deshabilitado si no cambiaría nada;
    - el aviso `Elige al menos 2 notas para tocar.` cuando `notes.length < 2`;
    - el texto `Se aplica desde la siguiente vuelta.`
  - **`App.tsx`**: Play deshabilitado si está detenida y `notes.length < 2`, con el mismo aviso visible cerca del botón.

  `pnpm test` debe quedar **en verde**. **Commit**: `feat: filtros de notas (#18)`.

**Checkpoint**: US1–US4 en verde.

---

## Phase 7: User Story 5 · Pantalla de práctica: carril de compases (P5, #19)

**Goal**: mientras suena, la pantalla muestra, legible a 1–2 m y sin tocarla:

- la cuenta regresiva en "Ahora";
- la vuelta completa en un carril de filas de 4, con el compás actual resaltado, una barra que avanza y marcas por tiempo;
- los compases tocados y lejanos atenuados;
- la primera nota de la vuelta siguiente;
- el contador.

**Independent Test**: `pnpm test` y `pnpm test:e2e` en verde; con `pnpm dev`, quickstart §2, filas 11–13.

### Tests primero

- [ ] T025 [P] [US5] Escribir `src/lane.test.tsx`. Se usan `ahora = () => screen.getByRole('region', { name: 'Ahora' })` y `carril = () => screen.getByRole('list', { name: 'Carril' })`. Tests:
  - `'detenida, "Ahora" invita a tocar y no hay carril'`: `within(ahora()).getByText('Toca Play para empezar.')` y `screen.queryByRole('list', { name: 'Carril' })` es `null`.
  - `'durante la cuenta de entrada, "Ahora" muestra 4, 3, 2, 1'`:
    - Play; después de cada `fake.beat(1)`, "Ahora" contiene `'4'`, `'3'`, `'2'` y `'1'`;
    - tras un `fake.beat(1)` más, "Ahora" ya no contiene ningún dígito del 1 al 4 solo.
  - `'el carril muestra la vuelta completa, cada compás con su nota'`:
    - Play y `fake.beat(1)`;
    - el carril tiene 24 `listitem`;
    - los compases 2k y 2k+1 (de a pares) tienen la misma nota;
    - hay 12 notas distintas.
  - `'el compás actual se marca y avanza con la música'`:
    - Play y `fake.beat(4)`: ningún `listitem` tiene `aria-current="true"`;
    - `fake.beat(1)`: el primero lo tiene y solo él;
    - `fake.beat(4)`: lo tiene el segundo.
  - `'el contador muestra la vuelta y la nota'`: Play y `fake.beat(5)` → se ve `Vuelta 1 · nota 1 de 12`; `fake.beat(8)` → `Vuelta 1 · nota 2 de 12`.
  - `'desde la última nota de la vuelta se ve la primera de la siguiente'`:
    - Play y `fake.beat(4 + 22 * 4)`: no hay texto que cumpla `/^Vuelta 2: /`;
    - `fake.beat(1)` (compás 23, el primero de la última nota): aparece `Vuelta 2: {nota}`, y `{nota}` es distinta de la del `listitem` 24;
    - `fake.beat(2 * 4)` (compás 25): el contador dice `Vuelta 2 · nota 1 de 12`, y el primer `listitem` del carril tiene esa `{nota}`.

  Correr `pnpm test --project ui` y **verlo fallar**.

- [ ] T026 [P] [US5] En `e2e/practice.spec.ts`, agregar `'Play cuenta, muestra una nota con su nombre y Stop la detiene'` (research.md §12):
  - en `Ajustes`, `fill('240')` en el `spinbutton` `BPM`, `press('Enter')` y `Cerrar`;
  - Play;
  - `expect(region Ahora).toHaveText(/^\s*[1-4]\s*$/)`;
  - después, "Ahora" contiene un nombre que cumple `/Do|Re|Mi|Fa|Sol|La|Si/`, y algún `listitem` del carril tiene `aria-current="true"`;
  - Stop → se ve el `button` `Play`.

  Correr `pnpm test:e2e` y **verlo fallar**.

### Implementación

- [ ] T027 [US5] Implementar (data-model.md, "Derivados para la UI"):
  - **`now.tsx`**: con `status === 'countIn'`, muestra `4 − (position?.beat ?? 0)` con el mismo tamaño que la nota.
  - **`src/components/lane.tsx`**:
    - `<ol aria-label="Carril" className="grid grid-cols-4 …">` con un `<li>` por compás de `rounds[0]` (`notes.length × barsPerNote` compases), cada uno con el `label` de su nota;
    - `aria-current="true"` en el compás de `position.bar`;
    - un atributo `data-state` con `played`, `current`, `near` (hasta el final de la fila siguiente) o `far`;
    - debajo de la lista (fuera del `<ol>`), si existe `rounds[1]`, un `<p>` `Vuelta {rounds[1].number}: {label de su primera nota}`;
    - solo se renderiza si `rounds` no está vacío.
  - **`App.tsx`**:
    - el contador `Vuelta {n} · nota {i} de {total}` abajo, sobre el Play, solo con `status === 'playing'`;
    - la grilla de la pantalla: línea de estado, "Ahora", carril con `overflow-y-auto` y pie.

  `pnpm test` y `pnpm test:e2e` deben quedar **en verde**. Si el audio en tiempo real falla en WebKit sin interfaz, registrarlo en research.md §12 y consultar al usuario antes de recortar el E2E de `iphone`. **Commit**: `feat: carril de compases con la vuelta siguiente (#19)`.

- [ ] T028 [US5] Pulido visual con el skill `frontend-design`, dentro de la dirección del diseño (§7.4: escenario oscuro, ámbar `#f5a524` y tipografía muy pesada) y del tema actual:
  - **Compás actual**: borde o fondo ámbar, 4 marcas de tiempo (la del tiempo que suena encendida) y una barra de progreso. En cada `onBeat`, la barra salta al ancho del tiempo actual y anima hasta el siguiente con `transition: width {60 / bpm}s linear`; al cambiar de compás vuelve a 0 sin transición (research.md §10).
  - **Atenuados**: `data-state` `played` y `far` con opacidad baja.
  - **Desplazamiento**: cuando cambia el compás actual, `rowElement.scrollIntoView?.({ block: 'nearest', behavior: 'smooth' })` de su fila, para que la fila siguiente también se vea.
  - **Tamaños**: notas del carril y contador legibles a 1–2 m. Zonas seguras del iPhone (`p-safe`). Sin desplazamiento horizontal a 375 px de ancho.

  Comprobar con `pnpm dev` en un ancho de celular y en el de un computador (quickstart §2, filas 11–13). Todos los tests siguen **en verde**. **Commit**: `feat: pulido visual de la pantalla de práctica (#19)`.

**Checkpoint**: las 5 historias en verde.

---

## Phase 8: Polish & Cross-Cutting Concerns

- [ ] T029 Correr quickstart §1 completo: `pnpm lint`, `pnpm format:check`, `pnpm test`, `pnpm test:e2e` y `pnpm build`, los 5 en verde. Comprobar con `grep -rn "setTimeout\|setInterval" src --include=*.ts --include=*.tsx` que solo aparecen en los tests de precisión, como `context.setTimeout` del reloj de audio.
- [ ] T030 Informar al usuario, por cada issue (#15–#19), qué criterios de aceptación quedaron en verde y cuáles necesitan su verificación. Pendientes de él:
  - el iPhone con el interruptor de silencio activado (quickstart §3);
  - la prueba de oído de 10 minutos a 60 y a 200 BPM (§4);
  - tocar con la guitarra (§5).

  No cerrar ningún issue, ni hacer push: el usuario hace push de la rama para la vista previa de Vercel y cierra los issues después de verificarlos (constitución, Backlog).

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (fase 1)**: no depende de nada.
- **US1 (fase 3)**: depende de Setup. Crea el contrato del motor, el motor real, el motor falso, el store y `App`.
- **US2 (fase 4)**: depende de US1 (store y `App`). Crea el panel y el `Stepper`.
- **US3 (fase 5)**: depende de US2, porque compases por nota vive en el panel y usa el `Stepper`.
- **US4 (fase 6)**: depende de US3 (vueltas, `notes.ts` y el pool de reserva).
- **US5 (fase 7)**: depende de US3 (vueltas y "Ahora"). Se hace después de US4, porque comparten `App.tsx` y `store.ts`.
- **Polish (fase 8)**: depende de todas.

### User Story Dependencies

Las historias comparten `store.ts`, `App.tsx` y `settings-panel.tsx`, así que se hacen **en secuencia**, en orden de prioridad: US1 → US2 → US3 → US4 → US5. Cada una deja el repo en verde antes de pasar a la siguiente.

### Within Each User Story

- El test se escribe y **se ve fallar** antes de implementar.
- Se hace commit en cada paso en verde (el motor y la pantalla en US1; el sorteo, la pantalla y el bajo real en US3).

### Parallel Opportunities

- **US1**: T006 (motor falso) ∥ T008 (E2E). T007 va después de T006, porque lo importa.
- **US2**: T013 (`Stepper`) ∥ T012 (test).
- **US3**: T015 (test del sorteo) ∥ T016 (`notes.ts`).
- **US5**: T025 (test de UI) ∥ T026 (E2E).

---

## Parallel Example: User Story 5

```bash
Task: "Escribir src/lane.test.tsx: cuenta 4-3-2-1, 24 compases, aria-current, contador y vista previa de la vuelta 2"
Task: "Agregar a e2e/practice.spec.ts: BPM 240 → Play → cuenta → nota con nombre → Stop"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Fase 1: punto de partida en verde.
2. Fase 3: motor preciso (test de audio renderizado), Play/Stop por la UI y E2E.
3. **PARAR y VALIDAR**: con `pnpm dev`, se oye la cuenta de entrada y el metrónomo con acento; en el iPhone, también con el interruptor de silencio activado.

### Incremental Delivery

Después de cada historia, todos los comandos siguen en verde y se hace commit:

- US1: metrónomo;
- US2: BPM;
- US3: bajo y "Ahora", con lo que se cumple el criterio "ya me sirve" en lo sonoro;
- US4: filtros;
- US5: carril.

La entrega cierra con la verificación del usuario en el iPhone, la prueba de oído y la guitarra.

---

## Notes

- `tasks.md` referencia los issues; `/speckit-taskstoissues` está prohibido (constitución, Backlog).
- T002, T011 y T022 (instalar dependencias y componentes) no tienen test propio: se verifican con los tests de la tarea siguiente.
- T028 (pulido visual) no agrega tests de clases ni de estilos: se verifica a la vista (quickstart) y con los tests que ya existen.
