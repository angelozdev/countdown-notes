---
description: 'Lista de tareas de la Entrega 3 · Acordes en modo aleatorio'
---

# Tasks: Acordes en modo aleatorio (Entrega 3)

**Input**: Documentos de diseño en `specs/004-acordes-aleatorio/`: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/interfaces.md](./contracts/interfaces.md) y [quickstart.md](./quickstart.md).

**Tests**: se incluyen, porque la constitución exige test-first (principio I). Cada test se escribe primero y se ve fallar antes de implementar.

**Organización**: una fase por historia (sub-issue), en el orden del spec. No hay fase fundacional: el contrato del motor y los ajustes se extienden dentro de la historia que los usa (plan, Constitution Check II). Cada historia termina en una conducta que se prueba con la app abierta.

**Reglas que aplican a todas las tareas**:

- **Git**:
  - Todo en la rama `004-acordes-aleatorio`; nunca en `main` y nunca push.
  - Commit después de cada paso en verde, con el número de issue en el mensaje (por ejemplo, `#26`) y la línea de atribución de la sesión.
- **GitHub**: la sesión principal (nunca un subagente) comenta el avance en #26–#28 y #4 a medida que se cierra cada paso: commits, criterios en verde y lo que queda para la prueba manual. Los issues se cierran cuando la rama llega a `main`, con el comentario de lo pendiente (constitución v1.2.0).
- **Dependencias**: ninguna nueva (research §1). Si una tarea parece necesitar una, se consulta al usuario.
- **Tests**:
  - Nunca se debilita, salta ni borra un test para que pase. Si un test parece incorrecto, se consulta al usuario. Las únicas excepciones son las dos traducciones de research §3, en T006 y T007.
  - Los tests de UI usan `renderApp()` de `src/test/app.tsx` (monta `<App engine={fake.engine} />`) y buscan por rol y nombre accesible ([contracts](./contracts/interfaces.md) §4), nunca por clases ni por estructura.
  - Usan `userEvent.setup()` (viene en `renderApp`) y, para avanzar la música, `fake.beat(n)`, que avanza n golpes de metrónomo. A 4/4, `fake.beat(4)` toca la cuenta, y el siguiente `beat()` pide el compás 1 y toca su golpe 0.
  - Cada test tiene al menos un `expect`, porque `vitest/expect-expect` solo acepta `expect` y `screen.getBy*` como aserción.
  - Los tests del motor real van en `src/audio/tone-engine.browser.test.ts` y usan sus helpers `renderPractice(bpm, barAt, seconds, during?, mix?)` y `onsets(buffer, threshold, minGap)`.
- **Código**:
  - Formato de oxfmt: comillas simples, sin punto y coma, sin coma final, indentación de 2 espacios.
  - Nunca se usa `setTimeout` ni `setInterval` para el tiempo musical (constitución III).
  - Solo `src/main.tsx` y `src/audio/tone-engine.ts` importan `tone`. Los tests `*.browser.test.ts` también, porque prueban el motor real.
- **Verde** significa que pasan `pnpm lint`, `pnpm format:check`, `pnpm test`, `pnpm test:e2e` y `pnpm build`.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: se puede hacer en paralelo (otro archivo, sin depender de tareas pendientes).
- **[Story]**: la historia del spec (US1–US3). Entre paréntesis va su issue.

---

## Phase 1: Setup

**Purpose**: comprobar que la rama parte en verde.

- [x] T001 En la rama `004-acordes-aleatorio`, correr `pnpm install`, `pnpm lint`, `pnpm format:check`, `pnpm test`, `pnpm test:e2e` y `pnpm build`: los 6 en verde. Sin commit.

---

## Phase 2: User Story 1 · Bajo + acorde con tríadas (P1, #26) 🎯 MVP

**Goal**: en ajustes se elige "Solo bajo" o "Bajo + acorde" y una tríada. Cada compás de música ataca el acorde de su nota en voicing abierto y lo sostiene. "Ahora" muestra el cifrado y el nombre, el carril muestra cifrados, el acorde tiene su volumen, y la mezcla nunca pasa de 1,0.

**Independent Test**: quickstart §2, filas 1–6. Con "Bajo + acorde" y Cm, cada compás suena menor y "Ahora" dice, por ejemplo, `Fm` y `Fa menor`.

### La mezcla no satura (#22, #26)

