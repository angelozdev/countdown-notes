# Implementation Plan: Modo progresión con biblioteca (Entrega 4)

**Branch**: `005-modo-progresion` | **Date**: 2026-10-24 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/005-modo-progresion/spec.md` (issue #5, sub-issues #29–#32)

## Summary

La app suma el modo progresión, que se elige en el panel:

- **Biblioteca**: 21 progresiones en tres grupos (Ciclos, Jazz, y Pop, rock y latino), escritas como texto en su tonalidad de origen (research §6).
- **Tonalidad**: una tónica compartida (decisión del usuario). Cada progresión se transporta a ella con su propio tipo (mayor, menor o dórico) y se escribe con las alteraciones de la tonalidad, con tonal (research §1 y §5).
- **Compás partido**: dos acordes en un compás, mitad y mitad en 2/4, 4/4, 6/8 y 12/8, y por grupos de acento en los demás (decisión del usuario, research §4). El bajo ataca en cada cambio de acorde.
- **Movimiento de voces**: en las progresiones, cada voicing es el que menos se mueve desde el anterior (research §7).

El contrato del motor no cambia (research §10). Todo vive en `music/` y en el store:

- La vuelta pasa a ser una lista de compases de uno o dos acordes, en los dos modos (research §2).
- `barAt`, el carril y "Ahora" leen esa lista sin saber de qué modo viene.
- El modo aleatorio se reescribe sobre la misma forma y sigue igual, cubierto por sus tests de las entregas 1 a 3.

Las decisiones están en [research.md](./research.md), el estado en [data-model.md](./data-model.md) y los contratos en [contracts/interfaces.md](./contracts/interfaces.md).

## Decisiones para aprobar

Las dos son del usuario según la constitución (dependencias y esquema guardado). Las demás decisiones de este plan las cubre la spec o son internas.

1. **Cómo entra tonal** (research §1). Recomendación: `@tonaljs/note@4.12.3` y `@tonaljs/interval@5.1.1`, los dos módulos de `tonal@6.5.1` que se usan. Pesan 4,4 KB minificados. El paquete `tonal`, con el nombre de la constitución, pesa 27,1 KB porque no permite descartar lo que no se usa.
2. **Esquema guardado** (research §9). Recomendación: la misma clave y la versión 1, con `mode`, `progression` y `tonic`, cada uno con su `.catch` al valor por defecto, como en la entrega 3. Se revisaron las entregas 5 y 6, y las dos solo suman cosas sobre este esquema.

## Technical Context

**Language/Version**: TypeScript 7.0.2 (strict), Node 24

**Primary Dependencies**:

- Las de la entrega 3: React 19.3.1, Vite 8.3.5, Tailwind CSS 4.3.3, shadcn 4.22.1, tone 15.1.22, zustand 5.0.16 y zod 4.6.7.
- Se agregan `@tonaljs/note@4.12.3` y `@tonaljs/interval@5.1.1`, en versión exacta (decisión 1). Llegan en US2.
- Ningún componente nuevo de shadcn.

**Storage**: la misma clave de `localStorage` y la misma versión (1), con tres campos más (decisión 2).

**Testing**:

- Vitest 5.0.5: proyecto `ui` (jsdom, motor falso) y proyecto `audio` (Chromium y WebKit, motor real con `Tone.Offline`).
- Playwright 1.64.1 para E2E (`chromium` e `iphone`).

**Target Platform**: navegador de escritorio actual, y Safari en iOS 17 o superior. Se publica en Vercel como estáticos.

**Project Type**: SPA web, solo frontend

**Performance Goals**:

- Cada cambio de acorde, también los de mitad de compás, a menos de 1 ms de su momento (SC-001).
- Las vueltas largas (48 compases) se arman al pedir su primer compás, sin cortes en el audio: `barsOf` son 48 transposiciones de tonal, que se hacen en microsegundos.

**Constraints**:

- Las de las entregas anteriores: nunca `setTimeout` ni `setInterval` para el tiempo musical, el primer Play desbloquea el audio y las dependencias van en versión exacta.
- La pantalla de práctica no suma controles. El modo progresión solo cambia lo que muestran el carril, "Ahora", el contador y la línea de estado.
- El modo aleatorio no cambia de conducta: sus tests de UI y de audio siguen en verde sin tocarlos.

**Scale/Scope**: 4 historias sobre la misma pantalla y el mismo panel; 21 progresiones por 12 tónicas.

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

| Principio                 | Cómo se cumple                                                                                                                                                                                                                                                                                                                                                                               | Estado |
| ------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| I. Test-first             | Cada paso empieza con un test que falla: de UI sobre `<App engine={fake.engine} />`, buscando por rol y nombre ([contracts](./contracts/interfaces.md) §4); de `music/` por su API exportada (§3); o del store con el motor real y audio renderizado (research §12). Ningún test existente cambia: el refactor de la vuelta (US1, paso 3) se hace con los tests del modo aleatorio en verde. | ✅     |
| II. Entregas verticales   | Cada historia termina en una conducta que se prueba en la app abierta (quickstart §2). La primera es la más delgada: un ii–V–I en Do. El refactor de la vuelta es la única excepción, nombrada como **refactor puro** (US1, paso 3), y va seguido del paso que lo usa.                                                                                                                       | ✅     |
| III. Precisión del tiempo | Los acordes y los ataques del bajo en el cambio son eventos del plan por compás, programados por el motor de siempre en su tick del `Transport`. "Ahora" cambia de acorde con `onBeat` del golpe donde entra. El test `audio` mide cada cambio con el store real (research §12).                                                                                                             | ✅     |
| IV. Manos libres          | Ningún control nuevo en la pantalla de práctica: modo, progresión y tonalidad viven en el panel. El carril muestra la progresión completa y la vista previa de la vuelta siguiente, así que se ve lo que viene sin tocar nada. Los compases partidos caben a 320 px (E2E).                                                                                                                   | ✅     |
| V. Simplicidad            | Del stack, solo los dos módulos de tonal que se usan (decisión 1). La biblioteca es texto con un lector de unas líneas (research §6). Sin migración de datos (decisión 2). El motor no cambia (research §10).                                                                                                                                                                                | ✅     |
| Restricciones técnicas    | Todo dentro del stack. Interfaz en español; cifrado americano con la grafía de la tonalidad.                                                                                                                                                                                                                                                                                                 | ✅     |
| Flujo de trabajo          | Rama `005-modo-progresion`. Commit por paso en verde, con el issue de su historia; nunca en `main` ni push. Las dos decisiones del usuario de la spec están en GitHub (#30, #31) y en el diseño. Las decisiones 1 y 2 de este plan se aprueban antes de implementar. Los issues se cierran al quedar en verde en `main`.                                                                     | ✅     |

**Re-check post-diseño**: sin cambios. No hay violaciones que justificar.

## Project Structure

### Documentation (this feature)

```text
specs/005-modo-progresion/
├── plan.md              # Este archivo
├── research.md          # Fase 0: decisiones, spike y fuentes
├── data-model.md        # Fase 1: notas escritas, progresiones, vuelta, ajustes y lo que suena
├── quickstart.md        # Fase 1: cómo validar la entrega de punta a punta
├── contracts/
│   └── interfaces.md    # Fase 1: API de música, pantalla accesible y datos guardados
├── checklists/
│   └── requirements.md  # Calidad del spec
└── tasks.md             # Fase 2 (/speckit-tasks)
```

### Source Code (repository root)

Estado final. `(nuevo)` = archivo nuevo; `(cambia)` = archivo que ya existe y se modifica.

```text
e2e/
└── practice.spec.ts                    # (cambia) compases partidos a 320 px
package.json                            # (cambia) @tonaljs/note y @tonaljs/interval
src/
├── App.tsx                             # (cambia) línea de estado, contador y Play del modo progresión
├── progression-mode.test.tsx           # (nuevo) US1
├── keys.test.tsx                       # (nuevo) US2
├── library.test.tsx                    # (nuevo) US3
├── cycles.test.tsx                     # (nuevo) US4
├── music/
│   ├── notes.ts                        # (cambia) spell
│   ├── chords.ts                       # (cambia) raíz NoteId | Note; voicingOf con after
│   ├── chords.test.ts                  # (cambia) suma el movimiento de voces
│   ├── meters.ts                       # (cambia) splitAt; bassAttacks con changes
│   ├── meters.test.ts                  # (cambia) suma splitAt y changes
│   ├── progressions.ts                 # (nuevo) PROGRESSIONS, tonicOf, keyLabel, barsOf
│   └── progressions.test.ts            # (nuevo) las 21 progresiones en las 12 tónicas
├── practice/
│   ├── settings.ts                     # (cambia) mode, progression, tonic
│   ├── store.ts                        # (cambia) vuelta como lista de compases, setMode, setProgression, setTonic
│   └── progression.browser.test.ts     # (nuevo) store + motor real: cada cambio de acorde a tiempo
└── components/
    ├── now.tsx                         # (cambia) el acorde del golpe que suena
    ├── lane.tsx                        # (cambia) compases de la vuelta, partidos en dos partes
    └── settings-panel.tsx              # (cambia) Modo, Progresión, Tonalidad; oculta lo del aleatorio
