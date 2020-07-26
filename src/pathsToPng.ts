import { Path } from './commonTypes'
import { createCanvas } from 'canvas'
import { measure } from './measure'
import { ModifierOptions } from './parseModifiers'

export function pathsToPng(paths: Array<Path>, options: ModifierOptions): NodeJS.ReadableStream {
  const { width, height, baseX, baseY, scale = 1, opaque, offsetX, offsetY } = {
    ...measure(paths, options.scale),
    ...options
  }

  const canvas = createCanvas(width, height)
  const ctx = canvas.getContext('2d')
  if (opaque) {
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, width, height)
  }
  for (const path of paths) {
    if (path.points.length === 0) continue

    ctx.lineWidth = path.width * scale
    ctx.strokeStyle = path.color
    let first = true
    ctx.beginPath()
    if (path.isBezier) {
      let args: number[] = []
      for (const { x, y } of path.points) {
        const realX = (x - baseX) * scale + offsetX
        const realY = (y - baseY) * scale + offsetY
        if (first) {
          ctx.moveTo(realX, realY)
          first = false
        } else {
          args.push(realX, realY)
          if (args.length === 6) {
            ctx.bezierCurveTo(...(args as [number, number, number, number, number, number]))
            args = []
          }
        }
      }
    } else {
      for (const { x, y } of path.points) {
        const realX = (x - baseX) * scale + offsetX
        const realY = (y - baseY) * scale + offsetY
        if (first) {
          ctx.moveTo(realX, realY)
          first = false
        } else {
          ctx.lineTo(realX, realY)
        }
      }
    }
    ctx.stroke()
  }
  return canvas.createPNGStream()
}