- [x] T002 [US1] En `src/audio/tone-engine.browser.test.ts`, agregar dos tests. El borrador de la entrega 2 está en `.az-orchestrate/003-practica-comoda/i1-test-draft.patch`.
  - Escenario: 120 BPM, 4/4. El compás 0 es la cuenta (`countIn: true`, `clickEvents`). Los compases 1 y 2 tienen un click `'strong'` en cada golpe y un `bass` de `length: 4`, `'E1'` en el compás 1 y `'C2'` en el 2. Desde el compás 3, `undefined`. Render de 6,5 s.
  - `'con la mezcla por defecto, ninguna muestra pasa de 1'`: con `MIX`, alguna muestra pasa de 0,5 y todas cumplen `Math.abs(sample) <= 1`.
  - `'con los dos canales al máximo, ninguna muestra pasa de 1'`: lo mismo con `click` y `bass` en `volume: 100`.

  Correr `pnpm test --project audio` y **verlos fallar** en Chromium y WebKit: hoy, en 80, la suma da 1,22–1,32 (research §2).

- [x] T003 [US1] En `src/audio/tone-engine.ts`, agregar el soft clipper entre `output` y el destino (research §2):
  - `const shaper = new Tone.WaveShaper((x) => { const v = Math.abs(x) * 4; const y = v <= 0.8 ? v : 0.8 + 0.2 * Math.tanh((v - 0.8) / 0.2); return Math.sign(x) * y }, 8193).toDestination()` y `shaper.oversample = 'none'`;
  - `const quarter = new Tone.Gain(0.25).connect(shaper)`; `output` pasa de `.toDestination()` a `.connect(quarter)`;
  - `shaper` y `quarter` se suman a `nodes`. `stop` sigue silenciando `output`.

  Un comentario de una línea explica el 1/4: la entrada del `WaveShaper` se recorta a [−1, 1]. **Verde completo**: todos los tests de audio anteriores siguen pasando. **Commit**: `fix: la mezcla no satura (#22 #26)`. Comentar en #22 que su hueco conocido queda resuelto, con el commit.

### Tríadas: cifrado, nombre y voicing

- [x] T004 [P] [US1] Crear `src/music/chords.test.ts` (falla: el módulo no existe). Por API exportada ([contracts](./contracts/interfaces.md) §3):
  - Helper `midi(pitch)`: con `/^([A-G]b?)(\d)$/`, el índice de su id en `NOTES` más `12 × (octava + 1)`.
  - Tabla literal de las 6 tríadas, según FR-005 y FR-007:

    | id     | sufijo  | nombre                   | forma        |
    | ------ | ------- | ------------------------ | ------------ |
    | `maj`  | (vacío) | `mayor`                  | `[0, 7, 16]` |
    | `m`    | `m`     | `menor`                  | `[0, 7, 15]` |
    | `dim`  | `dim`   | `disminuido`             | `[0, 6, 15]` |
    | `aug`  | `aug`   | `aumentado`              | `[0, 8, 16]` |
    | `sus4` | `sus4`  | `con cuarta suspendida`  | `[0, 7, 17]` |
    | `sus2` | `sus2`  | `con segunda suspendida` | `[0, 7, 14]` |

  - Para cada una de las 12 `NOTES` y cada tríada (`test.each`):
    - `chordSymbol(note.id, id)` es `note.label + sufijo`;
    - `chordName(note.id, id)` es `` `${note.name} ${nombre}` ``;
    - `voicingOf(note.id, id).map(midi)` es la forma sumada a `48 + índice de la nota`;
    - todas las alturas quedan entre 48 (C3) y 76 (E5).
  - Casos sueltos: `chordSymbol('Gb', 'm')` es `'F♯m'`, `chordName('Gb', 'm')` es `'Fa sostenido menor'` y `voicingOf('C', 'maj')` es `['C3', 'G3', 'E4']`.

- [x] T005 [US1] Crear `src/music/chords.ts` según [data-model](./data-model.md) (Tipo de acorde) y [contracts](./contracts/interfaces.md) §3, por ahora con las 6 tríadas:
  - `ChordTypeId` con las 6 tríadas (crece en US2), `ChordFamily` con las 5 familias y `ChordType` (`id`, `family`, `suffix`, `name`, `forms`). Cada tríada tiene `family: 'Tríadas'` y una sola forma.
  - `CHORD_TYPES`, `CHORD_TYPE_BY_ID`, `chordSymbol`, `chordName` y `voicingOf`.
  - Altura de un MIDI: `` `${NOTES[midi % 12].id}${Math.floor(midi / 12) - 1}` ``.
  - Con una sola forma, `voicingOf` la suma a `48 + índice de la raíz en NOTES`.

  `pnpm test --project ui` **en verde**. **Commit**: `feat: tríadas con cifrado, nombre y voicing abierto (#26)`.

### El acorde en el motor

