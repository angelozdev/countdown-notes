# Research: Práctica cómoda (Entrega 2)

Fecha: 2026-10-24. Las versiones salen del registro de npm de ese día (`pnpm view <pkg> version`). La programación por compás se comprobó en un spike desechable (scratchpad): Vitest 5.0.5 en modo navegador, con Tone.js 15.1.22, en Chromium y WebKit sin interfaz.

## 1. Dependencias nuevas (versión exacta)

- **Decision**:

  | Paquete | Versión | Tipo | Para qué                                            |
  | ------- | ------- | ---- | --------------------------------------------------- |
  | zod     | 4.6.7   | dep  | Validar los ajustes guardados al cargarlos (FR-031) |

  Componentes de shadcn que se agregan (`pnpm dlx shadcn@4.22.1 add`): `slider` (volúmenes), `switch` ("parar tras N vueltas") y `toggle-group` (compás, figura y octava). Usan `radix-ui`, que ya está instalado.

- **Rationale**: zod está en el stack de la constitución, que exige validar con zod lo guardado (principio V). Los componentes de shadcn también están en el stack.
- **No se agregan** (YAGNI):
  - **tonal**: sigue sin acordes ni transposición. Llega con la entrega 3 o la 4.
  - **El middleware `persist` de Zustand**: ver §9.
  - **Una librería de Wake Lock**: la API del navegador alcanza (§10).

## 2. Contrato del motor: plan por compás (aprobado por el usuario el 2026-10-24)

- **Problema**: el motor de la entrega 1 programa un golpe de negra fijo (`scheduleRepeat(cb, '4n')`) y calcula el compás con `beatsPerBar` fijo. Con los 8 compases, el largo del golpe cambia (negra o corchea) y el compás puede cambiar entre vueltas.
- **Decision**: el store entrega cada compás completo y el motor solo toca eventos en su momento.
  - `barAt(bar)` devuelve un `Bar`: cuántos golpes de metrónomo tiene, cuánto dura cada golpe en unidades del BPM (1, o 1/3 en 6/8, 9/8 y 12/8), si es la cuenta de entrada y la lista de eventos `{ at, sound }`. `at` va en golpes desde el inicio del compás y puede ser fraccionario (0,5 = la corchea de en medio en los simples).
  - `barAt` devuelve `undefined` cuando la práctica termina ahí (N vueltas, §7).
  - El contrato completo está en [contracts](./contracts/interfaces.md) §2.
- **Cómo programa el motor**:
  - El `Transport` corre con `bpm` = el BPM de la app. Así, la negra del Transport es "lo que cuenta el BPM" en cualquier compás, y no hace falta convertir el tempo al cambiar de compás.
  - Un golpe dura `ticksPorGolpe = round(PPQ × beatLength)` ticks: 192 o 64, con el PPQ de 192 por defecto.
  - Cada compás es un `transport.scheduleOnce(cb, '{tick}i')`. En el callback:
    1. pide `barAt(bar)`;
    2. toca en `time` los eventos de `at = 0`;
    3. programa los demás con `scheduleOnce` en `tickDelCompás + round(at × ticksPorGolpe)`;
    4. programa el compás siguiente en `tickDelCompás + beats × ticksPorGolpe`.
  - `onBeat(bar, beat)` se llama con `draw.schedule` en cada golpe entero (cada click). Los eventos fraccionarios no avisan a la UI.
- **Rationale**:
  - El compás es un dato. El store lo arma con una función sin efectos (ajustes y vuelta → `Bar`), que se prueba sin motor. El motor no sabe de compases, figuras ni notas.
  - "Figura y octava desde el siguiente compás" (FR-015) sale sola: cada compás se arma una vez, al programarlo.
  - Lo que viene entra como eventos o campos nuevos, sin cambiar el contrato: el acorde que vuelve a atacar en cada compás (entrega 3), el cambio de acorde a mitad de compás y el ataque del bajo en ese cambio (entrega 4).
  - Los eventos están en ticks del `Transport`, no en segundos. Por eso un cambio de BPM a mitad de compás también mueve los eventos ya programados.
- **Spike** (Chromium y WebKit):
  - 12/8 a 240 BPM, con un golpe cada 83 ms (menos que la anticipación de 0,1 s): los 36 golpes de 3 compases cayeron a menos de 1 ms de su momento teórico.
  - 4/4 → 6/8 → 7/8 a 60 BPM, con eventos en `at = 0.5` en el 4/4: los 21 golpes a menos de 1 ms.
  - Cambio de 60 a 120 BPM a mitad de compás, con los golpes ya programados por `scheduleOnce`: intervalos de 1 s y después 0,5 s (± 1 ms), sin golpes dobles ni saltados.
  - Programar con `scheduleOnce` un tick futuro desde dentro de un callback del `Transport` funciona aunque ese tick caiga dentro de la ventana de anticipación, porque el `Transport` recorre su línea de tiempo tick por tick.
