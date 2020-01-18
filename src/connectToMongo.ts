import { MongoClient } from 'mongodb'

const DATABASE_URL = process.env.MONGODB_URI || 'mongodb://localhost:27017/draw'

export async function connectToMongo() {
  const mongoClient = await MongoClient.connect(DATABASE_URL, {
    useUnifiedTopology: true
  })
  const db = mongoClient.db()
  const picturesCollection = db.collection('pictures')
  picturesCollection.createIndex('id', { unique: true })

  return { mongoClient, db, picturesCollection }
}
