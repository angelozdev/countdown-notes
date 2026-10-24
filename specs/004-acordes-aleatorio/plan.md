# Implementation Plan: Acordes en modo aleatorio (Entrega 3)

**Branch**: `004-acordes-aleatorio` | **Date**: 2026-10-24 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/004-acordes-aleatorio/spec.md` (issue #4, sub-issues #26–#28)

## Summary

La práctica de la entrega 2 suma el acorde y el segundo estilo:

- **Acorde**: "solo bajo" o "bajo + acorde", con uno de los 25 tipos de jazz. Cada compás ataca el acorde de su nota y lo sostiene. Las tríadas van en voicing abierto y los demás en voicings sin raíz. "Ahora" y el carril muestran el cifrado y el nombre en español.
- **Estilos**: Analógico cálido y Pad ambiental, para el bajo y el acorde juntos, desde el compás siguiente y sin cortar la caída del anterior.
- **Mezcla**: un tercer canal (acorde) y un soft clipper en la salida común. La salida nunca pasa de 1,0, con cualquier volumen (decisión del usuario, 2026-10-24).

Sobre la arquitectura de la entrega 2 (plan por compás), todo es aditivo:

- `barAt` suma un evento `chord` y el estilo del compás.
- El motor arma las cadenas de los dos estilos y elige una por compás.
- Una tabla propia de 25 tipos da cifrado, nombre y voicing, sin dependencias nuevas (research §1 y §5).

Las decisiones están en [research.md](./research.md), el estado en [data-model.md](./data-model.md) y los contratos en [contracts/interfaces.md](./contracts/interfaces.md).

## Technical Context

**Language/Version**: TypeScript 7.0.2 (strict), Node 24

**Primary Dependencies**: las de la entrega 2, sin cambios (React 19.3.1, Vite 8.3.5, Tailwind CSS 4.3.3, shadcn 4.22.1, tone 15.1.22, zustand 5.0.16 y zod 4.6.7). Ninguna dependencia ni componente nuevo (research §1).

**Storage**: la misma clave de `localStorage` y la misma versión (1), con cuatro campos más que vuelven solos a su valor por defecto (research §9).

**Testing**:

- Vitest 5.0.5: proyecto `ui` (jsdom, motor falso) y proyecto `audio` (Chromium y WebKit, motor real con `Tone.Offline`).
- Playwright 1.64.1 para E2E (`chromium` e `iphone`).

**Target Platform**: navegador de escritorio actual, y Safari en iOS 17 o superior. Se publica en Vercel como estáticos.

**Project Type**: SPA web, solo frontend

**Performance Goals**:

- Cada ataque del acorde a menos de 1 ms del inicio de su compás, en los dos estilos (SC-001).
- Ninguna muestra de la salida por encima de 1,0 (SC-005).
- El reverb listo antes de la cuenta de entrada: 6–23 ms en el spike (research §4).

**Constraints**:

- Las mismas de la entrega 2: nunca `setTimeout` ni `setInterval` para el tiempo musical, el primer Play desbloquea el audio, y las dependencias van en versión exacta.
- La pantalla de práctica no suma controles: el acorde solo cambia lo que muestran "Ahora", el carril y la línea de estado.
- Dos cadenas de efectos por estilo corren a la vez. Si en el iPhone causan cortes, se aplica el plan B (research §4).

**Scale/Scope**: 3 historias sobre la misma pantalla y el mismo panel. Sigue siendo solo el modo aleatorio.

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

| Principio                 | Cómo se cumple                                                                                                                                                                                                                                                                                                                                                                                         | Estado |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------ |
| I. Test-first             | Cada paso empieza con un test que falla: de UI sobre `<App engine={fake.engine} />`, buscando por rol y nombre ([contracts](./contracts/interfaces.md) §4); de `chords.ts` por su API exportada (§3); o del motor real con audio renderizado. Los tests de la entrega 2 no cambian, salvo la constante `MIX` del test de audio, que suma el canal del acorde sin tocar ninguna aserción (research §3). | ✅     |
| II. Entregas verticales   | Cada historia termina en una conducta que se prueba en la app abierta (quickstart §2). La primera es la más delgada (tríadas, un estilo). No hay pasos de una sola capa fuera de una historia: el clipper es parte de US1 y se oye al subir el volumen.                                                                                                                                                | ✅     |
| III. Precisión del tiempo | El acorde es un evento más del plan por compás, programado en su tick del `Transport`. El estilo se elige al tocar cada evento, sin reprogramar nada. "Ahora" y la línea de estado siguen el compás que suena, en `onBeat` (research §7). El test `audio` mide los ataques del acorde y el tope de la salida.                                                                                          | ✅     |
| IV. Manos libres          | Ningún control nuevo en la pantalla de práctica. El cifrado sigue el estilo de la nota (letra grande) y se achica según el largo para no desbordar, comprobado a 320 px.                                                                                                                                                                                                                               | ✅     |
| V. Simplicidad            | Sin tonal ni el Select de shadcn (research §1); tonal entra en la entrega 4, que la necesita. Sin migración de datos guardados (§9). El fundido en Stop no se construye salvo que la prueba de oído lo pida (§12).                                                                                                                                                                                     | ✅     |
| Restricciones técnicas    | Todo dentro del stack. Interfaz en español; cifrado americano.                                                                                                                                                                                                                                                                                                                                         | ✅     |
| Flujo de trabajo          | Rama `004-acordes-aleatorio`. Commit por paso en verde, con el issue de su historia; nunca en `main` ni push. El soft clipper lo decidió el usuario el 2026-10-24 (spec, Clarifications). Los issues se cierran al quedar en verde en `main` (constitución v1.2.0).                                                                                                                                    | ✅     |

**Re-check post-diseño**: sin cambios. No hay violaciones que justificar.

## Project Structure

### Documentation (this feature)

```text
specs/004-acordes-aleatorio/
├── plan.md              # Este archivo
├── research.md          # Fase 0: decisiones, spike y fuentes
├── data-model.md        # Fase 1: tipos de acorde, voicings, estilos, ajustes y lo que suena
├── quickstart.md        # Fase 1: cómo validar la entrega de punta a punta
├── contracts/
│   └── interfaces.md    # Fase 1: motor, API de acordes, pantalla accesible y datos guardados
├── checklists/
│   └── requirements.md  # Calidad del spec
└── tasks.md             # Fase 2 (/speckit-tasks)
```

### Source Code (repository root)

Estado final. `(nuevo)` = archivo nuevo; `(cambia)` = archivo que ya existe y se modifica.

```text
e2e/
└── practice.spec.ts                 # (cambia) el cifrado más largo cabe a 320 px
src/
├── App.tsx                          # (cambia) estilo en la línea de estado
├── chords.test.tsx                  # (nuevo) US1
├── chord-types.test.tsx             # (nuevo) US2
├── styles.test.tsx                  # (nuevo) US3
├── audio/
│   ├── engine.ts                    # (cambia) Channel 'chord', Sound 'chord', Style, Bar.style
│   ├── tone-engine.ts               # (cambia) soft clipper, canal y cadenas del acorde, estilos
│   └── tone-engine.browser.test.ts  # (cambia) MIX con acorde; suma tope, acorde y estilos
├── music/
│   ├── chords.ts                    # (nuevo) CHORD_TYPES, chordSymbol, chordName, voicingOf
│   └── chords.test.ts               # (nuevo) los 300 acordes contra FR-005 y FR-007 a FR-009
├── practice/
│   ├── settings.ts                  # (cambia) withChord, chordType, style, mix.chord
│   └── store.ts                     # (cambia) acorde y estilo en barAt, sounding
└── components/
    ├── now.tsx                      # (cambia) cifrado y nombre, tamaño según el largo
    ├── lane.tsx                     # (cambia) cifrado por compás y en la vista previa
    └── settings-panel.tsx           # (cambia) sección Sonido y volumen del acorde