- [x] T006 [US1] En `src/audio/tone-engine.browser.test.ts`:
  - **Traducción (research §3)**: la constante `MIX` suma `chord: { volume: 80, muted: false }`.
  - Agregar tres tests. En todos, el compás 0 es la cuenta (`countIn: true`, `clickEvents`) a 60 BPM:
    1. `'el acorde ataca a tiempo y dura lo que dice length'`. El compás 1 tiene `{ at: 0, sound: { kind: 'chord', pitches: ['C3', 'G3', 'E4'], length } }`, y desde el 2 es `undefined`. Render de 9 s, con `length` 4 y con `length` 2.
       - Con `onsets(buffer, 1e-4, 0.5)`, el primer onset después de 3,9 s cae a menos de 1 ms de `found[0].time + 4`.
       - El RMS en [ataque + 2,6 s, ataque + 2,7 s] con `length: 2` es menos de la mitad que con `length: 4`.
    2. `'el acorde silenciado no suena'`. El mismo compás 1 con `length: 4` y `{ ...MIX, chord: { volume: 80, muted: true } }`: desde 3,9 s, toda muestra cumple `Math.abs(sample) <= 1e-4`.
    3. `'con el acorde, la mezcla tampoco pasa de 1'`. El escenario de T002, más un `chord` de 5 notas (`['E3', 'G3', 'B3', 'D4', 'Gb4']`, `length: 4`) en los compases 1 y 2, con `MIX` y con los tres canales en 100. Alguna muestra pasa de 0,5 y todas cumplen `<= 1`.

  Correr `pnpm test --project audio` y **verlos fallar**: el motor todavía no conoce `kind: 'chord'`.

- [x] T007 [US1] Canal y cadena del acorde (Analógico cálido):
  - En `src/audio/engine.ts`, según [contracts](./contracts/interfaces.md) §2:
    - `Sound` suma `{ kind: 'chord'; pitches: string[]; length: number }`, con el comentario de las alturas;
    - `Channel` pasa a `'click' | 'bass' | 'chord'`;
    - el comentario de `Mix` dice que, en el acorde, 80 es el bus de −4 dB del Anexo A.
  - En `src/audio/tone-engine.ts`:
    - `BASE_DB` suma `chord: -4` y `CHANNELS` suma `'chord'`; `channels` arma también `chord: channel('chord')`.
    - Después de `await Tone.start()` y del `dispose` de los nodos anteriores, crea la cadena del acorde (diseño, Anexo A) y espera `await reverb.ready` antes de leer `initial = latestMix`, para que un `setMix` que llegue durante la espera no se pierda:
      - `new Tone.Reverb({ decay: 2.5, wet: 0.3 }).connect(channels.chord.mute)`;
      - `new Tone.Chorus({ frequency: 0.8, delayTime: 3.5, depth: 0.6, wet: 0.5 }).connect(reverb).start()`;
      - `new Tone.Filter(1400, 'lowpass').connect(chorus)`;
      - `new Tone.PolySynth(Tone.Synth, { oscillator: { type: 'fatsawtooth', count: 3, spread: 20 }, envelope: { attack: 0.04, decay: 0.6, sustain: 0.5, release: 1.5 }, volume: -18 }).connect(filter)`.
    - Los cuatro nodos se suman a `nodes`.
    - `play` pasa del `if/else` a una rama por `sound.kind`. Para `'chord'`: `chord.triggerAttackRelease(sound.pitches, transport.toSeconds(`${Math.round(sound.length * perBeat * 0.9)}i`), time)`, con el mismo 90 % del bajo.
  - En `src/practice/settings.ts`, `DEFAULT_SETTINGS.mix` suma `chord: { volume: 80, muted: false }` y `settingsSchema` suma `chord: channel(D.mix.chord)` en `mix`. Hace falta porque `Mix` exige los tres canales.
  - **Traducción (research §3)**: en `src/mix.test.tsx`, el valor esperado de `'Play arranca con la mezcla del panel'` suma `chord: { volume: 80, muted: false }`.

  **Verde completo**. **Commit**: `feat: canal y cadena del acorde en el motor (#26)`.

### Bajo + acorde en la app

