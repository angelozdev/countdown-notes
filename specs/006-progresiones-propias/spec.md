# Feature Specification: Progresiones propias (Entrega 5)

**Feature Branch**: `006-progresiones-propias`

**Created**: 2026-10-25

**Status**: Draft

**Input**: Issue #6 "Entrega 5 · Progresiones propias" y sus sub-issues #33–#36 (repo `angelozdev/countdown-notes`).

Hasta la entrega 4, el modo progresión solo toca la biblioteca: 21 progresiones fijas, transportadas a la tónica elegida. Esta entrega deja que el usuario arme las suyas, escribiéndolas como texto o tocando el carril, con compases de dos acordes y acordes de varios compases. Las guarda en el dispositivo con nombre y tonalidad, y las puede renombrar y borrar. Una progresión propia suena y se ve igual que una de la biblioteca.

## Clarifications

### Session 2026-10-25

- Q: ¿Dónde se arma una progresión propia: una pantalla aparte que se abre desde ajustes, el carril de la pantalla de práctica en modo edición, o dentro del panel de ajustes? → A: En una pantalla aparte, a pantalla completa, que se abre desde ajustes con "Nueva progresión" o "Editar" y vuelve con "Listo". La pantalla de práctica no cambia.
- Q: ¿Cómo se guarda una progresión propia? → A: Con un botón "Guardar". Lo no guardado se puede descartar, y "Listo" pregunta si hay cambios sin guardar.
- Q: ¿Cómo se fija la tonalidad de origen? → A: Con un selector en el editor (tónica y mayor o menor), con la tónica de ajustes en mayor por defecto.
- Q: Con "Guardar" y el editor aparte, ¿cómo se oye una progresión antes de guardarla? → A: El editor tiene su propio Play/Stop, que hace sonar lo que muestra, guardado o no.

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Escribir una progresión como texto (Priority: P1) · #33

En ajustes, en el modo progresión, el usuario toca "Nueva progresión" y escribe `Dm7 G7 Cmaj7 Cmaj7`. El carril del editor se llena con un acorde por compás, y la progresión queda elegida: al dar Play suena como cualquier progresión de la biblioteca. Si un acorde no se reconoce, se marca en el texto y la progresión no cambia.

**Why this priority**: es el corte más delgado de punta a punta: un campo de texto, el carril y el sonido que ya existe. Guardar, tocar el carril y las duraciones amplían cómo se arma la progresión, no cómo suena.

**Independent Test**: abrir el editor, escribir `Dm7 G7 Cmaj7 Cmaj7` y ver 4 compases en el carril; cerrar, dar Play y oír el ii–V–I con el contador "Vuelta 1 · compás 1 de 4". Escribir `Dm7 Hm7` y ver «Hm7» marcado, con el carril sin cambios. Generar el audio sin parlantes y comprobar que es igual al del ii–V–I mayor de la biblioteca en la misma tonalidad.

**Acceptance Scenarios**:

1. **Given** el modo progresión, **When** el usuario abre ajustes, **Then** ve "Nueva progresión" junto al selector de progresión; **When** la toca, **Then** se abre el editor a pantalla completa, y "Listo" lo devuelve a la pantalla de práctica.
2. **Given** el editor abierto, **When** el usuario escribe `Dm7 G7 Cmaj7 Cmaj7`, **Then** el carril del editor muestra Dm7 | G7 | Cmaj7 | Cmaj7, un acorde por compás, y la progresión queda elegida.
3. **Given** esa progresión elegida, **When** el usuario toca Play, **Then** suena la cuenta de entrada y la progresión en loop, con el carril, "Ahora", el contador y la línea de estado de la entrega 4; el audio generado sin parlantes es igual al del ii–V–I mayor de la biblioteca en la misma tonalidad.
4. **Given** el editor, **When** el usuario escribe cualquier tipo de acorde de la lista (FR-003) sobre cualquier raíz, con ♭ y ♯ o con b y #, **Then** el carril lo muestra con el cifrado de la app (`Bbm7b5` → B♭m7♭5, `f#7#9` → F♯7♯9).
5. **Given** el texto `Dm7 Hm7 G7`, **When** el usuario lo escribe, **Then** «Hm7» se marca como no reconocido, el carril conserva la última progresión válida y nada se guarda.
6. **Given** la progresión propia sonando, **When** el usuario cambia el texto, **Then** la vuelta en curso sigue igual y la siguiente suena con el cambio.