```

**Structure Decision**:

- Se mantienen las carpetas de la entrega 2. `music/chords.ts` va junto a `notes.ts` y `meters.ts`: datos y reglas musicales sin estado.
- Solo `audio/tone-engine.ts` y `main.tsx` importan Tone.js; los tests `*.browser.test.ts` también.
- Los tests de UI van uno por historia, en `src/`, y todos montan `App` completa.

## Orden sugerido para `/speckit-tasks` (porciones verticales)

Cada paso es test que falla → código mínimo → verde → commit con el issue (`#26`…`#28`). La rama ya existe.

1. **US1 · #26: bajo + acorde con tríadas**.
   1. **La mezcla no satura (#22, #26)**. Test de audio (falla hoy): un bajo largo en E1 y C2 con un click fuerte en cada golpe, a 120 BPM. Hay un borrador en `.az-orchestrate/003-practica-comoda/i1-test-draft.patch`. Debe comprobar:
      - que, con la mezcla por defecto, `max(|muestra|) ≤ 1`;
      - que, con los dos canales en 100, también;
      - que algo suena por encima de 0,5.

      Código: soft clipper en `tone-engine.ts` (research §2). Los demás tests de audio siguen en verde. Commit `fix: la mezcla no satura (#22 #26)`, y comentario en #22.

   2. `music/chords.test.ts` con las 6 tríadas sobre las 12 raíces (falla). Debe comprobar:
      - el cifrado y el nombre (`F♯m`, `Fa sostenido menor`);
      - las tres notas de FR-007, con la raíz en la octava 3;
      - todo entre C3 y E5.

      Código: `chords.ts` con las tríadas.

   3. Test de audio del acorde (falla). Debe comprobar:
      - un ataque por compás, a menos de 1 ms del inicio;
      - que dura el 90 % de `length`;
      - que, silenciado, no suena;
      - que, con la mezcla por defecto y con los tres canales en 100, con un acorde de 5 notas, ninguna muestra pasa de 1,0.

      Código: `Channel` y `Sound` con el acorde, `BASE_DB.chord`, la cadena Analógico cálido del acorde y la constante `MIX` del test con el canal nuevo.

   4. `chords.test.tsx` (falla). Debe comprobar:
      - "Solo bajo" por defecto: sin eventos `chord` y sin el selector ni el volumen del acorde;
      - con "Bajo + acorde": la tríada mayor por defecto, y en cada compás de música un `chord` en `at: 0` con las notas de FR-007, sin acorde en la cuenta;
      - que "Ahora" muestra `F♯m` y `Fa sostenido menor` con Cm, y que el carril y la vista previa muestran cifrados;
      - que un cambio de tipo a mitad de compás mantiene "Ahora" y el compás en curso, y el siguiente ya cambia;
      - que el volumen y el silencio del acorde llegan a `fake.mix` sin detener el motor;
      - que los ajustes nuevos se recuerdan, y que un dato de la entrega 2 se conserva con los nuevos por defecto.

      Código: los ajustes en `settings.ts`, `barAt` y `sounding` en el store, la sección "Sonido" (`Qué suena` y el `<select>` con `Tríadas`) y el canal en el panel, y `now.tsx` y `lane.tsx`.
2. **US2 · #27: vocabulario completo**.
   1. Dos tests que fallan, escritos antes del código:
      - `chords.test.ts` con los 300 acordes contra FR-005 y FR-007 a FR-009;
      - `chord-types.test.tsx`: los 5 grupos en orden con sus 25 opciones, y "Ahora" con `B♭m7♭5` y `Si bemol semidisminuido`.

      Código: los 19 tipos con sus formas A y B, y la ubicación de research §5.

   2. E2E (falla): F♯ y B♭ con m(maj7), a 320 × 640 px. "Ahora" y cada compás del carril no desbordan.

      Código: el tamaño según el largo del cifrado en `now.tsx` y `lane.tsx` (research §6).
3. **US3 · #28: Pad ambiental y selector de estilo**.
   1. Test de audio (falla). Debe comprobar:
      - que un compás con `style: 'pad'` suena con el ataque lento del Pad (a los 50 ms, el acorde es menos de un tercio que en `'warm'`);
      - que al pasar de `'warm'` a `'pad'`, 30 ms después del cambio sigue sonando más del 30 % de lo que sonaba justo antes, sin corte;
      - el tope de 1,0 en `'pad'` con la mezcla por defecto y al 100.

      Código: `Style` y `Bar.style` en el contrato, las cadenas del Pad (research §4) y `maxPolyphony: 64`.

   2. `styles.test.tsx` (falla). Debe comprobar:
      - Analógico cálido por defecto;
      - con Pad elegido y la música detenida, la línea de estado `Aleatorio · Pad ambiental · 60 BPM · 4/4`;
      - que un cambio a mitad de compás deja la línea de estado igual hasta el compás siguiente y que `fake.bars` del siguiente trae `style: 'pad'`;
      - que el estilo se recuerda.

      Código: `style` en los ajustes, en `barAt` y en `sounding`, los radios del panel y la línea de estado.
4. **Cierre**:
   - Pulido visual de la sección "Sonido" y del cifrado largo con el skill `frontend-design`.
   - Validación completa: quickstart §1.
   - La parte manual la hace el usuario: quickstart §2–§5, la prueba de oído de los niveles y el corte del Pad al final (research §12).

## Complexity Tracking

Sin violaciones de la constitución.
