import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { IPasswordHasher } from '../../../../domain-contracts';

const SALT_ROUNDS = 10;

@Injectable()
export class BcryptPasswordHasher implements IPasswordHasher {
  hash(plainText: string): Promise<string> {
    return bcrypt.hash(plainText, SALT_ROUNDS);
  }

  compare(plainText: string, hash: string): Promise<boolean> {
    return bcrypt.compare(plainText, hash);
  }
}
