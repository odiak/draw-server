import escapeHTML from 'escape-html'

export function pictureToSVG(picture: any): string {
  let minX = Number.POSITIVE_INFINITY
  let maxX = Number.NEGATIVE_INFINITY
  let minY = Number.POSITIVE_INFINITY
  let maxY = Number.NEGATIVE_INFINITY
  for (const path of picture.paths) {
    for (const { x, y } of path.points) {
      minX = Math.min(minX, x)
      maxX = Math.max(maxX, x)
      minY = Math.min(minY, y)
      maxY = Math.max(maxY, y)
    }
  }
  if (!Number.isFinite(minX)) minX = 0
  if (!Number.isFinite(maxX)) maxX = 0
  if (!Number.isFinite(minY)) minY = 0
  if (!Number.isFinite(maxY)) maxY = 0
  const offset = 20
  const baseX = minX - offset
  const baseY = minY - offset
  const width = maxX - minX + offset * 2
  const height = maxY - minY + offset * 2

  const paths = picture.paths.map(({ points, width, color }: any) => {
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

    return `<path d="${escapedDesc}" stroke="${escapedColor}" fill="none" stroke-width="${escapedWidth}" />`
  })
  return (
    `<svg version="1.1" xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">` +
    paths.join('') +
    '</svg>'
  )
}