- [x] T008 [US1] Crear `src/chords.test.tsx` (falla). Helpers locales:
  - `NAMES`, la misma tabla de `src/random-mode.test.tsx` (id → `[label, name]`);
  - `chordsOf(fake, bar)`, los `chord` de `fake.played` de ese compás;
  - `rootOf(fake, bar)`, el id de la raíz, sacado del `pitch` del primer `bass` de ese compás (`'Gb2'` → `'Gb'`);
  - `pickSound(app, name)`, que abre el panel, toca el radio `name` del `radiogroup` `Qué suena` y lo cierra.

  Los tests:
  1. `'empieza en Solo bajo, sin selector ni volumen del acorde'`:
     - el `radiogroup` `Qué suena` tiene los radios `Solo bajo` y `Bajo + acorde`, con `Solo bajo` marcado;
     - no hay `combobox` `Tipo de acorde` ni `slider` `Volumen del acorde`;
     - con Play y `fake.beat(4 + 4 * 2)`, ningún evento de `fake.played` es `kind: 'chord'`.
  2. `'con Bajo + acorde, la tríada mayor por defecto y un acorde por compás'`:
     - el `combobox` `Tipo de acorde` tiene el valor `'maj'` y un `group` `Tríadas` con las opciones `C · mayor`, `Cm · menor`, `Cdim · disminuido`, `Caug · aumentado`, `Csus4 · con cuarta suspendida` y `Csus2 · con segunda suspendida`, en ese orden;
     - con Play y `fake.beat(4 + 4 * 3)`, el compás 0 no tiene `chord` y los compases 1, 2 y 3 tienen uno cada uno, en `beat` 0, con `length: 4`;
     - sus `pitches` son la tríada mayor abierta de su raíz: los MIDI `48 + i`, `55 + i` y `64 + i`, con `i` el índice de la raíz en `NOTES`, pasados a alturas con la fórmula de T005.
  3. `'"Ahora" y el carril muestran el cifrado y el nombre'`:
     - con `Bajo + acorde` y `Cm · menor`, Play y `fake.beat(4 + 1)`;
     - la `region` `Ahora` muestra `` `${label}m` `` y `` `${name} menor` `` de la raíz del compás 1;
     - el `listitem` con `aria-current="true"` del `list` `Carril` tiene ese mismo `textContent`, y cada `listitem` cumple `/^(C|D♭|D|E♭|E|F|F♯|G|A♭|A|B♭|B)m$/`;
     - después de `fake.beat(4 * 22)` (la última nota de la vuelta), la vista previa cumple `/^Vuelta 2: (C|D♭|…|B)m$/`.
  4. `'un cambio de tipo a mitad de compás aplica desde el compás siguiente'`:
     - con `Bajo + acorde` (mayor), Play y `fake.beat(4 + 2)`;
     - con `user.selectOptions`, elegir `Cm · menor`;
     - "Ahora" sigue con el cifrado mayor;
     - `fake.beat(2 + 1)`: "Ahora" muestra el menor, el `chord` del compás 1 tiene la tercera mayor (`64 + i`) y el del compás 2 la menor (`63 + i`).
  5. `'pasar a Solo bajo a mitad de compás quita el acorde desde el compás siguiente'`:
     - lo mismo con el radio `Solo bajo`;
     - el compás 2 no tiene `chord`, y "Ahora" vuelve a mostrar la nota (`label` y `name`, como en la entrega 2).
  6. `'el volumen y el silencio del acorde cambian sin detener la música'`:
     - con `Bajo + acorde`, los `slider` del panel son, en orden, `Volumen del bajo`, `Volumen del acorde` y `Volumen del metrónomo`; el del acorde está en 80 y `Silenciar acorde` tiene `aria-pressed="false"`;
     - mientras suena, `{ArrowLeft}` sobre `Volumen del acorde` deja `fake.mix.chord.volume` en 79;
     - tocar `Silenciar acorde` deja `fake.mix.chord.muted` en `true`, y `fake.running` sigue en `true`.
  7. `'los ajustes del acorde se recuerdan'`: con `Bajo + acorde`, `Cm · menor` y el volumen del acorde en 79, desmontar (`unmount`) y montar otra `renderApp()`. El radio `Bajo + acorde` está marcado, el `combobox` vale `'m'` y el slider del acorde está en 79.
  8. `'un dato guardado por la entrega 2 se conserva y suma los ajustes nuevos'`:
     - escribir `localStorage['countdown-notes:ajustes']` con `{ version: 1, settings: { …DEFAULT_SETTINGS de la entrega 2 con bpm: 90, mix: { click, bass } } }`, sin `withChord`, `chordType` ni `mix.chord`;
     - con `renderApp()`, el BPM es 90 y `Qué suena` está en `Solo bajo`;
     - al elegir `Bajo + acorde`, el tipo es `'maj'` y el volumen del acorde, 80.

  Correr `pnpm test --project ui` y **verlo fallar**.

