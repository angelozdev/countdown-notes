---
description: 'Lista de tareas de la Entrega 5 · Progresiones propias'
---

# Tasks: Progresiones propias (Entrega 5)

**Input**: Documentos de diseño en `specs/006-progresiones-propias/`: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/interfaces.md](./contracts/interfaces.md) y [quickstart.md](./quickstart.md).

**Tests**: se incluyen, porque la constitución exige test-first (principio I). Cada test se escribe primero y se ve fallar antes de implementar.

**Organización**: una fase por historia (sub-issue), en el orden del spec. No hay fase fundacional ni pasos de una sola capa. Las dos extracciones de componentes (`TonicPicker` en T017 y `ChordTypeSelect` en T024) van dentro del paso que las usa por segunda vez. Cada historia termina en una conducta que se prueba con la app abierta.

**Reglas que aplican a todas las tareas**:

- **Decisión pendiente**: el esquema de T013 es la recomendación de research §1 (plan, decisión 1). **Antes de empezar T013, se confirma con el usuario.** Si elige otra opción, se reescribe T013 con ella.
- **Git**:
  - Todo en la rama `006-progresiones-propias`; nunca en `main` y nunca push.
  - Commit después de cada paso en verde, con el número de issue en el mensaje (por ejemplo, `#33`) y la línea de atribución de la sesión.
- **GitHub**: la sesión principal (nunca un subagente) comenta el avance en #33–#36 y #6 a medida que se cierra cada paso: commits, criterios en verde y lo que queda para la prueba manual. Los issues se cierran cuando la rama llega a `main`, con el comentario de lo pendiente (constitución v1.2.0).
- **Dependencias**: ninguna nueva, ni componentes nuevos de shadcn (research §12). Si una tarea parece necesitar una, se consulta al usuario.
- **Tests**:
  - Nunca se debilita, salta ni borra un test para que pase. Si un test parece incorrecto, se consulta al usuario. Ningún test existente cambia en esta entrega.
  - Los tests de UI usan `renderApp()` de `src/test/app.tsx` (monta `<App engine={fake.engine} />`) y buscan por rol, nombre y descripción accesibles ([contracts](./contracts/interfaces.md) §4), nunca por clases ni por estructura. La única excepción es `data-at` en las partes de un compás partido.
  - No hay `jest-dom`: se comprueba con `expect` sobre atributos y propiedades (`button.disabled`, `getAttribute('aria-invalid')`, `textarea.value`). La descripción accesible se busca con la opción `description` de `getByRole`.
  - Usan `userEvent.setup()` (viene en `renderApp`) y, para avanzar la música, `fake.beat(n)`, que avanza n golpes de metrónomo. En 4/4, `fake.beat(4)` toca la cuenta, y el siguiente `beat()` pide el compás 1 y toca su golpe 0. El compás `b` (≥ 1) empieza después de `fake.beat(4 + 4 × (b − 1))`.
  - `fake.bars` son los `Bar` que devolvió `barAt`, en orden. Cada Play agrega primero su cuenta de entrada. Para comparar dos Play, se toma `fake.bars.length` antes de cada uno y se compara lo que vino después, sin la cuenta.
  - Cada test tiene al menos un `expect`, porque `vitest/expect-expect` solo acepta `expect` y `screen.getBy*` como aserción.
  - `src/test/setup.ts` borra `localStorage` después de cada test. Para escribir datos guardados a mano, se hace antes de `renderApp()`:
    - ajustes: `localStorage.setItem('countdown-notes:ajustes', JSON.stringify({ version: 1, settings }))`;
    - progresiones: `localStorage.setItem('countdown-notes:progresiones', JSON.stringify({ version: 1, progressions }))`.
  - Para "reabrir la app" dentro de un test: `unmount()` y otro `renderApp()`.
  - Los tests del proyecto `audio` (`*.browser.test.ts`) corren en Chromium y WebKit.
- **Código**:
  - Formato de oxfmt: comillas simples, sin punto y coma, sin coma final, indentación de 2 espacios.
  - Nunca se usa `setTimeout` ni `setInterval` para el tiempo musical (constitución III).
  - Solo `src/main.tsx` y `src/audio/tone-engine.ts` importan `tone`, además de los tests `*.browser.test.ts`. tonal solo lo importan `src/music/progressions.ts` y `src/music/progression-text.ts` (este último, solo `simplify`).
  - El motor (`src/audio/engine.ts`, `tone-engine.ts`) y el motor falso (`src/test/fake-engine.ts`) no cambian (research §6).
- **Textos exactos** (lo que buscan los tests; `–` es la raya corta U+2013 y `«»` son comillas latinas):
  - **Botones**: `Nueva progresión`, `Editar progresión`, `Listo`, `Guardar`, `Descartar cambios`, `Seguir editando`, `Agregar compás`, `Quitar`, `Duplicar`, `Partir`, `Unir`, `Borrar progresión`, `Borrar`, `Cancelar`.
  - **Pantalla, campos y listas**: `main` `Editor de progresiones`; `textbox` `Acordes` y `Nombre`; `list` `Compases`; `radiogroup` `Tonalidad de origen`, `Tipo de tonalidad` (radios `Mayor`, `Menor`) y `Raíz`.
  - **Diálogos**: `Cambios sin guardar`, `¿Borrar «{nombre}»?`, `Compás {n}` y `Compás {n}, parte {k}`.
  - **Botón de un compás**: `Compás {n}: {cifrado}`; en un compás partido, `Compás {n}, parte {k}: {cifrado}`.
  - **Mensajes de error**: `No reconozco «{palabra}».`, `Un compás tiene uno o dos acordes: «{compás}».`, `Hay un compás vacío entre dos barras.` y `Escribe al menos un acorde.`
  - **Grupo del selector**: `Mis progresiones`. **Nombre por defecto**: `Progresión {N}`.
- **Verde** significa que pasan `pnpm lint`, `pnpm format:check`, `pnpm test`, `pnpm test:e2e` y `pnpm build`.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: se puede hacer en paralelo (otro archivo, sin depender de tareas pendientes).
- **[Story]**: la historia del spec (US1–US4). Entre paréntesis va su issue.

---

## Phase 1: Setup

**Purpose**: comprobar que la rama parte en verde.

- [x] T001 En la rama `006-progresiones-propias`, correr `pnpm install`, `pnpm lint`, `pnpm format:check`, `pnpm test`, `pnpm test:e2e` y `pnpm build`: los 6 en verde. Anotar el tamaño de `dist/assets/*.js` que imprime `pnpm build`, para comparar en T034. Sin commit.

---

