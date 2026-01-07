import { ApiProperty } from '@nestjs/swagger';

export class MessageResponseDto {
  @ApiProperty({
    description: 'Mensaje informativo sobre el resultado de la operación',
    example: 'Si el email existe, se enviaron instrucciones.',
  })
  message: string;
}
