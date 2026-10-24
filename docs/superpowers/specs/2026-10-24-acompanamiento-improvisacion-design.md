# Countdown Notes v2: acompañamiento para improvisar

Fecha: 2026-10-24 · Estado: borrador para aprobación

## 1. Intención

La app existe para **improvisar con la guitarra sobre una nota que va cambiando**. Hoy solo muestra una nota aleatoria con una cuenta regresiva en segundos, sin sonido. El usuario practica una escala (la que esté estudiando ese día) sobre la nota que aparece, y le faltan tres cosas:

1. **Sonido**: que suene el bajo en la raíz, o el acorde, de la nota actual.
2. **Tempo**: un metrónomo con compás real, y que la nota cambie al ritmo (cada N compases), no cada X segundos.
3. **Progresiones**: un segundo modo donde se repite una progresión de acordes para practicar encima.

El usuario autorizó reconstruir todo y quiere una UI bonita con muy buena experiencia de uso.

### Contexto de uso

- Guitarra en las manos. El dispositivo está a 1–2 m, apoyado en un atril o una mesa. Puede ser el computador (navegador de escritorio) o el celular, que es un **iPhone** (Safari iOS).
- Mientras toca, las manos están ocupadas: la pantalla se mira, no se toca.
- Las sesiones son de práctica: se configura una vez, se le da Play y se toca varios minutos.

### Criterio de éxito (dicho por el usuario)

La primera vez que la pruebe con la guitarra, "ya me sirve" si tiene: **modo aleatorio + bajo + metrónomo + BPM**. Esa es la primera entrega (sección 8, entrega 1).

## 2. Objetivos, no objetivos y anti-objetivos

**Objetivos**

- Dos modos: **aleatorio** (una nota a la vez, sorteada) y **progresión** (loop de acordes).
- Bajo en la raíz con figura rítmica elegible; acordes opcionales con el vocabulario completo de jazz.
- Metrónomo preciso con los compases más comunes.
- Pantalla de práctica legible de lejos que muestra lo que viene.
- Biblioteca de progresiones comunes y progresiones propias guardadas en el dispositivo.
- Funciona igual en celular y computador; se puede instalar en la pantalla de inicio.

**No objetivos (por ahora)**

- Línea de bajo caminante (walking bass). El bajo toca solo la raíz.
- Acompañamiento rítmico de acordes (comping). El acorde suena al inicio del compás y se sostiene.
- Sonidos realistas o sampleados. El usuario pidió "un buen sonido, no un sonido real".
- Cuentas de usuario, nube, compartir progresiones.
- Grabar, MIDI, escuchar o analizar lo que toca el usuario.
- Mostrar la escala en pantalla _(mi decisión: el usuario elige mentalmente qué escala practica)_.
- Modo claro _(mi decisión: v1 es solo oscuro, ver 7.4)_.

**Anti-objetivos (aunque funcione, sería un fracaso)**

- Un metrónomo que se desfase, tiemble o se atrase cuando la pestaña o el celular están ocupados.
- Tener que tocar la pantalla mientras se toca la guitarra.
- Una pantalla de práctica llena de controles.
- Que en el celular el bajo no se oiga y no haya forma de arreglarlo.
- Que en el modo aleatorio la misma nota salga dos veces seguidas.

## 3. Modo aleatorio

- **Qué notas entran**: las 12, con los filtros de la app actual (incluir o excluir cada nota, todas las naturales, todas las alteradas). Mínimo 2 notas, porque con 1 no se puede evitar que salga la misma nota dos veces seguidas _(mi decisión)_.
- **Orden**: aleatorio, sin repetir hasta completar la vuelta (igual que hoy). Al pasar de una vuelta a otra, la primera nota de la nueva vuelta no puede ser igual a la última de la anterior _(mi decisión)_.
- **Cambio de nota**: cada N compases (configurable, 1–16, por defecto 2 _(mi decisión)_). Siempre en el tiempo 1.
- **Qué suena**: "solo bajo" o "bajo + acorde". Con acorde, todas las notas usan **el mismo tipo de acorde**, elegido de la lista de la sección 5.2 (por ejemplo, todas m7).
- **Duración**: hasta que el usuario le dé Stop, o hasta completar N vueltas si lo configura _(mi decisión: el "toca esto 100 veces" que pidió para las progresiones aplica también aquí)_.
- **Nombres de las notas negras**: se escriben con la grafía más común en jazz: D♭, E♭, F♯, A♭, B♭ _(mi decisión)_.

