export interface IAppConfig {
  getPort(): number;
  getEnvironment(): string;
  getCorsOrigins(): string[];
  getFrontendUrl(): string;
}
