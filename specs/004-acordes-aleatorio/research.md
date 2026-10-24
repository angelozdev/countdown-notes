# Research: Acordes en modo aleatorio (Entrega 3)

Decisiones de diseño técnico para la [spec](./spec.md). Cada una tiene la decisión, la razón y las alternativas descartadas.

## 1. Dependencias

**Decisión**: ninguna dependencia nueva y ningún componente nuevo de shadcn.

- El tipo de acorde se elige con un `<select>` nativo con `<optgroup>` por familia (§10).
- Las notas de cada acorde salen de una tabla propia de intervalos en semitonos (§5). El cifrado se arma con la grafía que ya existe en `NOTES` (entrega 1).

**Razón**: en el modo aleatorio no hay tonalidad ni grados, así que no hay alteraciones que deletrear: el cifrado es la raíz de `NOTES` más un sufijo fijo, y el sonido solo necesita alturas. Una tabla de 25 entradas se prueba completa (SC-002).

**Alternativas descartadas**:

- **tonal** (`Chord.get`, y `@tonaljs/voicing` con su diccionario `lefthand`). El diseño la prevé "en la entrega que la necesite" (diseño §9). La necesita la entrega 4, por la tonalidad, los grados y la grafía según la tonalidad. Aquí agregaría una dependencia para lo que resuelven 25 filas, y sus diccionarios no cubren los 25 tipos con las reglas de FR-007 a FR-009.
- **Select de shadcn** (Radix). Suma un componente y un portal para algo que el `<select>` nativo ya hace con grupos accesibles; en el iPhone, además, abre la rueda nativa.

## 2. Soft clipper en la salida común (decisión del usuario, 2026-10-24)

**Decisión**: la salida común pasa por un `Tone.WaveShaper` antes del destino:

```text
canales → output (Gain 1, el que silencia stop) → Gain(1/4) → WaveShaper → destination
```

- La curva trabaja en la escala original `v = 4x`: es lineal hasta 0,8 (`y = v`) y arriba es `y = 0,8 + 0,2 · tanh((v − 0,8) / 0,2)`, con el signo de la entrada. Así nunca pasa de 1,0.
- Se usa la escala 1/4 porque la entrada de un `WaveShaper` se recorta a [−1, 1]. Con 1/2 (el experimento de la entrega 2) cabe una suma de hasta 2,0, pero bajo + click al 100 ya dan 2,06, y con el acorde la suma pasa de 2. Con 1/4 cabe hasta 4,0.
- La curva tiene 8192 puntos y `oversample = 'none'`. Con `'4x'`, los filtros de remuestreo pasan de 1,0 (entrega 2, `final-fix-report.md`).

**Razón**: con la mezcla por defecto la salida ya pasa de 1,0 sin el acorde. Lo midió la revisión final de la entrega 2 (`.az-orchestrate/003-practica-comoda/review-final.md`, I1): el bajo solo en 80 da 1,03–1,10 y bajo + click en 80 dan 1,22–1,32.

- El spike de este plan (Chromium y WebKit, parámetros del Anexo A) dio con el acorde en 80:
  - Analógico cálido: picos de 1,28–1,29 con tríada, 4 y 5 notas. El acorde solo da 0,09–0,18.
  - Pad ambiental: picos de 0,76–1,00. El acorde solo da 0,33–0,46 y el bajo pad solo, 0,63.
- El clipper no cambia nada por debajo de 0,8, así que los clicks (0,40 en 80 y 0,62 en 100) y los tests de acentos y volumen de la entrega 2 quedan igual. El experimento de la entrega 2 tuvo 120 de 120 tests de audio en verde.
- `stop` sigue silenciando en `output`, antes del clipper, así que no agrega latencia ni arranque en frío.

**Alternativas descartadas**: `Tone.Limiter(-1)` (no limita y atenúa el primer click de un render offline: entrega 2), un `Compressor` (no garantiza el tope) y bajar la salida común unos −6 dB (el usuario eligió el clipper; además, en el parlante del iPhone se arriesga el anti-objetivo del bajo que no se oye).

