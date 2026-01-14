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
      },
      create: pkg,
    });

    console.log(
      `  ✓ ${created.name}: ${created.credits} créditos por S/ ${created.price}`,
    );
  }

  console.log('✅ Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:');
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
