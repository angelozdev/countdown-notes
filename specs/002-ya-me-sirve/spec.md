# Feature Specification: "Ya me sirve" (Entrega 1)

**Feature Branch**: `002-ya-me-sirve`

**Created**: 2026-10-24

**Status**: Draft

**Input**: Issue #2 "Entrega 1 · "Ya me sirve": modo aleatorio + bajo + metrónomo + BPM" y sus sub-issues #15–#19 (repo `angelozdev/countdown-notes`).

Es el criterio de éxito del usuario: con esta entrega, la app "ya le sirve" para practicar con la guitarra. El usuario elige notas, BPM y compases por nota; da Play y oye la cuenta de entrada, el metrónomo con acento y el bajo en la raíz de una nota sorteada, mientras la pantalla muestra lo que viene. Compás fijo 4/4.

## Clarifications

### Session 2026-10-24

- Q: Al final de una vuelta, ¿el carril muestra por adelantado la primera nota de la siguiente vuelta? → A: Sí. La siguiente vuelta se sortea al empezar la última nota de la actual y su primera nota aparece al final del carril. Los ajustes cambiados durante esa última nota aplican una vuelta después.

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Play/Stop con metrónomo en 4/4 y cuenta de entrada (Priority: P1) · #15

El usuario abre la app y toca Play. Suena una cuenta de entrada de un compás y luego el metrónomo sigue marcando los cuatro tiempos de cada compás a 60 BPM, con el tiempo 1 acentuado. Toca Stop y todo se calla.

**Why this priority**: es la porción más delgada que funciona completa: audio desbloqueado, reloj musical preciso y Play/Stop. Todo lo demás (bajo, carril) se monta sobre este pulso.

**Independent Test**: abrir la app, tocar Play, oír la cuenta de entrada y el metrónomo con acento; tocar Stop y comprobar que se calla. Generar el audio sin parlantes y comprobar que cada golpe cae en su momento exacto.

**Acceptance Scenarios**:

1. **Given** la app recién abierta, **When** el usuario toca Play por primera vez, **Then** el audio se habilita con ese mismo toque, suena una cuenta de entrada de 4 golpes y después el metrónomo sigue marcando 4 tiempos por compás a 60 BPM (un golpe por segundo).
2. **Given** el metrónomo sonando, **When** el usuario escucha un compás, **Then** el tiempo 1 suena claramente distinto de los tiempos 2, 3 y 4 (más agudo y más fuerte), también durante la cuenta de entrada.
3. **Given** el metrónomo sonando o en la cuenta de entrada, **When** el usuario toca Stop, **Then** el sonido se corta de inmediato y el botón vuelve a ofrecer Play.
4. **Given** el audio generado sin parlantes a 60 BPM, **When** se miden los golpes, **Then** cada uno cae en su momento teórico (cada 1 s exacto) y el acento cae solo en el tiempo 1.
5. **Given** un iPhone con el interruptor de silencio activado, **When** el usuario toca Play, **Then** el metrónomo se oye por el parlante.

---

### User Story 2 - Ajustar el BPM desde el panel de ajustes (Priority: P2) · #16

El usuario abre el panel de ajustes (en el celular sube desde abajo) y cambia el BPM, también mientras suena. La pantalla de práctica muestra el tempo arriba, en pequeño, y no tiene controles de ajuste.

**Why this priority**: el BPM es parte del criterio de éxito ("ya me sirve") y crea el panel de ajustes donde viven los ajustes de las historias siguientes.

**Independent Test**: abrir el panel, cambiar el BPM con la música detenida y comprobar el tempo arriba y la velocidad del metrónomo; repetirlo mientras suena y comprobar que el cambio se oye de inmediato.

**Acceptance Scenarios**:

1. **Given** la app recién abierta, **When** el usuario mira la pantalla de práctica, **Then** ve arriba, en pequeño, el modo, el estilo, el tempo y el compás (por ejemplo, "Aleatorio · Analógico cálido · 60 BPM · 4/4"), y no ve controles de ajuste, solo Play/Stop y el acceso a ajustes.
2. **Given** el panel de ajustes abierto, **When** el usuario mira el BPM, **Then** vale 60 y se puede elegir cualquier valor entero entre 30 y 240, y ninguno fuera de ese rango.
3. **Given** el metrónomo sonando a 60 BPM, **When** el usuario cambia el BPM a 120, **Then** el siguiente tiempo ya suena a 120, sin cortes ni golpes dobles, y el tempo de arriba muestra "120 BPM".
4. **Given** el metrónomo sonando, **When** el usuario abre y cierra el panel, **Then** la música sigue sin interrumpirse.

