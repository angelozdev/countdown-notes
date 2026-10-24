# Data Model: Práctica cómoda (Entrega 2)

Extiende el [data model de la entrega 1](../002-ya-me-sirve/data-model.md). Las notas no cambian. Lo nuevo: los compases, la figura del bajo, la mezcla, las repeticiones y los ajustes guardados en el dispositivo.

## Compás (`src/music/meters.ts`)

Tabla fija de 8 entradas (research §4). `MeterId` = `'2/4' | '3/4' | '4/4' | '5/4' | '6/8' | '7/8' | '9/8' | '12/8'`.

| Campo        | Tipo       | Ejemplo (6/8) | Uso                                                                    |
| ------------ | ---------- | ------------- | ---------------------------------------------------------------------- |
| `id`         | `MeterId`  | `'6/8'`       | Identificador y texto en la línea de estado y el panel                 |
| `beats`      | `number`   | 6             | Golpes de metrónomo por compás                                         |
| `beatLength` | `number`   | 1/3           | Lo que dura un golpe en unidades del BPM (FR-002)                      |
| `groups`     | `number[]` | `[3, 3]`      | Golpes de cada grupo de acento; también la cuenta y las marcas         |
| `soft`       | `boolean`  | `true`        | Si el primer golpe de cada grupo, salvo el primero, lleva acento suave |

| id   | beats | beatLength | groups        | soft |
| ---- | ----- | ---------- | ------------- | ---- |
| 2/4  | 2     | 1          | 1, 1          | no   |
| 3/4  | 3     | 1          | 1, 1, 1       | no   |
| 4/4  | 4     | 1          | 1, 1, 1, 1    | no   |
| 5/4  | 5     | 1          | 1, 1, 1, 1, 1 | no   |
| 6/8  | 6     | 1/3        | 3, 3          | sí   |
| 7/8  | 7     | 1          | 2, 2, 3       | sí   |
| 9/8  | 9     | 1/3        | 3, 3, 3       | sí   |
| 12/8 | 12    | 1/3        | 3, 3, 3, 3    | sí   |

Derivados:

- **Acento del golpe `b`**: `'strong'` si `b = 0`; `'soft'` si `b` empieza un grupo y `soft`; si no, `'none'`.
- **Grupo del golpe `b`**: el índice del grupo que lo contiene.
- **Corchea**: dura 0,5 golpe si `beatLength = 1` y el compás es simple (2/4–5/4); en los demás, 1 golpe.

## Figura del bajo

`BassFigure` = `'eighth' | 'quarter' | 'half' | 'whole'`, con las etiquetas `Corcheas`, `Negras`, `Blancas` y `Redondas`.

`bassAttacks(meter, figure)` → `{ at: number; length: number }[]`, en golpes (research §5):

| Figura    | Ataques                               |
| --------- | ------------------------------------- |
| `eighth`  | Cada corchea                          |
| `quarter` | El inicio de cada grupo               |
| `half`    | El inicio de los grupos de índice par |
| `whole`   | `at = 0`                              |

`length` = hasta el siguiente ataque o el final del compás.

## Ajustes (los que se guardan)

| Campo         | Tipo                                    | Por defecto                               | Validación (zod, con `.catch` al valor por defecto)                        | Cuándo aplica mientras suena       |
| ------------- | --------------------------------------- | ----------------------------------------- | -------------------------------------------------------------------------- | ---------------------------------- |
| `bpm`         | `number`                                | 60                                        | Entero 30–240                                                              | Desde el siguiente golpe           |
| `barsPerNote` | `number`                                | 2                                         | Entero 1–16                                                                | Desde la siguiente vuelta sorteada |
| `notes`       | `NoteId[]`                              | las 12                                    | `NoteId` válidos; se normaliza (únicos, cromático)                         | Desde la siguiente vuelta sorteada |
| `meter`       | `MeterId`                               | `'4/4'`                                   | Uno de los 8                                                               | Desde la siguiente vuelta sorteada |
| `bassFigure`  | `BassFigure`                            | `'whole'`                                 | Una de las 4                                                               | Desde el siguiente compás          |
| `bassOctave`  | `1 \| 2 \| 3`                           | 2                                         | 1, 2 o 3                                                                   | Desde el siguiente compás          |
| `mix`         | `Record<'click' \| 'bass', ChannelMix>` | `{ volume: 80, muted: false }` en los dos | `volume` entero 0–100; `muted` booleano. Cada canal se valida por separado | De inmediato                       |
| `repeats`     | `{ on: boolean; count: number }`        | `{ on: false, count: 10 }`                | `count` entero 1–999                                                       | De inmediato (FR-024)              |

