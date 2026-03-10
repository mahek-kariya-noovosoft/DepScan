import { PrismaLibSql } from '@prisma/adapter-libsql'
import { PrismaClient } from '../generated/prisma/client.js'

let _prismaInstance: PrismaClient | undefined

function createPrismaClient(): PrismaClient {
  const url = process.env.DATABASE_URL ?? 'file:./dev.db'
  // PrismaLibSql is a factory in Prisma 7 — pass config, not a pre-created client
  const adapter = new PrismaLibSql({ url })
  return new PrismaClient({ adapter })
}

export function getPrisma(): PrismaClient {
  if (!_prismaInstance) {
    _prismaInstance = createPrismaClient()
  }
  return _prismaInstance
}

// Proxy defers PrismaClient creation until the first property access, ensuring
// DATABASE_URL is read from process.env at call-time (not at module-load time).
// The double cast `as unknown as Record<...>` is unavoidable here: TypeScript cannot
// statically verify that a generic Proxy target satisfies the full PrismaClient interface.
export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    return (getPrisma() as unknown as Record<string | symbol, unknown>)[prop]
  },
})
