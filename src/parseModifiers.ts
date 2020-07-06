export type ModifierOptions = Partial<{
  width: number
  height: number
  scale: number
  opaque: boolean
}>

export function parseModifiers(modifiers?: string): ModifierOptions {
  const options: ModifierOptions = {}

  for (const mod of (modifiers ?? '').split('-')) {
    const mw = mod.match(/^w(\d+)$/)
    if (mw != null) {
      options.width = parseInt(mw[1], 10)
      continue
    }
    const mh = mod.match(/^h(\d+)$/)
    if (mh != null) {
      options.height = parseInt(mh[1], 10)
      continue
    }
    const mx = mod.match(/^x(\d+)$/)
    if (mx != null) {
      options.scale = parseInt(mx[1], 10) / 100
      continue
    }
    if (mod === 'opaque') {
      options.opaque = true
      continue
    }
  }

  return options
}
