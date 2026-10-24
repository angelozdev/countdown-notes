# Implementation Plan: Base nueva (Entrega 0)

**Branch**: `001-base-nueva` | **Date**: 2026-10-24 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/001-base-nueva/spec.md` (issue #1, sub-issues #10–#14)

## Summary

Reconstruir la app desde cero en el mismo repo:
- **Base**: la plantilla oficial de Vite 8 (React 19 + TypeScript 7), con todas las dependencias en versión exacta.
- **Lint y formato**: oxlint y oxfmt; el formato se migra desde el `.prettierrc.json` actual.
- **Tests**: Vitest + jsdom + Testing Library para la UI, y Playwright (Chromium + iPhone/WebKit) para E2E contra la build de producción.
- **Tema**: shadcn/ui (Radix, preset Nova con Geist), solo oscuro con acento ámbar `#f5a524`.
- **Publicación**: `vercel.json` para que Vercel la publique como SPA estática sin tocar su panel.

La pantalla base muestra el título "Countdown Notes", una frase en español y un `Badge` ámbar, sin controles. Las decisiones y sus razones están en [research.md](./research.md).

## Technical Context

**Language/Version**: TypeScript 7.0.2 (strict), Node 24 (local: 24.14.0)

**Primary Dependencies**: React 19.3.1, Vite 8.3.5, Tailwind CSS 4.3.3, shadcn 4.22.1 (Radix, preset Nova). Las versiones exactas están en research.md §1.

**Storage**: N/A (esta entrega no guarda nada)

**Testing**: Vitest 5.0.5 + jsdom 30.1.3 + Testing Library (react 16.3.3, dom 10.4.2, user-event 14.6.8); Playwright 1.64.1 (proyectos `chromium` e `iphone`)

**Target Platform**: navegador de escritorio actual; Safari en iOS 17 o superior. Se publica en Vercel como estáticos.

**Project Type**: SPA web, solo frontend

**Performance Goals**: N/A en esta entrega. La pantalla base es estática.

**Constraints**:
- Todas las dependencias van en versión exacta (`saveExact: true`).
- Sin funciones de servidor.
- Sin ajustes en el panel de Vercel.
- El título se lee a 1–2 m.
- Sin desplazamiento horizontal en el iPhone.

