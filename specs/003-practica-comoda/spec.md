# Feature Specification: Práctica cómoda (Entrega 2)

**Feature Branch**: `003-practica-comoda`

**Created**: 2026-10-24

**Status**: Draft

**Input**: Issue #3 "Entrega 2 · Práctica cómoda: compases, bajo, volúmenes y ajustes recordados" y sus sub-issues #20–#25 (repo `angelozdev/countdown-notes`).

Con la entrega 1, la app ya sirve para practicar en 4/4. Esta entrega la vuelve cómoda para sesiones largas: cualquier compás común, el bajo con la figura y la octava que el usuario quiera, el volumen de cada canal, que la práctica pare sola tras N vueltas, manos libres (pantalla encendida, barra espaciadora y tempo rápido) y los ajustes recordados al reabrir la app.

## Clarifications

### Session 2026-10-24

- Q: En 6/8, 9/8, 12/8 y 7/8, ¿qué cuentan la cuenta regresiva de "Ahora" y las marcas de cada compás del carril? → A: Una por grupo de acento: 6/8 = 2, 9/8 = 3, 12/8 = 4 y 7/8 = 3 (2+2+3). En los simples, una por tiempo, como hoy.
- Q: Con el metrónomo silenciado, ¿la cuenta de entrada suena? → A: Sí. Silenciar el metrónomo apaga sus golpes solo durante la música; la cuenta de entrada suena siempre, al volumen del metrónomo.

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Compases comunes (Priority: P1) · #20

En ajustes, el usuario elige el compás entre 2/4, 3/4, 4/4, 5/4, 6/8, 7/8, 9/8 y 12/8. El metrónomo, la cuenta de entrada, el carril y los cambios de nota lo siguen.

**Why this priority**: es lo que más amplía lo que se puede practicar (un vals, un 6/8, un 7/8), y define el pulso sobre el que se montan la figura del bajo y los demás ajustes.

**Independent Test**: elegir cada compás, tocar Play y oír la cuenta de entrada y el metrónomo con su agrupamiento; comprobar que el carril muestra las marcas de ese compás. Generar el audio sin parlantes en cada compás y comprobar el momento y el acento de cada golpe.

**Acceptance Scenarios**:

1. **Given** la app recién abierta, **When** el usuario abre ajustes, **Then** el compás es 4/4 y puede elegir 2/4, 3/4, 4/4, 5/4, 6/8, 7/8, 9/8 o 12/8.
2. **Given** 2/4, 3/4, 4/4 o 5/4 a 60 BPM, **When** suena la práctica, **Then** el metrónomo marca cada negra (2, 3, 4 o 5 golpes por compás, uno por segundo) y solo el tiempo 1 va acentuado.
3. **Given** 6/8, 9/8 o 12/8 a 60 BPM, **When** suena la práctica, **Then** el metrónomo marca cada corchea (6, 9 o 12 por compás, tres por segundo), con acento fuerte en la primera del compás y acento suave en la primera de cada grupo de tres.
4. **Given** 7/8 a 60 BPM, **When** suena la práctica, **Then** el metrónomo marca 7 corcheas por compás, una por segundo, agrupadas 2+2+3: acento fuerte en la 1 y suave en la 3 y la 5.
5. **Given** cualquier compás, **When** el usuario toca Play, **Then** la cuenta de entrada dura un compás de ese compás, con sus golpes y acentos, y "Ahora" muestra la cuenta regresiva, un número por grupo de acento (por ejemplo, en 6/8: 2, 1).
6. **Given** una práctica sonando, **When** el usuario mira el carril, **Then** cada compás tiene una marca por grupo de acento (2/4: 2, 3/4: 3, 4/4: 4, 5/4: 5, 6/8: 2, 9/8: 3, 12/8: 4, 7/8: 3), y cada marca se ilumina a la vez que el primer golpe de su grupo.
7. **Given** una práctica sonando en 4/4, **When** el usuario cambia el compás a 3/4, **Then** la vuelta en curso sigue en 4/4 y la siguiente vuelta suena y se ve en 3/4.
8. **Given** el audio generado sin parlantes en cada uno de los 8 compases, **When** se miden los golpes, **Then** cada uno cae en su momento teórico, y los acentos fuerte y suave caen donde corresponde.

---

### User Story 2 - Figura rítmica y octava del bajo (Priority: P2) · #21

En ajustes, el usuario elige si el bajo toca corcheas, negras, blancas o redondas, y en qué octava (1, 2 o 3).

