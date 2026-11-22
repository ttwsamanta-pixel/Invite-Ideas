import { BadRequestException, Body, ConflictException, Controller, ForbiddenException, Get, Injectable, Post, Query, Req, Res, ServiceUnavailableException, UnauthorizedException, UseGuards, type CanActivate, type ExecutionContext } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { Throttle } from '@nestjs/throttler'
import { hash, verify } from 'argon2'
import type { Request, Response } from 'express'
import { OAuth2Client } from 'google-auth-library'
import { createTransport } from 'nodemailer'
import { z } from 'zod'
import { Db, digest, email, origin, password, short, token, validate } from './core'

export type Account = { id: string; email: string; name: string; role: 'ADMIN' | 'CUSTOMER' }
export type AuthRequest = Request & { account: Account }
const accountSelect = { id: true, email: true, name: true, role: true } as const
const cookie = () => ({ httpOnly: true, sameSite: 'lax' as const, secure: origin().startsWith('https:'), path: '/' })
const day = 86_400_000

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly jwt: JwtService, private readonly db: Db) {}
  async canActivate(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest<AuthRequest>()
    const claims = await this.jwt.verifyAsync<{ sub: string; sid: string }>(req.cookies.access || '', { audience: 'inviteideas' }).catch(() => null)
    if (!claims) throw new UnauthorizedException()
    const session = await this.db.session.findUnique({ where: { hash: claims.sid }, include: { user: { select: accountSelect } } })
    if (!session || session.userId !== claims.sub || session.expires <= new Date()) throw new UnauthorizedException()
    req.account = session.user
    return true
  }
}
@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext) {
    if (context.switchToHttp().getRequest<AuthRequest>().account?.role !== 'ADMIN') throw new ForbiddenException()
    return true
  }
}
@Injectable()
export class Mail {
  get available() { return Boolean(process.env.SMTP_URL && process.env.MAIL_FROM) }
  async send(to: string, subject: string, text: string) {
    if (!this.available) throw new ServiceUnavailableException('Email delivery is unavailable.')
    await createTransport(process.env.SMTP_URL!).sendMail({ to, subject, text, from: process.env.MAIL_FROM })
  }
}
@Injectable()
export class AuthService {
  constructor(private readonly db: Db, private readonly jwt: JwtService, private readonly mail: Mail) {}
  async signIn(res: Response, account: Account) {
    const refresh = token()
    const sid = digest(refresh)
    await this.db.session.create({ data: { hash: sid, userId: account.id, expires: new Date(Date.now() + 14 * day) } })
    res.cookie('access', await this.jwt.signAsync({ sub: account.id, sid }, { audience: 'inviteideas', expiresIn: '15m' }), { ...cookie(), maxAge: 900_000 })
    res.cookie('refresh', refresh, { ...cookie(), maxAge: 14 * day })
    return account
  }
  async emailToken(user: { id: string; email: string }, kind: 'verify' | 'reset') {
    const raw = token()
    await this.db.accountToken.create({ data: { hash: digest(raw), userId: user.id, kind, expires: new Date(Date.now() + (kind === 'verify' ? day : 3_600_000)) } })
    await this.mail.send(user.email, kind === 'verify' ? 'Verify your InviteIdeas email' : 'Reset your InviteIdeas password', origin() + '/' + kind + '?token=' + raw)
  }
}

@Controller('auth')
@Throttle({ default: { limit: 20, ttl: 60_000 } })
export class AuthController {
  constructor(private readonly db: Db, private readonly auth: AuthService, private readonly mail: Mail) {}

  @Post('register')
  async register(@Body() raw: unknown) {
    if (!this.mail.available) throw new ServiceUnavailableException('Email registration requires SMTP configuration.')
    const input = validate(z.object({ name: short, email, password, terms: z.literal(true) }), raw)
    const existing = await this.db.user.findUnique({ where: { email: input.email } })
    if (existing?.verifiedAt) return { message: 'Check your email or sign in if your account is already verified.' }
    const account = existing || await this.db.user.create({ data: { name: input.name, email: input.email } })
    await this.auth.emailToken(account, 'verify')
    return { message: 'Check your email for a verification link. Confirm your password on the verification page.' }
  }

  @Post('login')
  async login(@Body() raw: unknown, @Res({ passthrough: true }) res: Response) {
    const input = validate(z.object({ email, password: z.string().max(128) }), raw)
    const user = await this.db.user.findUnique({ where: { email: input.email } })
    if (!user?.password || !user.verifiedAt || !(await verify(user.password, input.password))) throw new UnauthorizedException('Invalid credentials or email pending verification.')
    return this.auth.signIn(res, { id: user.id, email: user.email, name: user.name, role: user.role })
  }

