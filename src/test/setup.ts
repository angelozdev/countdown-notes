// el Slider de Radix usa ResizeObserver, que jsdom no tiene
globalThis.ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
}
