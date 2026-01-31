import {
  Controller,
  Post,
  Get,
  Body,
  Req,
  HttpCode,
  HttpStatus,
  UseGuards,
  Headers,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/modules/iam/infrastructure/guards/jwt-auth.guard';
import type { AuthenticatedRequest } from 'src/modules/iam/infrastructure/http/authenticated-request.interface';
import { CreatePaymentDto } from '../../application/dtos/create-payment.dto';
import { CreatePreferenceUseCase } from '../../application/use-cases/create-preference.use-case';
import { ProcessWebhookUseCase } from '../../application/use-cases/process-webhook.use-case';
import { ListPackagesUseCase } from '../../application/use-cases/list-packages.use-case';
import { ListPaymentProvidersUseCase } from '../../application/use-cases/list-payment-providers.use-case';
import { LoggerPort } from 'src/shared/logger/domain/logger.port';
import type { MercadoPagoWebhookDto } from './dto/mercadopago-webhook.dto';
import { PAYMENT_PROVIDERS } from '../../domain/constants/payment.constants';

/**
 * Payments Controller
 * Handles credit purchases via Mercado Pago
 */
@ApiTags('payments')
@Controller('payments')
export class PaymentsController {
  constructor(
    private readonly createPreferenceUseCase: CreatePreferenceUseCase,
    private readonly processWebhookUseCase: ProcessWebhookUseCase,
    private readonly listPackagesUseCase: ListPackagesUseCase,
    private readonly listProvidersUseCase: ListPaymentProvidersUseCase,
    private readonly logger: LoggerPort,
  ) {}

  /**
   * GET /payments/providers
   * List available payment providers
   */
  @ApiOperation({
    summary: 'List available payment providers',
    description:
      'Returns all active payment providers with their configuration, fees, and health status. Users can select their preferred provider.',
  })
  @ApiResponse({
    status: 200,
    description: 'Payment providers retrieved successfully',
    schema: {
      example: {
        providers: [
          {
            code: 'mercadopago',
            name: 'Mercado Pago',
            displayName: 'Tarjeta de crédito/débito',
            description: 'Acepta Visa, Mastercard, American Express',
            logoUrl: 'https://http2.mlstatic.com/...',
            supportedCurrencies: ['PEN', 'USD'],
            supportedCountries: ['PE', 'AR', 'CL'],
            fees: 3.99,
            estimatedTime: 'instantáneo',
            minAmount: 1.0,
            maxAmount: 50000.0,
            isHealthy: true,
          },
        ],
      },
    },
  })
  @Get('providers')
  async listProviders() {
    return this.listProvidersUseCase.execute();
  }

  /**
   * GET /payments/packages
   * List available credit packages
   */
  @ApiOperation({
    summary: 'List available credit packages',
    description:
      'Returns all active credit packages with pricing, credits amount, and metadata like discounts and badges.',
  })
  @ApiResponse({
    status: 200,
    description: 'List of active packages',
    schema: {
      example: {
        packages: [
          {
            id: 'pkg-pro',
            name: 'Pro',
            credits: 60,
            price: 20.0,
            currency: 'PEN',
            description: 'Ideal para usuarios regulares',
            active: true,
            metadata: {
              popular: true,
              discount: 0.17,
              badge: 'Más popular',
            },
          },
        ],
      },
    },
  })
  @Get('packages')
  async getPackages() {
    return this.listPackagesUseCase.execute();
  }

  /**
   * POST /payments/create-preference
   * Create payment preference for selected provider
   */
  @ApiOperation({
    summary: 'Create payment preference',
    description:
      'Creates a payment preference/session with the selected payment provider. Returns an initialization URL where the user should be redirected to complete the payment.',
  })
  @ApiResponse({
    status: 201,
    description: 'Preference created successfully',
    schema: {
      example: {
        preferenceId: 'abc123-preference-id',
        initPoint:
          'https://www.mercadopago.com.pe/checkout/v1/redirect?pref_id=abc123',
        paymentId: 'payment-uuid',
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Package not found or provider not found',
  })
  @ApiResponse({
    status: 400,
    description: 'Package is inactive or provider is unavailable',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - JWT token required',
  })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('create-preference')
  @HttpCode(HttpStatus.CREATED)
  async createPreference(
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreatePaymentDto,
  ) {
    const userId = req.user.userId;

    this.logger.log(
      `Creating payment preference for user ${userId} - Package: ${dto.packageId}`,
      PaymentsController.name,
    );

    const result = await this.createPreferenceUseCase.execute({
      userId,
      packageId: dto.packageId,
      providerCode: PAYMENT_PROVIDERS.MERCADO_PAGO,
      successUrl: dto.successUrl,
      failureUrl: dto.failureUrl,
      pendingUrl: dto.pendingUrl,
    });

    return result;
  }

  /**
   * POST /payments/webhook
   * Process payment provider webhook notifications
   * @internal This endpoint is called by payment providers (Mercado Pago, etc.)
   */
  @ApiOperation({
    summary: 'Payment webhook endpoint',
    description:
      'Receives webhook notifications from payment providers when payment status changes. Automatically updates payment status and credits user account upon successful payment.',
  })
  @ApiResponse({
    status: 200,
    description: 'Webhook processed successfully',
    schema: {
      example: { status: 'ok' },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Webhook processing failed (returns 200 to avoid retries)',
    schema: {
      example: { status: 'error', message: 'Internal processing error' },
    },
  })
  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  async webhook(
    @Body() body: MercadoPagoWebhookDto,
    @Headers('x-signature') _signature?: string,
    @Headers('x-request-id') _requestId?: string,
  ) {
    this.logger.log(
      `Webhook received - Action: ${body.action}, Data ID: ${body.data?.id}`,
      PaymentsController.name,
    );

    try {
      // Verify signature (if implemented)
      // const isValid = await this.paymentProvider.verifyWebhookSignature(
      //   signature,
      //   requestId,
      //   JSON.stringify(body),
      // );

      if (!body.data?.id) {
        this.logger.warn(
          'Webhook missing data.id - skipping',
          PaymentsController.name,
        );
        return { status: 'ok', message: 'Invalid webhook payload' };
      }

      await this.processWebhookUseCase.execute({
        providerCode: PAYMENT_PROVIDERS.MERCADO_PAGO,
        action: body.action,
        data: body.data,
      });

      return { status: 'ok' };
    } catch (error) {
      this.logger.error(
        `Webhook processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        PaymentsController.name,
      );
      // Return 200 anyway to avoid Mercado Pago retries
      return { status: 'error', message: 'Internal processing error' };
    }
  }

  /**
   * POST /payments/webhook/mercadopago
   * Mercado Pago specific webhook endpoint
   */
  @ApiOperation({
    summary: 'Mercado Pago webhook (provider-specific)',
    description:
      'Dedicated endpoint for Mercado Pago webhooks. Recommended for production use over the generic webhook endpoint.',
  })
  @ApiResponse({
    status: 200,
    description: 'Webhook processed',
  })
  @Post('webhook/mercadopago')
  @HttpCode(HttpStatus.OK)
  async webhookMercadoPago(
    @Body() body: MercadoPagoWebhookDto,
    @Headers('x-signature') _signature?: string,
    @Headers('x-request-id') _requestId?: string,
  ) {
    this.logger.log(
      `MercadoPago webhook received - Action: ${body.action}, Data ID: ${body.data?.id}`,
      PaymentsController.name,
    );

    try {
      // TODO: Implement signature verification
      // const isValid = this.mercadoPagoAdapter.verifyWebhookSignature(
      //   signature,
      //   requestId,
      //   JSON.stringify(body),
      // );
      // if (!isValid) {
      //   this.logger.warn('Invalid webhook signature', PaymentsController.name);
      //   return { status: 'error', message: 'Invalid signature' };
      // }

      if (!body.data?.id) {
        return { status: 'ok', message: 'Invalid webhook payload' };
      }

      await this.processWebhookUseCase.execute({
        providerCode: PAYMENT_PROVIDERS.MERCADO_PAGO,
        action: body.action,
        data: body.data,
      });

      return { status: 'ok' };
    } catch (error) {
      this.logger.error(
        `MercadoPago webhook processing failed: ${error instanceof Error ? error.message : 'Unknown'}`,
        PaymentsController.name,
      );
      return { status: 'error', message: 'Internal processing error' };
    }
  }

  /**
   * POST /payments/webhook/culqi
   * Culqi specific webhook endpoint (for future implementation)
   */
  @ApiOperation({
    summary: 'Culqi webhook (not yet implemented)',
    description: 'Placeholder for Culqi webhook integration.',
  })
  @ApiResponse({
    status: 501,
    description: 'Culqi integration not implemented yet',
  })
  @Post('webhook/culqi')
  @HttpCode(HttpStatus.NOT_IMPLEMENTED)
  webhookCulqi(@Body() _body: unknown) {
    this.logger.warn(
      'Culqi webhook received but integration not implemented',
      PaymentsController.name,
    );
    return { status: 'not_implemented', message: 'Culqi integration pending' };
  }

  /**
   * POST /payments/webhook/crypto
   * Crypto payment webhook endpoint (for future implementation)
   */
  @ApiOperation({
    summary: 'Crypto webhook (not yet implemented)',
    description: 'Placeholder for cryptocurrency payment integration.',
  })
  @ApiResponse({
    status: 501,
    description: 'Crypto integration not implemented yet',
  })
  @Post('webhook/crypto')
  @HttpCode(HttpStatus.NOT_IMPLEMENTED)
  webhookCrypto(@Body() _body: unknown) {
    this.logger.warn(
      'Crypto webhook received but integration not implemented',
      PaymentsController.name,
    );
    return {
      status: 'not_implemented',
      message: 'Crypto integration pending',
    };
  }
}