- **Alternatives considered**:
  - Golpe a golpe más la forma del compás: `soundsAt(bar, beat)` más `barAt(bar) → { beats, beatLength }`. Son dos callbacks por compás, y la regla de "desde el siguiente compás" queda en el store (descartado por el usuario).
  - Rejilla fija de 6 pasos por unidad de BPM: el motor queda más simple, pero el store tiene que llevar la cuenta de los pasos, y hay 24 callbacks por segundo a 240 BPM, casi todos vacíos (descartado por el usuario).

## 3. Tests de la entrega 1 que se traducen (aprobado por el usuario el 2026-10-24)

- **Decision**: el contrato nuevo cambia la forma de dos datos, así que los tests de la entrega 1 se traducen sin cambiar lo que comprueban:
  - **Acento**: `accent: true` → `'strong'` y `accent: false` → `'none'`. Es en `src/App.test.tsx` y en `src/audio/tone-engine.browser.test.ts`.
  - **Arranque del motor**: `engine.start({ bpm, beatsPerBar: 4, soundsAt, onBeat })` → `engine.start({ bpm, mix, barAt, onBeat, onEnd })` en `tone-engine.browser.test.ts`. El `soundsAt` de prueba pasa a ser un `barAt` que arma el mismo 4/4.
  - `src/test/fake-engine.ts` y `src/test/app.tsx` son ayudas de test: se reescriben para el contrato nuevo. `fake.beat(n)` sigue avanzando n golpes, y `played` sigue teniendo `{ bar, beat, sound }`, donde `beat` es el `at` del evento. En 4/4 con redondas (los valores por defecto), la secuencia es idéntica a la de la entrega 1.
- **Rationale**: no es debilitar tests. Cada test traducido comprueba la misma conducta (los mismos golpes, acentos, tiempos y alturas) con el vocabulario del contrato nuevo. Los demás tests de UI (`bpm`, `random-mode`, `note-filters`, `lane`) no cambian.

## 4. Compases

- **Decision**: una tabla fija en `src/music/meters.ts`.

  | Compás | Golpes | Golpe (en unidades del BPM) | Grupos de acento (golpes) | Acento suave | BPM cuenta         |
  | ------ | ------ | --------------------------- | ------------------------- | ------------ | ------------------ |
  | 2/4    | 2      | 1                           | 1+1                       | no           | negra              |
  | 3/4    | 3      | 1                           | 1+1+1                     | no           | negra              |
  | 4/4    | 4      | 1                           | 1+1+1+1                   | no           | negra              |
  | 5/4    | 5      | 1                           | 1+1+1+1+1                 | no           | negra              |
  | 6/8    | 6      | 1/3                         | 3+3                       | sí           | negra con puntillo |
  | 9/8    | 9      | 1/3                         | 3+3+3                     | sí           | negra con puntillo |
  | 12/8   | 12     | 1/3                         | 3+3+3+3                   | sí           | negra con puntillo |
  | 7/8    | 7      | 1                           | 2+2+3                     | sí           | corchea            |
  - El acento de cada golpe sale de los grupos: el primer golpe del compás es `'strong'`. El primero de cada otro grupo es `'soft'` si el compás tiene acento suave y `'none'` si no. El resto es `'none'` (FR-003 a FR-005).
  - La cuenta regresiva y las marcas del carril van por grupo (aclaración del spec, FR-007 y FR-008). La cuenta muestra `grupos − índice del grupo del golpe`, y en el carril se ilumina la marca del grupo del golpe.
  - La corchea dura medio golpe en los simples y un golpe en 6/8, 9/8, 12/8 y 7/8. La usa la figura del bajo (§5).
  - La cuenta de entrada es un compás del compás vigente al dar Play, con `countIn: true`.

- **Rationale**: son 8 entradas fijas, y una tabla es más clara que calcular el agrupamiento.
- **Sonido del acento suave**: un tercer click, entre los dos de la entrega 1: 1480 Hz con velocidad 0,8. El fuerte es 1760 Hz con velocidad 1, y el sin acento, 1175 Hz con velocidad 0,55 (FR-006). Se afina en la prueba de oído.

