import { Injectable } from '@nestjs/common';
import axios, { AxiosInstance, AxiosError } from 'axios';
import { ImageDownloaderPort } from '../../domain/ports/image-downloader.port';
import { LoggerPort } from 'src/shared/logger/domain/logger.port';

/**
 * SSRF-Protected URL Validator
 *
 * Blocks requests to:
 * - Private IP ranges (10.x, 172.16-31.x, 192.168.x)
 * - Localhost and loopback
 * - Cloud metadata endpoints (169.254.169.254)
 * - Link-local addresses
 */
class SsrfProtector {
  private static readonly ALLOWED_HOSTS = [
    's3.amazonaws.com',
    's3.us-east-1.amazonaws.com',
    's3.us-west-2.amazonaws.com',
    's3.sa-east-1.amazonaws.com',
    'cloudfront.net',
  ];

  private static readonly BLOCKED_HOSTNAMES = [
    'localhost',
    '127.0.0.1',
    '0.0.0.0',
    '169.254.169.254', // AWS/GCP metadata
    'metadata.google.internal', // GCP metadata
  ];

  /**
   * Validates a URL against SSRF attacks
   * @throws Error if URL is not allowed
   */
  static validateUrl(url: string): void {
    let parsedUrl: URL;

    try {
      parsedUrl = new URL(url);
    } catch {
      throw new Error('SSRF Protection: Invalid URL format');
    }

    // Block non-HTTP(S) protocols
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      throw new Error(
        `SSRF Protection: Protocol not allowed: ${parsedUrl.protocol}`,
      );
    }

    const hostname = parsedUrl.hostname.toLowerCase();

    // Block known dangerous hostnames
    if (this.BLOCKED_HOSTNAMES.includes(hostname)) {
      throw new Error(`SSRF Protection: Blocked hostname: ${hostname}`);
    }

    // Block private IP ranges
    if (this.isPrivateIp(hostname)) {
      throw new Error(`SSRF Protection: Private IP not allowed: ${hostname}`);
    }

    // Check against allowlist
    const isAllowed = this.ALLOWED_HOSTS.some(
      (allowedHost) =>
        hostname === allowedHost || hostname.endsWith(`.${allowedHost}`),
    );

    if (!isAllowed) {
      throw new Error(`SSRF Protection: Host not in allowlist: ${hostname}`);
    }
  }

  /**
   * Checks if an IP address is in a private range
   */
  private static isPrivateIp(hostname: string): boolean {
    // Check if it's an IP address
    const ipv4Regex = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
    const match = hostname.match(ipv4Regex);

    if (!match) {
      return false; // Not an IP, skip private IP check
    }

    const octets = match.slice(1).map(Number);
    const [first, second] = octets;

    // 10.0.0.0/8
    if (first === 10) return true;

    // 172.16.0.0/12
    if (first === 172 && second >= 16 && second <= 31) return true;

    // 192.168.0.0/16
    if (first === 192 && second === 168) return true;

    // 127.0.0.0/8 (loopback)
    if (first === 127) return true;

    // 169.254.0.0/16 (link-local)
    if (first === 169 && second === 254) return true;

    // 0.0.0.0
    if (first === 0) return true;

    return false;
  }
}

/**
 * Axios Image Downloader Adapter
 *
 * Implementation of ImageDownloaderPort using axios.
 * Includes SSRF protection to prevent server-side request forgery attacks.
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
   * Download an image from a URL with timeout and SSRF protection
   * @throws Error if URL is blocked by SSRF protection
   */
  async download(url: string, timeoutMs: number): Promise<Buffer> {
    // SSRF Protection: Validate URL before making request
    SsrfProtector.validateUrl(url);

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