**Cierra**: el hueco de #22 (bajo por encima de ~90). Al quedar en verde se comenta en #22.

## 3. Contrato del motor: se extiende, no se rompe

**Decisión**: tres cambios aditivos en `src/audio/engine.ts` (contrato completo en [contracts](./contracts/interfaces.md) §2):

- `Channel` suma `'chord'`; `Mix` pasa a tener tres canales.
- `Sound` suma `{ kind: 'chord'; pitches: string[]; length: number }`, con las alturas en la notación de Tone (`'Gb3'`), como el bajo.
- `Bar` suma `style?: Style`, el estilo con que suenan el bajo y el acorde de ese compás. Sin él, Analógico cálido, así que la cuenta de entrada y los compases de los tests existentes no cambian.

**Razón**: el estilo es del compás (FR-016), no de cada evento. Opcional, deja intactos los `Bar` que arman los tests de la entrega 2.

**Tests existentes**: la constante `MIX` de `tone-engine.browser.test.ts` suma `chord: { volume: 80, muted: false }`, porque `Mix` es un `Record` de los tres canales y `tsc -b` compila el test. No cambia ninguna aserción.

## 4. Estilos en el motor

**Decisión**: `start` crea, para cada estilo, el bajo y la cadena del acorde (`PolySynth → Filter → Chorus → Reverb`), con los parámetros del Anexo A. Espera los dos `reverb.ready` junto con `Tone.start()`.

- Cada evento se toca en el sintetizador del estilo de su compás. Lo que quedó sonando del estilo anterior termina su caída en su propia cadena, sin cortes (FR-016).
- **Niveles de partida**:
  - el bus del acorde a −4 dB a volumen 80 (`BASE_DB.chord`, Anexo A);
  - el `PolySynth` a −18 dB en Analógico cálido y a −10 dB en Pad ambiental;
  - el bajo Analógico cálido a −4 dB, como hoy;
  - el bajo Pad ambiental también a −4 dB, porque el Anexo A no le da volumen. En el spike, su pico es 0,63, frente al 1,07 del cálido.

  Se afinan de oído (quickstart §4).

- **Polifonía**: `maxPolyphony: 64` en los dos `PolySynth`. El valor por defecto (32) no alcanza con el Pad a tempo rápido: en 2/4 a 240 BPM hay un compás cada 0,5 s y cada nota ocupa su voz unos 3,5 s (0,45 s de nota más 3 s de release). Son unos 7 acordes encimados de hasta 5 notas, 35 voces.
- **Reverb**: en el spike, `reverb.ready` tardó 6–23 ms dentro de `Tone.Offline`, en Chromium y WebKit. No se nota antes de la cuenta de entrada.

**Razón**: con las dos cadenas siempre armadas, cambiar de estilo es elegir un sintetizador por compás. No hay que crear ni desconectar nada mientras suena.

**Alternativa descartada**: crear solo la cadena del estilo en uso y la otra al cambiar. Se ahorra CPU, pero el cambio esperaría la generación del reverb y habría que liberar la cadena vieja cuando termine su caída.

**Riesgo**: dos reverbs de convolución y dos chorus corren siempre, aunque suene uno solo. Si en el iPhone hay cortes (quickstart §3), el plan B es esa alternativa.

## 5. Voicings

**Decisión**: `voicingOf(root, type)` en `src/music/chords.ts` devuelve las alturas (`'E3'`, `'Bb3'`…) según una tabla de intervalos en semitonos desde la raíz:

