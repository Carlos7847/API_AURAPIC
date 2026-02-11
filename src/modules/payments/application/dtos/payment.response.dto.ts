import { ApiProperty } from '@nestjs/swagger';

export class PaymentResponseDto {
  @ApiProperty({ example: 'pay_123456' })
  id: string;

  @ApiProperty({ example: 'mercadopago' })
  providerCode: string;

  @ApiProperty({ example: 20.0 })
  amount: number;

  @ApiProperty({ example: 'PEN' })
  currency: string;

  @ApiProperty({ example: 'APPROVED' })
  status: string;

  @ApiProperty({ example: 'Pro Package - 60 Credits' })
  description?: string;

  @ApiProperty({ example: 60 })
  creditsAmount: number;

  @ApiProperty({ example: 'pkg_pro' })
  packageId?: string;

  @ApiProperty({ example: 'visa' })
  paymentMethodId?: string;

  @ApiProperty({ example: 'credit_card' })
  paymentTypeId?: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty({ nullable: true })
  approvedAt?: Date;

  constructor(partial: Partial<PaymentResponseDto>) {
    Object.assign(this, partial);
  }
}
