# Implementation Plan: Progresiones propias (Entrega 5)

**Branch**: `006-progresiones-propias` | **Date**: 2026-10-25 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/006-progresiones-propias/spec.md` (issue #6, sub-issues #33–#36)

## Summary

El modo progresión suma las progresiones del usuario:

- **Editor**: una pantalla aparte, que `App` muestra cuando el store tiene un borrador, sin router (research §2). Tiene nombre, tonalidad de origen, el campo "Acordes", un carril que se toca, Play/Stop, "Guardar" y "Borrar".
- **Texto**: un lector propio, `progression-text.ts`, acepta `Dm7 G7 Cmaj7 Cmaj7` o `Cmaj7 | C7 A7 | Dm7 G7`, con `b`/`#`, minúsculas y alias. Informa cada error con su posición (research §5).
- **Mismo camino que la biblioteca**: una progresión propia se convierte en una `Progression` normal, así que `barsOf`, el bajo, los voicings, el carril y el motor no cambian. Suena igual por construcción (research §6).
- **Borrador**: el editor trabaja sobre un borrador del store, que es lo que suena mientras está abierto. "Guardar" lo copia a la lista guardada, y "Listo" pregunta si hay cambios (research §3).
- **Guardado**: una clave aparte de `localStorage`, con cada progresión validada por separado (decisión 1, pendiente).

Las decisiones están en [research.md](./research.md), el estado en [data-model.md](./data-model.md) y los contratos en [contracts/interfaces.md](./contracts/interfaces.md).

## Decisiones del usuario

**De la spec** (aprobadas el 2026-10-25, spec, Clarifications):

- el editor en una pantalla aparte;
- el botón "Guardar", con la pregunta al salir;
- un Play/Stop propio en el editor;
- la tonalidad de origen elegida en el editor.

**De este plan**:

1. **Esquema de las progresiones guardadas** (research §1, **pendiente**).
   - **Recomendación**: una clave aparte, `countdown-notes:progresiones`, en la versión 1. Cada progresión guarda `id`, `name`, `key` y `bars` como datos (`{ root, type }` por acorde), no como texto, y se valida por separado.
   - **Alternativas**: los compases como texto canónico, o las progresiones dentro de los ajustes.
   - Se revisaron las entregas 6 a 9, y ninguna toca este esquema.

No hay otras decisiones del usuario: no hay dependencias nuevas, ni componentes de shadcn, ni cambios en el motor.

## Technical Context

**Language/Version**: TypeScript 7.0.2 (strict), Node 24

**Primary Dependencies**: las de la entrega 4, sin cambios: React 19.3.1, Vite 8.3.5, Tailwind CSS 4.3.3, shadcn 4.22.1 (`Sheet`), tone 15.1.22, zustand 5.0.16, zod 4.6.7, `@tonaljs/note` 4.12.3 (`simplify`) y `@tonaljs/interval` 5.1.1.

**Storage**: `localStorage`.

- Una clave nueva para las progresiones (decisión 1).
- Los ajustes, en su clave y versión 1 de siempre; `progression` acepta también `propia-N`.

**Testing**:

- Vitest 5.0.5: proyecto `ui` (jsdom, motor falso) y proyecto `audio` (Chromium y WebKit, motor real con `Tone.Offline`).
- Playwright 1.64.1 para E2E (`chromium` e `iphone`).

**Target Platform**: navegador de escritorio actual, y Safari en iOS 17 o superior. Se publica en Vercel como estáticos.

**Project Type**: SPA web, solo frontend

**Performance Goals**:

- Cada cambio de acorde de una propia, a menos de 1 ms de su momento (SC-003).
- El texto se lee en cada tecla: son decenas de palabras con una expresión regular, sin espera visible.

**Constraints**:

- Las de las entregas anteriores: nunca `setTimeout` ni `setInterval` para el tiempo musical, y las dependencias van en versión exacta.
- La pantalla de práctica no cambia (principio IV): el editor es otra pantalla.
- Los tests de las entregas 1 a 4 siguen en verde sin tocarlos.

**Scale/Scope**: 4 historias; una pantalla nueva; los 25 tipos de acorde sobre 12 raíces en el lector.

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

