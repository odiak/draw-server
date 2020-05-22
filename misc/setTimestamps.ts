import admin from 'firebase-admin'

admin.initializeApp({
  credential: admin.credential.applicationDefault(),
  databaseURL: 'https://draw-9a1e4.firebaseio.com'
})

async function main() {
  const fdb = admin.firestore()
  const picturesCollection = fdb.collection('pictures')
  const pictures = await picturesCollection.listDocuments()
  for (const pictureRef of pictures) {
    const picture = await pictureRef.get()
    if (picture.exists && picture.data()?.createdAt != null) {
      continue
    }

    const [path] = (
      await pictureRef
        .collection('paths')
        .orderBy('timestamp', 'asc')
        .limit(1)
        .get()
    ).docs
    const timestamp: admin.firestore.Timestamp =
      path?.data().timestamp ?? admin.firestore.Timestamp.now()
    await pictureRef.set({ createdAt: timestamp }, { merge: true })
    console.log(pictureRef.id)
  }
}

main()
