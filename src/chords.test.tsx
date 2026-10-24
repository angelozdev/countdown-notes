import { screen, within } from '@testing-library/react'
import { expect, test } from 'vitest'
import { NOTES } from '@/music/notes'
import { renderApp, type FakeEngine } from '@/test/app'

// FR-025: cifrado y nombre en español de cada raíz
const NAMES: Record<string, [string, string]> = {
  C: ['C', 'Do'],
  Db: ['D♭', 'Re bemol'],
  D: ['D', 'Re'],
  Eb: ['E♭', 'Mi bemol'],
  E: ['E', 'Mi'],
  F: ['F', 'Fa'],
  Gb: ['F♯', 'Fa sostenido'],
  G: ['G', 'Sol'],
  Ab: ['A♭', 'La bemol'],
  A: ['A', 'La'],
  Bb: ['B♭', 'Si bemol'],
  B: ['B', 'Si']
}

const KEY = 'countdown-notes:ajustes'
const ROOT = '(C|D♭|D|E♭|E|F|F♯|G|A♭|A|B♭|B)'

const chordsOf = (fake: FakeEngine, bar: number) =>
  fake.played.filter(
    (event) => event.bar === bar && event.sound.kind === 'chord'
  )

/** El id de la raíz del compás, sacado del primer bajo: 'Gb2' → 'Gb'. */
function rootOf(fake: FakeEngine, bar: number) {
  const bass = fake.played.find(
    (event) => event.bar === bar && event.sound.kind === 'bass'
  )
  return bass!.sound.kind === 'bass' ? bass!.sound.pitch.slice(0, -1) : ''
}

/** La fórmula de T005: MIDI → altura de Tone. */
const pitchOf = (midi: number) =>
  `${NOTES[midi % 12].id}${Math.floor(midi / 12) - 1}`

/** La tríada abierta de la raíz del compás, con la tercera a `third` semitonos. */
function triadOf(fake: FakeEngine, bar: number, third: 3 | 4) {
  const base = 48 + NOTES.findIndex((note) => note.id === rootOf(fake, bar))
  return [base, base + 7, base + 12 + third].map(pitchOf)
}

type App = ReturnType<typeof renderApp>

async function play(app: App) {
  await app.user.click(screen.getByRole('button', { name: 'Play' }))
}

async function pickSound(app: App, name: string) {
  const panel = await app.openSettings()
  await app.user.click(
    within(panel.getByRole('radiogroup', { name: 'Qué suena' })).getByRole(
      'radio',
      { name }
    )
  )
  await app.closeSettings()
}

const nowRegion = () => within(screen.getByRole('region', { name: 'Ahora' }))

test('empieza en Solo bajo, sin selector ni volumen del acorde', async () => {
  const app = renderApp()
  const panel = await app.openSettings()
  const sound = within(panel.getByRole('radiogroup', { name: 'Qué suena' }))

  expect(
    sound
      .getAllByRole('radio')
      .map((radio) => [radio.textContent, radio.getAttribute('aria-checked')])
  ).toEqual([
    ['Solo bajo', 'true'],
    ['Bajo + acorde', 'false']
  ])
  expect(panel.queryByRole('combobox', { name: 'Tipo de acorde' })).toBeNull()
  expect(panel.queryByRole('slider', { name: 'Volumen del acorde' })).toBeNull()

  await app.closeSettings()
  await play(app)
  app.fake.beat(4 + 4 * 2)
  expect(app.fake.played.filter(({ sound }) => sound.kind === 'chord')).toEqual(
    []
  )
})

test('con Bajo + acorde, la tríada mayor por defecto y un acorde por compás', async () => {
  const app = renderApp()
  await pickSound(app, 'Bajo + acorde')
  const panel = await app.openSettings()
  const type = panel.getByRole('combobox', {
    name: 'Tipo de acorde'
  }) as HTMLSelectElement

  expect(type.value).toBe('maj')
  expect(
    within(panel.getByRole('group', { name: 'Tríadas' }))
      .getAllByRole('option')
      .map((option) => option.textContent)
  ).toEqual([
    'C · mayor',
    'Cm · menor',
    'Cdim · disminuido',
    'Caug · aumentado',
    'Csus4 · con cuarta suspendida',
    'Csus2 · con segunda suspendida'
  ])

  await app.closeSettings()
  await play(app)
  app.fake.beat(4 + 4 * 3)
  expect(chordsOf(app.fake, 0)).toEqual([])
  for (const bar of [1, 2, 3]) {
    const chords = chordsOf(app.fake, bar)
    expect(chords).toHaveLength(1)
    expect(chords[0].beat).toBe(0)
    expect(chords[0].sound).toEqual({
      kind: 'chord',
      pitches: triadOf(app.fake, bar, 4),
      length: 4
    })
  }
})

test('"Ahora" y el carril muestran el cifrado y el nombre', async () => {
  const app = renderApp()
  await pickSound(app, 'Bajo + acorde')
  const panel = await app.openSettings()
  await app.user.selectOptions(
    panel.getByRole('combobox', { name: 'Tipo de acorde' }),
    'Cm · menor'
  )
  await app.closeSettings()
  await play(app)
  app.fake.beat(4 + 1)

  const [label, name] = NAMES[rootOf(app.fake, 1)]
  const now = nowRegion()
  expect(now.getByText(`${label}m`)).toBeDefined()
  expect(now.getByText(`${name} menor`)).toBeDefined()

  const lane = within(screen.getByRole('list', { name: 'Carril' }))
  const items = lane.getAllByRole('listitem')
  const current = items.find(
    (item) => item.getAttribute('aria-current') === 'true'
  )
  expect(current?.textContent).toBe(`${label}m`)
  for (const item of items) {
    expect(item.textContent).toMatch(new RegExp(`^${ROOT}m$`))
  }

  // la última nota de la vuelta ya muestra la vista previa de la siguiente
  app.fake.beat(4 * 22)
  expect(screen.getByText(new RegExp(`^Vuelta 2: ${ROOT}m$`))).toBeDefined()
})