  @Post('forgot')
  async forgot(@Body() raw: unknown) {
    const input = validate(z.object({ email }), raw)
    const user = await this.db.user.findUnique({ where: { email: input.email } })
    if (user?.verifiedAt && this.mail.available) await this.auth.emailToken(user, 'reset')
    return { message: 'If this email has an account, check your inbox for a reset link.' }
  }

  @Post('complete')
  async complete(@Body() raw: unknown, @Res({ passthrough: true }) res: Response) {
    const input = validate(z.object({ token: z.string().regex(/^[a-f0-9]{64}$/), kind: z.enum(['verify', 'reset']), password }), raw)
    const passwordHash = await hash(input.password)
    const account = await this.db.$transaction(async tx => {
      const entry = await tx.accountToken.findUnique({ where: { hash: digest(input.token) }, include: { user: true } })
      if (!entry || entry.expires <= new Date() || entry.kind !== input.kind || (input.kind === 'verify' && entry.user.verifiedAt)) throw new BadRequestException('This link has expired or was already used.')
      const changed = await tx.user.updateMany({
        where: { id: entry.userId, password: entry.user.password, verifiedAt: entry.user.verifiedAt },
        data: { password: passwordHash, verifiedAt: entry.user.verifiedAt || new Date() },
      })
      if (changed.count !== 1) throw new ConflictException('This account was updated. Request a fresh link.')
      await tx.accountToken.deleteMany({ where: { userId: entry.userId } })
      await tx.session.deleteMany({ where: { userId: entry.userId } })
      return tx.user.findUniqueOrThrow({ where: { id: entry.userId }, select: accountSelect })
    })
    return this.auth.signIn(res, account)
  }

  @Post('refresh')
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    if (!req.cookies.refresh) throw new UnauthorizedException()
    const sid = digest(req.cookies.refresh)
    const session = await this.db.session.findUnique({ where: { hash: sid }, include: { user: { select: accountSelect } } })
    if (!session || session.expires <= new Date()) throw new UnauthorizedException()
    if ((await this.db.session.deleteMany({ where: { hash: sid } })).count !== 1) throw new UnauthorizedException()
    return this.auth.signIn(res, session.user)
  }

  @Post('logout')
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    if (req.cookies.refresh) await this.db.session.deleteMany({ where: { hash: digest(req.cookies.refresh) } })
    res.clearCookie('access', cookie()).clearCookie('refresh', cookie())
    return { ok: true }
  }

  @UseGuards(AuthGuard)
  @Get('me')
  me(@Req() req: AuthRequest) { return req.account }

  private googleClient() {
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) throw new ServiceUnavailableException('Google sign-in is unavailable.')
    return new OAuth2Client(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET, origin() + '/api/auth/google/callback')
  }
  @Get('google')
  google(@Res() res: Response) {
    const client = this.googleClient()
    const state = token()
    res.cookie('oauth_state', state, { ...cookie(), maxAge: 600_000 })
    res.redirect(client.generateAuthUrl({ scope: ['openid', 'email', 'profile'], state }))
  }
  @Get('google/callback')
  async callback(@Req() req: Request, @Res() res: Response, @Query('state') state: string, @Query('code') code: string) {
    const client = this.googleClient()
    if (!state || state !== req.cookies.oauth_state || typeof code !== 'string') throw new UnauthorizedException()
    res.clearCookie('oauth_state', cookie())
    const { tokens } = await client.getToken(code)
    const profile = (await client.verifyIdToken({ idToken: tokens.id_token || '', audience: process.env.GOOGLE_CLIENT_ID })).getPayload()
    if (!profile?.email || !profile.email_verified) throw new UnauthorizedException()
    const address = validate(email, profile.email)
    const account = await this.db.$transaction(async tx => {
      const linked = await tx.user.findUnique({ where: { googleId: profile.sub } })
      if (linked) return linked
      const existing = await tx.user.findUnique({ where: { email: address } })
      if (existing?.googleId || existing?.role === 'ADMIN') throw new ConflictException('This email is already linked or requires password sign-in.')
      if (existing) {
        const result = await tx.user.updateMany({
          where: { id: existing.id, googleId: null, role: 'CUSTOMER' },
          data: { googleId: profile.sub, verifiedAt: existing.verifiedAt || new Date() },
        })
        if (!result.count) throw new ConflictException('This account was updated. Try again.')
        if (!existing.verifiedAt) await tx.accountToken.deleteMany({ where: { userId: existing.id } })
        return existing
      }
      return tx.user.create({ data: { email: address, googleId: profile.sub, name: (profile.name || address).slice(0, 180), verifiedAt: new Date() } })
    })
    await this.auth.signIn(res, { id: account.id, email: account.email, name: account.name, role: account.role })
    res.redirect('/dashboard')
  }
}
