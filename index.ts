import express from 'express'
import { MongoClient } from 'mongodb'
import SocketIO from 'socket.io'
import { createServer } from 'http'
import { randomBytes } from 'crypto'
import cors from 'cors'
import escapeHTML from 'escape-html'

const DATABASE_URL = process.env.MONGODB_URI || 'mongodb://localhost:27017/draw'
const PORT = ((p) => (p != null ? parseInt(p) : 8000))(process.env.PORT)
;(async () => {
  const mongoClient = await MongoClient.connect(DATABASE_URL, {
    useUnifiedTopology: true
  })
  const db = mongoClient.db()
  const picturesCollection = db.collection('pictures')
  picturesCollection.createIndex('id', { unique: true })

  const app = express()
  app.use(cors({ origin: '*' }))

  app.get('/pictures/:pictureId', async (req, res) => {
    const p = await picturesCollection.findOne({ id: req.params.pictureId })
    res.json(p)
  })

  app.get('/p/:pictureId.svg', async (req, res) => {
    const p = await picturesCollection.findOne({ id: req.params.pictureId })

    if (p == null) {
      res.status(404)
      res.contentType('text/plain')
      res.end('Not found')
    }

    let minX = Number.POSITIVE_INFINITY
    let maxX = Number.NEGATIVE_INFINITY
    let minY = Number.POSITIVE_INFINITY
    let maxY = Number.NEGATIVE_INFINITY
    for (const path of p.paths) {
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

    const paths = p.paths.map(({ points, width, color }: any) => {
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
    const svg =
      `<svg version="1.1" xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">` +
      paths.join('') +
      '</svg>'

    res.contentType('image/svg+xml')
    res.end(svg)
  })

  const server = createServer(app)
  const io = SocketIO(server)
  io.on('connection', (socket) => {
    socket.on('savePicture', async ({ id, title, paths }, cb) => {
      if (id == null) {
        id = randomBytes(16).toString('hex')
        const now = new Date()
        await picturesCollection.insertOne({ id, title, paths, createdAt: now, updatedAt: now })
      } else {
        await picturesCollection.updateOne({ id }, { $set: { title, paths } })
      }
      cb(id)
    })
  })

  server.listen(PORT)
})()