---

### User Story 2 - Guardar, renombrar y borrar progresiones propias (Priority: P2) · #34

Una progresión propia tiene nombre y aparece en el selector de progresión, en el grupo "Mis progresiones", junto a la biblioteca. Se guarda en el dispositivo con "Guardar", con su nombre y la tonalidad de origen que se elige en el editor: al reabrir la app sigue ahí, y al elegirla suena en esa tonalidad hasta que el usuario elija otra. Se puede renombrar y borrar, y los cambios sin guardar se pueden descartar.

**Why this priority**: sin guardar, cada progresión se pierde al cerrar la app; pero escribirla y tocar encima ya funciona (US1).

**Independent Test**: escribir `Am G F E`, elegir La menor, ponerle "Andaluza mía", tocar "Guardar", recargar la app y encontrarla en "Mis progresiones". Elegirla con la tónica en Do y oír Am | G | F | E; cambiar la tónica a Do y oír Cm | B♭ | A♭ | G. Cambiar un compás, salir con "Listo", descartar y ver la versión guardada. Renombrarla, borrarla y ver que desaparece. Romper a mano los datos guardados y ver que la app abre igual.

**Acceptance Scenarios**:

1. **Given** una progresión guardada, **When** el usuario abre el selector de progresión, **Then** la ve en el grupo "Mis progresiones", primero, con su nombre.
2. **Given** el editor de una progresión propia, **When** el usuario cambia el nombre y toca "Guardar", **Then** el selector y la línea de estado muestran el nombre nuevo.
3. **Given** progresiones guardadas, **When** el usuario cierra y reabre la app, **Then** siguen ahí con su nombre, sus compases y su tonalidad; si una estaba elegida, sigue elegida.
4. **Given** `Am | G | F | E` guardada en La menor y la tónica en Do, **When** el usuario la elige, **Then** la tónica pasa a La y suena y se ve Am | G | F | E; **When** después elige la tónica Do, **Then** suena y se ve Cm | B♭ | A♭ | G.
5. **Given** una progresión propia, **When** el usuario la borra y confirma, **Then** desaparece del selector; si era la elegida, queda elegido el ii–V–I mayor y, si sonaba, la práctica se detiene.
6. **Given** datos guardados rotos o de otra versión, **When** la app abre, **Then** descarta solo las progresiones inválidas, conserva las demás y los ajustes, y no muestra ningún error.
7. **Given** un texto con un acorde no reconocido, **When** el usuario mira el editor, **Then** "Guardar" no está disponible.
8. **Given** el editor con cambios sin guardar, **When** el usuario toca Play en el editor, **Then** suena lo que muestra el editor, y lo guardado no cambia.
9. **Given** cambios sin guardar, **When** el usuario toca "Listo", **Then** la app pregunta, dentro de la propia app, "Guardar", "Descartar cambios" o "Seguir editando"; **When** descarta, **Then** vuelve la última versión guardada, y una progresión nueva que nunca se guardó desaparece.
10. **Given** el editor de una progresión nueva con la tónica de ajustes en Fa, **When** el usuario mira la tonalidad, **Then** dice Fa mayor; **When** elige La y menor, **Then** los acordes escritos no cambian y la línea de estado dice "La menor".

---

### User Story 3 - Armar la progresión tocando el carril (Priority: P3) · #35

En el editor, el usuario toca un compás del carril y elige la raíz (12 botones) y el tipo de acorde (agrupado por familias, como en ajustes). Puede agregar y quitar compases. El resultado es el mismo que escribiéndola, y el texto se actualiza solo.

**Why this priority**: es la forma cómoda en el celular, con la guitarra colgada; pero escribir ya cubre todo lo que se puede armar (US1).

**Independent Test**: en una progresión nueva, agregar 4 compases tocando y armar Dm7 | G7 | Cmaj7 | Cmaj7; ver que el texto dice `Dm7 | G7 | Cmaj7 | Cmaj7` y que el audio generado sin parlantes es igual al de la misma progresión escrita.

**Acceptance Scenarios**:

1. **Given** el editor con al menos un compás, **When** el usuario toca un compás, **Then** ve las 12 raíces y el selector de tipo, con el acorde de ese compás marcado.
2. **Given** ese selector, **When** elige la raíz F y el tipo m7, **Then** el compás muestra Fm7 y el texto se reescribe con el cambio.
3. **Given** el selector de tipo del editor, **When** el usuario lo abre, **Then** ve los tipos agrupados por las mismas familias, en el mismo orden, que "Tipo de acorde" en ajustes.
4. **Given** el editor, **When** el usuario toca "Agregar compás", **Then** aparece al final un compás igual al último; en una progresión vacía, la tríada de la tónica de su tonalidad de origen.
5. **Given** un compás elegido, **When** el usuario toca "Quitar", **Then** el compás desaparece; con un solo compás, "Quitar" no está disponible.
6. **Given** Dm7 | G7 | Cmaj7 | Cmaj7 armada tocando y la misma escrita, **When** se comparan, **Then** tienen el mismo carril, el mismo texto y el mismo audio.

---

### User Story 4 - Duraciones: medio compás y varios compases (Priority: P4) · #36

Un compás se puede partir en dos acordes, y un acorde puede durar varios compases, tanto tocando como escribiendo. Escribiendo, `|` separa compases y los acordes dentro de un compás se reparten: `Cmaj7 | C7 A7 | Dm7 G7`.

**Why this priority**: las formas de jazz piden medio compás (turnarounds, final del blues), pero las progresiones de un acorde por compás ya se practican sin esto.

**Independent Test**: escribir `Cmaj7 | C7 A7 | Dm7 G7` y ver 3 compases, los dos últimos partidos; con el bajo en redondas, oír el ataque del bajo en el tiempo 3. Tocando, partir un compás, cambiar su segunda mitad y unirlo de nuevo. Duplicar un compás y ver el acorde en dos compases seguidos. Generar el audio sin parlantes y comprobar los ataques de medio compás.

**Acceptance Scenarios**:

1. **Given** el editor, **When** el usuario escribe `Cmaj7 | C7 A7 | Dm7 G7`, **Then** el carril muestra 3 compases, el segundo y el tercero partidos en dos partes con su cifrado.
2. **Given** un texto sin `|`, **When** el usuario lo escribe, **Then** cada acorde es un compás; **Given** un texto con `|`, **Then** `|` separa compases y cada compás tiene uno o dos acordes.
3. **Given** el texto `C | Dm7 G7 C`, **When** el usuario lo escribe, **Then** el segundo compás se marca como error (más de dos acordes) y el carril no cambia.
4. **Given** un compás de un acorde, **When** el usuario toca "Partir", **Then** queda en dos partes con el mismo acorde, cada una editable; **When** toca "Unir", **Then** queda solo el acorde de la primera parte.
5. **Given** un compás, **When** el usuario toca "Duplicar", **Then** aparece una copia justo después; el acorde dura así dos compases, igual que escribiéndolo dos veces.
6. **Given** un compás partido en 4/4, **When** suena, **Then** el segundo acorde entra en el tiempo 3; en 3/4, 5/4, 7/8 y 9/8 entra donde dice la entrega 4 (FR-017), y el carril muestra las dos partes proporcionales.
7. **Given** el audio generado sin parlantes con una progresión propia de compases partidos, **When** se miden los ataques, **Then** cada cambio de acorde cae en su momento teórico.

---

### Edge Cases

- **Texto con error mientras suena**: la práctica sigue con la última progresión válida.
- **Texto vacío, o "Quitar" en el último compás**: una progresión necesita al menos un compás; el texto vacío se marca como error y se conserva la última versión válida.
- **Barras al principio o al final** (`| Dm7 | G7 |`): se ignoran, como en un cuaderno de partituras. Un compás vacío entre dos barras (`Dm7 || G7`) es un error.
- **Raíz que quedaría como E♯, B♯, C♭ o F♭** (`E#7`, `Cb`): se acepta y se escribe con su enarmónica simple (F7, B), como en la entrega 4 (FR-013). Dos alteraciones (`Cbb`) es un acorde no reconocido.
- **Grafía en la tonalidad de origen**: cada acorde se ve como se escribió (`C#m7` sigue siendo C♯m7, no D♭m7); transportado, sigue las reglas de la entrega 4 (FR-013) según el tipo de su tonalidad.
- **Cambio de compás con compases partidos**: el punto de corte se recalcula con el compás nuevo (entrega 4, FR-017), desde la vuelta siguiente.
- **Editar una progresión que no es la elegida**: abrirla en el editor la elige; si sonaba otra, la práctica se detiene, como al cambiar de progresión (entrega 4, FR-016).
- **Editar la progresión elegida mientras suena**: la música sigue con el editor abierto, y el cambio aplica desde la siguiente vuelta, como un cambio de tonalidad.
- **Barra espaciadora en el editor** (computador): escribe un espacio en el texto; no hace play/stop.
- **Borrar la progresión elegida mientras suena**: la práctica se detiene y queda elegido el ii–V–I mayor.
- **Nombre vacío**: se conserva el nombre anterior. Dos progresiones pueden llamarse igual.
- **Cerrar la app con cambios sin guardar**: se pierden, porque la app no puede preguntar al cerrarse; al reabrir está la última versión guardada.
- **Cambiar la tonalidad de origen**: no transporta lo escrito; cambia cómo se nombra la progresión y desde dónde se transporta.
- **Progresiones propias largas**: el carril se desplaza como con el ii–V–I por las 12 (entrega 4).
- **Sin almacenamiento en el dispositivo** (navegación privada estricta): la app funciona y las progresiones duran hasta cerrarla, como los ajustes (entrega 2).
- **"Solo bajo"**: "Ahora" y el carril muestran el cifrado de cada acorde, como en la entrega 4.
- **Ajustes guardados de la entrega 4**: se conservan; lo nuevo toma su valor por defecto.

