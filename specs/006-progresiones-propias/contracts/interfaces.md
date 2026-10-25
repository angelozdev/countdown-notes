# Contratos: Progresiones propias (Entrega 5)

Las mismas partes que en la [entrega 4](../../005-modo-progresion/contracts/interfaces.md). Aquí va solo lo que cambia, en su estado final; cada parte indica en qué historia llega.

## 1. Comandos

Sin cambios.

## 2. Motor de audio

Sin cambios. Una progresión propia llega al motor por el mismo `barAt` que la biblioteca (research §6).

## 3. Música (API exportada)

### `src/music/progression-text.ts` (nuevo)

```ts
export type WrittenChord = { root: string; type: ChordTypeId }
export type WrittenBar = WrittenChord[]
export type TextError = { start: number; end: number; message: string }

/** El texto del editor: sin `|`, un acorde por compás; con `|`, compases de 1 o 2 acordes. */
export function parseProgression(
  text: string
): { bars: WrittenBar[] } | { errors: TextError[] }
/** 'Cmaj7 | C7 A7 | Dm7 G7', con el cifrado de la app. */
export function formatProgression(bars: WrittenBar[]): string
```

| Historia | Lo que trae                                                                                               |
| -------- | --------------------------------------------------------------------------------------------------------- |
| US1      | Un acorde por compás; los 25 tipos, `b`/`#`, minúsculas, `ø`/`ø7`/`o7`/`dim7`, enarmónica simple; errores |
| US4      | `                                                                                                         | `, compases de dos acordes, ` | ` al borde, errores de compás vacío o de más de dos acordes |

Lo que prueba `progression-text.test.ts` por esta API (SC-001):

- los 25 tipos sobre las 12 raíces, escritos con `♭`/`♯` y con `b`/`#`, dan su `WrittenChord`, y `formatProgression` da el cifrado de `chordSymbol`;
- `bbm7b5` → `{ root: 'Bb', type: 'm7b5' }`; `f#7#9` → `{ root: 'F#', type: '7#9' }`; `Cø`, `Cø7`, `Co7` y `Cdim7` → `m7b5`, `m7b5`, `dim7` y `dim7`;
- `E#7` → `F7`; `Cb` → `B`; `Fb` → `E`; `B#` → `C`;
- `'Dm7 Hm7 G7'` → un error `{ start: 4, end: 7 }` que cita `«Hm7»`; `Cbb` y `Dm7x` no se reconocen; `''` y `'   '` dan `Escribe al menos un acorde.`;
- (US4) `'| Dm7 | G7 |'` → 2 compases; `'C | Dm7 G7 C'` → un error en el segundo compás; `'Dm7 || G7'` → un compás vacío; `parseProgression(formatProgression(bars))` devuelve `bars`.

### `src/music/progressions.ts` (cambia)

```ts
export type ProgressionGroup =
  | 'Mis progresiones'
  | 'Ciclos'
  | 'Jazz'
  | 'Pop, rock y latino'
export type MyProgressionId = `propia-${number}`

export type MyProgression = {
  id: MyProgressionId
  name: string
  key: { tonic: NoteId; type: 'major' | 'minor' }
  bars: WrittenBar[]
}

export type Progression = {
  id: ProgressionId | MyProgressionId
  // … el resto como en la entrega 4
}

/** Una progresión propia como una de la biblioteca: lo que leen barsOf, tonicOf y keyLabel. */
export function myProgression(mine: MyProgression): Progression
```

`progressions.test.ts` suma:

- `barsOf(myProgression(Am | G | F | E en La menor), 'C', 4/4)` da `Cm B♭ A♭ G`;
- `keyLabel` da `La menor`, y con `C#m7` escrito en Do♯ menor, `barsOf` en la tónica `'Db'` lo deja como `C♯m7`, sin pasarlo a D♭m7 (FR-005).

## 4. Pantallas (lo que buscan los tests)

Se agrega a las tablas de la entrega 4. Los tests buscan por rol y nombre accesible.

### Panel de ajustes

| Elemento          | Rol                     | Nombre accesible                                                                                    | Historia |
| ----------------- | ----------------------- | --------------------------------------------------------------------------------------------------- | -------- |
| Nueva progresión  | `button`                | `Nueva progresión`; solo en el modo progresión                                                      | US1      |
| Editar progresión | `button`                | `Editar progresión`; solo con una progresión propia elegida                                         | US2      |
| Progresión        | `combobox` (`<select>`) | Como en la entrega 4, con el `group` `Mis progresiones` primero; el `value` de cada propia es su id | US2      |

