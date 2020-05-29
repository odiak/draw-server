import escapeHTML from 'escape-html'
import { Path } from './commonTypes'
import { measure } from './measure'

export function pathsToSvg(paths: Array<Path>): string {
  const { width, height, baseX, baseY } = measure(paths)

  const pathStrs = paths.map(({ points, width, color }: any) => {
    const desc = points
      .map(({ x, y }: any, i: number) => {
        if (i === 0) {
          return `M${x - baseX},${y - baseY}`
        } else {
          return `L${x - baseX},${y - baseY}`
        }
      })
      .join('')
    const escapedDesc = escapeHTML(desc)
    const escapedColor = escapeHTML(color)
    const escapedWidth = escapeHTML(String(width))

    return `<path d="${escapedDesc}" stroke="${escapedColor}" fill="none" stroke-width="${escapedWidth}" stroke-linecap="round" stroke-linejoin="round" />`
  })
  return (
    `<svg version="1.1" xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">` +
    pathStrs.join('') +
    '</svg>'
  )
}