test('un cambio de tipo a mitad de compás aplica desde el compás siguiente', async () => {
  const app = renderApp()
  await pickSound(app, 'Bajo + acorde')
  await play(app)
  app.fake.beat(4 + 2)
  const panel = await app.openSettings()
  await app.user.selectOptions(
    panel.getByRole('combobox', { name: 'Tipo de acorde' }),
    'Cm · menor'
  )
  await app.closeSettings()

  const [label, name] = NAMES[rootOf(app.fake, 1)]
  expect(nowRegion().getByText(label)).toBeDefined()
  expect(nowRegion().getByText(`${name} mayor`)).toBeDefined()

  app.fake.beat(2 + 1)
  expect(nowRegion().getByText(`${label}m`)).toBeDefined()
  expect(nowRegion().getByText(`${name} menor`)).toBeDefined()
  expect(chordsOf(app.fake, 1)[0].sound).toMatchObject({
    pitches: triadOf(app.fake, 1, 4)
  })
  expect(chordsOf(app.fake, 2)[0].sound).toMatchObject({
    pitches: triadOf(app.fake, 2, 3)
  })
})

test('pasar a Solo bajo a mitad de compás quita el acorde desde el compás siguiente', async () => {
  const app = renderApp()
  await pickSound(app, 'Bajo + acorde')
  await play(app)
  app.fake.beat(4 + 2)
  await pickSound(app, 'Solo bajo')

  const [label, name] = NAMES[rootOf(app.fake, 1)]
  expect(nowRegion().getByText(`${name} mayor`)).toBeDefined()

  app.fake.beat(2 + 1)
  expect(chordsOf(app.fake, 1)).toHaveLength(1)
  expect(chordsOf(app.fake, 2)).toEqual([])
  expect(nowRegion().getByText(label)).toBeDefined()
  expect(nowRegion().getByText(name)).toBeDefined()
})

test('el volumen y el silencio del acorde cambian sin detener la música', async () => {
  const app = renderApp()
  await pickSound(app, 'Bajo + acorde')
  await play(app)
  app.fake.beat(5)
  const panel = await app.openSettings()
  const chord = panel.getByRole('slider', { name: 'Volumen del acorde' })

  expect(
    panel
      .getAllByRole('slider')
      .map((slider) => slider.getAttribute('aria-label'))
  ).toEqual(['Volumen del bajo', 'Volumen del acorde', 'Volumen del metrónomo'])
  expect(chord.getAttribute('aria-valuenow')).toBe('80')
  expect(
    panel
      .getByRole('button', { name: 'Silenciar acorde' })
      .getAttribute('aria-pressed')
  ).toBe('false')

  chord.focus()
  await app.user.keyboard('{ArrowLeft}')
  expect(app.fake.mix?.chord.volume).toBe(79)

  await app.user.click(panel.getByRole('button', { name: 'Silenciar acorde' }))
  expect(app.fake.mix?.chord.muted).toBe(true)
  expect(app.fake.running).toBe(true)
})

test('los ajustes del acorde se recuerdan', async () => {
  const first = renderApp()
  await pickSound(first, 'Bajo + acorde')
  const panel = await first.openSettings()
  await first.user.selectOptions(
    panel.getByRole('combobox', { name: 'Tipo de acorde' }),
    'Cm · menor'
  )
  panel.getByRole('slider', { name: 'Volumen del acorde' }).focus()
  await first.user.keyboard('{ArrowLeft}')
  first.unmount()

  const again = await renderApp().openSettings()
  expect(
    again
      .getByRole('radio', { name: 'Bajo + acorde' })
      .getAttribute('aria-checked')
  ).toBe('true')
  expect(
    (
      again.getByRole('combobox', {
        name: 'Tipo de acorde'
      }) as HTMLSelectElement
    ).value
  ).toBe('m')
  expect(
    again
      .getByRole('slider', { name: 'Volumen del acorde' })
      .getAttribute('aria-valuenow')
  ).toBe('79')
})

test('un dato guardado por la entrega 2 se conserva y suma los ajustes nuevos', async () => {
  const channel = { volume: 80, muted: false }
  localStorage.setItem(
    KEY,
    JSON.stringify({
      version: 1,
      settings: {
        bpm: 90,
        barsPerNote: 2,
        notes: NOTES.map((note) => note.id),
        meter: '4/4',
        bassFigure: 'whole',
        bassOctave: 2,
        mix: { click: channel, bass: channel },
        repeats: { on: false, count: 10 }
      }
    })
  )

  const app = renderApp()
  const panel = await app.openSettings()
  expect(panel.getByRole('spinbutton', { name: 'BPM' })).toHaveProperty(
    'value',
    '90'
  )
  const sound = within(panel.getByRole('radiogroup', { name: 'Qué suena' }))
  expect(
    sound.getByRole('radio', { name: 'Solo bajo' }).getAttribute('aria-checked')
  ).toBe('true')

  await app.user.click(sound.getByRole('radio', { name: 'Bajo + acorde' }))
  expect(
    (
      panel.getByRole('combobox', {
        name: 'Tipo de acorde'
      }) as HTMLSelectElement
    ).value
  ).toBe('maj')
  expect(
    panel
      .getByRole('slider', { name: 'Volumen del acorde' })
      .getAttribute('aria-valuenow')
  ).toBe('80')
})
