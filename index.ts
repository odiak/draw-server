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
    let p = await picturesCollection.findOne({ id: req.params.pictureId })

    if (p == null) {
      res.status(404)
      res.json({})
      return
    }

    p = await setIdForPath(picturesCollection, p)
    res.set('')
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
    res.set('Cache-Control', 'private, max-age=600')
    res.end(svg)
  })

  const server = createServer(app)
  const io = SocketIO(server)
  io.on('connection', (socket) => {
    socket.on('savePicture', async ({ id, title, paths }, cb) => {
      const now = new Date()
      if (id == null) {
        id = generateId()
        await picturesCollection.insertOne({ id, title, paths, createdAt: now, updatedAt: now })
      } else {
        await picturesCollection.updateOne(
          { id },
          { $set: { title, paths, updatedAt: now } },
          { upsert: true }
        )
      }
      cb(id)
    })

    socket.on('updatePicture', async ({ pictureId, title, pathsToAdd, pathIdsToRemove }) => {
      const update: any = { $set: { updatedAt: new Date() } }
      if (title != null) {
        update['$set'] = { ...(update['$set'] || {}), title }
      }
      if (pathsToAdd != null && pathsToAdd.length > 0) {
        update['$push'] = { paths: { $each: pathsToAdd } }
      }
      if (pathIdsToRemove != null && pathIdsToRemove.length > 0) {
        update['$pull'] = { paths: { id: { $in: pathIdsToRemove } } }
      }

      if (Object.keys(update).length > 0) {
        await picturesCollection.updateOne({ id: pictureId }, update, { upsert: true })

        socket
          .to(pictureId)
          .emit('pictureUpdated', { title, pictureId, pathsToAdd, pathIdsToRemove })
      }
    })

    socket.on('watchPicture', async ({ pictureId }) => {
      socket.join(pictureId)
    })

    socket.on('unwatchPicture', async ({ pictureId }) => {
      socket.leave(pictureId)
    })
  })

  server.listen(PORT)
})()

async function setIdForPaths(picturesCollection: Collection) {
  const cur = await picturesCollection.find({})
  while (await cur.hasNext()) {
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
  picturesCollection.updateOne({ id: picture.id }, { $set: { paths: newPaths } })
  return newPicture
}