## Phase 2: User Story 1 · Escribir una progresión como texto (P1, #33) 🎯 MVP

**Goal**: en ajustes, "Nueva progresión" abre el editor. Se escribe `Dm7 G7 Cmaj7 Cmaj7`, el carril del editor se llena, y al guardar, la progresión queda elegida y suena como el ii–V–I de la biblioteca. Un acorde no reconocido se marca y no deja guardar. "Listo" pregunta si hay cambios sin guardar. En esta historia se guarda en memoria; en el dispositivo, en US2.

**Independent Test**: quickstart §2, filas 1–6.

### El lector de texto

- [x] T002 [P] [US1] Crear `src/music/progression-text.test.ts` (falla: el módulo no existe). Por API exportada ([contracts](./contracts/interfaces.md) §3, todo salvo lo marcado US4):
  - Helper `tonal(label)`: `label` con `♭` → `b` y `♯` → `#` (`'F♯'` → `'F#'`).
  - `test.each` sobre los 25 `CHORD_TYPES` por las 12 `NOTES`. Para cada tipo `t` y nota `n`:
    - `parseProgression(n.label + t.suffix)` es `{ bars: [[{ root: tonal(n.label), type: t.id }]] }`;
    - el mismo resultado con la versión ASCII, con `♭` → `b` y `♯` → `#` en la raíz y en el sufijo (`Bbm7b5`);
    - `formatProgression` de esos `bars` es `chordSymbol(n.id, t.id)`.
  - Minúsculas y alias:
    - `bbm7b5` → `{ root: 'Bb', type: 'm7b5' }`;
    - `f#7#9` → `{ root: 'F#', type: '7#9' }`;
    - `dm7` → `{ root: 'D', type: 'm7' }`;
    - `b` → `{ root: 'B', type: 'maj' }`;
    - `Cø` y `Cø7` → `m7b5`; `Co7` y `Cdim7` → `dim7`.
  - Enarmónica simple: `E#7` → `{ root: 'F', type: '7' }`; `Cb` → `B`; `Fb` → `E`; `B#` → `C`.
  - Separadores: `'Dm7 G7 Cmaj7 Cmaj7'` da 4 compases de un acorde, y `'Dm7\n  G7   Cmaj7'` da 3.
  - Errores:
    - `'Dm7 Hm7 G7'` da `{ errors: [{ start: 4, end: 7, message: 'No reconozco «Hm7».' }] }`;
    - `'Cbb'` y `'Dm7x'` dan un error cada uno, con su palabra citada;
    - `''` y `'   '` dan `[{ start: 0, end: <largo del texto>, message: 'Escribe al menos un acorde.' }]`;
    - `'Hm7 Xb'` da dos errores, en orden.
  - `formatProgression([[Dm7], [G7], [Cmaj7]])`, con los `WrittenChord` de cada uno, es `'Dm7 | G7 | Cmaj7'`.

  Correr `pnpm test --project ui` y **verlo fallar**.

- [x] T003 [US1] Crear `src/music/progression-text.ts` con los tipos y las dos funciones de [contracts](./contracts/interfaces.md) §3, según research §5:
  - **Palabras**: se recorren con `/\S+/g`, guardando `index` y largo para `start` y `end`.
  - **Cada palabra**: `/^([A-Ga-g])([#b♯♭]?)(.*)$/u`.
    - La raíz es la letra en mayúscula más `#` o `b`, y pasa por `simplify` de `@tonaljs/note`.
    - El sufijo, con `b` → `♭` y `#` → `♯`, se busca entre los `suffix` de `CHORD_TYPES`, después de los alias (`ø` y `ø7` → `m7♭5`; `o7` y `dim7` → `°7`).
    - Sin coincidencia, el error `No reconozco «{palabra}».`
  - **Sin palabras**, el error `Escribe al menos un acorde.` con `start: 0` y `end: text.length`.
  - **Salida**: con algún error, `{ errors }`, en orden; si no, `{ bars }`, un compás por palabra.
  - **`formatProgression`**: cada acorde como `chordSymbol(spell(root), type)`, con los acordes de un compás separados por espacio y los compases por `' | '`.

  Un comentario de una línea explica por qué la `b` del sufijo pasa a `♭`: ningún sufijo de la lista tiene la letra `b`. `pnpm test --project ui` **en verde**. **Commit**: `feat: lector de progresiones escritas (#33)`.

### La progresión propia en la biblioteca

- [x] T004 [P] [US1] En `src/music/progressions.test.ts`, agregar `'una progresión propia se lee como una de la biblioteca'` (falla: `myProgression` no existe). Con `mine = { id: 'propia-1', name: 'Progresión 1', key: { tonic: 'C', type: 'major' }, bars }`, donde `bars` es `parseProgression('Dm7 G7 Cmaj7 Cmaj7').bars`:
  - `barsOf(myProgression(mine), 'C', METER_BY_ID['4/4'])` es igual (`toEqual`) a `barsOf(PROGRESSION_BY_ID['ii-v-i-mayor'], 'C', METER_BY_ID['4/4'])`;
  - en la tónica `'F'`, también es igual a la del ii–V–I mayor en `'F'`;
  - `keyLabel(myProgression(mine), 'C')` es `'Do mayor'`;
  - `myProgression(mine)` tiene `group: 'Mis progresiones'`, `name: 'Progresión 1'` y `bars: 'Dm7 | G7 | Cmaj7 | Cmaj7'`.

- [x] T005 [US1] En `src/music/progressions.ts`:
  - `ProgressionGroup` suma `'Mis progresiones'`;
  - se agregan `MyProgressionId`, `MyProgression` y `myProgression` de [contracts](./contracts/interfaces.md) §3;
  - `Progression.id` pasa a `ProgressionId | MyProgressionId`;
  - `myProgression` usa la tabla `TONICS` del archivo para `key.tonic` y `formatProgression` para `bars` ([data-model](./data-model.md), Progresión propia).

  `PROGRESSION_BY_ID` sigue tipado con `ProgressionId`. **Verde completo**. **Commit**: `feat: una progresión propia se lee como la biblioteca (#33)`.

### El editor en la app