### Editor de progresiones

| Elemento              | Rol                      | Nombre accesible o texto                                                                                                                     | Historia |
| --------------------- | ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| La pantalla           | `main`                   | `Editor de progresiones`. Mientras está abierta, la pantalla de práctica no está                                                             | US1      |
| Listo                 | `button`                 | `Listo`                                                                                                                                      | US1      |
| Acordes               | `textbox` (`<textarea>`) | `Acordes`; con errores, `aria-invalid="true"` y su descripción accesible con los mensajes (research §5)                                      | US1      |
| Carril del editor     | `list` + `listitem`      | `Compases`; un `listitem` por compás, con un `button` por compás o por parte (abajo)                                                         | US1      |
| Compás (botón)        | `button`                 | `Compás {n}: {cifrado}`; partido, `Compás {n}, parte {1\|2}: {cifrado}`, con `data-at`                                                       | US1, US4 |
| Play/Stop             | `button`                 | `Play` / `Stop`, el mismo de la práctica                                                                                                     | US2      |
| Guardar               | `button`                 | `Guardar`; desactivado sin `canSave`                                                                                                         | US1      |
| Cambios sin guardar   | `dialog`                 | `Cambios sin guardar`, con los botones `Guardar`, `Descartar cambios` y `Seguir editando`                                                    | US1      |
| Nombre                | `textbox`                | `Nombre`                                                                                                                                     | US2      |
| Tonalidad de origen   | `radiogroup` + `radio`   | `Tonalidad de origen`; 12 radios con el nombre de la tónica según el tipo (`Do sostenido` en menor)                                          | US2      |
| Tipo de tonalidad     | `radiogroup` + `radio`   | `Tipo de tonalidad`; radios `Mayor`, `Menor`                                                                                                 | US2      |
| Borrar progresión     | `button`                 | `Borrar progresión`; solo en una guardada. Abre el `dialog` `¿Borrar «{nombre}»?` con `Borrar` y `Cancelar`                                  | US2      |
| Agregar compás        | `button`                 | `Agregar compás`                                                                                                                             | US3      |
| Selector de un compás | `dialog`                 | `Compás {n}` (o `Compás {n}, parte {k}`); `radiogroup` `Raíz` (12 radios: `Do`, `Re bemol`…), `combobox` `Tipo de acorde` igual al del panel | US3      |
| Acciones de un compás | `button`                 | En ese diálogo: `Quitar` (desactivado con un solo compás), `Duplicar`, `Partir` o `Unir`                                                     | US3, US4 |

- En US1 el editor tiene "Listo", "Acordes", el carril, "Guardar" y la pregunta de "Listo". "Guardar" guarda en memoria: la progresión queda elegida y suena, pero aún no se recuerda al reabrir la app.
- US2 suma el guardado en el dispositivo, el grupo del selector, "Editar progresión", el nombre, la tonalidad, el Play del editor y "Borrar".

### Pantalla de práctica

Sin elementos nuevos. Con una propia elegida, la línea de estado dice `{nombre} · {tonalidad} · {estilo} · {bpm} BPM · {compás}`, por ejemplo `Progresión 1 · Do mayor · Analógico cálido · 60 BPM · 4/4` (US1) o `Andaluza mía · La menor · …` (US2).

## 5. Store (lo que usa el test de audio)

`progression.browser.test.ts` crea el store con el motor real y usa estas acciones, además de las de la entrega 4: `openEditor()`, `setDraftText(text)` y `saveDraft()` ([data-model](../data-model.md), Transiciones). El editor no hace falta para sonar.

## 6. Datos guardados

- **Progresiones**: la clave `countdown-notes:progresiones`, `{ "version": 1, "progressions": [...] }`, con el esquema de research §1 (decisión del usuario).
- **Ajustes**: la misma clave y versión, y `progression` acepta `propia-N`.
- Los tests de US2 escriben a mano en `localStorage` y comprueban que:
  - una progresión inválida (sin compases, con un tipo que no existe, sin nombre) se descarta y las demás se conservan;
  - un JSON roto o de otra versión deja la lista vacía sin tocar los ajustes;
  - una progresión elegida que no existe deja el ii–V–I mayor;
  - un dato de ajustes de la entrega 4 se conserva entero.
