export class InvalidFileTypeError extends Error {
  constructor(fileType: string, allowedTypes: string[]) {
    super(
      `Invalid file type: ${fileType}. Allowed types: ${allowedTypes.join(', ')}`,
    );
    this.name = 'InvalidFileTypeError';
  }
}

export class FileSizeTooLargeError extends Error {
  constructor(fileSize: number, maxSize: number) {
    super(
      `File size ${fileSize} bytes exceeds maximum allowed ${maxSize} bytes`,
    );
    this.name = 'FileSizeTooLargeError';
  }
}

export class ImageAssetNotFoundError extends Error {
  constructor(id: string) {
    super(`Image asset with id ${id} not found`);
    this.name = 'ImageAssetNotFoundError';
  }
}

export class UnauthorizedAssetAccessError extends Error {
  constructor(userId: string, assetId: string) {
    super(`User ${userId} is not authorized to access asset ${assetId}`);
    this.name = 'UnauthorizedAssetAccessError';
  }
}
