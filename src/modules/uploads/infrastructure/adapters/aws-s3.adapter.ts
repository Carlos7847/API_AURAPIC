import { Injectable } from '@nestjs/common';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { StorageServicePort } from '../../domain/ports/storage.service.port';
import { S3OperationError } from '../exceptions/upload.exceptions';
import { EnvironmentConfigService } from '../../../../shared/config/infrastructure/environment-config.service';
import { LoggerPort } from '../../../../shared/logger/domain/logger.port';

@Injectable()
export class AwsS3Adapter implements StorageServicePort {
  private readonly s3Client: S3Client;
  private readonly bucket: string;

  constructor(
    private readonly configService: EnvironmentConfigService,
    private readonly logger: LoggerPort,
  ) {
    this.bucket = this.configService.getS3Bucket();

    this.s3Client = new S3Client({
      region: this.configService.getAwsRegion(),
      credentials: {
        accessKeyId: this.configService.getAwsAccessKeyId(),
        secretAccessKey: this.configService.getAwsSecretAccessKey(),
      },
      maxAttempts: 3,
    });
  }

  async generatePresignedPutUrl(
    key: string,
    contentType: string,
    expiresIn: number,
  ): Promise<string> {
    try {
      const command = new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        ContentType: contentType,
      });

      return await getSignedUrl(this.s3Client, command, { expiresIn });
    } catch (error) {
      return this.handleError('generatePresignedPutUrl', error, key);
    }
  }

  async generatePresignedGetUrl(
    key: string,
    expiresIn: number,
  ): Promise<string> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });
      return await getSignedUrl(this.s3Client, command, { expiresIn });
    } catch (error) {
      return this.handleError('generatePresignedGetUrl', error, key);
    }
  }

  async deleteObject(key: string): Promise<void> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });
      await this.s3Client.send(command);
      this.logger.log(`Object deleted: ${key}`);
    } catch (error) {
      this.handleError('deleteObject', error, key);
      // handleError lanza excepción, nunca retorna aquí
    }
  }

  async getObjectMetadata(key: string): Promise<{
    size: number;
    contentType: string;
    lastModified: Date;
  }> {
    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });
      const response = await this.s3Client.send(command);

      return {
        size: response.ContentLength ?? 0,
        contentType: response.ContentType ?? 'application/octet-stream',
        lastModified: response.LastModified ?? new Date(),
      };
    } catch (error) {
      return this.handleError('getObjectMetadata', error, key);
    }
  }

  private handleError(method: string, error: unknown, key: string): never {
    const message = error instanceof Error ? error.message : 'Unknown error';
    this.logger.error(`[${method}] Error processing key ${key}: ${message}`);

    throw new S3OperationError(method, message);
  }
}