**Why this priority**: en la entrega 1 el bajo ataca una vez por compás. Una figura más activa da más pulso para improvisar, y la octava permite oír el bajo en los parlantes del celular, que casi no reproducen los graves.

**Independent Test**: elegir cada figura y cada octava, tocar Play y oír cuántas veces ataca el bajo por compás y en qué registro; cambiarlas mientras suena y oír que aplican desde el siguiente compás. Generar el audio sin parlantes y comprobar el momento y la altura de cada ataque.

**Acceptance Scenarios**:

1. **Given** la app recién abierta, **When** el usuario abre ajustes, **Then** la figura es redondas (un ataque por compás, como en la entrega 1) y la octava es 2.
2. **Given** 4/4, **When** el usuario elige corcheas, negras, blancas o redondas, **Then** el bajo ataca la raíz 8, 4, 2 o 1 veces por compás, siempre desde el tiempo 1.
3. **Given** cualquier otro compás, **When** el usuario elige una figura, **Then** el bajo ataca según la tabla de FR-013.
4. **Given** la octava 3, **When** suena el bajo, **Then** la raíz suena una octava más aguda que en la octava 2; con la octava 1, una octava más grave.
5. **Given** una práctica sonando, **When** el usuario cambia la figura o la octava a mitad de compás, **Then** el compás en curso sigue igual y el siguiente ya suena con la nueva figura u octava.
6. **Given** el audio generado sin parlantes, **When** se miden los ataques del bajo con cada figura, **Then** cada uno cae en su momento teórico, con la altura de la octava elegida.

---

### User Story 3 - Volumen por canal y metrónomo apagable (Priority: P3) · #22

En ajustes hay un volumen para el bajo y otro para el metrónomo, cada uno con un botón para silenciarlo. Silenciar el metrónomo es apagarlo.

**Why this priority**: con el amplificador de la guitarra sonando, el usuario necesita equilibrar el bajo y el metrónomo, o practicar sin metrónomo para medir su propio pulso.

**Independent Test**: tocar Play, mover cada volumen y oír el cambio de inmediato; silenciar cada canal y comprobar que la práctica sigue. Generar el audio sin parlantes con un canal silenciado y comprobar que ese canal no suena.

**Acceptance Scenarios**:

1. **Given** la app recién abierta, **When** el usuario abre ajustes, **Then** ve un volumen para el bajo y otro para el metrónomo, con la mezcla de la entrega 1 y ninguno silenciado.
2. **Given** una práctica sonando, **When** el usuario sube o baja un volumen, **Then** el cambio se oye de inmediato, sin cortes.
3. **Given** una práctica sonando, **When** el usuario silencia el bajo o el metrónomo, **Then** ese canal se calla de inmediato y la práctica sigue: el otro canal, el carril y el contador continúan.
4. **Given** un canal silenciado, **When** el usuario quita el silencio, **Then** el canal vuelve a sonar con el volumen que tenía.
5. **Given** el metrónomo silenciado, **When** el usuario toca Play, **Then** la cuenta de entrada suena igual, al volumen del metrónomo, y después de ella el metrónomo se calla.
6. **Given** el audio generado sin parlantes con el bajo silenciado, **When** se mide el audio, **Then** no suena ningún ataque del bajo y los golpes del metrónomo siguen en su momento teórico.

---

### User Story 4 - Parar tras N vueltas (Priority: P4) · #23

En ajustes, el usuario puede pedir que la práctica se detenga sola al completar N vueltas ("toca esto 100 veces").

**Why this priority**: permite fijarse una meta de práctica y olvidarse de la pantalla hasta cumplirla.

**Independent Test**: activar "parar tras 2 vueltas", tocar Play y comprobar que el contador muestra el total y que la música se detiene sola al terminar la vuelta 2.

**Acceptance Scenarios**:

1. **Given** la app recién abierta, **When** el usuario abre ajustes, **Then** "parar tras N vueltas" está apagado: la práctica sigue hasta que el usuario toca Stop.
2. **Given** "parar tras 3 vueltas" activado, **When** suena la práctica, **Then** el contador muestra el total, por ejemplo "Vuelta 2 de 3 · nota 5 de 12".
3. **Given** "parar tras 3 vueltas" activado, **When** termina el último compás de la vuelta 3, **Then** la música se detiene sola, sin ningún golpe ni nota de más, y la pantalla vuelve al estado detenido, lista para otro Play.
4. **Given** la última vuelta sonando, **When** el usuario mira el carril, **Then** no aparece la primera nota de una vuelta siguiente.
5. **Given** la vuelta 5 de 10 sonando, **When** el usuario cambia N a 5 o menos, **Then** la práctica termina al completar la vuelta en curso; **When** en cambio apaga "parar tras N vueltas", **Then** la práctica sigue hasta Stop.

