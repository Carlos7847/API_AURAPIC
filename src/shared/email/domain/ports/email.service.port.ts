export interface EmailOptions {
  to: string;
  subject: string;
  template?: string; // archivo template (ej: 'welcome')
  context?: Record<string, any>; // variables (ej: { name: 'Juan' })
  html?: string;
}

export abstract class EmailServicePort {
  abstract send(options: EmailOptions): Promise<void>;
}