```

**Structure Decision**:

- Se mantienen las carpetas de las entregas anteriores. `music/progressions.ts` va junto a `chords.ts` y `meters.ts`: datos y reglas musicales sin estado. Solo `progressions.ts` importa tonal.
- El test de audio del store va en `src/practice/` porque prueba el store con el motor real. El patrón `*.browser.test.ts` lo pone en el proyecto `audio`.
- Los tests de UI van uno por historia, en `src/`, y todos montan `App` completa.

## Orden sugerido para `/speckit-tasks` (porciones verticales)

Cada paso es test que falla → código mínimo → verde → commit con el issue (`#29`…`#32`). La rama ya existe. Antes del primer paso, las decisiones 1 y 2 tienen que estar aprobadas.

1. **US1 · #29: un ii–V–I en Do, en loop**.
   1. `progressions.test.ts` (falla). Debe comprobar:
      - `barsOf(ii-v-i-mayor, 'C', 4/4)`: 4 compases, Dm7, G7, Cmaj7 y Cmaj7, cada uno en `at: 0`, con raíces escritas (`label` `D`, `name` `Re`);
      - `keyLabel(…, 'C')` es `Do mayor`.

      Código: `spell` en `notes.ts`, `chordSymbol` y `chordName` con `NoteId | Note`, y `progressions.ts` con una sola progresión y el lector de compases de un acorde.

   2. `chords.test.ts` (falla). Debe comprobar:
      - que `voicingOf(b, tb, after)` da, entre las formas y octavas válidas, la de menor movimiento, y en un empate la más cercana a C4;
      - con Dm7 → G7 → Cmaj7 en las 12 raíces, que cada voicing sigue cumpliendo FR-008 y FR-009 de la entrega 3;
      - sin `after`, los 300 acordes dan lo mismo que hoy.

      Código: `after` en `voicingOf` (research §7).

   3. **Refactor puro** (excepción nombrada): la vuelta como lista de compases (research §2). No hay test nuevo: todos los tests de las entregas 1 a 3 siguen en verde. Código: `Round.bars`, `previewFrom` y `chordAt`; `barAt`, el carril, "Ahora", el contador y la vista previa leen `bars`. Commit `refactor: la vuelta como lista de compases (#29)`.

   4. `progression-mode.test.tsx` (falla). Debe comprobar:
      - el `radiogroup` "Modo" con "Aleatorio" por defecto;
      - en progresión, sin "Compases por nota" ni filtros de notas, y Play habilitado aunque lo guardado tenga una sola nota;
      - con Play, en `fake.played` el bajo en D, G, C y C en los compases 1 a 4 y otra vez D en el 5, la vuelta 2;
      - que el carril muestra `Dm7 G7 Cmaj7 Cmaj7`, "Ahora" `Dm7` y `Re menor séptima` con "Solo bajo", el contador `Vuelta 2 · compás 3 de 4` y la línea de estado `ii–V–I mayor · Do mayor · Analógico cálido · 60 BPM · 4/4`;
      - desde el último compás, la vista previa `Vuelta 2: Dm7`;
      - con "Bajo + acorde", un `chord` por compás, el G7 con `voicingOf('G', '7', <voicing del Dm7>)` y el primer Dm7 de la vuelta 2 sin `after`;
      - con "parar tras 3 vueltas", el contador `Vuelta 3 de 3 · …` y el fin tras el compás 12;
      - que cambiar de modo, sonando o en la cuenta, detiene el motor (`fake.running` falso);
      - que el modo se recuerda, y que un dato con la forma de la entrega 3 se conserva con los campos nuevos por defecto.

      Código: `mode`, `progression` y `tonic` en `settings.ts`; `setMode`, `canPlay` y la vuelta de progresión en el store; `changes` en `bassAttacks`; el `radiogroup` "Modo" en el panel; la línea de estado y el contador en `App.tsx`.

   5. `progression.browser.test.ts`, el test de aceptación de audio (research §12). Debe comprobar, con el store y el motor real, el ii–V–I con "Bajo + acorde" y "parar tras 2 vueltas":
      - 8 ataques del bajo y 8 del acorde, uno al inicio de cada compás de música, a menos de 1 ms;
      - con la raíz de su acorde;
      - y nada en la cuenta ni después del compás 8.

      Puede pasar al primer intento, porque el motor no cambia. Si pasa, se comprueba que falla corriendo a propósito un `at` en `barAt` y se deshace.
