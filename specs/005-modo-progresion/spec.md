# Feature Specification: Modo progresión con biblioteca (Entrega 4)

**Feature Branch**: `005-modo-progresion`

**Created**: 2026-10-24

**Status**: Draft

**Input**: Issue #5 "Entrega 4 · Modo progresión con biblioteca" y sus sub-issues #29–#32 (repo `angelozdev/countdown-notes`).

Hasta la entrega 3, la app solo tiene el modo aleatorio: una nota sorteada cada N compases, con su bajo y, si se quiere, su acorde. Esta entrega suma el segundo modo: el usuario elige una progresión de la biblioteca y una tonalidad, da Play y toca encima en loop o N vueltas. El carril muestra la progresión completa, incluidos los compases con dos acordes, y la biblioteca trae también ciclos que recorren las 12 tonalidades.

## Clarifications

### Session 2026-10-24

- Q: En 3/4, 5/4, 7/8 y 9/8 no hay medio compás. ¿Qué pasa con los compases de dos acordes de la biblioteca? → A: Se parten por sus grupos de acento: 3/4 en 2 + 1 tiempos, 5/4 en 3 + 2, 7/8 en 4 + 3 corcheas y 9/8 en 6 + 3. La forma no cambia de largo y el carril muestra las dos partes proporcionales.
- Q: ¿Qué pasa con la tonalidad al cambiar de progresión? → A: Se comparte: hay una sola tónica para todas las progresiones, y cada una suena en esa tónica con su propio tipo (mayor, menor o dórico). En Fa, el ii–V–I va en Fa mayor y la cadencia andaluza en Fa menor.

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Modo progresión con un ii–V–I en loop (Priority: P1) · #29

En ajustes, el usuario elige el modo progresión. Al dar Play suena un ii–V–I mayor en Do (Dm7 | G7 | Cmaj7 | Cmaj7) en loop, hasta Stop o hasta N vueltas. El carril muestra la progresión completa y dónde vas, "Ahora" muestra el acorde que suena, y el contador dice en qué vuelta va.

**Why this priority**: es el corte más delgado del modo nuevo: una sola progresión, en una sola tonalidad, pero ya de punta a punta (selector de modo, sonido por acorde, carril, contador y repeticiones). Las otras tres historias amplían lo que se elige, no cómo suena.

**Independent Test**: elegir el modo progresión, tocar Play y oír Dm7, G7 y Cmaj7 (este, dos compases) en loop; ver el carril con los 4 compases y el contador "Vuelta 2 · compás 3 de 4". Activar "parar tras 3 vueltas" y ver que se detiene sola. Cambiar de modo mientras suena y ver que se detiene. Generar el audio sin parlantes y comprobar que cada cambio de acorde cae al inicio de su compás.

**Acceptance Scenarios**:

1. **Given** la app recién abierta, **When** el usuario abre ajustes, **Then** el modo es "aleatorio" y puede elegir "progresión"; la práctica suena como en la entrega 3.
2. **Given** el modo progresión, **When** el usuario toca Play, **Then** suena la cuenta de entrada y después Dm7 | G7 | Cmaj7 | Cmaj7, una y otra vez hasta Stop.
3. **Given** el modo progresión sonando, **When** el usuario mira la pantalla, **Then** el carril muestra los 4 compases de la progresión con su cifrado, el compás actual resaltado como en el modo aleatorio, "Ahora" muestra el acorde que suena con su nombre en español ("Re menor séptima") y el contador dice "Vuelta 2 · compás 3 de 4".
4. **Given** el modo progresión con "parar tras 3 vueltas", **When** termina la tercera vuelta, **Then** la práctica se detiene sola y el contador dice "Vuelta 3 de 3" durante la última.
5. **Given** "solo bajo", **When** suena la progresión, **Then** el bajo toca la raíz de cada acorde con su figura y su octava; **Given** "bajo + acorde", **Then** suena además cada acorde, atacado al inicio de cada compás y sostenido.
6. **Given** el modo progresión sonando, **When** el usuario cambia al modo aleatorio (o al revés), **Then** la práctica se detiene.
7. **Given** el modo progresión, **When** el usuario abre ajustes, **Then** no ve los filtros de notas ni "compases por nota", que son del modo aleatorio, y "Elige al menos 2 notas" no bloquea el Play.
8. **Given** el audio generado sin parlantes, **When** se miden los ataques del bajo y del acorde, **Then** cada cambio de acorde cae al inicio de su compás, en su momento teórico, y ninguno durante la cuenta de entrada ni después del final.

