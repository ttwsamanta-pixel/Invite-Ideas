import { existsSync } from 'node:fs'
import { loadEnvFile } from 'node:process'
import { fileURLToPath } from 'node:url'

const rootEnv = fileURLToPath(new URL('../../.env', import.meta.url))
if (existsSync(rootEnv)) loadEnvFile(rootEnv)
await import('next/dist/bin/next')
