# Contratos: Práctica cómoda (Entrega 2)

La interfaz pública tiene las mismas tres partes que en la [entrega 1](../../002-ya-me-sirve/contracts/interfaces.md): la pantalla de práctica y el panel de ajustes (lo que buscan los tests de UI y E2E), el contrato del motor de audio y los comandos. Aquí está el estado final de la entrega; cada parte indica en qué historia llega.

## 1. Comandos

Sin cambios respecto de la entrega 1. El proyecto `ui` de Vitest agrega `setupFiles: ['src/test/setup.ts']` (research §11).

## 2. Motor de audio (`src/audio/engine.ts`)

```ts
export type Accent = 'strong' | 'soft' | 'none'

export type Sound =
  | { kind: 'click'; accent: Accent }
  | { kind: 'bass'; pitch: string; length: number } // altura de Tone ('Bb2'); length en golpes

export type Channel = 'click' | 'bass'

/** volume de 0 a 100; 80 es la mezcla de la entrega 1. */
export type Mix = Record<Channel, { volume: number; muted: boolean }>

export type Bar = {
  /** Golpes de metrónomo del compás. */
  beats: number
  /** Lo que dura un golpe, en unidades del BPM: 1, o 1/3 en 6/8, 9/8 y 12/8. */
  beatLength: number
  /** Cuenta de entrada: sus clicks suenan aunque el metrónomo esté silenciado. */
  countIn?: boolean
  /** Lo que suena; at va en golpes desde el inicio del compás (0, 0.5, 1, …). */
  events: { at: number; sound: Sound }[]
}

export type EngineStart = {
  bpm: number
  mix: Mix
  /** El compás que sigue, o undefined si la práctica termina ahí. Se llama con anticipación, al programarlo. */
  barAt: (bar: number) => Bar | undefined
  /** Se llama cuando el golpe suena, sincronizado con el audio. */
  onBeat: (bar: number, beat: number) => void
  /** Se llama cuando termina la práctica, en el momento en que empezaría el compás que no llegó. */
  onEnd: () => void
}

export type Engine = {
  /** Desbloquea el audio y arranca en el compás 0, golpe 0. Se llama dentro del toque en Play. */
  start: (options: EngineStart) => Promise<void>
  /** Corta todo de inmediato. Después se puede volver a llamar a start. */
  stop: () => void
  /** Cambia el tempo desde el siguiente golpe. */
  setBpm: (bpm: number) => void
  /** Cambia volúmenes y silencios de inmediato. */
  setMix: (mix: Mix) => void
}
```

Llega en la fase fundacional (refactor) con `Accent` sin `'soft'`, el bajo sin `length` (dura el 90 % del compás, como en la entrega 1), `barAt` sin `undefined`, y sin `mix`, `setMix`, `countIn` ni `onEnd`. `'soft'` llega en US1, `length` en US2, `mix`/`setMix`/`countIn` en US3, y `undefined`/`onEnd` en US4.

Garantías que cumple todo motor, sea el real o el falso:

- `barAt` se llama una vez por compás, en orden (0, 1, 2, …), antes del `onBeat` de su golpe 0.
- `onBeat(bar, beat)` se llama para cada golpe entero, `0 … beats − 1`, en orden. Los eventos con `at` fraccionario no llaman a `onBeat`.
- Cuando `barAt` devuelve `undefined`, no se llama nada más, salvo `onEnd`, una vez.
- Después de `stop`, no se llama a ningún callback de ese arranque.

**Motor real** (`src/audio/tone-engine.ts`): `createToneEngine(): Engine`.

- Con el BPM `b`, el evento con `at` del compás que empieza en `t_c` suena en `t_c + at × beatLength × 60 / b` (± 1 ms).
- El compás siguiente empieza en `t_c + beats × beatLength × 60 / b`.
- El detalle está en [research](../research.md) §2 y §6.

**Motor falso** (`src/test/fake-engine.ts`), solo para tests de UI: `createFakeEngine()` devuelve `{ engine, beat(n?), played, bars, bpm, mix, running }`.