---

### User Story 2 - Elegir tonalidad (Priority: P2) · #30

En ajustes, el usuario elige una de las 12 tonalidades, y la progresión se transporta desde su tonalidad de origen, con las alteraciones escritas según la tonalidad (B♭ en Fa mayor, A♯ en Si mayor).

**Why this priority**: practicar en todas las tonalidades es la razón de tener progresiones; pero con una sola tonalidad la práctica ya funciona (US1).

**Independent Test**: elegir Fa y ver Gm7 | C7 | Fmaj7 | Fmaj7 en el carril; elegir Si y ver C♯m7 | F♯7 | Bmaj7 | Bmaj7. Cambiar de tonalidad mientras suena y ver que la vuelta en curso sigue igual y la siguiente ya suena y se ve en la tonalidad nueva.

**Acceptance Scenarios**:

1. **Given** el modo progresión, **When** el usuario abre ajustes, **Then** ve un selector con las 12 tónicas, con Do por defecto.
2. **Given** la tonalidad Fa, **When** suena el ii–V–I, **Then** suena y se ve Gm7 | C7 | Fmaj7 | Fmaj7, con el bajo en las raíces nuevas.
3. **Given** cualquiera de las 12 tonalidades, **When** el usuario mira el carril y "Ahora", **Then** cada acorde se escribe con las alteraciones de esa tonalidad (FR-013), por ejemplo C♯m7 en Si mayor y no D♭m7, y su nombre en español sigue la misma grafía ("Do sostenido menor séptima").
4. **Given** una práctica sonando en Do, **When** el usuario cambia a Fa, **Then** la vuelta en curso sigue en Do y la siguiente suena y se ve en Fa, como los demás ajustes de estructura.
5. **Given** la música detenida, **When** el usuario cambia de tonalidad, **Then** el carril muestra la progresión en la tonalidad nueva desde el siguiente Play.

---

### User Story 3 - Biblioteca completa con medio compás (Priority: P3) · #31

En ajustes, el usuario elige cualquier progresión de jazz o de pop, rock y latino. Las que lo piden tienen compases con dos acordes, que el carril muestra partidos en dos mitades, y el bajo ataca la raíz nueva en cada cambio de acorde.

**Why this priority**: es el vocabulario que el usuario aprobó, pero depende del modo y de la tonalidad (US1 y US2).

**Independent Test**: abrir el selector de progresión y encontrar las 17 progresiones de FR-018, agrupadas en Jazz y Pop, rock y latino. Elegir el blues de jazz y ver los compases 11 y 12 partidos (C7 A7 | Dm7 G7); con el bajo en redondas, oír el ataque del bajo a mitad de compás. Generar el audio sin parlantes y comprobar los ataques de medio compás.

**Acceptance Scenarios**:

1. **Given** el modo progresión, **When** el usuario abre el selector de progresión, **Then** ve las progresiones de FR-018 agrupadas, con el nombre de cada grupo a la vista, y el ii–V–I mayor por defecto.
2. **Given** cualquier progresión de la biblioteca, **When** el usuario la elige, **Then** el carril muestra sus compases tal como dice FR-018, transportados a la tonalidad elegida.
3. **Given** un compás con dos acordes en 4/4, **When** el usuario mira el carril, **Then** ese compás se ve partido en dos mitades, cada una con su cifrado; **When** suena, **Then** "Ahora" cambia de acorde a mitad de compás.
4. **Given** el bajo en redondas y un compás con dos acordes, **When** suena ese compás, **Then** el bajo ataca la raíz del primer acorde al inicio y la del segundo a mitad de compás; con "bajo + acorde", el segundo acorde también ataca a mitad de compás.
5. **Given** un acorde que dura varios compases (por ejemplo, Dm7 en el modal), **When** suena, **Then** el bajo y el acorde vuelven a atacar al inicio de cada compás.
6. **Given** una progresión sonando, **When** el usuario elige otra, **Then** la práctica se detiene.
7. **Given** la cadencia andaluza, escrita en La menor, **When** el usuario la elige con la tónica La, **Then** suena y se ve Am | G | F | E; **When** la elige con la tónica Do, **Then** suena en Do menor (Cm | B♭ | A♭ | G), y el selector de tonalidad nombra las tonalidades como menores.
8. **Given** el audio generado sin parlantes con una progresión de medio compás, **When** se miden los ataques, **Then** cada cambio de acorde, también los de mitad de compás, cae en su momento teórico.
9. **Given** la tónica Fa con el ii–V–I mayor, **When** el usuario elige otra progresión, **Then** la nueva también suena en Fa, con su propio tipo de tonalidad.
10. **Given** un compás con dos acordes en 3/4, 5/4, 7/8 o 9/8, **When** suena, **Then** el segundo acorde entra donde dice FR-017 (por ejemplo, en el tercer tiempo de 3/4), y el carril muestra el compás partido en dos partes proporcionales.

