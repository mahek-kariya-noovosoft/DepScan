import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const testDbPath = path.resolve(__dirname, '../../prisma/test.db')

// Must be set before any Prisma client is created
process.env.DATABASE_URL = `file:${testDbPath}`

// 32-byte all-zeros key for testing only — never use this in production
process.env.TOKEN_ENCRYPTION_KEY = '0000000000000000000000000000000000000000000000000000000000000000'
