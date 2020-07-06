import { Path } from './commonTypes'

export function measure(
  paths: Array<Path>,
  scale: number = 1
): {
  width: number
  height: number
  baseX: number
  baseY: number
  offsetX: number
  offsetY: number
} {
  let minX = Number.POSITIVE_INFINITY
  let maxX = Number.NEGATIVE_INFINITY
  let minY = Number.POSITIVE_INFINITY
  let maxY = Number.NEGATIVE_INFINITY
  for (const path of paths) {
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
  const width = (maxX - minX) * scale + offset * 2
  const height = (maxY - minY) * scale + offset * 2

  return { width, height, baseX: minX, baseY: minY, offsetX: offset, offsetY: offset }
}
