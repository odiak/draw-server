import express from 'express'
import { MongoClient } from 'mongodb'
import SocketIO from 'socket.io'
import { createServer } from 'http'
import { randomBytes } from 'crypto'
import cors from 'cors'
import { pictureToSVG } from './src/pictureToSVG'

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

  app.get('/:pictureId([0-9a-f]{32}).svg', async (req, res) => {
    const p = await picturesCollection.findOne({ id: req.params.pictureId })

    if (p == null) {
      res.status(404)
      res.contentType('text/plain')
      res.end('Not found')
    }

    const svg = pictureToSVG(p)

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
