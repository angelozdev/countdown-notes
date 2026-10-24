# Feature Specification: Acordes en modo aleatorio (Entrega 3)

**Feature Branch**: `004-acordes-aleatorio`

**Created**: 2026-10-24

**Status**: Draft

**Input**: Issue #4 "Entrega 3 · Acordes en modo aleatorio: tipos de jazz, voicings y dos estilos" y sus sub-issues #26–#28 (repo `angelozdev/countdown-notes`).

Hasta la entrega 2, la app toca solo el bajo en la raíz de la nota sorteada. Esta entrega suma el acorde: el usuario elige "bajo + acorde" y un tipo de acorde de jazz, y cada nota de la vuelta suena con ese acorde, en un voicing que suena bien. También suma el segundo estilo de sonido, Pad ambiental, que se elige junto al Analógico cálido de siempre.

## Clarifications

### Session 2026-10-24

- Q: Hoy, con los volúmenes por defecto, la mezcla ya pasa del máximo sin el acorde (bajo + click en 80: picos de 1,22 a 1,32, revisión final de la entrega 2). ¿Cómo se cumple FR-018? → A: Con un soft clipper en la salida común: lineal hasta 0,8 y una curva suave arriba. No baja el volumen general y también resuelve el hueco de #22 (bajo por encima de ~90).

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Bajo + acorde con tríadas (Priority: P1) · #26

En ajustes, el usuario elige entre "solo bajo" y "bajo + acorde". Con "bajo + acorde" elige una tríada (C, Cm, Cdim, Caug, Csus4 o Csus2), y todas las notas de la vuelta suenan con ese acorde: el bajo en la raíz y el acorde encima, atacado al inicio de cada compás y sostenido. "Ahora" muestra el cifrado y su nombre en español.

**Why this priority**: es el corte más delgado que ya cambia la práctica: con el acorde sonando, el usuario oye la calidad (mayor, menor…) sobre la que improvisa, y no solo la raíz. Deja montados el canal del acorde, su volumen y lo que muestran "Ahora" y el carril, que las otras dos historias amplían.

**Independent Test**: elegir "bajo + acorde" y Cm, tocar Play y oír el acorde menor en cada nota de la vuelta, con "Ahora" mostrando, por ejemplo, "Fm" y "Fa menor". Mover el volumen del acorde y silenciarlo. Generar el audio sin parlantes y comprobar el momento de cada ataque del acorde; comprobar por la API exportada las notas de cada voicing.

**Acceptance Scenarios**:

1. **Given** la app recién abierta, **When** el usuario abre ajustes, **Then** "qué suena" está en "solo bajo" y la práctica suena como en la entrega 2.
2. **Given** "bajo + acorde", **When** el usuario abre el selector de tipo, **Then** puede elegir C, Cm, Cdim, Caug, Csus4 o Csus2, con la tríada mayor por defecto.
3. **Given** "bajo + acorde" con Cm, **When** suena la práctica, **Then** cada compás empieza con el acorde menor de la nota de ese compás, que se sostiene hasta el compás siguiente, y el bajo sigue tocando la raíz con su figura y su octava.
4. **Given** una tríada, **When** suena el acorde, **Then** su voicing es abierto: la raíz en la octava 3, la quinta encima y la tercera (la cuarta en Csus4, la segunda en Csus2) una octava más arriba. Por ejemplo, C suena C3, G3 y E4.
5. **Given** "bajo + acorde", **When** el usuario mira "Ahora", **Then** ve el cifrado del acorde que suena (por ejemplo, "F♯m") y, debajo, su nombre en español ("Fa sostenido menor"); **When** mira el carril, **Then** cada compás muestra el cifrado de su acorde.
6. **Given** "bajo + acorde", **When** el usuario abre ajustes, **Then** el panel de volumen tiene también el canal del acorde, con su volumen y su botón de silencio, que se comporta como los otros dos canales (entrega 2, FR-016 a FR-018).
7. **Given** una práctica sonando, **When** el usuario cambia "qué suena" o el tipo de acorde a mitad de compás, **Then** el compás en curso sigue igual y el siguiente ya suena y se muestra con el cambio.
8. **Given** el audio generado sin parlantes con "bajo + acorde", **When** se miden los ataques del acorde, **Then** cae uno al inicio de cada compás, en su momento teórico, y ninguno durante la cuenta de entrada.

