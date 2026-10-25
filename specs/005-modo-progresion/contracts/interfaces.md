# Contratos: Modo progresión con biblioteca (Entrega 4)

Las mismas partes que en la [entrega 3](../../004-acordes-aleatorio/contracts/interfaces.md). Aquí va solo lo que cambia, en su estado final; cada parte indica en qué historia llega.

## 1. Comandos

Sin cambios.

## 2. Motor de audio

Sin cambios: ni `engine.ts`, ni el motor real, ni el falso (research §10). Un compás partido son dos eventos `bass` y dos `chord`, con su `at` y su `length`.

## 3. Música (API exportada)

### `src/music/notes.ts`

```ts
/** 'C#' → { id: 'Db', label: 'C♯', name: 'Do sostenido', natural: false } */
export function spell(name: string): Note
```

US1. Lo prueba `progressions.test.ts` a través de `barsOf` y `tonicOf`.

### `src/music/chords.ts`

```ts
/** 'F♯m7'; con un Note, su label: chordSymbol(spell('C#'), 'm7') → 'C♯m7' */
export function chordSymbol(root: NoteId | Note, type: ChordTypeId): string
/** 'Do sostenido menor séptima' */
export function chordName(root: NoteId | Note, type: ChordTypeId): string
/** Con after, el voicing que menos se mueve desde after (research §7); sin after, el de la entrega 3. */
export function voicingOf(
  root: NoteId,
  type: ChordTypeId,
  after?: string[]
): string[]
```

- `NoteId | Note` llega en US1 (las raíces de la biblioteca son `Note`), y `after` también.
- Lo que prueba `chords.test.ts` (SC-004): para los pares de acordes de 4 notas o más de la biblioteca, en las 12 tónicas, `voicingOf(b, tb, voicingOf(a, ta))` cumple FR-008 y FR-009 de la entrega 3 y su movimiento es el menor entre todas las formas y octavas válidas. Sin `after`, los 300 acordes dan lo mismo que en la entrega 3.

### `src/music/meters.ts`

```ts
/** El golpe donde entra el segundo acorde de un compás partido (research §4). */
export function splitAt(meter: Meter): number
/** Los ataques de la figura más los de changes, sin repetir; cada uno dura hasta el siguiente. */
export function bassAttacks(
  meter: Meter,
  figure: BassFigure,
  changes?: number[]
): { at: number; length: number }[]
```

- `splitAt` y `changes` llegan en US3, con el compás partido.
- `meters.test.ts` suma `splitAt` en los 8 compases (tabla de research §4) y `bassAttacks` con `changes` en 4/4 y 6/8 con redondas y negras.

### `src/music/progressions.ts`

```ts
export type KeyType = 'major' | 'minor' | 'dorian'
export type ProgressionGroup = 'Ciclos' | 'Jazz' | 'Pop, rock y latino'
export type ProgressionId = 'ii-v-i-mayor' | … // data-model, en orden
export type RoundChord = { root: Note; type?: ChordTypeId; at: number }

export type Progression = {
  id: ProgressionId
  name: string
  group: ProgressionGroup
  key: { tonic: string; type: KeyType }
  bars: string
  cycle?: 'fourths' | 'fifths'
  rootsOnly?: true
}

/** En el orden de FR-016, FR-018 y FR-019. */
export const PROGRESSIONS: Progression[]
export const PROGRESSION_BY_ID: Record<ProgressionId, Progression>

/** La tónica escrita con la tabla de la progresión. */
export function tonicOf(progression: Progression, tonic: NoteId): Note
/** 'Fa mayor', 'Do sostenido menor', 'Re dórico', 'desde Fa' */
export function keyLabel(progression: Progression, tonic: NoteId): string
/** Los compases transportados a la tónica y escritos, partidos según el compás. */
export function barsOf(progression: Progression, tonic: NoteId, meter: Meter): RoundChord[][]
```

| Historia | Lo que trae                                                                                           |
| -------- | ----------------------------------------------------------------------------------------------------- |
| US1      | Solo `ii-v-i-mayor`; `barsOf` lee el texto en la tónica de origen. `tonicOf` y `keyLabel` en Do mayor |
| US2      | El transporte con tonal y las tablas `major` y `minor`/`dorian`                                       |
| US3      | Las 17 progresiones de FR-018, el compás partido y `×N`                                               |
| US4      | Las 4 de FR-019, `cycle`, `rootsOnly` y la tabla de cuartas                                           |

