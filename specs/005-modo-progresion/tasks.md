---
description: 'Lista de tareas de la Entrega 4 · Modo progresión con biblioteca'
---

# Tasks: Modo progresión con biblioteca (Entrega 4)

**Input**: Documentos de diseño en `specs/005-modo-progresion/`: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/interfaces.md](./contracts/interfaces.md) y [quickstart.md](./quickstart.md).

**Tests**: se incluyen, porque la constitución exige test-first (principio I). Cada test se escribe primero y se ve fallar antes de implementar.

**Organización**: una fase por historia (sub-issue), en el orden del spec. No hay fase fundacional: la vuelta como lista de compases es un **refactor puro** dentro de US1 (T006), la única excepción nombrada (plan, Constitution Check II). Cada historia termina en una conducta que se prueba con la app abierta.

**Reglas que aplican a todas las tareas**:

- **Git**:
  - Todo en la rama `005-modo-progresion`; nunca en `main` y nunca push.
  - Commit después de cada paso en verde, con el número de issue en el mensaje (por ejemplo, `#29`) y la línea de atribución de la sesión.
- **GitHub**: la sesión principal (nunca un subagente) comenta el avance en #29–#32 y #5 a medida que se cierra cada paso: commits, criterios en verde y lo que queda para la prueba manual. Los issues se cierran cuando la rama llega a `main`, con el comentario de lo pendiente (constitución v1.2.0).
- **Dependencias**: solo `@tonaljs/note@4.12.3` y `@tonaljs/interval@5.1.1`, en T012 (decisión del usuario, plan §Decisiones). Si una tarea parece necesitar otra, se consulta al usuario.
- **Tests**:
  - Nunca se debilita, salta ni borra un test para que pase. Si un test parece incorrecto, se consulta al usuario. Ningún test existente cambia en esta entrega.
  - Los tests de UI usan `renderApp()` de `src/test/app.tsx` (monta `<App engine={fake.engine} />`) y buscan por rol y nombre accesible ([contracts](./contracts/interfaces.md) §4), nunca por clases ni por estructura. La única excepción es `data-at` en las partes de un compás partido (contracts §4).
  - Usan `userEvent.setup()` (viene en `renderApp`) y, para avanzar la música, `fake.beat(n)`, que avanza n golpes de metrónomo. En 4/4, `fake.beat(4)` toca la cuenta, y el siguiente `beat()` pide el compás 1 y toca su golpe 0. El compás `b` (≥ 1) empieza después de `fake.beat(4 + 4 × (b − 1))`.
  - Cada test tiene al menos un `expect`, porque `vitest/expect-expect` solo acepta `expect` y `screen.getBy*` como aserción.
  - Para escribir ajustes guardados a mano: `localStorage.setItem('countdown-notes:ajustes', JSON.stringify({ version: 1, settings }))` antes de `renderApp()`, como en `src/saved-settings.test.tsx`.
  - Los tests del proyecto `audio` (`*.browser.test.ts`) corren en Chromium y WebKit.
- **Código**:
  - Formato de oxfmt: comillas simples, sin punto y coma, sin coma final, indentación de 2 espacios.
  - Nunca se usa `setTimeout` ni `setInterval` para el tiempo musical (constitución III).
  - Solo `src/main.tsx` y `src/audio/tone-engine.ts` importan `tone`, además de los tests `*.browser.test.ts`. Solo `src/music/progressions.ts` importa tonal.
  - El motor (`src/audio/engine.ts`, `tone-engine.ts`) y el motor falso (`src/test/fake-engine.ts`) no cambian (research §10).
- **Nombres de la biblioteca** (texto exacto del selector y de la línea de estado; `–` es la raya corta U+2013):
  - Ciclos: `Ciclo de cuartas`, `Ciclo de quintas`, `ii–V–I por las 12 tonalidades`, `Dominantes encadenados`.
  - Jazz: `ii–V–I mayor`, `ii–V–i menor`, `I–vi–ii–V (turnaround)`, `iii–vi–ii–V`, `Ciclo diatónico (tipo Autumn Leaves)`, `Sustituto tritonal`, `ii–V "backdoor"`, `Blues de jazz`, `Blues menor`, `Modal (tipo So What)`, `Coltrane (Giant Steps, avanzado)`.
  - Pop, rock y latino: `I–V–vi–IV`, `vi–IV–I–V`, `I–vi–IV–V (doo-wop)`, `I–IV–V`, `Blues de rock`, `Cadencia andaluza`.
  - Sus ids, en el mismo orden, están en [data-model](./data-model.md) (Progresión).
- **Verde** significa que pasan `pnpm lint`, `pnpm format:check`, `pnpm test`, `pnpm test:e2e` y `pnpm build`.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: se puede hacer en paralelo (otro archivo, sin depender de tareas pendientes).
- **[Story]**: la historia del spec (US1–US4). Entre paréntesis va su issue.

---

## Phase 1: Setup

**Purpose**: comprobar que la rama parte en verde.

- [x] T001 En la rama `005-modo-progresion`, correr `pnpm install`, `pnpm lint`, `pnpm format:check`, `pnpm test`, `pnpm test:e2e` y `pnpm build`: los 6 en verde. Anotar el tamaño de `dist/assets/*.js` que imprime `pnpm build`, para comparar en T031. Sin commit.

---

## Phase 2: User Story 1 · Modo progresión con un ii–V–I en loop (P1, #29) 🎯 MVP

**Goal**: en ajustes se elige el modo progresión, y suena Dm7 | G7 | Cmaj7 | Cmaj7 en Do, en loop o N vueltas, con el carril, "Ahora", el contador y la línea de estado. Con "Bajo + acorde", las voces se mueven poco.

**Independent Test**: quickstart §2, filas 1–6.

### El ii–V–I en la biblioteca

