import { MongoClient } from 'mongodb'
import admin from 'firebase-admin'

const [, , dbUri, minutesStr] = process.argv
const minutes = minutesStr != null ? parseInt(minutesStr) : null

admin.initializeApp({
  credential: admin.credential.applicationDefault(),
  databaseURL: 'https://draw-9a1e4.firebaseio.com'
})

async function main() {
  const client = await MongoClient.connect(dbUri, { useUnifiedTopology: true })
  const db = client.db()
  const picturesCollection = db.collection('pictures')

  const condition: any = {}
  if (minutes != null) {
    condition['updatedAt'] = { $gt: new Date(Date.now() - minutes * 1000 * 60) }
  }

  const fdb = admin.firestore()
  let batch = fdb.batch()
  let n = 0
  async function processBatch(f: () => void) {
    console.log('.')
    f()
    n++
    if (n >= 400) {
      await batch.commit()
      n = 0
      batch = fdb.batch()
      await sleep(1000)
    }
  }

  const cur = picturesCollection.find(condition)
  while (await cur.hasNext()) {
    const picture = await cur.next()
    console.log(picture.id)
    const doc = fdb.collection('pictures').doc(picture.id)
    if (picture.title != null) {
      await processBatch(() => {
        batch.set(doc, { title: picture.title }, { merge: true })
      })
    }
    if (picture.paths != null) {
      for (const { id: pathId, points, ...rest } of picture.paths) {
        const rawPoints: any[] = []
        for (const { x, y } of points) {
          rawPoints.push(x, y)
        }
        await processBatch(() => {
          batch.set(
            doc.collection('paths').doc(pathId),
            { ...rest, points: rawPoints },
            { merge: true }
          )
        })
      }
    }
  }
  await batch.commit()
  await cur.close()
  await client.close()
}

async function sleep(msec: number): Promise<void> {
  return new Promise((r) => {
    setTimeout(r, msec)
  })
}

main()