## 4. Modo progresión

- **Origen de la progresión**: la biblioteca de la sección 4.1 o una progresión propia (4.2).
- **Qué suena**: igual que en el modo aleatorio, "solo bajo" o "bajo + acorde" _(mi decisión)_.
- **Tonalidad de origen** _(mi decisión)_:
  - Cada progresión guarda la tonalidad en que está escrita. La biblioteca está en Do; la cadencia andaluza, en La menor.
  - Una progresión propia guarda la tonalidad en que la escribiste y suena así hasta que elijas otra.
- **Tonalidad**: la elige el usuario y transporta la progresión desde su tonalidad de origen. Opcionalmente, "cambiar de tonalidad cada N vueltas", **al azar** o **por cuartas** (C → F → B♭ → …) _(decisión mía que el usuario no objetó)_.
- **Duración de cada acorde** (el usuario pidió poder usar medio compás):
  - La unidad mínima es **medio compás**, así que caben dos acordes en un compás (`C7 A7 | Dm7 G7`).
  - Un acorde puede durar medio compás, uno o varios compases.
  - Medio compás existe en los compases que se parten en dos mitades iguales: 2/4, 4/4, 6/8 y 12/8. En 3/4, 5/4, 7/8 y 9/8, la unidad mínima es el compás entero _(mi decisión; el builder puede ampliarlo partiendo por grupos si sale natural)_.
- **Repetición**: en loop hasta Stop, o N vueltas.
- **El largo es variable**: 4, 8, 12 o más compases, ya no "4 o 6 acordes fijos".
- **Ciclos que recorren las 12 tonalidades** (ciclo de cuartas, ciclo de quintas, ii–V–I por las 12) _(mis decisiones)_:
  - La "tonalidad" elegida es el punto de partida.
  - Una vuelta es el recorrido completo.
  - El cambio automático de tonalidad no aplica, porque ya recorren las 12.
  - El selector de tipo de acorde solo aparece en las progresiones que son solo raíces.

### 4.1 Biblioteca de progresiones (aprobada por el usuario)

Escritas en Do; se transportan a la tonalidad elegida. Las duraciones exactas de cada una las define el builder siguiendo la forma estándar. Ahora que existe el medio compás, se usa donde la forma estándar lo pide (final del blues de jazz, turnarounds, _Giant Steps_). Los ejemplos de las tablas son simplificados.

**Ciclos (recorren las 12 tonalidades)**

| Progresión                    | Ejemplo en Do                                                    |
| ----------------------------- | ---------------------------------------------------------------- |
| Ciclo de cuartas              | C F B♭ E♭ A♭ D♭ G♭ B E A D G                                     |
| Ciclo de quintas              | C G D A E B F♯ D♭ A♭ E♭ B♭ F                                     |
| ii–V–I por las 12 tonalidades | Dm7 G7 Cmaj7 Cmaj7 → Gm7 C7 Fmaj7 Fmaj7 → … (avanza por cuartas) |
| Dominantes encadenados        | E7 A7 D7 G7 Cmaj7                                                |

En los dos primeros ciclos solo hay raíces: el tipo de acorde lo elige el usuario, como en el modo aleatorio _(mi decisión)_.

Corrección respecto a lo que se habló en el chat: el ejemplo del ii–V–I que mostré bajaba por tonos (C → B♭ → …), y así solo se recorren 6 tonalidades. Por cuartas se recorren las 12.

**Jazz**