- [x] T002 [P] [US1] Crear `src/music/progressions.test.ts` (falla: el módulo no existe). Por API exportada ([contracts](./contracts/interfaces.md) §3):
  - Helper `text(bars)`: cada compás como sus acordes separados por espacio y los compases por `' | '`. Cada acorde es `chordSymbol(root, type)` si tiene `type`, y si no, `root.label`.
  - `spell`: `spell('C#')` es `{ id: 'Db', label: 'C♯', name: 'Do sostenido', natural: false }`, `spell('Gb')` es `{ id: 'Gb', label: 'G♭', name: 'Sol bemol', natural: false }` y `spell('F')` es `{ id: 'F', label: 'F', name: 'Fa', natural: true }`.
  - `text(barsOf(PROGRESSION_BY_ID['ii-v-i-mayor'], 'C', METER_BY_ID['4/4']))` es `'Dm7 | G7 | Cmaj7 | Cmaj7'`, y cada acorde tiene `at: 0`.
  - La raíz del primer acorde tiene `label: 'D'` y `name: 'Re'`.
  - `keyLabel(PROGRESSION_BY_ID['ii-v-i-mayor'], 'C')` es `'Do mayor'` y `tonicOf(…, 'C').label` es `'C'`.
  - `PROGRESSIONS` tiene el ii–V–I mayor con `name: 'ii–V–I mayor'` y `group: 'Jazz'`.

- [x] T003 [US1] Implementar:
  - **`src/music/notes.ts`**: `spell(name)` según [data-model](./data-model.md) (Nota escrita), sin tonal. La altura sale de la letra (C 0, D 2, E 4, F 5, G 7, A 9, B 11) más 1 por `#` y menos 1 por `b`, módulo 12, como índice en `NOTES`. El nombre es Do, Re, Mi, Fa, Sol, La o Si, más ` sostenido` o ` bemol`.
  - **`src/music/chords.ts`**: `chordSymbol` y `chordName` aceptan `root: NoteId | Note`. Con un string usan `NOTE_BY_ID[root]`, como hoy.
  - **`src/music/progressions.ts`**: los tipos de [contracts](./contracts/interfaces.md) §3. `ProgressionId` es `'ii-v-i-mayor'` (crece en US3 y US4), y `KeyType`, por ahora, `'major'`. `PROGRESSIONS` trae una sola progresión: `{ id: 'ii-v-i-mayor', name: 'ii–V–I mayor', group: 'Jazz', key: { tonic: 'C', type: 'major' }, bars: 'Dm7 | G7 | Cmaj7 | Cmaj7' }`. Además:
    - `PROGRESSION_BY_ID`;
    - un lector que parte `bars` por `|` y cada acorde en raíz (`/^([A-G])([♭♯]?)(.*)$/`, con `♭` → `b` y `♯` → `#` para `spell`) y sufijo; el sufijo se busca en `CHORD_TYPES` por `suffix` y, si no está, el lector lanza un `Error` con el acorde;
    - `barsOf(progression, tonic, meter)`, que por ahora lee `bars` en la tónica de origen, con `at: 0`;
    - `tonicOf` (`spell(key.tonic)`) y `keyLabel` (`${tonicOf(…).name} mayor`).

  `pnpm test --project ui` **en verde**. **Commit**: `feat: el ii–V–I mayor en la biblioteca (#29)`.

### Movimiento de voces

- [x] T004 [P] [US1] En `src/music/chords.test.ts`, agregar (falla: `voicingOf` ignora el tercer argumento):
  - `'el ii–V–I mueve poco las voces'`: `voicingOf('D', 'm7')` es `['F3', 'A3', 'C4']`; `voicingOf('G', '7', ['F3', 'A3', 'C4'])` es `['F3', 'B3', 'D4']` (sin `after` sería `['B3', 'D4', 'F4']`); y `voicingOf('C', 'maj7', ['F3', 'B3', 'D4'])` es `['E3', 'G3', 'B3']`.
  - `'un acorde repetido conserva su voicing'`: `voicingOf('C', 'maj7', ['E3', 'G3', 'B3'])` es `['E3', 'G3', 'B3']`.
  - `'las tríadas no cambian con after'`: `voicingOf('C', 'maj', ['F3', 'B3', 'D4'])` es `['C3', 'G3', 'E4']`.
  - `test.each` sobre las 12 `NOTES`: la cadena ii–V–I de esa tónica (ii a 2 semitonos, V a 7; con `after` encadenado desde el ii sin `after`). Cada voicing:
    - cumple las reglas del test de la entrega 3 para su tipo (sin la clase de la raíz, con las clases requeridas de la tabla `JAZZ` del archivo, todo entre 48 y 76);
    - y su movimiento (Σ, sobre cada nota nueva, de la distancia en semitonos a la nota más cercana del anterior) no es mayor que el del voicing sin `after`.

- [x] T005 [US1] En `src/music/chords.ts`, `voicingOf(root, type, after?)` según research §7: con `after`, entre los candidatos que hoy caen enteros en 48–76, gana el de menor movimiento; en un empate, el de menor distancia a C4, y después la forma A. Sin `after`, igual que hoy. Las tríadas no cambian. Un comentario de una línea dice qué mide el movimiento. **Verde completo**. **Commit**: `feat: movimiento de voces en voicingOf (#29)`.

### La vuelta como lista de compases (refactor puro)

- [x] T006 [US1] **Refactor puro** (research §2): ningún test nuevo y ningún test cambia. En `src/practice/store.ts`:
  - `Round` pasa a `{ mode: 'random'; number; meter; firstBar; bars: RoundChord[][]; notes: NoteId[]; barsPerNote: number }` (la variante `'progression'` llega en T008). `RoundChord` viene de `@/music/progressions`.
  - La vuelta aleatoria arma `bars` con `barsPerNote` compases `[{ root: NOTE_BY_ID[id], at: 0 }]` por nota sorteada.
  - `roundLength(round)` es `round.bars.length`.
  - Se suman `previewFrom(round)`, que da `(notes.length − 1) × barsPerNote`, y `chordAt(chords, beat)`, el último acorde con `at ≤ beat`. Los dos se exportan.
  - `barAt`:
    - la vuelta siguiente se arma cuando `bar >= last.firstBar + previewFrom(last)`, con el mismo resto de la condición;
    - `chords = round.bars[bar − round.firstBar]`;
    - cada ataque del bajo usa `${chordAt(chords, at).root.id}${bassOctave}`;
    - con `withChord`, un `chord` por acorde, en su `at`, con `voicingOf(chord.root.id, chord.type ?? chordType)` y `length` hasta el `at` del acorde siguiente o `meter.beats`.
  - `nowPlaying` devuelve `{ round, index: position.bar − round.firstBar }`, el índice del compás.
  - **`src/components/now.tsx`**: el acorde es `chordAt(round.bars[index], beat)`. Su tipo es `chord.type ?? sounding?.chordType`. Muestra `chordSymbol(chord.root, type)` y `chordName(…)`, o `root.label` y `root.name` sin tipo.
  - **`src/components/lane.tsx`**: cada `listitem` es un compás de `round.bars`, con los acordes como hijos, cada uno con `data-at`. La etiqueta del compás actual usa `sounding?.chordType` y la de los demás `withChord && chordType`, siempre después de `chord.type`. La vista previa usa `next.bars[0][0]`. Las clases y el resto del marcado no cambian.
  - **`src/App.tsx`**: `Counter` calcula la nota como `Math.floor(index / round.barsPerNote)`.

  **Verde completo** sin tocar ningún test. **Commit**: `refactor: la vuelta como lista de compases (#29)`.

