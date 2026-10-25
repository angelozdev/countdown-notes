# Data Model: Modo progresión con biblioteca (Entrega 4)

Extiende el [data model de la entrega 3](../004-acordes-aleatorio/data-model.md). Los tipos de acorde, los estilos, los canales y `sounding` no cambian. Lo nuevo: las notas escritas, las progresiones, la tónica, la vuelta como lista de compases y tres ajustes.

## Nota escrita (`src/music/notes.ts`)

`spell(name: string): Note`. `name` es una nota de tonal (`'C#'`, `'Gb'`, `'F'`) y devuelve un `Note` como los de `NOTES`:

| Campo     | `spell('C#')`    | `spell('Gb')` | Regla                                                          |
| --------- | ---------------- | ------------- | -------------------------------------------------------------- |
| `id`      | `'Db'`           | `'Gb'`        | El `NoteId` de su altura: lo que usan el bajo y `voicingOf`    |
| `label`   | `'C♯'`           | `'G♭'`        | `#` → `♯`, `b` → `♭`                                           |
| `name`    | `'Do sostenido'` | `'Sol bemol'` | Do, Re, Mi, Fa, Sol, La, Si + ` sostenido` o ` bemol` (FR-014) |
| `natural` | `false`          | `false`       | Sin alteración                                                 |

`chordSymbol` y `chordName` (entrega 3) aceptan `NoteId | Note` como raíz: con un `NoteId` usan `NOTE_BY_ID`, como hoy.

## Progresión (`src/music/progressions.ts`)

Tabla fija, en el orden de FR-016, FR-018 y FR-019.

| Campo       | Tipo                                         | Ejemplo                              | Uso                                                   |
| ----------- | -------------------------------------------- | ------------------------------------ | ----------------------------------------------------- |
| `id`        | `ProgressionId`                              | `'blues-jazz'`                       | Lo que se guarda                                      |
| `name`      | `string`                                     | `'Blues de jazz'`                    | El selector y la línea de estado                      |
| `group`     | `'Ciclos' \| 'Jazz' \| 'Pop, rock y latino'` | `'Jazz'`                             | El `<optgroup>`                                       |
| `key`       | `{ tonic: string; type: KeyType }`           | `{ tonic: 'C', type: 'major' }`      | La tonalidad de origen; `tonic` en formato de tonal   |
| `bars`      | `string`                                     | `'C7 \| F7 \| … \| C7 A7 \| Dm7 G7'` | Los compases en su tonalidad de origen (research §6)  |
| `cycle`     | `'fourths' \| 'fifths'` (opcional)           | —                                    | Si `bars` es la unidad que se transporta a 12 tónicas |
| `rootsOnly` | `true` (opcional)                            | —                                    | El tipo sale de los ajustes (FR-021)                  |

`KeyType` = `'major' | 'minor' | 'dorian'`. Los ids de `ProgressionId`, en orden:

- Ciclos: `ciclo-cuartas`, `ciclo-quintas`, `ii-v-i-12`, `dominantes-encadenados`.
- Jazz: `ii-v-i-mayor`, `ii-v-i-menor`, `turnaround`, `iii-vi-ii-v`, `ciclo-diatonico`, `sustituto-tritonal`, `backdoor`, `blues-jazz`, `blues-menor`, `modal`, `giant-steps`.
- Pop, rock y latino: `i-v-vi-iv`, `vi-iv-i-v`, `doo-wop`, `i-iv-v`, `blues-rock`, `andaluza`.

Derivados (API exportada):

| Función                               | Resultado                                                                                                |
| ------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `tonicOf(progression, tonic: NoteId)` | La tónica escrita con la tabla de la progresión (research §5): `tonicOf(andaluza, 'Db')` → `spell('C#')` |
| `keyLabel(progression, tonic)`        | `'Fa mayor'`, `'Do sostenido menor'`, `'Re dórico'`; en los ciclos de 12, `'desde Fa'`                   |
| `barsOf(progression, tonic, meter)`   | `RoundChord[][]`: los compases transportados y escritos, con el `at` del compás partido                  |

`barsOf`:

1. Lee `bars` (research §6). Cada compás tiene 1 o 2 acordes; el segundo entra en `splitAt(meter)`.
2. Sin `cycle`: transporta cada raíz de `key.tonic` a `tonicOf(…)` (research §5).
3. Con `cycle`: repite la unidad 12 veces, cada una transportada a la tónica siguiente por cuartas (+5) o por quintas (+7) desde la elegida, escrita con la tabla del ciclo.
4. Con `rootsOnly`, los acordes no llevan `type`.

Por ejemplo, `barsOf(ii-v-i-mayor, 'F', 4/4)` da `[[{ G, m7, 0 }], [{ C, 7, 0 }], [{ F, maj7, 0 }], [{ F, maj7, 0 }]]`, y `barsOf(turnaround, 'C', 3/4)` da `[[{ C, maj7, 0 }, { A, 7, 2 }], [{ D, m7, 0 }, { G, 7, 2 }]]`.

## Compás y figura (`src/music/meters.ts`)