| Principio                 | Cómo se cumple                                                                                                                                                                                                                                                                                                                                           | Estado                    |
| ------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------- |
| I. Test-first             | Cada paso empieza con un test que falla: de UI sobre `<App engine={fake.engine} />`, buscando por rol y nombre ([contracts](./contracts/interfaces.md) §4); del lector por su API exportada (§3); o del store con el motor real (§5). Lo guardado se prueba escribiendo `localStorage` a mano y volviendo a montar la app. Ningún test existente cambia. | ✅                        |
| II. Entregas verticales   | Cada historia termina en una conducta que se prueba en la app abierta (quickstart §2). La primera es la más delgada: escribir, guardar en memoria y tocar encima. No hay pasos de una sola capa: cada extracción de componente (`TonicPicker`, `ChordTypeSelect`) va dentro del paso que la necesita.                                                    | ✅                        |
| III. Precisión del tiempo | Una propia llega al motor por el mismo `barAt` que la biblioteca (research §6). Un test `audio` la mide con compases partidos (US4).                                                                                                                                                                                                                     | ✅                        |
| IV. Manos libres          | La pantalla de práctica no suma controles: el editor es otra pantalla, que se abre desde el panel. Mientras suena, no hace falta tocar nada. La barra espaciadora no se pierde en los campos de texto (research §9).                                                                                                                                     | ✅                        |
| V. Simplicidad            | Sin dependencias nuevas ni router (research §2 y §12). Las propias reusan `barsOf` y la tabla de tónicas. Los datos guardados se validan con zod al cargar, y una progresión rota se descarta sola.                                                                                                                                                      | ✅                        |
| Restricciones técnicas    | Todo dentro del stack. Interfaz en español; cifrado americano con la grafía del usuario.                                                                                                                                                                                                                                                                 | ✅                        |
| Flujo de trabajo          | Rama `006-progresiones-propias`. Commit por paso en verde, con el issue de su historia; nunca en `main` ni push. Las decisiones de la spec están en el diseño (§4.2). La decisión 1 espera al usuario. Los issues se cierran al quedar en verde en `main`.                                                                                               | ✅ (decisión 1 pendiente) |

**Re-check post-diseño**: sin cambios. No hay violaciones que justificar.

## Project Structure

### Documentation (this feature)

```text
specs/006-progresiones-propias/
├── plan.md              # Este archivo
├── research.md          # Fase 0: decisiones
├── data-model.md        # Fase 1: acordes escritos, progresión propia, borrador y lo guardado
├── quickstart.md        # Fase 1: cómo validar la entrega de punta a punta
├── contracts/
│   └── interfaces.md    # Fase 1: API del lector, pantallas accesibles, store y datos guardados
├── checklists/
│   └── requirements.md  # Calidad del spec
└── tasks.md             # Fase 2 (/speckit-tasks)
```

### Source Code (repository root)

Estado final. `(nuevo)` = archivo nuevo; `(cambia)` = archivo que ya existe y se modifica.

```text
e2e/
└── practice.spec.ts                    # (cambia) crear, guardar y recargar; el editor a 320 px
src/
├── App.tsx                             # (cambia) práctica o editor; línea de estado con progressionOf; exporta PlayButton
├── write-progression.test.tsx          # (nuevo) US1
├── saved-progressions.test.tsx         # (nuevo) US2
├── tap-progression.test.tsx            # (nuevo) US3
├── durations.test.tsx                  # (nuevo) US4
├── lib/
│   └── hands-free.ts                   # (cambia) el espacio en un campo editable no hace Play/Stop
├── music/
│   ├── progression-text.ts             # (nuevo) parseProgression, formatProgression
│   ├── progression-text.test.ts        # (nuevo) los 25 tipos en las 12 raíces, alias, errores, `|`
│   ├── progressions.ts                 # (cambia) MyProgression, myProgression, grupo "Mis progresiones"
│   └── progressions.test.ts            # (cambia) suma myProgression
├── practice/
│   ├── my-progressions.ts              # (nuevo) clave, esquema zod, load y save (decisión 1)
│   ├── settings.ts                     # (cambia) progression acepta propia-N
│   ├── store.ts                        # (cambia) mine, editor y sus acciones; progressionOf; canPlay
│   └── progression.browser.test.ts     # (cambia) una propia con compases partidos
└── components/
    ├── progression-editor.tsx          # (nuevo) la pantalla, el selector de compás y las preguntas
    ├── tonic-picker.tsx                # (nuevo) las 12 tónicas; la usan el panel y el editor
    ├── chord-type-select.tsx           # (nuevo) el <select> de tipo por familias; panel y selector de compás
    └── settings-panel.tsx              # (cambia) Nueva/Editar progresión; grupo Mis progresiones; usa los dos de arriba
```

**Structure Decision**:

- Se mantienen las carpetas de siempre:
  - `progression-text.ts` va en `music/` porque es una regla musical sin estado, junto a `progressions.ts`, que lo usa.
  - `my-progressions.ts` va en `practice/` junto a `settings.ts`, porque es lo guardado.
- El editor es un componente de pantalla, igual que la práctica en `App.tsx`.
- `TonicPicker` y `ChordTypeSelect` salen del panel en el paso que los necesita por segunda vez, sin cambiar lo que ve el panel.
- Los tests de UI van uno por historia, en `src/`, y todos montan `App` completa.

## Orden sugerido para `/speckit-tasks` (porciones verticales)

Cada paso es test que falla → código mínimo → verde → commit con el issue (`#33`…`#36`). La rama ya existe.

1. **US1 · #33: escribir una progresión y tocar encima**.
   1. `progression-text.test.ts` (falla): un acorde por compás ([contracts](./contracts/interfaces.md) §3, todo salvo lo marcado US4). Código: `progression-text.ts`.
   2. `progressions.test.ts` (falla): `myProgression` de `Dm7 G7 Cmaj7 Cmaj7` en Do mayor da en `barsOf` lo mismo que el ii–V–I mayor, y `keyLabel` `Do mayor`. Código: `MyProgression`, `myProgression`, el grupo y el id.
   3. `write-progression.test.tsx` (falla). Debe comprobar:
      - "Nueva progresión" en el panel solo en el modo progresión;
      - que abre el `main` "Editor de progresiones", sin la pantalla de práctica;
      - que escribir `Dm7 G7 Cmaj7 Cmaj7` llena la lista "Compases" con `Compás 1: Dm7`… `Compás 4: Cmaj7`;
      - con `Dm7 Hm7 G7`, el campo `aria-invalid`, su descripción con `«Hm7»`, la lista sin cambios y "Guardar" desactivado;
      - "Guardar", "Listo", y la línea de estado `Progresión 1 · Do mayor · Analógico cálido · 60 BPM · 4/4`;
      - con "Bajo + acorde", que Play da en `fake.played` lo mismo que el ii–V–I mayor de la biblioteca en otra app montada;
      - que "Nueva progresión" con otra progresión sonando la detiene (`fake.running` falso).

      Código:
      - en el store: `mine` (en memoria), `editor`, `openEditor`, `setDraftText`, `saveDraft`, `progressionOf`, `isDirty`, `canSave`, `canPlay`, y `progressionRound` con una `Progression`;
      - en `App`: práctica o editor, y la línea de estado con `progressionOf`;
      - `progression-editor.tsx` con "Listo", "Acordes" y sus errores, el carril estático y "Guardar";
      - el botón en el panel.

   4. `write-progression.test.tsx` (falla). Debe comprobar:
      - "Listo" en una nueva sin escribir nada cierra sin preguntar;
      - con cambios, el `dialog` "Cambios sin guardar": "Seguir editando" se queda; "Descartar cambios" vuelve a la práctica con la progresión anterior; "Guardar" guarda y cierra;
      - con la música sonando, `user.type(acordes, ' ')` escribe el espacio y `fake.running` sigue verdadero.

      Código: `discardDraft`, `closeEditor`, el diálogo, y los campos editables en `useSpaceToggle`.