- [x] T009 [US1] Implementar, según [data-model](./data-model.md):
  - **`src/practice/settings.ts`**:
    - `Settings` suma `withChord: boolean` y `chordType: ChordTypeId`;
    - `DEFAULT_SETTINGS` suma `withChord: false` y `chordType: 'maj'`;
    - `settingsSchema` suma `withChord: z.boolean().catch(D.withChord)` y `chordType: z.enum(CHORD_TYPES.map((type) => type.id)).catch(D.chordType)`.
  - **`src/practice/store.ts`**:
    - `PracticeState` suma `withChord`, `chordType`, `sounding: { chordType: ChordTypeId | null } | null`, `setWithChord(withChord)` y `setChordType(type)`. `style` llega en US3;
    - un `Map<number, { chordType: ChordTypeId | null }>` en el closure (`planned`);
    - en `barAt`, para un compás de música, se leen `withChord` y `chordType` junto con la figura. Con `withChord`, se suma `{ at: 0, sound: { kind: 'chord', pitches: voicingOf(round.notes[index], chordType), length: meter.beats } }` después del bajo (el `sort` estable deja el orden click, bajo, acorde), y se guarda `planned.set(bar, { chordType: withChord ? chordType : null })`;
    - en `onBeat`, con `beat === 0`, si `planned` tiene el compás, `sounding` toma ese valor y se borra del `Map`;
    - `play` y `stop` dejan `sounding: null` y vacían `planned`.
  - **`src/components/settings-panel.tsx`**:
    - una `Section` `Sonido` entre `Tiempo` y `Bajo` ([contracts](./contracts/interfaces.md) §4, research §10);
    - adentro, el `ToggleGroup` `Qué suena` (`Solo bajo` → `false`, `Bajo + acorde` → `true`), con el estilo de `MeterPicker`;
    - con `withChord`, un `<select aria-label="Tipo de acorde">` con un `<optgroup label={familia}>` por cada familia que tenga tipos en `CHORD_TYPES`, en orden, y una `<option value={id}>` por tipo con el texto `` `${chordSymbol('C', id)} · ${name}` ``; se le da un estilo simple, del alto de los otros controles;
    - en `Volumen`, `CHANNELS` suma `{ id: 'chord', label: 'Acorde', slider: 'Volumen del acorde', mute: 'Silenciar acorde' }` entre el bajo y el metrónomo, y se filtra cuando `withChord` es `false`.
  - **`src/components/now.tsx`**: si `sounding?.chordType`, muestra `chordSymbol(id, chordType)` en el `note-label` y `chordName(id, chordType)` debajo; si no, como hoy.
  - **`src/components/lane.tsx`**:
    - el compás actual usa `sounding`, como "Ahora";
    - los demás, y la vista previa `Vuelta {n}: …`, usan `withChord ? chordSymbol(nota, chordType) : label`.

  **Verde completo**. **Commit**: `feat: bajo + acorde con tríadas (#26)`. Comentar en #26 los criterios en verde y lo que queda para T010.

- [ ] T010 [US1] Verificación manual: quickstart §2, filas 1–6, con `pnpm dev`.

**Checkpoint**: se practica con tríadas sobre la vuelta; la mezcla no satura con ningún volumen.

---

## Phase 3: User Story 2 · Vocabulario completo de jazz con voicings (P2, #27)

**Goal**: el selector ofrece los 25 tipos, agrupados en 5 familias. Los de 4 notas o más suenan sin la raíz, en el registro C3–E5. El cifrado más largo cabe desde 320 px.

**Independent Test**: quickstart §2, filas 7–9. Cm7, C7alt y C13 suenan distintos y sin raíz, y `F♯m(maj7)` cabe a 320 px.