Lo que prueba `progressions.test.ts` por esta API (SC-002):

- en la tónica de origen, cada progresión da exactamente los compases de FR-018 y FR-019, escritos como en la spec (el test compara con las mismas cadenas);
- para las 21 progresiones en las 12 tónicas: cada raíz está a la misma distancia de la tónica que en el origen, ninguna se escribe con E♯, B♯, C♭, F♭ ni doble alteración, y la vuelta tiene los compases de su forma (los ciclos, 12 veces la unidad);
- una muestra escrita a mano: el ii–V–I en Fa (`Gm7 C7 Fmaj7`), Si (`C♯m7 F♯7 Bmaj7`), Fa♯ (`G♯m7 C♯7 F♯maj7`) y Sol♭ en el ii–V–I por las 12 (`A♭m7 D♭7 G♭maj7`); la andaluza en La, Do, Do♯ y Mi♭ (`E♭m D♭ B B♭`); el ciclo diatónico en Fa♯ (`Fm7♭5` en el lugar de E♯m7♭5); con la tónica `'Gb'`, el ciclo de cuartas empieza en `G♭` y el de quintas en `F♯`.
- `splitAt` en el compás partido: el segundo acorde del turnaround en 3/4 entra en 2 y en 7/8, en 4.

## 4. Pantalla de práctica y panel (lo que buscan los tests)

Se agrega a las tablas de la entrega 3. Los tests buscan por rol y nombre accesible.

### Pantalla de práctica

| Elemento                    | Rol / atributo   | Nombre accesible o texto                                                                                                                | Historia |
| --------------------------- | ---------------- | --------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| "Ahora", en progresión      | texto en "Ahora" | El cifrado del acorde del golpe que suena (`Dm7`) y su nombre (`Re menor séptima`), también con "Solo bajo"                             | US1      |
| Compás del carril           | `listitem`       | Su `textContent` es el cifrado (`Dm7`); partido, los dos cifrados en orden (`C7A7`), cada uno en un elemento hijo con `data-at`         | US1, US3 |
| Contador, en progresión     | texto            | `Vuelta {n} · compás {k} de {total}`; con repeticiones, `Vuelta {n} de {N} · compás {k} de {total}`                                     | US1      |
| Línea de estado, progresión | texto            | `{progresión} · {tonalidad} · {estilo} · {bpm} BPM · {compás}`, por ejemplo `ii–V–I mayor · Fa mayor · Analógico cálido · 60 BPM · 4/4` | US1, US2 |
| Vista previa de la vuelta   | texto            | `Vuelta {n}: {cifrado}`, como en la entrega 3                                                                                           | US1      |

### Panel de ajustes

| Elemento                 | Rol                     | Nombre accesible                                                                                                                          | Historia |
| ------------------------ | ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| Modo                     | `radiogroup` + `radio`  | `Modo`; radios `Aleatorio`, `Progresión`                                                                                                  | US1      |
| Progresión               | `combobox` (`<select>`) | `Progresión`; un `group` por grupo con su nombre, opciones con el nombre de la progresión. Solo en progresión                             | US3, US4 |
| Tonalidad                | `radiogroup` + `radio`  | `Tonalidad`; 12 radios con el nombre en español de la tónica (`Fa`, `Re bemol` o `Do sostenido`) y el cifrado visible. Solo en progresión | US2      |
| Compases por nota, notas | —                       | No están en el modo progresión                                                                                                            | US1      |
| Tipo de acorde           | `combobox`              | Como en la entrega 3, con "Bajo + acorde", en el modo aleatorio y en los ciclos de solo raíces                                            | US4      |

- En US1 y US2 no hay selector de progresión: suena el ii–V–I mayor. US3 suma el `<select>` con Jazz y Pop, rock y latino; US4, el grupo Ciclos al principio.
- El `value` de cada opción del selector es su `ProgressionId`. Los tests eligen con `user.selectOptions(combobox, 'Blues de jazz')`.

### Datos guardados

- Misma clave y misma versión (`{ "version": 1, "settings": { … } }`), con `mode`, `progression` y `tonic` ([data-model](../data-model.md), Ajustes).
- Los tests de US1 escriben a mano un dato con la forma de la entrega 3, sin los campos nuevos, y comprueban que se conserva y que los nuevos toman su valor por defecto (FR-022).
