# Contratos: Base nueva (Entrega 0)

Esta entrega no tiene API ni datos. Su interfaz pública son los comandos del proyecto, la pantalla base que ven los tests y la publicación en Vercel.

## 1. Comandos (`package.json` → `scripts`)

Cada comando termina con código 0 si todo está bien, y con un código distinto de 0 si algo falla.

| Comando | Qué hace | Falla cuando |
|---|---|---|
| `pnpm dev` | Arranca la app en modo desarrollo | — (queda corriendo) |
| `pnpm build` | Verifica tipos (`tsc -b`) y genera `dist/` con solo estáticos | Hay un error de tipos o de build |
| `pnpm preview` | Sirve `dist/` localmente | — (queda corriendo) |
| `pnpm lint` | `oxlint --deny-warnings` sobre todo el repo | Hay cualquier error o warning de lint |
| `pnpm format` | `oxfmt`: formatea y escribe | — |
| `pnpm format:check` | `oxfmt --check`: revisa sin escribir | Hay un archivo sin formatear |
| `pnpm test` | `vitest run`: tests de UI (`src/**/*.test.{ts,tsx}`) | Falla un test |
| `pnpm test:e2e` | `playwright test`: smoke test en Chromium y en iPhone (WebKit) contra la build de producción | Falla un test |

## 2. Pantalla base (lo que los tests pueden buscar)

Los tests buscan por rol y texto accesible, nunca por clases ni por estructura.

| Elemento | Rol | Nombre accesible |
|---|---|---|
| Título de la app | `heading`, nivel 1 | `Countdown Notes` |
| Texto de presentación | texto (párrafo) | Una frase corta en español. El texto exacto lo decide el builder. |
| Badge informativo | texto (no es un control) | Una etiqueta corta en español, con el acento ámbar |

Reglas:
- La pantalla no tiene controles (no hay `button`, `link` ni `textbox`).
- `<html lang="es">`.
- Siempre se ve en tema oscuro, sin importar la preferencia del sistema.

## 3. Publicación (Vercel)

| Petición | Respuesta |
|---|---|
| `GET /` por HTTPS | La pantalla base |
| `GET /cualquier/ruta` | La misma app (`index.html`), no un 404 |
| `GET /assets/*` | El archivo estático de la build |

No hay funciones de servidor. La configuración vive en el repo (`vercel.json`), sin ajustes en el panel de Vercel.