---

### User Story 5 - Manos libres: pantalla encendida, barra espaciadora y tempo rápido (Priority: P5) · #24

Mientras suena, la pantalla no se apaga. En el computador, la barra espaciadora hace Play/Stop. La pantalla de práctica tiene un control rápido de tempo, sin abrir ajustes.

**Why this priority**: elimina las interrupciones de una sesión larga: el iPhone que se bloquea, buscar el botón con el mouse y abrir el panel solo para cambiar el tempo.

**Independent Test**: en el iPhone, con el bloqueo automático en 30 s, tocar Play y comprobar que la pantalla sigue encendida varios minutos y que se apaga normalmente después de Stop. En el computador, hacer Play y Stop con la barra espaciadora. Cambiar el tempo desde la pantalla de práctica.

**Acceptance Scenarios**:

1. **Given** una práctica sonando (incluida la cuenta de entrada), **When** pasa el tiempo del bloqueo automático, **Then** la pantalla no se apaga; **When** la práctica se detiene (Stop o al terminar N vueltas), **Then** la pantalla vuelve a poder apagarse.
2. **Given** una práctica sonando, **When** el usuario cambia de pestaña o de app y vuelve sin haberla detenido, **Then** la pantalla vuelve a mantenerse encendida.
3. **Given** el computador, **When** el usuario pulsa la barra espaciadora, **Then** la práctica alterna entre Play y Stop exactamente una vez por pulsación, aunque el foco esté en un botón de la pantalla de práctica, y la página no se desplaza.
4. **Given** el panel de ajustes abierto, **When** el usuario pulsa la barra espaciadora, **Then** no hace Play/Stop: sirve para los controles del panel.
5. **Given** la pantalla de práctica, **When** el usuario usa el control rápido de tempo, **Then** el BPM sube o baja sin abrir ajustes, con las mismas reglas que en el panel (30–240, aplica desde el siguiente tiempo), y el tempo de arriba se actualiza.

---

### User Story 6 - Recordar los ajustes en el dispositivo (Priority: P6) · #25

Al reabrir la app, la configuración es la de la última vez.

**Why this priority**: con todos los ajustes de esta entrega, volver a configurarlos en cada sesión sería la mayor molestia. Va al final porque guarda los ajustes que crean las historias anteriores.

**Independent Test**: cambiar todos los ajustes, recargar la app y comprobar que siguen igual. Dañar los datos guardados, recargar y comprobar que la app abre con los valores por defecto.

**Acceptance Scenarios**:

1. **Given** el usuario cambió ajustes, **When** recarga, o cierra y vuelve a abrir la app, **Then** todos los ajustes son los de la última vez: BPM, compases por nota, notas, compás, figura y octava del bajo, volúmenes y silencios, y "parar tras N vueltas".
2. **Given** una práctica sonando, **When** el usuario recarga la app, **Then** la app abre detenida, con los ajustes de la última vez.
3. **Given** datos guardados inválidos, dañados o de una versión vieja, **When** el usuario abre la app, **Then** la app abre normalmente con los valores por defecto, sin mostrar errores.
4. **Given** un dispositivo que no permite guardar datos (por ejemplo, navegación privada), **When** el usuario usa la app, **Then** todo funciona igual, solo que no se recuerdan los ajustes.

---

### Edge Cases