---

### User Story 3 - Modo aleatorio: bajo en la raíz de una nota sorteada (Priority: P3) · #17

Al dar Play se sortea el orden de una vuelta de notas. Tras la cuenta de entrada, el bajo toca la raíz de la nota actual una vez por compás, en el tiempo 1, y la nota cambia cada N compases. "Ahora" muestra la nota grande con su nombre en español.

**Why this priority**: es el corazón del producto: la nota que cambia y que suena, sobre la que el usuario improvisa.

**Independent Test**: tocar Play y comprobar que, después de la cuenta de entrada, el bajo ataca la raíz en cada tiempo 1 y la nota de "Ahora" cambia cada 2 compases; recorrer varias vueltas y comprobar que no se repiten notas dentro de una vuelta ni dos veces seguidas. Generar el audio sin parlantes y comprobar que cada ataque del bajo cae en el tiempo 1.

**Acceptance Scenarios**:

1. **Given** las 12 notas seleccionadas y 2 compases por nota, **When** el usuario toca Play, **Then** el bajo no suena durante la cuenta de entrada y, al terminar, ataca la raíz de la primera nota en el tiempo 1 de cada compás, y la nota cambia cada 2 compases, siempre en el tiempo 1.
2. **Given** una práctica sonando, **When** se completa una vuelta, **Then** cada nota seleccionada sonó exactamente una vez en esa vuelta.
3. **Given** el final de una vuelta, **When** empieza la siguiente, **Then** su primera nota es distinta de la última de la vuelta anterior, de modo que nunca suena la misma nota dos veces seguidas.
4. **Given** el panel de ajustes, **When** el usuario mira "compases por nota", **Then** vale 2 y se puede elegir cualquier entero entre 1 y 16.
5. **Given** una práctica sonando con 2 compases por nota, **When** el usuario lo cambia a 4, **Then** la vuelta en curso sigue con 2 y la siguiente vuelta usa 4.
6. **Given** una nota sonando, **When** el usuario mira "Ahora", **Then** ve la nota en cifrado americano (por ejemplo, "B♭") y su nombre en español debajo ("Si bemol").
7. **Given** el audio generado sin parlantes, **When** se miden los ataques del bajo, **Then** cada uno coincide exactamente con un tiempo 1 y su altura es la raíz de la nota de ese compás, en el registro grave (octava 2).

---

### User Story 4 - Filtros de notas (Priority: P4) · #18

En ajustes, el usuario elige qué notas entran al sorteo, como en la app vieja: cada nota por separado, o todas las naturales o todas las alteradas de una vez.

**Why this priority**: permite enfocar la práctica (por ejemplo, solo naturales). La app ya sirve con las 12 notas, así que va después del bajo.

**Independent Test**: excluir notas en el panel, tocar Play y recorrer una vuelta: solo salen las notas incluidas. Dejar una sola nota y comprobar que Play no se puede usar y se explica por qué.

**Acceptance Scenarios**:

1. **Given** la app recién abierta, **When** el usuario abre los filtros, **Then** ve las 12 notas, todas incluidas, escritas como C, D♭, D, E♭, E, F, F♯, G, A♭, A, B♭, B.
2. **Given** los filtros, **When** el usuario excluye una nota y luego la vuelve a incluir, **Then** la nota sale y vuelve a entrar en el sorteo.
3. **Given** los filtros, **When** el usuario usa los atajos, **Then** puede incluir o excluir de una vez las 7 naturales o las 5 alteradas, y el atajo que no cambiaría nada aparece deshabilitado.
4. **Given** solo las naturales incluidas, **When** el usuario toca Play y recorre una vuelta, **Then** solo salen las 7 naturales, cada una una vez.
5. **Given** menos de 2 notas incluidas, **When** el usuario mira la pantalla de práctica o el panel, **Then** Play está deshabilitado y un texto explica que hacen falta al menos 2 notas.
6. **Given** una práctica sonando, **When** el usuario cambia los filtros, **Then** la vuelta en curso sigue igual y los filtros aplican desde la siguiente vuelta.

---

### User Story 5 - Pantalla de práctica: carril de compases (Priority: P5) · #19

Mientras suena, la pantalla muestra lo que viene en un carril de compases, legible a 1–2 m y sin tocarla: la nota actual muy grande, la vuelta completa en filas de 4 compases con el compás actual resaltado, y un contador abajo.

**Why this priority**: completa la experiencia manos libres. Las historias anteriores ya suenan y muestran la nota actual; esta agrega lo que viene y dónde está el usuario.