**Scale/Scope**: 1 pantalla, 1 test de UI, 1 smoke test E2E en 2 navegadores

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principio | Cómo se cumple | Estado |
|---|---|---|
| I. Test-first | El test de UI de la pantalla base se escribe antes que la pantalla, y el smoke test E2E antes de la configuración de Playwright que lo hace pasar. Para eso, Vitest se instala como preparación compartida, antes de US1. Los tests buscan por rol y texto accesible ([contracts](./contracts/interfaces.md) §2). | ✅ |
| II. Entregas verticales | Toda la entrega es una excepción nombrada (preparación compartida, issue #1). Aun así, cada historia termina en algo que se ejecuta desde un punto de entrada real: un comando `pnpm` o la app abierta. | ✅ (excepción nombrada) |
| III. Precisión del tiempo | No aplica: esta entrega no tiene audio. Tone.js entra en la entrega 1. | ✅ N/A |
| IV. Manos libres | La pantalla base no tiene controles, y su título es grande y de mucho peso para leerse de lejos. | ✅ |
| V. Simplicidad | Solo estáticos, sin datos guardados. YAGNI: sin Tone.js, tonal, zod, vite-plugin-pwa ni Zustand (cada uno llega con su entrega), sin jest-dom y sin `Button`. | ✅ |
| Restricciones técnicas | pnpm; stack de la lista en sus últimas estables; oxfmt con el estilo de Prettier; interfaz en español. | ✅ |
| Flujo de trabajo | Se trabaja en la rama `001-base-nueva`, con un commit por paso en verde que referencia el issue; nunca en `main` ni push. Dependencias fuera de la lista (Geist, jsdom): las aprobó el usuario el 2026-10-24. | ✅ |

**Re-check post-diseño**: sin cambios. No hay violaciones que justificar.

## Project Structure

### Documentation (this feature)

```text
specs/001-base-nueva/
├── plan.md              # Este archivo
├── research.md          # Fase 0: decisiones y versiones
├── quickstart.md        # Fase 1: cómo validar la entrega de punta a punta
├── contracts/
│   └── interfaces.md    # Fase 1: comandos, pantalla base y publicación
├── checklists/
│   └── requirements.md  # Calidad del spec
└── tasks.md             # Fase 2 (/speckit-tasks)
```

`data-model.md` no se genera: esta entrega no tiene entidades ni datos (spec sin Key Entities).

### Source Code (repository root)

Estado final de la raíz. Todo lo demás de la app vieja se borra (research.md §3).

```text
index.html               # lang="es", class="dark", viewport-fit=cover, theme-color
package.json             # scripts del contrato §1, versiones exactas, packageManager pnpm@11.28.7, engines.node 24.x
pnpm-workspace.yaml      # saveExact: true
pnpm-lock.yaml
vite.config.ts           # react + tailwindcss + alias @ + test (jsdom)
tsconfig.json            # referencias + paths @/*
tsconfig.app.json        # src, strict, paths @/*
tsconfig.node.json       # vite.config.ts, playwright.config.ts, e2e/
.oxlintrc.json           # react, typescript, oxc, jsx-a11y, vitest
.oxfmtrc.json            # migrado de .prettierrc.json; ignora .specify/ y .claude/
components.json          # shadcn: radix-nova, alias @
playwright.config.ts     # webServer build+preview; proyectos chromium e iphone
vercel.json              # SPA: cualquier ruta → index.html
.gitignore               # + test-results/, playwright-report/, blob-report/
e2e/
└── base-screen.spec.ts  # smoke: título visible; sin scroll horizontal en iPhone
src/
├── main.tsx
├── App.tsx              # pantalla base
├── App.test.tsx         # test de UI de la pantalla base
├── index.css            # Tailwind + tokens de shadcn (solo .dark, ámbar, Geist)
├── lib/
│   └── utils.ts         # cn (shadcn)
└── components/
    └── ui/
        └── badge.tsx    # shadcn
```

**Structure Decision**: un solo proyecto en la raíz, con la estructura de la plantilla de Vite y las carpetas que define shadcn (`src/components/ui`, `src/lib`). La estructura de módulos de la app (motor de audio, secuenciador, etc.) se decide en la entrega 1, no aquí.

## Orden sugerido para `/speckit-tasks` (porciones verticales)

0. **Preparación compartida** (excepción nombrada):
   - crear la rama `001-base-nueva`;
   - borrar la app vieja;
   - generar la plantilla de Vite con versiones exactas;
   - Vitest + jsdom + Testing Library, con `pnpm test`.
1. **US1 · #10**: test de UI de la pantalla base (falla) → `App.tsx` en español → `pnpm build` en verde.
2. **US2 · #11**: oxlint y oxfmt (`--migrate=prettier`), scripts y borrar Prettier → formatear el repo → comprobar que un archivo mal formateado hace fallar el chequeo.
3. **US3 · #12**: smoke test E2E (falla) → `playwright.config.ts` y `pnpm test:e2e` en verde, en los 2 proyectos.
4. **US4 · #13**: test de UI del texto del `Badge` (falla) → `shadcn init`, tokens oscuros y ámbar, `Badge` → se verifica a la vista contra [quickstart](./quickstart.md).
5. **US5 · #14**: `vercel.json`, `packageManager` y `engines.node` (research.md §11) → la build local solo tiene estáticos → el usuario conecta el repo, hace push y abre la app en el iPhone. El lockfile 9.0 entra en el commit (el de `HEAD` es 5.4).

## Complexity Tracking

Sin violaciones de la constitución.