- **Cambio de compás durante la última nota de una vuelta**: la siguiente vuelta ya está sorteada (entrega 1, FR-033), así que el compás nuevo aplica desde la vuelta posterior, igual que los demás ajustes de estructura.
- **Cambio de compás con la música detenida**: aplica al siguiente Play, también a la cuenta de entrada.
- **Cambio de compás y BPM**: el número de BPM se mantiene. Al pasar de 4/4 a 6/8 a 60 BPM, el BPM pasa a contar negras con puntillo y el compás dura 2 s en lugar de 4 s.
- **Compás largo y tempo lento** (7/8 a 30 BPM, 14 s por compás): el carril, la barra y las marcas siguen avanzando con el audio.
- **Corcheas a tempo rápido** (12/8 a 240 BPM, 12 ataques por segundo): todos los ataques caen en su momento, sin saltarse ni duplicarse.
- **Figura en un compás de otra vuelta**: cada compás usa la figura vigente al empezar y el compás (2/4, 6/8, …) de su vuelta.
- **Volumen en cero frente a silenciado**: con el volumen en cero el canal no se oye, pero no figura como silenciado; quitar el silencio devuelve el volumen anterior al silencio.
- **Los dos canales silenciados**: después de la cuenta de entrada, la práctica sigue en silencio, con el carril y el contador avanzando.
- **Metrónomo silenciado con el volumen en cero**: la cuenta de entrada suena al volumen del metrónomo, así que no se oye; queda la cuenta regresiva en pantalla.
- **N = 1**: suena una sola vuelta y la práctica se detiene.
- **N cambiado a un número menor que la vuelta en curso**: la práctica termina al completar la vuelta en curso.
- **Play después de parar tras N vueltas**: la práctica empieza desde cero: nueva cuenta de entrada y "Vuelta 1 de N".
- **Barra espaciadora con menos de 2 notas**: no hace nada, igual que el botón Play deshabilitado.
- **Pantalla encendida rechazada o no disponible** (modo de ahorro de batería, navegador sin soporte): la app suena y funciona igual.
- **Datos guardados con menos de 2 notas**: son válidos; la app los restaura con Play deshabilitado y el aviso de las 2 notas.
- **Datos guardados con un valor fuera de rango** (por ejemplo, BPM 500): se tratan como inválidos y se descartan (FR-031).
- **Dos pestañas abiertas**: cada una guarda sus cambios; al reabrir, manda el último cambio guardado.

## Requirements _(mandatory)_

### Functional Requirements

