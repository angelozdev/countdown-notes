# Quickstart: validar Acordes en modo aleatorio (Entrega 3)

## Requisitos

Los mismos de la [entrega 2](../003-practica-comoda/quickstart.md): Node 24, pnpm 11, `pnpm install`, los navegadores de Playwright (`pnpm exec playwright install chromium webkit`), audífonos o parlantes, la guitarra y un iPhone con iOS 17 o superior.

## 1. Chequeos automáticos

```sh
pnpm lint
pnpm format:check
pnpm test        # proyectos ui (jsdom) y audio (Chromium + WebKit)
pnpm test:e2e    # chromium e iphone, contra la build de producción
pnpm build
```

Resultado esperado: los 5 comandos en verde. Entre ellos:

- `src/music/chords.test.ts`: los 300 acordes (12 raíces por 25 tipos) cumplen FR-005 y FR-007 a FR-009 (**SC-002** y **SC-003**).
- Proyecto `audio`:
  - **SC-001**: en los dos estilos, un ataque del acorde por compás, a menos de 1 ms del inicio, y ninguno en la cuenta ni después del final;
  - **SC-005**: con la mezcla por defecto y con los tres canales al máximo, en los dos estilos y con el acorde más denso, ninguna muestra pasa de 1,0;
  - el cambio de estilo deja terminar la caída del estilo anterior.
- E2E: el cifrado más largo cabe en "Ahora" y en el carril a 320 px de ancho (**SC-003**).

## 2. Prueba en el computador (`pnpm dev`)

| #   | Historia | Acción                                                               | Resultado esperado                                                                                                 |
| --- | -------- | -------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| 1   | US1      | Abrir ajustes en una app recién instalada (o con los datos borrados) | "Qué suena" en "Solo bajo"; no se ven el tipo de acorde ni el volumen del acorde; suena como en la entrega 2       |
| 2   | US1      | "Bajo + acorde", tipo Cm, Play                                       | Cada compás empieza con el acorde menor de su nota y se sostiene; "Ahora" muestra, por ejemplo, `Fm` y `Fa menor`  |
| 3   | US1      | Mirar el carril                                                      | Cada compás muestra su cifrado (`D♭m`, `Am`…); la vista previa de la vuelta siguiente, también                     |
| 4   | US1      | Mientras suena, pasar de Cm a C a mitad de compás                    | El compás en curso sigue menor; el siguiente suena mayor y "Ahora" cambia con él                                   |
| 5   | US1      | Mover el volumen del acorde y silenciarlo                            | El cambio se oye al instante; silenciado, sigue el bajo y la práctica no se detiene                                |
| 6   | US1      | Subir los tres volúmenes al máximo, en la octava 1 del bajo          | Más fuerte, pero sin el crujido digital de la entrega 2 (#22)                                                      |
| 7   | US2      | Abrir el selector de tipo                                            | 5 familias con sus 25 tipos, en el orden de FR-005                                                                 |
| 8   | US2      | Tocar Cm7, C7alt y C13 sobre la vuelta                               | Suenan distintos entre sí, sin la raíz en el acorde, y ninguno muy grave ni muy agudo                              |
| 9   | US2      | Con las notas F♯ y B♭ y el tipo m(maj7), Play en una ventana angosta | `F♯m(maj7)` y `B♭m(maj7)` caben completos en "Ahora" y en el carril                                                |
| 10  | US3      | Ajustes → Estilo Pad ambiental, con la música detenida               | Arriba dice `Aleatorio · Pad ambiental · …`                                                                        |
| 11  | US3      | Play en Pad ambiental, con "Bajo + acorde"                           | Bajo y acorde suaves, el acorde entra lento y deja una cola larga                                                  |
| 12  | US3      | Mientras suena, pasar a Analógico cálido a mitad de compás           | El compás siguiente suena cálido; la cola del Pad termina sola, sin cortes; arriba cambia el estilo con ese compás |
| 13  | US3      | "Parar tras N vueltas" con 1, en Pad ambiental                       | Al terminar, la música se detiene. Anotar si el corte de la cola del reverb se oye (research §12)                  |
| 14  | US1, US3 | Cambiar "qué suena", tipo, estilo y volumen del acorde, y recargar   | Todo sigue igual; los ajustes de la entrega 2 también                                                              |

## 3. Prueba en el iPhone

Abrir la app desde la URL de Vercel (vista previa de la rama) o con `pnpm build && pnpm preview --host`.

1. "Bajo + acorde", Cm7, Pad ambiental, 12/8 a 240 BPM con corcheas en el bajo: dejarla sonar 5 minutos. No hay cortes ni chasquidos. Si los hay, aplicar el plan B de [research](./research.md) §4: crear solo la cadena del estilo en uso.
2. Con el parlante del iPhone, el acorde se oye en los dos estilos y el bajo sigue oyéndose en la octava 3.
3. El cifrado más largo cabe en "Ahora" en vertical.

## 4. Prueba de oído

En el computador y en el iPhone, 2 minutos con cada estilo, con estos acordes: una tríada, Cm7, C7, Cmaj7, C13 y C7alt.

- **Resultado esperado**: los voicings suenan bien, se distingue cada tipo, el acorde no tapa al bajo ni al metrónomo, y ningún estilo suena saturado.
- **Si hay que ajustar niveles**: se cambian los de research §4 (`PolySynth`, bajo del Pad o `BASE_DB.chord`) y se anotan ahí.

## 5. Cierre

Tocar con la guitarra sobre acordes de séptima en los dos estilos (SC-006).

- Los issues #26–#28 y #4 se cierran al quedar en verde en `main` (constitución v1.2.0), con el comentario de lo que falta probar a mano.
- Si una prueba de esta guía falla, se reabre el issue de esa historia.
