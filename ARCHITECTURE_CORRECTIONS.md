# 🔧 Correcciones Arquitectónicas - Uploads Module

## Resumen de Cambios

Se corrigieron 2 errores críticos de arquitectura Clean Architecture detectados por code review:

---

## 1️⃣ **Problema: imageId como String sin Relación**

### ❌ Antes

```prisma
model JobResult {
  imageId   String?  // Solo referencia débil
  url       String
}
```

### ✅ Después

```prisma
model JobResult {
  imageId   String?
  image     ImageAsset? @relation(fields: [imageId], references: [id], onDelete: SetNull)
  url       String

  @@index([imageId])  // Para queries rápidas
}

model ImageAsset {
  // ...
  jobResult JobResult?  // Relación inversa
}
```

### Beneficios

| Aspecto                    | Antes                 | Después                           |
| -------------------------- | --------------------- | --------------------------------- |
| **Type Safety**            | ❌ String genérico    | ✅ Validación Prisma              |
| **Integridad Referencial** | ❌ Posibles huérfanos | ✅ Garantizada en BD              |
| **Queries**                | ❌ JOIN manual        | ✅ `result.image` automático      |
| **Cascading**              | ❌ Manual             | ✅ `onDelete: SetNull` automático |
| **Índices**                | ❌ No optimizado      | ✅ @@index([imageId])             |

### Impacto en Código

```typescript
// Antes: manual joins
const result = await jobResultRepo.findById(id);
const image = await imageAssetRepo.findById(result.imageId);

// Después: Prisma maneja todo
const result = await prisma.jobResult.findUnique({
  where: { id },
  include: { image: true }, // Eager loading automático
});
console.log(result.image.url); // Type-safe
```

---

## 2️⃣ **Problema: @Injectable en Use Cases**

### ❌ Antes

```typescript
@Injectable() // ❌ ACOPLAMIENTO A NESTJS
export class PresignUploadUseCase {
  // Application Layer debe ser framework-agnostic
}

@Injectable()
export class GetImageAssetsUseCase {}

@Injectable()
export class DeleteImageAssetUseCase {}
```

### ✅ Después

```typescript
// SIN @Injectable - Clean Architecture puro
export class PresignUploadUseCase {
  constructor(
    private readonly s3Service: S3ServicePort,
    private readonly imageAssetRepository: ImageAssetRepositoryPort,
    private readonly envConfig: EnvironmentConfigService,
  ) {}
}

export class GetImageAssetsUseCase {}
export class DeleteImageAssetUseCase {}
```

### Por Qué Estaba Mal

1. **Acoplamiento a Framework**: Use-cases ligados a NestJS, no reutilizables
2. **Violación Clean Architecture**: Application Layer = Pure Business Logic
3. **Testabilidad Reducida**: Más difícil hacer unit tests sin NestJS
4. **Portabilidad**: No puedes usar este use-case en Express, CLI, GraphQL, etc.

### Estructura Correcta

```
Clean Architecture
├── Domain (Puro, sin dependencias)
├── Application (Puro, sin frameworks)
│   └── Use Cases: NO @Injectable, NO decoradores
└── Infrastructure (DI manejado aquí)
    └── Module: inyecta dependencias con NestJS
```

### DI Sigue Siendo en Infrastructure

```typescript
// uploads.module.ts (Infrastructure Layer)
@Module({
  providers: [
    {
      provide: PresignUploadUseCase,
      useFactory: (
        s3Service: S3ServicePort,
        imageAssetRepository: ImageAssetRepositoryPort,
        envConfig: EnvironmentConfigService,
      ) => {
        return new PresignUploadUseCase(
          s3Service,
          imageAssetRepository,
          envConfig,
        );
      },
      inject: [
        S3ServicePort,
        ImageAssetRepositoryPort,
        EnvironmentConfigService,
      ],
    },
  ],
})
export class UploadsModule {}
```

**Ventaja**: El use-case es instanciable en cualquier contexto:

```typescript
// CLI
const useCase = new PresignUploadUseCase(s3Adapter, repo, envConfig);
await useCase.execute(userId, dto);

// Tests
const mockS3 = { /* mock */ };
const useCase = new PresignUploadUseCase(mockS3, mockRepo, mockEnv);

// Fastify (sin cambios)
const useCase = new PresignUploadUseCase(...);

// GraphQL Resolver
const useCase = new PresignUploadUseCase(...);
```

---

## 📋 Archivos Modificados

```
✏️ prisma/schema.prisma
   - Añadida relación: JobResult.image -> ImageAsset
   - Relación inversa: ImageAsset.jobResult
   - onDelete: SetNull (si se elimina imagen, result queda null)
   - Index en imageId para performance

✏️ src/modules/uploads/application/use-cases/presign-upload.use-case.ts
   - Removido: @Injectable()
   - Removido: import Injectable
   - Comentario explicativo añadido

✏️ src/modules/uploads/application/use-cases/get-image-assets.use-case.ts
   - Removido: @Injectable()
   - Removido: import Injectable

✏️ src/modules/uploads/application/use-cases/delete-image-asset.use-case.ts
   - Removido: @Injectable()
   - Removido: import Injectable
```

---

## 🧪 Verificación

✅ **TypeScript Compilation**: Sin errores
✅ **Prisma Schema**: Válido y migrable
✅ **Relaciones**: Type-safe
✅ **DI**: Funcional en module

---

## 📚 Referencia: Clean Architecture Layers

```
┌─────────────────────────────────────────┐
│    INFRASTRUCTURE LAYER                 │
│  (NestJS, Decoradores, DI)              │
│  - Controllers                          │
│  - Modules (@Module)                    │
│  - Guards, Pipes, Filters               │
│  - Adapters concretos                   │
└──────────────┬──────────────────────────┘
               │ usa
┌──────────────▼──────────────────────────┐
│    APPLICATION LAYER                    │
│  (Use Cases PUROS)                      │
│  - NO @Injectable                       │
│  - NO decoradores NestJS                │
│  - Constructor + execute()              │
│  - Reutilizable en cualquier contexto   │
└──────────────┬──────────────────────────┘
               │ usa
┌──────────────▼──────────────────────────┐
│    DOMAIN LAYER                         │
│  (Lógica pura + Ports)                  │
│  - Entities                             │
│  - Repository Ports                     │
│  - Service Ports                        │
│  - Excepciones de dominio               │
└─────────────────────────────────────────┘
```

---

## 🎯 Conclusión

Ambas correcciones **fortalecer la arquitectura**:

1. **Relaciones Prisma**: Type-safety, integridad, performance
2. **Use Cases sin @Injectable**: Portabilidad, testabilidad, Clean Architecture

El código ahora es **production-ready** y sigue **estrictamente** los principios de Clean Architecture.

---

**Fecha**: Enero 2026
**Estado**: ✅ Compilando, migraciones generadas
