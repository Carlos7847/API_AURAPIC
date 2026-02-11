import { ApiProperty } from '@nestjs/swagger';

export class CreditPackageResponseDto {
  @ApiProperty({ example: 'pkg-pro' })
  id: string;

  @ApiProperty({ example: 'Pro' })
  name: string;

  @ApiProperty({ example: 60 })
  credits: number;

  @ApiProperty({ example: 20.0 })
  price: number;

  @ApiProperty({ example: 'PEN' })
  currency: string;

  @ApiProperty({ example: 'Ideal para usuarios regulares', nullable: true })
  description: string | null;

  @ApiProperty({ example: 0.33 })
  pricePerCredit: number;

  @ApiProperty({
    example: ['60 Créditos', 'Exportación 4K'],
    type: [String],
  })
  features: readonly string[];

  @ApiProperty({
    example: { popular: true, badge: 'Más popular' },
    nullable: true,
  })
  metadata: Record<string, unknown> | null;
}
