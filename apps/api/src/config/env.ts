import { z } from 'zod'

const envSchema = z.object({
  API_PORT: z.coerce.number().default(3333),
  DATABASE_URL: z.string().url(),
})

export type Env = z.infer<typeof envSchema>

export const env = envSchema.parse(process.env)
