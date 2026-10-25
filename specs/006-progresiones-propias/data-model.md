# Data Model: Progresiones propias (Entrega 5)

Extiende el [data model de la entrega 4](../005-modo-progresion/data-model.md). No cambian las notas escritas, los compases ni la vuelta, ni lo que el store le pide al motor. Lo nuevo:

- acordes y compases escritos;
- la progresión propia y su forma guardada;
- el borrador del editor;
- que `progression` acepte ids propios.

## Acorde y compás escritos (`src/music/progression-text.ts`)

| Tipo           | Forma                                             | Ejemplo                                                |
| -------------- | ------------------------------------------------- | ------------------------------------------------------ |
| `WrittenChord` | `{ root: string; type: ChordTypeId }`             | `{ root: 'Bb', type: 'm7b5' }`, que es B♭m7♭5          |
| `WrittenBar`   | `WrittenChord[]`, con 1 o 2 acordes               | `[{ root: 'C', type: '7' }, { root: 'A', type: '7' }]` |
| `TextError`    | `{ start: number; end: number; message: string }` | `{ start: 4, end: 7, message: 'No reconozco «Hm7».' }` |

- `root` va en el formato de tonal: letra mayúscula y `#` o `b`, nunca E♯, B♯, C♭ ni F♭ (research §5). Es la grafía tal como se escribió, en la tonalidad de origen.
- `parseProgression(text)` da `{ bars: WrittenBar[] }` o `{ errors: TextError[] }`, nunca los dos.
- `formatProgression(bars)` da el texto de siempre: `'Cmaj7 | C7 A7 | Dm7 G7'`.

## Progresión propia (`src/music/progressions.ts`)

| Campo  | Tipo                                          | Ejemplo                         | Regla                                      |
| ------ | --------------------------------------------- | ------------------------------- | ------------------------------------------ |
| `id`   | `` MyProgressionId = `propia-${number}` ``    | `'propia-3'`                    | El siguiente al mayor en uso (research §4) |
| `name` | `string`                                      | `'Andaluza mía'`                | No vacío; puede repetirse                  |
| `key`  | `{ tonic: NoteId; type: 'major' \| 'minor' }` | `{ tonic: 'A', type: 'minor' }` | La tonalidad de origen (FR-011)            |
| `bars` | `WrittenBar[]`                                | ver arriba                      | Al menos un compás                         |

Cambios en lo que ya existe:

- `ProgressionGroup` suma `'Mis progresiones'`.
- `Progression.id` pasa a `ProgressionId | MyProgressionId`.

`myProgression(mine: MyProgression): Progression` la convierte para `barsOf` y compañía (research §6):

| Campo de `Progression` | Valor                                                                                |
| ---------------------- | ------------------------------------------------------------------------------------ |
| `id`, `name`           | Los suyos                                                                            |
| `group`                | `'Mis progresiones'`                                                                 |
| `key`                  | `{ tonic: TONICS[type][tonic], type }`, por ejemplo `{ tonic: 'C#', type: 'minor' }` |
| `bars`                 | `formatProgression(bars)`                                                            |

## Progresiones guardadas (`src/practice/my-progressions.ts`)

- Clave: `countdown-notes:progresiones`, separada de la de los ajustes.
- Forma: `{ "version": 1, "progressions": MyProgression[] }`, en orden de creación.
- Las reglas, la validación por progresión y las alternativas están en research §1 (decisión del usuario).

| Función                    | Conducta                                                                                                |
| -------------------------- | ------------------------------------------------------------------------------------------------------- |
| `loadMyProgressions()`     | Las válidas, en orden y sin ids repetidos. Sin datos, de otra versión, rotos o sin almacenamiento: `[]` |
| `saveMyProgressions(list)` | Escribe la lista entera. Si el almacenamiento falla, no hace nada                                       |

## Ajustes

Los de la entrega 4. Solo cambia la validación de `progression`:

| Campo         | Tipo                               | Por defecto      | Validación                                                                                                   |
| ------------- | ---------------------------------- | ---------------- | ------------------------------------------------------------------------------------------------------------ |
| `progression` | `ProgressionId \| MyProgressionId` | `'ii-v-i-mayor'` | Uno de la biblioteca o `^propia-\d+$`, con `.catch`. Al crear el store, si no está en `mine`, el por defecto |

## Borrador (`editor`, estado del store)

`editor: Draft | null`. Con un borrador, `App` muestra el editor (research §2).

| Campo    | Tipo                                          | Regla                                                                    |
| -------- | --------------------------------------------- | ------------------------------------------------------------------------ |
| `id`     | `MyProgressionId`                             | El de la guardada, o uno nuevo                                           |
| `isNew`  | `boolean`                                     | Nunca guardada                                                           |
| `name`   | `string`                                      | Tal como se escribe; al guardar, vacío conserva el anterior              |
| `key`    | `{ tonic: NoteId; type: 'major' \| 'minor' }` | Nueva: la tónica de ajustes, en mayor                                    |
| `text`   | `string`                                      | Tal como se escribe. Editar tocando lo reescribe con `formatProgression` |
| `bars`   | `WrittenBar[]`                                | La última versión válida del texto (vacía en una nueva)                  |
| `errors` | `TextError[]`                                 | Los del texto actual                                                     |
| `opened` | `{ progression; tonic }`                      | Lo que regía al abrir el editor: vuelve al descartar                     |

### Transiciones

| Acción                                                                   | Efecto                                                                                                              |
| ------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------- |
| `openEditor()`                                                           | Un borrador nuevo, elegido; si sonaba otra progresión, se detiene (FR-007)                                          |
| `openEditor(id)`                                                         | Copia la guardada y la elige; la tónica pasa a su `key.tonic`; si sonaba otra, se detiene                           |
| `setDraftText(text)`                                                     | `text`; si se lee, `bars` y `errors: []`; si no, solo `errors`                                                      |
| `setDraftName(name)`                                                     | `name`                                                                                                              |
| `setDraftKey(key)`                                                       | `key`, y la tónica de ajustes pasa a `key.tonic` (FR-011)                                                           |
| `setChord`, `addBar`, `removeBar`, `splitBar`, `joinBar`, `duplicateBar` | Sobre `bars`, y reescriben `text` (research §7)                                                                     |
| `saveDraft()`                                                            | Con `canSave`: copia a `mine` (agrega o reemplaza), escribe la lista, `isNew: false` y `opened` pasa a lo guardado  |
| `discardDraft()`                                                         | `editor: null`, y vuelven `opened.progression` y `opened.tonic`; si la elegida deja de existir y sonaba, se detiene |
| `closeEditor()`                                                          | `editor: null`; solo sin cambios (la UI pregunta antes)                                                             |
| `deleteProgression(id)`                                                  | La quita de `mine` y escribe la lista; si era la elegida, `'ii-v-i-mayor'` y se detiene si sonaba; `editor: null`   |
| `setProgression(id)` (ya existe)                                         | Con un id propio, además, la tónica pasa a su `key.tonic`                                                           |

## Derivados

| Derivado               | Regla                                                                                                                                     |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `progressionOf(state)` | La `Progression` elegida: el borrador si su id es el elegido, si no la de `mine` o la de la biblioteca (`myProgression` para las propias) |
| `isDirty(state)`       | Nueva: `bars.length > 0`. Guardada: nombre (sin espacios al borde), `key` o `bars` distintos de lo guardado                               |
| `canSave(state)`       | `isDirty`, sin `errors` y con al menos un compás                                                                                          |
| `canPlay(state)`       | Aleatorio, como hoy. Progresión: `progressionOf(state)` tiene al menos un compás                                                          |
| Nombre por defecto     | `Progresión N`, con el primer N libre entre los nombres de `mine` y el borrador                                                           |
| Selector de progresión | `Mis progresiones` (las de `mine`, en orden) antes de Ciclos, Jazz y Pop, rock y latino; sin propias, no aparece                          |
| Línea de estado        | Como en la entrega 4, con `progressionOf`: `Andaluza mía · La menor · …`                                                                  |
