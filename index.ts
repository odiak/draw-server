import express from 'express'
import { createServer } from 'http'
import { pathsToSvg } from './src/pathsToSvg'
import admin from 'firebase-admin'
import { getPathsByPictureId } from './src/getPathsByPictureId'
import { pathsToPng } from './src/pathsToPng'
import { parseModifiers } from './src/parseModifiers'

admin.initializeApp({
  credential: admin.credential.applicationDefault(),
  databaseURL: 'https://draw-9a1e4.firebaseio.com'
})

const PORT = ((p) => (p != null ? parseInt(p) : 8000))(process.env.PORT)
const app = express()

app.set('trust proxy', true)

app.get(
  '/:pictureId([0-9a-f]{32}):modifiers((?:-[^.]*)?).:extension(svg|png)',
  async (req, res) => {
    const { pictureId, extension, modifiers } = req.params

    const options = parseModifiers(modifiers)

    const paths = await getPathsByPictureId(pictureId)

    switch (extension) {
      case 'svg': {
        const svg = pathsToSvg(paths, options)
        res.contentType('image/svg+xml')
        res.set('Cache-Control', 'private, max-age=600')
        res.end(svg)
        break
      }

      case 'png': {
        const png = pathsToPng(paths, options)
        res.contentType('image/png')
        res.set('Cache-Control', 'private, max-age=600')
        png.pipe(res)
        break
      }
    }
  }
)

const server = createServer(app)

server.listen(PORT)
