import 'reflect-metadata'
import { Module } from '@nestjs/common'
import { APP_GUARD, NestFactory } from '@nestjs/core'
import { JwtModule } from '@nestjs/jwt'
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler'
import type { NestExpressApplication } from '@nestjs/platform-express'
import { json, type Request, type Response, type NextFunction } from 'express'
import cookieParser from 'cookie-parser'
import helmet from 'helmet'
import { AdminController } from './admin'
import { AdminGuard, AuthController, AuthGuard, AuthService, Mail } from './auth'
import { Db, origin } from './core'
import { Invitations, InvitationsController } from './invitations'
import { PaymentController, Payments } from './payments'

const secret = process.env.JWT_SECRET
if (!secret || secret.length < 32) throw new Error('Set JWT_SECRET to a random value of at least 32 characters.')

@Module({
  imports: [JwtModule.register({ secret }), ThrottlerModule.forRoot([{ ttl: 60_000, limit: 120 }])],
  controllers: [AuthController, InvitationsController, PaymentController, AdminController],
  providers: [Db, AuthGuard, AdminGuard, AuthService, Mail, Invitations, Payments, { provide: APP_GUARD, useClass: ThrottlerGuard }],
})
class AppModule {}

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, { bodyParser: false })
  app.setGlobalPrefix('api')
  if (process.env.NODE_ENV === 'production') app.set('trust proxy', 'loopback')
  app.use(helmet({ contentSecurityPolicy: false }))
  app.use(cookieParser())
  app.use((req: Request, res: Response, next: NextFunction) => {
    res.setHeader('Cache-Control', 'no-store')
    if (!['GET', 'HEAD', 'OPTIONS'].includes(req.method) && req.path !== '/api/payments/webhook' && req.get('origin') !== origin()) {
      res.status(403).json({ message: 'Request origin rejected.' })
      return
    }
    next()
  })
  app.use(json({
    limit: '8mb',
    verify(req, _res, buffer) {
      if (req.url === '/api/payments/webhook') (req as Request & { rawBody?: Buffer }).rawBody = buffer
    },
  }))
  app.enableShutdownHooks()
  await app.listen(Number(process.env.API_PORT || 4000), '127.0.0.1')
}
void bootstrap()
