import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './shared/filters/http-exception.filter';
import { ResponseInterceptor } from './shared/interceptors/response.interceptor';

const SWAGGER_PATH = 'api/docs';

function setupSwagger(app: INestApplication): void {
  const config = new DocumentBuilder()
    .setTitle('FleetCore API')
    .setDescription(
      [
        'Fleet maintenance management API: vehicles, mechanics, workshops, and maintenances.',
        '',
        '**Authentication.** Call `POST /auth/login`, then press **Authorize** and paste the returned `accessToken`. External integrations use the `x-api-key` header instead (see the External group).',
        '',
        '**Responses.** Every success is wrapped as `{ success, statusCode, data, timestamp }`; every error as `{ success: false, statusCode, message, path, timestamp }`.',
      ].join('\n'),
    )
    .setVersion('1.0')
    .addBearerAuth()
    .addApiKey({ type: 'apiKey', name: 'x-api-key', in: 'header' }, 'x-api-key')
    .addTag('Auth', 'Registration and login (public).')
    .addTag('Mechanics', 'Manage users with role MECHANIC (ADMIN only).')
    .addTag('Vehicles', 'Fleet vehicles; logical deletion via INACTIVE status.')
    .addTag('Workshops', 'Workshops where maintenances take place.')
    .addTag('Maintenances', 'Scheduling and lifecycle of maintenances.')
    .addTag('External', 'Integration endpoints protected by x-api-key.')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup(SWAGGER_PATH, app, document, {
    // Keep the pasted token across page reloads while testing.
    swaggerOptions: { persistAuthorization: true },
  });
}

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.useGlobalInterceptors(new ResponseInterceptor());
  app.useGlobalFilters(new HttpExceptionFilter());
  app.enableShutdownHooks();

  setupSwagger(app);

  const port = app.get(ConfigService).getOrThrow<number>('PORT');
  await app.listen(port);
}

void bootstrap();