## 5. Figura y octava del bajo

- **Decision**: `bassAttacks(meter, figure)` (en `src/music/meters.ts`) devuelve los ataques del compás como `{ at, length }` en golpes. Es una función sin efectos con una regla por figura:

  | Figura   | Ataques                                                               |
  | -------- | --------------------------------------------------------------------- |
  | Corcheas | Cada corchea: cada 0,5 golpe en los simples y cada golpe en los demás |
  | Negras   | El inicio de cada grupo de acento                                     |
  | Blancas  | El inicio de los grupos 1, 3, 5…: uno sí y uno no, desde el primero   |
  | Redondas | Solo el inicio del compás                                             |
  - Sale exactamente la tabla de FR-013. Por ejemplo, blancas: 4/4 → golpes 0 y 2; 3/4 → 0 y 2; 5/4 → 0, 2 y 4; 6/8 → 0; 9/8 y 12/8 → 0 y 6; 7/8 → 0 y 4. En los compuestos, cada figura vale con puntillo porque el grupo es la negra con puntillo.
  - `length` llega hasta el siguiente ataque, o hasta el final del compás. El motor suena el 90 % de ese largo (como la entrega 1 con el compás entero), para que cada ataque se distinga.
  - La altura es `{nota}{octava}`, por ejemplo `'Bb3'`. Octava 1, 2 o 3; por defecto 2.
  - Figura y octava se leen al armar cada compás, así que un cambio aplica desde el siguiente (FR-015).
  - Por defecto, **redondas**: el bajo ataca una vez por compás, como en la entrega 1.

