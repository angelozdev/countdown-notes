import { useEffect } from 'react'

/** Mantiene la pantalla encendida mientras `active`; si no hay Wake Lock o falla, no hace nada. */
export function useWakeLock(active: boolean) {
  useEffect(() => {
    if (!active || !navigator.wakeLock) return
    let cancelled = false
    let requesting = false
    let sentinel: WakeLockSentinel | undefined

    function acquire() {
      requesting = true
      navigator.wakeLock
        .request('screen')
        .then((lock) => {
          if (cancelled) return lock.release()
          sentinel = lock
        })
        .catch(() => {})
        .finally(() => {
          requesting = false
        })
    }

    // el sistema la libera al cambiar de pestaña o de app
    function onVisibilityChange() {
      if (
        document.visibilityState === 'visible' &&
        !requesting &&
        (!sentinel || sentinel.released)
      ) {
        acquire()
      }
    }

    acquire()
    document.addEventListener('visibilitychange', onVisibilityChange)
    return () => {
      cancelled = true
      document.removeEventListener('visibilitychange', onVisibilityChange)
      sentinel?.release().catch(() => {})
    }
  }, [active])
}

/** La barra espaciadora llama a `toggle`, salvo con un diálogo abierto, en un campo editable o con modificadores. */
export function useSpaceToggle(toggle: () => void) {
  useEffect(() => {
    const ours = (event: KeyboardEvent) =>
      event.code === 'Space' &&
      !event.altKey &&
      !event.ctrlKey &&
      !event.metaKey &&
      !event.shiftKey &&
      !(
        event.target instanceof Element &&
        event.target.closest(
          '[role="dialog"], input, textarea, select, [contenteditable]'
        )
      )

    function onKeyDown(event: KeyboardEvent) {
      if (!ours(event)) return
      event.preventDefault()
      if (!event.repeat) toggle()
    }
    // sin esto, soltar el espacio sobre un botón con foco lo activaría una segunda vez
    function onKeyUp(event: KeyboardEvent) {
      if (ours(event)) event.preventDefault()
    }

    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
    }
  }, [toggle])
}
