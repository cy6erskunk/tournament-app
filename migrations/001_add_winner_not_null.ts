import { Kysely, sql } from 'kysely'

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