2. **US2 · #30: elegir tonalidad**.
   1. `progressions.test.ts` (falla): el ii–V–I en Fa (`Gm7 C7 Fmaj7`), Si (`C♯m7 F♯7 Bmaj7`) y Fa♯ (`G♯m7 C♯7 F♯maj7`); `tonicOf` con la tabla `major` en las 12 clases; `keyLabel` `Fa mayor` y `Re bemol mayor`. Código: `pnpm add -E @tonaljs/note@4.12.3 @tonaljs/interval@5.1.1` y el transporte de research §5.
   2. `keys.test.tsx` (falla). Debe comprobar:
      - el `radiogroup` "Tonalidad" con 12 radios en orden cromático, de `C` a `B`, con nombres `Do`, `Re bemol`… `Si`, y Do por defecto;
      - en Fa, el carril `Gm7 C7 Fmaj7 Fmaj7` y el bajo en G, C y F;
      - en Si, "Ahora" `C♯m7` y `Do sostenido menor séptima`, y la línea de estado `… · Si mayor · …`;
      - que un cambio de Do a Fa a mitad de la vuelta 1 deja en Do el resto de esa vuelta, y la vuelta 2 suena, se ve y se anuncia en Fa;
      - que un cambio durante el último compás, después de `askAhead`, aplica en la vuelta 3;
      - con la música detenida, en el siguiente Play;
      - que la tónica se recuerda.

      Código: `setTonic`, `tonic` en `nextRound`, el `radiogroup` en el panel y `keyLabel` en la línea de estado.
