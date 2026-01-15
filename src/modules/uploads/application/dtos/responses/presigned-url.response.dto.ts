import { ApiProperty } from '@nestjs/swagger';

export class PresignedUrlResponseDto {
  @ApiProperty({
    description: 'Identificador único de la imagen en la BD',
    example: 'cuid123xyz',
  })
  imageId: string;

  @ApiProperty({
    description: 'Clave del objeto en Storage',
    example: 'inputs/user-123/1704067200000-product.jpg',
  })
  storageKey: string;

  @ApiProperty({
    description: 'URL presignada para subir el archivo (PUT)',
    example:
      'https://s3.amazonaws.com/bucket/key?X-Amz-Algorithm=AWS4-HMAC-SHA256&...',
  })
  presignedUrl: string;

  @ApiProperty({
    description: 'Segundos hasta que expire la URL',
    example: 300,
  })
  expiresIn: number;

  @ApiProperty({
    description: 'MIME type esperado',
    example: 'image/jpeg',
  })
  contentType: string;

  @ApiProperty({
    description: 'Timestamp cuando se generó la URL',
    example: '2024-01-07T10:30:00Z',
  })
  generatedAt: Date;

  constructor(partial: Partial<PresignedUrlResponseDto>) {
    Object.assign(this, partial);
  }
}
