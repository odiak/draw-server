import express from 'express'
import { createServer } from 'http'
import { pathsToSVG, Path, Point } from './src/pathsToSVG'
import admin from 'firebase-admin'

admin.initializeApp({
  credential: admin.credential.applicationDefault(),
  databaseURL: 'https://draw-9a1e4.firebaseio.com'
})

const PORT = ((p) => (p != null ? parseInt(p) : 8000))(process.env.PORT)
const app = express()

app.get('/:pictureId([0-9a-f]{32}).svg', async (req, res) => {
  const { pictureId } = req.params

  const pathsSnapshot = await admin
    .firestore()
    .collection('pictures')
    .doc(pictureId)
    .collection('paths')
    .orderBy('timestamp')
    .get()

  const paths: Path[] = pathsSnapshot.docs.map((doc) => {
    const data = doc.data()
    const points: Point[] = []
    const rawPoints: number[] = data.points
    const length = rawPoints.length
    for (let i = 0; i + 1 < length; i += 2) {
      points.push({ x: rawPoints[i], y: rawPoints[i + 1] })
    }
    return { points, color: data.color, width: data.width }
  })

  const svg = pathsToSVG(paths)
  res.contentType('image/svg+xml')
  res.set('Cache-Control', 'private, max-age=600')
  res.end(svg)
})

const server = createServer(app)

server.listen(PORT)
