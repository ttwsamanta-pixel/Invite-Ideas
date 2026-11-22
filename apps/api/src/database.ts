import { Injectable, type OnModuleDestroy } from '@nestjs/common'
import { PrismaMariaDb } from '@prisma/adapter-mariadb'
import { PrismaClient } from './generated/client'

@Injectable()
export class Db extends PrismaClient implements OnModuleDestroy {
  constructor() {
    const databaseUrl = process.env.DATABASE_URL
    if (!databaseUrl) throw new Error('Set DATABASE_URL to a MySQL connection URL.')
    const url = new URL(databaseUrl)
    if (url.protocol !== 'mysql:') throw new Error('DATABASE_URL must use the mysql protocol.')
    super({ adapter: new PrismaMariaDb({
      host: url.hostname, port: Number(url.port || 3306), user: decodeURIComponent(url.username),
      password: decodeURIComponent(url.password), database: decodeURIComponent(url.pathname.slice(1)),
      connectionLimit: 10, timezone: '+00:00', ssl: url.searchParams.get('ssl') === 'true' ? { rejectUnauthorized: true } : undefined,
    }) })
  }

  async onModuleDestroy() { await this.$disconnect() }
}
