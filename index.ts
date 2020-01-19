import express from 'express'
import SocketIO from 'socket.io'
import { createServer } from 'http'
import cors from 'cors'
import { pictureToSVG } from './src/pictureToSVG'
import { connectToMongo } from './src/connectToMongo'
import { Collection } from 'mongodb'
import { generateId } from './src/generateId'

const PORT = ((p) => (p != null ? parseInt(p) : 8000))(process.env.PORT)
;(async () => {
  const { picturesCollection } = await connectToMongo()

  const app = express()
  app.use(cors({ origin: '*' }))

  setTimeout(() => {
    setIdForPaths(picturesCollection)
  })

  app.get('/pictures/:pictureId', async (req, res) => {
    const p = await picturesCollection.findOne({ id: req.params.pictureId })
    await setIdForPath(picturesCollection, p)
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
        id = generateId()
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

async function setIdForPaths(picturesCollection: Collection) {
  const cur = await picturesCollection.find()
  while (cur.hasNext()) {
    const picture = await cur.next()
    await setIdForPath(picturesCollection, picture)
  }
}

async function setIdForPath(picturesCollection: Collection, picture: any): Promise<any> {
  let changed = false
  const newPaths = picture.paths.map((path: any) => {
    if (path.id != null) return path

    changed = true
    return {
      ...path,
      id: generateId()
    }
  })

  if (!changed) return picture

  const newPicture = { ...picture, paths: newPaths }
  picturesCollection.updateOne({ id: picture.id }, newPicture)
  return newPicture
}
