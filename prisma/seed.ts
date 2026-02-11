import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Seed Credit Packages
  const packages = [
    {
      id: 'pkg-basic',
      name: 'Básico',
      credits: 10,
      price: 5.0,
      currency: 'PEN',
      description: 'Paquete inicial para probar el servicio',
      active: true,
      metadata: {
        popular: false,
        discount: 0,
      },
      features: ['10 Créditos', 'Calidad Estándar HD', '1 Usuario'],
    },
    {
      id: 'pkg-starter',
      name: 'Starter',
      credits: 25,
      price: 10.0,
      currency: 'PEN',
      description: 'Perfecto para uso ocasional',
      active: true,
      metadata: {
        popular: false,
        discount: 0,
      },
      features: [
        '25 Créditos',
        'Calidad Estándar HD',
        '1 Usuario',
        'Soporte por Email',
      ],
    },
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
        discount: 0.17, // 17% descuento (vs comprar individual)
        badge: 'Más popular',
      },
      features: [
        '60 Créditos',
        'Exportación 4K Ultra-Res',
        'Procesamiento por Lotes',
        'Soporte Prioritario',
        'Acceso API',
      ],
    },
    {
      id: 'pkg-business',
      name: 'Business',
      credits: 150,
      price: 45.0,
      currency: 'PEN',
      description: 'Para uso profesional intensivo',
      active: true,
      metadata: {
        popular: false,
        discount: 0.25, // 25% descuento
        badge: 'Mejor valor',
      },
      features: [
        '150 Créditos',
        'Modelos Personalizados',
        'Servidor Dedicado',
        'Acuerdo SLA',
        'Marca Blanca',
      ],
    },
    {
      id: 'pkg-enterprise',
      name: 'Enterprise',
      credits: 500,
      price: 120.0,
      currency: 'PEN',
      description: 'Paquete empresarial con máximo ahorro',
      active: true,
      metadata: {
        popular: false,
        discount: 0.35, // 35% descuento
        badge: 'Máximo ahorro',
      },
      features: [
        '500 Créditos',
        'Modelos Personalizados',
        'Servidor Dedicado',
        'Acuerdo SLA',
        'Marca Blanca',
        'Soporte 24/7',
        'Account Manager',
      ],
    },
  ];

  console.log('📦 Seeding Credit Packages...');

  for (const pkg of packages) {
    const created = await prisma.creditPackage.upsert({
      where: { id: pkg.id },
      update: {
        name: pkg.name,
        credits: pkg.credits,
        price: pkg.price,
        currency: pkg.currency,
        description: pkg.description,
        active: pkg.active,
        metadata: pkg.metadata,
        features: pkg.features,
      },
      create: pkg,
    });

    console.log(
      `  ✓ ${created.name}: ${created.credits} créditos por S/ ${created.price}`,
    );
  }

  // Seed Payment Providers
  console.log('Seeding Payment Providers...');

  const providers = [
    {
      code: 'mercadopago',
      name: 'Mercado Pago',
      isActive: true,
      displayConfig: {
        supportedCurrencies: ['PEN', 'USD', 'ARS', 'BRL'],
        logoUrl:
          'https://http2.mlstatic.com/frontend-assets/ui-navigation/5.21.7/mercadolibre/logo__large_plus.png',
        description:
          'Acepta tarjetas, efectivo y más métodos de pago en América Latina',
      },
    },
  ];

  for (const provider of providers) {
    const created = await prisma.paymentProvider.upsert({
      where: { code: provider.code },
      update: {
        name: provider.name,
        isActive: provider.isActive,
        displayConfig: provider.displayConfig,
      },
      create: provider,
    });

    console.log(
      `  ✓ ${created.name} (${created.code}) - Active: ${created.isActive}`,
    );
  }

  console.log('WELL DONE! Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('JAJAJA Seeding failed:');
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
