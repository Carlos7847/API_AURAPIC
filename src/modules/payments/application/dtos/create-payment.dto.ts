import { IsString, IsOptional, IsUrl, IsIn } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePaymentDto {
  @ApiProperty({
    description: 'Payment provider code',
    example: 'mercadopago',
    enum: ['mercadopago', 'culqi', 'crypto'],
  })
  @IsString()
  @IsIn(['mercadopago', 'culqi', 'crypto'])
  providerCode: string;

  @ApiProperty({
    description: 'Credit package ID to purchase',
    example: 'cljk123456',
  })
  @IsString()
  packageId: string;

  @ApiPropertyOptional({
    description:
      'Idempotency key for duplicate prevention (client-generated UUID)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsOptional()
  @IsString()
  idempotencyKey?: string;

  @ApiPropertyOptional({
    description: 'Success redirect URL',
    example: 'https://myapp.com/payment/success',
  })
  @IsOptional()
  @IsUrl()
  successUrl?: string;

  @ApiPropertyOptional({
    description: 'Failure redirect URL',
    example: 'https://myapp.com/payment/failure',
  })
  @IsOptional()
  @IsUrl()
  failureUrl?: string;

  @ApiPropertyOptional({
    description: 'Pending redirect URL',
    example: 'https://myapp.com/payment/pending',
  })
  @IsOptional()
  @IsUrl()
  pendingUrl?: string;
}
