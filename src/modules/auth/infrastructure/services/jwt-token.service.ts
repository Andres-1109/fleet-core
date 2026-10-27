import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
  ITokenService,
  TokenPayload,
} from '../../application/ports/token-service.port';

/** Signs access tokens; secret and expiration are configured in AuthModule. */
@Injectable()
export class JwtTokenService implements ITokenService {
  constructor(private readonly jwtService: JwtService) {}

  sign(payload: TokenPayload): Promise<string> {
    return this.jwtService.signAsync(payload);
  }
}
