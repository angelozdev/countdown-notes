# Quickstart: validar Práctica cómoda (Entrega 2)

## Requisitos

Los mismos de la [entrega 1](../002-ya-me-sirve/quickstart.md): Node 24, pnpm 11, `pnpm install`, los navegadores de Playwright (`pnpm exec playwright install chromium webkit`), audífonos o parlantes, la guitarra y un iPhone con iOS 17 o superior.

## 1. Chequeos automáticos

```sh
pnpm lint
pnpm format:check
pnpm test        # proyectos ui (jsdom) y audio (Chromium + WebKit)
pnpm test:e2e    # chromium e iphone, contra la build de producción
pnpm build
```

Resultado esperado: los 5 comandos en verde. En `pnpm test`, el proyecto `audio` incluye:

- **SC-001**: en cada uno de los 8 compases, cada golpe cae a menos de 1 ms de su momento teórico, con acento fuerte, suave o ninguno donde corresponde.
- **SC-002**: los ataques del bajo en posiciones fraccionarias (corcheas en los simples) a menos de 1 ms.
- Un canal silenciado no suena, y la cuenta de entrada suena con el metrónomo silenciado.
- **SC-004**: después del último compás de la última vuelta, no suena nada.

## 2. Prueba en el computador (`pnpm dev`)

| #   | Historia | Acción                                                                                                | Resultado esperado                                                                                                                              |
| --- | -------- | ----------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | US1      | Ajustes → Compás 3/4 y Play                                                                           | Cuenta de 3 golpes (3-2-1 en "Ahora"); 3 golpes por compás con el 1 acentuado; 3 marcas por compás en el carril; arriba dice `3/4`              |
| 2   | US1      | Compás 6/8 y Play a 60 BPM                                                                            | 6 clicks por compás, 3 por segundo; fuerte en el 1 y suave en el 4; cuenta 2-1; 2 marcas por compás                                             |
| 3   | US1      | Compás 7/8 y Play a 60 BPM                                                                            | 7 clicks por compás, uno por segundo; fuerte en el 1 y suave en el 3 y el 5; cuenta 3-2-1; 3 marcas                                             |
| 4   | US1      | Mientras suena en 4/4, cambiar a 3/4                                                                  | La vuelta en curso sigue en 4/4; la siguiente suena y se ve en 3/4                                                                              |
| 5   | US2      | Figura Corcheas, Negras, Blancas y Redondas en 4/4                                                    | El bajo ataca 8, 4, 2 y 1 veces por compás                                                                                                      |
| 6   | US2      | Figura Negras en 6/8                                                                                  | El bajo ataca 2 veces por compás, en los acentos                                                                                                |
| 7   | US2      | Mientras suena, octava 3 y luego 1                                                                    | Desde el compás siguiente, el bajo sube una octava; después baja dos                                                                            |
| 8   | US3      | Mientras suena, mover el volumen del bajo y del metrónomo                                             | El cambio se oye al instante, sin cortes                                                                                                        |
| 9   | US3      | Silenciar el metrónomo, Stop y Play                                                                   | La cuenta de entrada suena; después solo suena el bajo; el carril y el contador siguen                                                          |
| 10  | US4      | Activar "Parar tras N vueltas" con 1, compases por nota 1, Play                                       | Contador `Vuelta 1 de 1 · nota 1 de 12`; no aparece vista previa de la vuelta 2; al terminar la vuelta, la música se detiene sola y vuelve Play |
| 11  | US5      | Play y Stop con la barra espaciadora, con el foco en Play y en Ajustes                                | Alterna una vez por pulsación y la página no se desplaza                                                                                        |
| 12  | US5      | Con el panel abierto, pulsar espacio                                                                  | No hace Play/Stop                                                                                                                               |
| 13  | US5      | Mientras suena, `Subir 5 BPM` en la pantalla de práctica                                              | El tempo sube 5 desde el golpe siguiente; arriba se actualiza                                                                                   |
| 14  | US6      | Cambiar todos los ajustes y recargar                                                                  | Todos siguen igual; la app abre detenida                                                                                                        |
| 15  | US6      | En las DevTools, poner `{"version":1,"settings":{"bpm":500}}` en `countdown-notes:ajustes` y recargar | La app abre sin errores, con BPM 60 y los demás valores por defecto                                                                             |

## 3. Prueba en el iPhone

Abrir la app desde la URL de Vercel (vista previa de la rama) o con `pnpm build && pnpm preview --host`.

1. Poner el bloqueo automático en 30 s (Ajustes → Pantalla y brillo), tocar Play y dejarla sonar 15 minutos sin tocarla: la pantalla no se apaga (SC-005). Después de Stop, se apaga a los 30 s. Si no se mantiene encendida, aplicar el plan B de [research](./research.md) §10.
2. Mientras suena, cambiar a otra app y volver: la pantalla vuelve a mantenerse encendida.
3. Con la octava 1, 2 y 3, comprobar que el bajo se oye en el parlante del iPhone, al menos en la 3.
4. Cerrar la pestaña, volver a abrir la app y comprobar que los ajustes siguen.

## 4. Prueba de oído (SC-001, SC-003)

Tocar 2 minutos en cada compás, a 60 BPM y a 200 BPM, en el computador y en el iPhone. Resultado esperado: el agrupamiento se oye claro (fuerte, suave y sin acento), y no hay desfase, cortes ni golpes de más o de menos.

## 5. Cierre

Tocar encima con la guitarra en un compás que no sea 4/4, cerrar la app y volver a abrirla. Si no hubo que reajustar nada (SC-008), el usuario cierra los issues #20–#25 y #3.