2. **US2 · #34: guardar, renombrar y borrar**.
   1. `saved-progressions.test.tsx` (falla). Debe comprobar:
      - que tras "Guardar", desmontar y volver a montar, el `<select>` tiene el grupo `Mis progresiones` primero, con la progresión, y sigue elegida;
      - "Editar progresión" solo con una propia elegida, y que abre el editor con su texto;
      - con datos escritos a mano ([contracts](./contracts/interfaces.md) §6): las inválidas se descartan y las demás quedan; un JSON roto deja la lista vacía y los ajustes intactos; una elegida que no existe deja el ii–V–I mayor; un dato de ajustes de la entrega 4 se conserva.

      Código: `my-progressions.ts` (decisión 1), `progression` en `settings.ts`, la comprobación al crear el store, `saveDraft` que escribe, el grupo del `<select>`, "Editar progresión" y `openEditor(id)`.

   2. (falla) Nombre. Debe comprobar:
      - el `textbox` "Nombre" con `Progresión 1`, y la siguiente nueva con `Progresión 2`;
      - que renombrar y guardar cambia el `<select>` y la línea de estado;
      - que un nombre vacío conserva el anterior.

      Código: `setDraftName` y el nombre por defecto.

   3. (falla) Tonalidad. Debe comprobar:
      - en el editor, "Tonalidad de origen" con la tónica de ajustes y "Tipo de tonalidad" en `Mayor`;
      - que La + `Menor` no cambia el texto, la línea de estado dice `La menor` y los radios usan la grafía menor (`Do sostenido`);
      - con la tónica de ajustes en Do, que elegir la propia en el panel pone la tónica en La y el carril en `Am G F E`;
      - que la tónica Do da `Cm B♭ A♭ G`.

      Código: `setDraftKey`, la tónica en `setProgression` y `TonicPicker`, extraído del panel.

   4. (falla) Play en el editor y cambios mientras suena. Debe comprobar:
      - que Play en el editor toca el borrador sin guardar (`fake.played`) y lo guardado no cambia;
      - que "Listo" con "Descartar cambios" deja la música sonando;
      - con "Editar progresión" sobre la que suena, que un cambio deja igual la vuelta en curso y cambia la siguiente;
      - que al descartar vuelve la versión guardada desde la siguiente vuelta, con la tónica de cuando se abrió.

      Código: `PlayButton` exportado y en el editor, y `opened` en `discardDraft`.

   5. (falla) Borrar. Debe comprobar:
      - "Borrar progresión" solo en una guardada;
      - el `dialog` `¿Borrar «Andaluza mía»?`: "Cancelar" la conserva; "Borrar" la quita del `<select>`, deja el ii–V–I mayor, detiene la música si sonaba, y sigue borrada al volver a montar.

      Código: `deleteProgression` y el diálogo.

3. **US3 · #35: armar tocando el carril**.
   1. `tap-progression.test.tsx` (falla). Debe comprobar:
      - en una nueva, que "Agregar compás" da `Compás 1: C` y el texto `C`; con `Menor`, `Cm`;
      - otra vez "Agregar compás" copia el último;
      - tocar un compás abre el `dialog` "Compás 1", con el `radiogroup` "Raíz" (12 radios, `Do`… `Si`, con `C`… `B` visibles) y el `combobox` "Tipo de acorde" con los mismos grupos y opciones, en el mismo orden, que el del panel;
      - que F + m7 da `Compás 1: Fm7` y el texto se reescribe;
      - "Quitar" desactivado con un compás, y que quita con más;
      - con un error en el texto, que editar tocando lo reemplaza por la forma de siempre y borra el error;
      - que Dm7 G7 Cmaj7 Cmaj7 armada tocando da el texto `Dm7 | G7 | Cmaj7 | Cmaj7` y el mismo `fake.played` que escrita.

      Código: `setChord`, `addBar`, `removeBar`, el diálogo del compás y `ChordTypeSelect`, extraído del panel.

4. **US4 · #36: medio compás y varios compases**.
   1. `progression-text.test.ts` (falla): lo marcado US4 en [contracts](./contracts/interfaces.md) §3. Código: `|` en el lector y compases de dos acordes en `formatProgression`.
   2. `durations.test.tsx` (falla). Debe comprobar:
      - que `Cmaj7 | C7 A7 | Dm7 G7` da 3 `listitem`, con `Compás 2, parte 1: C7` y `Compás 2, parte 2: A7` y sus `data-at` `0` y `2`; en 7/8, `0` y `4`;
      - el carril de práctica partido igual;
      - con redondas y "Bajo + acorde", el bajo y el acorde en `at` `0` y `2`;
      - con `C | Dm7 G7 C`, el error del segundo compás;
      - tocando, que "Partir" da dos partes con el mismo acorde, la parte 2 se edita desde el `dialog` "Compás 1, parte 2", "Unir" deja la primera y "Duplicar" inserta la copia justo después, con el texto reescrito en cada paso.

      Código: `splitBar`, `joinBar`, `duplicateBar` y las partes en el carril del editor.

   3. `progression.browser.test.ts` (research §11): una propia `Cmaj7 A7 | Dm7 G7` con el store y el motor real, cada ataque a menos de 1 ms. Si pasa al primer intento, se comprueba que falla corriendo el `at` a propósito, y se deshace.
   4. E2E (falla), en `chromium` e `iphone`: crear escribiendo, guardar, recargar y encontrarla; el editor a 320 × 640 px sin scroll horizontal.

5. **Cierre**:
   - Pulido visual del editor con el skill `frontend-design`, en la dirección del diseño (§7.4).
   - Validación completa: quickstart §1, con el tamaño del bundle.
   - La parte manual la hace el usuario: quickstart §2–§5.

## Complexity Tracking

Sin violaciones de la constitución.