---

### User Story 2 - Vocabulario completo de jazz con voicings (Priority: P2) · #27

El selector de tipo ofrece los 25 tipos de acorde de jazz, agrupados por familias: tríadas, sextas, séptimas, extensiones y dominantes alterados. Los acordes de 4 notas o más suenan en voicings de jazz sin la raíz, que la toca el bajo.

**Why this priority**: es el vocabulario que el usuario pidió ("todos los más normales para jazz"). Las séptimas y extensiones son lo que más practica un guitarrista de jazz, pero dependen de que el canal del acorde ya exista (US1).

**Independent Test**: abrir el selector y encontrar los 25 tipos en sus 5 familias; elegir Cm7, C7alt y C13 y oír cada uno sobre la vuelta. Comprobar por la API exportada que los voicings de los 300 acordes (12 raíces por 25 tipos) cumplen las reglas de FR-007 y FR-008.

**Acceptance Scenarios**:

1. **Given** "bajo + acorde", **When** el usuario abre el selector de tipo, **Then** ve los 25 tipos agrupados en 5 familias, cada familia con su nombre: Tríadas (C, Cm, Cdim, Caug, Csus4, Csus2), Sextas (C6, Cm6, C6/9), Séptimas (Cmaj7, Cm7, C7, Cm7♭5, C°7, Cm(maj7), C7sus4), Extensiones (Cmaj9, Cm9, C9, Cm11, C13) y Dominantes alterados (C7♭9, C7♯9, C7♯11, C7alt).
2. **Given** un tipo de 4 notas o más, **When** suena el acorde, **Then** su voicing no tiene la raíz, contiene las notas que definen el tipo (FR-008) y queda en el registro de FR-009.
3. **Given** cualquier tipo y cualquier raíz, **When** el usuario mira "Ahora", **Then** ve el cifrado ("B♭m7♭5") y el nombre en español ("Si bemol semidisminuido"), según la tabla de FR-005.
4. **Given** el cifrado más largo de la lista sobre la raíz más larga (por ejemplo, "F♯m(maj7)"), **When** se muestra en "Ahora" y en el carril en una pantalla de 320 px de ancho, **Then** cabe completo, sin cortarse ni desbordar.

---

### User Story 3 - Segundo estilo: Pad ambiental y selector de estilo (Priority: P3) · #28

En ajustes, el usuario elige el estilo de sonido: Analógico cálido (el de siempre) o Pad ambiental. El estilo aplica al bajo y al acorde juntos, y la pantalla de práctica lo muestra arriba en pequeño.

**Why this priority**: da otro color para practicar, más suave y envolvente, pero la práctica ya funciona con un solo estilo.

**Independent Test**: elegir Pad ambiental, tocar Play y oír el bajo y el acorde con el sonido suave; cambiar de estilo mientras suena y oír que el cambio entra en el compás siguiente, sin cortes. Comprobar que arriba dice el estilo elegido.

**Acceptance Scenarios**:

1. **Given** la app recién abierta, **When** el usuario abre ajustes, **Then** el estilo es Analógico cálido y puede elegir Pad ambiental.
2. **Given** Pad ambiental, **When** suena la práctica, **Then** el bajo y el acorde suenan con ese estilo; con "solo bajo", el bajo suena con ese estilo.
3. **Given** una práctica sonando, **When** el usuario cambia de estilo a mitad de compás, **Then** el compás en curso sigue con el estilo anterior y el siguiente ya suena con el nuevo; lo que sigue sonando del estilo anterior termina sin cortes bruscos.
4. **Given** la pantalla de práctica, **When** el usuario mira arriba, **Then** ve el estilo que está sonando (por ejemplo, "Aleatorio · Pad ambiental · 60 BPM · 4/4") y, con la música detenida, el elegido en ajustes.