| Progresión                             | Ejemplo en Do                                        |
| -------------------------------------- | ---------------------------------------------------- |
| ii–V–I mayor                           | Dm7 G7 Cmaj7 Cmaj7                                   |
| ii–V–i menor                           | Dm7♭5 G7♭9 Cm6 Cm6                                   |
| I–vi–ii–V (turnaround)                 | Cmaj7 A7 Dm7 G7                                      |
| iii–vi–ii–V                            | Em7 A7 Dm7 G7                                        |
| Ciclo diatónico (tipo _Autumn Leaves_) | Cmaj7 Fmaj7 Bm7♭5 Em7 Am7 Dm7 G7 Cmaj7               |
| Sustituto tritonal                     | Dm7 D♭7 Cmaj7                                        |
| ii–V "backdoor"                        | Fm7 B♭7 Cmaj7                                        |
| Blues de jazz (12 compases)            | C7 F7 C7 C7 · F7 F7 C7 A7 · Dm7 G7 C7 G7             |
| Blues menor (12 compases)              | Cm7 ×4 · Fm7 ×2 · Cm7 ×2 · A♭7 G7 Cm7 G7             |
| Modal (tipo _So What_)                 | Dm7 sostenido varios compases, para practicar dórico |
| Coltrane (_Giant Steps_, avanzado)     | Cmaj7 E♭7 A♭maj7 B7 Emaj7 G7 Cmaj7                   |

**Pop, rock y latino**

| Progresión                  | Ejemplo                             |
| --------------------------- | ----------------------------------- |
| I–V–vi–IV                   | C G Am F                            |
| vi–IV–I–V                   | Am F C G                            |
| I–vi–IV–V (doo-wop)         | C Am F G                            |
| I–IV–V                      | C F G G                             |
| Blues de rock (12 compases) | C7 ×4 · F7 ×2 · C7 ×2 · G7 F7 C7 G7 |
| Cadencia andaluza           | Am G F E                            |

### 4.2 Progresiones propias (aprobado por el usuario)

Hay dos formas de armarlas, y las dos llenan el mismo carril:

- **Tocando**: tocas un compás del carril, eliges la raíz (12 botones) y el tipo de acorde (agrupados por familias).
- **Escribiendo**: escribes texto como `Dm7 G7 Cmaj7 Cmaj7` y se llena el carril, con un acorde por compás. Si un acorde no se reconoce, se marca el error en el texto y no se guarda _(mi decisión)_.

Para que un acorde dure más, lo repites o le cambias la duración. Para poner dos acordes en un compás:

- **Tocando**: partes el compás en dos mitades.
- **Escribiendo**: la sintaxis exacta la decide el builder. Mi sugerencia es separar compases con `|` y repartir en partes iguales los acordes que caigan dentro: `Cmaj7 | C7 A7 | Dm7 G7`. Las progresiones se guardan en el dispositivo con nombre, y se pueden renombrar y borrar _(mi decisión: renombrar y borrar)_.

## 5. Sonido

### 5.1 Estilos

El usuario escuchó cuatro estilos en un prototipo y eligió dos: **Analógico cálido** y **Pad ambiental**. El estilo aplica al bajo y al acorde juntos. Los parámetros de partida están en el Anexo A; se afinan cuando ya estén dentro de la app.

### 5.2 Tipos de acorde (aprobados por el usuario: "todos los más normales para jazz")

| Familia              | Acordes (sobre Do)                                |
| -------------------- | ------------------------------------------------- |
| Tríadas              | C, Cm, Cdim, Caug, Csus4, Csus2                   |
| Sextas               | C6, Cm6, C6/9                                     |
| Séptimas             | Cmaj7, Cm7, C7, Cm7♭5 (Cø), C°7, Cm(maj7), C7sus4 |
| Extensiones          | Cmaj9, Cm9, C9, Cm11, C13                         |
| Dominantes alterados | C7♭9, C7♯9, C7♯11, C7alt                          |

El selector los muestra agrupados por estas familias.

### 5.3 Voicings

- **Tríadas**: voicing abierto, con raíz y quinta en la octava 3 y la tercera en la octava 4 (como en el prototipo).
- **Acordes de 4 notas o más**: voicings de jazz que omiten la raíz cuando el bajo ya la toca.
- **Registro**: el acorde se mantiene aproximadamente entre C3 y C5 _(mi decisión)_.
- **Movimiento de voces**: que en las progresiones los voicings se muevan poco entre acordes es deseable; el algoritmo lo decide el builder.

### 5.4 Bajo

- **Qué toca**: solo la raíz.
- **Figura rítmica a elegir**: corcheas, negras, blancas o redondas.
- **Cambio de acorde**: el bajo siempre ataca la raíz nueva cuando cambia el acorde, aunque la figura elegida no caiga en ese tiempo (por ejemplo, redondas con un cambio a mitad de compás) _(mi decisión)_.
- **Acorde de varios compases**: el acorde vuelve a atacar al inicio de cada compás, igual que el bajo _(mi decisión)_.
- **Octava a elegir**: 1, 2 o 3; por defecto 2 _(mi decisión)_. Existe porque los parlantes del celular casi no reproducen frecuencias por debajo de ~100 Hz.

