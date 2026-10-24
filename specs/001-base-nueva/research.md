# Research: Base nueva (Entrega 0)

Fecha: 2026-10-24. Versiones tomadas del registro de npm ese día (`pnpm view <pkg> version`). Cada decisión de stack se comprobó en un proyecto de prueba desechable (scratchpad): plantilla oficial de Vite + las versiones de abajo + `shadcn init` + `tsc -b` + `vite build` + Vitest + oxlint + oxfmt, todo en verde.

## 1. Versiones exactas

- **Decision**: instalar cada dependencia con versión exacta (pedido del usuario). Se fija `saveExact: true` en `pnpm-workspace.yaml`, para que cualquier `pnpm add` futuro también guarde la versión exacta.

  | Paquete                              | Versión | Tipo                                                 |
  | ------------------------------------ | ------- | ---------------------------------------------------- |
  | react, react-dom                     | 19.3.1  | dep                                                  |
  | typescript                           | 7.0.2   | dev                                                  |
  | vite                                 | 8.3.5   | dev                                                  |
  | @vitejs/plugin-react                 | 6.1.2   | dev                                                  |
  | tailwindcss, @tailwindcss/vite       | 4.3.3   | dev                                                  |
  | shadcn (CLI + `shadcn/tailwind.css`) | 4.22.1  | la instala `shadcn init`                             |
  | radix-ui                             | 1.8.1   | la instala `shadcn init`                             |
  | class-variance-authority             | 0.7.1   | la instala `shadcn init`                             |
  | cn                                   | 0.5.0   | la instala `shadcn init`                             |
  | lucide-react                         | 1.61.0  | la instala `shadcn init`                             |
  | tw-animate-css                       | 1.4.0   | la instala `shadcn init`                             |
  | @fontsource-variable/geist           | 5.3.0   | la instala `shadcn init` (preset Nova)               |
  | vitest                               | 5.0.5   | dev                                                  |
  | jsdom                                | 30.1.3  | dev                                                  |
  | @testing-library/react               | 16.3.3  | dev                                                  |
  | @testing-library/dom                 | 10.4.2  | dev (peer de @testing-library/react)                 |
  | @testing-library/user-event          | 14.6.8  | dev                                                  |
  | @playwright/test                     | 1.64.1  | dev                                                  |
  | oxlint                               | 1.89.0  | dev                                                  |
  | oxfmt                                | 0.74.0  | dev                                                  |
  | @types/react, @types/react-dom       | 19.3.0  | dev                                                  |
  | @types/node                          | 24.19.2 | dev (para `vite.config.ts` y `playwright.config.ts`) |

- **Rationale**: son las últimas estables al 2026-10-24, y los peer deps son compatibles entre sí: `@vitejs/plugin-react@6` pide `vite ^8`; `vitest@5` acepta `vite ^8`; `@tailwindcss/vite@4.3.3` acepta `vite ^8`; `@testing-library/react@16` acepta React 19.
- **Alternatives considered**: rangos `^` (descartado por el usuario).

## 2. TypeScript 7 (compilador nativo)

- **Decision**: `typescript@7.0.2`, estable desde el 2026-07-08.
- **Rationale**: el usuario pidió las últimas estables. En la prueba, `tsc -b` con TS 7 pasa sobre la plantilla de Vite, con el alias `@/*` de shadcn y con `vite.config.ts`. `strict` ya viene activo por defecto desde TS 6, pero se escribe explícito en `tsconfig.app.json`, porque la constitución lo exige y así se ve.
- **Riesgo conocido**: la plantilla oficial de Vite (`create-vite@9.3.1`) todavía trae `typescript ~6.0.3`. Nada del stack usa la API de JavaScript de TypeScript: Vite y Vitest transpilan con Oxc, oxlint no depende de `tsc` y shadcn trae su propio parser. Si algo falla con TS 7, se baja a 6.0.3 y se registra.
- **Consecuencia**: TS 7 ya no tiene `baseUrl`. El alias se declara solo con `paths` (`"@/*": ["./src/*"]`), y `shadcn init` lo valida bien así.

## 3. Proyecto base: plantilla oficial de Vite

- **Decision**: partir de `create-vite@9.3.1 --template react-ts`, borrar todo lo de la app vieja y quedarse con la estructura de la plantilla: `tsconfig.json` con referencias a `tsconfig.app.json` y `tsconfig.node.json`, y `build` = `tsc -b && vite build`.
- **Rationale**: es la configuración que mantiene el equipo de Vite para esta versión. Además, la plantilla ya trae oxlint.
- **Se elimina**: `src/` viejo completo, `public/vite.svg`, `tailwind.config.cjs` y `postcss.config.cjs` (Tailwind v4 usa el plugin de Vite), `.prettierrc.json`, y las dependencias `classnames`, `react-countdown-circle-timer`, `zustand`, `postcss` y `autoprefixer`.
- **Zustand**: se quita junto con el código viejo y se vuelve a agregar en la entrega que tenga estado (spec, Assumptions).