- [ ] T011 [US2] Escribir dos tests que fallan antes del código:
  - **`src/music/chords.test.ts`**: extender la tabla literal a los 25 tipos de FR-005, en su orden. Para los 19 nuevos, en lugar de la forma, cada fila trae las clases que exige FR-008, en semitonos desde la raíz:

    | id      | sufijo    | nombre                          | clases obligatorias               |
    | ------- | --------- | ------------------------------- | --------------------------------- |
    | `6`     | `6`       | `sexta`                         | 4, 9                              |
    | `m6`    | `m6`      | `menor sexta`                   | 3, 9                              |
    | `69`    | `6/9`     | `sexta novena`                  | 4, 9, 2                           |
    | `maj7`  | `maj7`    | `séptima mayor`                 | 4, 11                             |
    | `m7`    | `m7`      | `menor séptima`                 | 3, 10                             |
    | `7`     | `7`       | `séptima`                       | 4, 10                             |
    | `m7b5`  | `m7♭5`    | `semidisminuido`                | 3, 6, 10                          |
    | `dim7`  | `°7`      | `disminuido séptima`            | 3, 6, 9                           |
    | `mMaj7` | `m(maj7)` | `menor séptima mayor`           | 3, 11                             |
    | `7sus4` | `7sus4`   | `séptima con cuarta suspendida` | 5, 10 (y sin la 4)                |
    | `maj9`  | `maj9`    | `novena mayor`                  | 4, 11, 2                          |
    | `m9`    | `m9`      | `menor novena`                  | 3, 10, 2                          |
    | `9`     | `9`       | `novena`                        | 4, 10, 2                          |
    | `m11`   | `m11`     | `menor oncena`                  | 3, 10, 5                          |
    | `13`    | `13`      | `trecena`                       | 4, 10, 9                          |
    | `7b9`   | `7♭9`     | `séptima novena bemol`          | 4, 10, 1                          |
    | `7#9`   | `7♯9`     | `séptima novena sostenida`      | 4, 10, 3                          |
    | `7#11`  | `7♯11`    | `séptima oncena sostenida`      | 4, 10, 6                          |
    | `7alt`  | `7alt`    | `séptima alterada`              | 4, 10, una de 1 o 3, una de 6 o 8 |

    Para cada raíz y cada uno de esos 19 tipos, se comprueban el cifrado y el nombre, como en las tríadas, y además:
    - el voicing tiene de 3 a 5 notas, de grave a agudo;
    - ninguna nota es de la clase de la raíz;
    - tiene todas las clases obligatorias (`(midi − raíz) % 12`);
    - todas las alturas quedan entre 48 y 76.

    Los 300 casos van en un `test.each`. Casos sueltos: `chordSymbol('Bb', 'm7b5')` es `'B♭m7♭5'`, `chordName('Bb', 'm7b5')` es `'Si bemol semidisminuido'` y `voicingOf('Gb', 'm7')` es `['A3', 'Db4', 'E4']` (data-model).

  - **`src/chord-types.test.tsx`**:
    - con `Bajo + acorde`, los `group` dentro del `combobox` `Tipo de acorde` se llaman, en orden, `Tríadas`, `Sextas`, `Séptimas`, `Extensiones` y `Dominantes alterados`, y sus opciones son las 25 de FR-005, en orden, con el texto `{cifrado sobre Do} · {nombre}` (por ejemplo, `Cm7♭5 · semidisminuido`, `C°7 · disminuido séptima` y `C7alt · séptima alterada`). Si jsdom no les da nombre a los `optgroup`, se consulta al usuario antes de buscarlos de otra forma;
    - `'"Ahora" muestra el cifrado y el nombre de un tipo de séptima'`: con `Cm7♭5 · semidisminuido`, Play y `fake.beat(4 + 1)`, "Ahora" muestra `` `${label}m7♭5` `` y `` `${name} semidisminuido` `` de la raíz del compás 1.

  Correr `pnpm test --project ui` y **verlos fallar**.

- [ ] T012 [US2] En `src/music/chords.ts`:
  - sumar los 19 tipos a `ChordTypeId` y a `CHORD_TYPES`, con su familia, sufijo, nombre y las formas A y B de research §5;
  - en `voicingOf`, con dos formas, aplicar la ubicación de research §5: para cada forma y cada desplazamiento de octava de la raíz (`raíz = índice + 12k`), las que caen enteras en 48–76; gana la de altura media más cercana a 60, y la A en caso de empate. Las tríadas siguen con su forma fija.

  El `<select>` de T009 ya agrupa por familia. **Verde completo**. **Commit**: `feat: vocabulario completo de jazz con voicings (#27)`.

- [ ] T013 [US2] En `e2e/practice.spec.ts`, agregar un `test.describe` con `test.use({ viewport: { width: 320, height: 640 } })` y el test `'el cifrado más largo cabe a 320 px'` (falla):
  - en Ajustes: BPM 240, `Excluir naturales`, y apagar `D♭`, `E♭` y `A♭`, para que queden F♯ y B♭;
  - `Bajo + acorde` y la opción `Cm(maj7) · menor séptima mayor`; cerrar el panel y tocar Play;
  - esperar que la `region` `Ahora` contenga `m(maj7)`;
  - el texto del cifrado en "Ahora" y cada `listitem` del `list` `Carril` cumplen `scrollWidth <= clientWidth` (con `evaluate`), y la caja del cifrado queda entre 0 y 320 px.

  Correr `pnpm test:e2e` y **verlo fallar** (hoy el `note-label` del carril tiene un tamaño fijo).