**Independent Test**: tocar Play y, sin tocar la pantalla, comprobar desde 1–2 m la cuenta regresiva, la nota actual, el compás resaltado que avanza con el audio, los compases atenuados y el contador.

**Acceptance Scenarios**:

1. **Given** el usuario tocó Play, **When** suena la cuenta de entrada, **Then** "Ahora" muestra la cuenta regresiva (4, 3, 2, 1) a la vez que cada golpe.
2. **Given** una práctica sonando, **When** el usuario mira el carril, **Then** ve la vuelta completa en filas de 4 compases, cada compás con su nota, y el compás actual resaltado con una barra que avanza y una marca por cada tiempo.
3. **Given** una práctica sonando, **When** avanza la música, **Then** los compases ya tocados y los que están más allá de la fila siguiente se ven atenuados, y el carril se desplaza solo para que el compás actual y la fila siguiente estén siempre a la vista.
4. **Given** una práctica sonando, **When** el usuario mira abajo, **Then** ve un contador como "Vuelta 2 · nota 5 de 12", el botón Play/Stop grande en el centro y el acceso a ajustes.
5. **Given** una práctica sonando, **When** suena el tiempo 1 de un compás, **Then** el resaltado del carril, la marca de tiempo y "Ahora" cambian a la vez que el sonido, también después de cambiar el BPM.
6. **Given** el final de una vuelta, **When** el usuario mira el carril, **Then** desde que empieza la última nota de la vuelta, la primera nota de la siguiente vuelta ya aparece al final del carril, así que siempre se ve lo que viene.

---

### Edge Cases

- **Primer Play**: los navegadores exigen un gesto del usuario para habilitar el audio. El primer toque en Play lo habilita; no hace falta otro toque ni un aviso aparte.
- **Stop durante la cuenta de entrada**: se corta todo; el bajo nunca llega a sonar.
- **Stop y Play de nuevo**: la práctica empieza desde cero: nueva cuenta de entrada, nueva vuelta sorteada y contador en "Vuelta 1".
- **Toques repetidos en Play/Stop**: cada toque alterna el estado; nunca quedan dos metrónomos sonando a la vez.
- **Pantalla o pestaña ocupada**: aunque la pantalla tarde en dibujar o la pestaña del computador esté ocupada, los golpes y el bajo no se adelantan, no se atrasan ni acumulan desfase. Al volver a dibujar, la pantalla muestra el compás que está sonando.
- **Cambio de BPM a mitad de compás**: el cambio aplica desde el siguiente tiempo, la barra de progreso sigue el tempo nuevo y no hay golpes dobles ni saltados.
- **BPM fuera de rango o inválido**: no se acepta; el BPM queda dentro de 30–240.
- **Ajustes cambiados durante la última nota de una vuelta**: la siguiente vuelta ya está sorteada (FR-033), así que los filtros y los compases por nota cambiados en ese momento aplican desde la vuelta posterior.
- **Exactamente 2 notas**: la vuelta alterna las dos y nunca repite una nota seguida, ni al cambiar de vuelta.
- **Filtros por debajo de 2 notas mientras suena**: la música no se detiene. La siguiente vuelta usa la última selección válida, y el panel explica que hacen falta al menos 2 notas.
- **Vuelta larga** (12 notas × 16 compases = 192 compases, 48 filas): el carril se desplaza solo y el compás actual siempre está a la vista.
- **iPhone con el interruptor de silencio activado**: el audio se oye igual.
- **Navegador sin control de sesión de audio** (computador, iOS viejo): la app suena normalmente; solo el iPhone necesita el ajuste para el modo silencio.
- **iPhone bloqueado o app en segundo plano**: fuera de alcance (entrega 8). La pantalla puede apagarse por el bloqueo automático, porque mantenerla encendida es de la entrega 2.

## Requirements _(mandatory)_

### Functional Requirements