---

### User Story 4 - Ciclos por las 12 tonalidades (Priority: P4) · #32

La biblioteca trae, además, ciclos: el ciclo de cuartas, el de quintas y el ii–V–I por las 12 tonalidades recorren las 12, y los dominantes encadenados llevan a la tónica por quintas. En los ciclos de solo raíces, el tipo de acorde lo elige el usuario.

**Why this priority**: es el ejercicio clásico para dominar las 12 tonalidades, pero se apoya en todo lo anterior.

**Independent Test**: elegir el ciclo de cuartas desde Fa y ver F | B♭ | E♭ | … | C en el carril, con un selector de tipo de acorde que en otras progresiones no aparece. Elegir el ii–V–I por las 12 y ver que una vuelta tiene 48 compases y avanza por cuartas.

**Acceptance Scenarios**:

1. **Given** el selector de progresión, **When** el usuario lo abre, **Then** ve también el grupo Ciclos, con las 4 progresiones de FR-019.
2. **Given** un ciclo que recorre las 12 tonalidades, **When** el usuario elige una tonalidad, **Then** el ciclo empieza en ella y una vuelta es el recorrido completo, de vuelta al punto de partida.
3. **Given** el ciclo de cuartas o el de quintas con "bajo + acorde", **When** el usuario abre ajustes, **Then** ve el selector de tipo de acorde del modo aleatorio, y cada raíz suena con el tipo elegido; **Given** cualquier otra progresión, **Then** ese selector no aparece.
4. **Given** el ii–V–I por las 12 desde Do, **When** suena, **Then** recorre Dm7 G7 Cmaj7 Cmaj7, después Gm7 C7 Fmaj7 Fmaj7, y así por cuartas hasta las 12 tonalidades.
5. **Given** un ciclo de solo raíces con "solo bajo", **When** el usuario mira "Ahora" y el carril, **Then** ve las raíces, como en el modo aleatorio.

---

### Edge Cases

- **Cambio de tonalidad o de compás durante el último compás de una vuelta**: la siguiente vuelta ya está armada (como en el modo aleatorio, entrega 1, FR-033), así que el cambio aplica desde la vuelta posterior.
- **Cambio de "qué suena", tipo de acorde, estilo, figura u octava**: aplica desde el siguiente compás, como en las entregas 2 y 3, aunque el compás siguiente sea de la vuelta nueva.
- **Cambio de modo o de progresión durante la cuenta de entrada**: la práctica se detiene, igual que con la música sonando.
- **Cambios con la música detenida**: aplican al siguiente Play.
- **"Parar tras N vueltas" bajado por debajo de la vuelta en curso**: igual que en el modo aleatorio (entrega 2): la vuelta en curso es la última.
- **Filtros del modo aleatorio con menos de 2 notas**: no afectan al modo progresión; el aviso solo aparece en el modo aleatorio.
- **Figura del bajo que ya cae en el cambio de acorde** (por ejemplo, negras en 4/4): el bajo ataca una sola vez en ese momento, no dos.
- **Corcheas del bajo en un compás partido**: siguen las corcheas; desde la mitad, con la raíz nueva.
- **"Solo bajo" en una progresión con tipos de acorde**: "Ahora" y el carril muestran igual el cifrado de la progresión (Dm7, G7…), porque es la armonía sobre la que se improvisa.
- **Progresiones largas** (el ii–V–I por las 12, 48 compases): el carril se desplaza para mantener a la vista la fila actual y la siguiente, como en el modo aleatorio.
- **Vista previa de la vuelta siguiente**: desde el último compás de una vuelta, el carril muestra el primer acorde de la siguiente (como el modo aleatorio, entrega 1, FR-033), ya en la tonalidad nueva si cambió.
- **Compases de dos acordes en 3/4, 5/4, 7/8 y 9/8**: se parten por grupos de acento (FR-017), así que la forma no cambia de largo.
- **Pasar de una progresión mayor a una menor con la misma tónica**: la tónica se conserva y solo cambia su grafía si hace falta (FR-013): D♭ en una mayor, C♯ en una menor.
- **Ajustes guardados de la entrega 3**: se conservan; los ajustes nuevos toman su valor por defecto.

