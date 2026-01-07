import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import {
  EmailServicePort,
  EmailOptions,
} from '../../domain/ports/email.service.port';
import { EnvironmentConfigService } from '../../../config/infrastructure/environment-config.service';

@Injectable()
export class NodemailerEmailService implements EmailServicePort {
  private readonly transporter: nodemailer.Transporter;
  private readonly logger = new Logger(NodemailerEmailService.name);

  constructor(private readonly config: EnvironmentConfigService) {
    this.transporter = nodemailer.createTransport({
      host: config.getSmtpHost(),
      port: config.getSmtpPort(),
      secure: config.getSmtpPort() === 465,
      auth: {
        user: config.getSmtpUser(),
        pass: config.getSmtpPass(),
      },
    });
  }

  async send(options: EmailOptions): Promise<void> {
    try {
      const htmlContent = options.html;

      // htmlContent = this.templateEngine.render(options.template, options.context);

      await this.transporter.sendMail({
        from: this.config.getMailFrom(),
        to: options.to,
        subject: options.subject,
        html: htmlContent,
      });

      this.logger.log(
        `Email sent to ${options.to} | Subject: ${options.subject}`,
      );
    } catch (error) {
      this.logger.error(`Error sending email to ${options.to}`, error);
      throw new Error(`Error sending email to ${options.to}`);
    }
  }
}
