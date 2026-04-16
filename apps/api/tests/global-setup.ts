import { config } from 'dotenv'
import { resolve } from 'node:path'
import { execSync } from 'node:child_process'

export async function setup() {
  config({ path: resolve(process.cwd(), '.env.test') })

  execSync('npx drizzle-kit migrate', {
    cwd: process.cwd(),
    env: { ...process.env },
    stdio: 'inherit',
  })
}
