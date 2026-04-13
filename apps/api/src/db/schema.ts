import { pgTable, serial, text, integer, timestamp } from 'drizzle-orm/pg-core'

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  github_id: text('github_id').notNull().unique(),
  avatar_url: text('avatar_url'),
  created_at: timestamp('created_at').defaultNow().notNull(),
})

export const repositories = pgTable('repositories', {
  id: serial('id').primaryKey(),
  user_id: integer('user_id')
    .references(() => users.id)
    .notNull(),
  github_repo_name: text('github_repo_name').notNull(),
  github_repo_url: text('github_repo_url').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
})

export const summaries = pgTable('summaries', {
  id: serial('id').primaryKey(),
  repository_id: integer('repository_id')
    .references(() => repositories.id)
    .notNull(),
  type: text('type').notNull(),
  content: text('content').notNull(),
  github_ref: text('github_ref'),
  created_at: timestamp('created_at').defaultNow().notNull(),
})