- `canPlay` (derivado) = `notes.length >= 2`, igual que en la entrega 1. Unas notas guardadas por debajo de 2 son válidas.
- Los valores que el usuario escribe fuera de rango se limitan, como en la entrega 1. Los valores **guardados** fuera de rango no se limitan: se descartan (spec, Edge Cases).

### Guardado (`src/practice/settings.ts`)

- Clave `countdown-notes:ajustes`, con el valor `{ "version": 1, "settings": { …los campos de la tabla… } }`.
- **Carga**: al crear el store. El JSON se parsea y valida con `settingsSchema`:
  - un campo inválido o ausente → su valor por defecto;
  - un JSON roto, o algo que no es un objeto → todos los valores por defecto;
  - si `localStorage` no está disponible → todos los valores por defecto, y no se guarda.
- **Guardado**: con `store.subscribe`, cuando cambia alguno de los campos de la tabla (comparación superficial). No guarda el estado de la práctica (FR-032).

## Vuelta (`Round`)

Igual que en la entrega 1, más un campo:

| Campo   | Tipo      | Descripción                                      |
| ------- | --------- | ------------------------------------------------ |
| `meter` | `MeterId` | Copia del ajuste al sortearla; no cambia después |

- La vuelta 1 se sortea al dar Play, con el compás de ese momento. La cuenta de entrada (compás 0) usa el compás de la vuelta 1.
- **Sorteo de la siguiente**: cuando el reloj pide un compás `≥` el primero de la última nota de la vuelta actual, si todavía no hay siguiente y `!repeats.on || número < repeats.count` (research §7).

## Práctica (estado del store)

Igual que en la entrega 1 (`status`, `rounds`, `position`), con `position.beat` contado en golpes del compás de su vuelta.

### Transiciones

```text
stopped ──Play (canPlay)──▶ countIn ──onBeat(bar ≥ 1)──▶ playing
   ▲                           │                            │
   ├───────────Stop────────────┴────────────Stop────────────┤
   └──────────────────────onEnd (N vueltas)─────────────────┘
```

- **onEnd**: lo mismo que Stop. Llega cuando `barAt` devolvió `undefined`, en el momento en que ese compás empezaría.
- **setRepeats** mientras suena: si `repeats.on` y `rounds[0].number >= repeats.count`, se descarta `rounds[1]`, si existe.

### Derivados para la UI

| Derivado           | Regla                                                                                                     |
| ------------------ | --------------------------------------------------------------------------------------------------------- |
| Compás que suena   | `rounds[0]?.meter` mientras no está detenida; si no, `meter` de los ajustes (FR-011)                      |
| Cuenta regresiva   | Con `status = 'countIn'`: `groups.length − grupo(position.beat)` (FR-007)                                 |
| Marcas del compás  | `groups.length` marcas; en el actual se ilumina hasta el grupo de `position.beat` (FR-008)                |
| Contador           | `Vuelta {n} · nota {i} de {total}`, o `Vuelta {n} de {N} · nota {i} de {total}` con `repeats.on` (FR-021) |
| Barra de progreso  | De `beat / beats` a `(beat + 1) / beats`, en `beatLength × 60 / bpm` s                                    |
| Pantalla encendida | Pedida mientras `status !== 'stopped'` (FR-025)                                                           |

## Compás programado (`Bar`, contrato con el motor)

Lo que el store devuelve en `barAt(bar)`. El tipo exacto está en [contracts](./contracts/interfaces.md) §2.

| Compás       | `countIn` | Eventos                                                                                                                                 |
| ------------ | --------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| 0 (cuenta)   | `true`    | Un click por golpe, con su acento                                                                                                       |
| ≥ 1 (música) | —         | Un click por golpe, con su acento, más un `bass` por ataque de `bassAttacks(meter, bassFigure)`, con `{nota}{bassOctave}` y su `length` |
| Fin          | —         | `undefined`: ninguna vuelta contiene el compás                                                                                          |

Por ejemplo, en 4/4 con redondas, el compás 1 tiene `[{ at: 0, click 'strong' }, { at: 0, bass 'Bb2' length 4 }, { at: 1, click 'none' }, { at: 2, … }, { at: 3, … }]`, que es el mismo sonido de la entrega 1.
