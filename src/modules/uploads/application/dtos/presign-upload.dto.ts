import { IsString, IsNotEmpty, IsEnum, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO para solicitar una URL presignada
 */
export class PresignUploadDto {
  @ApiProperty({
    description: 'Nombre del archivo a subir',
    example: 'product-photo.jpg',
  })
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  filename: string;

  @ApiProperty({
    description: 'MIME type del archivo',
    example: 'image/jpeg',
  })
  @IsNotEmpty()
  @IsString()
  contentType: string;

  @ApiProperty({
    description: 'Tipo de imagen (input o thumbnail si es procesada)',
    enum: ['input', 'output', 'thumbnail'],
    default: 'input',
  })
  @IsEnum(['input', 'output', 'thumbnail'])
  kind: 'input' | 'output' | 'thumbnail' = 'input';
}