- [x] T006 [US1] Crear `src/write-progression.test.tsx` (falla). Helpers locales:
  - `pickMode(app, name)`, como en `src/progression-mode.test.tsx`;
  - `pickSound(app, name)`, como en `src/chords.test.tsx`;
  - `newProgression(app)`: abre el panel, toca `Nueva progresión` y devuelve `within(screen.getByRole('main', { name: 'Editor de progresiones' }))`;
  - `chords(editor)`: el `textbox` `Acordes`;
  - `editorBars(editor)`: los `name` accesibles de los `button` dentro de la lista `Compases`.

  Los tests:

  1. `'Nueva progresión está solo en el modo progresión'`: en el modo aleatorio, el panel no tiene el botón; con `Progresión`, sí.
  2. `'abre el editor a pantalla completa'`: tras `newProgression`, existe el `main` `Editor de progresiones`, no existe la `region` `Ahora`, y `Acordes` está vacío.
  3. `'escribir llena el carril del editor'`: `user.type(chords, 'Dm7 G7 Cmaj7 Cmaj7')` deja `editorBars` en `['Compás 1: Dm7', 'Compás 2: G7', 'Compás 3: Cmaj7', 'Compás 4: Cmaj7']`.
  4. `'un acorde no reconocido se marca y no deja guardar'`: con `Dm7 Hm7 G7`:
     - `Acordes` tiene `aria-invalid="true"`, y `getByRole('textbox', { name: 'Acordes', description: /«Hm7»/ })` lo encuentra;
     - `editorBars` es `['Compás 1: Dm7']`, la última versión válida al escribir letra por letra;
     - `Guardar` está desactivado.
  5. `'guardada, queda elegida y suena en la práctica'`: escribir `Dm7 G7 Cmaj7 Cmaj7`, `Guardar` y `Listo`:
     - la línea de estado dice `Progresión 1 · Do mayor · Analógico cálido · 60 BPM · 4/4`;
     - en el panel, el `combobox` `Progresión` tiene `value` `'propia-1'`, y su primer `group` es `Mis progresiones`, con la opción `Progresión 1`;
     - con Play y `fake.beat(5)`, el carril de práctica dice `Dm7 G7 Cmaj7 Cmaj7`.
  6. `'suena igual que el ii–V–I mayor de la biblioteca'`: en la misma app, con `Progresión` y `Bajo + acorde`:
     1. Play, `fake.beat(4 + 8 × 4)`, guardar lo que vino en `fake.bars` sin la cuenta, y Stop;
     2. crear `Dm7 G7 Cmaj7 Cmaj7`, `Guardar`, `Listo`;
     3. Play y `fake.beat(4 + 8 × 4)`: lo que vino en `fake.bars` sin la cuenta es igual (`toEqual`) a lo del paso 1.
  7. `'crear una progresión detiene la que suena'`: con `Progresión`, Play y `fake.beat(5)`; `Nueva progresión` deja `fake.running` en `false`.

  Correr `pnpm test --project ui` y **verlo fallar**.

- [x] T007 [US1] Implementar ([data-model](./data-model.md), Borrador y Derivados): Done: también `useSpaceToggle` ignora el espacio en `input, textarea, select, [contenteditable]` (adelantado de T009: sin eso no se puede escribir un espacio en Acordes); `closeEditor()` de una nueva sin guardar devuelve lo que regía (`opened`), para no dejar `progression` apuntando a una propia que no existe.
  - **`src/practice/store.ts`**:
    - Estado `mine: MyProgression[]`, que empieza en `[]` (US2 lo carga), y `editor: Draft | null`, con `null` al empezar. `Draft` se exporta, con los campos de data-model.
    - Se exporta `progressionOf(state, id = state.progression)`: el borrador si `editor?.id === id`; si no, `myProgression` de la de `mine`; si no, `PROGRESSION_BY_ID[id]`.
    - `progressionRound` recibe una `Progression` en vez de un id. `play` y `nextRound` le pasan `progressionOf(get())`. `Round.progression` y `PracticeState.progression` pasan a `Progression['id']`.
    - `canPlay`: en progresión, `progressionOf(state).bars !== ''`.
    - Se exportan `isDirty(state)` y `canSave(state)`, según data-model.
    - `openEditor()`:
      - si sonaba otra progresión, `stop()`;
      - id `propia-${n}`, con n el siguiente al mayor de `mine`;
      - `name` el nombre por defecto (`Progresión ${N}`, el primer N libre entre los nombres de `mine`);
      - `key: { tonic: state.tonic, type: 'major' }`, `text: ''`, `bars: []`, `errors: []`, `isNew: true`;
      - `opened: { progression, tonic }` con lo que regía;
      - y `progression` pasa al id nuevo.
    - `setDraftText(text)` usa `parseProgression`: con `bars`, los guarda y vacía `errors`; con `errors`, solo actualiza `errors`.
    - `saveDraft()`, con `canSave`:
      - copia `{ id, name: name.trim() || <el guardado o el por defecto>, key, bars }` a `mine`, reemplazando si existe y agregando al final si no;
      - deja `isNew: false` y `opened` con lo actual.
  - **`src/App.tsx`**:
    - Con `editor`, el `main` de práctica se reemplaza por `<ProgressionEditor />`. `HandsFree` queda fuera, para las dos pantallas.
    - `StatusLine` usa `progressionOf(state, round?.progression ?? state.progression)` en vez de `PROGRESSION_BY_ID`.
  - **`src/components/progression-editor.tsx`** (nuevo), `ProgressionEditor`:
    - un `<main aria-label="Editor de progresiones">` a pantalla completa (`h-dvh`, `p-safe`), con `Listo` arriba;
    - el `<textarea aria-label="Acordes">` con `autoCapitalize="none"`, `autoCorrect="off"` y `spellCheck={false}`; con errores, `aria-invalid="true"` y `aria-describedby` hacia una lista de los mensajes, debajo;
    - el carril: `<ol aria-label="Compases">`, en 4 columnas como el de práctica, con un `<li>` por compás de `editor.bars` y dentro un `<button aria-label="Compás {n}: {cifrado}">` con el cifrado (`chordSymbol(spell(root), type)`);
    - `Guardar`, desactivado sin `canSave`;
    - en este paso, `Listo` llama a `closeEditor()`, que deja `editor: null` (la pregunta llega en T009).
  - **`src/components/settings-panel.tsx`**:
    - En la sección `Progresión`, el botón `Nueva progresión`, envuelto en `SheetClose asChild` para que el panel se cierre antes de cambiar de pantalla.
    - El `<select>` suma primero el `<optgroup label="Mis progresiones">` con las de `mine`, en orden, si hay alguna.
    - `ProgressionPicker` y `SoundPicker` usan `progressionOf` en vez de `PROGRESSION_BY_ID`.

  **Verde completo**. **Commit**: `feat: escribir una progresión y tocar encima (#33)`.

### Salir del editor

