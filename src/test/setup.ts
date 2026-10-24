import { afterEach } from 'vitest'

// el Slider de Radix usa ResizeObserver, que jsdom no tiene
globalThis.ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
}

// lo guardado de un test no debe llegar al siguiente
afterEach(() => localStorage.clear())