### 5.5 Metrónomo

- Acento en el tiempo 1.
- Cuenta de entrada de 1 compás antes de que empiece la música.
- Se puede apagar.

### 5.6 Volumen

Separado para bajo, acorde y metrónomo, con opción de silenciar cada uno.

## 6. Tempo y compás

- **BPM**: configurable de 30 a 240 _(mi decisión)_; por defecto 60.
- **Qué cuenta el BPM** _(mi decisión, siguiendo la convención musical)_:
  - En 2/4, 3/4, 4/4 y 5/4, la negra.
  - En 6/8, 9/8 y 12/8, la negra con puntillo.
  - En 7/8, la corchea.
- **Compases**: 2/4, 3/4, 4/4, 5/4, 6/8, 7/8, 9/8 y 12/8.
  - En 6/8, 9/8 y 12/8 el metrónomo marca cada corchea, agrupadas de a tres: acento fuerte en el 1 y acento suave al inicio de cada grupo _(mi decisión)_.
  - En 7/8 agrupa 2+2+3 _(mi decisión)_.
  - Qué significa cada figura del bajo en compases compuestos (por ejemplo, si "negras" en 6/8 se vuelve negra con puntillo) lo decide el builder.
- **Cambios mientras suena** _(mis decisiones)_:
  - El BPM y el volumen cambian de inmediato.
  - Los ajustes de sonido (figura, tipo de acorde, estilo, octava) aplican desde el siguiente compás.
  - Los ajustes de estructura (compás, compases por nota, filtros de notas, tonalidad) aplican desde la siguiente vuelta.
  - Cambiar de modo o de progresión detiene la reproducción.

## 7. Pantallas

### 7.1 Pantalla de práctica: "carril de compases" (elegida por el usuario entre tres bocetos)

- **Arriba, en pequeño**: el modo, el estilo de sonido y el tempo/compás.
- **"Ahora"**: el acorde actual, lo más grande posible (el usuario también miró el boceto con la nota gigante), con su nombre en español debajo ("Fa menor séptima"). Durante la cuenta de entrada, esta zona muestra la cuenta regresiva.
- **Carril**:
  - Los compases que vienen, en filas de 4.
  - El compás actual resaltado, con una barra que avanza y una marca por cada tiempo.
  - Un compás con dos acordes se muestra partido en dos mitades.
  - Los compases ya tocados o lejanos se ven atenuados.
- **Qué muestra el carril**:
  - En el modo progresión, la progresión completa.
  - En el modo aleatorio, la vuelta completa: el orden se sortea al empezar la vuelta, así que se puede ver todo lo que viene.
- **Abajo**:
  - Contador ("Vuelta 2 · nota 5 de 12", o "Vuelta 3 de 100").
  - Play/Stop grande en el centro.
  - Acceso a ajustes y control rápido de tempo.
- **Mientras suena**:
  - La pantalla no se apaga (Wake Lock).
  - En el computador, la barra espaciadora hace play/stop.
- **Nunca** se llena de controles. Todo lo demás vive en ajustes.

### 7.2 Ajustes

Un panel aparte (en el celular, un panel que sube desde abajo _(mi decisión)_) con:

- modo;
- notas (filtros) o progresión + tonalidad;
- qué suena y tipo de acorde;
- estilo;
- BPM, compás y compases por nota;
- figura y octava del bajo;
- cuenta de entrada y metrónomo;
- volúmenes;
- repeticiones;
- cambio de tonalidad.

### 7.3 Idioma y notación

- La interfaz está en español.
- Los acordes se escriben con cifrado americano (C, Dm7, B♭maj7) y llevan su nombre en español debajo, en la pantalla de práctica.

### 7.4 Estilo visual _(mi decisión, para que la revises)_