### El modo progresión en la app

- [x] T007 [US1] Crear `src/progression-mode.test.tsx` (falla). Helpers locales: `pickMode(app, name)`, que abre el panel, toca el radio `name` del `radiogroup` `Modo` y lo cierra; `pickSound(app, name)`, como en `src/chords.test.tsx`; `bassByBar(fake)`, como en `src/random-mode.test.tsx`; y `bars()`, los `listitem` de la lista `Carril`.
  1. `'empieza en el modo aleatorio'`: el `radiogroup` `Modo` tiene `Aleatorio` (marcado) y `Progresión`, y la línea de estado empieza con `Aleatorio · `.
  2. `'en progresión, el panel no muestra lo del modo aleatorio'`: con `Progresión`, el panel no tiene el `spinbutton` `Compases por nota` ni el `group` `Notas`. Con `Bajo + acorde`, tampoco tiene el `combobox` `Tipo de acorde`.
  3. `'en progresión se puede tocar aunque haya una sola nota'`: con lo guardado `{ notes: ['C'], mode: 'progression' }`, `Play` está habilitado y no se ve `Elige al menos 2 notas para tocar.`.
  4. `'suena el ii–V–I en Do, en loop'`: Play y `fake.beat(4 + 8 × 4)`. `bassByBar` da `D2`, `G2`, `C2`, `C2`, `D2`, `G2`, `C2` y `C2` en los compases 1 a 8, y nada en el 0.
  5. `'el carril, Ahora, el contador y la línea de estado'`:
     - detenida, la línea de estado dice `ii–V–I mayor · Do mayor · Analógico cálido · 60 BPM · 4/4`;
     - Play y `fake.beat(4 + 1)`: el carril tiene 4 compases con `textContent` `Dm7`, `G7`, `Cmaj7` y `Cmaj7`; "Ahora" dice `Dm7` y `Re menor séptima` (con "Solo bajo"); el contador, `Vuelta 1 · compás 1 de 4`;
     - `fake.beat(4 × 6)`, en el compás 7: `Vuelta 2 · compás 3 de 4`.
  6. `'desde el último compás se anuncia la vuelta siguiente'`: en el compás 3 no hay texto `/^Vuelta 2: /`; en el compás 4, sí, `Vuelta 2: Dm7`.
  7. `'con Bajo + acorde, cada acorde se liga al anterior'`: Play y `fake.beat(4 + 5 × 4)`. Un `chord` por compás, en `at: 0` y `length: 4`:
     - compás 1, `voicingOf('D', 'm7')`;
     - compás 2, `voicingOf('G', '7', <los del 1>)`;
     - compás 3, `voicingOf('C', 'maj7', <los del 2>)`;
     - compás 4, igual al 3;
     - compás 5 (vuelta 2), otra vez `voicingOf('D', 'm7')`, sin `after`.
  8. `'para tras 3 vueltas'`: con `Parar tras N vueltas` en 3 (switch y `spinbutton` `Vueltas`, como en `src/repeats.test.tsx`):
     - en el compás 9, el contador dice `Vuelta 3 de 3 · compás 1 de 4`;
     - después de `fake.beat(4 + 12 × 4 + 1)`, `fake.running` es falso, no hay `bass` en el compás 13 y vuelve `Play`.
  9. `'cambiar de modo detiene la práctica'`: sonando (compás 2), elegir `Aleatorio` deja `fake.running` falso y el botón `Play`; lo mismo en la cuenta (después de `fake.beat(2)`).
  10. `'el modo se recuerda y lo de la entrega 3 se conserva'`:
      - elegir `Progresión`, `unmount()` y otra `renderApp()`: `Progresión` sigue marcado;
      - con lo guardado `{ withChord: true, chordType: 'm7', style: 'pad' }` sin `mode`, el modo es `Aleatorio`, `Bajo + acorde` sigue marcado y la línea de estado dice `Aleatorio · Pad ambiental · 60 BPM · 4/4`.

  Correr `pnpm test --project ui` y **verlo fallar**.

- [x] T008 [US1] Implementar:
  - **`src/practice/settings.ts`**: `mode: 'random' | 'progression'` (por defecto `'random'`), `progression: ProgressionId` (`'ii-v-i-mayor'`) y `tonic: NoteId` (`'C'`), con:
    - `mode: z.enum(['random', 'progression']).catch(D.mode)`;
    - `progression: z.enum(PROGRESSIONS.map((p) => p.id)).catch(D.progression)`;
    - `tonic: z.enum(NOTES.map((note) => note.id)).catch(D.tonic)`.

    La versión sigue en 1 (research §9).

  - **`src/practice/store.ts`**:
    - `Round` suma la variante `{ mode: 'progression'; …base; progression: ProgressionId; tonic: NoteId }`, y `previewFrom` da `bars.length − 1` en ella;
    - `mode`, `progression`, `tonic` y `setMode(mode)`, que llama a `stop()` si `status !== 'stopped'` y después guarda el modo;
    - `canPlay` pasa a `mode === 'progression' || notes.length >= 2`;
    - `play` y `nextRound` arman, en el modo progresión, la vuelta `{ mode: 'progression', number, meter, firstBar, progression, tonic, bars: barsOf(PROGRESSION_BY_ID[progression], tonic, METER_BY_ID[meter]) }`, con los ajustes del momento;
    - en `barAt`, en las vueltas de progresión, el `chord` usa `voicingOf(root.id, type, after)`. `after` es el último voicing armado en esa vuelta (una variable del closure) y no se pasa en el primer acorde de la vuelta (research §7).
  - **`src/components/settings-panel.tsx`**:
    - el `ToggleGroup` `Modo` (`Aleatorio` → `'random'`, `Progresión` → `'progression'`) arriba de todo, con el estilo de los demás;
    - en el modo progresión, sin `Compases por nota` ni `NoteFilters`;
    - `Tipo de acorde` solo en el modo aleatorio (US4 lo suma en los ciclos de solo raíces).
  - **`src/App.tsx`**:
    - `StatusLine`, en el modo progresión, muestra `${progression.name} · ${keyLabel(progression, tonic)} · ${estilo} · ${bpm} BPM · ${compás}`, con la `tonic` de `rounds[0]` mientras suena y la de los ajustes detenida;
    - `Counter`, en el modo progresión, muestra `Vuelta ${n}${on ? ` de ${count}` : ''} · compás ${index + 1} de ${round.bars.length}`.

  **Verde completo**. **Commit**: `feat: modo progresión con un ii–V–I en loop (#29)`. Comentar en #29.

