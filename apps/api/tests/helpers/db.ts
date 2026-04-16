import { getTableName, is, sql } from 'drizzle-orm'
import { PgTable } from 'drizzle-orm/pg-core'
import { db } from '@/db/client'
import * as schema from '@/db/schema'

export async function resetDatabase() {
  const tables = Object.values(schema)
    .filter((value): value is PgTable => is(value, PgTable))
    .map((table) => sql.identifier(getTableName(table)))

  if (tables.length === 0) return

  await db.execute(sql`TRUNCATE ${sql.join(tables, sql`, `)} CASCADE`)
}
