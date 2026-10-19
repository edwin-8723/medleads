import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Throttle } from '@nestjs/throttler';
import type { Response } from 'express';
import { AuthService } from './auth.service.js';
import { AUTH_COOKIE, JwtAuthGuard } from './jwt-auth.guard.js';
import { LoginDto } from './login.dto.js';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly config: ConfigService,
  ) {}

  private cookieOptions() {
    return {
      httpOnly: true,
      sameSite: 'lax' as const,
      secure: this.config.get('NODE_ENV') === 'production',
      path: '/',
    };
  }

  /** 5 intentos por minuto por IP para frenar fuerza bruta. */
  @Post('login')
  @HttpCode(200)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const token = await this.auth.login(dto.password);
    res.cookie(AUTH_COOKIE, token, {
      ...this.cookieOptions(),
      maxAge: 8 * 3600 * 1000,
    });
    return { ok: true };
  }

  @Post('logout')
  @HttpCode(200)
  logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie(AUTH_COOKIE, this.cookieOptions());
    return { ok: true };
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  me() {
    return { authenticated: true };
  }
}
