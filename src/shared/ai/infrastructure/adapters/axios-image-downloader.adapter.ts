import { Injectable } from '@nestjs/common';
import axios, { AxiosInstance, AxiosError } from 'axios';
import { ImageDownloaderPort } from '../../domain/ports/image-downloader.port';
import { LoggerPort } from 'src/shared/logger/domain/logger.port';

/**
 * Axios Image Downloader Adapter
 *
 * Implementation of ImageDownloaderPort using axios.
 * Provides better timeout handling, interceptors, and error management.
 *
 * @extends {ImageDownloaderPort}
 */
@Injectable()
export class AxiosImageDownloaderAdapter extends ImageDownloaderPort {
  private readonly httpClient: AxiosInstance;

  constructor(private readonly logger: LoggerPort) {
    super();

    this.httpClient = axios.create({
      responseType: 'arraybuffer',
      maxRedirects: 5,
    });

    // Request interceptor for logging
    this.httpClient.interceptors.request.use((config) => {
      this.logger.debug(
        `Downloading image: ${config.url ?? 'unknown URL'}`,
        AxiosImageDownloaderAdapter.name,
      );
      return config;
    });

    // Response interceptor for error logging
    this.httpClient.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        this.logger.error(
          `Image download failed: ${error.message}`,
          AxiosImageDownloaderAdapter.name,
        );
        return Promise.reject(error);
      },
    );
  }

  /**
   * Download an image from a URL with timeout protection
   */
  async download(url: string, timeoutMs: number): Promise<Buffer> {
    try {
      const response = await this.httpClient.get<ArrayBuffer>(url, {
        timeout: timeoutMs,
      });

      return Buffer.from(response.data);
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        if (error.code === 'ECONNABORTED') {
          throw new Error(`Image download timed out after ${timeoutMs}ms`);
        }
        if (error.response) {
          throw new Error(
            `Failed to download image: ${error.response.status} ${error.response.statusText}`,
          );
        }
      }
      throw error;
    }
  }
}
