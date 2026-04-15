import { pgTable, serial, text, integer, boolean, timestamp, index, uniqueIndex } from 'drizzle-orm/pg-core'

export const users = pgTable('users', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('email_verified').notNull().default(false),
  image: text('image'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().$onUpdate(() => new Date()).notNull(),
})

export const sessions = pgTable('sessions', {
  id: text('id').primaryKey(),
  expiresAt: timestamp('expires_at').notNull(),
  token: text('token').notNull().unique(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().$onUpdate(() => new Date()).notNull(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  userId: text('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
})

export const accounts = pgTable('accounts', {
  id: text('id').primaryKey(),
  accountId: text('account_id').notNull(),
  providerId: text('provider_id').notNull(),
  userId: text('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  idToken: text('id_token'),
  accessTokenExpiresAt: timestamp('access_token_expires_at'),
  refreshTokenExpiresAt: timestamp('refresh_token_expires_at'),
  scope: text('scope'),
  password: text('password'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().$onUpdate(() => new Date()).notNull(),
})

export const verifications = pgTable('verifications', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().$onUpdate(() => new Date()),
})

export const repositories = pgTable(
  'repositories',
  {
    id: serial('id').primaryKey(),
    userId: text('user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    githubRepoName: text('github_repo_name').notNull(),
    githubRepoUrl: text('github_repo_url').notNull(),
    isPrivate: boolean('is_private').notNull().default(false),
    description: text('description'),
    defaultBranch: text('default_branch').notNull().default('main'),
    stars: integer('stars').notNull().default(0),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().$onUpdate(() => new Date()).notNull(),
  },
  (t) => [
    index('repositories_user_id_idx').on(t.userId),
    uniqueIndex('repositories_user_id_github_repo_name_idx').on(t.userId, t.githubRepoName),
  ],
)

export const summaries = pgTable(
  'summaries',
  {
    id: serial('id').primaryKey(),
    repositoryId: integer('repository_id')
      .references(() => repositories.id, { onDelete: 'cascade' })
      .notNull(),
    type: text('type').notNull(),
    content: text('content').notNull(),
    githubRef: text('github_ref'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (t) => [index('summaries_repository_id_idx').on(t.repositoryId)],
)