---

### Edge Cases

- **Cambio de "qué suena", tipo o estilo en el último compás de una vuelta**: aplica desde el compás siguiente, que ya es de la vuelta nueva; no espera a la vuelta posterior (no son ajustes de estructura).
- **Cambio de tipo de acorde con "solo bajo"**: se guarda y aplica cuando el usuario pasa a "bajo + acorde".
- **Cambios con la música detenida**: aplican al siguiente Play.
- **Acorde silenciado, o bajo y acorde silenciados**: la práctica sigue, con el carril y el contador avanzando, como con los canales de la entrega 2.
- **Bajo silenciado con un acorde de 4 notas o más**: el voicing sigue sin la raíz.
- **Bajo en la octava 3**: la raíz del bajo puede coincidir con la nota más grave de una tríada; no se corrige.
- **Raíces agudas** (B, B♭): la tríada abierta de Si llega a D♯5, dentro del registro de FR-009.
- **Pad ambiental a tempo rápido** (por ejemplo, 2/4 a 240 BPM, medio segundo por compás): el acorde vuelve a atacar antes de llegar a su volumen pleno, y las corcheas del bajo se suavizan. Es el carácter del estilo y no se corrige.
- **Stop o fin de "parar tras N vueltas" con el acorde sonando**: el acorde se calla igual que el bajo (entrega 2, FR-022), sin ningún ataque después.
- **Cuenta de entrada**: el acorde no suena; empieza en el primer compás de música, junto con el bajo.
- **Ajustes guardados de la entrega 2**: se conservan; los ajustes nuevos toman su valor por defecto.

## Requirements _(mandatory)_

### Functional Requirements