- [ ] T014 [US2] En `src/components/now.tsx` y `src/components/lane.tsx`, achicar `--note-size` según el largo del cifrado (research §6):
  - en "Ahora", con `cqw` del contenedor que ya existe;
  - en cada compás del carril, con un contenedor de ancho propio (`[container-type:inline-size]`) y `cqw`.

  Con las notas sueltas de la entrega 2, el tamaño no cambia. **Verde completo**. **Commit**: `feat: el cifrado largo cabe en pantalla (#27)`. Comentar en #27.

- [ ] T015 [US2] Verificación manual: quickstart §2, filas 7–9, con `pnpm dev`.

**Checkpoint**: los 25 tipos suenan y se leen bien, también en un celular angosto.

---

## Phase 4: User Story 3 · Segundo estilo: Pad ambiental y selector de estilo (P3, #28)

**Goal**: en ajustes se elige Analógico cálido o Pad ambiental. El estilo aplica al bajo y al acorde desde el compás siguiente, sin cortar la caída del anterior, y la línea de estado lo muestra.

**Independent Test**: quickstart §2, filas 10–13. Con Pad, el acorde entra lento; al cambiar de estilo mientras suena, la cola del anterior termina sola.

- [ ] T016 [US3] En `src/audio/tone-engine.browser.test.ts`, agregar tres tests (fallan). Usan un helper `rms(buffer, from)`: el RMS del canal 0 en [from, from + 0,02 s].
  1. `'el bajo y el acorde de un compás suenan con su estilo'`. Cuenta (`clickEvents`, `countIn`) a 60 BPM y un compás 1 con `style` `'warm'` o `'pad'`. Cuatro renders: solo un `chord` `['C3', 'G3', 'E4']` de `length: 4`, o solo un `bass` `'C2'` de `length: 4`, en cada estilo. Con `t` el inicio del compás 1 (`found[0].time + 4`):
     - acorde: `rms(t + 0.05) / rms(t + 1.5)` es mayor que 0,8 en `'warm'` y menor que 0,3 en `'pad'`;
     - bajo: `rms(t + 0.01) / rms(t + 0.5)` es mayor que 0,8 en `'warm'` y menor que 0,3 en `'pad'`.
  2. `'cambiar de estilo no corta lo que sigue sonando'`. El compás 1 en `'warm'` y el 2 en `'pad'`, los dos con el `chord` de arriba. Con `t2` el inicio del compás 2, `rms(t2 + 0.02)` es más del 30 % de `rms(t2 - 0.04)`.
  3. `'con el Pad, la mezcla tampoco pasa de 1'`. El escenario del test 3 de T006, con `style: 'pad'` en los compases 1 y 2, con `MIX` y con los tres canales en 100.

  Correr `pnpm test --project audio` y **verlos fallar** (hoy `Bar` no tiene `style`).

- [ ] T017 [US3] Estilos en el motor:
  - En `src/audio/engine.ts`, sumar `export type Style = 'warm' | 'pad'` y `Bar.style?: Style`, con el comentario de [contracts](./contracts/interfaces.md) §2.
  - En `src/audio/tone-engine.ts`:
    - armar el bajo y la cadena del acorde de cada estilo en un `Record<Style, { bass; chord }>`, con los parámetros de research §4 (Anexo A). El Pad usa `MonoSynth` triangle con `volume: -4`, y su cadena `Reverb({ decay: 6, wet: 0.5 })`, `Chorus({ frequency: 0.4, delayTime: 4, depth: 0.8, wet: 0.6 })`, `Filter(1100, 'lowpass')` y `PolySynth` `fattriangle` (`count: 3`, `spread: 30`, envolvente `{ attack: 0.8, decay: 1, sustain: 0.8, release: 3 }`, `volume: -10`);
    - los dos `PolySynth` llevan `maxPolyphony: 64`, con un comentario de una línea con el porqué (research §4);
    - esperar los dos `reverb.ready` con `Promise.all`;
    - `play` recibe el estilo del compás (`plan.style ?? 'warm'`) y toca en el sintetizador de ese estilo;
    - todos los nodos nuevos van en `nodes`.

  **Verde completo**. **Commit**: `feat: estilo Pad ambiental en el motor (#28)`.

- [ ] T018 [US3] Crear `src/styles.test.tsx` (falla):
  1. `'empieza en Analógico cálido'`: el `radiogroup` `Estilo` tiene `Analógico cálido` y `Pad ambiental`, con el primero marcado, y la línea de estado dice `Aleatorio · Analógico cálido · 60 BPM · 4/4`.
  2. `'con la música detenida, la línea de estado muestra el estilo elegido'`: al elegir `Pad ambiental`, dice `Aleatorio · Pad ambiental · 60 BPM · 4/4`.
  3. `'un cambio de estilo a mitad de compás aplica desde el compás siguiente'`:
     - Play y `fake.beat(4 + 2)`: `fake.bars[1].style` es `'warm'`;
     - al elegir `Pad ambiental`, la línea de estado sigue con `Analógico cálido`;
     - `fake.beat(2 + 1)`: `fake.bars[2].style` es `'pad'` y la línea de estado dice `Pad ambiental`.
  4. `'el estilo se recuerda'`: elegir `Pad ambiental`, desmontar y montar otra `renderApp()`: sigue marcado `Pad ambiental`.

  Correr `pnpm test --project ui` y **verlo fallar**.