**Play/Stop y metrónomo (#15)**

- **FR-001**: La pantalla de práctica MUST tener un botón Play/Stop grande en el centro, abajo. Play inicia la práctica; Stop la detiene de inmediato y calla todo.
- **FR-002**: El primer Play MUST habilitar el audio sin pedir ningún otro gesto.
- **FR-003**: Cada Play MUST empezar con una cuenta de entrada de 1 compás (4 golpes de metrónomo) antes de la música. El bajo no suena durante la cuenta.
- **FR-004**: El metrónomo MUST marcar los 4 tiempos de cada compás, en la cuenta de entrada y durante la práctica, con el tiempo 1 acentuado: más agudo y más fuerte que los demás.
- **FR-005**: El compás MUST ser 4/4, fijo en esta entrega, y el BPM cuenta negras.
- **FR-006**: Todo golpe del metrónomo y todo ataque del bajo MUST sonar en su momento teórico, sin adelantarse, atrasarse ni acumular desfase, aunque la pantalla o la pestaña estén ocupadas.
- **FR-007**: En el iPhone, el audio MUST oírse con el interruptor de silencio activado.
- **FR-008**: Stop seguido de Play MUST empezar la práctica desde cero: nueva cuenta de entrada, nueva vuelta sorteada y contador en "Vuelta 1".

**BPM y panel de ajustes (#16)**

- **FR-009**: Los ajustes MUST vivir en un panel aparte, que se abre desde la pantalla de práctica. En el celular, el panel sube desde abajo. Abrirlo y cerrarlo no interrumpe la música.
- **FR-010**: El BPM MUST poder elegirse entre 30 y 240, en enteros, con 60 por defecto. Un valor fuera de rango o inválido no se acepta.
- **FR-011**: Un cambio de BPM mientras suena MUST aplicar desde el siguiente tiempo, sin cortes, golpes dobles ni golpes saltados.
- **FR-012**: La pantalla de práctica MUST mostrar arriba, en pequeño, el modo, el estilo de sonido, el tempo y el compás (por ejemplo, "Aleatorio · Analógico cálido · 60 BPM · 4/4"), siempre al día con los ajustes.
- **FR-013**: La pantalla de práctica MUST NOT tener controles de ajuste: solo Play/Stop y el acceso a ajustes.

**Modo aleatorio y bajo (#17)**

- **FR-014**: Al dar Play, la app MUST sortear el orden de una vuelta en la que cada nota incluida aparece exactamente una vez.
- **FR-015**: Al terminar una vuelta, la app MUST sortear la siguiente con la misma regla, y su primera nota MUST ser distinta de la última de la vuelta anterior.
- **FR-016**: Cada nota MUST durar N compases ("compases por nota") y cambiar siempre en el tiempo 1.
- **FR-017**: "Compases por nota" MUST poder elegirse en el panel entre 1 y 16, en enteros, con 2 por defecto. Un cambio mientras suena aplica desde la siguiente vuelta.
- **FR-018**: El bajo MUST tocar la raíz de la nota actual una vez por compás, en el tiempo 1, en la octava 2 y con el estilo Analógico cálido. Si la nota dura varios compases, la raíz se vuelve a atacar en cada compás.
- **FR-019**: El modo aleatorio MUST ser el único modo de esta entrega, sin selector de modo. La práctica sigue, vuelta tras vuelta, hasta que el usuario toca Stop.

**Filtros de notas (#18)**

- **FR-020**: El panel MUST permitir incluir o excluir cada una de las 12 notas. Por defecto, las 12 están incluidas.
- **FR-021**: El panel MUST tener atajos para incluir todas las naturales, excluir todas las naturales, incluir todas las alteradas y excluir todas las alteradas. Un atajo que no cambiaría nada aparece deshabilitado.
- **FR-022**: Las notas MUST escribirse en cifrado americano, con las negras como D♭, E♭, F♯, A♭ y B♭, en toda la app (filtros, "Ahora" y carril).
- **FR-023**: Con menos de 2 notas incluidas, Play MUST estar deshabilitado, con un texto visible que explica que hacen falta al menos 2 notas.
- **FR-024**: Un cambio de filtros mientras suena MUST aplicar desde la siguiente vuelta. Si en ese momento hay menos de 2 notas incluidas, la siguiente vuelta usa la última selección válida y la música no se detiene.

**Pantalla de práctica (#19)**

- **FR-025**: "Ahora" MUST mostrar la nota actual lo más grande posible, con su nombre en español debajo (Do, Re bemol, Re, Mi bemol, Mi, Fa, Fa sostenido, Sol, La bemol, La, Si bemol, Si).
- **FR-026**: Durante la cuenta de entrada, "Ahora" MUST mostrar la cuenta regresiva (4, 3, 2, 1), un número por golpe.
- **FR-027**: El carril MUST mostrar la vuelta completa en filas de 4 compases, cada compás con su nota. El compás actual MUST verse resaltado, con una barra que avanza y una marca por cada tiempo.
- **FR-028**: Los compases ya tocados y los que están más allá de la fila siguiente a la actual MUST verse atenuados.
- **FR-029**: El carril MUST desplazarse solo, para que el compás actual y la fila siguiente estén siempre a la vista sin tocar la pantalla.
- **FR-030**: Abajo, la pantalla MUST mostrar un contador con la vuelta y la posición en ella (por ejemplo, "Vuelta 2 · nota 5 de 12", donde 12 es el número de notas de la vuelta), además del Play/Stop y el acceso a ajustes.
- **FR-031**: Lo que muestra la pantalla (cuenta regresiva, nota, compás resaltado, barra, marca de tiempo y contador) MUST cambiar a la vez que lo que suena, también después de un cambio de BPM.
- **FR-032**: La pantalla de práctica MUST leerse a 1–2 m de distancia, en el celular en vertical y en el computador, sin zoom ni desplazamiento horizontal.
- **FR-033**: La siguiente vuelta MUST sortearse cuando empieza la última nota de la vuelta actual, y el carril MUST mostrar su primera nota al final desde ese momento. Así, la nota que viene siempre está a la vista.
- **FR-034**: Con la música detenida, la pantalla MUST mostrar el Play/Stop, el acceso a ajustes y una indicación breve de qué hacer. El carril se llena al dar Play, cuando se sortea la vuelta.

### Key Entities

- **Nota**: una de las 12 clases de altura. Tiene su grafía en cifrado americano (C, D♭, …, B), su nombre en español (Do, Re bemol, …, Si) y es natural o alterada.
- **Selección de notas**: el conjunto de notas incluidas en el sorteo. Mínimo 2 para poder tocar.
- **Ajustes de práctica**: BPM (30–240), compases por nota (1–16) y selección de notas. En esta entrega no se recuerdan al recargar la app.
- **Vuelta**: un orden sorteado de las notas incluidas, cada una una vez. Cada nota ocupa "compases por nota" compases. Tiene un número (1, 2, 3, …).
- **Compás**: 4 tiempos, con la nota que suena en él. Pertenece a una vuelta.
- **Práctica**: su estado (detenida, cuenta de entrada o sonando) y su posición actual: vuelta, nota dentro de la vuelta, compás y tiempo.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: Con los valores por defecto, el usuario pasa de abrir la app a tocar sobre el bajo con 1 solo toque (Play) y en menos de 10 segundos.
- **SC-002**: En el audio generado sin parlantes, a 30, 60, 200 y 240 BPM, el 100% de los golpes del metrónomo y de los ataques del bajo cae a menos de 1 ms de su momento teórico, y ninguno se salta ni se duplica.
- **SC-003**: En una prueba de oído de 10 minutos a 60 y a 200 BPM, en el iPhone y en el computador, el usuario no percibe desfase, temblor, cortes ni golpes de más o de menos.
- **SC-004**: En 1.000 vueltas seguidas, con cualquier selección de 2 a 12 notas, cada vuelta contiene cada nota incluida exactamente una vez y hay 0 casos de la misma nota dos veces seguidas.
- **SC-005**: Desde 1–2 m, sin acercarse ni tocar la pantalla, el usuario identifica la nota actual, la que viene y en qué tiempo del compás va.
- **SC-006**: En el iPhone con el interruptor de silencio activado, el metrónomo y el bajo se oyen en el 100% de los intentos.
- **SC-007**: El cambio visual del compás se percibe simultáneo con el golpe del tiempo 1, con un desfase menor a 50 ms.
- **SC-008**: Tras la primera sesión de práctica con la guitarra, el usuario confirma que la app "ya le sirve".

## Assumptions

- Depende de la entrega 0 (#1). Su rama (`001-base-nueva`) aún no está en `main`, así que esta rama parte de ella.
- Fuera de alcance, porque son de la entrega 2: otros compases, figura y octava del bajo, apagar el metrónomo, volumen por canal, parar tras N vueltas, mantener la pantalla encendida, la barra espaciadora y recordar los ajustes. En esta entrega, los ajustes vuelven a sus valores por defecto al recargar la app.
- El diseño (sección 7.1) menciona un "control rápido de tempo" en la pantalla de práctica, pero el issue #16 pide que la pantalla de práctica no tenga controles de ajuste. Manda GitHub (constitución, Backlog): el BPM se cambia solo desde el panel.
- Los volúmenes del bajo y del metrónomo son fijos, con los niveles del prototipo aprobado (diseño, Anexo A).
- El bajo se sostiene el compás entero, hasta su siguiente ataque. El builder puede acortarlo un poco para que cada ataque se distinga.
- En el computador, la forma del panel de ajustes (lateral, centrado u otra) la decide el builder; en el celular, sube desde abajo.
- Los textos exactos de la UI, incluida la indicación con la música detenida y el aviso de las 2 notas, los decide el builder (diseño, sección 11).
- El usuario tiene un iPhone con iOS 17 o superior para verificar el modo silencio y la prueba de oído. Mientras no exista la entrega 2, puede alargar el bloqueo automático del iPhone para que la pantalla no se apague al practicar.
