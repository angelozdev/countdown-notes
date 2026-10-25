# Research: Modo progresión con biblioteca (Entrega 4)

Decisiones de diseño técnico para la [spec](./spec.md). Cada una tiene la decisión, la razón y las alternativas descartadas.

## 1. Dependencias: tonal para transportar y deletrear

**Decisión** (aprobada por el usuario, 2026-10-24): los módulos de tonal que se usan, en versión exacta:

- `@tonaljs/note@4.12.3`: `transpose` y `simplify`.
- `@tonaljs/interval@5.1.1`: `distance`.

Son las versiones que trae `tonal@6.5.1` (publicada el 2026-10-14), la última estable. Ningún componente nuevo de shadcn.

**Spike** (Node, `tonal@6.5.1`, en el scratchpad de la sesión):

| Caso                                         | Resultado                              |
| -------------------------------------------- | -------------------------------------- |
| ii–V–I de Do a Fa (`4P`)                     | `G C F`                                |
| ii–V–I y vi, vii de Do a Si (`7M`)           | `C# F# B G# A#`                        |
| Diatónicas de Do a Fa♯ (`4A`)                | `F# B F A# D# G# C#` (E♯ → `F`)        |
| ii–V–I de Do a Sol♭ (`5d`)                   | `Ab Db Gb`                             |
| Giant Steps de Do a La♭ (`6m`)               | `Ab B E G C Eb` (C♭ → `B`)             |
| Andaluza de La a Do, a Mi♭ y a Do♯           | `C Bb Ab G`, `Eb Db B Bb`, `C# B A G#` |
| `simplify` de `Cb E# B# Fb Bbb C## C# Gb A#` | `B F C E A D C# Gb A#`                 |

`simplify` vuelve a escribir la nota con su mismo sentido de alteración y natural si se puede: es exactamente la regla de FR-013 (sin E♯, B♯, C♭, F♭ ni dobles) y deja intactas C♯, G♭ y A♯.

**Razón**: el diseño (§9) y la constitución ponen tonal en el stack para "transportar y escribir bien las alteraciones", y la entrega 3 la dejó para esta, que la necesita. Transportar por intervalo conservando la letra (Re → Mi♭ y no Re♯ en Do → Re♭) es la parte delicada, y tonal la resuelve.

**Alternativas**:

- **El paquete `tonal`** (el nombre de la constitución): el mismo código, pero no declara `sideEffects: false` y arrastra sus 23 módulos. Medido con esbuild: 27,1 KB minificado (9,8 KB gzip) contra 4,4 KB de los dos módulos.
- **Aritmética propia de letras y semitonos** (unas 20 líneas): sería una dependencia menos, pero reimplementa lo que el stack ya eligió. Se descarta.
- **`Chord.get` y los diccionarios de voicings de tonal**: no hacen falta. Los tipos y sus voicings ya están en `chords.ts` (entrega 3), y el cifrado de la biblioteca se lee con el lector propio de §6.

## 2. Una vuelta es una lista de compases, en los dos modos

**Decisión**: `Round` pasa a describir sus compases. Cada compás es una lista de uno o dos acordes, y cada acorde tiene su raíz escrita, su tipo y el golpe donde entra:

- `Round = { number, meter, firstBar, bars: RoundChord[][] }` más lo propio de cada modo:
  - aleatorio: `notes` y `barsPerNote` (el contador "nota 5 de 12" y la nota a evitar al sortear);
  - progresión: `progression` y `tonic` (la línea de estado).
- `RoundChord = { root: Note; type?: ChordTypeId; at: number }`. Sin `type`, el tipo es el de los ajustes: el modo aleatorio (todas sus notas) y los ciclos de solo raíces (FR-021).
- En el modo aleatorio, cada nota sorteada da `barsPerNote` compases iguales `[{ root: NOTE_BY_ID[id], at: 0 }]`.

`barAt`, el carril, "Ahora", el contador y la vista previa leen `bars` y no saben de qué modo vienen, salvo el contador y la línea de estado.

**Razón**: el modo aleatorio ya es una "progresión de solo raíces" que se sortea en cada vuelta. Con una sola forma, el compás partido, el ataque del bajo en el cambio y el movimiento de voces se escriben una vez. Los tests de los modos aleatorios de las entregas 1 a 3 prueban por la UI y el motor falso, así que el cambio interno queda cubierto por ellos.

**Alternativas descartadas**: dos tipos de vuelta con caminos separados en `barAt`, el carril y "Ahora". Duplica la lógica de cuatro lugares y deja el compás partido solo en un camino.