## 4. Lint: oxlint

- **Decision**: `.oxlintrc.json` de la plantilla (plugins `react`, `typescript` y `oxc`), más `jsx-a11y` (accesibilidad) y `vitest`. Se agrega un override que apaga `react/only-export-components` en `src/components/ui/**`, porque los componentes de shadcn exportan también sus variantes. Script: `oxlint --deny-warnings`, para que un warning también haga fallar el lint.
- **Ajuste en la implementación**: `vitest/expect-expect` acepta `screen.getBy*` como aserción (`assertFunctionNames: ["expect", "screen.getBy*"]`). En Testing Library, `getBy*` ya falla si no encuentra el elemento. Así los tests quedan en el estilo de Testing Library sin agregar jest-dom, y la regla sigue detectando los tests que no tienen ninguna aserción.
- **Rationale**: `--deny-warnings` deja el chequeo binario (pasa o falla), que es lo que piden FR-005 y FR-008.
- **Alternatives considered**: dejar pasar los warnings (descartado: se acumulan sin que nadie los mire).

## 5. Formato: oxfmt

- **Decision**: `.oxfmtrc.json` generado con `oxfmt --migrate=prettier` desde el `.prettierrc.json` actual: `singleQuote: true`, `semi: false`, `trailingComma: "none"`, `tabWidth: 2`, `printWidth: 80` (el valor que usaba Prettier por defecto; el de oxfmt es 100). Scripts: `format` = `oxfmt` y `format:check` = `oxfmt --check`.
- **Comprobado**: `oxfmt --check` termina con código 1 si hay un archivo sin formatear. Respeta `.gitignore` e ignora `pnpm-lock.yaml`.
- **Hallazgo**: oxfmt también formatea Markdown y YAML. `ignorePatterns` excluye `.specify/**` y `.claude/**`, porque los manejan herramientas que los reescriben al actualizarse. `docs/` y `specs/` sí se formatean, como el resto del repo.
- **Alternatives considered**: escribir `.oxfmtrc.json` a mano (lo mismo, con más riesgo de error).

## 6. Tests de UI: Vitest + jsdom + Testing Library

- **Decision** (jsdom: elegido por el usuario): la configuración de Vitest va en `vite.config.ts` (`/// <reference types="vitest/config" />`), con `environment: 'jsdom'`, `globals: true` e `include: ['src/**/*.test.{ts,tsx}']`. Script: `test` = `vitest run`.
- **Rationale**:
  - `globals: true` solo se usa para que Testing Library limpie el DOM entre tests (detecta el `afterEach` global). Los tests importan `test` y `expect` de `vitest` de forma explícita.
  - El `include` acotado evita que Vitest tome los tests de Playwright (`e2e/*.spec.ts`).
  - `vitest run` termina con un código de salida; en modo watch no terminaría.
- **Sin `@testing-library/jest-dom`**: `getByRole` ya falla si no encuentra el elemento. Se agrega cuando un test necesite matchers como `toBeVisible` o `toBeDisabled`.
- **user-event** se instala porque lo pide el issue #12, aunque la pantalla base todavía no tiene interacción.
- **Alternatives considered**: happy-dom (más rápido, menos fiel); el modo navegador de Vitest (más fiel, pero más lento y con otra API de tests).

## 7. E2E: Playwright

- **Decision**: `playwright.config.ts` con `testDir: 'e2e'` y un `webServer` que corre `pnpm build && pnpm preview --port 4173 --strictPort`, para probar la build de producción, igual a la que publica Vercel. Dos proyectos: `chromium` (Desktop Chrome) e `iphone` (`devices['iPhone 15']`, motor WebKit). Script: `test:e2e` = `playwright test`. Los navegadores se instalan con `pnpm exec playwright install chromium webkit`.
- **Rationale**: el iPhone es un dispositivo objetivo y WebKit es su motor. Así el smoke test detecta antes de publicar problemas propios de Safari, como desbordes o viewport.
- **Qué prueba el smoke test**: en cada proyecto, que el título de la pantalla base se ve, y que en el iPhone no hay desplazamiento horizontal (`scrollWidth <= clientWidth`).
- **Alternatives considered**: solo Chromium (más rápido, pero no ve WebKit).
- **Ajustes en la implementación**: `tsconfig.node.json` incluye `e2e/` y suma la lib `DOM`, porque los callbacks de `page.evaluate` corren en el navegador y usan `document`. Sin `testDir`, Playwright también tomaba `src/App.test.tsx` de Vitest.

## 8. Tema y componentes: shadcn/ui

- **Decision**: `shadcn init -t vite -b radix -p nova` (radix, porque el diseño dice "componentes sobre Radix"; preset Nova con Geist, elegido por el usuario).
  - El tema es solo oscuro: se usa el mecanismo de shadcn (clase `.dark`), con `class="dark"` fija en `<html>`, para que las variantes `dark:` de los componentes apliquen. Se borra el bloque claro de `:root`, y se escribe `color-scheme: dark`.
  - Tokens en `.dark`:
    - `--background` casi negro;
    - `--foreground` casi blanco;
    - `--primary` = ámbar `#f5a524`, con `--primary-foreground` casi negro;
    - `--ring` ámbar.
  - El título usa Geist en peso 900 (`font-black`).
