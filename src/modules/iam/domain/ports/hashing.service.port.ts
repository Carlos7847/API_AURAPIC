export abstract class HashingServicePort {
  abstract hash(data: string): Promise<string>;
  abstract compare(data: string, encrypted: string): Promise<boolean>;
  abstract hashToken(token: string): string | Promise<string>; // para tokens se usa un hash más simple
}