### Audio renderizado

- [x] T009 [US1] Crear `src/practice/progression.browser.test.ts` (research §12). Un helper `renderStore(setup, seconds)`:
  - corre dentro de `Tone.Offline` con `context.lookAhead = 0.1`;
  - hace `localStorage.clear()` y crea `createToneEngine()`, envuelto para guardar la promesa de `start` (`start: (o) => (started = real.start(o))`);
  - arma `createPracticeStore(engine)`, aplica `setup(store.getState())`, llama a `play()` y espera `started`.

  Espía `triggerAttackRelease` de `Tone.Synth.prototype` (click), `Tone.MonoSynth.prototype` (bajo) y `Tone.PolySynth.prototype` (acorde), y los restaura en `finally`.

  Test `'cada cambio de acorde del ii–V–I cae en su compás'`: `setMode('progression')`, `setWithChord(true)`, `setRepeats({ on: true, count: 2 })` y `setBpm(240)`, con un render de 10 s. Con `t0` el tiempo del primer click (la cuenta) y un compás de 1 s:
  - el bajo tiene 8 llamadas, con `D2 G2 C2 C2 D2 G2 C2 C2`, en `t0 + k` para `k` de 1 a 8, a menos de 1 ms;
  - el acorde tiene 8 llamadas en los mismos tiempos.

  Pasa al primer intento, porque el motor no cambia. Para comprobar que mide algo, sumar a propósito 1 al `at` del bajo en `barAt`, verlo fallar y deshacerlo. **Verde completo**. **Commit**: `test: cada cambio de acorde del ii–V–I cae en su compás (#29)`.

- [ ] T010 [US1] Verificación manual: quickstart §2, filas 1–6, con `pnpm dev`.

**Checkpoint**: el modo progresión funciona con el ii–V–I en Do. El MVP se puede usar con la guitarra.

---

## Phase 3: User Story 2 · Elegir tonalidad (P2, #30)

**Goal**: en ajustes se elige una de las 12 tónicas, y la progresión se transporta con las alteraciones de su tonalidad. Un cambio mientras suena aplica desde la vuelta siguiente.

**Independent Test**: quickstart §2, filas 7–9.

- [x] T011 [P] [US2] En `src/music/progressions.test.ts`, agregar (falla):
  - `text(barsOf(ii-v-i-mayor, t, 4/4))`:
    - en `'F'`, `'Gm7 | C7 | Fmaj7 | Fmaj7'`;
    - en `'B'`, `'C♯m7 | F♯7 | Bmaj7 | Bmaj7'`;
    - en `'Gb'`, `'G♯m7 | C♯7 | F♯maj7 | F♯maj7'`;
    - en `'Eb'`, `'Fm7 | B♭7 | E♭maj7 | E♭maj7'`.
  - `tonicOf(ii-v-i-mayor, t).label` en las 12 `NOTES`: `C D♭ D E♭ E F F♯ G A♭ A B♭ B`.
  - `keyLabel(ii-v-i-mayor, 'F')` es `'Fa mayor'`, y en `'Db'`, `'Re bemol mayor'`.

- [x] T012 [US2] Implementar:
  - `pnpm add -E @tonaljs/note@4.12.3 @tonaljs/interval@5.1.1`, y comprobar que `package.json` las tiene sin `^`.
  - **`src/music/progressions.ts`**:
    - la tabla `major` de research §5 (tónica escrita por clase);
    - `tonicOf` la usa;
    - `barsOf` transporta cada raíz con `simplify(transpose(raíz, distance(key.tonic, tónica escrita)))`, en el formato de tonal (`b`, `#`), y la convierte con `spell`.

    Un comentario de una línea dice que `simplify` evita E♯, B♯, C♭, F♭ y las dobles alteraciones (FR-013).

  **Verde completo**. **Commit**: `feat: transportar a las 12 tónicas con su grafía (#30)`.

- [x] T013 [US2] Crear `src/keys.test.tsx` (falla). Helpers: `pickMode`, `bassByBar` y `bars()` como en T007, y `pickTonic(app, name)`, que toca el radio `name` del `radiogroup` `Tonalidad`.
  1. `'hay 12 tónicas, con Do por defecto'`: en el modo progresión, el `radiogroup` `Tonalidad` tiene 12 radios con estos nombres accesibles y `textContent`, en este orden, con `Do` marcado: `Do C`, `Re bemol D♭`, `Re D`, `Mi bemol E♭`, `Mi E`, `Fa F`, `Fa sostenido F♯`, `Sol G`, `La bemol A♭`, `La A`, `Si bemol B♭`, `Si B`.
  2. `'en Fa suena y se ve el ii–V–I de Fa'`: con `Fa` y Play, los 4 `listitem` del carril dicen `Gm7`, `C7`, `Fmaj7` y `Fmaj7`, y el bajo en `G2`, `C2`, `F2` y `F2` en los compases 1 a 4.
  3. `'en Si, cada acorde con las alteraciones de Si mayor'`: con `Si` y Play, `fake.beat(5)`: "Ahora" dice `C♯m7` y `Do sostenido menor séptima`, y la línea de estado `ii–V–I mayor · Si mayor · Analógico cálido · 60 BPM · 4/4`.
  4. `'un cambio de tonalidad aplica desde la vuelta siguiente'`:
     - Play en Do y, en el compás 2, elegir `Fa`;
     - los compases 3 y 4 siguen con `C2`, y el carril sigue en Do;
     - en el compás 4, la vista previa dice `Vuelta 2: Gm7`;
     - en el compás 5, el bajo está en `G2`, el carril dice `Gm7` y la línea de estado `Fa mayor`.
  5. `'un cambio durante el último compás aplica una vuelta después'`: Play en Do; en el compás 4 (la vuelta 2 ya armada), elegir `Fa`. El compás 5 suena en `D2` y el 9 en `G2`.
  6. `'con la música detenida, aplica al siguiente Play'`: elegir `Fa`, Play y `fake.beat(5)`: el bajo del compás 1 es `G2`.
  7. `'la tónica se recuerda'`: elegir `Fa`, `unmount()` y otra `renderApp()`: `Fa` sigue marcado.

  Correr `pnpm test --project ui` y **verlo fallar**.

