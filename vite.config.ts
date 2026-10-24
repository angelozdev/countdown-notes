/// <reference types="vitest/config" />
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: {
    environment: 'jsdom',
    // globals solo para que Testing Library registre su limpieza con afterEach
    globals: true,
    include: ['src/**/*.test.{ts,tsx}']
  }
})
