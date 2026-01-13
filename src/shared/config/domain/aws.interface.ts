export interface IAwsConfig {
  getAwsRegion(): string;
  getAwsAccessKeyId(): string;
  getAwsSecretAccessKey(): string;
  getS3Bucket(): string;
  getS3PresignedUrlExpiry(): number;
}