- [x] T014 [US2] Implementar:
  - **`src/practice/store.ts`**: `setTonic(tonic)`, que solo guarda el ajuste: `nextRound` y `play` ya leen `tonic` (T008).
  - **`src/components/settings-panel.tsx`**: en el modo progresión, una sección `Progresión` con el `ToggleGroup` `Tonalidad` en una grilla de 6 columnas. Cada `ToggleGroupItem` tiene `value` igual al `NoteId`, `aria-label` igual a `tonicOf(progression, id).name` y, visible, `tonicOf(…).label` con la clase `note-label`.
  - **`src/App.tsx`**: nada nuevo; `keyLabel` ya está en la línea de estado.

  **Verde completo**. **Commit**: `feat: elegir tonalidad (#30)`. Comentar en #30.

- [ ] T015 [US2] Verificación manual: quickstart §2, filas 7–9.

**Checkpoint**: el ii–V–I se practica en las 12 tonalidades.

---

## Phase 4: User Story 3 · Biblioteca completa con medio compás (P3, #31)

**Goal**: se elige cualquiera de las 17 progresiones de jazz y de pop, rock y latino. Los compases con dos acordes se parten (mitad y mitad, o por grupos en 3/4, 5/4, 7/8 y 9/8), se ven en dos partes, y el bajo ataca en cada cambio.

**Independent Test**: quickstart §2, filas 10–14.

### Compás partido y bajo en el cambio

- [x] T016 [P] [US3] En `src/music/meters.test.ts`, agregar (falla):
  - `test.each` de `splitAt(METER_BY_ID[id])` con la tabla de research §4: `2/4` → 1, `3/4` → 2, `4/4` → 2, `5/4` → 3, `6/8` → 3, `7/8` → 4, `9/8` → 6, `12/8` → 6;
  - `bassAttacks(4/4, 'whole', [0, 2])` es `[{ at: 0, length: 2 }, { at: 2, length: 2 }]`;
  - `bassAttacks(4/4, 'quarter', [0, 2])` son 4 ataques en 0, 1, 2 y 3, sin repetir;
  - `bassAttacks(6/8, 'whole', [0, 3])` es `[{ at: 0, length: 3 }, { at: 3, length: 3 }]`;
  - `bassAttacks(3/4, 'half', [0, 2])` tiene ataques en 0 y 2.

- [x] T017 [US3] En `src/music/meters.ts`:
  - `splitAt(meter)`: `groupStarts(meter).find((start) => 2 * start >= meter.beats)`;
  - `bassAttacks(meter, figure, changes = [])`: une los `at` de la figura con `changes`, ordenados y sin repetir, y cada uno dura hasta el siguiente o hasta `meter.beats`.

  Los tests de figuras de las entregas 2 y 3 siguen en verde. **Verde completo**. **Commit**: `feat: dónde se parte un compás y el bajo en el cambio (#31)`.

### La biblioteca

- [x] T018 [P] [US3] En `src/music/progressions.test.ts`, agregar (falla):
  - `'la biblioteca trae las 17 progresiones de FR-018'`: los `name` de `PROGRESSIONS` con `group` `Jazz` y `Pop, rock y latino` son los de la lista de nombres (Reglas), en ese orden.
  - `test.each` con la tabla literal de FR-018, escrita sin `×N` (cada compás repetido a mano), con su tónica de origen (`'C'`; `'A'` en `andaluza`; `'D'` en `modal`): `text(barsOf(p, origen, 4/4))` es esa cadena. Por ejemplo, `blues-menor` es `'Cm7 | Cm7 | Cm7 | Cm7 | Fm7 | Fm7 | Cm7 | Cm7 | A♭7 | G7 | Cm7 | G7'`.
  - `'en las 12 tónicas, cada acorde conserva su lugar y una grafía simple'`. Para cada progresión y cada `NOTES[t]`:
    - `barsOf(p, t, 4/4)` tiene los mismos compases y acordes por compás que en el origen, con los mismos `type` y `at`;
    - cada raíz está a la misma distancia (módulo 12, por índice en `NOTES`) de `tonicOf(p, t)` que la del origen de `tonicOf(p, origen)`;
    - ninguna `label` es `E♯`, `B♯`, `C♭` ni `F♭`, ni tiene dos alteraciones.
  - Muestra escrita a mano:
    - `andaluza` en `'A'` → `'Am | G | F | E'`, en `'C'` → `'Cm | B♭ | A♭ | G'`, en `'Db'` → `'C♯m | B | A | G♯'` y en `'Eb'` → `'E♭m | D♭ | B | B♭'`;
    - `ciclo-diatonico` en `'Gb'` → `'F♯maj7 | Bmaj7 | Fm7♭5 | A♯m7 | D♯m7 | G♯m7 | C♯7 | F♯maj7'`;
    - `giant-steps` en `'Gb'` → `'F♯maj7 A7 | Dmaj7 F7 | A♯maj7 C♯7 | F♯maj7'`;
    - `modal` en `'F'` → 8 compases de `Fm7`, y en `'Db'` → de `C♯m7`.
  - `tonicOf` y `keyLabel`: `tonicOf(andaluza, 'Db').label` es `C♯` y en `'Ab'`, `G♯`; `keyLabel(andaluza, 'Db')` es `'Do sostenido menor'`; `keyLabel(modal, 'D')` es `'Re dórico'`.
  - El compás partido: en `turnaround`, el segundo acorde de cada compás tiene `at` 2 en 4/4, 2 en 3/4 y 4 en 7/8.
  - `'un sufijo desconocido es un error'`: un `Progression` armado en el test con `bars: 'Cxyz'` hace que `barsOf` lance.

