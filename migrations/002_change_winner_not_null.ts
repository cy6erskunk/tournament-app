import { Kysely, sql } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {
    await sql`
      UPDATE matches 
      SET winner = CASE 
        WHEN player1_hits > player2_hits THEN player1
        WHEN player2_hits > player1_hits THEN player2
        ELSE player1
      END
      WHERE winner IS NULL
    `.execute(db)

    await sql`
      ALTER TABLE matches 
      ALTER COLUMN winner SET NOT NULL
    `.execute(db)
}

export async function down(db: Kysely<any>): Promise<void> {
    await sql`
      ALTER TABLE matches 
      ALTER COLUMN winner DROP NOT NULL
    `.execute(db)
}
