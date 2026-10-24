# Contratos: "Ya me sirve" (Entrega 1)

La interfaz pública de esta entrega tiene tres partes: la pantalla de práctica y el panel de ajustes, que es lo que buscan los tests de UI y E2E; el contrato del motor de audio; y los comandos.

## 1. Comandos

Son los mismos de la entrega 0 ([contratos de la entrega 0](../../001-base-nueva/contracts/interfaces.md) §1), con un cambio:

| Comando     | Qué hace                                                                                                                         |
| ----------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm test` | `vitest run` con dos proyectos: `ui` (jsdom, `src/**/*.test.{ts,tsx}`) y `audio` (Chromium y WebKit, `src/**/*.browser.test.ts`) |

`pnpm test:e2e` sigue corriendo en `chromium` e `iphone`, ahora contra la pantalla de práctica.

## 2. Motor de audio (`src/audio/engine.ts`)

```ts
export type Sound =
  | { kind: 'click'; accent: boolean }
  | { kind: 'bass'; pitch: string } // altura de Tone, p. ej. 'Bb2'

export type EngineStart = {
  bpm: number
  beatsPerBar: number
  /** Qué suena en ese tiempo. Se llama con anticipación, al programarlo. */
  soundsAt: (bar: number, beat: number) => Sound[]
  /** Se llama cuando ese tiempo suena, sincronizado con el audio. */
  onBeat: (bar: number, beat: number) => void
}

export type Engine = {
  /** Desbloquea el audio y arranca en el compás 0, tiempo 0. Se llama dentro del toque en Play. */
  start: (options: EngineStart) => Promise<void>
  /** Corta todo de inmediato. Después se puede volver a llamar a start. */
  stop: () => void
  /** Cambia el tempo desde el siguiente tiempo. */
  setBpm: (bpm: number) => void
}
```

Garantías que cumple todo motor, sea el real o el falso:

- Los tiempos se recorren en orden: `(0,0), (0,1), …, (0, beatsPerBar−1), (1,0), …`, sin saltos ni repeticiones.
- Para cada tiempo, `soundsAt` se llama antes que `onBeat`.
- Después de `stop`, no se llama a ningún callback de ese arranque.

**Motor real** (`src/audio/tone-engine.ts`): `createToneEngine(): Engine`. Con el BPM `b`, cada sonido del tiempo k suena en `t₀ + k × 60 / b` (± 1 ms), y `onBeat` corre en el cuadro de animación más cercano a ese momento ([research](../research.md) §3–§4).

**Motor falso** (`src/test/fake-engine.ts`), solo para tests de UI: `createFakeEngine()` devuelve `{ engine, beat(n?), played, bpmChanges, running }`.

- `beat(n = 1)`: avanza n tiempos. Para cada uno llama a `soundsAt` y después a `onBeat`, dentro de `act`.
- `played`: lista de `{ bar, beat, sound }` con todo lo que se le pidió tocar.
- `bpmChanges`: valores recibidos en `setBpm`.
- `running`: `true` entre `start` y `stop`.

## 3. `App`

```ts
export default function App(props: { engine: Engine }): JSX.Element
```

`main.tsx` monta `<App engine={createToneEngine()} />`. Los tests montan `<App engine={fake.engine} />`.

## 4. Pantalla de práctica y panel (lo que buscan los tests)

Los tests buscan por rol y nombre accesible, nunca por clases ni por estructura. Los textos visibles exactos los decide el builder, salvo los que fija esta tabla.

### Pantalla de práctica

| Elemento                 | Rol / atributo                        | Nombre accesible o texto                                                                  |
| ------------------------ | ------------------------------------- | ----------------------------------------------------------------------------------------- |
| Título de la app         | `heading` nivel 1 (oculto a la vista) | `Countdown Notes`                                                                         |
| Línea de estado (arriba) | texto                                 | `Aleatorio · Analógico cálido · {bpm} BPM · 4/4`                                          |
| "Ahora"                  | `region`                              | `Ahora`. Adentro: la cuenta (`4`…`1`), o la nota (`B♭`) y su nombre (`Si bemol`)          |
| Carril                   | `list`                                | `Carril`. Cada compás es un `listitem` con su nota; el actual tiene `aria-current="true"` |
| Vista previa             | texto dentro del carril               | `Vuelta {n + 1}: {nota}` (la primera nota de la vuelta siguiente)                         |
| Contador                 | texto                                 | `Vuelta {n} · nota {i} de {total}`                                                        |
| Play/Stop                | `button`                              | `Play` o `Stop`, según el estado. Deshabilitado si hay menos de 2 notas                   |
| Aviso de 2 notas         | texto                                 | `Elige al menos 2 notas para tocar.`                                                      |
| Acceso a ajustes         | `button`                              | `Ajustes`                                                                                 |

La pantalla de práctica no tiene `spinbutton`, `slider` ni `textbox` fuera del panel (FR-013).

### Panel de ajustes

| Elemento          | Rol          | Nombre accesible                                                                   |
| ----------------- | ------------ | ---------------------------------------------------------------------------------- |
| Panel             | `dialog`     | `Ajustes`                                                                          |
| BPM               | `spinbutton` | `BPM` (con `aria-valuemin=30` y `aria-valuemax=240`)                               |
| Bajar / subir BPM | `button`     | `Bajar BPM`, `Subir BPM`                                                           |
| Compases por nota | `spinbutton` | `Compases por nota` (1–16)                                                         |
| Bajar / subir     | `button`     | `Bajar compases por nota`, `Subir compases por nota`                               |
| Notas             | `group`      | `Notas`; adentro, 12 `button` con `aria-pressed`, llamados `C`, `D♭`, …, `B`       |
| Atajos            | `button`     | `Incluir naturales`, `Excluir naturales`, `Incluir alteradas`, `Excluir alteradas` |
| Aviso de 2 notas  | texto        | `Elige al menos 2 notas para tocar.`                                               |
| Cerrar            | `button`     | `Cerrar`                                                                           |

Reglas:

- `<html lang="es">`. La app siempre se ve en tema oscuro.
- El botón Play/Stop usa el acento ámbar (`#f5a524`) de fondo.