- [x] T019 [US3] En `src/music/progressions.ts`:
  - las 17 progresiones de FR-018, en orden, con los ids de [data-model](./data-model.md), los nombres de la lista (Reglas) y `bars` copiado de la tabla de FR-018 (con `♭`, `♯` y `×N`);
  - `key`: `{ tonic: 'C', type: 'major' }`, salvo `ii-v-i-menor` y `blues-menor` (`'minor'`), `andaluza` (`{ tonic: 'A', type: 'minor' }`) y `modal` (`{ tonic: 'D', type: 'dorian' }`);
  - `KeyType` suma `'minor' | 'dorian'`, con la tabla `minor` de research §5 para los dos;
  - `keyLabel` dice `menor` o `dórico` según el tipo;
  - el lector:
    - `×N` repite el compás N veces;
    - dos acordes en un compás dan el segundo en `at: splitAt(meter)`;
    - más de dos acordes en un compás es un error.

  **Verde completo**. **Commit**: `feat: biblioteca de jazz, pop, rock y latino (#31)`.

### La biblioteca en la app

- [x] T020 [US3] Crear `src/library.test.tsx` (falla). Helpers: `pickMode`, `pickTonic`, `pickSound`, `bassByBar` y `bars()` como en T007 y T013, `pickProgression(app, name)` con `user.selectOptions(panel.getByRole('combobox', { name: 'Progresión' }), name)` y `pickMeter(app, id)`, que toca el radio `id` del `radiogroup` `Compás`.
  1. `'el selector tiene la biblioteca por grupos'`: el `combobox` `Progresión` tiene los `group` `Jazz` y `Pop, rock y latino`, con las opciones de la lista de nombres (Reglas), y `ii–V–I mayor` elegida.
  2. `'el blues de jazz parte los compases 11 y 12'`: con `Blues de jazz` y Play, `fake.beat(5)`:
     - el carril tiene 12 `listitem`;
     - el 11 y el 12 tienen dos hijos con `data-at` `0` y `2`, con `textContent` `C7` y `A7`, y `Dm7` y `G7`;
     - los demás tienen un solo hijo con `data-at` `0`.
  3. `'el bajo y el acorde atacan en el cambio de mitad de compás'`: con `Blues de jazz`, `Bajo + acorde` y la figura por defecto (redondas), Play y `fake.beat(4 + 11 × 4)`. En el compás 11:
     - `bass` `C2` en `at: 0` con `length: 2` y `A2` en `at: 2` con `length: 2`;
     - dos `chord` en `at` 0 y 2, de `length: 2`.
  4. `'"Ahora" cambia de acorde a mitad de compás'`: con `Blues de jazz`, en el golpe 0 del compás 11 dice `C7`, en el golpe 1 sigue `C7` y en el golpe 2 dice `A7` y `La séptima`.
  5. `'un acorde de varios compases vuelve a atacar en cada compás'`: con `Modal (tipo So What)` y `Bajo + acorde`, un `chord` en `at: 0` en cada uno de los compases 1 a 8, todos con las mismas alturas, y `D2` en cada compás.
  6. `'en 3/4, el compás se parte en 2 + 1'`: con `I–vi–ii–V (turnaround)`, `3/4` y `Bajo + acorde`, en el compás 1 hay `chord` en `at: 0` de `length: 2` y en `at: 2` de `length: 1`, y el carril muestra `data-at` `0` y `2`.
  7. `'la cadencia andaluza va en la tónica elegida, como menor'`: con `Cadencia andaluza` y `La`, el carril dice `Am`, `G`, `F` y `E`. Con `Do`, dice `Cm`, `B♭`, `A♭` y `G`, y la línea de estado `Cadencia andaluza · Do menor · …`. Con `Do` elegido, el radio de la clase 1 muestra `C♯` y se llama `Do sostenido`.
  8. `'la tónica se comparte entre progresiones'`: con `Fa` en el ii–V–I y después `Blues de jazz`, `Fa` sigue marcado y el primer compás del carril dice `F7`.
  9. `'cambiar de progresión detiene la práctica'`: sonando y en la cuenta, como en T007 (9).
  10. `'la progresión se recuerda'`: elegir `Blues de jazz`, `unmount()` y otra `renderApp()`: sigue elegida.

  Correr `pnpm test --project ui` y **verlo fallar**.

- [x] T021 [US3] Implementar:
  - **`src/practice/store.ts`**:
    - `setProgression(id)`, que llama a `stop()` si `status !== 'stopped'` y después guarda el ajuste;
    - en `barAt`, los ataques del bajo pasan a `bassAttacks(meter, bassFigure, chords.map((chord) => chord.at))`.
  - **`src/components/settings-panel.tsx`**: en la sección `Progresión`, arriba de `Tonalidad`, un `<select aria-label="Progresión">` con el mismo marcado y las mismas clases que `Tipo de acorde`. Tiene un `<optgroup>` por grupo, en el orden de `PROGRESSIONS`, y opciones con `value` igual al id y texto igual a `name`.
  - **`src/components/lane.tsx`**: un compás de dos acordes muestra sus partes en fila (research §11):
    - cada hijo con `style={{ flexGrow: length }}` (golpes hasta el acorde siguiente), `[container-type:inline-size]` y el cifrado con `note-fit` y `--chars`;
    - entre las partes, una barra fina con `aria-hidden`.

    Un compás de un acorde se ve como hoy.

  - **`src/components/now.tsx`**: nada nuevo; `chordAt` con el golpe ya está (T006).

  **Verde completo**. **Commit**: `feat: biblioteca completa con medio compás (#31)`. Comentar en #31.

### Audio y pantalla angosta

