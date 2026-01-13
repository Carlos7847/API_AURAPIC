import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/modules/iam/infrastructure/guards/jwt-auth.guard';
import { ActiveUser } from 'src/modules/iam/infrastructure/decorators/active-user.decorator';
import type { ActiveUserData } from 'src/modules/iam/domain/interfaces/active-user.interface';
import { PresignUploadUseCase } from '../../application/use-cases/presign-upload.use-case';
import { GetImageAssetsUseCase } from '../../application/use-cases/get-image-assets.use-case';
import { DeleteImageAssetUseCase } from '../../application/use-cases/delete-image-asset.use-case';
import { PresignUploadDto } from '../../application/dtos/presign-upload.dto';
import { PresignedUrlResponseDto } from '../../application/dtos/responses/presigned-url.response.dto';
import { ImageAssetResponseDto } from '../../application/dtos/responses/image-asset.response.dto';
import { Throttle } from '@nestjs/throttler';

@ApiTags('Uploads')
@Controller('api/v1/uploads')
@ApiBearerAuth()
export class UploadsController {
  constructor(
    private readonly presignUploadUseCase: PresignUploadUseCase,
    private readonly getImageAssetsUseCase: GetImageAssetsUseCase,
    private readonly deleteImageAssetUseCase: DeleteImageAssetUseCase,
  ) {}

  @ApiOperation({
    summary: 'Generar URL presignada para subir imagen',
    description:
      'Genera una URL firmada que el cliente usa para hacer PUT directo a S3. Válida por 5 minutos.',
  })
  @ApiResponse({
    status: 200,
    description: 'URL presignada generada exitosamente',
    type: PresignedUrlResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Tipo de archivo no permitido' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @Throttle({ default: { limit: 10, ttl: 60000 } }) // 10 requests/min
  @UseGuards(JwtAuthGuard)
  @Post('presign')
  @HttpCode(HttpStatus.OK)
  async presignUpload(
    @ActiveUser() user: ActiveUserData,
    @Body() dto: PresignUploadDto,
  ): Promise<PresignedUrlResponseDto> {
    return this.presignUploadUseCase.execute(user.userId, dto);
  }

  @ApiOperation({
    summary: 'Listar imágenes del usuario',
    description:
      'Obtiene lista paginada de imágenes (input, output o thumbnail)',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de imágenes obtenida',
    schema: {
      properties: {
        data: {
          type: 'array',
          items: { $ref: '#/components/schemas/ImageAssetResponseDto' },
        },
        total: { type: 'number' },
        limit: { type: 'number' },
        offset: { type: 'number' },
      },
    },
  })
  @UseGuards(JwtAuthGuard)
  @Get('gallery')
  @HttpCode(HttpStatus.OK)
  async getImageAssets(
    @ActiveUser() user: ActiveUserData,
    @Query('kind') kind?: 'input' | 'output' | 'thumbnail',
    @Query('limit') limit: number = 50,
    @Query('offset') offset: number = 0,
  ) {
    return this.getImageAssetsUseCase.execute(
      user.userId,
      kind,
      Math.min(limit, 100), // Max 100 items
      offset,
    );
  }

  @ApiOperation({
    summary: 'Obtener detalles de una imagen',
  })
  @ApiResponse({
    status: 200,
    description: 'Detalles de la imagen',
    type: ImageAssetResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Imagen no encontrada' })
  @UseGuards(JwtAuthGuard)
  @Get('gallery/:id')
  @HttpCode(HttpStatus.OK)
  async getImageAsset(@Param('id') id: string): Promise<ImageAssetResponseDto> {
    return this.getImageAssetsUseCase.getById(id);
  }

  @ApiOperation({
    summary: 'Eliminar una imagen',
    description: 'Elimina la imagen de S3 y de la base de datos',
  })
  @ApiResponse({
    status: 204,
    description: 'Imagen eliminada exitosamente',
  })
  @ApiResponse({ status: 404, description: 'Imagen no encontrada' })
  @ApiResponse({ status: 403, description: 'No tiene permisos para eliminar' })
  @UseGuards(JwtAuthGuard)
  @Delete('gallery/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteImageAsset(
    @ActiveUser() user: ActiveUserData,
    @Param('id') id: string,
  ): Promise<void> {
    return this.deleteImageAssetUseCase.execute(user.userId, id);
  }
}