## Requirements _(mandatory)_

### Functional Requirements

**Modo progresión (#29)**

- **FR-001**: El panel MUST permitir elegir el modo: "aleatorio" o "progresión", con "aleatorio" por defecto. En el modo aleatorio, la práctica es la de la entrega 3.
- **FR-002**: Cambiar de modo MUST detener la práctica si está sonando o en la cuenta de entrada.
- **FR-003**: En el modo progresión, Play MUST tocar la cuenta de entrada de 1 compás (entrega 2) y después la progresión desde su primer compás, una vuelta tras otra, hasta Stop o hasta completar "parar tras N vueltas" (entrega 2, mismo ajuste que el modo aleatorio).
- **FR-004**: En el modo progresión, el panel MUST NOT mostrar los filtros de notas ni "compases por nota", y Play MUST NOT depender de cuántas notas haya incluidas. Sus valores se conservan para el modo aleatorio.
- **FR-005**: En cada compás, el bajo MUST tocar la raíz del acorde que suena con la figura y la octava elegidas (entrega 2). Además, MUST atacar la raíz nueva en cada cambio de acorde, aunque la figura no caiga en ese momento, y una sola vez si cae.
- **FR-006**: Con "bajo + acorde", cada acorde MUST atacar al comienzo de su duración y, si dura más de un compás, otra vez al inicio de cada compás; se sostiene hasta el ataque siguiente, apenas acortado (entrega 3, FR-003). Con "solo bajo", solo suena el bajo.
- **FR-007**: En una progresión, cada voicing de 4 notas o más MUST elegirse, entre los que cumplen las reglas de la entrega 3 (FR-008 y FR-009), como el que menos se mueve respecto del acorde anterior: la menor suma, sobre cada nota del voicing nuevo, de su distancia en semitonos a la nota más cercana del anterior; en un empate, el más cercano a C4 (entrega 3). Un acorde que se repite conserva su voicing. El primer acorde de cada vuelta usa el voicing de la entrega 3, así que todas las vueltas suenan igual. Las tríadas siguen con su voicing abierto (entrega 3, FR-007).
- **FR-008**: El carril MUST mostrar la progresión completa de la vuelta que suena, en filas de 4 compases, cada compás con el cifrado de su acorde, con el compás actual resaltado, su barra de avance y sus marcas de tiempo, y los compases ya tocados o lejanos atenuados (entrega 1).
- **FR-009**: "Ahora" MUST mostrar el cifrado del acorde que suena y, debajo, su nombre en español (entrega 3, FR-005), también con "solo bajo".
- **FR-010**: El contador MUST decir "Vuelta 3 · compás 5 de 12" en loop y "Vuelta 3 de 100 · compás 5 de 12" con "parar tras N vueltas".
- **FR-011**: La línea de estado MUST mostrar, en lugar de "Aleatorio", la progresión y la tonalidad que suenan (con la música detenida, las elegidas), además del estilo, el tempo y el compás; por ejemplo, "ii–V–I mayor · Fa mayor · Analógico cálido · 60 BPM · 4/4".

**Tonalidad (#30)**

- **FR-012**: El panel MUST ofrecer, en el modo progresión, las 12 tónicas, con Do por defecto. La tónica elegida es una sola para todas las progresiones: cada progresión suena y se ve transportada desde su tonalidad de origen (FR-018) a esa tónica, con su propio tipo de tonalidad (mayor, menor o dórico). Cambiar de progresión no cambia la tónica.
- **FR-013**: Las tónicas MUST escribirse así, según el tipo de tonalidad de la progresión, y cada acorde con las alteraciones de su tonalidad (B♭ en Fa mayor, A♯ en Si mayor). Una nota que así quedaría como E♯, B♯, C♭, F♭ o con doble alteración se escribe con su enarmónica simple (en Fa♯ mayor, Fm7♭5 y no E♯m7♭5).

  | Tónica (semitonos desde Do) | Mayor | Menor y dórico |
  | --------------------------- | ----- | -------------- |
  | 0                           | C     | C              |
  | 1                           | D♭    | C♯             |
  | 2                           | D     | D              |
  | 3                           | E♭    | E♭             |
  | 4                           | E     | E              |
  | 5                           | F     | F              |
  | 6                           | F♯    | F♯             |
  | 7                           | G     | G              |
  | 8                           | A♭    | G♯             |
  | 9                           | A     | A              |
  | 10                          | B♭    | B♭             |
  | 11                          | B     | B              |

  Los ciclos que recorren las 12 tonalidades escriben sus raíces como en FR-019, empiecen donde empiecen.

- **FR-014**: Los nombres en español MUST seguir la grafía del cifrado: "Do sostenido menor séptima" para C♯m7, "Sol bemol séptima mayor" para G♭maj7. La tonalidad se nombra con su tónica y su tipo: "Fa mayor", "Do sostenido menor", "Re dórico".
- **FR-015**: Un cambio de tonalidad mientras suena MUST aplicar desde la siguiente vuelta, al sonido, al carril y a la línea de estado. Con la música detenida, aplica al siguiente Play.

**Biblioteca y medio compás (#31)**

- **FR-016**: El panel MUST permitir elegir la progresión, agrupada en Ciclos, Jazz y Pop, rock y latino, en ese orden y con el nombre de cada grupo a la vista, con el ii–V–I mayor por defecto. Cambiar de progresión MUST detener la práctica si está sonando o en la cuenta de entrada.
- **FR-017**: En 2/4, 4/4, 6/8 y 12/8, un compás con dos acordes MUST durar mitad y mitad (2/4: 1 + 1 tiempo; 4/4: 2 + 2; 6/8: 3 + 3 corcheas; 12/8: 6 + 6). En los demás compases MUST partirse en el límite entre grupos de acento más cercano a la mitad, con la primera parte igual o más larga: 3/4: 2 + 1 tiempos; 5/4: 3 + 2; 7/8: 4 + 3 corcheas (2 + 2 | 3); 9/8: 6 + 3. El carril MUST mostrar el compás partido en dos partes proporcionales, cada una con su cifrado, y "Ahora" cambia en el inicio de la segunda.
- **FR-018**: La biblioteca MUST traer estas progresiones, con estos compases (`|` separa compases; dos acordes entre barras comparten el compás; ×N repite el compás N veces):

  | Grupo              | Progresión                             | Escrita en | Compases                                                                     |
  | ------------------ | -------------------------------------- | ---------- | ---------------------------------------------------------------------------- |
  | Jazz               | ii–V–I mayor                           | Do mayor   | Dm7 \| G7 \| Cmaj7 \| Cmaj7                                                  |
  | Jazz               | ii–V–i menor                           | Do menor   | Dm7♭5 \| G7♭9 \| Cm6 \| Cm6                                                  |
  | Jazz               | I–vi–ii–V (turnaround)                 | Do mayor   | Cmaj7 A7 \| Dm7 G7                                                           |
  | Jazz               | iii–vi–ii–V                            | Do mayor   | Em7 A7 \| Dm7 G7                                                             |
  | Jazz               | Ciclo diatónico (tipo _Autumn Leaves_) | Do mayor   | Cmaj7 \| Fmaj7 \| Bm7♭5 \| Em7 \| Am7 \| Dm7 \| G7 \| Cmaj7                  |
  | Jazz               | Sustituto tritonal                     | Do mayor   | Dm7 \| D♭7 \| Cmaj7 \| Cmaj7                                                 |
  | Jazz               | ii–V "backdoor"                        | Do mayor   | Fm7 \| B♭7 \| Cmaj7 \| Cmaj7                                                 |
  | Jazz               | Blues de jazz                          | Do mayor   | C7 \| F7 \| C7 \| C7 \| F7 \| F7 \| C7 \| A7 \| Dm7 \| G7 \| C7 A7 \| Dm7 G7 |
  | Jazz               | Blues menor                            | Do menor   | Cm7 ×4 \| Fm7 ×2 \| Cm7 ×2 \| A♭7 \| G7 \| Cm7 \| G7                         |
  | Jazz               | Modal (tipo _So What_)                 | Re dórico  | Dm7 ×8                                                                       |
  | Jazz               | Coltrane (_Giant Steps_, avanzado)     | Do mayor   | Cmaj7 E♭7 \| A♭maj7 B7 \| Emaj7 G7 \| Cmaj7                                  |
  | Pop, rock y latino | I–V–vi–IV                              | Do mayor   | C \| G \| Am \| F                                                            |
  | Pop, rock y latino | vi–IV–I–V                              | Do mayor   | Am \| F \| C \| G                                                            |
  | Pop, rock y latino | I–vi–IV–V (doo-wop)                    | Do mayor   | C \| Am \| F \| G                                                            |
  | Pop, rock y latino | I–IV–V                                 | Do mayor   | C \| F \| G \| G                                                             |
  | Pop, rock y latino | Blues de rock                          | Do mayor   | C7 ×4 \| F7 ×2 \| C7 ×2 \| G7 \| F7 \| C7 \| G7                              |
  | Pop, rock y latino | Cadencia andaluza                      | La menor   | Am \| G \| F \| E                                                            |

  Todos sus acordes son tipos de la entrega 3 (FR-005).

**Ciclos (#32)**

- **FR-019**: El grupo Ciclos MUST traer estas progresiones, escritas desde Do:

  | Progresión                    | Compases                                                                                          |
  | ----------------------------- | ------------------------------------------------------------------------------------------------- |
  | Ciclo de cuartas              | C ×2 \| F ×2 \| B♭ ×2 \| E♭ ×2 \| A♭ ×2 \| D♭ ×2 \| G♭ ×2 \| B ×2 \| E ×2 \| A ×2 \| D ×2 \| G ×2 |
  | Ciclo de quintas              | C ×2 \| G ×2 \| D ×2 \| A ×2 \| E ×2 \| B ×2 \| F♯ ×2 \| D♭ ×2 \| A♭ ×2 \| E♭ ×2 \| B♭ ×2 \| F ×2 |
  | ii–V–I por las 12 tonalidades | Dm7 \| G7 \| Cmaj7 \| Cmaj7, y lo mismo en F, B♭, E♭, A♭, D♭, G♭, B, E, A, D y G (48 compases)    |
  | Dominantes encadenados        | E7 \| A7 \| D7 \| G7 \| Cmaj7 \| Cmaj7                                                            |

  Las raíces de los tres primeros se escriben siempre como en esta tabla (G♭ en las cuartas y en el ii–V–I por las 12, F♯ en las quintas), y cada ii–V–I con las alteraciones de su tonalidad (A♭m7 D♭7 G♭maj7; C♯m7 F♯7 Bmaj7).

- **FR-020**: En los tres primeros ciclos, la tonalidad elegida MUST ser el punto de partida y una vuelta el recorrido completo por las 12. Los dominantes encadenados se transportan como cualquier progresión de Do mayor.
- **FR-021**: En el ciclo de cuartas y el de quintas, que son solo raíces, con "bajo + acorde" el panel MUST mostrar el selector de tipo de acorde del modo aleatorio (entrega 3), y cada raíz suena y se ve con ese tipo; con "solo bajo", se ven las raíces. En las demás progresiones el selector MUST NOT aparecer, porque el tipo lo fija la progresión.

**Ajustes recordados**

- **FR-022**: La app MUST recordar en el dispositivo el modo, la progresión y la tonalidad, con las reglas de la entrega 2 (FR-030 a FR-034). Los ajustes guardados por la entrega 3 MUST conservarse: los nuevos toman su valor por defecto.

### Key Entities

- **Modo**: "aleatorio" o "progresión".
- **Progresión**: un nombre, un grupo (Ciclos, Jazz, Pop, rock y latino), una tonalidad de origen y una lista de compases. Cada compás tiene uno o dos acordes.
- **Acorde de la progresión**: una raíz escrita (con su grafía, como C♯ o G♭) más un tipo de la entrega 3, o solo una raíz en los ciclos de cuartas y quintas.
- **Tonalidad**: una tónica (12) y un tipo (mayor, menor o dórico, el de la progresión). Define la grafía de los acordes.
- **Vuelta**: en el modo progresión, la progresión entera una vez, en la tonalidad que regía cuando se armó.
- **Ajustes de práctica**: los de la entrega 3 más el modo, la progresión y la tonalidad.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: En el audio generado sin parlantes, el 100% de los cambios de acorde, incluidos los de mitad de compás, cae a menos de 1 ms de su momento teórico, en el bajo y en el acorde, y ninguno suena durante la cuenta de entrada ni después del final.
- **SC-002**: Para las 21 progresiones en las 12 tonalidades, el carril muestra exactamente los compases de FR-018 y FR-019 transportados, con la grafía de FR-013 y FR-019.
- **SC-003**: Un cambio de tonalidad aplica en la vuelta siguiente (o la posterior, si ya estaba armada) en el 100% de los casos, sin cortar la práctica; un cambio de modo o de progresión la detiene en el 100% de los casos.
- **SC-004**: En las progresiones con acordes de 4 notas o más, el 100% de los voicings cumple FR-007.
- **SC-005**: Tras una sesión con la guitarra, el usuario confirma que improvisó sobre al menos un ii–V–I en varias tonalidades y sobre un blues, que los cambios de medio compás se sienten a tiempo y que el carril le deja ver lo que viene sin tocar la pantalla.

## Assumptions

- Depende de la entrega 3 (#4), que ya está en `main`; esta rama parte de `main`.
- Fuera de alcance: las progresiones propias (entrega 5, #6) y el cambio automático de tonalidad cada N vueltas (entrega 6, #7).
- Las duraciones de FR-018 y FR-019 son del builder (diseño, sección 4.1). Siguen la forma estándar: un acorde por compás salvo donde la forma pide medio compás (turnarounds, final del blues de jazz, _Giant Steps_), y la tónica de los ii–V–I y sus variantes dura dos compases. El usuario las revisa en esta spec.
- En los ciclos de solo raíces, cada raíz dura 2 compases, como el valor por defecto de "compases por nota" del modo aleatorio (decisión del builder; el diseño no lo fija).
- El modal se escribe en Re dórico, no en Do: su tónica es la raíz del acorde, así que con la tónica Fa suena Fm7 (Fa dórico) y no Gm7. El diseño dice "la biblioteca está en Do"; esta es la única excepción además de la cadencia andaluza (decisión del builder).
- Con la tónica compartida (Clarifications), la tonalidad de origen de cada progresión define su tipo (mayor, menor o dórico) y desde dónde se transporta. La entrega 5 ("una progresión propia suena en la tonalidad en que se escribió hasta elegir otra") se resuelve en su spec, por ejemplo poniendo la tónica compartida en la de la progresión propia al elegirla.
- La enarmónica simple de FR-013 (Fm7♭5 en Fa♯ mayor, B7 en vez de C♭7) es decisión del builder: es la grafía que lee un guitarrista, y evita E♯, B♯, C♭, F♭ y dobles alteraciones, que aparecen al transportar progresiones cromáticas como _Giant Steps_.
- Con "solo bajo", el modo progresión muestra igual el cifrado de cada acorde (decisión del builder): es la armonía sobre la que se improvisa.
- El contador suma "compás 5 de 12" (decisión del builder), como el modo aleatorio suma "nota 5 de 12". La línea de estado nombra progresión y tonalidad, que la entrega 6 también necesita mostrar.
- El movimiento de voces (FR-007) quedó fuera de la entrega 3 para esta entrega. El algoritmo es del builder (diseño, sección 11); la spec fija solo la regla que se comprueba.
- El tipo de acorde de los ciclos de solo raíces es el mismo ajuste que el del modo aleatorio.