## Requirements _(mandatory)_

### Functional Requirements

**Escribir como texto (#33)**

- **FR-001**: En el modo progresión, el panel MUST ofrecer "Nueva progresión" y, con una progresión propia elegida, "Editar". Los dos abren el editor de progresiones: una pantalla aparte, a pantalla completa, con el nombre, la tonalidad de origen, un campo de texto, un carril editable, Play/Stop y "Guardar". "Listo" MUST volver a la pantalla de práctica, que no cambia (constitución, principio IV). Abrir el editor no detiene la música, salvo lo que dice FR-007.
- **FR-002**: En un texto sin `|`, cada acorde MUST ser un compás. Los acordes se separan con espacios o saltos de línea, en cualquier cantidad.
- **FR-003**: El texto MUST reconocer cada acorde como una raíz (A–G, en mayúscula o minúscula) con a lo sumo una alteración (♭ o `b`, ♯ o `#`), seguida del sufijo de uno de los 25 tipos de la entrega 3, tal como lo escribe la app, con ♭ y ♯ también como `b` y `#`:

  | Familia              | Sufijos                               |
  | -------------------- | ------------------------------------- |
  | Tríadas              | (nada), m, dim, aug, sus4, sus2       |
  | Sextas               | 6, m6, 6/9                            |
  | Séptimas             | maj7, m7, 7, m7♭5, °7, m(maj7), 7sus4 |
  | Extensiones          | maj9, m9, 9, m11, 13                  |
  | Dominantes alterados | 7♭9, 7♯9, 7♯11, 7alt                  |

  Además, MUST aceptar `ø` y `ø7` por m7♭5, y `o7` y `dim7` por °7, que son los cifrados difíciles de escribir en un teclado.

- **FR-004**: Un acorde no reconocido MUST marcarse en el texto, citándolo. Mientras el texto tenga un error (FR-004 y FR-021), el carril MUST conservar la última progresión válida y nada se guarda.
- **FR-005**: Una raíz que quedaría como E♯, B♯, C♭ o F♭ MUST escribirse con su enarmónica simple (entrega 4, FR-013). En su tonalidad de origen, cada otro acorde MUST verse como se escribió.
- **FR-006**: El carril del editor MUST verse como el de práctica (filas de 4 compases, compases partidos en sus partes) y actualizarse con cada cambio válido del texto.
- **FR-007**: Al crear o abrir una progresión propia, MUST quedar elegida. Si sonaba otra progresión, la práctica se detiene (entrega 4, FR-016).
- **FR-008**: Una progresión propia MUST sonar y verse como una de la biblioteca: cuenta de entrada y vueltas (entrega 4, FR-003), bajo y acorde (FR-005 y FR-006), movimiento de voces (FR-007), carril, "Ahora", contador y línea de estado con su nombre y su tonalidad (FR-008 a FR-011), y transporte con su grafía (FR-012 a FR-015). El selector de tipo de acorde no aparece (FR-021), porque cada acorde trae su tipo.
- **FR-009**: Un cambio en el editor de la progresión elegida, guardado o no, MUST aplicar desde la siguiente vuelta, al sonido, al carril y a la línea de estado. Al descartar, la versión guardada vuelve a sonar desde la siguiente vuelta.

**Guardar, renombrar y borrar (#34)**

- **FR-010**: Cada progresión propia MUST tener un nombre, "Progresión 1", "Progresión 2"… por defecto (el primer número libre). Los cambios del editor (compases, nombre y tonalidad) MUST guardarse solo al tocar "Guardar", que no está disponible mientras el texto tenga un error. "Listo" con cambios sin guardar MUST preguntar dentro de la app: "Guardar", "Descartar cambios" o "Seguir editando". Descartar vuelve a la última versión guardada; una progresión nueva que nunca se guardó desaparece, y vuelve a quedar elegida la progresión anterior (si sonaba, la práctica se detiene, como al cambiar de progresión).
- **FR-010a**: El Play/Stop del editor MUST hacer lo mismo que el de la práctica (cuenta de entrada, vueltas, "parar tras N vueltas") con lo que muestra el editor, guardado o no, para probarlo sin guardarlo. Es la misma práctica: lo que empieza en el editor sigue sonando al volver con "Listo", y al revés.
- **FR-011**: El editor MUST tener un selector de tonalidad de origen: las 12 tónicas, escritas como en ajustes según el tipo (entrega 4, FR-013), y mayor o menor; por defecto, la tónica de ajustes en mayor. Cambiarla no cambia los acordes escritos: cambia cómo se nombra la progresión y desde dónde se transporta. Al elegir una progresión propia, y al cambiar su tonalidad de origen en el editor, la tónica de ajustes MUST pasar a la suya, así que suena como se escribió hasta que el usuario elija otra tónica; desde ahí se transporta como una de la biblioteca.
- **FR-012**: El selector de progresión MUST mostrar las progresiones propias en el grupo "Mis progresiones", antes de Ciclos, Jazz y Pop, rock y latino, en orden de creación. Sin progresiones propias, el grupo no aparece.
- **FR-013**: El editor MUST permitir renombrar la progresión, que se guarda con "Guardar" (FR-010). Un nombre vacío conserva el anterior; los nombres pueden repetirse.
- **FR-014**: El editor MUST permitir borrar la progresión, después de una confirmación dentro de la app. Si era la elegida, queda elegido el ii–V–I mayor y, si sonaba, la práctica se detiene.
- **FR-015**: Las progresiones propias MUST guardarse en el dispositivo y seguir ahí al reabrir la app. La progresión elegida se recuerda, sea propia o de la biblioteca (entrega 4, FR-022).
- **FR-016**: Al cargar, cada progresión guardada MUST validarse. Una inválida se descarta sin afectar a las demás ni a los ajustes, y sin mostrar un error. Si la progresión elegida ya no existe, queda elegido el ii–V–I mayor.

**Armar tocando (#35)**

- **FR-017**: Tocar un compás del carril del editor (o una parte de un compás partido) MUST abrir un selector con las 12 raíces, escritas como en el modo aleatorio (C, D♭, D, E♭, E, F, F♯, G, A♭, A, B♭, B), y el tipo de acorde agrupado por las familias de la entrega 3, igual que "Tipo de acorde" en ajustes. El acorde de ese compás aparece marcado.
- **FR-018**: El editor MUST permitir agregar un compás al final, igual al último (en una progresión vacía, la tríada de la tónica de su tonalidad de origen, mayor o menor según su tipo), y quitar cualquier compás mientras quede al menos uno.
- **FR-019**: Cada cambio tocando MUST reescribir el texto en su forma de siempre: compases separados por `|` y cada acorde con el cifrado de la app. Escribir ese texto MUST dar el mismo carril y el mismo sonido.

**Duraciones (#36)**

- **FR-020**: En un texto con `|`, `|` MUST separar compases, y cada compás tiene uno o dos acordes separados por espacios. Un `|` al principio o al final se ignora.
- **FR-021**: Un compás con más de dos acordes, o vacío entre dos `|`, MUST marcarse como error en el texto (FR-004).
- **FR-022**: Un compás con dos acordes MUST durar como en la entrega 4 (FR-017): mitad y mitad en 2/4, 4/4, 6/8 y 12/8, y por grupos de acento en 3/4, 5/4, 7/8 y 9/8. Si cambia el compás, el corte se recalcula.
- **FR-023**: Tocando, el editor MUST permitir partir un compás de un acorde en dos partes con el mismo acorde, editables por separado, y unir un compás partido, que queda con el acorde de la primera parte.
- **FR-024**: El editor MUST permitir duplicar un compás, que inserta una copia justo después. Un acorde que dura varios compases es el mismo acorde en compases seguidos, escrito o duplicado: suena como en la entrega 4 (FR-006, ataca en cada compás; FR-007, conserva su voicing).

**Ajustes recordados**

- **FR-025**: Los ajustes guardados por la entrega 4 MUST conservarse; lo nuevo toma su valor por defecto.

### Key Entities

- **Progresión propia**: un nombre, una tonalidad de origen (tónica y tipo, mayor o menor) y una lista de compases, como una progresión de la biblioteca sin grupo fijo.
- **Compás**: uno o dos acordes. Con dos, se parte según el compás de la práctica (FR-022).
- **Acorde**: una raíz escrita (con su grafía, como C♯ o G♭) y un tipo de la entrega 3.
- **Texto de la progresión**: la forma escrita de los compases; el carril y el texto son dos vistas de la misma progresión.
- **Progresión elegida**: la de la práctica, de la biblioteca o propia; se recuerda en el dispositivo.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: Para los 25 tipos de acorde sobre las 12 raíces, escritos con ♭ y ♯ o con `b` y `#`, el 100% se reconoce y se muestra con el cifrado de la app; el 100% de los acordes no reconocidos se marca, y un texto con error nunca cambia el carril ni lo guardado.
- **SC-002**: Una misma progresión armada tocando y escribiendo da en el 100% de los casos el mismo carril, el mismo texto y el mismo audio generado sin parlantes.
- **SC-003**: En el audio generado sin parlantes, el 100% de los cambios de acorde de una progresión propia, incluidos los de compases partidos, cae a menos de 1 ms de su momento teórico, igual que en la entrega 4.
- **SC-004**: El 100% de las progresiones guardadas sigue ahí al reabrir la app, con su nombre, sus compases y su tonalidad; con datos rotos, la app abre sin error en el 100% de los casos y conserva las progresiones válidas.
- **SC-005**: Desde el celular, el usuario arma un blues de jazz de 12 compases con dos compases partidos en menos de 3 minutos, escribiendo o tocando.
- **SC-006**: Tras una sesión con la guitarra, el usuario confirma que armó y guardó al menos una progresión propia, que la practicó en otra tonalidad y que sonó como esperaba.

## Assumptions

- Depende de la entrega 4 (#5), que ya está en `main`; esta rama parte de `main`.
- Fuera de alcance: editar o copiar las progresiones de la biblioteca, importar o exportar progresiones, compases de más de dos acordes, ciclos propios por las 12 tonalidades, y el cambio automático de tonalidad (entrega 6, #7).
- Sintaxis del texto (diseño, sección 4.2: la decide el builder): la sugerida por el diseño, `Cmaj7 | C7 A7 | Dm7 G7`, más la forma sin `|` de un acorde por compás (#33). No hay sintaxis de repetición (`×2`): un acorde de varios compases se escribe varias veces, que es lo que pide #36 ("repetirlo").
- Los alias `ø`, `ø7`, `o7` y `dim7` y la raíz en minúscula son decisión del builder: hacen escribible en el teclado del celular todo cifrado de la lista. Otros cifrados comunes (`-7`, `M7`, `Δ`) quedan fuera, para no agrandar lo que se reconoce sin que se pida.
- "Medio compás solo en 2/4, 4/4, 6/8 y 12/8" (#36) se lee con la decisión del usuario de la spec 005: en los demás compases, un compás de dos acordes no se parte en mitades sino por grupos de acento (entrega 4, FR-017). Así, una progresión propia suena en cualquier compás, y "Partir" está disponible en todos.
- El tipo de tonalidad de una progresión propia es mayor o menor; el dórico solo lo usa el modal de la biblioteca.
- Las 12 raíces del selector tocando usan la grafía del modo aleatorio (decisión del builder). Otra grafía (C♯ en vez de D♭) se consigue escribiendo.
- "Mis progresiones" va primero en el selector (decisión del builder): son las que el usuario armó para practicar.
- El esquema de los datos guardados es decisión del usuario (#6, constitución): el plan presenta opciones con una recomendación.
- El carril del editor no sigue la reproducción (decisión del builder): el compás actual, el avance y "Ahora" se miran en la pantalla de práctica, y el editor queda para editar.
- "Agregar compás" copia el último, para que repetir un acorde sea un toque; "Duplicar" cubre repetir uno del medio (decisión del builder, #36: "repetirlo o cambiar su duración").