- [x] T008 [US1] En `src/write-progression.test.tsx`, agregar (falla):
  1. `'Listo sin cambios cierra sin preguntar'`: tras `newProgression`, `Listo` vuelve a la práctica sin ningún `dialog`.
  2. `'Listo con cambios pregunta'`: con `Dm7 G7` escrito, `Listo` abre el `dialog` `Cambios sin guardar`, con `Guardar`, `Descartar cambios` y `Seguir editando`:
     - `Seguir editando` cierra el diálogo y deja el editor con su texto;
     - `Listo` y `Descartar cambios` vuelven a la práctica con la línea de estado `ii–V–I mayor · Do mayor · …`, y el `<select>` no tiene `Mis progresiones`;
     - en otra progresión nueva, `Listo` y `Guardar` vuelven a la práctica con `Progresión 1 · Do mayor · …`.
  3. `'con errores, la pregunta no deja guardar'`: con `Dm7 Hm7`, el `Guardar` del diálogo está desactivado.
  4. `'el espacio en Acordes no hace Play ni Stop'`: tras `user.type(chords, 'Dm7 G7')`, `textarea.value` es `'Dm7 G7'` y `fake.lastStart` es `undefined`.

  Correr y **verlo fallar**. Done: fallaron 2, los de la pregunta (2 y 3); el 1 y el 4 pasaron a la primera, porque el cierre sin cambios ya existía y el arreglo del espacio entró en la Fase 2.2 (T007).

- [x] T009 [US1] Implementar:
  - **`src/practice/store.ts`**: `discardDraft()` deja `editor: null` y vuelven `opened.progression` y `opened.tonic`. Si la progresión elegida cambia y sonaba, `stop()`. Done: `closeEditor` de una nueva sin guardar llama a `discardDraft`.
  - **`src/components/progression-editor.tsx`**: `Listo` cierra si `!isDirty`. Si no, abre un `Sheet` (`side="bottom"`, abierto con estado local) con `SheetTitle` `Cambios sin guardar` y tres botones:
    - `Guardar` (desactivado sin `canSave`): `saveDraft` y `closeEditor`;
    - `Descartar cambios`: `discardDraft`;
    - `Seguir editando`: cierra el `Sheet`.
  - **`src/lib/hands-free.ts`**: `useSpaceToggle` también ignora el espacio si `event.target` es un `Element` dentro de `input, textarea, select, [contenteditable]` (research §9). Se actualiza el comentario de la función. Done: ya estaba en T007; el comentario ya era exacto.

  **Verde completo**. **Commit**: `feat: preguntar al salir con cambios sin guardar (#33)`. Comentar en #33.

- [ ] T010 [US1] Verificación manual: quickstart §2, filas 1–6.

**Checkpoint**: se escribe una progresión, se guarda en memoria y se toca encima.

---

## Phase 3: User Story 2 · Guardar, renombrar y borrar (P2, #34)

**Goal**: las progresiones propias se guardan en el dispositivo y siguen al reabrir la app. Tienen nombre y tonalidad de origen (al elegirlas, la tónica pasa a la suya), se prueban con el Play del editor sin guardar, y se renombran y se borran.

**Independent Test**: quickstart §2, filas 7–12.

### En el dispositivo

- [x] T011 [P] [US2] En `src/music/progressions.test.ts`, agregar `'una progresión propia menor se transporta y conserva su grafía'`:
  - con `Am G F E` en `{ tonic: 'A', type: 'minor' }`: en `'A'`, `Am | G | F | E`, y en `'C'`, `Cm | B♭ | A♭ | G`, con el helper `text` del archivo;
  - `keyLabel(…, 'A')` es `'La menor'`;
  - con `C#m7 F#7` en `{ tonic: 'Db', type: 'minor' }`, en `'Db'` da `C♯m7 | F♯7` (FR-005).

  Puede pasar al primer intento, porque T005 ya usa las tablas de la entrega 4. Si pasa, se comprueba que falla cambiando a propósito `type` por `'major'` en `myProgression`, y se deshace. Done: pasó al primer intento; con `type: 'major'` en `myProgression` falla (`'La mayor'` en vez de `'La menor'`), y se deshizo.

- [x] T012 [US2] Crear `src/saved-progressions.test.tsx` (falla). Helpers:
  - `newProgression` y `chords`, como en T006;
  - `createAndSave(app, text)`: crea, escribe, `Guardar` y `Listo`;
  - `groups(panel)`: los `group` del `combobox` `Progresión`, con sus opciones;
  - `stored(progressions)`: escribe `countdown-notes:progresiones`.

  El dato válido de ejemplo es `{ id: 'propia-1', name: 'Andaluza mía', key: { tonic: 'A', type: 'minor' }, bars: [[{ root: 'A', type: 'm' }], [{ root: 'G', type: 'maj' }], [{ root: 'F', type: 'maj' }], [{ root: 'E', type: 'maj' }]] }`.

  Los tests:

  1. `'una progresión guardada sigue al reabrir la app'`: con `Progresión` y `createAndSave(app, 'Dm7 G7 Cmaj7 Cmaj7')`, `unmount` y otro `renderApp`:
     - el primer `group` es `Mis progresiones`, con `Progresión 1`;
     - el `combobox` tiene `value` `'propia-1'`;
     - la línea de estado empieza con `Progresión 1 · Do mayor`.
  2. `'Editar progresión solo con una propia elegida'`:
     - con `stored([andaluza])` y el ii–V–I mayor elegido, el panel no tiene `Editar progresión`;
     - al elegir `Andaluza mía` con `selectOptions`, sí;
     - `Editar progresión` abre el editor con `Acordes` en `'Am | G | F | E'`.
  3. `'las progresiones inválidas se descartan una a una'`: con `stored` de, en orden:
     - la andaluza;
     - una con `bars: []`;
     - una con `type: 'xx'`;
     - una con `name: '   '`;
     - una con `root: 'H'`;
     - otra válida con `id: 'propia-2'` y `name: 'Otra'`;
     - y una con `id: 'propia-1'` repetido.

     `Mis progresiones` tiene `Andaluza mía` y `Otra`, en ese orden.

  4. `'datos rotos no rompen la app ni los ajustes'`: con `'no es json'` en la clave de progresiones y `{ bpm: 90 }` en los ajustes, no hay `group` `Mis progresiones` y la línea de estado dice `… · 90 BPM · …`. Lo mismo con `{ version: 2, progressions: [andaluza] }`.
  5. `'una progresión elegida que ya no existe deja el ii–V–I mayor'`: ajustes `{ mode: 'progression', progression: 'propia-7' }` y ninguna progresión guardada; la línea de estado empieza con `ii–V–I mayor · Do mayor`.
  6. `'los ajustes de la entrega 4 se conservan'`: ajustes `{ mode: 'progression', progression: 'blues-jazz', tonic: 'F', bpm: 100 }`; la línea de estado es `Blues de jazz · Fa mayor · Analógico cálido · 100 BPM · 4/4`.

  Correr y **verlo fallar**. Done: fallaron 3 (1, 2 y 3: sin guardado ni «Editar progresión»); el 4, el 5 y el 6 pasaron a la primera, porque hoy no se lee la clave de progresiones y `progression` inválido ya vuelve al por defecto. Con T013, quitar la comprobación del store o los ids repetidos hace fallar el 5 y el 3.

