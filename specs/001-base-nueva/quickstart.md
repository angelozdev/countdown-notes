# Quickstart: validar la Entrega 0

Cómo comprobar, de punta a punta, que la entrega cumple el [spec](./spec.md). Los comandos y su conducta están en [contracts/interfaces.md](./contracts/interfaces.md).

## Requisitos

- Node 24 y pnpm 11.
- Navegadores de Playwright: `pnpm exec playwright install chromium webkit` (una vez).
- Para US5: una cuenta de Vercel y un iPhone con iOS 17 o superior.

## 1. Desde un clon limpio (SC-001)

```sh
pnpm install
pnpm lint
pnpm format:check
pnpm test
pnpm test:e2e
pnpm build
```

**Esperado**: los 6 comandos terminan con código 0.

## 2. App nueva (US1)

```sh
pnpm dev
```

Abrir la dirección que imprime el comando.

**Esperado**: el título "Countdown Notes", una frase en español y un badge ámbar, sobre un fondo casi negro.

Revisar también que la app vieja y sus dependencias ya no existan (SC-002):

```sh
grep -E 'react-countdown-circle-timer|classnames|prettier|zustand' package.json
ls .prettierrc.json tailwind.config.cjs postcss.config.cjs
```

**Esperado**: `grep` no imprime nada y `ls` no encuentra ninguno de los tres archivos.

## 3. Lint y formato fallan cuando deben (US2)

```sh
printf 'const a = "x";\n' > src/tmp-check.ts
pnpm format:check   # esperado: falla y nombra src/tmp-check.ts
pnpm format         # lo reescribe con comillas simples y sin punto y coma
pnpm format:check   # esperado: pasa
rm src/tmp-check.ts
```

## 4. Los tests prueban algo real (US3, SC-005)

Cambiar en `src/App.tsx` el texto del título y correr `pnpm test`.

**Esperado**: el test de UI falla. Después, deshacer el cambio.

## 5. Dirección visual (US4)

Con `pnpm dev`:

1. Comprobar que el fondo es casi negro y el texto claro, que el título se ve grande y en peso máximo (Geist), y que el badge está en ámbar `#f5a524`.
2. Poner el sistema en modo claro y recargar.
   **Esperado**: la app sigue en oscuro.

## 6. Build estática y publicación (US5)

```sh
pnpm build
find dist -type f
```

**Esperado**: solo `index.html` y archivos en `dist/assets/` (JS, CSS y fuentes), sin funciones de servidor.

Publicar en Vercel (lo hace el usuario; el builder no hace push):

1. Hacer push de la rama, mergearla y conectar el repo en Vercel sin cambiar ningún ajuste del panel.
2. **Esperado**: el primer build pasa (SC-003). El log muestra pnpm 11.28.7 y Node 24. Si falla, ver los riesgos en [research.md](./research.md) §11.
3. Abrir la URL en Safari del iPhone.
   **Esperado**: la pantalla base carga por HTTPS, se lee sin zoom, no tiene desplazamiento horizontal y nada queda bajo la muesca (SC-004). El título se lee a 1–2 m.
4. Abrir `<url>/cualquier/ruta`.
   **Esperado**: carga la app, no un 404.