- **Rationale**: una regla por figura sobre los grupos de acento cubre los 32 casos sin tabla por compás. Las figuras del bajo en compuestos las decide el builder (#21), y quedan documentadas en el spec (FR-013).

## 6. Volumen por canal, silencio y cuenta de entrada

- **Decision**:
  - Hay dos canales, `click` y `bass`, y cada uno tiene `{ volume: 0–100, muted }`. Por defecto, `{ volume: 80, muted: false }`.
  - El motor recibe la mezcla en `start` y la cambia con `setMix(mix)` de inmediato (FR-017).
  - **Curva**: 80 es la mezcla de la entrega 1 (clicks −8 dB y bajo 0 dB en su bus). El bus suma `40 × log10(volume / 80)` dB: 100 → +3,9 dB, 50 → −8,2 dB, 20 → −24 dB. Con 0, el canal se calla.
  - **Cadena por canal**: sintetizador → `Gain` de silencio (1 o 0) → `Volume` del canal (dB) → salida. Los cambios hacen `rampTo` de 20 ms, para que no haya chasquidos (FR-017, "sin cortes"). Un volumen de 0 se trata como silencio en el `Gain`, porque `rampTo(-Infinity)` en dB no sirve.
  - **Cuenta de entrada** (aclaración del spec, FR-019): en un `Bar` con `countIn: true`, los clicks los toca un segundo sintetizador de click, conectado directo al `Volume` del canal `click`, sin pasar por su `Gain` de silencio. La cuenta suena aunque el metrónomo esté silenciado, al volumen del metrónomo.
  - `stop` sigue silenciando en `now − lookAhead`, ahora con un `Gain` de salida común.
- **Rationale**: el volumen y el silencio cambian en el bus, no en los eventos, así que aplican al instante, también a una nota de bajo que ya está sonando. El acento y la cuenta de entrada son datos del compás, así que el motor no conoce la regla de producto: solo enruta los clicks de un compás de cuenta.
- **Alternatives considered**:
  - Que el store no pida los clicks con el metrónomo silenciado: quitar el silencio tardaría hasta un compás en oírse (14 s en 7/8 a 30 BPM), y el bajo que ya está sonando no se callaría (descartado).
  - Programar el silencio en el inicio del compás 1: se mezcla con los cambios inmediatos y necesita cancelar lo programado (descartado).

## 7. Parar tras N vueltas

- **Decision**:
  - Ajuste `repeats: { on: boolean, count: 1–999 }`. Por defecto `{ on: false, count: 10 }`.
  - **Fin**: si ninguna vuelta contiene el compás pedido, `barAt` devuelve `undefined`. El motor no programa nada más y llama a `onEnd` con `draw.schedule`, en el momento en que ese compás empezaría. El store hace entonces lo mismo que Stop.
  - **Sorteo de la siguiente** (FR-023): solo si `!repeats.on || vuelta.number < repeats.count`. La condición pasa de `bar === últimaNota` a `bar >= últimaNota`. Así, si el usuario sube N o apaga la opción durante la última nota, la siguiente vuelta se sortea en el compás siguiente.
  - **Cambio mientras suena** (FR-024): si la vuelta en curso ya es la N o una posterior, `setRepeats` descarta la vista previa de la vuelta siguiente, y la práctica termina al completar la vuelta en curso.
  - **Contador**: `Vuelta {n} de {N} · nota {i} de {total}` con la opción activada, e igual que en la entrega 1 sin ella.
- **Rationale**: el fin cae exacto en el reloj de audio (SC-004), y el store no necesita medir tiempo.

## 8. Barra espaciadora

- **Decision**:
  - Un `keydown` en `window` (efecto en `App`). Si `event.code === 'Space'`, sin `repeat`, sin modificadores y con el foco fuera de un `[role="dialog"]`, hace `preventDefault` y alterna: Play si está detenida y `canPlay`; si no, Stop.
  - Un `keyup` de espacio con las mismas condiciones también hace `preventDefault`.
- **Rationale**:
  - Con el foco en un `<button>`, el navegador lo activa al soltar el espacio. user-event hace lo mismo en jsdom: `keyup` de `' '` hace clic en un `<button>` salvo que el `keyup` tenga `preventDefault`. Prevenir los dos eventos evita el doble toggle y el desplazamiento de la página (FR-028).
  - Con el panel abierto, Radix encierra el foco en el diálogo, así que la condición del diálogo deja el espacio para los controles del panel.
- **Verificación**: un test de UI con el foco en Play y en Ajustes, más un E2E en Chromium y WebKit, que es donde vive la conducta real del navegador.

## 9. Ajustes guardados: validación por ajuste (aprobado por el usuario el 2026-10-24)

- **Decision**:
  - Una clave en `localStorage`: `countdown-notes:ajustes`, con `{ version: 1, settings: {...} }`. Los campos están en [data-model](./data-model.md).
  - **Esquema** (`src/practice/settings.ts`): un `z.object` donde cada campo lleva `.catch(valorPorDefecto)`, y el objeto entero también.
    - Un campo inválido o ausente vuelve a su valor por defecto, y los demás se conservan.
    - Un JSON roto, o algo que no es un objeto, vuelve todo a los valores por defecto.
    - `notes` se normaliza: sin duplicados y en orden cromático.
    - Los valores por defecto y la validación viven en el mismo lugar.
  - **Carga**: `createPracticeStore` lee y valida al crear el store, así que el primer render ya tiene los ajustes guardados.
  - **Guardado**: `store.subscribe` guarda cuando cambia algún ajuste (comparación superficial de los campos de ajuste), no en cada golpe.
  - Leer y escribir `localStorage` va en `try/catch`. Si el dispositivo no deja guardar, la app sigue igual, sin recordar (FR-033).
  - **`version`**: queda en 1. Una entrega que agrega un ajuste lo agrega al esquema con su `.catch`, sin subir la versión ni escribir migraciones. Solo se sube si un campo cambia de significado.
- **Rationale**: las entregas siguientes agregan campos sin borrar lo guardado. Ninguna combinación de ajustes válidos de las entregas 1–2 es incoherente. Se revisaron los 32 casos de figura por compás, las notas por debajo de 2, N con la opción apagada y el volumen en 0 con el canal silenciado.
- **Para la entrega 4** (revisión del 2026-10-24):
  - **Referencias**: la progresión elegida puede apuntar a una progresión propia que ya no existe. Hará falta un paso después de la validación por campo, que vuelva solo ese ajuste a su valor por defecto. Con "todo o nada", ese fallo borraría todos los ajustes.
  - **Hueco del diseño**: el medio compás solo existe en 2/4, 4/4, 6/8 y 12/8 (#36), pero el compás es un ajuste global. Por ejemplo, el blues de jazz en 3/4. No es un problema del guardado: también pasa al cambiar el compás mientras suena. Se decide en la entrega 4. El plan por compás no bloquea ninguna opción (por ejemplo, un cambio de acorde en `at: 1.5`). Registrarlo en GitHub (#31 o #36) queda pendiente de la decisión del usuario.
- **Alternatives considered**:
  - Todo o nada, con versión: cada entrega que agrega un ajuste borra lo guardado (descartado por el usuario).
  - El middleware `persist` de Zustand: escribe en cada `set`, también en cada golpe, y descarta lo guardado si la versión no coincide y no hay `migrate`. La carga y el guardado a mano son unas 15 líneas y no tienen esos efectos (descartado).

## 10. Pantalla encendida

- **Decision**:
  - Usa la Screen Wake Lock API, con `navigator.wakeLock.request('screen')`, que existe en Safari desde la versión 16.4.
  - **Hook `useWakeLock(active)`**, con `active = status !== 'stopped'`:
    - pide el bloqueo al pasar a activo y lo libera al pasar a detenido;
    - en `visibilitychange`, si la página vuelve a estar visible y sigue activa, lo vuelve a pedir, porque el sistema lo libera al cambiar de pestaña o de app (FR-026).
  - Si `navigator.wakeLock` no existe o `request` rechaza (ahorro de batería, permisos), se ignora sin romper nada (FR-027).
  - **Tests**: jsdom no tiene `navigator.wakeLock`. El test define uno falso en `navigator` (es el borde con el navegador, como el motor) y comprueba la conducta: Play lo pide, Stop lo libera, y volver visible lo pide de nuevo.
- **Rationale**: no hace falta ninguna dependencia. La app instalada en la pantalla de inicio de iOS anterior a 18.4 tenía fallas con esta API (diseño, §10). Se verifica en la entrega 7 (#41). En esta entrega, en Safari (SC-005).
- **Fuente**: [MDN: Screen Wake Lock API](https://developer.mozilla.org/en-US/docs/Web/API/Screen_Wake_Lock_API).
- **Plan B** si Safari del iPhone no lo respeta en la prueba manual: el truco conocido de un `<video>` silencioso en loop (como NoSleep.js). Se registra aquí antes de implementarlo.

## 11. UI

- **Panel de ajustes** (se agrega a lo que ya hay):
  - **Compás**: `ToggleGroup` de un solo valor, en 2 filas de 4. Radix lo expone como `radiogroup` con `radio`s.
  - **Figura del bajo** y **octava**: `ToggleGroup` de un solo valor.
  - Radix permite deseleccionar el valor elegido (llega `''`). Se ignora, para que siempre haya uno elegido.
  - **Volumen**: un `Slider` por canal (0–100) y, al lado, un `Toggle` "Silenciar …" (`aria-pressed`).
  - **Parar tras N vueltas**: un `Switch`; cuando está activado, aparece un `Stepper` "Vueltas" (1–999).
  - El texto de la descripción del panel se ajusta: el tempo y el volumen cambian al instante; el sonido, desde el siguiente compás; la estructura, desde la siguiente vuelta.
- **Tempo rápido** (FR-029): en la pantalla de práctica, dos botones de −5 y +5 BPM a los lados del tempo, sin campo editable.
  - El paso es de 5 porque el panel ya tiene el ajuste fino de a 1.
  - Los nombres son distintos de los del panel (`Bajar 5 BPM`, `Subir 5 BPM`).
  - El test de la entrega 1 "no hay `spinbutton`, `slider` ni `textbox` fuera del panel" sigue valiendo sin cambios.
- **Carril**:
  - Las marcas de cada compás son tantas como sus grupos. El grupo de marcas lleva `role="img"` con nombre accesible: `{grupos} tiempos`, y en el compás actual `Tiempo {g} de {grupos}`. El `textContent` del compás sigue siendo solo la nota, como esperan los tests de la entrega 1.
  - La barra de progreso anima de golpe en golpe, con `--from = beat / beats`, `--to = (beat + 1) / beats` y una duración de `beatLength × 60 / bpm` s.
- **Línea de estado**: `Aleatorio · Analógico cálido · {bpm} BPM · {compás}`. Mientras suena, el compás es el de la vuelta que suena; detenida, el de ajustes (FR-011).
- **jsdom**: el `Slider` de Radix usa `ResizeObserver`, que jsdom no tiene. Un archivo de configuración de los tests (`src/test/setup.ts`) define uno vacío y limpia `localStorage` después de cada test, para que los ajustes guardados no pasen de un test a otro.
- **Pulido visual**: con el skill `frontend-design`, dentro de la dirección del diseño (§7.4).

## 12. E2E

- **Decision**: se agregan dos casos a `e2e/practice.spec.ts`, en `chromium` e `iphone`:
  - **Barra espaciadora**: con el foco en Play, el espacio pasa a Stop y otro espacio vuelve a Play, una vez por pulsación y sin desplazar la página.
  - **Ajustes recordados**: cambiar el BPM a 90 y el compás a 6/8, recargar y comprobar que siguen igual.
- **Riesgo**: en Chromium sin interfaz, `wakeLock.request` puede rechazar. La app debe seguir funcionando (FR-027), y el E2E lo cubre de paso.
