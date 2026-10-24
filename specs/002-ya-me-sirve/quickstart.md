# Quickstart: validar "Ya me sirve" (Entrega 1)

## Requisitos

- Node 24 y pnpm 11 (como en la entrega 0).
- `pnpm install`.
- Navegadores de Playwright: `pnpm exec playwright install chromium webkit`. Los usan el E2E y el proyecto `audio` de Vitest.
- Para las pruebas manuales: audífonos o parlantes, la guitarra, y un iPhone con iOS 17 o superior.

## 1. Chequeos automáticos

```sh
pnpm lint
pnpm format:check
pnpm test        # proyectos ui (jsdom) y audio (Chromium + WebKit)
pnpm test:e2e    # chromium e iphone, contra la build de producción
pnpm build
```

Resultado esperado: los 5 comandos terminan en verde. En `pnpm test`, el proyecto `audio` incluye el test de precisión (SC-002): a 30, 60, 200 y 240 BPM, cada golpe y cada ataque del bajo cae a menos de 1 ms de su momento teórico, en los dos navegadores.

## 2. Prueba en el computador (`pnpm dev`)

Abrir la dirección que muestra `pnpm dev`.

| #   | Historia | Acción                                                 | Resultado esperado                                                                                                                                                                           |
| --- | -------- | ------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | US1      | Tocar Play                                             | Cuenta de entrada de 4 golpes y después el metrónomo, con el tiempo 1 más agudo y fuerte                                                                                                     |
| 2   | US1      | Tocar Stop durante la cuenta y durante la música       | Se calla al instante y el botón vuelve a decir Play                                                                                                                                          |
| 3   | US2      | Arriba de la pantalla                                  | `Aleatorio · Analógico cálido · 60 BPM · 4/4`, sin controles de ajuste                                                                                                                       |
| 4   | US2      | Abrir Ajustes mientras suena, subir a 120 BPM y cerrar | El tempo cambia en el siguiente tiempo, sin cortes; la música nunca se detiene; arriba dice `120 BPM`                                                                                        |
| 5   | US2      | Escribir 300 y luego 10 en el BPM                      | Queda en 240 y en 30                                                                                                                                                                         |
| 6   | US3      | Play con los valores por defecto                       | Tras la cuenta, el bajo ataca en cada tiempo 1; la nota cambia cada 2 compases; "Ahora" muestra la nota y su nombre                                                                          |
| 7   | US3      | Escuchar 2 vueltas completas                           | Ninguna nota se repite dentro de una vuelta, ni dos veces seguidas al cambiar de vuelta                                                                                                      |
| 8   | US3      | Mientras suena, cambiar compases por nota a 4          | La vuelta en curso sigue con 2; la siguiente usa 4                                                                                                                                           |
| 9   | US4      | "Excluir alteradas" y Play                             | Solo salen las 7 naturales                                                                                                                                                                   |
| 10  | US4      | Dejar 1 sola nota                                      | Play deshabilitado y el aviso `Elige al menos 2 notas para tocar.`                                                                                                                           |
| 11  | US5      | Play y mirar desde 1–2 m, sin tocar                    | Cuenta regresiva 4-3-2-1 en "Ahora"; carril en filas de 4 con el compás actual resaltado, barra y marcas de tiempo; compases tocados y lejanos atenuados; contador `Vuelta 1 · nota 1 de 12` |
| 12  | US5      | Esperar la última nota de la vuelta                    | Al final del carril aparece `Vuelta 2: {nota}`, distinta de la última                                                                                                                        |
| 13  | US5      | Compases por nota en 16 y Play                         | El carril se desplaza solo y el compás actual siempre está a la vista                                                                                                                        |

## 3. Prueba en el iPhone

Abrir la app desde la URL de Vercel. El usuario hace push de la rama; Vercel publica una vista previa por HTTPS. Otra opción es `pnpm build && pnpm preview --host` y abrir la IP del computador en la misma red.

1. Activar el interruptor de silencio, tocar Play y comprobar que el metrónomo y el bajo se oyen (SC-006). Si no se oyen, aplicar el plan B de [research](./research.md) §5.
2. Comprobar que la pantalla se lee a 1–2 m en vertical, sin zoom ni desplazamiento horizontal (SC-005).
3. Mientras no exista la entrega 2, alargar el bloqueo automático del iPhone (Ajustes → Pantalla y brillo) para que la pantalla no se apague.

## 4. Prueba de oído (SC-003)

Tocar 10 minutos a 60 BPM y 10 minutos a 200 BPM, en el computador y en el iPhone. Mientras tanto:

- abrir y cerrar Ajustes;
- en el computador, cambiar de pestaña y volver.

Resultado esperado: no se percibe desfase, temblor, cortes ni golpes de más o de menos, y al volver la pantalla muestra el compás que suena.

## 5. Cierre

Tocar encima con la guitarra. Si la app "ya sirve" (SC-008), el usuario cierra los issues #15–#19 y #2.
