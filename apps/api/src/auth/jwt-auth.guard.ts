import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';

export const AUTH_COOKIE = 'admin_token';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwt: JwtService) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest<Request>();
    const token = req.cookies?.[AUTH_COOKIE] as string | undefined;
    if (!token) throw new UnauthorizedException('No autenticado');
    try {
      await this.jwt.verifyAsync(token);
      return true;
    } catch {
      throw new UnauthorizedException('Sesión inválida o expirada');
    }
  }
}
