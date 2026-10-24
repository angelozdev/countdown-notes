# Contratos: Acordes en modo aleatorio (Entrega 3)

Las mismas partes que en la [entrega 2](../../003-practica-comoda/contracts/interfaces.md): los comandos, el contrato del motor, la API de acordes, la pantalla y el panel (lo que buscan los tests de UI y E2E) y los datos guardados. Aquí va solo lo que cambia, en su estado final; cada parte indica en qué historia llega.

## 1. Comandos

Sin cambios.

## 2. Motor de audio (`src/audio/engine.ts`)

Cambia de forma aditiva (research §3). Lo que no aparece aquí sigue igual que en la entrega 2.

```ts
export type Style = 'warm' | 'pad'

export type Sound =
  | { kind: 'click'; accent: Accent }
  | { kind: 'bass'; pitch: string; length: number } // altura de Tone ('Bb2'); length en golpes
  | { kind: 'chord'; pitches: string[]; length: number } // alturas de Tone ('Gb3'); length en golpes

export type Channel = 'click' | 'bass' | 'chord'

/** volume de 0 a 100; 80 es la mezcla de la entrega 1 (y, en el acorde, el bus de −4 dB del Anexo A). */
export type Mix = Record<Channel, { volume: number; muted: boolean }>

export type Bar = {
  beats: number
  beatLength: number
  countIn?: boolean
  /** El estilo del bajo y del acorde de este compás; sin él, 'warm'. */
  style?: Style
  events: { at: number; sound: Sound }[]
}
```

- `Channel` con `'chord'` y `Sound` con `kind: 'chord'` llegan en US1; `Style` y `Bar.style`, en US3.
- `EngineStart` y `Engine` no cambian. Valen las mismas garantías de la entrega 2.

**Motor real** (`src/audio/tone-engine.ts`), además de lo de la entrega 2:

- Un `chord` con `at` en el compás que empieza en `t_c` ataca sus `pitches` a la vez en `t_c + at × beatLength × 60 / b` (± 1 ms), y los sostiene el 90 % de `length` (US1).
- El bajo y el acorde de un compás suenan con el sintetizador de `bar.style` (US3). Lo que quedó sonando de otro estilo termina su caída sin cortarse.
- La salida nunca pasa de 1,0 en valor absoluto (soft clipper, research §2, US1). Por debajo de 0,8, la salida es igual a la suma de los canales.

**Motor falso** (`src/test/fake-engine.ts`): sin cambios de forma. `played` registra también los `chord`, y `bars` los `Bar` con su `style`.

## 3. Acordes (`src/music/chords.ts`, API exportada)

```ts
export type ChordTypeId = 'maj' | 'm' | 'dim' | 'aug' | 'sus4' | 'sus2'
  | '6' | 'm6' | '69'
  | 'maj7' | 'm7' | '7' | 'm7b5' | 'dim7' | 'mMaj7' | '7sus4'
  | 'maj9' | 'm9' | '9' | 'm11' | '13'
  | '7b9' | '7#9' | '7#11' | '7alt'

export type ChordFamily = 'Tríadas' | 'Sextas' | 'Séptimas' | 'Extensiones' | 'Dominantes alterados'

export type ChordType = {
  id: ChordTypeId
  family: ChordFamily
  suffix: string // 'm7♭5'
  name: string // 'semidisminuido'
  forms: number[][] // semitonos desde la raíz (research §5)
}

/** Los 25 tipos, en el orden de FR-005. */
export const CHORD_TYPES: ChordType[]
export const CHORD_TYPE_BY_ID: Record<ChordTypeId, ChordType>

/** 'F♯m7' */
export function chordSymbol(root: NoteId, type: ChordTypeId): string
/** 'Fa sostenido menor séptima' */
export function chordName(root: NoteId, type: ChordTypeId): string
/** Alturas de Tone, de grave a agudo: ['A3', 'Db4', 'E4'] */
export function voicingOf(root: NoteId, type: ChordTypeId): string[]
```

- US1 trae las 6 tríadas; US2, los 19 tipos restantes. El tipo `ChordTypeId` puede crecer con la tabla.
- Lo que prueba `chords.test.ts` por esta API (SC-002 y SC-003), para cada raíz y cada tipo:
  - el cifrado y el nombre de la tabla de FR-005;
  - en las tríadas, las tres notas de FR-007, con la raíz en la octava 3;
  - en los demás, de 3 a 5 notas, sin la clase de la raíz y con las clases de FR-008;
  - todas las alturas entre C3 y E5.

## 4. Pantalla de práctica y panel (lo que buscan los tests)

Se agrega a las tablas de la entrega 2. Los tests buscan por rol y nombre accesible.

### Pantalla de práctica

| Elemento                      | Rol / atributo   | Nombre accesible o texto                                                                | Historia |
| ----------------------------- | ---------------- | --------------------------------------------------------------------------------------- | -------- |
| "Ahora", con acorde           | texto en "Ahora" | El cifrado (`F♯m`) y, debajo, el nombre (`Fa sostenido menor`)                          | US1      |
| Compás del carril, con acorde | `listitem`       | Su `textContent` es el cifrado (`F♯m`); sin acorde, la nota, como en la entrega 2       | US1      |
| Vista previa de la vuelta     | texto            | `Vuelta {n}: {cifrado}` con acorde; `Vuelta {n}: {nota}` sin acorde                     | US1      |
| Línea de estado               | texto            | `Aleatorio · {estilo} · {bpm} BPM · {compás}`, con `Analógico cálido` o `Pad ambiental` | US3      |

### Panel de ajustes

| Elemento       | Rol                       | Nombre accesible                                                                                                                                              | Historia |
| -------------- | ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| Qué suena      | `radiogroup` + `radio`    | `Qué suena`; radios `Solo bajo`, `Bajo + acorde`                                                                                                              | US1      |
| Tipo de acorde | `combobox` (`<select>`)   | `Tipo de acorde`; un `group` por familia con su nombre, y opciones `{cifrado sobre Do} · {nombre del tipo}` (`Cm7 · menor séptima`). Solo con `Bajo + acorde` | US1, US2 |
| Volumen        | `slider`                  | Suma `Volumen del acorde` (0–100), solo con `Bajo + acorde`                                                                                                   | US1      |
| Silenciar      | `button` (`aria-pressed`) | Suma `Silenciar acorde`, solo con `Bajo + acorde`                                                                                                             | US1      |
| Estilo         | `radiogroup` + `radio`    | `Estilo`; radios `Analógico cálido`, `Pad ambiental`                                                                                                          | US3      |

- En US1, el selector tiene un solo grupo, `Tríadas`. En US2 tiene los 5, en el orden de FR-005.
- El `value` de cada opción es su `ChordTypeId`. Los tests eligen con `user.selectOptions(combobox, 'Cm7 · menor séptima')`.

### Datos guardados

- Misma clave y misma versión (`{ "version": 1, "settings": { … } }`), con los campos nuevos de [data-model](../data-model.md) (Ajustes).
- Los tests de US1 escriben a mano un dato con la forma de la entrega 2, sin los campos nuevos, y comprueban que se conserva y que los nuevos toman su valor por defecto (FR-019).