- [x] T022 [US3] En `src/practice/progression.browser.test.ts`, agregar `test.each(['4/4', '3/4'])` `'en $meter, el cambio de mitad de compás cae a tiempo'`. Con `setMode('progression')`, `setProgression('turnaround')`, `setMeter(meter)`, `setWithChord(true)`, `setRepeats({ on: true, count: 1 })` y `setBpm(240)`, con un golpe de 0,25 s:
  - en 4/4, el bajo tiene 4 llamadas, `C2 A2 D2 G2`, en `t0 + 1 + {0, 2, 4, 6} × 0,25` s;
  - en 3/4, `t0 + 0,75 + {0, 2, 3, 5} × 0,25` s;
  - en los dos, a menos de 1 ms;
  - el acorde cae en los mismos tiempos, con una duración de 0,9 × `length` × 0,25 s (± 2 ms);
  - nada después.

  Si pasa al primer intento, hacer la comprobación de T009 con el `at` del segundo acorde. **Verde completo**. **Commit**: `test: el cambio de mitad de compás cae a tiempo (#31)`. Done: pasó al primer intento; sumar 1 al `at` del segundo acorde, en el bajo o en el acorde, lo hizo fallar y se deshizo.

- [x] T023 [US3] En `e2e/practice.spec.ts`, agregar `'los compases partidos caben a 320 px'` (falla si las partes desbordan):
  - a 320 × 640, en Ajustes: `Progresión`, `Coltrane (Giant Steps, avanzado)`, `Fa sostenido` y `Bajo + acorde`; cerrar y Play;
  - cada `[data-at]` del carril cumple `scrollWidth <= clientWidth`, y la página no tiene scroll horizontal.

  Si falla, ajustar el `--note-max` de las partes en `src/components/lane.tsx` hasta que quepan. **Verde completo**. **Commit**: `feat: los compases partidos caben en pantalla (#31)`. Done: pasó al primer intento en Chromium y WebKit (iphone), sin tocar `lane.tsx`; quitar `note-fit` de las partes lo hizo fallar y se deshizo.

- [ ] T024 [US3] Verificación manual: quickstart §2, filas 10–14.

**Checkpoint**: toda la biblioteca de jazz, pop, rock y latino suena y se ve, con sus compases partidos.

---

## Phase 5: User Story 4 · Ciclos por las 12 tonalidades (P4, #32)

**Goal**: el grupo Ciclos, con el ciclo de cuartas, el de quintas, el ii–V–I por las 12 y los dominantes encadenados. En los ciclos de solo raíces, el tipo de acorde lo elige el usuario.

**Independent Test**: quickstart §2, filas 15–17.

- [x] T025 [P] [US4] En `src/music/progressions.test.ts`, agregar (falla):
  - `'el grupo Ciclos va primero, con sus 4 progresiones'`: los primeros 4 `name` de `PROGRESSIONS` son los de Ciclos (Reglas), con `group: 'Ciclos'`.
  - En `'C'`, `text(barsOf(p, 'C', 4/4))`:
    - `ciclo-cuartas` → `'C | C | F | F | B♭ | B♭ | E♭ | E♭ | A♭ | A♭ | D♭ | D♭ | G♭ | G♭ | B | B | E | E | A | A | D | D | G | G'`;
    - `ciclo-quintas` → `'C | C | G | G | D | D | A | A | E | E | B | B | F♯ | F♯ | D♭ | D♭ | A♭ | A♭ | E♭ | E♭ | B♭ | B♭ | F | F'`;
    - `dominantes-encadenados` → `'E7 | A7 | D7 | G7 | Cmaj7 | Cmaj7'`.
  - `ii-v-i-12` en `'C'`: 48 compases. Los compases 1–4 son `Dm7 | G7 | Cmaj7 | Cmaj7`; el 5, `Gm7`; los 25–28, `A♭m7 | D♭7 | G♭maj7 | G♭maj7`; los 29–31, `C♯m7 | F♯7 | Bmaj7`. El tercer compás de cada grupo de 4 da las tónicas `C F B♭ E♭ A♭ D♭ G♭ B E A D G`.
  - Desde otra tónica:
    - `ciclo-cuartas` en `'F'` empieza en `F | F | B♭` y termina en `C | C`;
    - en `'Gb'`, el ciclo de cuartas empieza en `G♭` y el de quintas en `F♯`;
    - `dominantes-encadenados` en `'F'` es `'A7 | D7 | G7 | C7 | Fmaj7 | Fmaj7'`.
  - En `ciclo-cuartas` y `ciclo-quintas`, ningún acorde tiene `type`.
  - `keyLabel`: en `ciclo-cuartas` y `'F'`, `'desde Fa'`; en `ii-v-i-12` y `'C'`, `'desde Do'`; en `dominantes-encadenados` y `'F'`, `'Fa mayor'`.
  - El test de las 12 tónicas de T018 ya cubre las 4 nuevas sin cambios (sus ids se suman a la lista que recorre).

- [x] T026 [US4] En `src/music/progressions.ts`:
  - las 4 progresiones de FR-019, al principio de `PROGRESSIONS`, con `key: { tonic: 'C', type: 'major' }`:
    - `ciclo-cuartas`: `{ bars: 'C ×2', cycle: 'fourths', rootsOnly: true }`;
    - `ciclo-quintas`: `{ bars: 'C ×2', cycle: 'fifths', rootsOnly: true }`;
    - `ii-v-i-12`: `{ bars: 'Dm7 | G7 | Cmaj7 | Cmaj7', cycle: 'fourths' }`;
    - `dominantes-encadenados`: `{ bars: 'E7 | A7 | D7 | G7 | Cmaj7 | Cmaj7' }`.
  - La tabla de cuartas de research §5. `tonicOf` la usa con `cycle: 'fourths'`; con `'fifths'`, la `major`.
  - `barsOf` con `cycle` repite la unidad 12 veces. La k-ésima va transportada de `key.tonic` a la tónica de clase `tónica + k × (5 o 7)`, escrita con la tabla del ciclo. Con `rootsOnly`, los acordes van sin `type`.
  - `keyLabel` da `desde ${tonicOf(…).name}` con `cycle`.

  **Verde completo**. **Commit**: `feat: ciclos por las 12 tonalidades en la biblioteca (#32)`.