- [x] T013 [US2] Implementar el esquema de research §1 (**decisión 1: confirmar con el usuario antes de empezar**):
  - **`src/practice/my-progressions.ts`** (nuevo):
    - `MY_PROGRESSIONS_KEY = 'countdown-notes:progresiones'`.
    - Un `myProgressionSchema` de zod con estas reglas, copiadas de research §1:
      - "`id` con la forma `propia-N`, sin repetir (si se repite, gana la primera)";
      - "`name` no vacío tras `trim`";
      - "`key.tonic` uno de los 12 `NoteId`, y `key.type` `'major'` o `'minor'`";
      - "`bars` con al menos un compás, cada uno de 1 o 2 acordes";
      - "`root` con la forma `^[A-G][#b]?$` (el formato de tonal), y `type` un `ChordTypeId` de la entrega 3".
    - `loadMyProgressions()`:
      - lee `{ version: 1, progressions: unknown[] }`;
      - valida cada una con `safeParse`, descarta las inválidas y los ids repetidos, y conserva el orden;
      - sin datos, de otra versión, rotos o sin almacenamiento, `[]`, con `try/catch` como `loadSettings`.
    - `saveMyProgressions(list)` escribe `{ version: 1, progressions: list }`; si el almacenamiento falla, no hace nada.
  - **`src/practice/settings.ts`**: `progression` pasa a `z.union([z.enum(<ids de la biblioteca>), z.string().regex(/^propia-\d+$/)]).catch(D.progression)`, con el tipo `Progression['id']`.
  - **`src/practice/store.ts`**:
    - `mine: loadMyProgressions()` al crear el store;
    - si `progression` es propia y no está en `mine`, `'ii-v-i-mayor'`;
    - `saveDraft` llama a `saveMyProgressions(mine)` después de actualizar la lista;
    - `openEditor(id)` copia la guardada al borrador, con `text: formatProgression(bars)`, `isNew: false` y `opened` con lo actual, sin cambiar la progresión, la tónica ni la música.
  - **`src/components/settings-panel.tsx`**: con una propia elegida, el botón `Editar progresión` (en `SheetClose asChild`) llama a `openEditor(progression)`.

  **Verde completo**. **Commit**: `feat: las progresiones propias se guardan en el dispositivo (#34)`. Done: decisión 1 confirmada por el usuario (research §1 tal cual); `Editar progresión` va tras `Nueva progresión`; `openEditor(id)` no hace nada si el id no está guardado.

### Nombre

- [ ] T014 [US2] En `src/saved-progressions.test.tsx`, agregar (falla):
  1. `'el nombre por defecto es el primer número libre'`: la primera progresión nueva tiene el `textbox` `Nombre` en `Progresión 1`. Tras guardarla, la siguiente nueva tiene `Progresión 2`. Con `stored` de una sola progresión llamada `Progresión 2`, la nueva es `Progresión 1`.
  2. `'renombrar cambia el selector y la línea de estado'`: en `Editar progresión` de la andaluza, `Nombre` en `Andaluza de La`, `Guardar` y `Listo`: la opción y la línea de estado dicen `Andaluza de La`, y siguen así al reabrir la app.
  3. `'un nombre vacío conserva el anterior'`: borrar `Nombre`, escribir un cambio en `Acordes`, `Guardar` y `Listo`: la línea de estado sigue con `Andaluza mía`.

  Correr y **verlo fallar**: los casos del nombre por defecto pueden pasar ya por T007; el del `textbox` `Nombre` no.

- [ ] T015 [US2] Implementar:
  - `setDraftName(name)` en `src/practice/store.ts`;
  - en `src/components/progression-editor.tsx`, el `<input aria-label="Nombre">` arriba, con `editor.name`.

  `isDirty` ya compara el nombre sin espacios al borde. **Verde completo**. **Commit**: `feat: nombre de una progresión propia (#34)`.

### Tonalidad de origen

- [ ] T016 [US2] En `src/saved-progressions.test.tsx`, agregar (falla):
  1. `'la tonalidad de origen empieza en la de ajustes, en mayor'`: con la tónica de ajustes en Fa, en una nueva, `Tonalidad de origen` tiene `Fa` marcado y `Tipo de tonalidad`, `Mayor`.
  2. `'cambiar la tonalidad no cambia lo escrito'`: con `Am G F E`, elegir `La` y `Menor`:
     - `Acordes` sigue en `Am G F E`;
     - el radio de Do♯ se llama `Do sostenido`;
     - tras `Guardar` y `Listo`, la línea de estado empieza con `Progresión 1 · La menor`.
  3. `'al elegirla, la tónica pasa a la suya'`: con `stored([andaluza])`, el ii–V–I mayor y la tónica en Do:
     - elegir `Andaluza mía` deja `Tonalidad` en `La` en el panel;
     - con Play y `fake.beat(5)`, el carril dice `Am G F E`;
     - Stop, la tónica `Do` y Play dan `Cm B♭ A♭ G`.

  Correr y **verlo fallar**.

- [ ] T017 [US2] Implementar:
  - **`src/components/tonic-picker.tsx`** (nuevo): `TonicPicker({ label, progression, value, onChange })`. Es el `ToggleGroup` de 12 tónicas que hoy está en la sección `Progresión` del panel, con el mismo marcado, clases y `tonicOf(progression, id)`, más el `aria-label` que recibe.
  - **`src/components/settings-panel.tsx`**: la sección `Progresión` usa `<TonicPicker label="Tonalidad" … />`. Ningún test del panel cambia.
  - **`src/practice/store.ts`**:
    - `setDraftKey(key)` actualiza `editor.key` y pone `tonic` en `key.tonic` (FR-011);
    - `setProgression(id)`, con un id que está en `mine`, además pone `tonic` en su `key.tonic`.
  - **`src/components/progression-editor.tsx`**: `<TonicPicker label="Tonalidad de origen" progression={myProgression(editor)} … />` y un `ToggleGroup` `Tipo de tonalidad` con `Mayor` y `Menor`, debajo del nombre.

  **Verde completo**. **Commit**: `feat: tonalidad de origen de una progresión propia (#34)`.

