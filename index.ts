import express from 'express'
import { MongoClient } from 'mongodb'
import SocketIO from 'socket.io'
import { createServer } from 'http'
import { randomBytes } from 'crypto'
;(async () => {
  const mongoClient = await MongoClient.connect('mongodb://localhost:27017', {
    useUnifiedTopology: true
  })
  const db = mongoClient.db('draw')
  const picturesCollection = db.collection('pictures')
  picturesCollection.createIndex('id', { unique: true })

  const app = express()

  const server = createServer(app)
  const io = SocketIO(server)
  io.on('connection', (socket) => {
    socket.on('createPicture', (paths, cb) => {
      const id = randomBytes(16).toString('hex')
      const now = new Date()
      picturesCollection.insertOne({ id, paths, createdAt: now, updatedAt: now })

      cb(id)
    })
  })

  server.listen(8000)
})()
