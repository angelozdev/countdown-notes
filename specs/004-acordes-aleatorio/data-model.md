# Data Model: Acordes en modo aleatorio (Entrega 3)

Extiende el [data model de la entrega 2](../003-practica-comoda/data-model.md). Las notas, los compases, la figura del bajo y las vueltas no cambian. Lo nuevo: los tipos de acorde, los voicings, los estilos, el canal del acorde y lo que suena en cada compás.

## Tipo de acorde (`src/music/chords.ts`)

Tabla fija de 25 entradas, en el orden de FR-005. `ChordTypeId` = `'maj' | 'm' | 'dim' | 'aug' | 'sus4' | 'sus2' | '6' | 'm6' | '69' | 'maj7' | 'm7' | '7' | 'm7b5' | 'dim7' | 'mMaj7' | '7sus4' | 'maj9' | 'm9' | '9' | 'm11' | '13' | '7b9' | '7#9' | '7#11' | '7alt'`.

| Campo    | Tipo                 | Ejemplo (`m7b5`)             | Uso                                                                                 |
| -------- | -------------------- | ---------------------------- | ----------------------------------------------------------------------------------- |
| `id`     | `ChordTypeId`        | `'m7b5'`                     | Identificador; es lo que se guarda                                                  |
| `family` | `ChordFamily`        | `'Séptimas'`                 | El `<optgroup>` del selector (FR-012)                                               |
| `suffix` | `string`             | `'m7♭5'`                     | El cifrado: raíz + sufijo (FR-005)                                                  |
| `name`   | `string`             | `'semidisminuido'`           | El nombre en español: nombre de la raíz + nombre del tipo                           |
| `forms`  | `number[][]` (1 o 2) | `[[3, 6, 10], [10, 15, 18]]` | Semitonos desde la raíz; una forma en las tríadas, A y B en los demás (research §5) |

`ChordFamily` = `'Tríadas' | 'Sextas' | 'Séptimas' | 'Extensiones' | 'Dominantes alterados'`, en ese orden.

Derivados (API exportada):

| Función                   | Resultado (raíz `'Gb'`, tipo `m7`) | Regla                                                     |
| ------------------------- | ---------------------------------- | --------------------------------------------------------- |
| `chordSymbol(root, type)` | `'F♯m7'`                           | `NOTE_BY_ID[root].label + suffix`                         |
| `chordName(root, type)`   | `'Fa sostenido menor séptima'`     | `NOTE_BY_ID[root].name + ' ' + name`                      |
| `voicingOf(root, type)`   | `['A3', 'Db4', 'E4']`              | La forma y la octava de research §5, como alturas de Tone |

- **Alturas**: MIDI → `` `${NOTES[midi % 12].id}${Math.floor(midi / 12) - 1}` ``, con los mismos ids que usa el bajo (`'Db4'`, `'Gb3'`).
- **Tríadas**: la raíz en MIDI `48 + clase de la raíz`, más la forma.
- **4 notas o más**: de las formas A y B, desplazadas por octavas, las que caen enteras en 48–76; gana la de altura media más cercana a 60, y la A en caso de empate.

## Estilo

`Style` = `'warm' | 'pad'`, con las etiquetas `Analógico cálido` y `Pad ambiental`. El sonido de cada uno está en research §4.

## Ajustes (los que se guardan)

Los de la entrega 2, más:

| Campo       | Tipo          | Por defecto                    | Validación (zod, con `.catch` al valor por defecto) | Cuándo aplica mientras suena |
| ----------- | ------------- | ------------------------------ | --------------------------------------------------- | ---------------------------- |
| `withChord` | `boolean`     | `false` ("solo bajo")          | Booleano                                            | Desde el siguiente compás    |
| `chordType` | `ChordTypeId` | `'maj'`                        | Uno de `CHORD_TYPES`                                | Desde el siguiente compás    |
| `style`     | `Style`       | `'warm'`                       | `'warm'` o `'pad'`                                  | Desde el siguiente compás    |
| `mix.chord` | `ChannelMix`  | `{ volume: 80, muted: false }` | Como los otros canales                              | De inmediato                 |

- Un dato guardado por la entrega 2 no tiene estos campos: cada uno toma su valor por defecto y el resto se conserva (FR-019, research §9). La versión del guardado sigue en 1.
- Con `withChord = false`, `chordType` y `mix.chord` se conservan, aunque el panel no los muestre.

## Lo que suena (`sounding`, estado del store)

`sounding: { chordType: ChordTypeId | null; style: Style } | null`. Es lo que se armó para el compás que está sonando (research §7).

- `barAt(bar)`, para un compás de música, guarda en un `Map` interno `{ chordType: withChord ? chordType : null, style }`.
- `onBeat(bar, 0)` pasa ese valor a `sounding` y lo borra del `Map`. Los demás golpes no lo tocan.
- `play` y `stop` dejan `sounding = null` y vacían el `Map`. La cuenta de entrada no lo cambia, así que queda en `null`.

### Derivados para la UI

| Derivado                      | Regla                                                                                                                   |
| ----------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| "Ahora", con acorde           | Si `sounding.chordType`: `chordSymbol(nota, chordType)` y, debajo, `chordName(…)`; si no, la nota, como en la entrega 2 |
| Compás actual del carril      | El acorde de `sounding`, igual que "Ahora"                                                                              |
| Otros compases y vista previa | Con `withChord`: `chordSymbol(nota, chordType)` de los ajustes; si no, la nota                                          |
| Estilo en la línea de estado  | `sounding?.style ?? style` mientras suena; `style` con la música detenida (FR-017)                                      |

## Compás programado (`Bar`, contrato con el motor)

Lo que el store devuelve en `barAt(bar)`. El tipo exacto está en [contracts](./contracts/interfaces.md) §2.

| Compás       | `style` | Eventos                                                                                                                                    |
| ------------ | ------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| 0 (cuenta)   | —       | Como en la entrega 2: un click por golpe, con `countIn: true`                                                                              |
| ≥ 1 (música) | `style` | Los de la entrega 2 y, con `withChord`, un `{ at: 0, sound: { kind: 'chord', pitches: voicingOf(nota, chordType), length: meter.beats } }` |
| Fin          | —       | `undefined`                                                                                                                                |

El orden de los eventos en el mismo `at` es click, bajo y acorde, porque el `sort` es estable.

Por ejemplo, en 4/4 con redondas, Cm7 sobre F♯ y Pad ambiental, el compás 1 tiene `style: 'pad'` y los eventos `[{ at: 0, click 'strong' }, { at: 0, bass 'Gb2' length 4 }, { at: 0, chord ['A3', 'Db4', 'E4'] length 4 }, { at: 1, click 'none' }, …]`.

## Canal

`Channel` = `'click' | 'bass' | 'chord'`. El volumen 80 del acorde equivale al bus de −4 dB del Anexo A (`BASE_DB.chord = −4`), con la misma curva que los otros canales (entrega 2, research §6). Los tres canales salen por `output` y por el soft clipper (research §2).
