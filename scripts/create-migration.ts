import { writeFile, readdir } from 'fs/promises'
import { join } from 'path'

async function createMigration(name: string) {
  if (!name) {
    console.error('❌ Migration name is required')
    console.log('Usage: npm run migrate:create <migration_name>')
    console.log('Example: npm run migrate:create add_winner_not_null')
    process.exit(1)
  }

  const migrationsDir = join(process.cwd(), 'migrations')

  // Read existing migrations to determine next number
  const files = await readdir(migrationsDir).catch(() => [])
  const migrationFiles = files.filter(f => f.endsWith('.ts'))

  // Extract numbers from existing migrations (e.g., "001_" -> 1)
  const numbers = migrationFiles
    .map(f => parseInt(f.split('_')[0]))
    .filter(n => !isNaN(n))

  const nextNumber = numbers.length > 0 ? Math.max(...numbers) + 1 : 1
  const paddedNumber = String(nextNumber).padStart(3, '0')

  // Sanitize migration name (replace spaces/special chars with underscores)
  const sanitizedName = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '')

  const fileName = `${paddedNumber}_${sanitizedName}.ts`
  const filePath = join(migrationsDir, fileName)

  const template = `import { Kysely, sql } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {
  // TODO: Implement migration
  // Example:
  // await db.schema
  //   .createTable('table_name')
  //   .addColumn('id', 'serial', (col) => col.primaryKey())
  //   .addColumn('name', 'varchar(255)', (col) => col.notNull())
  //   .execute()
}

export async function down(db: Kysely<any>): Promise<void> {
  // TODO: Implement rollback
  // Example:
  // await db.schema.dropTable('table_name').execute()
}
`

  await writeFile(filePath, template)

  console.log(`✅ Created migration: ${fileName}`)
  console.log(`📝 Edit: ${filePath}`)
  console.log('\nRun migration with: npm run migrate')
}

const migrationName = process.argv[2]
createMigration(migrationName)
