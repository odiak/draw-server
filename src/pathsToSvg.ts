import escapeHTML from 'escape-html'
import { Path } from './commonTypes'
import { measure } from './measure'
import { ModifierOptions } from './parseModifiers'

export function pathsToSvg(paths: Array<Path>, options: ModifierOptions): string {
  const { width, height, baseX, baseY, scale = 1, opaque = false, offsetX, offsetY } = {
    ...measure(paths, options.scale),
    ...options
  }

  const pathStrs = paths.map(({ points, width, color }: any) => {
    const desc = points
      .map(({ x, y }: any, i: number) => {
        const x_ = (x - baseX) * scale + offsetX
        const y_ = (y - baseY) * scale + offsetY
        if (i === 0) {
          return `M${x_},${y_}`
        } else {
          return `L${x_},${y_}`
        }
      })
      .join('')
    const escapedDesc = escapeHTML(desc)
    const escapedColor = escapeHTML(color)
    const escapedLineWidth = escapeHTML(String(width * scale))

    return `<path d="${escapedDesc}" stroke="${escapedColor}" fill="none" stroke-width="${escapedLineWidth}" stroke-linecap="round" stroke-linejoin="round" />`
  })

  if (opaque) {
    pathStrs.unshift(`<rect x="0" y="0" width="${width}" height="${height}" fill="#ffffff" />`)
  }

  return (
    `<svg version="1.1" xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">` +
    pathStrs.join('') +
    '</svg>'
  )
}
