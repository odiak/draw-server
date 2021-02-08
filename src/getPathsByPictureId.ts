import admin from 'firebase-admin'
import { Path, Point } from './commonTypes'

export async function getPathsByPictureId(pictureId: string): Promise<Array<Path>> {
  const pathsSnapshot = await admin
    .firestore()
    .collection('pictures')
    .doc(pictureId)
    .collection('paths')
    .orderBy('timestamp')
    .get()
    .catch(() => null)

  return (pathsSnapshot?.docs ?? []).map((doc) => {
    const data = doc.data()
    const points: Point[] = []
    const rawPoints: number[] = data.points
    const length = rawPoints.length
    const isBezier = !!data.isBezier
    const offsetX = data.offsetX ?? 0
    const offsetY = data.offsetY ?? 0
    for (let i = 0; i + 1 < length; i += 2) {
      points.push({ x: rawPoints[i] + offsetX, y: rawPoints[i + 1] + offsetY })
    }
    return { points, color: data.color, width: data.width, isBezier }
  })
}
