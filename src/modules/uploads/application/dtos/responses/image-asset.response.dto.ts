import { ApiProperty } from '@nestjs/swagger';

export class ImageAssetResponseDto {
  @ApiProperty({ description: 'ID del activo', example: 'cuid123' })
  id: string;

  @ApiProperty({
    description: 'ID del usuario propietario',
    example: 'user-456',
  })
  userId: string;

  @ApiProperty({
    description: 'Clave en Storage',
    example: 'inputs/user-456/img.jpg',
  })
  storageKey: string;

  @ApiProperty({ description: 'URL pública del activo' })
  url: string;

  @ApiProperty({
    description: 'Tipo de imagen',
    enum: ['input', 'output', 'thumbnail'],
  })
  kind: string;

  @ApiProperty({ description: 'Ancho en píxeles', nullable: true })
  width?: number;

  @ApiProperty({ description: 'Alto en píxeles', nullable: true })
  height?: number;

  @ApiProperty({ description: 'Tamaño en bytes', nullable: true })
  sizeBytes?: number;

  @ApiProperty({ description: 'Fecha de creación' })
  createdAt: Date;

  constructor(partial: Partial<ImageAssetResponseDto>) {
    Object.assign(this, partial);
  }
}
