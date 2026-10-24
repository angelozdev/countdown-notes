# Research: "Ya me sirve" (Entrega 1)

Fecha: 2026-10-24. Las versiones salen del registro de npm de ese día (`pnpm view <pkg> version`). El reloj de audio y el test de precisión se comprobaron en un spike desechable (scratchpad): Vitest 5.0.5 en modo navegador, con Tone.js 15.1.22, en Chromium y WebKit sin interfaz.

## 1. Dependencias nuevas (versión exacta)

- **Decision**:

  | Paquete                    | Versión | Tipo | Para qué                                                                              |
  | -------------------------- | ------- | ---- | ------------------------------------------------------------------------------------- |
  | tone                       | 15.1.22 | dep  | Reloj musical (`Transport`, `Draw`) y síntesis del metrónomo y el bajo                |
  | zustand                    | 5.0.16  | dep  | Estado de la práctica, que leen a la vez la UI y los callbacks del reloj              |
  | @vitest/browser-playwright | 5.0.5   | dev  | Correr el test de precisión en un navegador real (Web Audio no existe en jsdom)       |
  | playwright                 | 1.64.1  | dev  | Peer de `@vitest/browser-playwright`; la misma versión que ya trae `@playwright/test` |

  Componentes de shadcn que se agregan (`pnpm dlx shadcn@4.22.1 add`): `button`, `sheet` y `toggle`. Solo copian archivos a `src/components/ui/` y usan `radix-ui`, que ya está instalado.

- **Rationale**: `tone` y `zustand` están en el stack de la constitución. `@vitest/browser-playwright` y `playwright` quedan fuera de la lista, pero los aprobó el usuario el 2026-10-24 (ver §5). `tone@latest` es 15.1.22; la etiqueta `next` (15.5.x) no es estable.
- **No se agregan todavía** (YAGNI):
  - **tonal**: esta entrega solo usa 12 notas fijas, sin acordes ni transposición, así que basta una tabla (§8). Llega con los acordes (entrega 3) o con la tonalidad (entrega 4).
  - **zod**: no se guarda nada en el dispositivo. Llega con la persistencia (entrega 2).
  - **jest-dom**: `getByRole` acepta `pressed`, `name` y `hidden`, y `toHaveProperty('disabled', true)` cubre los botones deshabilitados.
- **Alternatives considered**: `tone@next` (descartado, no es estable).

## 2. Arquitectura: motor inyectado (aprobada por el usuario el 2026-10-24)

- **Decision**: una sola costura, en el borde del audio, que es lo único que no corre en jsdom.
  - **Motor** (`Engine`): solo sabe programar "este sonido en el tiempo b del compás n" con el reloj de Tone, y avisar a la UI cuando ese tiempo suena. No sabe de notas, vueltas ni ajustes. El contrato está en [contracts](./contracts/interfaces.md) §2.
  - **Store de la práctica** (Zustand): decide qué suena. Sortea las vueltas, maneja la cuenta de entrada, aplica los ajustes y guarda la posición que muestra la UI.
  - **`App`** recibe el motor por prop. `main.tsx` le pasa el motor real (`createToneEngine()`), y los tests de UI le pasan un motor falso que avanza tiempo por tiempo y registra lo que se le pide tocar.
- **Rationale**:
  - Los tests de UI prueban la conducta completa ("toco Play → cuenta 4, 3, 2, 1 → el bajo toca B♭2 en el tiempo 1") por la interfaz pública, sin simular la API de Tone (constitución I).
  - El motor real se prueba aparte, con audio renderizado (§4).
  - Tone.js no se importa en jsdom: solo lo importan `main.tsx` y el motor real.
- **Alternatives considered**:
  - `vi.mock('tone')`: menos archivos, pero los tests quedan atados a cómo se llama a Tone (descartado por el usuario).
  - Secuencia precalculada por vuelta en una `Tone.Part`: necesita la misma costura para los tests, y es más difícil reprogramarla al cambiar ajustes o al mostrar la vuelta siguiente (descartado por el usuario).

## 3. Reloj musical: un callback por tiempo

