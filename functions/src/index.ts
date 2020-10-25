import * as functions from 'firebase-functions'
import * as firebase from 'firebase-admin'

firebase.initializeApp()

const defaultRegion = 'asia-northeast1'

export const migrateData = functions.region(defaultRegion).https.onCall(
  async ({ token }: { token: string }, context): Promise<void> => {
    const db = firebase.firestore()

    const { uid } = context.auth!
    const ds = await db
      .collection('migrationTokens')
      .doc(token)
      .get()
    const oldUid = ds.data()!.uid

    const qs = await db
      .collection('pictures')
      .where('ownerId', '==', oldUid)
      .get()

    const bulkWriter = db.bulkWriter()

    for (const d of qs.docs) {
      bulkWriter.update(d.ref, { ownerId: uid })
    }

    await bulkWriter.close()

    await ds.ref.delete()
  }
)
