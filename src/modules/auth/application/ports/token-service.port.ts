import { Role } from '../../../../domain-contracts';

export const TOKEN_SERVICE = Symbol('TOKEN_SERVICE');

/** Claims stored inside the access token. */
export interface TokenPayload {
  sub: string;
  email: string;
  role: Role;
}

export interface ITokenService {
  sign(payload: TokenPayload): Promise<string>;
}