- Oscuro, tipo escenario, como los bocetos: fondo casi negro, texto claro, acento ámbar (#f5a524), tipografía grande y de mucho peso para el acorde actual.
- Botones grandes, fáciles de tocar.
- El pulido visual lo hace el builder con criterio de diseño (skill `frontend-design`), respetando esta dirección.

### 7.5 Persistencia

La app recuerda la última configuración y las progresiones propias en el dispositivo (sin cuenta ni nube). Los datos guardados se validan al cargarlos; si son inválidos o de una versión vieja, se descartan sin romper la app (se vuelve a los valores por defecto).

## 8. Entregas (en este orden)

Cada entrega es una conducta visible, de punta a punta, que el usuario puede probar con la guitarra.

**El backlog lo maneja GitHub Issues**, en el repo `angelozdev/countdown-notes`:

- Las entregas son los issues #1–#9, con la etiqueta `entrega`.
- Sus tareas son sub-issues, con la etiqueta `tarea` (#10–#43).

Esta tabla es la foto inicial; la fuente de verdad es GitHub. Las reglas están en la sección Backlog de `.specify/memory/constitution.md`.

| #   | Entrega                                                                 | Qué puede hacer el usuario al terminarla                                                                                                                                                                                                                                                                              |
| --- | ----------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0   | **Base nueva** (excepción: preparación compartida, no es una conducta)  | Abrir la app reconstruida con el stack nuevo, con lint, formato y tests corriendo, y abrirla desde el iPhone en Vercel.                                                                                                                                                                                               |
| 1   | **"Ya me sirve"**: aleatorio + bajo + metrónomo + BPM                   | Elegir notas (filtros), BPM y compases por nota; dar Play y oír la cuenta de entrada, el metrónomo con acento y el bajo en la raíz (una vez por compás, estilo Analógico cálido), mientras el carril muestra la vuelta y avanza. Compás fijo 4/4. Suena en el iPhone aunque el interruptor de silencio esté activado. |
| 2   | **Práctica cómoda**                                                     | Elegir cualquier compás de la lista, la figura y la octava del bajo, apagar el metrónomo, ajustar el volumen de cada canal, parar tras N vueltas. La pantalla no se apaga, la barra espaciadora funciona y los ajustes se recuerdan.                                                                                  |
| 3   | **Acordes en modo aleatorio**                                           | Elegir "bajo + acorde" y cualquier tipo de la lista, oír los voicings, y elegir entre los dos estilos de sonido.                                                                                                                                                                                                      |
| 4   | **Modo progresión con biblioteca**                                      | Elegir una progresión de la biblioteca y una tonalidad, y tocar encima en loop o N vueltas, con la progresión completa en el carril, incluidos los compases con dos acordes.                                                                                                                                          |
| 5   | **Progresiones propias**                                                | Armar una progresión tocando o escribiendo, con duraciones (incluido medio compás), y guardarla, renombrarla y borrarla.                                                                                                                                                                                              |
| 6   | **Cambio automático de tonalidad**                                      | Activar "cambiar de tonalidad cada N vueltas", al azar o por cuartas.                                                                                                                                                                                                                                                 |
| 7   | **Instalable y sin internet**                                           | Instalar la app en el iPhone (con una indicación de "Agregar a pantalla de inicio", porque iOS no muestra un aviso para instalar) y usarla sin conexión.                                                                                                                                                              |
| 8   | **Audio en segundo plano** (deseable, no obligatorio; última prioridad) | Cambiar a otra app o bloquear el iPhone y que la música siga sonando; al volver, la pantalla se sincroniza con lo que suena. Si en iOS resulta demasiado frágil, se documenta y se deja fuera.                                                                                                                        |

## 9. Cómo se construye (decidido por el usuario)

- **Reconstruir desde cero en el mismo repo**, con **pnpm** (lo que ya usa).
- **Publicación**: en **Vercel**, **solo archivos estáticos** (sin funciones de servidor). Es una SPA servida en la raíz (`/`) con HTTPS. El usuario conecta el repo a Vercel; el builder deja la configuración lista, pero no hace push (regla del usuario).
- **Últimas versiones estables** de todo lo que ya hay: React, TypeScript, Vite, Tailwind CSS (v4) y Zustand.
- **Se agregan**: Tone.js (audio y reloj musical), tonal (teoría musical: leer cifrados, transportar, convertir grados en acordes, escribir bien las alteraciones), shadcn/ui (componentes sobre Radix + Tailwind), vite-plugin-pwa, Vitest, Testing Library con user-event, Playwright, oxlint y oxfmt.
- **zod**: el usuario lo pidió "si es necesario". _Mi decisión: sí_, para validar los datos guardados en el dispositivo (7.5) y, si sirve, la entrada de texto de progresiones.
- **Se eliminan**: `react-countdown-circle-timer`, `classnames` y Prettier (lo reemplaza oxfmt).
- **Formato** _(mi decisión)_: oxfmt conserva el estilo actual del `.prettierrc.json`: comillas simples, sin punto y coma, sin coma final, indentación de 2.
- **Flujo de trabajo**: los planes se arman con **Spec Kit** (constitution → specify → plan → tasks), con una feature por entrega. Cada feature parte del issue de su entrega en GitHub, y sus sub-issues son las historias de usuario. Este documento queda como referencia de diseño.
- **Reglas del usuario para implementar**:
  - Test-first en pasos pequeños.
  - Probar la conducta por la interfaz pública (UI o API exportada), no los detalles internos.
  - Nunca debilitar, saltar ni borrar un test para que pase.
  - Commits en la rama de la feature después de cada paso en verde; nunca en `main` y nunca push.

## 10. Restricciones técnicas y riesgos conocidos

- **Dispositivos objetivo**:
  - Navegador de escritorio actual (Chrome o Safari).
  - iPhone con Safari iOS reciente, tanto en el navegador como instalada en la pantalla de inicio. _Mi decisión_: iOS 17 o superior, que es donde existe `navigator.audioSession`. Android no es objetivo, aunque debería funcionar.
- **Precisión del tiempo** (anti-objetivo principal):
  - El audio se programa con el reloj de Tone.js (`Transport`, con anticipación), nunca con `setTimeout` ni `setInterval`.
  - La UI se sincroniza con lo que suena (`Tone.Draw` o equivalente).
  - **Criterio para dar por buena la precisión** _(mi decisión)_: un test que renderiza el audio sin parlantes (`Tone.Offline` o equivalente) y comprueba que cada evento cae en su momento exacto, más una prueba de oído de 10 minutos a 60 y a 200 BPM en el iPhone y en el computador.
- **Wake Lock en iOS**: con la app instalada en la pantalla de inicio, en versiones anteriores a iOS 18.4 fallaba. El builder verifica y, si hace falta, usa una alternativa.
- **Desbloqueo de audio**: los navegadores exigen un gesto del usuario. El primer Play inicia el contexto de audio.
- **iOS en silencio**: con el interruptor de silencio activado, iOS calla Web Audio. Donde exista, se usa `navigator.audioSession.type = 'playback'`; el builder verifica qué más hace falta en Safari iOS.
- **Graves en el celular**: el bajo necesita armónicos (no una senoide pura) y la opción de octava.
- **Testabilidad del audio**: los tests no pueden "escuchar".
  - Recomendación: separar la parte que decide qué suena y cuándo (secuencia de eventos por compás y tiempo) del motor que produce el sonido, y probarla por su API exportada y por la UI con un motor falso que registra los eventos.
  - El motor real con Tone.js se verifica con pruebas de humo en Playwright y de oído.
- **Escritura de alteraciones**: en el modo progresión, los acordes se escriben según la tonalidad (B♭ en Fa mayor, A♯ en Si mayor). tonal resuelve esto.

## 11. Lo que queda en manos del builder

- La arquitectura, la estructura de carpetas y la separación en módulos (respetando la recomendación de testabilidad).
- El algoritmo de voicings y de movimiento de voces.
- Las duraciones exactas de cada progresión de la biblioteca.
- Las figuras del bajo en compases compuestos.
- El ajuste fino de los sonidos a partir del Anexo A.
- El pulido visual, dentro de la dirección de 7.4.
- Los textos exactos de la UI.

## 12. Decisiones que tomé yo (revísalas)

Todas están marcadas _(mi decisión)_ en el texto. Las más relevantes:

1. Solo tema oscuro en v1, con acento ámbar.
2. zod se incluye, para validar los datos guardados.
3. oxfmt conserva el estilo actual de Prettier.
4. Las repeticiones ("N vueltas") aplican también al modo aleatorio.
5. Ciclos: los de cuartas y quintas usan el tipo de acorde que elige el usuario. La tonalidad es el punto de partida, una vuelta es el recorrido completo y no tienen cambio automático de tonalidad.
6. La primera entrega usa el estilo Analógico cálido, el bajo una vez por compás y compás fijo 4/4.
7. Cambios en vivo:
   - El BPM y el volumen cambian de inmediato.
   - El sonido cambia desde el siguiente compás.
   - La estructura cambia desde la siguiente vuelta.
   - Cambiar de modo detiene la reproducción.
8. Grafía de las notas negras en el modo aleatorio: D♭, E♭, F♯, A♭, B♭.
9. Corrección del ejemplo del ii–V–I: recorre las 12 tonalidades por cuartas.
10. Qué cuenta el BPM: la negra con puntillo en 6/8, 9/8 y 12/8, y la corchea en 7/8.
11. Medio compás solo en 2/4, 4/4, 6/8 y 12/8.
12. El bajo ataca en cada cambio de acorde, y el acorde se vuelve a atacar en cada compás.
13. Cada progresión guarda su tonalidad de origen; las propias suenan como las escribiste.
14. En el modo progresión también se elige entre "solo bajo" y "bajo + acorde".
15. Mínimo 2 notas en el modo aleatorio.
16. Objetivo iOS 17 o superior.
17. Criterio de precisión: test con audio renderizado sin parlantes, más prueba de oído de 10 minutos.

## Anexo A: parámetros de partida de los sonidos elegidos (Tone.js 14, del prototipo)

```js
// Buses: bajo 0 dB, acorde -4 dB, metrónomo -8 dB (Tone.Volume → destination)

// Analógico cálido
bass = new Tone.MonoSynth({
  oscillator: { type: 'sawtooth' },
  filter: { type: 'lowpass', Q: 3, rolloff: -24 },
  envelope: { attack: 0.005, decay: 0.2, sustain: 0.8, release: 0.3 },
  filterEnvelope: {
    attack: 0.005,
    decay: 0.3,
    sustain: 0.3,
    release: 0.3,
    baseFrequency: 120,
    octaves: 3.2
  }
}) // volume -4 dB
// acorde: PolySynth(Synth) → Filter(1400 Hz lowpass) → Chorus → Reverb → bus
chordReverb = new Tone.Reverb({ decay: 2.5, wet: 0.3 })
chordChorus = new Tone.Chorus({
  frequency: 0.8,
  delayTime: 3.5,
  depth: 0.6,
  wet: 0.5
}).start()
chordFilter = new Tone.Filter(1400, 'lowpass')
chord = new Tone.PolySynth(Tone.Synth, {
  oscillator: { type: 'fatsawtooth', count: 3, spread: 20 },
  envelope: { attack: 0.04, decay: 0.6, sustain: 0.5, release: 1.5 }
}) // volume -18 dB

// Pad ambiental
bass = new Tone.MonoSynth({
  oscillator: { type: 'triangle' },
  filter: { type: 'lowpass', Q: 0.5 },
  envelope: { attack: 0.15, decay: 0.5, sustain: 0.9, release: 1.5 },
  filterEnvelope: {
    attack: 0.2,
    decay: 0.5,
    sustain: 1,
    release: 1.5,
    baseFrequency: 300,
    octaves: 1
  }
})
chordReverb = new Tone.Reverb({ decay: 6, wet: 0.5 })
chordChorus = new Tone.Chorus({
  frequency: 0.4,
  delayTime: 4,
  depth: 0.8,
  wet: 0.6
}).start()
chordFilter = new Tone.Filter(1100, 'lowpass')
chord = new Tone.PolySynth(Tone.Synth, {
  oscillator: { type: 'fattriangle', count: 3, spread: 30 },
  envelope: { attack: 0.8, decay: 1, sustain: 0.8, release: 3 }
}) // volume -10 dB

// Metrónomo: Synth senoidal, envolvente { attack: 0.001, decay: 0.06, sustain: 0, release: 0.01 },
// 1760 Hz con velocidad 1 en el acento, 1175 Hz con velocidad 0.55 en los demás tiempos, duración 0.05 s.
```

El prototipo completo (desechable) está en el scratchpad de la sesión y puede desaparecer. Los valores de arriba son la referencia.