**Compases (#20)**

- **FR-001**: El panel MUST permitir elegir el compás entre 2/4, 3/4, 4/4, 5/4, 6/8, 7/8, 9/8 y 12/8, con 4/4 por defecto.
- **FR-002**: El BPM MUST contar la negra en 2/4, 3/4, 4/4 y 5/4; la negra con puntillo en 6/8, 9/8 y 12/8; y la corchea en 7/8. Al cambiar de compás, el número de BPM se mantiene.
- **FR-003**: En 2/4, 3/4, 4/4 y 5/4, el metrónomo MUST marcar cada negra, con acento fuerte solo en el tiempo 1.
- **FR-004**: En 6/8, 9/8 y 12/8, el metrónomo MUST marcar cada corchea, en grupos de tres: acento fuerte en la primera corchea del compás, acento suave en la primera de cada uno de los demás grupos, y sin acento las otras.
- **FR-005**: En 7/8, el metrónomo MUST marcar cada corchea, en grupos 2+2+3: acento fuerte en la corchea 1 y suave en la 3 y la 5.
- **FR-006**: El acento fuerte, el suave y el golpe sin acento MUST distinguirse al oído: el fuerte es el más agudo y el más fuerte, y el suave queda entre los dos.
- **FR-007**: La cuenta de entrada MUST durar un compás del compás elegido, con sus golpes y acentos. Durante la cuenta, "Ahora" MUST mostrar la cuenta regresiva, un número por grupo de acento, a la vez que el primer golpe de cada grupo (por ejemplo, en 6/8: 2, 1; en 7/8: 3, 2, 1).
- **FR-008**: En el carril, cada compás MUST tener una marca por grupo de acento: 2/4: 2, 3/4: 3, 4/4: 4, 5/4: 5, 6/8: 2, 9/8: 3, 12/8: 4 y 7/8: 3. Cada marca se ilumina a la vez que el primer golpe de su grupo.
- **FR-009**: La nota MUST cambiar siempre en el tiempo 1, cada N compases del compás elegido.
- **FR-010**: Un cambio de compás mientras suena MUST aplicar desde la siguiente vuelta: el sonido, el carril y la línea de estado. Con la música detenida, aplica al siguiente Play.
- **FR-011**: La línea de estado MUST mostrar el compás que está sonando y, con la música detenida, el elegido en ajustes.

**Figura y octava del bajo (#21)**

- **FR-012**: El panel MUST permitir elegir la figura del bajo: corcheas, negras, blancas o redondas, con redondas por defecto.
- **FR-013**: La figura MUST definir cuándo ataca el bajo la raíz, siempre desde el primer tiempo de cada compás. En los compases compuestos, cada figura vale con puntillo, como en la escritura musical:

  | Figura   | 2/4, 3/4, 4/4, 5/4                                           | 6/8, 9/8, 12/8                                                                  | 7/8 (2+2+3)                   |
  | -------- | ------------------------------------------------------------ | ------------------------------------------------------------------------------- | ----------------------------- |
  | Corcheas | Cada corchea                                                 | Cada corchea                                                                    | Cada corchea                  |
  | Negras   | Cada tiempo                                                  | Cada grupo de tres corcheas (negra con puntillo)                                | Cada grupo: corcheas 1, 3 y 5 |
  | Blancas  | Cada dos tiempos: 1 (2/4), 1 y 3 (3/4 y 4/4), 1, 3 y 5 (5/4) | Cada dos grupos (blanca con puntillo): grupo 1 (6/8), grupos 1 y 3 (9/8 y 12/8) | Grupos 1 y 3: corcheas 1 y 5  |
  | Redondas | Una vez por compás                                           | Una vez por compás                                                              | Una vez por compás            |

  Cada ataque se sostiene hasta el siguiente, apenas acortado para que cada ataque se distinga.

- **FR-014**: El panel MUST permitir elegir la octava del bajo: 1, 2 o 3, con 2 por defecto.
- **FR-015**: Un cambio de figura o de octava mientras suena MUST aplicar desde el siguiente compás.

**Volumen por canal y metrónomo apagable (#22)**

- **FR-016**: El panel MUST tener un control de volumen para el bajo y otro para el metrónomo, cada uno con un botón para silenciarlo. Por defecto, los volúmenes son la mezcla de la entrega 1 y ningún canal está silenciado.
- **FR-017**: Un cambio de volumen o de silencio MUST aplicar de inmediato, sin cortes ni golpes de más o de menos.
- **FR-018**: Silenciar un canal MUST NOT detener la práctica. Quitar el silencio devuelve el volumen que el canal tenía.
- **FR-019**: Silenciar el metrónomo MUST apagar sus golpes durante la práctica. La cuenta de entrada MUST sonar siempre, al volumen del metrónomo, aunque esté silenciado.

**Parar tras N vueltas (#23)**

- **FR-020**: El panel MUST permitir activar "parar tras N vueltas", con N entero entre 1 y 999. Por defecto está apagado y la práctica sigue hasta Stop.
- **FR-021**: Con "parar tras N vueltas" activado, el contador MUST mostrar el total de vueltas, por ejemplo "Vuelta 3 de 100 · nota 5 de 12".
- **FR-022**: Al terminar el último compás de la vuelta N, la práctica MUST detenerse sola, sin ningún sonido después, y la pantalla MUST volver al estado detenido.
- **FR-023**: Durante la última vuelta, la app MUST NOT sortear ni mostrar una vuelta siguiente.
- **FR-024**: Cambiar N o apagar "parar tras N vueltas" mientras suena MUST aplicar de inmediato: si la vuelta en curso ya es la N o una posterior, la práctica termina al completarla.

**Manos libres (#24)**

- **FR-025**: Mientras la práctica suena, incluida la cuenta de entrada, la pantalla MUST mantenerse encendida. Al detenerse la práctica (Stop o al terminar N vueltas), la pantalla vuelve a poder apagarse.
- **FR-026**: Si el sistema deja de mantener la pantalla encendida porque el usuario cambió de pestaña o de app, la app MUST volver a pedirlo al volver, si la práctica sigue sonando.
- **FR-027**: Si el dispositivo no permite mantener la pantalla encendida, la app MUST funcionar igual.
- **FR-028**: En el computador, la barra espaciadora MUST alternar Play/Stop, exactamente una vez por pulsación y sin desplazar la página, aunque el foco esté en un botón de la pantalla de práctica. Con el panel de ajustes abierto, o con Play deshabilitado, no hace nada.
- **FR-029**: La pantalla de práctica MUST tener un control rápido de tempo para subir y bajar el BPM sin abrir el panel, con las mismas reglas que el BPM del panel (FR-010 y FR-011 de la entrega 1). Es el único control de ajuste en la pantalla de práctica.

**Recordar los ajustes (#25)**

- **FR-030**: La app MUST guardar en el dispositivo, cada vez que cambian, todos los ajustes de las entregas 1 y 2: BPM, compases por nota, notas, compás, figura y octava del bajo, volumen y silencio de cada canal, y "parar tras N vueltas" con su N. Al abrir, MUST restaurarlos.
- **FR-031**: Al abrir, la app MUST validar los datos guardados. Si son inválidos, están dañados o son de una versión vieja, MUST descartarlos y usar los valores por defecto, sin mostrar errores.
- **FR-032**: El estado de la práctica (sonando, vuelta, posición) MUST NOT recordarse: la app siempre abre detenida.
- **FR-033**: Si el dispositivo no permite guardar datos, la app MUST funcionar igual, sin recordar los ajustes.
- **FR-034**: Los ajustes MUST guardarse solo en el dispositivo, sin cuentas ni nube.

### Key Entities

- **Compás**: uno de 2/4, 3/4, 4/4, 5/4, 6/8, 7/8, 9/8 o 12/8. Define qué figura cuenta el BPM, cuántos golpes de metrónomo tiene y cómo se agrupan esos golpes.
- **Grupo de acento**: los golpes del metrónomo que empiezan con un acento. El primero del compás lleva el acento fuerte y los demás, el suave. En 2/4, 3/4, 4/4 y 5/4, cada tiempo es un grupo de un golpe.
- **Figura del bajo**: corcheas, negras, blancas o redondas. Con el compás, define en qué golpes ataca el bajo (FR-013).
- **Octava del bajo**: 1, 2 o 3.
- **Canal**: el bajo o el metrónomo. Tiene un volumen y puede estar silenciado.
- **Repeticiones**: apagadas (hasta Stop) o N vueltas, de 1 a 999.
- **Ajustes de práctica**: los de la entrega 1 (BPM, compases por nota, notas) más compás, figura, octava, canales y repeticiones. Se guardan en el dispositivo.
- **Vuelta**: como en la entrega 1, y además guarda el compás vigente al sortearla, que no cambia después.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: En el audio generado sin parlantes, en cada uno de los 8 compases, el 100% de los golpes del metrónomo cae a menos de 1 ms de su momento teórico, con el acento que le corresponde, y ninguno se salta ni se duplica.
- **SC-002**: En el audio generado sin parlantes, con cada figura y en cada octava, el 100% de los ataques del bajo cae a menos de 1 ms de su momento teórico y con la altura esperada.
- **SC-003**: Un cambio de volumen o de silencio se oye en menos de 100 ms, sin cortar la práctica.
- **SC-004**: Con "parar tras N vueltas", la práctica se detiene al final exacto de la vuelta N en el 100% de los casos, sin ningún sonido después.
- **SC-005**: En el iPhone, en Safari y con el bloqueo automático en 30 s, la pantalla sigue encendida durante una práctica de 15 minutos y se apaga normalmente después de Stop.
- **SC-006**: En el computador, el usuario hace Play y Stop con una sola tecla, sin usar el mouse.
- **SC-007**: Tras recargar, o cerrar y reabrir la app, el 100% de los ajustes es el de la última vez; con datos guardados inválidos, la app abre con los valores por defecto en el 100% de los casos, sin errores.
- **SC-008**: Tras una sesión con la guitarra, el usuario confirma que pudo practicar en otro compás y que no tuvo que reajustar nada al reabrir la app.

## Assumptions

- Depende de la entrega 1 (#2). Su rama (`002-ya-me-sirve`) aún no está en `main`, así que esta rama parte de ella.
- Fuera de alcance: los acordes y su volumen (entrega 3, como dice #22), los estilos de sonido (entrega 3), la app instalada en la pantalla de inicio (entrega 7) y el audio en segundo plano (entrega 8). La pantalla encendida con la app instalada en iOS se verifica en la entrega 7 (#41); en esta, en Safari.
- El diseño (sección 7.2) menciona la cuenta de entrada entre los ajustes, pero ningún issue pide configurarla: sigue fija en 1 compás.
- El control rápido de tempo cambia la regla de la entrega 1 de que la pantalla de práctica no tiene controles de ajuste: #24 lo pide, como el diseño (sección 7.1). El tempo es el único ajuste en la pantalla de práctica; todo lo demás sigue en el panel.
- La figura del bajo en compases compuestos y en 7/8 la decide el builder (#21) y queda documentada en FR-013.
- Los volúmenes por defecto son la mezcla de la entrega 1 (diseño, Anexo A). La forma de los controles de volumen, el paso del control rápido de tempo y los textos de la UI los decide el builder (diseño, sección 11).
- El esquema de los datos guardados, incluido si un dato inválido descarta todos los ajustes o solo ese ajuste, es decisión del usuario y se resuelve en el plan con opciones y una recomendación (constitución, Flujo de trabajo; #25).
- La barra espaciadora aplica con teclado físico; en el iPhone no hay barra espaciadora.