| Función                                | Regla                                                                                        |
| -------------------------------------- | -------------------------------------------------------------------------------------------- |
| `splitAt(meter)`                       | El primer inicio de grupo `s` con `2s ≥ beats` (research §4)                                 |
| `bassAttacks(meter, figure, changes?)` | Los ataques de la figura más los de `changes`, sin repetir; cada uno dura hasta el siguiente |

## Vuelta (`Round`, estado del store)

Se reemplaza la forma de la entrega 1 (research §2):

| Campo         | Tipo             | Modo       | Regla                                          |
| ------------- | ---------------- | ---------- | ---------------------------------------------- |
| `number`      | `number`         | los dos    | 1, 2, 3…                                       |
| `meter`       | `MeterId`        | los dos    | Copia del ajuste al armarla                    |
| `firstBar`    | `number`         | los dos    | Compás global donde empieza; el 0 es la cuenta |
| `bars`        | `RoundChord[][]` | los dos    | Un elemento por compás, con 1 o 2 acordes      |
| `notes`       | `NoteId[]`       | aleatorio  | El orden sorteado, como hoy                    |
| `barsPerNote` | `number`         | aleatorio  | Copia del ajuste al sortearla                  |
| `progression` | `ProgressionId`  | progresión | La progresión que suena                        |
| `tonic`       | `NoteId`         | progresión | Copia del ajuste al armarla (FR-015)           |

`RoundChord = { root: Note; type?: ChordTypeId; at: number }`.

- `roundLength(round) = bars.length`.
- `previewFrom(round)`: `(notes.length − 1) × barsPerNote` en el aleatorio y `bars.length − 1` en la progresión. Cuando el motor pide ese compás, se arma la vuelta siguiente (research §8), salvo que "parar tras N vueltas" diga que es la última.
- `chordAt(chords, beat)`: el último acorde del compás con `at ≤ beat`.

## Ajustes (los que se guardan)

Los de la entrega 3, más (research §9, aprobado por el usuario):

| Campo         | Tipo                        | Por defecto      | Validación (zod, con `.catch`) | Cuándo aplica mientras suena |
| ------------- | --------------------------- | ---------------- | ------------------------------ | ---------------------------- |
| `mode`        | `'random' \| 'progression'` | `'random'`       | Uno de los dos                 | Detiene la práctica          |
| `progression` | `ProgressionId`             | `'ii-v-i-mayor'` | Uno de `PROGRESSIONS`          | Detiene la práctica          |
| `tonic`       | `NoteId`                    | `'C'`            | Uno de `NOTES`                 | Desde la siguiente vuelta    |

- Un dato guardado por la entrega 3 no tiene estos campos: cada uno toma su valor por defecto y el resto se conserva (FR-022). La versión sigue en 1.
- En el modo progresión, `notes` y `barsPerNote` se conservan aunque el panel no los muestre. `chordType` es el mismo para el modo aleatorio y para los ciclos de solo raíces.

## Compás programado (`Bar`, contrato con el motor, sin cambios)

Para un compás de música, `barAt(bar)` busca su vuelta y su lista `chords = round.bars[bar − firstBar]`:

| Evento  | Regla                                                                                                                                                                 |
| ------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `click` | Como en la entrega 2                                                                                                                                                  |
| `bass`  | `bassAttacks(meter, figure, chords.map(c => c.at))`; altura `${chordAt(chords, at).root.id}${octave}`                                                                 |
| `chord` | Con `withChord`, uno por acorde: `at` del acorde, `pitches = voicingOf(root.id, type ?? chordType, after)` y `length` hasta el acorde siguiente o el final del compás |

- `after` es el voicing del acorde anterior de la misma vuelta, solo en el modo progresión. El primer acorde de cada vuelta va sin `after` (research §7).
- `planned` y `sounding` siguen como en la entrega 3: `{ chordType: withChord ? chordType : null, style }`.

Por ejemplo, el compás 12 del blues de jazz en Do, 4/4, redondas, octava 2, "Bajo + acorde": `bass 'D2'` en 0 con `length 2` y `bass 'G2'` en 2 con `length 2`; `chord` Dm7 en 0 con `length 2` y `chord` G7 en 2 con `length 2`, el G7 con el voicing más cercano al Dm7.

## Derivados para la UI

| Derivado             | Regla                                                                                                                                             |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Cifrado de un acorde | `chordSymbol(root, t)` con `t = type ?? (withChord ? chordType : null)`; sin `t`, `root.label`                                                    |
| "Ahora"              | El acorde de `chordAt` en el golpe que suena; su tipo es `type ?? sounding.chordType`. Debajo, `chordName` o `root.name`                          |
| Carril               | Un `listitem` por compás de `rounds[0].bars`; con 2 acordes, dos partes de ancho proporcional                                                     |
| Vista previa         | `Vuelta {n}: {cifrado del primer acorde de rounds[1]}`                                                                                            |
| Contador             | Aleatorio, como hoy. Progresión: `Vuelta {n}[ de {N}] · compás {k} de {bars.length}`                                                              |
| Línea de estado      | Aleatorio, como hoy. Progresión: `{name} · {keyLabel} · {estilo} · {bpm} BPM · {compás}`, de `rounds[0]` mientras suena y de los ajustes detenida |
| `canPlay`            | `mode === 'progression' \|\| notes.length >= 2`                                                                                                   |
