export interface IEmailConfig {
  getSmtpHost(): string;
  getSmtpPort(): number;
  getSmtpUser(): string;
  getSmtpPass(): string;
  getMailFrom(): string;
}
