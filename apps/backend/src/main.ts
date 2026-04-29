import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { RolesGuard } from './auth/guards/roles.guard';
import { HttpExceptionFilter } from './auth/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Apply ValidationPipe globally
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Apply HttpExceptionFilter globally
  app.useGlobalFilters(new HttpExceptionFilter());

  // Apply JwtAuthGuard globally (protects all routes by default)

  const reflector = app.get<Reflector>(Reflector);

  app.useGlobalGuards(new JwtAuthGuard(reflector));

  // Apply RolesGuard globally (checks roles when @Roles() decorator is used)

  app.useGlobalGuards(new RolesGuard(reflector));

  // Configure Swagger
  const config = new DocumentBuilder()
    .setTitle('Juntos pelo Impacto - API')
    .setDescription('Sistema de gestão de projetos universitários e OSCs')
    .setVersion('1.0.0')
    .addBearerAuth()
    .addTag('auth', 'Autenticação e Autorização')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  const port = Number(process.env.PORT ?? 3000);
  await app.listen(port, '0.0.0.0');
  console.log(`Application is running on: http://localhost:${port}`);
  console.log(
    `Swagger documentation available at: http://localhost:${port}/api`,
  );
}

void bootstrap();