## 3. El ataque del bajo en el cambio de acorde

**Decisión**: `bassAttacks(meter, figure, changes = [])` (en `meters.ts`) suma a los ataques de la figura los golpes de `changes`, sin repetir, y cada ataque dura hasta el siguiente. `barAt` le pasa los `at` de los acordes del compás, y la altura de cada ataque es la raíz del acorde que suena en ese golpe.

**Razón**: cumple FR-005 con un argumento opcional: el bajo ataca en el cambio aunque la figura no caiga ahí, y una sola vez si cae. Los ataques de la figura siguen igual, así que los tests de la entrega 2 (SC-002 de figuras y compases) no cambian.

**Alternativas descartadas**: cortar la nota del bajo y volver a atacar en el motor. El motor no sabe de acordes, y el contrato no cambia (§10).

## 4. Dónde se parte un compás

**Decisión**: `splitAt(meter)` (en `meters.ts`) es el primer inicio de grupo `s` con `2s ≥ beats`:

| Compás | Grupos    | `splitAt` | Partes |
| ------ | --------- | --------- | ------ |
| 2/4    | 1 1       | 1         | 1 + 1  |
| 3/4    | 1 1 1     | 2         | 2 + 1  |
| 4/4    | 1 1 1 1   | 2         | 2 + 2  |
| 5/4    | 1 1 1 1 1 | 3         | 3 + 2  |
| 6/8    | 3 3       | 3         | 3 + 3  |
| 7/8    | 2 2 3     | 4         | 4 + 3  |
| 9/8    | 3 3 3     | 6         | 6 + 3  |
| 12/8   | 3 3 3 3   | 6         | 6 + 6  |

Es FR-017 con las dos reglas en una: en los compases pares cae justo en la mitad; en los demás, en el límite de grupo más cercano a la mitad, con la primera parte igual o más larga (decisión del usuario, spec Clarifications).

**Razón**: los `at` son golpes del metrónomo, y todos los cortes caen en un golpe entero, así que el motor los programa como cualquier otro evento.

## 5. Tonalidad: una tónica compartida, cada progresión con su tipo

**Decisión** (decisión del usuario, spec Clarifications):

- El ajuste `tonic` es un `NoteId` (la altura, sin grafía: `'Db'` es la clase 1). Lo comparten todas las progresiones.
- Cada progresión tiene su tonalidad de origen escrita (`{ tonic: 'C', type: 'major' }`, `{ tonic: 'A', type: 'minor' }`, `{ tonic: 'D', type: 'dorian' }`).
- Para tocarla, se escribe la tónica elegida con la tabla de su tipo y se transporta cada raíz por el intervalo entre la tónica de origen y esa tónica: `simplify(transpose(raíz, distance(origen, destino)))`.

Tablas de tónicas (FR-013 y FR-019):

| Clase | `major`             | `minor` y `dorian` | ciclos por cuartas |
| ----- | ------------------- | ------------------ | ------------------ |
| 1     | D♭                  | C♯                 | D♭                 |
| 6     | F♯                  | F♯                 | G♭                 |
| 8     | A♭                  | G♯                 | A♭                 |
| resto | C D E♭ E F G A B♭ B | igual              | igual              |

- El ciclo de quintas usa la tabla `major`. El ciclo de cuartas y el ii–V–I por las 12, la de cuartas.
- El selector de tonalidad escribe las tónicas con la tabla de la progresión elegida. Un `NoteId` guardado vale para cualquier tabla: al pasar de una progresión mayor a una menor, la tónica se conserva y solo cambia su grafía.

**Razón**: con la tónica como altura, la grafía queda donde corresponde (en la progresión), el ajuste guardado no depende de qué progresión está elegida, y el selector se reduce a 12 opciones fijas.

**Alternativas descartadas**: guardar la tónica escrita (`'C#'`). Obliga a convertirla al cambiar entre una progresión mayor y una menor.

## 6. La biblioteca como texto, en su tonalidad de origen

**Decisión**: cada progresión se escribe como en las tablas de la spec, con `♭` y `♯`, y un lector propio la convierte en compases:

```ts
{ id: 'blues-jazz', name: 'Blues de jazz', group: 'Jazz', key: { tonic: 'C', type: 'major' },
  bars: 'C7 | F7 | C7 | C7 | F7 | F7 | C7 | A7 | Dm7 | G7 | C7 A7 | Dm7 G7' }
```