### Probar sin guardar

- [ ] T018 [US2] En `src/saved-progressions.test.tsx`, agregar (falla):
  1. `'Play en el editor toca lo que muestra, sin guardar'`:
     - en `Editar progresión` de la andaluza, cambiar `Acordes` a `Am G F Bb`;
     - el `Play` del editor y `fake.beat(4 + 3 × 4 + 1)`: el `bass` del compás 4 es `Bb2`;
     - `Stop`, `Listo` y `Descartar cambios`; reabrir la app y `Editar progresión`: `Acordes` es `'Am | G | F | E'`.
  2. `'lo que empieza en el editor sigue al volver'`: Play en el editor, `Listo` (sin cambios), y `fake.running` sigue en `true`.
  3. `'un cambio mientras suena aplica en la vuelta siguiente'`:
     - con la andaluza sonando desde la práctica (Play y `fake.beat(5)`), `Editar progresión` y `Acordes` en `Dm G F E`;
     - `fake.beat(4 × 4)`: el `bass` del compás 4 es `E2` y el del compás 5 (vuelta 2), `D2`;
     - `Listo` y `Descartar cambios`: la música sigue, y tras otro `fake.beat(4 × 4)`, el `bass` del compás 9 (vuelta 3) es `A2`.
  4. `'descartar vuelve a la tónica de cuando se abrió'`: en `Editar progresión` de la andaluza, `Tonalidad de origen` en `Do` y `Descartar cambios`: en el panel, `Tonalidad` vuelve a `La`.

  Correr y **verlo fallar**.

- [ ] T019 [US2] Implementar:
  - **`src/App.tsx`**: se exporta `PlayButton`.
  - **`src/components/progression-editor.tsx`**: `<PlayButton />` abajo, junto a `Guardar`.
  - **`src/practice/store.ts`**: revisar que `discardDraft` ya vuelve `opened.tonic` (T009) y que `nextRound` lee `progressionOf(get())` (T007). Este paso solo agrega lo que falte.

  **Verde completo**. **Commit**: `feat: Play en el editor de progresiones (#34)`.

### Borrar

- [ ] T020 [US2] En `src/saved-progressions.test.tsx`, agregar (falla):
  1. `'Borrar progresión solo en una guardada'`: en una nueva no está; en `Editar progresión` de la andaluza, sí.
  2. `'borrar pide confirmación'`: `Borrar progresión` abre el `dialog` `¿Borrar «Andaluza mía»?`. `Cancelar` lo cierra, y la progresión sigue en el editor y en el `<select>`.
  3. `'borrar la quita, deja el ii–V–I mayor y detiene la música'`: con la andaluza sonando (Play y `fake.beat(5)`), `Editar progresión`, `Borrar progresión` y `Borrar`:
     - se vuelve a la práctica con `fake.running` en `false`;
     - la línea de estado empieza con `ii–V–I mayor`;
     - no hay `group` `Mis progresiones`, tampoco al reabrir la app.

  Correr y **verlo fallar**.

- [ ] T021 [US2] Implementar:
  - **`src/practice/store.ts`**: `deleteProgression(id)`:
    - `stop()` si sonaba;
    - la quita de `mine` y llama a `saveMyProgressions`;
    - si era la elegida, `progression: 'ii-v-i-mayor'`;
    - `editor: null`.
  - **`src/components/progression-editor.tsx`**: con `!editor.isNew`, el botón `Borrar progresión`, que abre un `Sheet` con `SheetTitle` `¿Borrar «{nombre}»?` y los botones `Borrar` y `Cancelar`.

  **Verde completo**. **Commit**: `feat: borrar una progresión propia (#34)`. Comentar en #34.

- [ ] T022 [US2] Verificación manual: quickstart §2, filas 7–12.

**Checkpoint**: las progresiones propias se guardan, se renombran, se prueban y se borran.

---

## Phase 4: User Story 3 · Armar la progresión tocando el carril (P3, #35)

**Goal**: en el editor, tocar un compás abre un selector de raíz (12 botones) y tipo (por familias, como en ajustes). Se agregan y se quitan compases. El texto se reescribe solo, y el resultado es el mismo que escribiéndola.

**Independent Test**: quickstart §2, filas 13–14.

- [ ] T023 [US3] Crear `src/tap-progression.test.tsx` (falla). Helpers:
  - `newProgression`, `chords` y `editorBars`, como en T006;
  - `pickChord(app, editor, bar, root, type)`: toca el botón del compás, en el `dialog` `Compás {bar}` toca el radio `root` del `radiogroup` `Raíz`, elige `type` con `selectOptions` en el `combobox` `Tipo de acorde`, y cierra con `Cerrar`.

  Los tests:

  1. `'Agregar compás en una nueva da la tríada de la tónica'`:
     - `Agregar compás` da `['Compás 1: C']` y `Acordes` en `'C'`;
     - con `Menor` en `Tipo de tonalidad` antes, `['Compás 1: Cm']`.
  2. `'Agregar compás copia el último'`: con `Dm7 G7` escrito, `Agregar compás` da `Compás 3: G7` y `Acordes` en `'Dm7 | G7 | G7'`.
  3. `'el selector de un compás tiene las raíces y los tipos de ajustes'`: primero se leen los `group` y las opciones del `combobox` `Tipo de acorde` del panel, en el modo aleatorio con `Bajo + acorde`. Después, en una progresión nueva de un compás, tocarlo abre `Compás 1`:
     - el `radiogroup` `Raíz` tiene 12 radios, de `Do` a `Si`, con `C`, `D♭`… `B` como texto, y el de `Do` marcado;
     - los `group` y las opciones de su `combobox` `Tipo de acorde` son los mismos, en el mismo orden y con el mismo texto, que los del panel.
  4. `'elegir raíz y tipo cambia el compás y el texto'`: con `pickChord(…, 1, 'Fa', 'Cm7 · menor séptima')` en `C G`, queda `Compás 1: Fm7` y `Acordes` en `'Fm7 | G'`.
  5. `'Quitar'`: en una progresión de un compás, `Quitar` está desactivado; con `Dm7 G7`, `Quitar` en el compás 1 deja `['Compás 1: G7']`.
  6. `'editar tocando reemplaza un texto con error'`: con `Dm7 Hm7`, `pickChord(…, 1, 'Mi', 'Cm7 · menor séptima')` deja `Acordes` en `'Em7'`, sin `aria-invalid`.
  7. `'tocando suena igual que escribiendo'`: armar con `Agregar compás` y `pickChord` `Dm7 | G7 | Cmaj7 | Cmaj7`:
     - `Acordes` es `'Dm7 | G7 | Cmaj7 | Cmaj7'`;
     - en la misma app, con `Bajo + acorde`: `Guardar`, `Listo`, Play, `fake.beat(4 + 4 × 4)` y Stop; después, una nueva escrita `Dm7 G7 Cmaj7 Cmaj7`, `Guardar`, `Listo`, Play y `fake.beat(4 + 4 × 4)`. Lo que vino en `fake.bars` sin la cuenta es igual en los dos Play, como en T006.

  Correr y **verlo fallar**.