- **Componente en la pantalla base**: un `Badge` de shadcn (variante por defecto, que usa el ámbar) con un texto corto. Sirve como prueba visible de que los componentes toman el tema (US4, escenario 2), y es un elemento informativo, no un control. Se borra `button.tsx`, que genera `shadcn init`: hoy no se usa, y la entrega 1 lo vuelve a agregar con `shadcn add button`.
- **Rationale**: no tener una clase `dark` dejaría sin efecto las variantes `dark:` de los componentes de shadcn, y se verían con estilos del tema claro sobre el fondo oscuro.
- **Alternatives considered**: tokens oscuros directamente en `:root`, sin `.dark` (descartado por lo anterior); un `Button` en la pantalla base (descartado: sería un control sin función).

## 9. HTML base y iPhone

- **Decision**: en `index.html`:
  - `lang="es"` y `class="dark"`;
  - título "Countdown Notes";
  - `<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">`;
  - `<meta name="theme-color" content="<fondo>">`;
  - padding con `env(safe-area-inset-*)` en el contenedor de la pantalla.
- **Favicon**: no hay en esta entrega; los íconos llegan con la PWA (entrega 7).
- **Rationale**: FR-017 pide que el contenido no quede tapado por la muesca ni se desborde. `viewport-fit=cover` junto con los safe-area insets es la forma estándar en Safari iOS.

## 10. pnpm

- **Decision**: `pnpm-workspace.yaml` queda solo con `saveExact: true`. Se borra la entrada `allowBuilds: esbuild: set this to true or false`: es un marcador que dejó pnpm 11 por el esbuild de Vite 3, y con el stack nuevo ninguna dependencia necesita scripts de instalación (en la prueba, pnpm no pidió ninguno). Los navegadores de Playwright se instalan con su propio comando.

## 11. Vercel

La investigación se hizo con fuentes primarias el 2026-10-24: la documentación de Vercel, el código de `vercel/vercel` y las notas de pnpm.

- **Decision**:
  - En `package.json`: `"packageManager": "pnpm@11.28.7"` y `"engines": { "node": "24.x" }`.
  - Un `vercel.json` mínimo:

    ```json
    {
      "$schema": "https://openapi.vercel.sh/vercel.json",
      "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
    }
    ```

  - Nada en el panel de Vercel.
- **Rationale**:
  - **pnpm**: sin la fijación, un proyecto nuevo en Vercel con `lockfileVersion: '9.0'` usa pnpm 10. Vercel lee `packageManager` y antepone el pnpm de esa versión mayor que trae su imagen de build, sin necesidad de Corepack. Corepack solo se activa con una variable de entorno del panel, y eso está descartado.
  - **Node**: 24.x es el valor por defecto y la última LTS en Vercel. `engines.node` la fija desde el repo. pnpm 11 necesita Node 22 o superior.
  - **Preset de Vite**: Vercel lo detecta solo, con salida en `dist/`. Como `package.json` tiene un script `build`, Vercel corre ese script (`tsc -b && vite build`). No hacen falta `buildCommand`, `outputDirectory` ni `installCommand`.
  - **Rewrite**: es el ejemplo oficial de Vite en Vercel. Los archivos estáticos que existen tienen prioridad sobre el catch-all.
  - **Fechas de publicación**: pnpm 11 trae `minimumReleaseAge` de 1 día por defecto. Todas las versiones de §1 se publicaron hace al menos 3 días, así que no las bloquea.
- **Lockfile**: el lockfile que está en `HEAD` es `lockfileVersion 5.4`, y con él Vercel usaría pnpm 7. El lockfile nuevo (9.0) MUST entrar en el commit.
- **Riesgos sin verificar** (solo los confirma el primer deploy):
  - Que la imagen de build de Vercel traiga pnpm 11. La documentación dice que soporta pnpm 6 a 12, pero hay reportes mixtos. Si no lo trae, pnpm 10 debería descargar la versión fijada (`manage-package-manager-versions`), pero es una inferencia.
  - Que el `pnpm-workspace.yaml` sin `packages` no rompa la instalación en Vercel. Con un pnpm viejo, el error sería `packages field missing or empty`. Si aparece, se agrega `packages: ['.']`.
  - Si el primer deploy falla, el log de build muestra qué pnpm detectó: "Detected `pnpm-lock.yaml` … generated by pnpm@…".
- **Alternatives considered**:
  - Corepack con `ENABLE_EXPERIMENTAL_COREPACK=1` (descartado: requiere el panel; además, un reporte de junio de 2026 dice que igual instala pnpm 10).
  - `devEngines.packageManager` (descartado: el soporte de Vercel sigue en un PR abierto).
  - `vercel.json` con `build.env` (descartado: Vercel lo desaconseja y no hay evidencia de que active Corepack).