- [x] T027 [US4] Crear `src/cycles.test.tsx` (falla). Helpers como en T020, más `pickChordType(app, name)` con `user.selectOptions(panel.getByRole('combobox', { name: 'Tipo de acorde' }), name)`.
  1. `'el grupo Ciclos va primero'`: los `group` del `combobox` `Progresión` son `Ciclos`, `Jazz` y `Pop, rock y latino`, en ese orden, y `Ciclos` tiene las 4 opciones.
  2. `'el ciclo de cuartas desde Fa'`: con `Ciclo de cuartas` y `Fa`, Play y `fake.beat(5)`:
     - el carril tiene 24 `listitem`, desde `F F B♭ B♭` hasta `C C`;
     - con "Solo bajo", "Ahora" dice `F` y `Fa`;
     - la línea de estado, `Ciclo de cuartas · desde Fa · Analógico cálido · 60 BPM · 4/4`.
  3. `'en los ciclos de solo raíces, el tipo de acorde lo elige el usuario'`: con `Ciclo de cuartas`, `Fa` y `Bajo + acorde`:
     - aparece el `combobox` `Tipo de acorde`;
     - con `Cm7 · menor séptima`, Play y `fake.beat(4 + 2 × 4 + 1)`: "Ahora" dice `B♭m7`;
     - el `chord` del compás 1 es `voicingOf('F', 'm7')`, y el del 3, `voicingOf('Bb', 'm7', <los del 2>)`.
  4. `'en las demás progresiones no aparece el tipo de acorde'`: con `Blues de jazz` y `Bajo + acorde`, no hay `combobox` `Tipo de acorde`. Con `Ciclo de quintas`, sí.
  5. `'el ii–V–I por las 12 recorre 48 compases por cuartas'`: con `ii–V–I por las 12 tonalidades`, Play y `fake.beat(4 + 4 × 4 + 1)`:
     - el carril tiene 48 `listitem`;
     - el contador dice `Vuelta 1 · compás 5 de 48`, y "Ahora", `Gm7`;
     - la línea de estado, `ii–V–I por las 12 tonalidades · desde Do · Analógico cálido · 60 BPM · 4/4`.

  Correr `pnpm test --project ui` y **verlo fallar**.

- [x] T028 [US4] En `src/components/settings-panel.tsx`, `Tipo de acorde` aparece con `Bajo + acorde` si el modo es aleatorio o si la progresión elegida tiene `rootsOnly`. El store ya usa `chord.type ?? chordType` (T006), y la línea de estado, `keyLabel` (T008). **Verde completo**. **Commit**: `feat: ciclos por las 12 tonalidades (#32)`. Comentar en #32.

- [ ] T029 [US4] Verificación manual: quickstart §2, filas 15–17.

**Checkpoint**: las 4 historias están implementadas.

---

## Phase 6: Polish & cierre

- [x] T030 Pulido visual con el skill `frontend-design`, dentro de la dirección del diseño (§7.4):
  - las secciones `Modo` y `Progresión` (el `<select>` y la grilla de tónicas) con el lenguaje del panel;
  - los compases partidos del carril, legibles y con la barra entre partes;
  - la línea de estado con nombres largos (`ii–V–I por las 12 tonalidades · desde Fa sostenido · …`) a 320 px, sin desbordar.

  Ningún test se modifica. **Verde completo**. **Commit**: `feat: pulido visual del modo progresión (#5)`. Done: `Modo` y `Progresión` ya hablaban el lenguaje del panel, así que solo se unificó el estilo del `<select>`; el compás partido pone la raíz arriba y el sufijo debajo, con una barra de 2 px entre partes (a 320 px, en Giant Steps en Fa sostenido, la raíz pasó de 9,3 a 21,3 px y el sufijo de 5,6 a 10,5 px); la línea de estado usa `text-balance` y no desborda (2–3 líneas a 320 px).

- [ ] T031 Correr quickstart §1 completo y comparar el tamaño de `dist/assets/*.js` con el de T001; anotar la diferencia en research §1. Si algún hallazgo cambió una decisión, actualizar research.md. Commit solo si hay cambios (`docs: …`). Comentar en #5 el resumen de la entrega.
- [ ] T032 El usuario hace quickstart §2–§5: la prueba de oído de 10 minutos a 60 y 200 BPM y la sesión con la guitarra (SC-005). Si algo falla, se reabre el issue de esa historia.

---

## Dependencies & Execution Order

- **Setup (T001)** → historias.
- **Historias**: en el orden del spec, US1 → US2 → US3 → US4. Comparten `store.ts`, `settings-panel.tsx` y `progressions.ts`, así que van en secuencia:
  - US2 suma el transporte a `barsOf` (US1) y la sección `Progresión` del panel;
  - US3 suma el selector a esa sección, el compás partido y la biblioteca, que necesita el transporte de US2 para sus tests de 12 tónicas;
  - US4 suma los ciclos a la biblioteca y al selector de US3.
- **Dentro de US1**: biblioteca (T002–T003) → voces (T004–T005) → refactor (T006) → app (T007–T008) → audio (T009) → manual (T010). T006 necesita `RoundChord` de T003.
- **Polish (T030–T032)**: después de US4.

### Parallel Opportunities

- T002 (`progressions.test.ts`) y T004 (`chords.test.ts`): archivos distintos, sin dependencias.
- T016 (`meters.test.ts`) y T018 (`progressions.test.ts`).
- T023 (E2E) se puede escribir mientras se implementa T021.
- T025 (`progressions.test.ts`) mientras se hace la verificación manual T024.

### Parallel Example: User Story 1

```text
T002 Escribir src/music/progressions.test.ts  (el ii–V–I en Do, debe fallar)
T004 Escribir los tests de voces en src/music/chords.test.ts  (deben fallar)
```

## Implementation Strategy

- **MVP**: US1. Con eso ya se improvisa sobre un ii–V–I en loop, con el acorde ligado.
- **Incremental**: cada historia termina en verde, con commit, comentario en su issue y verificación manual, antes de pasar a la siguiente. Se puede parar después de cualquier checkpoint con la app funcionando.
- **Riesgos registrados**:
  - El refactor de la vuelta (T006) toca el modo aleatorio en `barAt`, el carril, "Ahora" y el contador. Si un test de las entregas 1 a 3 falla, se corrige el refactor, nunca el test.
  - Los compases partidos con cifrados largos en 320 px (T023): si `note-fit` no alcanza, se achica el `--note-max` de las partes.
  - El tamaño del bundle con tonal se mide en T031 (spike: 4,4 KB minificados).