- [ ] T024 [US3] Implementar:
  - **`src/components/chord-type-select.tsx`** (nuevo): `ChordTypeSelect({ value, onChange })`. Es el `<select aria-label="Tipo de acorde">` del panel, con sus `optgroup` por familia, opciones `{chordSymbol('C', id)} · {name}`, clases y flecha. El panel lo usa sin cambiar lo que muestra.
  - **`src/practice/store.ts`**, según research §7 (cada una reescribe `editor.text` con `formatProgression` y vacía `errors`):
    - `setChord(bar, part, chord)`;
    - `addBar()`: copia el último; vacío, `{ root: <tónica de su tabla, formato de tonal>, type: key.type === 'minor' ? 'm' : 'maj' }`;
    - `removeBar(bar)`: no hace nada si queda uno.
  - **`src/components/progression-editor.tsx`**:
    - cada botón de compás abre un `Sheet` (`side="bottom"`) con `SheetTitle` `Compás {n}`;
    - adentro, un `ToggleGroup` `Raíz` con las 12 `NOTES` (`aria-label` con su `name`, texto con su `label`). El radio marcado es el de `spell(root).id`, y al elegir uno, la raíz pasa a `label` con `♭` → `b` y `♯` → `#`;
    - también `ChordTypeSelect` con el tipo del acorde, y `Quitar` (desactivado con un compás). Las acciones del `Sheet` (`Quitar` aquí; `Partir`, `Unir` y `Duplicar` en T029) lo cierran al usarse, para que el carril vuelva a ser accesible;
    - debajo del carril, `Agregar compás`.

  **Verde completo**. **Commit**: `feat: armar una progresión tocando el carril (#35)`. Comentar en #35.

- [ ] T025 [US3] Verificación manual: quickstart §2, filas 13–14.

**Checkpoint**: escribir y tocar llenan el mismo carril.

---

## Phase 5: User Story 4 · Duraciones: medio compás y varios compases (P4, #36)

**Goal**: con `|`, un compás puede tener dos acordes, que se parten como en la entrega 4. Tocando, se parte, se une y se duplica un compás.

**Independent Test**: quickstart §2, filas 15–17, y §3.

- [ ] T026 [P] [US4] En `src/music/progression-text.test.ts`, agregar lo marcado US4 en [contracts](./contracts/interfaces.md) §3 (falla):
  - `'Cmaj7 | C7 A7 | Dm7 G7'` da 3 compases, el segundo `[C7, A7]` y el tercero `[Dm7, G7]`;
  - `'| Dm7 | G7 |'` da 2 compases;
  - `'C | Dm7 G7 C'` da un error `Un compás tiene uno o dos acordes: «Dm7 G7 C».`, con `start` y `end` de ese texto;
  - `'Dm7 || G7'` da `Hay un compás vacío entre dos barras.`;
  - `'Dm7 | Hm7 G7'` da `No reconozco «Hm7».` con `start: 6`;
  - `formatProgression` de los compases del primer caso es `'Cmaj7 | C7 A7 | Dm7 G7'`;
  - `test.each` sobre esos textos, con y sin barras: `parseProgression(formatProgression(bars))` devuelve los mismos `bars`.

- [ ] T027 [US4] En `src/music/progression-text.ts`:
  - con `|` en el texto, se parte por `|` guardando la posición de cada trozo;
  - se ignoran el primero y el último si solo tienen espacios;
  - cada trozo es un compás con sus palabras: 0 palabras es el error de compás vacío, más de 2 el de uno o dos acordes (cita el trozo sin espacios al borde), y cada palabra se lee como en T003;
  - sin `|`, igual que hoy.

  `formatProgression` ya separa con espacio los acordes de un compás (T003). **Verde completo**. **Commit**: `feat: compases de dos acordes en el texto (#36)`.

- [ ] T028 [US4] Crear `src/durations.test.tsx` (falla). Helpers: los de T023, `pickFigure` y `pickMeter`, como en `src/library.test.tsx`, y `parts(editor, bar)`: los `button` cuyo nombre empieza con `Compás {bar}, parte`.

  Los tests:

  1. `'un compás con dos acordes se ve partido'`: con `Cmaj7 | C7 A7 | Dm7 G7`:
     - la lista `Compases` tiene 3 `listitem`;
     - `parts(editor, 2)` son `Compás 2, parte 1: C7` y `Compás 2, parte 2: A7`, con `data-at` `0` y `2`;
     - en 7/8, `0` y `4`.
  2. `'el carril de práctica y el sonido se parten igual'`: con `Cmaj7 | C7 A7 | Dm7 G7` guardada, `Redondas` y `Bajo + acorde`, Play y `fake.beat(4 + 4 + 4)`:
     - el compás 2 del carril de práctica tiene sus partes con `data-at` `0` y `2`;
     - en `fake.played`, el compás 2 tiene `bass` `C2` en `beat: 0` y `A2` en `beat: 2`, y dos `chord`.
  3. `'tres acordes en un compás es un error'`: con `C | Dm7 G7 C`, `Acordes` tiene la descripción `/«Dm7 G7 C»/` y `Guardar` está desactivado.
  4. `'Partir y Unir'`: con `C7 | F7`:
     - en `Compás 1`, `Partir` da `Compás 1, parte 1: C7` y `Compás 1, parte 2: C7`, y `Acordes` en `'C7 C7 | F7'`;
     - en el `dialog` `Compás 1, parte 2`, elegir `La` y `C7 · séptima` da `'C7 A7 | F7'`;
     - `Unir` deja `Compás 1: C7` y `'C7 | F7'`.
  5. `'Duplicar inserta la copia justo después'`: con `C7 | F7 | G7`, `Duplicar` en el compás 2 da `'C7 | F7 | F7 | G7'`, y la lista tiene 4 `listitem`.

  Correr y **verlo fallar**.