- `|` separa compases. Dos acordes en un compás lo parten (§4). `×N` después de un acorde repite el compás N veces.
- Un acorde es una raíz (`[A-G][♭♯]?`) más un sufijo de `CHORD_TYPES` (`''`, `m`, `m7♭5`, `7♭9`…). Un sufijo desconocido es un error de programación: el lector lanza, y el test de la biblioteca lo detecta.
- Los ciclos que recorren las 12 tonalidades tienen `cycle: 'fourths' | 'fifths'` y escriben una sola unidad (`'Dm7 | G7 | Cmaj7 | Cmaj7'`, `'C ×2'`). La vuelta es esa unidad transportada a 12 tónicas seguidas, por cuartas o por quintas desde la elegida, escritas con la tabla del ciclo (§5).
- Los ciclos de solo raíces tienen `rootsOnly: true`: sus acordes no llevan tipo (§2).

**Razón**: el texto es la forma más corta de escribir 21 progresiones sin errores, y el test las compara con las mismas cadenas de la spec. El lector cabe en unas líneas porque los sufijos ya están en `CHORD_TYPES`.

**Alternativas descartadas**: escribir cada acorde como objeto (`{ root: 'D', type: 'm7' }`): 4 veces más largo y difícil de revisar contra la spec. Leer el cifrado con `Chord.get` de tonal: sus nombres de tipo no coinciden con los 25 de la entrega 3.

## 7. Movimiento de voces

**Decisión**: `voicingOf(root, type, after?)` (en `chords.ts`) suma un tercer argumento opcional, el voicing anterior. Con él, entre las formas y octavas que ya cumplen FR-008 y FR-009 de la entrega 3, gana la que menos se mueve:

- `movimiento = Σ` sobre cada nota nueva de la distancia, en semitonos, a la nota más cercana del voicing anterior;
- en un empate, la de altura media más cercana a C4 (la regla de la entrega 3), y después la forma A.

Las tríadas tienen una sola forma y no cambian. `barAt` pasa `after` solo en el modo progresión, y no lo pasa en el primer acorde de cada vuelta, así que todas las vueltas suenan igual (FR-007).

**Razón**: con dos formas (A y B) por tipo y unas pocas octavas, elegir la más cercana basta para que un ii–V–I alterne A–B–A, que es el movimiento clásico de las voces guía. La regla se prueba por la API exportada (SC-004).

**Alternativas descartadas**: `@tonaljs/voice-leading`: trabaja sobre los diccionarios de tonal, no sobre las formas de la entrega 3.

## 8. Cuándo aplica cada cambio

| Cambio mientras suena                   | Cuándo aplica                    | Cómo                                                                     |
| --------------------------------------- | -------------------------------- | ------------------------------------------------------------------------ |
| Modo o progresión                       | De inmediato: detiene            | `setMode` y `setProgression` llaman a `stop()` si `status !== 'stopped'` |
| Tónica o compás                         | Desde la siguiente vuelta armada | `nextRound` los lee al armar la vuelta                                   |
| Qué suena, tipo, estilo, figura, octava | Desde el siguiente compás        | `barAt` los lee al armar el compás (entrega 3, research §7)              |
| BPM y mezcla                            | De inmediato                     | Sin cambios                                                              |

- La siguiente vuelta se arma cuando el motor pide el compás desde el que se muestra la vista previa. En el modo aleatorio, el primero de la última nota (entrega 1, FR-033). En el modo progresión, el último compás. Así, un cambio de tónica durante el último compás aplica una vuelta después (spec, Edge Cases).
- `previewFrom(round)` da ese compás: `(notes.length − 1) × barsPerNote` o `bars.length − 1`.

## 9. Ajustes guardados

**Decisión** (aprobada por el usuario, 2026-10-24): la misma clave y la misma versión (1), con tres campos más que vuelven solos a su valor por defecto, como en la entrega 3:

| Campo         | Tipo                        | Por defecto      |
| ------------- | --------------------------- | ---------------- |
| `mode`        | `'random' \| 'progression'` | `'random'`       |
| `progression` | `ProgressionId`             | `'ii-v-i-mayor'` |
| `tonic`       | `NoteId`                    | `'C'`            |

**Riesgos revisados**:

- **Entrega 5** (#6, progresiones propias): las propias se guardan en su lista (otra clave, que define su spec) y `progression` tendrá que aceptar sus ids. Es un cambio aditivo del validador, de `z.enum(ids)` a uno que acepte también los ids propios, con el mismo `.catch`. "Suena en la tonalidad en que se escribió" pone `tonic` al elegirla.
- **Entrega 6** (#7, cambio automático de tonalidad): suma un campo (cada N vueltas, al azar o por cuartas) y cambia la tónica de cada vuelta en `nextRound`, que ya lee `tonic` al armarla (§8).
- Un id de progresión que deje de existir vuelve a `'ii-v-i-mayor'` por el `.catch`, sin romper la app.

**Alternativas**:

- **Versión 2 con migración**: no hace falta, porque cada campo nuevo ya tiene su `.catch` y lo de la entrega 3 se conserva (FR-022).
- **Ajustes anidados por modo** (`{ random: {…}, progression: {…} }`): obliga a migrar los campos del modo aleatorio que ya existen, y la mayoría (BPM, compás, sonido, repeticiones) son de los dos modos.

## 10. Contrato del motor: sin cambios

**Decisión**: `src/audio/engine.ts`, `tone-engine.ts` y `fake-engine.ts` no cambian.

**Razón**: un compás partido son dos eventos `bass` y dos `chord` con su `at` y su `length`, y el motor ya programa eventos en cualquier golpe (el bajo en corcheas, `at = 1.5` en el test de la entrega 2). Lo nuevo vive en el store (`barAt`) y en `music/`.

## 11. UI

- **Modo**: `radiogroup` "Modo" (`Aleatorio`, `Progresión`) arriba del panel, con el `ToggleGroup` de los demás ajustes.
- **Progresión**: un `<select>` nativo "Progresión" con un `<optgroup>` por grupo (Ciclos, Jazz, Pop, rock y latino), como el de "Tipo de acorde" (entrega 3, research §10).
- **Tonalidad**: `radiogroup` "Tonalidad" con 12 radios en dos filas de 6. Cada uno muestra el cifrado de la tónica (`D♭` o `C♯`, según la tabla de §5) y su nombre accesible es su nombre en español (`Re bemol`, `Do sostenido`). El nombre completo de la tonalidad ("Fa mayor") está en la línea de estado.
- **En el modo progresión** se ocultan "Compases por nota" y la sección de notas. "Tipo de acorde" solo aparece con "Bajo + acorde" en el modo aleatorio y en los ciclos de solo raíces.
- **Línea de estado**: `{nombre} · {tonalidad} · {estilo} · {bpm} BPM · {compás}`. La tonalidad es `{tónica} {mayor|menor|dórico}`, y en los ciclos que recorren las 12, `desde {tónica}` ("Ciclo de cuartas · desde Fa · …").
- **Carril**: un compás de dos acordes es un `listitem` con dos partes en fila, de ancho proporcional a su duración (`flex-grow` igual a sus golpes), separadas por una barra fina. Cada parte ajusta el cifrado a su ancho con la técnica de la entrega 3 (`note-fit` y `--chars`, research §6). El compás actual se resalta entero, como hoy.
- **"Ahora"**: el acorde del golpe que suena: el último del compás con `at ≤ beat`.

**Razón**: todo con los componentes y patrones que ya tiene el panel. Ningún control nuevo en la pantalla de práctica (principio IV).

## 12. Test del audio con el store y el motor real

**Decisión**: un test nuevo del proyecto `audio`, `src/practice/progression.browser.test.ts`, arma el store con el motor real dentro de `Tone.Offline`, elige el modo progresión, toca Play y espía las llamadas a `triggerAttackRelease` del bajo (`MonoSynth`) y del acorde (`PolySynth`):

- Para esperar el arranque, el test envuelve el motor (`start: (o) => (started = real.start(o))`) y espera `started`.
- Comprueba que cada cambio de acorde, también los de mitad de compás, cae a menos de 1 ms de su momento teórico, con la altura de su raíz, y que nada suena en la cuenta ni después del final (SC-001).
- Se miden las llamadas al sintetizador, como el test de figuras de la entrega 2: con notas ligadas, el release de una tapa el inicio de la siguiente en el audio.

**Razón**: el issue #29 pide "audio renderizado sin parlantes: cada cambio de acorde cae en su compás". Con el store real, el test cubre de punta a punta lo que arma `barAt` y cómo lo programa el motor.

## 13. E2E

Un test más en `e2e/practice.spec.ts`: a 320 × 640 px, con Giant Steps en la tónica Fa♯ y "Bajo + acorde", los compases partidos del carril (`F♯maj7 A7`, `Dmaj7 F7`, `A♯maj7 C♯7`) no desbordan su parte ni hay scroll horizontal.
