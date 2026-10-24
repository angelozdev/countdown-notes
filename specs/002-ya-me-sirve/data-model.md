# Data Model: "Ya me sirve" (Entrega 1)

Todo vive en memoria: esta entrega no guarda nada en el dispositivo. Al recargar, todo vuelve a los valores por defecto.

## Nota (`src/music/notes.ts`)

Tabla fija de 12 entradas, en orden cromático.

| Campo     | Tipo      | Ejemplo      | Uso                                                     |
| --------- | --------- | ------------ | ------------------------------------------------------- |
| `id`      | `NoteId`  | `'Bb'`       | Identificador; también es la altura para Tone (`'Bb2'`) |
| `label`   | `string`  | `'B♭'`       | Cifrado americano en filtros, "Ahora" y carril (FR-022) |
| `name`    | `string`  | `'Si bemol'` | Nombre en español debajo de "Ahora" (FR-025)            |
| `natural` | `boolean` | `false`      | Para los atajos de naturales y alteradas (FR-021)       |

`NoteId` = `'C' | 'Db' | 'D' | 'Eb' | 'E' | 'F' | 'Gb' | 'G' | 'Ab' | 'A' | 'Bb' | 'B'`. El `id` de F♯ es `'Gb'`, que es la misma altura; su `label` es `'F♯'`.

| id  | label | name         | natural |
| --- | ----- | ------------ | ------- |
| C   | C     | Do           | sí      |
| Db  | D♭    | Re bemol     | no      |
| D   | D     | Re           | sí      |
| Eb  | E♭    | Mi bemol     | no      |
| E   | E     | Mi           | sí      |
| F   | F     | Fa           | sí      |
| Gb  | F♯    | Fa sostenido | no      |
| G   | G     | Sol          | sí      |
| Ab  | A♭    | La bemol     | no      |
| A   | A     | La           | sí      |
| Bb  | B♭    | Si bemol     | no      |
| B   | B     | Si           | sí      |

## Ajustes

| Campo         | Tipo       | Por defecto | Validación                                   | Cuándo aplica mientras suena                |
| ------------- | ---------- | ----------- | -------------------------------------------- | ------------------------------------------- |
| `bpm`         | `number`   | 60          | Entero, se limita a 30–240 (FR-010)          | Desde el siguiente tiempo (FR-011)          |
| `barsPerNote` | `number`   | 2           | Entero, se limita a 1–16 (FR-017)            | Desde la siguiente vuelta sorteada          |
| `notes`       | `NoteId[]` | las 12      | Sin duplicados; se guarda en orden cromático | Desde la siguiente vuelta sorteada (FR-024) |

- `canPlay` (derivado) = `notes.length >= 2` (FR-023).
- Un valor que no es número entero se descarta y queda el anterior.

## Vuelta (`Round`)

| Campo         | Tipo       | Descripción                                                       |
| ------------- | ---------- | ----------------------------------------------------------------- |
| `number`      | `number`   | 1, 2, 3, … (contador "Vuelta 2")                                  |
| `notes`       | `NoteId[]` | Orden sorteado; cada nota del pool una vez (FR-014)               |
| `barsPerNote` | `number`   | Copia del ajuste al sortearla; no cambia después                  |
| `firstBar`    | `number`   | Compás global donde empieza (el compás 0 es la cuenta de entrada) |

- Largo en compases = `notes.length × barsPerNote`. La vuelta siguiente empieza en `firstBar + largo`.
- La nota del compás `b` = `notes[⌊(b − firstBar) / barsPerNote⌋]`.
- **Reglas del sorteo** (research §7):
  - Pool = `notes` de los ajustes si tiene 2 o más; si no, las `notes` de la vuelta anterior.
  - Si hay vuelta anterior, la primera nota ≠ la última de esa vuelta (FR-015).
  - La vuelta 1 se sortea al dar Play, con `firstBar = 1`.
  - La siguiente se sortea cuando el reloj pide los sonidos del primer compás de la última nota de la vuelta actual (FR-033).

## Práctica (estado del store)

| Campo      | Tipo                                    | Descripción                                                                        |
| ---------- | --------------------------------------- | ---------------------------------------------------------------------------------- |
| `status`   | `'stopped' \| 'countIn' \| 'playing'`   | Estado de la reproducción                                                          |
| `rounds`   | `Round[]`                               | La vuelta que suena y, desde su última nota, la siguiente. Vacío si está detenida. |
| `position` | `{ bar: number; beat: number } \| null` | Lo que está sonando ahora (lo fija `onBeat`). `null` antes del primer tiempo.      |

### Transiciones

```text
stopped ──Play (canPlay)──▶ countIn ──onBeat(bar ≥ 1)──▶ playing
   ▲                           │                            │
   └───────────Stop────────────┴────────────Stop────────────┘
```

- **Play**: sortea la vuelta 1, `status = 'countIn'`, `position = null` y arranca el motor con el BPM actual. Solo si `canPlay` y está detenida.
- **`onBeat(bar, beat)`**:
  - fija `position`;
  - pasa a `'playing'` cuando `bar ≥ 1`;
  - descarta las vueltas que ya terminaron (`firstBar + largo ≤ bar`).
- **Stop**: detiene el motor, `status = 'stopped'`, `rounds = []` y `position = null`. El próximo Play empieza desde cero (FR-008).

### Derivados para la UI

| Derivado                       | Regla                                                                                         |
| ------------------------------ | --------------------------------------------------------------------------------------------- |
| Cuenta regresiva               | Con `status = 'countIn'`: `4 − (position?.beat ?? 0)` (FR-026)                                |
| Vuelta actual                  | `rounds[0]`                                                                                   |
| Nota actual                    | La nota del compás `position.bar` en la vuelta actual                                         |
| Contador                       | `Vuelta {number} · nota {índice + 1} de {notes.length}` (FR-030)                              |
| Vista previa                   | `rounds[1]?.notes[0]`, al final del carril (FR-033)                                           |
| Estado del compás en el carril | `played` (< actual), `current`, `near` (hasta el final de la fila siguiente) o `far` (FR-028) |

## Sonido (contrato con el motor)

Lo que el store le pide al motor para cada tiempo (`soundsAt(bar, beat)`):

| Compás       | Tiempo 0                                              | Tiempos 1–3                        |
| ------------ | ----------------------------------------------------- | ---------------------------------- |
| 0 (cuenta)   | `{ kind: 'click', accent: true }`                     | `{ kind: 'click', accent: false }` |
| ≥ 1 (música) | click con acento + `{ kind: 'bass', pitch: '<id>2' }` | `{ kind: 'click', accent: false }` |

El tipo exacto está en [contracts](./contracts/interfaces.md) §2.
