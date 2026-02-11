import { ApiProperty } from '@nestjs/swagger';

export class SubscriptionResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  plan: string;

  @ApiProperty()
  status: string;

  @ApiProperty()
  creditsRemaining: number;

  @ApiProperty({ nullable: true })
  currentPeriodEnd: Date | null;

  constructor(partial: Partial<SubscriptionResponseDto>) {
    Object.assign(this, partial);
  }
}
