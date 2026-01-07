import { ApiProperty } from '@nestjs/swagger';

export class MessageResponseDto {
  @ApiProperty({
    description: 'Mensaje informativo sobre el resultado de la operación',
  })
  message: string;
}