- **Decision**:
  - `transport.scheduleRepeat(callback, '4n', 0)`: un callback por tiempo (negra en 4/4), que Tone llama con anticipación (`lookAhead`, 0,1 s por defecto) y con el `time` exacto del audio.
  - En cada callback, el motor cuenta el tiempo (`compás = ⌊k / 4⌋`, `tiempo = k mod 4`), pide `soundsAt(compás, tiempo)` y dispara cada sonido en `time`.
  - Avisa a la UI con `getDraw().schedule(() => onBeat(compás, tiempo), time)`, que la llama en el cuadro de animación más cercano al momento en que el tiempo suena.
  - `setBpm` cambia `transport.bpm.value`. Como el intervalo `'4n'` está en ticks, el tiempo siguiente ya sale con el tempo nuevo.
  - `stop`: `transport.stop()`, `transport.cancel()`, `draw.cancel()` y soltar el bajo.
- **Rationale**: es el patrón que pide la constitución (III): todo evento se programa en el reloj de audio, con anticipación, y la UI sigue al audio. Al programar tiempo por tiempo, el store decide en el último momento (unos 100 ms antes) qué suena. Así los cambios de BPM y de ajustes no requieren reprogramar nada.
- **Spike**: con `soundsAt` fijo, a 200 BPM, en Chromium y en WebKit, los 20 clicks cayeron a menos de 1 ms de su momento teórico. Un cambio de 60 a 120 BPM al inicio del compás 2 pasó de 1 s a 0,5 s entre golpes, sin golpes dobles ni saltados.
- **Alternatives considered**: `scheduleRepeat` por compás, calculando los 4 tiempos en segundos (descartado: un cambio de BPM a mitad de compás dejaría los tiempos restantes con el tempo viejo).

## 4. Test de precisión: Vitest en modo navegador + `Tone.Offline`

- **Decision**:
  - Los tests `src/**/*.browser.test.ts` corren en un proyecto de Vitest aparte, `audio`, con `browser.provider = playwright()`, sin interfaz, en `chromium` y `webkit`.
  - Los tests de UI siguen en el proyecto `ui` (jsdom).
  - `pnpm test` corre los dos.
- **Cómo mide**:
  - Cada test crea el motor real dentro de `Tone.Offline(cb, segundos)` y lo arranca con un `soundsAt` de prueba.
  - Busca los inicios de cada sonido en el buffer: la primera muestra que supera un umbral después de un silencio.
  - Compara cada inicio con su momento teórico: el primer inicio más k × 60 / BPM.
- **Hallazgos del spike**:
  - **Anticipación**: dentro de `Tone.Offline`, el contexto tiene `lookAhead = 0`, y los eventos quedan cuantizados al bloque de render (128 muestras, ~2,9 ms). El error medido fue de 0 a 2,8 ms, en diente de sierra. Con `context.lookAhead = 0.1` dentro del callback de `Offline`, el error baja a menos de 1 ms. El tiempo real ya usa 0,1 s por defecto.
  - **Umbral del bajo**: el bajo (sierra con filtro pasabajos a 120 Hz) arranca suave, y con un umbral de 1e-3 el inicio se detecta ~1,5 ms tarde. Con 1e-5 queda por debajo de 1 ms. Los clicks usan 1e-3.
  - **Silencio entre ataques**: el bajo se sostiene casi el compás entero y su release se pisa con el ataque siguiente, así que entre ataques no hay silencio. El test usa un `soundsAt` que toca el bajo un compás sí y otro no, para que cada ataque se pueda detectar. La programación que se prueba es la misma.
- **Rationale**: es el criterio de la constitución (III) y del diseño (§10): el audio se renderiza sin parlantes y se mide el momento exacto de cada evento. WebKit es el motor del iPhone.
- **Alternatives considered**:
  - Una página de prueba solo de desarrollo, más un test de Playwright (descartado por el usuario: más plomería, y prueba a través de una página que la app no usa).
  - `node-web-audio-api` en Node (descartado: Tone usa `standardized-audio-context`, que busca las clases de audio del navegador; no se verificó).

## 5. Desbloqueo del audio y modo silencio del iPhone

