import { Path } from './commonTypes'
import { createCanvas, CanvasRenderingContext2D } from 'canvas'
import { measure } from './measure'

export function pathsToPng(paths: Array<Path>): NodeJS.ReadableStream {
  const { width, height, baseX, baseY } = measure(paths)

  const canvas = createCanvas(width, height)
  const ctx = canvas.getContext('2d')
  for (const path of paths) {
    drawPath(ctx, path, { baseX, baseY })
  }
  return canvas.createPNGStream()
}

function drawPath(
  ctx: CanvasRenderingContext2D,
  { width, color, points }: Path,
  { baseX, baseY }: { baseX: number; baseY: number }
) {
  if (points.length === 0) {
    return
  }

  ctx.lineWidth = width
  ctx.strokeStyle = color
  let first = true
  ctx.beginPath()
  for (const { x, y } of points) {
    const realX = x - baseX
    const realY = y - baseY
    if (first) {
      ctx.moveTo(realX, realY)
      first = false
    } else {
      ctx.lineTo(realX, realY)
    }
  }
  ctx.stroke()
}
