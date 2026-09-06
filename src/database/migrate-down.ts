import * as path from 'path'
import { promises as fs } from 'fs'
import { Migrator, FileMigrationProvider } from 'kysely/migration'
import { db } from './database'

async function migrateDown() {
  const migrator = new Migrator({
    db,
    provider: new FileMigrationProvider({
      fs,
      path,
      migrationFolder: path.join(__dirname, '../../migrations'),
    }),
  })

  const { error, results } = await migrator.migrateDown()

  results?.forEach((it) => {
    if (it.status === 'Success') {
      console.log(`✅ Rolled back "${it.migrationName}"`)
    } else if (it.status === 'Error') {
      console.error(`❌ Rollback failed "${it.migrationName}"`)
    }
  })

  if (error) {
    console.error('❌ Rollback failed:', error)
    process.exit(1)
  }

  console.log('🎉 Rollback complete!')
  await db.destroy()
}

migrateDown()
