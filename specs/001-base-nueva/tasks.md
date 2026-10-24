---

description: "Lista de tareas de la Entrega 0 · Base nueva"
---

# Tasks: Base nueva (Entrega 0)

**Input**: Documentos de diseño en `specs/001-base-nueva/`: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [contracts/interfaces.md](./contracts/interfaces.md) y [quickstart.md](./quickstart.md).

**Tests**: se incluyen, porque la constitución exige test-first (principio I). Cada test se escribe primero y se ve fallar antes de implementar.

**Organización**: una fase por historia (sub-issue). Toda la entrega es la excepción nombrada "preparación compartida" (issue #1).

**Reglas que aplican a todas las tareas**:
- Todo en la rama `001-base-nueva`; nunca en `main` y nunca push.
- Commit después de cada paso en verde, con el número de issue en el mensaje (por ejemplo, `#10`).
- Toda dependencia se instala con versión exacta (`pnpm add -E`, más `saveExact: true`), usando las versiones de research.md §1.
- Nunca se debilita, salta ni borra un test para que pase. Si un test parece incorrecto, se consulta al usuario.
- Los tests buscan por rol y texto accesible ([contracts](./contracts/interfaces.md) §2), nunca por clases.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: se puede hacer en paralelo (otro archivo, sin depender de tareas pendientes).
- **[Story]**: la historia del spec (US1–US5). Entre paréntesis va su issue.

---

## Phase 1: Setup (preparación compartida)

**Purpose**: rama de trabajo, borrar la app vieja y dejar la plantilla de Vite con versiones exactas.

- [X] T001 Crear la rama `001-base-nueva` desde `main` con `git switch -c 001-base-nueva`. Los cambios sin commitear pasan con ella.
- [X] T002 Borrar de `.specify/memory/constitution.md` el bloque de comentario HTML `<!-- Sync Impact Report ... -->` del inicio (la constitución dice que se borra antes del commit). Después commitear el material de planificación: `docs/`, `specs/001-base-nueva/`, `.specify/`, `.claude/` y `.gitignore`. `pnpm-lock.yaml` y `pnpm-workspace.yaml` no van en este commit: se rehacen en T005. Mensaje: `docs: spec, plan y tareas de la entrega 0 (#1)`.
- [X] T003 Borrar la app vieja:
  - `src/` completo;
  - `public/` (solo tiene `vite.svg`);
  - `tailwind.config.cjs` y `postcss.config.cjs`;
  - `tsconfig.json` y `tsconfig.node.json`;
  - `vite.config.ts` e `index.html`.

  `.prettierrc.json` se queda hasta T014.
- [X] T004 Generar la plantilla oficial en el scratchpad, con `pnpm create vite@9.3.1 <scratchpad>/vite-template --template react-ts --no-interactive`. Copiar a la raíz solo `index.html`, `tsconfig.json`, `tsconfig.app.json`, `tsconfig.node.json` y `vite.config.ts`. No copiar `README.md`, `public/`, `src/` ni `.oxlintrc.json`. Después:
  - en `index.html`: cambiar `lang="en"` por `lang="es"`, poner `<title>Countdown Notes</title>` y borrar la línea `<link rel="icon" …>`;
  - en `tsconfig.app.json`: agregar `"strict": true` en `compilerOptions` (la constitución lo exige de forma explícita).
- [X] T005 Reescribir `package.json` (research.md §1 y §3):
  - `"name": "countdown-notes"`, `"private": true`, `"version": "0.0.0"`, `"type": "module"`;
  - `scripts`: `"dev": "vite"`, `"build": "tsc -b && vite build"` y `"preview": "vite preview"`;
  - `dependencies`: `react` `19.3.1` y `react-dom` `19.3.1`;
  - `devDependencies`: `typescript` `7.0.2`, `vite` `8.3.5`, `@vitejs/plugin-react` `6.1.2`, `@types/react` `19.3.0`, `@types/react-dom` `19.3.0` y `@types/node` `24.19.2`, todas exactas y sin `^`;
  - quedan fuera `classnames`, `react-countdown-circle-timer`, `zustand`, `tailwindcss@3`, `postcss` y `autoprefixer`.

  Reescribir `pnpm-workspace.yaml` para que contenga solo `saveExact: true` (se va la entrada `allowBuilds` con el texto marcador). Correr `rm -rf node_modules && pnpm install`. Comprobar que `pnpm-lock.yaml` queda con `lockfileVersion: '9.0'` y que pnpm no pide aprobar scripts de instalación.

---

## Phase 2: Foundational (prerrequisito bloqueante)

**Purpose**: el corredor de tests de UI. Se adelanta la parte de Vitest de #12 para poder escribir test-first desde US1 (excepción nombrada: preparación compartida).

**⚠️ CRITICAL**: US1 no puede empezar test-first sin esta fase.

- [X] T006 Instalar los tests de UI con versión exacta: `pnpm add -D -E vitest@5.0.5 jsdom@30.1.3 @testing-library/react@16.3.3 @testing-library/dom@10.4.2 @testing-library/user-event@14.6.8`.
- [X] T007 Configurar Vitest en `vite.config.ts` (research.md §6):
  - agregar `/// <reference types="vitest/config" />` en la primera línea;
  - agregar `test: { environment: 'jsdom', globals: true, include: ['src/**/*.test.{ts,tsx}'] }`, con un comentario de una línea: `globals` solo existe para que Testing Library limpie el DOM entre tests;
  - en `package.json`, agregar el script `"test": "vitest run"`.

  Correr `pnpm test`: debe arrancar Vitest y avisar que no hay archivos de test.

**Checkpoint**: la instalación queda limpia y Vitest corre. **Commit**: `chore: base nueva con Vite 8, React 19, TS 7 y Vitest (#10, #12)`.

---

## Phase 3: User Story 1 · Abrir la app reconstruida (P1, #10) 🎯 MVP

**Goal**: `pnpm dev` abre una pantalla base nueva en español, y `pnpm build` pasa.

**Independent Test**: `pnpm test` en verde, `pnpm build` en verde, y la pantalla visible con `pnpm dev` (quickstart §2).

### Tests for User Story 1 ⚠️

- [ ] T008 [P] [US1] Escribir `src/App.test.tsx`:
  - importa `render` y `screen` de `@testing-library/react`, `test` de `vitest` y `App` de `./App`;
  - el test se llama `'muestra la pantalla base en español'`;
  - hace `render(<App />)` y luego `screen.getByRole('heading', { level: 1, name: 'Countdown Notes' })` y `screen.getByText('Acompañamiento para improvisar con la guitarra.')`.

  Correr `pnpm test` y **verlo fallar**, porque `App` no existe.

### Implementation for User Story 1

- [ ] T009 [P] [US1] Instalar Tailwind con `pnpm add -D -E tailwindcss@4.3.3 @tailwindcss/vite@4.3.3`. En `vite.config.ts`, importar `tailwindcss` de `@tailwindcss/vite` y agregarlo en `plugins: [react(), tailwindcss()]`.
- [ ] T010 [US1] Crear la pantalla base:
  - `src/index.css` con `@import 'tailwindcss';`;
  - `src/main.tsx`, igual que en la plantilla de Vite: `StrictMode`, `createRoot(document.getElementById('root')!)`, `import './index.css'` e `import App from './App.tsx'`;
  - `src/App.tsx` con `export default function App()`, que devuelve un `<main>` centrado a pantalla completa (`min-h-dvh`, flex, centrado) con un `<h1>` "Countdown Notes" (grande y en `font-black`) y un `<p>` "Acompañamiento para improvisar con la guitarra.".

  Correr `pnpm test`: debe quedar **en verde**.
- [ ] T011 [US1] Verificar:
  - `pnpm build` pasa (incluye `tsc -b` con TS 7);
  - con `pnpm dev`, la pantalla se ve en el navegador;
  - los chequeos de quickstart §2: `grep -E 'react-countdown-circle-timer|classnames|zustand' package.json` no imprime nada, y no existen `tailwind.config.cjs` ni `postcss.config.cjs`.

  **Commit**: `feat: pantalla base nueva en español (#10)`.

**Checkpoint**: US1 completa, y es el MVP de la entrega.

---

## Phase 4: User Story 2 · Lint y formato con un comando (P2, #11)

**Goal**: `pnpm lint` y `pnpm format:check` revisan todo el repo y fallan cuando deben. Prettier desaparece.

**Independent Test**: los dos comandos pasan en el repo limpio y fallan con un archivo malo (quickstart §3).

### Implementation for User Story 2

- [ ] T012 [US2] Instalar con `pnpm add -D -E oxlint@1.89.0 oxfmt@0.74.0` y agregar a `package.json` los scripts `"lint": "oxlint --deny-warnings"`, `"format": "oxfmt"` y `"format:check": "oxfmt --check"`.
- [ ] T013 [P] [US2] Crear `.oxlintrc.json` (research.md §4):

  ```json
  {
    "$schema": "./node_modules/oxlint/configuration_schema.json",
    "plugins": ["react", "typescript", "oxc", "jsx-a11y", "vitest"],
    "rules": {
      "react/rules-of-hooks": "error",
      "react/only-export-components": ["warn", { "allowConstantExport": true }]
    },
    "overrides": [
      {
        "files": ["src/components/ui/**"],
        "rules": { "react/only-export-components": "off" }
      }
    ]
  }
  ```

- [ ] T014 [P] [US2] Correr `pnpm exec oxfmt --migrate=prettier` para generar `.oxfmtrc.json` desde `.prettierrc.json` (research.md §5).
  - Comprobar que queda con `singleQuote: true`, `semi: false`, `trailingComma: "none"`, `tabWidth: 2` y `printWidth: 80`.
  - Poner `"ignorePatterns": [".specify/**", ".claude/**"]`.
  - Borrar `.prettierrc.json`.
- [ ] T015 [US2] Correr `pnpm format` sobre todo el repo y corregir lo que reporte `pnpm lint`. Al final deben pasar los 4 comandos: `pnpm lint`, `pnpm format:check`, `pnpm test` y `pnpm build`.
- [ ] T016 [US2] Verificar que los chequeos fallan cuando deben (quickstart §3):
  - con `printf 'const a = "x";\n' > src/tmp-check.ts`, `pnpm format:check` falla y nombra el archivo; `pnpm format` lo corrige y el chequeo vuelve a pasar;
  - con `debugger` en ese archivo, `pnpm lint` falla.

  Borrar `src/tmp-check.ts`. **Commit**: `chore: lint con oxlint y formato con oxfmt (#11)`.

**Checkpoint**: US1 y US2 en verde.

---

## Phase 5: User Story 3 · Tests de UI y E2E con un comando cada uno (P3, #12)

**Goal**: `pnpm test:e2e` abre la build de producción en Chromium y en iPhone (WebKit) y ve la pantalla base. `pnpm test` ya existe desde la fase 2.

**Independent Test**: los dos comandos pasan, y fallan si se rompe el texto del título (SC-005).

### Tests for User Story 3 ⚠️

- [ ] T017 [US3] Preparar Playwright:
  - instalar con `pnpm add -D -E @playwright/test@1.64.1` y bajar los navegadores con `pnpm exec playwright install chromium webkit`;
  - agregar a `package.json` el script `"test:e2e": "playwright test"`;
  - agregar a `.gitignore`: `test-results/`, `playwright-report/`, `blob-report/` y `playwright/.cache/`.
- [ ] T018 [US3] Escribir `e2e/base-screen.spec.ts`, con un test `'abre la pantalla base'` que:
  - hace `page.goto('/')`;
  - espera `page.getByRole('heading', { level: 1, name: 'Countdown Notes' })` con `toBeVisible()`;
  - espera `page.locator('html')` con `toHaveAttribute('lang', 'es')`;
  - comprueba que no hay desplazamiento horizontal: `expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true)`.

  Correr `pnpm test:e2e` y **verlo fallar**, porque todavía no hay `baseURL` ni servidor.

### Implementation for User Story 3

- [ ] T019 [US3] Crear `playwright.config.ts` (research.md §7):
  - `testDir: 'e2e'`;
  - `use: { baseURL: 'http://localhost:4173' }`;
  - `webServer: { command: 'pnpm build && pnpm preview --port 4173 --strictPort', url: 'http://localhost:4173', reuseExistingServer: !process.env.CI }`;
  - `projects`: `{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }` y `{ name: 'iphone', use: { ...devices['iPhone 15'] } }`.

  En `tsconfig.node.json`, cambiar `include` a `["vite.config.ts", "playwright.config.ts", "e2e"]`. Correr `pnpm test:e2e`: debe quedar **en verde en los 2 proyectos**.
- [ ] T020 [US3] Verificar SC-005: cambiar el texto del `<h1>` en `src/App.tsx`, comprobar que fallan `pnpm test` y `pnpm test:e2e`, y deshacer el cambio. Al final deben pasar `pnpm lint`, `pnpm format:check` y `pnpm build`. **Commit**: `test: smoke E2E con Playwright en Chromium y iPhone (#12)`.

**Checkpoint**: US1–US3 en verde.

---

## Phase 6: User Story 4 · Pantalla base con la dirección visual aprobada (P4, #13)

**Goal**: shadcn/ui inicializado, tema solo oscuro con acento ámbar `#f5a524` y Geist en peso 900, y un `Badge` que toma el tema.

**Independent Test**: los tests de UI y E2E del badge y de los colores pasan, y la revisión visual de quickstart §5 coincide.

### Tests for User Story 4 ⚠️

- [ ] T021 [P] [US4] En `src/App.test.tsx`, agregar al test existente `screen.getByText('En construcción')`. Correr `pnpm test` y **verlo fallar**.
- [ ] T022 [P] [US4] En `e2e/base-screen.spec.ts`, agregar el test `'se ve en oscuro con acento ámbar aunque el sistema esté en claro'`:
  - hace `await page.emulateMedia({ colorScheme: 'light' })` y `page.goto('/')`;
  - espera `page.locator('body')` con `toHaveCSS('background-color', 'rgb(10, 10, 10)')`;
  - espera `page.getByText('En construcción')` con `toHaveCSS('background-color', 'rgb(245, 165, 36)')`.

  Correr `pnpm test:e2e` y **verlo fallar**.

### Implementation for User Story 4

- [ ] T023 [US4] Configurar el alias `@` que exige shadcn (research.md §2):
  - en `vite.config.ts`, `import path from 'node:path'` y `resolve: { alias: { '@': path.resolve(import.meta.dirname, './src') } }`;
  - en `tsconfig.json` y en `tsconfig.app.json`, `compilerOptions.paths: { "@/*": ["./src/*"] }`, **sin `baseUrl`** (TS 7 lo eliminó).

  `pnpm build` debe seguir en verde.
- [ ] T024 [US4] Correr `pnpm dlx shadcn@4.22.1 init -t vite -b radix -p nova --no-monorepo -y`. Crea `components.json`, `src/lib/utils.ts` y `src/components/ui/button.tsx`, reescribe `src/index.css` e instala `shadcn`, `radix-ui`, `class-variance-authority`, `cn`, `lucide-react`, `tw-animate-css` y `@fontsource-variable/geist`.
  - Comprobar que en `package.json` todas las versiones quedaron exactas, sin `^`.
  - Borrar `src/components/ui/button.tsx` (YAGNI: vuelve en la entrega 1).
  - Correr `pnpm dlx shadcn@4.22.1 add badge`, que crea `src/components/ui/badge.tsx`.
- [ ] T025 [US4] Tema solo oscuro (research.md §8):
  - en `src/index.css`:
    - borrar el bloque claro `:root { … }` y mover `--radius: 0.625rem;` a `.dark`;
    - en `.dark`, poner `--background: #0a0a0a`, `--foreground: #fafafa`, `--primary: #f5a524`, `--primary-foreground: #0a0a0a` y `--ring: #f5a524`, y dejar los demás tokens como los escribió shadcn;
    - en `@layer base`, agregar `html { color-scheme: dark; }`;
    - mantener `@import "@fontsource-variable/geist";` y `@theme inline`;
  - en `index.html`: `<html lang="es" class="dark">` y `<meta name="theme-color" content="#0a0a0a" />`.
- [ ] T026 [US4] Actualizar `src/App.tsx`:
  - el `<h1>` con `font-heading font-black tracking-tight text-6xl sm:text-8xl`;
  - el `<p>` con `text-muted-foreground text-lg`;
  - agregar `<Badge>En construcción</Badge>`, importado de `@/components/ui/badge`.

  Correr `pnpm test` y `pnpm test:e2e`: deben quedar **en verde**.
- [ ] T027 [US4] Correr `pnpm format`, porque los archivos de shadcn vienen con comillas dobles. Después deben pasar `pnpm lint`, `pnpm format:check` y `pnpm build`. Hacer la revisión visual de quickstart §5 con `pnpm dev`: título en Geist grande y en peso 900, badge ámbar, y la app sigue en oscuro con el sistema en modo claro. **Commit**: `feat: tema oscuro con acento ámbar y shadcn/ui (#13)`.

**Checkpoint**: US1–US4 en verde.

---

## Phase 7: User Story 5 · Abrir la app desde el iPhone en Vercel (P5, #14)

**Goal**: el repo queda listo para que Vercel publique la SPA estática sin tocar su panel, y la pantalla respeta las zonas seguras del iPhone.

**Independent Test**: la build local tiene solo estáticos y el E2E del iPhone pasa. La verificación final la hace el usuario en Vercel y en el iPhone (quickstart §6).

### Implementation for User Story 5

- [ ] T028 [P] [US5] Crear `vercel.json` (research.md §11):

  ```json
  {
    "$schema": "https://openapi.vercel.sh/vercel.json",
    "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
  }
  ```

- [ ] T029 [P] [US5] En `package.json`, agregar `"packageManager": "pnpm@11.28.7"` y `"engines": { "node": "24.x" }`. Correr `pnpm install`: no debe dar errores ni advertencias de versión.
- [ ] T030 [P] [US5] Zonas seguras del iPhone (FR-017):
  - en `index.html`, cambiar el viewport a `width=device-width, initial-scale=1, viewport-fit=cover`;
  - en `src/index.css`, dentro de `@layer base`, darle a `body` un padding con `env(safe-area-inset-top)`, `env(safe-area-inset-right)`, `env(safe-area-inset-bottom)` y `env(safe-area-inset-left)`.
- [ ] T031 [US5] Verificar:
  - `pnpm build && find dist -type f` solo lista `dist/index.html` y archivos en `dist/assets/`;
  - pasan `pnpm test:e2e` (incluido el chequeo sin desplazamiento horizontal en iPhone), `pnpm test`, `pnpm lint` y `pnpm format:check`.

  **Commit**: `feat: configuración de despliegue estático en Vercel (#14)`.
- [ ] T032 [US5] Entregar al usuario los pasos de quickstart §6. El builder no hace push. El usuario hace push de la rama, la mergea, conecta el repo en Vercel sin tocar el panel y abre la URL en el iPhone. Si el build falla, aplicar los riesgos de research.md §11: revisar en el log la versión de pnpm, y agregar `packages: ['.']` si aparece `packages field missing or empty`.

**Checkpoint**: las 5 historias están implementadas. US5 queda pendiente de la verificación del usuario.

---

## Phase 8: Polish & Cross-Cutting Concerns

- [ ] T033 Validar SC-001 desde un clon limpio:
  - `git clone --branch 001-base-nueva <repo> <scratchpad>/clean-clone`;
  - en el clon: `pnpm install`, `pnpm exec playwright install chromium webkit`, `pnpm lint`, `pnpm format:check`, `pnpm test`, `pnpm test:e2e` y `pnpm build`.

  Los 6 comandos de quickstart §1 deben pasar (el `playwright install` es solo preparación).
- [ ] T034 Informar al usuario, por cada issue (#10–#14), qué criterios de aceptación quedaron en verde y cuáles necesitan su verificación (Vercel y el iPhone). No cerrar ningún issue: los cierra el usuario después de verificarlos (constitución, Backlog).

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (fase 1)**: no depende de nada. T001 → T002 → T003 → T004 → T005, en orden.
- **Foundational (fase 2)**: depende de Setup y bloquea US1.
- **US1 (fase 3)**: depende de la fase 2.
- **US2 (fase 4)**: depende de US1, porque necesita código que revisar.
- **US3 (fase 5)**: depende de US1, porque necesita la pantalla base.
- **US4 (fase 6)**: depende de US3, porque T022 extiende el spec E2E.
- **US5 (fase 7)**: depende de US3, porque el E2E del iPhone verifica las zonas seguras.
- **Polish (fase 8)**: depende de todas.

### User Story Dependencies

Las historias comparten archivos (`package.json`, `src/App.tsx`, `vite.config.ts` y `e2e/base-screen.spec.ts`), así que se hacen **en secuencia**, en orden de prioridad: US1 → US2 → US3 → US4 → US5. US2 y US3 se podrían intercambiar, pero cada una deja el repo en verde antes de pasar a la siguiente.

### Within Each User Story

- El test se escribe y **se ve fallar** antes de implementar.
- Se hace commit al cerrar cada historia, con todos los comandos en verde.

### Parallel Opportunities

- **US1**: T008 (test) ∥ T009 (instalar Tailwind).
- **US2**: T013 (`.oxlintrc.json`) ∥ T014 (`.oxfmtrc.json`), después de T012.
- **US4**: T021 (test de UI) ∥ T022 (test E2E).
- **US5**: T028 (`vercel.json`) ∥ T029 (`package.json`) ∥ T030 (`index.html` + `index.css`).

---

## Parallel Example: User Story 5

```bash
Task: "Crear vercel.json con el rewrite de la SPA"
Task: "Agregar packageManager y engines.node a package.json"
Task: "viewport-fit=cover en index.html y padding con safe-area en src/index.css"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Fases 1 y 2: rama, borrar la app vieja, plantilla y Vitest.
2. Fase 3: test de la pantalla base (falla), pantalla y build en verde.
3. **PARAR y VALIDAR**: `pnpm dev` muestra la app nueva.

### Incremental Delivery

Después de cada historia, todos los comandos que ya existen siguen en verde y se hace commit:
- US1: pantalla base;
- US2: lint y formato;
- US3: E2E;
- US4: tema;
- US5: despliegue.

US5 cierra con la verificación del usuario en Vercel y en el iPhone.

---

## Notes

- `tasks.md` referencia los issues; `/speckit-taskstoissues` está prohibido (constitución, Backlog).
- Las tareas sin test-first (configuración de herramientas: T012–T016, T028–T030) se verifican ejecutando sus comandos, como indica quickstart.md.
- Si una versión de research.md §1 falla al instalar, no se cambia por un rango: se consulta al usuario.