**Bajo + acorde (#26)**

- **FR-001**: El panel MUST permitir elegir "qué suena": "solo bajo" o "bajo + acorde", con "solo bajo" por defecto. Con "solo bajo", la práctica suena como en la entrega 2.
- **FR-002**: Con "bajo + acorde", el panel MUST permitir elegir el tipo de acorde, con la tríada mayor por defecto. Todas las notas de la vuelta usan ese mismo tipo.
- **FR-003**: Con "bajo + acorde", el acorde de la nota de cada compás MUST atacar al inicio de ese compás y sostenerse hasta el compás siguiente, apenas acortado para que cada ataque se distinga. No hay comping: un solo ataque por compás. El bajo sigue tocando la raíz con su figura y su octava.
- **FR-004**: El acorde MUST NOT sonar durante la cuenta de entrada, ni después del último compás al terminar "parar tras N vueltas".
- **FR-005**: Con "bajo + acorde", "Ahora" MUST mostrar el cifrado del acorde que suena y, debajo, su nombre en español: el nombre de la raíz (entrega 1, con la grafía D♭, E♭, F♯, A♭, B♭) seguido del nombre del tipo. Con "solo bajo", "Ahora" muestra la nota, como en la entrega 2.

  | Familia              | Cifrado (sobre Do) | Nombre del tipo               |
  | -------------------- | ------------------ | ----------------------------- |
  | Tríadas              | C                  | mayor                         |
  |                      | Cm                 | menor                         |
  |                      | Cdim               | disminuido                    |
  |                      | Caug               | aumentado                     |
  |                      | Csus4              | con cuarta suspendida         |
  |                      | Csus2              | con segunda suspendida        |
  | Sextas               | C6                 | sexta                         |
  |                      | Cm6                | menor sexta                   |
  |                      | C6/9               | sexta novena                  |
  | Séptimas             | Cmaj7              | séptima mayor                 |
  |                      | Cm7                | menor séptima                 |
  |                      | C7                 | séptima                       |
  |                      | Cm7♭5              | semidisminuido                |
  |                      | C°7                | disminuido séptima            |
  |                      | Cm(maj7)           | menor séptima mayor           |
  |                      | C7sus4             | séptima con cuarta suspendida |
  | Extensiones          | Cmaj9              | novena mayor                  |
  |                      | Cm9                | menor novena                  |
  |                      | C9                 | novena                        |
  |                      | Cm11               | menor oncena                  |
  |                      | C13                | trecena                       |
  | Dominantes alterados | C7♭9               | séptima novena bemol          |
  |                      | C7♯9               | séptima novena sostenida      |
  |                      | C7♯11              | séptima oncena sostenida      |
  |                      | C7alt              | séptima alterada              |

  Por ejemplo: Fm7 se llama "Fa menor séptima"; B♭m7♭5, "Si bemol semidisminuido".

- **FR-006**: Con "bajo + acorde", cada compás del carril MUST mostrar el cifrado de su acorde en lugar de solo la nota, y la vista previa de la vuelta siguiente también.
- **FR-007**: Las tríadas MUST sonar en voicing abierto: la raíz en la octava 3, la quinta (o la quinta disminuida o aumentada) justo encima, y la tercera una octava más arriba de donde iría en posición cerrada. En Csus4 y Csus2, la cuarta o la segunda ocupan el lugar de la tercera.
- **FR-008**: Los acordes de 4 notas o más MUST sonar en voicings de jazz de 3 a 5 notas, sin la raíz (la toca el bajo). Cada voicing MUST contener la tercera (la cuarta en C7sus4), la séptima o la sexta, y las extensiones y alteraciones de su cifrado: la novena en C6/9, Cmaj9, Cm9 y C9; la oncena en Cm11; la trecena en C13; la quinta disminuida en Cm7♭5 y C°7 (y la séptima disminuida en C°7); la ♭9, la ♯9 o la ♯11 en los dominantes de su nombre; y en C7alt, al menos una novena alterada (♭9 o ♯9) y una quinta alterada (♭5 o ♯5). La quinta justa puede omitirse, y en C13 también la oncena.
- **FR-009**: Todas las notas de un acorde MUST quedar entre C3 y E5. El diseño pide aproximadamente C3–C5; el margen hasta E5 deja caber la tríada abierta de Si (B3, F♯4, D♯5).
- **FR-010**: El panel de volumen MUST sumar el canal del acorde, con su control de volumen y su botón de silencio, con las mismas reglas que los canales de la entrega 2 (FR-016 a FR-018). Su volumen por defecto es la mezcla de partida del diseño (Anexo A) y no está silenciado. Con "solo bajo", el canal del acorde y el selector de tipo no se muestran.
- **FR-011**: Un cambio de "qué suena" o de tipo de acorde mientras suena MUST aplicar desde el siguiente compás, al sonido, a "Ahora" y al carril. Con la música detenida, aplica al siguiente Play.

**Vocabulario completo (#27)**

- **FR-012**: El selector de tipo MUST ofrecer los 25 tipos de FR-005, agrupados en sus 5 familias, en ese orden y con el nombre de cada familia a la vista. Cada opción se identifica por su cifrado y su nombre accesible incluye el nombre del tipo en español.
- **FR-013**: El cifrado más largo sobre cualquier raíz MUST caber completo en "Ahora" y en el carril, desde 320 px de ancho, sin cortarse ni desbordar.

**Estilos (#28)**

- **FR-014**: El panel MUST permitir elegir el estilo de sonido: Analógico cálido o Pad ambiental, con Analógico cálido por defecto.
- **FR-015**: El estilo MUST aplicar al bajo y al acorde juntos, con los sonidos de partida del diseño (Anexo A), afinados de oído dentro de la app.
- **FR-016**: Un cambio de estilo mientras suena MUST aplicar desde el siguiente compás. Lo que sigue sonando del estilo anterior MUST terminar sin cortes bruscos ni clicks. Con la música detenida, aplica al siguiente Play.
- **FR-017**: La línea de estado de la pantalla de práctica MUST mostrar el estilo que está sonando y, con la música detenida, el elegido en ajustes.

**Mezcla y ajustes recordados**

- **FR-018**: Con cualquier volumen, incluidos los tres canales al máximo, en los dos estilos y con cualquier acorde, la mezcla MUST NOT pasar del nivel máximo. Por debajo de 0,8 del máximo, el sonido no cambia; arriba, los picos se redondean suavemente en lugar de recortarse.
- **FR-019**: La app MUST recordar en el dispositivo los ajustes nuevos (qué suena, tipo de acorde, estilo, y volumen y silencio del acorde), con las reglas de la entrega 2 (FR-030 a FR-034). Los ajustes guardados por la entrega 2 MUST conservarse: los nuevos toman su valor por defecto.

### Key Entities

- **Qué suena**: "solo bajo" o "bajo + acorde".
- **Tipo de acorde**: uno de los 25 de FR-005. Tiene una familia, un cifrado, un nombre en español y las notas que lo definen.
- **Acorde**: una raíz (la nota sorteada) más un tipo. Se escribe con su cifrado ("D♭m7") y su nombre ("Re bemol menor séptima").
- **Voicing**: las notas concretas, con su octava, con que suena un acorde (FR-007 a FR-009).
- **Estilo**: Analógico cálido o Pad ambiental. Define el sonido del bajo y del acorde.
- **Canal**: ahora son tres: bajo, acorde y metrónomo. Cada uno tiene un volumen y puede estar silenciado.
- **Ajustes de práctica**: los de la entrega 2 más qué suena, tipo de acorde, estilo y el canal del acorde.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: En el audio generado sin parlantes, en los dos estilos, el 100% de los ataques del acorde cae a menos de 1 ms del inicio de su compás, uno por compás, ninguno durante la cuenta de entrada y ninguno después del final.
- **SC-002**: Para los 300 acordes (12 raíces por 25 tipos), el 100% de los voicings cumple FR-007 a FR-009.
- **SC-003**: Para los 300 acordes, "Ahora" muestra el cifrado y el nombre en español de la tabla de FR-005, y el más largo cabe completo en una pantalla de 320 px.
- **SC-004**: Un cambio de "qué suena", tipo o estilo aplica en el compás siguiente en el 100% de los casos, sin cortar la práctica.
- **SC-005**: En el audio generado sin parlantes, con los volúmenes por defecto y con los tres canales al máximo, en los dos estilos y con el acorde más denso, la mezcla nunca supera el nivel máximo.
- **SC-006**: Tras una sesión con la guitarra, el usuario confirma que improvisó sobre acordes de séptima en los dos estilos, y que los voicings suenan bien y se distinguen los tipos.

## Assumptions

- Depende de la entrega 2 (#3), que ya está en `main`; esta rama parte de `main`.
- Fuera de alcance: el modo progresión, la tonalidad y el movimiento de voces entre acordes distintos (entrega 4; en el modo aleatorio todas las notas usan el mismo tipo), el comping y la línea de bajo caminante (no objetivos del diseño).
- El tipo de acorde por defecto (la tríada mayor) es decisión del builder, porque ningún issue lo fija. La tríada mayor es la que más se parece a lo que ya suena con "solo bajo".
- Los nombres en español de la tabla de FR-005 son una propuesta del builder (diseño, sección 11: los textos exactos los decide el builder), a partir del ejemplo de #4 ("Fa menor séptima"). El usuario los revisa en esta spec.
- El algoritmo de voicings es del builder (diseño, sección 11). La spec fija solo las reglas que se pueden comprobar (FR-007 a FR-009).
- Los parámetros de sonido del Anexo A del diseño son el punto de partida; se afinan de oído dentro de la app (diseño, 5.1).
- Con "solo bajo", el canal del acorde y el selector de tipo se ocultan para no llenar el panel (decisión del builder). Sus valores se conservan.
- El soft clipper de FR-018 (decisión del usuario, Clarifications) también cierra el hueco conocido de la entrega 2: el bajo por encima de ~90 (#22).
- Los ajustes guardados por la entrega 2 se conservan porque cada ajuste guardado ya vuelve a su valor por defecto cuando falta o es inválido (entrega 2, data-model). Los detalles del esquema van en el plan.