- [ ] T019 [US3] Implementar:
  - **`src/practice/settings.ts`**: `style: Style` (`'warm'`), con `z.enum(['warm', 'pad']).catch(D.style)`.
  - **`src/practice/store.ts`**:
    - `style`, `setStyle` y `sounding.style`;
    - en `barAt`, cada compás de música lleva `style` y `planned` guarda también el estilo.
  - **`src/components/settings-panel.tsx`**: el `ToggleGroup` `Estilo` (`Analógico cálido` → `'warm'`, `Pad ambiental` → `'pad'`) en la sección `Sonido`.
  - **`src/practice/store.ts`** también exporta `STYLE_LABELS: Record<Style, string>` (`Analógico cálido`, `Pad ambiental`), junto a `NOT_ENOUGH_NOTES`; el panel y la línea de estado lo usan.
  - **`src/App.tsx`**: `StatusLine` muestra `STYLE_LABELS[status !== 'stopped' ? (sounding?.style ?? style) : style]` en lugar del texto fijo.

  **Verde completo**. **Commit**: `feat: selector de estilo (#28)`. Comentar en #28.

- [ ] T020 [US3] Verificación manual: quickstart §2, filas 10–14, con `pnpm dev`, y §3 en el iPhone. Si el iPhone tiene cortes, registrar el plan B en research §4 antes de implementarlo.

**Checkpoint**: las 3 historias están implementadas.

---

## Phase 5: Polish & cierre

- [ ] T021 Pulido visual con el skill `frontend-design`, dentro de la dirección del diseño (§7.4):
  - la sección `Sonido` y el `<select>` con el mismo lenguaje del panel (alto, tipografía y foco);
  - el cifrado largo y el nombre largo en "Ahora", legibles a 1–2 m;
  - los cifrados del carril.

  Ningún test se modifica. **Verde completo**. **Commit**: `feat: pulido visual de la sección Sonido (#4)`.

- [ ] T022 Correr quickstart §1 completo. Si algún hallazgo cambió una decisión, actualizar research.md. Sin commit si no hay cambios. Comentar en #4 el resumen de la entrega.
- [ ] T023 El usuario hace quickstart §2–§5: la prueba de oído de los niveles y de los voicings, el Pad en el iPhone y el corte del Pad al final (research §12). Si algo falla, se reabre el issue de esa historia.

---

## Dependencies & Execution Order

- **Setup (T001)** → historias.
- **Historias**: en el orden del spec, US1 → US2 → US3. Comparten `store.ts`, `settings-panel.tsx`, `engine.ts` y `tone-engine.ts`, así que van en secuencia:
  - US2 extiende `chords.ts` y el `<select>` de US1;
  - US3 usa la cadena del acorde de US1.
- **Dentro de US1**: clipper (T002–T003) → tríadas (T004–T005) → motor (T006–T007) → app (T008–T009) → manual (T010).
- **Polish (T021–T023)**: después de US3.

### Parallel Opportunities

- T004 (`chords.test.ts`) se puede escribir mientras corren T002–T003, porque es otro archivo.
- Los dos tests de T011 (`chords.test.ts` y `chord-types.test.tsx`).
- T013 (E2E) se puede escribir mientras se implementa T012.

### Parallel Example: User Story 1

```text
T002 Tests del tope de la mezcla        (src/audio/tone-engine.browser.test.ts, deben fallar)
T004 Escribir src/music/chords.test.ts  (tríadas, debe fallar)
```

## Implementation Strategy

- **MVP**: US1. Con eso ya se improvisa sobre tríadas con el acorde sonando, y la mezcla deja de saturar.
- **Incremental**: cada historia termina en verde, con commit, comentario en su issue y verificación manual, antes de pasar a la siguiente. Se puede parar después de cualquier checkpoint con la app funcionando.
- **Riesgos registrados**:
  - Los niveles del acorde y del bajo del Pad salen del Anexo A y del spike, no del oído (research §4). Se afinan en T023.
  - La CPU del iPhone con dos reverbs: plan B en research §4 (T020).
  - El corte de la cola del Pad al terminar: research §12 (T023).