- [ ] T029 [US4] Implementar:
  - **`src/practice/store.ts`**:
    - `splitBar(bar)`: `[c]` pasa a `[c, c]`;
    - `joinBar(bar)`: `[a, b]` pasa a `[a]`;
    - `duplicateBar(bar)`: inserta una copia justo después;
    - las tres reescriben `text` como en T024.
  - **`src/components/progression-editor.tsx`**:
    - un compás de dos acordes muestra dos botones `Compás {n}, parte {k}: {cifrado}`, con `data-at` `0` y `splitAt(METER_BY_ID[meter])`, y `flexGrow` proporcional a sus golpes, como las partes del carril de práctica;
    - cada parte abre su `Sheet` `Compás {n}, parte {k}`, que edita esa parte;
    - en el `Sheet`, `Partir` (compás de un acorde) o `Unir` (de dos), y `Duplicar`.

  **Verde completo**. **Commit**: `feat: partir, unir y duplicar compases (#36)`.

- [ ] T030 [P] [US4] En `src/practice/progression.browser.test.ts`, agregar `'una progresión propia con compases partidos cae a tiempo'` (research §11). Con `renderStore` del archivo, en `setup`:
  - `setMode('progression')`, `openEditor()`, `setDraftText('Cmaj7 A7 | Dm7 G7')` y `saveDraft()`;
  - `setWithChord(true)`, `setBassFigure('whole')`, `setRepeats({ on: true, count: 2 })` y `setBpm(240)`.

  En 10 s, a 240 BPM (un compás dura 1 s), se espera:
  - 8 ataques del bajo, `C2 A2 D2 G2 C2 A2 D2 G2`, y 8 del acorde;
  - el ataque `k` en `t0 + 1 + floor(k / 2) + (k % 2) × 0.5`, a menos de 1 ms.

  Puede pasar al primer intento, porque el camino es el de la biblioteca. Si pasa, se comprueba que falla corriendo a propósito el `at` en `barAt`, y se deshace. **Commit**: `test: una progresión propia con compases partidos, a tiempo (#36)`.

- [ ] T031 [P] [US4] En `e2e/practice.spec.ts`, agregar (falla), en los proyectos `chromium` e `iphone`:
  - `'crear, guardar y recargar una progresión propia'`:
    - en el panel, `Progresión` y `Nueva progresión`;
    - `Acordes` con `Cmaj7 | C7 A7 | Dm7 G7` y `Guardar`;
    - con el viewport en 320 × 640, sin scroll horizontal (como el primer test del archivo);
    - `Listo`, `page.reload()`, abrir el panel: el `combobox` `Progresión` tiene `Progresión 1` elegida.

  **Verde completo**. **Commit**: `test: e2e de una progresión propia (#36)`. Comentar en #36.

- [ ] T032 [US4] Verificación manual: quickstart §2, filas 15–17, y §3 en el iPhone.

**Checkpoint**: las 4 historias están implementadas.

---

## Phase 6: Polish & cierre

- [ ] T033 Pulido visual del editor con el skill `frontend-design`, dentro de la dirección del diseño (§7.4):
  - el editor con el lenguaje del panel (secciones, botones grandes, ámbar para lo elegido);
  - el carril del editor legible a 320 px, con compases partidos;
  - con el teclado del iPhone abierto, el campo y la primera fila del carril a la vista;
  - los mensajes de error junto al campo.

  Ningún test se modifica. **Verde completo**. **Commit**: `feat: pulido visual del editor de progresiones (#6)`.

- [ ] T034 Correr quickstart §1 completo y comparar el tamaño de `dist/assets/*.js` con el de T001; anotar la diferencia en research §12. Si algún hallazgo cambió una decisión, actualizar research.md. Commit solo si hay cambios (`docs: …`). Comentar en #6 el resumen de la entrega.
- [ ] T035 El usuario hace quickstart §2–§5: la prueba de oído, el blues de 12 compases en menos de 3 minutos (SC-005) y la sesión con la guitarra (SC-006). Si algo falla, se reabre el issue de esa historia.

---

## Dependencies & Execution Order

- **Setup (T001)** → historias.
- **Historias**: en el orden del spec, US1 → US2 → US3 → US4. Comparten `store.ts`, `progression-editor.tsx` y `settings-panel.tsx`, así que van en secuencia:
  - US2 guarda el borrador de US1 y suma nombre, tonalidad, Play y borrar al editor;
  - US3 usa el `Tipo de tonalidad` de US2 en `Agregar compás`;
  - US4 suma `|` al lector de US1 y las acciones de compás al `Sheet` de US3.
- **Dentro de US1**: lector (T002–T003) → progresión propia (T004–T005) → editor (T006–T007) → salir (T008–T009) → manual (T010). T005 necesita `formatProgression` de T003.
- **Dentro de US2**: guardado (T012–T013) → nombre (T014–T015) → tonalidad (T016–T017) → Play (T018–T019) → borrar (T020–T021). T013 espera la confirmación del usuario (decisión 1).
- **Polish (T033–T035)**: después de US4.

### Parallel Opportunities

- T002 (`progression-text.test.ts`) y T004 (`progressions.test.ts`): archivos distintos; T004 se puede escribir antes de T003, aunque necesita `parseProgression` para correr.
- T011 (`progressions.test.ts`) mientras se hace la verificación manual T010.
- T026 (`progression-text.test.ts`) mientras se hace la verificación manual T025.
- T030 (audio) y T031 (E2E), después de T029: archivos distintos.

### Parallel Example: User Story 1

```text
T002 Escribir src/music/progression-text.test.ts  (el lector, debe fallar)
T004 Escribir el test de myProgression en src/music/progressions.test.ts  (debe fallar)
```

### Parallel Example: User Story 4

```text
T030 Agregar la propia con compases partidos a src/practice/progression.browser.test.ts
T031 Agregar crear, guardar y recargar a e2e/practice.spec.ts
```

## Implementation Strategy

- **MVP**: US1. Con eso ya se escribe una progresión y se improvisa encima, aunque se pierde al cerrar la app.
- **Incremental**: cada historia termina en verde, con commit, comentario en su issue y verificación manual, antes de pasar a la siguiente. Se puede parar después de cualquier checkpoint con la app funcionando.
- **Riesgos registrados**:
  - **Cambiar el tipo de `progression`** a `Progression['id']` (T007) toca el store, el panel y `App`. Si un test de las entregas 1 a 4 falla, se corrige el código, nunca el test.
  - **Cerrar el panel** (`Sheet` de radix) al cambiar de pantalla (T007): por eso el botón va en `SheetClose asChild`. Si el cuerpo queda bloqueado (`pointer-events: none`), se revisa el orden: primero se cierra el `Sheet`, después `openEditor`.
  - **El teclado del iPhone** sobre el editor (T033): el carril queda debajo del campo, para que el teclado no lo tape.
  - **El esquema guardado** (T013) espera la decisión 1 del usuario.