- **Decision**: en `start`, antes de cualquier `await`:
  1. Si existe `navigator.audioSession`, poner `navigator.audioSession.type = 'playback'`.
  2. Llamar a `Tone.start()`.

  Las dos cosas corren dentro del mismo toque en Play, así que el primer Play desbloquea el audio (FR-002).

- **Rationale**:
  - iOS trata Web Audio como sonido "ambient", que obedece el interruptor de silencio. Con `audioSession.type = 'playback'`, Safari lo trata como reproducción y suena con el interruptor activado. Lo confirman un ingeniero de WebKit en Bugzilla y el blog de Jeremy Keith.
  - `'transient'` y `'transient-solo'` tuvieron problemas de salida muda en iOS 17 y 18, así que no se usan.
  - `navigator.audioSession` no está en los tipos del DOM de TypeScript: se declara un tipo mínimo en el motor.
  - Fuentes: [WebKit bug 237322](https://auto-bugs.webkit.org/show_bug.cgi?id=237322), [WebKit bug 264473](https://bugs.webkit.org/show_bug.cgi?id=264473), [Jeremy Keith: Web Audio API update on iOS](https://adactio.com/journal/19929).
- **Riesgo y plan B**: no hay documentación de Apple, así que la prueba real es manual, en el iPhone con el interruptor activado ([quickstart](./quickstart.md)). Si no suena, se agrega el truco conocido: un `<audio>` silencioso en loop que se inicia en el mismo toque (como [unmute](https://github.com/swevans/unmute)). Se registra aquí antes de implementarlo.
- **Alternatives considered**: el truco del `<audio>` desde el principio (descartado: más código para un problema que `audioSession` ya resuelve en iOS 17+).

## 6. Sonidos (diseño, Anexo A)

- **Decision**:
  - **Metrónomo**: `Synth` senoidal, envolvente `{ attack: 0.001, decay: 0.06, sustain: 0, release: 0.01 }`, en un bus `Volume(-8)`. Acento: 1760 Hz con velocidad 1. Otros tiempos: 1175 Hz con velocidad 0,55. Duración 0,05 s.
  - **Bajo**: `MonoSynth` Analógico cálido con los parámetros del Anexo A (volumen -4 dB), en un bus `Volume(0)`. Toca la raíz en la octava 2 (`'C2'` … `'B2'`) y dura el 90 % del compás, para que cada ataque se distinga (spec, Assumptions).
  - Los sintetizadores se crean en el primer `start` de cada motor, en el contexto activo. Así el test de precisión los crea dentro del contexto offline.
- **Rationale**: son los valores del prototipo que aprobó el usuario. El ajuste fino de los sonidos queda para la prueba de oído.

## 7. Sorteo de la vuelta

- **Decision**: `drawRound(pool, avoidFirst?)` mezcla las notas con Fisher–Yates (`Math.random`). Si la primera nota sale igual a `avoidFirst` (la última de la vuelta anterior), la intercambia con otra posición al azar distinta de la primera.
- **Rationale**: cumple FR-014 y FR-015 en una sola pasada, sin reintentos. El intercambio sesga un poco la distribución de la primera nota, lo que no importa para practicar. Con 2 notas, la vuelta queda forzada a alternarlas.
- **Cuándo se sortea**: la vuelta 1, al dar Play. La siguiente, cuando el reloj programa el primer compás de la última nota de la vuelta actual (aclaración del spec, FR-033). Se sortea con los ajustes de ese momento: notas y compases por nota. Si quedan menos de 2 notas incluidas, se usan las de la vuelta anterior (FR-024).
- **Alternatives considered**: volver a mezclar hasta que la primera sea distinta (descartado: número de pasos no acotado).

## 8. Notas: una tabla, sin tonal

- **Decision**: `src/music/notes.ts` exporta las 12 notas en orden cromático. Cada una tiene su `id` y altura para Tone (`'Db'`), su grafía (`'D♭'`), su nombre en español (`'Re bemol'`) y si es natural.
- **Rationale**: es todo lo que esta entrega necesita (FR-022, FR-025). La grafía de las negras la fija el diseño (D♭, E♭, F♯, A♭, B♭), así que no hay que calcularla.

## 9. Estado: un store de Zustand por `App`

- **Decision**:
  - `createPracticeStore(engine)` crea un store con `createStore` de `zustand/vanilla`. `App` lo crea una vez (`useState`) y lo entrega por contexto.
  - Los componentes lo leen con `usePractice(selector)`, que es `useStore` sobre el store del contexto.
  - Los callbacks del motor (`soundsAt`, `onBeat`) leen y escriben con `getState`/`setState`.
- **Rationale**:
  - Los callbacks del reloj viven fuera de React. Con `useState` leerían ajustes viejos (closures obsoletos). `getState` siempre lee el valor actual.
  - Un store por `App` aísla los tests entre sí, sin reiniciar estado global.
  - En la entrega 2, el middleware `persist` + zod se monta sobre el mismo store.
- **Alternatives considered**: `useReducer` + refs (descartado: más código para lo mismo); un store global de módulo (descartado: hay que reiniciarlo en cada test).

## 10. UI

- **Panel de ajustes**:
  - `Sheet` de shadcn con `side="bottom"` en todos los tamaños. En el computador se limita el ancho (`max-w-lg`, centrado). Así se cumple "en el celular sube desde abajo" sin detectar el dispositivo.
  - Es un diálogo (Radix). La música sigue sonando al abrirlo y cerrarlo, porque el panel no toca el motor.
- **BPM y compases por nota**: un componente `Stepper`, con botones − y + grandes y un campo numérico editable (`inputMode="numeric"`). El valor se limita al rango al confirmar (Enter o perder el foco); un valor inválido vuelve al anterior (FR-010).
- **Filtros**: 12 `Toggle` (`aria-pressed`) y 4 botones de atajo.
- **Progreso dentro del compás**:
  - En cada `onBeat`, la barra salta al ancho del tiempo que suena y anima hasta el siguiente con una transición CSS lineal que dura un tiempo (60 / BPM s).
  - Es solo interpolación visual: el reloj de audio la vuelve a sincronizar en cada tiempo, así que no programa nada musical (constitución III).
- **Desplazamiento del carril**: cuando cambia el compás actual, la fila actual se lleva a la vista con `scrollIntoView({ block: 'nearest', behavior: 'smooth' })`, con llamada opcional (`?.`) porque jsdom no la implementa.
- **Pulido visual**: con el skill `frontend-design`, dentro de la dirección del diseño (§7.4) y del tema de la entrega 0.

## 11. Tests de la entrega 0 que se reemplazan (aprobado por el usuario el 2026-10-24)

- **Decision**: la pantalla de práctica reemplaza la pantalla base, así que sus tests cambian:
  - `src/App.test.tsx` deja de buscar la frase de presentación y el Badge "En construcción", que desaparecen. Sigue buscando el `h1` "Countdown Notes", que queda oculto a la vista pero accesible (`sr-only`).
  - `e2e/base-screen.spec.ts` pasa a `e2e/practice.spec.ts`. Conserva las comprobaciones de `lang="es"`, del desplazamiento horizontal y del fondo oscuro aunque el sistema esté en modo claro. El ámbar se comprueba en el botón Play, en vez del Badge.
- **Rationale**: no es debilitar tests. Se reemplaza una pantalla que el spec de la entrega 0 ya marcaba como provisoria ("la entrega 1 la reemplaza"), y cada garantía de fondo sigue probada.

## 12. E2E con audio real

- **Decision**: `e2e/practice.spec.ts` usa el motor real en los dos proyectos (`chromium` e `iphone`/WebKit).
  - Pone el BPM en 240 desde el panel, para que la cuenta de entrada dure 1 s.
  - Toca Play, espera la cuenta regresiva en "Ahora" y luego una nota con su nombre.
  - Toca Stop y comprueba que vuelve a ofrecer Play.
  - El clic de Playwright cuenta como gesto del usuario, así que `Tone.start()` desbloquea el audio igual que en un navegador real.
- **Riesgo**: el audio en tiempo real en WebKit sin interfaz no se probó en el spike, que solo usó el contexto offline. Si falla, se registra aquí, y el E2E de WebKit comprueba solo hasta el Play.