- `beat(n = 1)`: avanza n golpes, dentro de `act`. Al empezar un compás pide `barAt`; si es `undefined`, llama a `onEnd`, queda detenido y no avanza más. Por cada golpe agrega a `played` los eventos con `beat ≤ at < beat + 1` y llama a `onBeat`.
- `played`: lista de `{ bar, beat, sound }`, donde `beat` es el `at` del evento. Es la misma forma de la entrega 1, así que su `toEqual` sigue valiendo.
- `bars`: los `Bar` que devolvió `barAt`, en orden (`bars[0]` es la cuenta de entrada). Llega en US3.
- `bpm` y `mix`: lo último recibido en `start`, `setBpm` o `setMix`. `undefined` si nunca arrancó.
- `running`: `true` entre `start` y `stop`, o hasta `onEnd`.

## 3. `App`

Sin cambios: `export default function App(props: { engine: Engine }): JSX.Element`.

## 4. Pantalla de práctica y panel (lo que buscan los tests)

Se agrega a las tablas de la entrega 1. Los tests buscan por rol y nombre accesible, nunca por clases ni por estructura.

### Pantalla de práctica

| Elemento               | Rol / atributo                   | Nombre accesible o texto                                                          | Historia |
| ---------------------- | -------------------------------- | --------------------------------------------------------------------------------- | -------- |
| Línea de estado        | texto                            | `Aleatorio · Analógico cálido · {bpm} BPM · {compás}` (cambia: antes, `4/4` fijo) | US1      |
| Cuenta regresiva       | texto en "Ahora"                 | Un número por grupo: `{grupos}` … `1`                                             | US1      |
| Marcas de un compás    | `img`, dentro de cada `listitem` | `{grupos} tiempos`; en el compás actual, `Tiempo {g} de {grupos}`                 | US1      |
| Contador con N vueltas | texto                            | `Vuelta {n} de {N} · nota {i} de {total}`                                         | US4      |
| Tempo rápido           | `button` ×2                      | `Bajar 5 BPM`, `Subir 5 BPM`                                                      | US5      |

- El `textContent` de cada compás del carril sigue siendo solo su nota.
- La pantalla de práctica sigue sin `spinbutton`, `slider` ni `textbox` fuera del panel. El tempo rápido son solo botones.
- **Barra espaciadora**: fuera del panel, `Space` alterna Play/Stop una vez por pulsación (US5).

### Panel de ajustes

| Elemento             | Rol                          | Nombre accesible                                                         | Historia |
| -------------------- | ---------------------------- | ------------------------------------------------------------------------ | -------- |
| Compás               | `radiogroup` + `radio`       | `Compás`; radios `2/4`, `3/4`, `4/4`, `5/4`, `6/8`, `7/8`, `9/8`, `12/8` | US1      |
| Figura del bajo      | `radiogroup` + `radio`       | `Figura del bajo`; radios `Corcheas`, `Negras`, `Blancas`, `Redondas`    | US2      |
| Octava del bajo      | `radiogroup` + `radio`       | `Octava del bajo`; radios `1`, `2`, `3`                                  | US2      |
| Volumen              | `slider` ×2                  | `Volumen del bajo`, `Volumen del metrónomo` (0–100)                      | US3      |
| Silenciar            | `button` (`aria-pressed`) ×2 | `Silenciar bajo`, `Silenciar metrónomo`                                  | US3      |
| Parar tras N vueltas | `switch`                     | `Parar tras N vueltas`                                                   | US4      |
| Vueltas              | `spinbutton`                 | `Vueltas` (1–999), visible con el switch activado                        | US4      |
| Menos / más vueltas  | `button`                     | `Menos vueltas`, `Más vueltas`                                           | US4      |

### Datos guardados

- `localStorage['countdown-notes:ajustes']` = `{ "version": 1, "settings": { … } }`, con los campos de [data-model](../data-model.md) (Ajustes).
- Los tests de US6 lo escriben directamente para simular datos inválidos o viejos. Es la única forma de poner datos dañados en el dispositivo.
