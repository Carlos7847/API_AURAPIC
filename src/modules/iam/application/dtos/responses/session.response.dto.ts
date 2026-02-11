import { ApiProperty } from '@nestjs/swagger';
import { Session } from '../../../domain/entities/session.entity';

export class SessionResponseDto {
  @ApiProperty({ description: 'Session ID' })
  id: string;

  @ApiProperty({
    description: 'Device information (browser/OS)',
    nullable: true,
  })
  deviceInfo: string | null;

  @ApiProperty({ description: 'IP address', nullable: true })
  ipAddress: string | null;

  @ApiProperty({ description: 'Last activity timestamp' })
  lastActiveAt: Date;

  @ApiProperty({ description: 'Session creation timestamp' })
  createdAt: Date;

  @ApiProperty({ description: 'Whether this is the current session' })
  isCurrent: boolean;

  constructor(session: Session, currentTokenHash?: string) {
    this.id = session.id;
    this.deviceInfo = session.deviceInfo ?? null;
    this.ipAddress = session.ipAddress ?? null;
    this.lastActiveAt = session.lastActiveAt;
    this.createdAt = session.createdAt;
    this.isCurrent = currentTokenHash === session.tokenHash;
  }
}
