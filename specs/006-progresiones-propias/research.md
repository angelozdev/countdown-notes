# Research: Progresiones propias (Entrega 5)

Decisiones de diseño para la entrega 5. Cada una dice qué se eligió, por qué y qué se descartó. Las decisiones del usuario están marcadas.

## 1. Esquema de las progresiones guardadas _(decisión del usuario)_

**Decisión** (recomendada, pendiente de aprobación): una clave aparte, `countdown-notes:progresiones`, con su propia versión. Cada progresión guarda sus compases como datos (raíz escrita y tipo de acorde), no como texto:

```json
{
  "version": 1,
  "progressions": [
    {
      "id": "propia-1",
      "name": "Andaluza mía",
      "key": { "tonic": "A", "type": "minor" },
      "bars": [
        [{ "root": "A", "type": "m" }],
        [{ "root": "G", "type": "maj" }],
        [{ "root": "F", "type": "maj" }],
        [{ "root": "E", "type": "maj" }]
      ]
    }
  ]
}
```

- **Validación** (zod, al cargar): la lista se lee como `unknown[]`, y cada progresión se valida por separado con `safeParse`. Una inválida se descarta sin afectar a las demás (FR-016). Una clave rota, de otra versión o sin almacenamiento da una lista vacía, y los ajustes no se tocan.
- **Reglas**:
  - `id` con la forma `propia-N`, sin repetir (si se repite, gana la primera);
  - `name` no vacío tras `trim`;
  - `key.tonic` uno de los 12 `NoteId`, y `key.type` `'major'` o `'minor'`;
  - `bars` con al menos un compás, cada uno de 1 o 2 acordes;
  - `root` con la forma `^[A-G][#b]?$` (el formato de tonal), y `type` un `ChordTypeId` de la entrega 3.
- **Ajustes**: `progression` acepta también `propia-N` (`z.union` con el enum de la biblioteca, mismo `.catch`). Al crear el store, si la progresión elegida no está en la lista, queda `'ii-v-i-mayor'`. Los ajustes siguen en la versión 1 (FR-025).

**Por qué**:

- **Clave aparte**: las progresiones son trabajo del usuario y los ajustes son preferencias. Con claves separadas, un ajuste roto no se lleva las progresiones ni al revés. Además, se escriben solo con "Guardar" o "Borrar", no en cada cambio de BPM, como los ajustes. La entrega 4 ya lo había previsto (research §9 de la spec 005).
- **Compases como datos**: el `type` se guarda por su id (`m7b5`), no por el cifrado de pantalla (`m7♭5`). Si un día cambia cómo se escribe un tipo, lo guardado se sigue leyendo. zod lo valida solo, sin pasar por el lector de texto. Y el borrador del editor ya es esa misma lista (§3), así que guardar es copiarla.

**Riesgos revisados**:

- **Entrega 6** (#7, cambio automático de tonalidad): cambia la tónica de ajustes en cada vuelta. Una progresión propia se transporta igual que una de la biblioteca (§6), así que no toca este esquema.
- **Entrega 7** (#8, instalable y sin internet): `localStorage` sigue igual en la app instalada. Una versión nueva de la app lee la versión 1 o descarta y vuelve a vacío, como los ajustes.
- **Entregas 8 y 9** (#9 y #44): no guardan progresiones.
- **Navegación privada estricta**: la escritura falla sin romper la app, y las progresiones duran hasta cerrarla (spec, Edge Cases), como los ajustes de la entrega 2.
- **Un tipo de acorde que se quite en el futuro**: la progresión que lo use se descartaría al cargar. Hoy no hay ninguno previsto. Si pasa, se sube la versión con una migración.

**Alternativas**:

- **Compases como texto canónico** (`"bars": "Am | G | F | E"`): más corto y legible, y `barsOf` lo lee directo. Pero ata lo guardado a cómo se ve el cifrado en pantalla y obliga a validar con el lector de texto dentro de zod.
- **Dentro de los ajustes** (misma clave, versión 1, un campo `progressions` con `.catch([])`): una sola lectura, pero las progresiones se reescriben con cada ajuste que cambia, y un error del objeto de ajustes entero (`.catch(D)`) las borraría.
- **Versión 2 de los ajustes con migración**: no hace falta. Las progresiones no comparten nada con los ajustes salvo el id elegido.

## 2. El editor es una pantalla, sin router

**Decisión**: `App` muestra la pantalla de práctica o el editor según `editor` en el store (`null` o el borrador). No se agrega una dependencia ni se cambia la URL.

- "Nueva progresión" y "Editar progresión" (panel) llaman a `openEditor`. El panel se desmonta con la pantalla de práctica, así que al volver aparece cerrado.
- `HandsFree` (Wake Lock y barra espaciadora) queda en `App`, por encima de las dos pantallas.
- La música sigue sonando al cambiar de pantalla: `Lane` y `Now` solo leen el store.

**Alternativas**: un router (dependencia nueva para dos vistas), o el estado en `App` con `useState`. Con `useState`, el store no sabría que hay un borrador, y el borrador tiene que sonar (§3).

**Riesgo revisado**: el botón "atrás" del navegador sale de la app en vez de cerrar el editor. En el iPhone, Safari solo vuelve si hay historial, y la app instalada (entrega 7) no tiene botón atrás. Queda fuera; si molesta, se agrega un `pushState` al abrir el editor.

## 3. El borrador: qué suena y qué se guarda

**Decisión**: el editor trabaja sobre un borrador del store, `editor: Draft`, con lo mismo que se guarda (nombre, tonalidad y compases) más el texto tal como se escribe, sus errores y lo que había al abrir.

- **Qué suena**: mientras el editor está abierto, la progresión elegida es el borrador. `progressionOf(state)` devuelve el borrador si su id es el elegido, y si no, la guardada o la de la biblioteca. `nextRound` y `play` lo usan, así que un cambio aplica desde la siguiente vuelta (FR-009), guardado o no (FR-010a).
- **Qué se guarda**: "Guardar" copia el borrador a `mine` y escribe la lista (§1). El editor sigue abierto.
- **Sin guardar** (`isDirty`): una progresión nueva lo está si tiene al menos un compás. Una guardada, si su nombre, su tonalidad o sus compases difieren de lo guardado. El texto con errores no cuenta: sin cambios válidos, no hay nada que perder.
- **"Guardar" disponible** (`canSave`): sin guardar, sin errores en el texto y con al menos un compás.
- **"Listo"**: sin cambios, cierra. Con cambios, abre la pregunta (FR-010).
- **Descartar**: vuelven la progresión y la tónica que regían al abrir el editor (`opened`). Una nueva que nunca se guardó desaparece. Si sonaba una que deja de existir, la práctica se detiene, como al cambiar de progresión.

**Alternativa**: mantener el borrador fuera del store y que suene solo lo guardado. Se descarta porque el usuario eligió probar sin guardar (spec, Clarifications).

## 4. Elegir una progresión propia y la tónica

**Decisión**:

- **Crear** (FR-007): `openEditor()` arma un borrador nuevo con id `propia-N` y lo elige. Si sonaba otra progresión, la detiene, como `setProgression`.
- **Abrir una guardada**: "Editar progresión" solo aparece con la propia elegida, así que abrirla no cambia la progresión, la tónica ni la música.
- **Tonalidad por defecto** (FR-011): la tónica de ajustes, en mayor. Así, crear no cambia la tónica.
- **Al elegir una propia**, en el panel o al abrirla en el editor, la tónica de ajustes pasa a `key.tonic`. Al cambiar la tonalidad en el editor, también.
- **Al borrar** la elegida: queda `'ii-v-i-mayor'`, con la tónica intacta, y la práctica se detiene (FR-014).
- **Ids** (`propia-N`): el siguiente número después del mayor en uso, contando el borrador. No se usa `crypto.randomUUID` porque solo existe en contextos seguros (HTTPS), y al probar en el iPhone por la red local (`pnpm dev --host`, `http://192.168.…`) no lo es.
- **Nombre por defecto**: "Progresión N", con el primer N que no usa ninguna progresión propia. Un nombre vacío al guardar conserva el anterior (o el por defecto, si es nueva).

## 5. El lector de texto

**Decisión**: `src/music/progression-text.ts`, sin estado, con dos funciones: `parseProgression(text)` y `formatProgression(bars)`.

**Sintaxis** (spec, FR-002 y FR-020):

- **Sin `|`**: cada acorde, separado por espacios o saltos de línea, es un compás.
- **Con `|`**: separa compases, y cada compás tiene 1 o 2 acordes. Un `|` al principio o al final se ignora.

**Cada acorde** (FR-003): una expresión regular por palabra, `^([A-Ga-g])([#b♯♭]?)(.*)$`.

- La raíz va en mayúscula, con `#` y `♯` como `#`, y `b` y `♭` como `b`: el formato de tonal.
- En el sufijo, `b` → `♭` y `#` → `♯`. Ningún sufijo de la lista tiene la letra `b`, así que no hay ambigüedad.
- Los alias: `ø` y `ø7` son `m7♭5`, y `o7` y `dim7` son `°7`.
- El sufijo debe ser exactamente el `suffix` de uno de los 25 tipos (`chords.ts`).
- Con `simplify` de tonal, E♯, B♯, C♭ y F♭ pasan a su enarmónica simple (FR-005).
- `Cbb` no es un acorde: su sufijo sería `♭`.

**Errores**: cada uno con `start`, `end` (posición en el texto) y un mensaje que cita el texto:

- `No reconozco «Hm7».`
- `Un compás tiene uno o dos acordes: «Dm7 G7 C».`
- `Hay un compás vacío entre dos barras.`
- `Escribe al menos un acorde.` (texto vacío)

**Salida**: con errores, `{ errors }`; sin errores, `{ bars }`.

**`formatProgression`**: la forma de siempre (FR-019), con los compases separados por `|` y cada acorde con `chordSymbol` (`B♭m7♭5`). `parseProgression(formatProgression(bars))` devuelve los mismos `bars`, y `progressions.test.ts` lo comprueba.

**Alternativas**:

- Reusar `readChord` de `progressions.ts`: solo acepta la forma canónica (mayúscula, `♭`/`♯`) y lanza en vez de informar.
- Aceptar más cifrados (`-7`, `M7`, `Δ`): fuera de alcance (spec, Assumptions).

## 6. Una progresión propia entra por el camino de la biblioteca

**Decisión**: `myProgression(mine)` en `progressions.ts` convierte una progresión propia (o el borrador) en una `Progression` normal:

- `group: 'Mis progresiones'`;
- `key: { tonic: TONICS[type][tonic], type }`, con las tablas de la entrega 4;
- `bars: formatProgression(bars)`.

`barsOf`, `tonicOf`, `keyLabel`, el bajo, los voicings con movimiento de voces, el carril, "Ahora", el contador y la línea de estado no cambian.

- **Por qué**: FR-008 pide que suene y se vea como la biblioteca, y la forma más segura es que sea el mismo código. El motor no cambia (contrato de la entrega 4).
- **Cómo se prueba** (SC-002 y SC-003): un test de UI con el motor falso compara `fake.played` de "Dm7 G7 Cmaj7 Cmaj7" escrita con el del ii–V–I mayor de la biblioteca. Además, `progression.browser.test.ts` mide con el motor real una propia con compases partidos (US4).

**Alternativa**: que `barsOf` acepte también compases ya leídos. Se descarta porque son dos caminos que mantener por ahorrar una conversión a texto de microsegundos.

## 7. Editar tocando

**Decisión**: las operaciones son acciones del store sobre `editor.bars` (la última versión válida), y cada una reescribe `editor.text` con `formatProgression` y borra los errores (FR-019).

| Acción                           | Efecto                                                                                             |
| -------------------------------- | -------------------------------------------------------------------------------------------------- |
| `setChord(bar, part, chord)`     | Cambia el acorde de esa parte                                                                      |
| `addBar()`                       | Agrega al final una copia del último; vacía, la tríada de la tónica (`maj` o `m` según `key.type`) |
| `removeBar(bar)`                 | Lo quita; con un solo compás, no hace nada (el botón está desactivado)                             |
| `splitBar(bar)` / `joinBar(bar)` | Uno → dos partes iguales; dos → la primera                                                         |
| `duplicateBar(bar)`              | Inserta una copia justo después                                                                    |

Si el texto tenía un error, editar tocando lo reemplaza por la última versión válida. Es lo que dice FR-019, y el error ya no hace falta: el carril mostraba esa versión.

## 8. Cómo se marca un error en el texto

**Decisión**: el campo tiene `aria-invalid` y `aria-describedby` hacia una lista de mensajes, justo debajo, que citan el acorde o el compás (§5). Es lo que pide FR-004 ("marcarse en el texto, citándolo") y se lee igual en el iPhone y con lector de pantalla.

**Alternativa**: subrayar dentro del texto con una capa detrás del `<textarea>`. Exige copiar exactamente el ajuste de líneas y el scroll del campo, que en iOS Safari es frágil. Si hace falta, se agrega encima en el pulido.

## 9. La barra espaciadora en un campo de texto

**Decisión**: `useSpaceToggle` también ignora el espacio cuando el foco está en un campo editable (`input`, `textarea`, `select` o `contenteditable`). Hoy solo lo ignora dentro de un diálogo, y el editor no es un diálogo, así que escribir un espacio haría Play/Stop (spec, Edge Cases).

## 10. UI

- **Pantalla del editor** (`src/components/progression-editor.tsx`), de arriba abajo:
  - "Listo";
  - nombre;
  - tonalidad (tónica y mayor o menor);
  - el campo "Acordes" con sus errores;
  - el carril del editor, de 4 columnas, como el de práctica, con un botón por compás o por parte;
  - "Agregar compás";
  - Play/Stop, "Guardar" y "Borrar progresión".
- **El carril del editor** no sigue la reproducción (spec, Assumptions). Los compases partidos reparten el ancho según `splitAt`, como en la práctica.
- **Diálogos**: el selector de un compás, la pregunta de "Listo" y la confirmación de "Borrar" son `Sheet` desde abajo, el mismo componente del panel. No se agrega ningún componente de shadcn.
- **Componentes compartidos con el panel**, que se extraen al llegar su historia:
  - `TonicPicker`: las 12 tónicas con la grafía según el tipo. La usan el panel y el editor.
  - `ChordTypeSelect`: el `<select>` de tipo por familias. Lo usan el panel y el selector de compás, que así tiene "las mismas familias que en ajustes" (#35) por construcción.
- **`PlayButton`** de `App.tsx` se exporta y se usa también en el editor: es la misma práctica (FR-010a).
- **Pulido visual**: al cierre, con el skill `frontend-design`, dentro de la dirección del diseño (§7.4).

## 11. Tests de audio y E2E

- **Audio** (`progression.browser.test.ts`, US4): con el store y el motor real:
  1. `openEditor()`, `setDraftText('Cmaj7 A7 | Dm7 G7')`, "Bajo + acorde", redondas y "parar tras 2 vueltas";
  2. se mide que cada ataque, incluidos los de mitad de compás, cae a menos de 1 ms de su momento (SC-003).

  Es el mismo patrón del test de la entrega 4. Puede pasar al primer intento, porque el camino es el de la biblioteca (§6). Si pasa, se comprueba que falla corriendo a propósito el `at` y se deshace.

- **E2E** (`e2e/practice.spec.ts`, US4), en los proyectos `chromium` e `iphone`:
  - crear una progresión escribiendo `Cmaj7 | C7 A7 | Dm7 G7`, guardarla, recargar la página y encontrarla en "Mis progresiones" (`localStorage` real en WebKit);
  - el editor a 320 × 640 px, sin scroll horizontal.

## 12. Dependencias

Ninguna nueva. zod, zustand, tonal (`simplify`) y el `Sheet` de radix ya están. El bundle crece solo por el código nuevo; quickstart §1 lo mide.
