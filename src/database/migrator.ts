import * as path from 'path'
import { promises as fs } from 'fs'
import { Migrator, FileMigrationProvider } from 'kysely/migration'
import { db } from './database'

async function migrateToLatest() {
  const migrator = new Migrator({
    db,
    provider: new FileMigrationProvider({
      fs,
      path,
      migrationFolder: path.join(__dirname, '../../migrations'),
    }),
  })

  const { error, results } = await migrator.migrateToLatest()

  results?.forEach((it) => {
    if (it.status === 'Success') {
      console.log(`✅ Migration "${it.migrationName}" executed successfully`)
    } else if (it.status === 'Error') {
      console.error(`❌ Migration "${it.migrationName}" failed`)
    }
  })

  if (error) {
    console.error('❌ Migration failed:', error)
    process.exit(1)
  }

  console.log('🎉 All migrations complete!')
  await db.destroy()
}

migrateToLatest()
