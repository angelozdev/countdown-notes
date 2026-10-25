# Quickstart: validar Modo progresión con biblioteca (Entrega 4)

## Requisitos

Los mismos de la [entrega 3](../004-acordes-aleatorio/quickstart.md): Node 24, pnpm 11, `pnpm install`, los navegadores de Playwright (`pnpm exec playwright install chromium webkit`), audífonos o parlantes, la guitarra y un iPhone con iOS 17 o superior.

## 1. Chequeos automáticos

```sh
pnpm lint
pnpm format:check
pnpm test        # proyectos ui (jsdom) y audio (Chromium + WebKit)
pnpm test:e2e    # chromium e iphone, contra la build de producción
pnpm build
```

Resultado esperado: los 5 comandos en verde. Entre ellos:

- `src/music/progressions.test.ts`: las 21 progresiones en las 12 tónicas, con sus compases y su grafía (**SC-002**).
- `src/music/chords.test.ts`: el movimiento de voces de FR-007 en los pares de la biblioteca (**SC-004**), y los 300 acordes de la entrega 3 sin cambios.
- Proyecto `audio`, `src/practice/progression.browser.test.ts`: cada cambio de acorde, también los de mitad de compás, a menos de 1 ms de su momento, y nada en la cuenta ni después del final (**SC-001**).
- Los tests de UI de las entregas 1 a 3 siguen en verde: el modo aleatorio no cambia.
- E2E: los compases partidos de Giant Steps en Fa♯ caben a 320 px.
- `pnpm build`: anotar el tamaño del bundle antes y después de tonal (research §1).

## 2. Prueba en el computador (`pnpm dev`)

| #   | Historia | Acción                                              | Resultado esperado                                                                                                         |
| --- | -------- | --------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| 1   | US1      | Abrir ajustes con los datos borrados                | Modo "Aleatorio"; la práctica suena como en la entrega 3                                                                   |
| 2   | US1      | Modo "Progresión", Play                             | Cuenta y después Dm7 · G7 · Cmaj7 · Cmaj7 en loop; el carril muestra los 4 compases; arriba, `ii–V–I mayor · Do mayor · …` |
| 3   | US1      | Mirar abajo mientras suena                          | `Vuelta 2 · compás 3 de 4`; desde el último compás, la vista previa `Vuelta 3: Dm7`                                        |
| 4   | US1      | "Bajo + acorde"                                     | Los acordes se mueven poco entre sí: el ii–V–I suena ligado, sin saltos de registro                                        |
| 5   | US1      | "Parar tras N vueltas" con 2                        | `Vuelta 1 de 2…`; se detiene sola al final de la segunda                                                                   |
| 6   | US1      | Mientras suena, volver a "Aleatorio"                | La práctica se detiene                                                                                                     |
| 7   | US2      | Tonalidad Fa, Play                                  | `Gm7 · C7 · Fmaj7 · Fmaj7`; arriba, `Fa mayor`                                                                             |
| 8   | US2      | Tonalidad Si                                        | `C♯m7 · F♯7 · Bmaj7`                                                                                                       |
| 9   | US2      | Mientras suena en Do, elegir Mi♭ a mitad de vuelta  | La vuelta en curso sigue en Do; la siguiente suena y se ve en Mi♭, y la vista previa ya lo anuncia                         |
| 10  | US3      | Abrir "Progresión"                                  | Jazz (11) y Pop, rock y latino (6), en el orden de FR-018                                                                  |
| 11  | US3      | Blues de jazz, redondas en el bajo, "Bajo + acorde" | Compases 11 y 12 partidos (`C7 A7`, `Dm7 G7`); bajo y acorde cambian a mitad de compás; "Ahora" cambia con ellos           |
| 12  | US3      | Mismo blues en 3/4                                  | Los compases partidos suenan 2 + 1 tiempos y el carril muestra la primera parte el doble de ancha                          |
| 13  | US3      | Cadencia andaluza en La, después en Do              | `Am · G · F · E`; en Do, `Cm · B♭ · A♭ · G`, y arriba `Do menor`                                                           |
| 14  | US3      | Mientras suena, elegir otra progresión              | La práctica se detiene                                                                                                     |
| 15  | US4      | Ciclo de cuartas desde Fa, "Bajo + acorde", tipo m7 | `Fm7 ×2 · B♭m7 ×2 · …`, 24 compases; aparece "Tipo de acorde", que en el blues no estaba                                   |
| 16  | US4      | ii–V–I por las 12 desde Do                          | 48 compases, por cuartas: `Gm7 C7 Fmaj7` en el compás 5; `A♭m7 D♭7 G♭maj7` en el 25                                        |
| 17  | US1–US4  | Elegir modo, progresión y tonalidad, y recargar     | Todo sigue igual; los ajustes de la entrega 3 también                                                                      |

## 3. Prueba en el iPhone

Abrir la app desde la URL de Vercel (vista previa de la rama) o con `pnpm build && pnpm preview --host`.

1. ii–V–I por las 12 a 200 BPM con "Bajo + acorde" y Pad ambiental: dejarlo sonar una vuelta completa (48 compases). Sin cortes ni chasquidos, y el carril se desplaza solo.
2. Giant Steps en Fa♯ en vertical: los compases partidos se leen en el carril.

## 4. Prueba de oído

10 minutos en el computador y en el iPhone, a 60 y a 200 BPM, con el blues de jazz y Giant Steps: los cambios de medio compás caen a tiempo y el bajo no se atrasa (constitución, principio III).

## 5. Cierre

Tocar con la guitarra sobre un ii–V–I en varias tonalidades y sobre un blues (SC-005).

- Los issues #29–#32 y #5 se cierran al quedar en verde en `main` (constitución v1.2.0), con el comentario de lo que falta probar a mano.
- Si una prueba de esta guía falla, se reabre el issue de esa historia.
