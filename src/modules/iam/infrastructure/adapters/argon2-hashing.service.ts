import { Injectable } from '@nestjs/common';
import * as argon2 from 'argon2';
import { HashingServicePort } from '../../domain/ports/hashing.service.port';
import * as crypto from 'node:crypto';

@Injectable()
export class Argon2HashingService implements HashingServicePort {
  async hash(data: string): Promise<string> {
    return argon2.hash(data, {
      type: argon2.argon2id,
      memoryCost: 2 ** 16, // 64 MB (Ajustable para el servidor)
      timeCost: 3,
      parallelism: 1,
    });
  }

  async compare(data: string, encrypted: string): Promise<boolean> {
    return argon2.verify(encrypted, data);
  }

  hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }
}
