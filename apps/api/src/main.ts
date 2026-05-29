import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Global prefix — all routes will be /api/v1/...
  app.setGlobalPrefix('api/v1');

  // Validate & strip unknown fields on all DTOs automatically
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,        // strip unknown properties
      forbidNonWhitelisted: true,
      transform: true,        // auto-cast to DTO types
    }),
  );

  // Allow the frontend dev server to talk to the API
  app.enableCors({
    origin: ['http://localhost:5173', 'http://localhost:3001'],
    credentials: true,
  });

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`🚀  Ubuntu Sales API running on http://localhost:${port}/api/v1`);
}
bootstrap();