- **Tríadas** (FR-007): forma fija `[0, 7, 16]` (mayor), `[0, 7, 15]` (m), `[0, 6, 15]` (dim), `[0, 8, 16]` (aug), `[0, 7, 17]` (sus4) y `[0, 7, 14]` (sus2), con la raíz en la octava 3 (MIDI 48 + clase de la raíz). La más aguda es Si sus4: B3, F♯4 y E5.
- **4 notas o más** (FR-008): dos formas sin raíz, A (desde la tercera) y B (desde la séptima o la sexta):

  | Tipo    | A             | B              |
  | ------- | ------------- | -------------- |
  | 6       | 4, 7, 9       | 9, 16, 19      |
  | m6      | 3, 7, 9       | 9, 15, 19      |
  | 6/9     | 4, 9, 14      | 9, 14, 16      |
  | maj7    | 4, 7, 11      | 11, 16, 19     |
  | m7      | 3, 7, 10      | 10, 15, 19     |
  | 7       | 4, 7, 10      | 10, 16, 19     |
  | m7♭5    | 3, 6, 10      | 10, 15, 18     |
  | °7      | 3, 6, 9       | 9, 15, 18      |
  | m(maj7) | 3, 7, 11      | 11, 15, 19     |
  | 7sus4   | 5, 7, 10      | 10, 17, 19     |
  | maj9    | 4, 7, 11, 14  | 11, 14, 16, 19 |
  | m9      | 3, 7, 10, 14  | 10, 14, 15, 19 |
  | 9       | 4, 7, 10, 14  | 10, 14, 16, 19 |
  | m11     | 3, 10, 14, 17 | 5, 10, 15, 19  |
  | 13      | 4, 9, 10, 14  | 10, 14, 16, 21 |
  | 7♭9     | 4, 7, 10, 13  | 10, 13, 16, 19 |
  | 7♯9     | 4, 7, 10, 15  | 10, 15, 16, 19 |
  | 7♯11    | 4, 10, 14, 18 | 10, 14, 16, 18 |
  | 7alt    | 4, 8, 10, 15  | 10, 15, 16, 20 |

- **Ubicación**: se prueban las dos formas, desplazadas por octavas. De las que caen enteras entre C3 y E5 (MIDI 48–76, FR-009), gana la de altura media más cercana a C4 (60), y la A en caso de empate. Siempre hay una, porque ninguna forma abarca más de 14 semitonos y el rango tiene 28.

**Razón**:

- Las tríadas siguen la forma abierta que pide el diseño (§5.3) y que sonó en el prototipo.
- Las formas A y B son los voicings sin raíz clásicos del piano de jazz, reducidos a lo que distingue cada tipo. El C7 no lleva novena ni trecena, para que se oiga distinto del C9 y del C13.
- Elegir por la altura media mantiene el acorde en el centro del registro para las 12 raíces. Sin progresiones, no hace falta movimiento de voces (spec, Assumptions).

**Alternativa descartada**: generar los voicings desde las notas del acorde (quitar la raíz y la quinta, cerrar la posición). Las reglas por tipo (la oncena del C13, las alteraciones del 7alt) terminan siendo una tabla igual, pero escondida.

## 6. Cifrado y nombre

**Decisión**: `CHORD_TYPES` tiene, por tipo, `id`, `family`, `suffix` (`'m7♭5'`) y `name` (`'semidisminuido'`), según la tabla de FR-005.

- `chordSymbol(root, type)` = `NOTE_BY_ID[root].label + suffix` (por ejemplo, `'F♯m7'`).
- `chordName(root, type)` = `NOTE_BY_ID[root].name + ' ' + name` (por ejemplo, `'Fa sostenido menor séptima'`).

**Tamaño en pantalla**: el cifrado reutiliza `note-label`, con la letra grande y el resto a 0,6 de su tamaño, como se escribe un cifrado de jazz. `--note-size` se achica según el largo del cifrado: en "Ahora", con el ancho del contenedor (`cqw`); en cada compás del carril, con un contenedor de ancho propio. El cálculo exacto lo fija el test E2E de 320 px (§11).

## 7. Lo que suena, para la UI

**Decisión**: el store guarda en un `Map`, al armar cada compás en `barAt`, el tipo de acorde (o ninguno) y el estilo con que se armó. En `onBeat(bar, 0)` lo pasa al estado como `sounding` y lo borra del `Map`. `play` y `stop` lo limpian.

- "Ahora" y el compás actual del carril muestran el acorde de `sounding`.
- Los compases siguientes del carril muestran el de los ajustes.
- La línea de estado muestra el estilo de `sounding` mientras suena (durante la cuenta, el de los ajustes) y, detenida, el de los ajustes.

