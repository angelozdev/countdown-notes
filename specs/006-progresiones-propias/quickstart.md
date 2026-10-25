# Quickstart: validar Progresiones propias (Entrega 5)

## Requisitos

Los mismos de la [entrega 4](../005-modo-progresion/quickstart.md): Node 24, pnpm 11, `pnpm install`, los navegadores de Playwright, audífonos o parlantes, la guitarra y un iPhone con iOS 17 o superior.

## 1. Chequeos automáticos

```sh
pnpm lint
pnpm format:check
pnpm test        # proyectos ui (jsdom) y audio (Chromium + WebKit)
pnpm test:e2e    # chromium e iphone, contra la build de producción
pnpm build
```

Resultado esperado: los 5 comandos en verde. Entre ellos:

- `src/music/progression-text.test.ts`: los 25 tipos sobre las 12 raíces, los alias y los errores ([contracts](./contracts/interfaces.md) §3, **SC-001**).
- Los tests de UI de US1 y US3: la misma progresión escrita, tocada y de la biblioteca da el mismo `fake.played` (**SC-002**).
- Proyecto `audio`, `src/practice/progression.browser.test.ts`: una propia con compases partidos, cada ataque a menos de 1 ms (**SC-003**).
- Los tests de US2 con datos escritos a mano: las progresiones válidas se conservan y las rotas se descartan sin error (**SC-004**).
- Los tests de las entregas 1 a 4 siguen en verde sin tocarlos.
- E2E: crear, guardar y recargar en WebKit; el editor a 320 px sin scroll horizontal.
- `pnpm build`: anotar el tamaño del bundle antes y después (research §12).

## 2. Prueba en el computador (`pnpm dev`)

| #   | Historia | Acción                                                                              | Resultado esperado                                                                       |
| --- | -------- | ----------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| 1   | US1      | Modo progresión, ajustes, "Nueva progresión"                                        | Se abre el editor a pantalla completa; la pantalla de práctica no está                   |
| 2   | US1      | Escribir `Dm7 G7 Cmaj7 Cmaj7`                                                       | El carril del editor muestra los 4 compases mientras se escribe                          |
| 3   | US1      | Escribir un espacio con la música sonando                                           | Se escribe el espacio; la música no se detiene                                           |
| 4   | US1      | Agregar `Hm7`                                                                       | El campo se marca, el mensaje dice «Hm7», el carril no cambia y "Guardar" se desactiva   |
| 5   | US1      | Corregirlo, "Guardar", "Listo", Play                                                | Suena el ii–V–I; arriba, `Progresión 1 · Do mayor · …`                                   |
| 6   | US1      | "Nueva progresión", escribir algo, "Listo"                                          | Pregunta "Cambios sin guardar"; con "Descartar cambios", vuelve la progresión anterior   |
| 7   | US2      | Escribir `Am G F E`, tonalidad La menor, nombre "Andaluza mía", "Guardar", recargar | Está en "Mis progresiones", primero; arriba, `Andaluza mía · La menor · …`               |
| 8   | US2      | Con la tónica en Do, elegir "Andaluza mía"                                          | La tónica pasa a La; suena `Am · G · F · E`                                              |
| 9   | US2      | Elegir la tónica Do                                                                 | `Cm · B♭ · A♭ · G`, `Do menor`                                                           |
| 10  | US2      | "Editar progresión", cambiar un compás, Play en el editor                           | Suena el cambio; al recargar sin guardar, sigue la versión guardada                      |
| 11  | US2      | Con la música sonando, cambiar un compás y "Listo" → "Descartar cambios"            | La vuelta siguiente vuelve a la versión guardada, sin cortar                             |
| 12  | US2      | Renombrar y guardar; después "Borrar progresión" y confirmar                        | El nombre nuevo aparece en el selector; al borrarla, desaparece y queda el ii–V–I mayor  |
| 13  | US3      | Progresión nueva: "Agregar compás" ×4, tocar cada uno y elegir raíz y tipo          | El texto se reescribe: `Dm7 \| G7 \| Cmaj7 \| Cmaj7`; suena igual que escrita            |
| 14  | US3      | Abrir "Tipo de acorde" en el selector de un compás                                  | Las mismas familias, en el mismo orden, que en ajustes                                   |
| 15  | US4      | Escribir `Cmaj7 \| C7 A7 \| Dm7 G7`, redondas, "Bajo + acorde"                      | Los compases 2 y 3 partidos; el bajo y el acorde cambian en el tiempo 3                  |
| 16  | US4      | El mismo, en 3/4                                                                    | El segundo acorde entra en el tiempo 3 (2 + 1); la primera parte se ve el doble de ancha |
| 17  | US4      | Tocando: "Partir" un compás, cambiar la parte 2, "Unir"; "Duplicar" otro            | Las dos partes, después una; el duplicado aparece justo después                          |

## 3. Prueba en el iPhone

Abrir la app desde la URL de Vercel (vista previa de la rama) o con `pnpm build && pnpm preview --host`.

1. Escribir con el teclado del iPhone `dm7 g7 cmaj7 cmaj7` (con la mayúscula automática o sin ella): se reconoce. Con el teclado abierto, el campo y la primera fila del carril se ven a la vez.
2. Armar tocando el blues de jazz de 12 compases, con los dos compases partidos, en menos de 3 minutos (**SC-005**).
3. Guardar, cerrar Safari del todo y volver a abrir: la progresión sigue ahí.
4. En una pestaña privada: la app funciona y guarda hasta cerrarla, sin errores.

## 4. Prueba de oído

10 minutos con una propia de compases partidos, a 60 y a 200 BPM, con "Bajo + acorde": los cambios de medio compás caen a tiempo, como en la biblioteca (constitución, principio III).

## 5. Cierre

Tocar con la guitarra sobre una progresión propia, en su tonalidad y en otra (**SC-006**).

- Los issues #33–#36 y #6 se cierran al quedar en verde en `main` (constitución v1.2.0), con el comentario de lo que falta probar a mano.
- Si una prueba de esta guía falla, se reabre el issue de esa historia.
