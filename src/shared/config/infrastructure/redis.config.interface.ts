export interface IRedisConfig {
  getRedisHost(): string;
  getRedisPort(): number;
  getEnableWorker(): boolean;
}