3. **US3 · #31: biblioteca completa con medio compás**.
   1. `meters.test.ts` (falla): `splitAt` en los 8 compases (research §4); `bassAttacks(4/4, 'whole', [0, 2])` da 0 y 2; `bassAttacks(4/4, 'quarter', [0, 2])` da 0, 1, 2 y 3 sin repetir; `bassAttacks(6/8, 'whole', [0, 3])` da 0 y 3. Código: `splitAt`.
   2. `progressions.test.ts` (falla). Debe comprobar:
      - las 17 progresiones de FR-018, en orden y por grupo;
      - en su tonalidad de origen, los compases de la spec (`×N` y compases partidos);
      - en las 12 tónicas, las reglas de [contracts](./contracts/interfaces.md) §3 (distancias, sin E♯, B♯, C♭, F♭ ni dobles alteraciones, y el largo de la forma);
      - la muestra a mano: la andaluza en La, Do, Do♯ y Mi♭; el ciclo diatónico en Fa♯; Giant Steps en Fa♯;
      - las tablas `minor` y `dorian` (`C♯`, `G♯`), y el modal en Fa (`Fm7`);
      - `at` en `splitAt`: el turnaround en 3/4 y en 7/8.

      Código: la biblioteca, `×N` y el compás partido en el lector, y las tablas de research §5.

   3. `library.test.tsx` (falla). Debe comprobar:
      - el `<select>` "Progresión" con los grupos Jazz y Pop, rock y latino y sus 17 opciones, y el ii–V–I mayor por defecto;
      - el blues de jazz: 12 compases, con el 11 y el 12 partidos en dos hijos con `data-at` `0` y `2`;
      - con redondas, en el compás 11 un `bass` en `at: 0` (C) y otro en `at: 2` (A);
      - con "Bajo + acorde", dos `chord` en el compás, de `length 2` cada uno;
      - "Ahora" `C7` en el golpe 1 del compás 11 y `A7` desde el golpe 3;
      - el modal: un `chord` al inicio de cada uno de sus 8 compases;
      - en 3/4, el segundo acorde en `at: 2`;
      - la andaluza con la tónica La (`Am G F E`) y con Do (`Cm B♭ A♭ G`, línea de estado `Do menor`);
      - que la tónica Fa se conserva al pasar del ii–V–I al blues;
      - que cambiar de progresión, sonando o en la cuenta, detiene el motor;
      - que la progresión se recuerda.

      Código: el `<select>` y `setProgression`; el carril con compases partidos (research §11); "Ahora" con `chordAt`; `barAt` con varios acordes por compás.

   4. `progression.browser.test.ts` (falla). Con el turnaround en 4/4 y en 3/4, redondas y "Bajo + acorde", cada ataque de mitad de compás (golpe 2 en los dos) cae a menos de 1 ms, con la raíz que le toca.
   5. E2E (falla): Giant Steps en la tónica Fa♯ con "Bajo + acorde", a 320 × 640 px. Las partes de los compases partidos no desbordan y no hay scroll horizontal. Código: el ajuste del cifrado a su parte en `lane.tsx`.
