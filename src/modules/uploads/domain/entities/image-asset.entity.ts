import { InvalidImageAssetError } from '../errors/image-asset.errors';

export type ImageAssetKind = 'input' | 'output' | 'thumbnail';

export interface ImageAssetProps {
  id: string;
  userId: string;
  s3Key: string;
  url: string;
  kind: ImageAssetKind;
  width?: number;
  height?: number;
  sizeBytes?: number;
  createdAt: Date;
}

export class ImageAsset {
  private constructor(private readonly props: ImageAssetProps) {}

  // Getters
  get id(): string {
    return this.props.id;
  }

  get userId(): string {
    return this.props.userId;
  }

  get s3Key(): string {
    return this.props.s3Key;
  }

  get url(): string {
    return this.props.url;
  }

  get kind(): ImageAssetKind {
    return this.props.kind;
  }

  get width(): number | undefined {
    return this.props.width;
  }

  get height(): number | undefined {
    return this.props.height;
  }

  get sizeBytes(): number | undefined {
    return this.props.sizeBytes;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  // Business Logic
  public isOwnedBy(userId: string): boolean {
    return this.props.userId === userId;
  }

  public isThumbnail(): boolean {
    return this.props.kind === 'thumbnail';
  }

  // Factory Methods
  static create(props: ImageAssetProps): ImageAsset {
    if (!props.s3Key || props.s3Key.trim() === '') {
      throw new InvalidImageAssetError('s3Key', 'is required');
    }
    if (!props.userId || props.userId.trim() === '') {
      throw new InvalidImageAssetError('userId', 'is required');
    }
    if (!props.url || props.url.trim() === '') {
      throw new InvalidImageAssetError('url', 'is required');
    }
    return new ImageAsset(props);
  }

  static restore(props: ImageAssetProps): ImageAsset {
    return new ImageAsset(props);
  }
}
