import { Kysely, sql } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {
  // Create submitter_devices table for device registration and audit trail
  await db.schema
    .createTable('submitter_devices')
    .addColumn('device_token', 'varchar(64)', (col) => col.primaryKey())
    .addColumn('submitter_name', 'varchar(255)', (col) => col.notNull())
    .addColumn('created_at', 'timestamp', (col) => col.defaultTo(sql`CURRENT_TIMESTAMP`).notNull())
    .addColumn('last_used', 'timestamp')
    .execute()

  // Add require_submitter_identity flag to tournaments table
  await db.schema
    .alterTable('tournaments')
    .addColumn('require_submitter_identity', 'boolean', (col) => col.defaultTo(false).notNull())
    .execute()

  // Add audit trail columns to matches table
  await db.schema
    .alterTable('matches')
    .addColumn('submitted_by_token', 'varchar(64)', (col) =>
      col.references('submitter_devices.device_token').onDelete('set null')
    )
    .addColumn('submitted_at', 'timestamp')
    .execute()
}

export async function down(db: Kysely<any>): Promise<void> {
  // Remove audit trail columns from matches table
  await db.schema
    .alterTable('matches')
    .dropColumn('submitted_by_token')
    .dropColumn('submitted_at')
    .execute()

  // Remove require_submitter_identity from tournaments table
  await db.schema
    .alterTable('tournaments')
    .dropColumn('require_submitter_identity')
    .execute()

  // Drop submitter_devices table
  await db.schema
    .dropTable('submitter_devices')
    .execute()
}
