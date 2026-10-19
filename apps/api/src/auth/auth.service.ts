import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { createHash, timingSafeEqual } from 'node:crypto';

const sha256 = (v: string) => createHash('sha256').update(v).digest();

@Injectable()
export class AuthService {
  constructor(
    private readonly config: ConfigService,
    private readonly jwt: JwtService,
  ) {}

  /** Usuario admin único: la contraseña vive en ADMIN_PASSWORD (variable de entorno). */
  async login(password: string): Promise<string> {
    const expected = this.config.getOrThrow<string>('ADMIN_PASSWORD');
    // Se comparan hashes de igual longitud con timingSafeEqual para evitar timing attacks.
    if (!timingSafeEqual(sha256(password), sha256(expected))) {
      throw new UnauthorizedException('Contraseña incorrecta');
    }
    return this.jwt.signAsync({ sub: 'admin', role: 'admin' });
  }
}