4. **US4 · #32: ciclos por las 12 tonalidades**.
   1. `progressions.test.ts` (falla). Debe comprobar:
      - las 4 progresiones de FR-019 en el grupo Ciclos, primero;
      - en Do, los compases de la spec (el ciclo de cuartas con `G♭`, el de quintas con `F♯`, el ii–V–I por las 12 con 48 compases y `A♭m7 D♭7 G♭maj7` en el 25);
      - desde Fa, el ciclo de cuartas `F ×2 | B♭ ×2 | …`, que termina en `C ×2`;
      - en los ciclos de solo raíces, acordes sin `type`;
      - `keyLabel` `desde Fa`;
      - los dominantes encadenados en Fa (`A7 D7 G7 C7 Fmaj7 Fmaj7`).

      Código: `cycle`, `rootsOnly` y la tabla de cuartas.

   2. `cycles.test.tsx` (falla). Debe comprobar:
      - el grupo Ciclos primero en el `<select>`;
      - el ciclo de cuartas desde Fa, con 24 compases en el carril;
      - con "Bajo + acorde", el `combobox` "Tipo de acorde", y con Cm7, "Ahora" `Fm7` y los `chord` con `voicingOf(…, 'm7', …)`;
      - con "Solo bajo", las raíces (`F`, `Fa`);
      - en el blues, sin "Tipo de acorde" aunque haya "Bajo + acorde";
      - el ii–V–I por las 12 con 48 compases, el contador `… compás 5 de 48` en `Gm7`, y la línea de estado `ii–V–I por las 12 tonalidades · desde Do · …`.

      Código: el selector de tipo según `rootsOnly` en el panel, y `keyLabel` en la línea de estado.
5. **Cierre**:
   - Pulido visual con el skill `frontend-design` de las secciones Modo, Progresión y Tonalidad, y de los compases partidos.
   - Validación completa: quickstart §1, con el tamaño del bundle.
   - La parte manual la hace el usuario: quickstart §2–§5.

## Complexity Tracking

Sin violaciones de la constitución.