**Razón**: el motor pide cada compás con anticipación (unos 100 ms). Leer los ajustes en `onBeat` mostraría el tipo nuevo en un compás que suena con el viejo, si el cambio cae en esa ventana. Con el `Map`, la pantalla dice lo que suena (FR-005 y FR-017).

**Alternativa descartada**: guardar el tipo y el estilo en la vuelta (`Round`). Aplicarían desde la vuelta siguiente, y FR-011 y FR-016 piden el compás siguiente.

## 8. El acorde en el compás

**Decisión**:

- Con "bajo + acorde", `barAt` agrega un evento `{ at: 0, sound: { kind: 'chord', pitches: voicingOf(nota, tipo), length: meter.beats } }` a cada compás de música.
- El motor lo toca al 90 % de su largo, como el bajo (FR-003). La cuenta de entrada no lleva acorde (FR-004).
- El estilo del compás va en `Bar.style`.
- `withChord`, `chordType` y `style` se leen en `barAt`, como la figura y la octava (entrega 2): un cambio aplica desde el compás siguiente (FR-011 y FR-016).

## 9. Ajustes guardados

**Decisión**: `Settings` suma `withChord: boolean` (`false`), `chordType: ChordTypeId` (`'maj'`), `style: Style` (`'warm'`) y `mix.chord` (80, sin silenciar). La versión sigue en 1.

**Razón**: cada campo del esquema ya vuelve solo a su valor por defecto cuando falta o es inválido (`.catch`, entrega 2, research §9). Un dato guardado por la entrega 2 se lee igual y los campos nuevos toman su valor por defecto (FR-019). Subir la versión descartaría los ajustes del usuario.

## 10. UI

**Decisión**:

- **Panel**: una sección nueva, "Sonido", entre "Tiempo" y "Bajo":
  - "Qué suena": `ToggleGroup` con "Solo bajo" y "Bajo + acorde".
  - "Tipo de acorde": `<select>` nativo, con un `<optgroup>` por familia. Cada opción muestra el cifrado sobre Do y el nombre del tipo ("Cm7 · menor séptima"). Solo se muestra con "bajo + acorde".
  - "Estilo": `ToggleGroup` con "Analógico cálido" y "Pad ambiental".
- **Volumen**: suma el canal "Acorde" ("Volumen del acorde", "Silenciar acorde") entre el bajo y el metrónomo. Solo se muestra con "bajo + acorde" (FR-010).
- **Pantalla de práctica**: con "bajo + acorde", "Ahora" muestra el cifrado y el nombre, y el carril y la vista previa de la vuelta siguiente muestran cifrados. La línea de estado muestra el estilo.

**Razón**: los dos ajustes de dos opciones usan el mismo `ToggleGroup` que el compás y la figura. Con 25 opciones, el `<select>` mantiene corto el panel y ya trae los grupos accesibles. El pulido lo hace el cierre con `frontend-design`, como en la entrega 2.

**Alternativa descartada**: 25 botones en 5 grupos de `ToggleGroup`. Es coherente con el resto del panel, pero son unas 7 filas de botones grandes para un ajuste que se elige una vez por sesión.

## 11. E2E

**Decisión**: un test en `e2e/practice.spec.ts` a 320 × 640 px:

- con las notas F♯ y B♭, "bajo + acorde" y m(maj7), toca Play;
- comprueba que "Ahora" y cada compás del carril no desbordan (`scrollWidth ≤ clientWidth`) y que su caja queda dentro de la ventana.

**Razón**: jsdom no mide el layout, y FR-013 es justamente de layout. Corre en `chromium` y en `iphone`, los dos con la ventana fijada en 320 px.

## 12. Stop y el fin con el Pad

**Decisión**: sin cambios. Stop y el fin tras N vueltas cortan la salida de inmediato, como en la entrega 2 (FR-004).

**Riesgo**: con el Pad, el reverb sigue sonando unos segundos después de la última nota (en el spike: 0,08–0,14 un segundo después del release), y el corte puede oírse. Queda para la prueba de oído (quickstart §4). Si se oye, la corrección es un fundido de unos 30 ms en `stop`, que se agrega con su test y se registra aquí antes de implementarlo.
