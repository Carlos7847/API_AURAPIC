/**
 * Image Downloader Port
 *
 * Abstraction for HTTP image downloading.
 * Enables testing and alternative implementations (e.g., S3 direct, caching).
 *
 * @description Follows Dependency Inversion Principle
 */
export abstract class ImageDownloaderPort {
  /**
   * Download an image from a URL
   * @param url The image URL to download
   * @param timeoutMs Timeout in milliseconds
   * @returns The image data as a Buffer
   * @throws Error if download fails or times out
   */
  abstract download(url: string, timeoutMs: number): Promise<Buffer>;
}
