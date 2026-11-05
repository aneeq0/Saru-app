import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { resolveWebOrigins } from './common/cors-origins';
import { GlobalExceptionFilter } from './common/filters/http-exception.filter';
import { RequestIdInterceptor } from './common/interceptors/request-id.interceptor';
import { RedisIoAdapter } from './realtime/redis-io.adapter';

function assertRequiredEnv() {
  const required = ['DATABASE_URL', 'JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET'] as const;
  const missing = required.filter((key) => !process.env[key]?.trim());
  if (missing.length > 0) {
    // eslint-disable-next-line no-console
    console.error(
      `[saru] FATAL missing env: ${missing.join(', ')}. Set them on the Railway service Variables tab.`,
    );
    process.exit(1);
  }
}

async function bootstrap() {
  assertRequiredEnv();

  const app = await NestFactory.create(AppModule, { rawBody: false });
  const config = app.get(ConfigService);
  const log = new Logger('Bootstrap');

  // Railway / reverse proxies terminate TLS; required for secure cookies & correct req.ip
  app.getHttpAdapter().getInstance().set('trust proxy', 1);

  const redisIo = new RedisIoAdapter(app, config);
  await redisIo.connectToRedis();
  app.useWebSocketAdapter(redisIo);

  app.setGlobalPrefix(config.get<string>('API_BASE_PATH', 'api'));
  // cross-origin admin (Vercel) must be able to read API responses
  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' },
    }),
  );
  app.use(cookieParser());

  const webOrigins = resolveWebOrigins(
    config.get<string>('WEB_ORIGIN'),
    config.get<string>('NODE_ENV'),
  );
  if (
    config.get<string>('NODE_ENV') === 'production' &&
    webOrigins.length === 0
  ) {
    log.error(
      'WEB_ORIGIN is empty in production — set it to your Vercel URL (e.g. https://saru-app-guzv.vercel.app) or browser calls will fail CORS.',
    );
  }

  app.enableCors({
    origin: (
      requestOrigin: string | undefined,
      callback: (err: Error | null, allow?: boolean | string) => void,
    ) => {
      // Non-browser clients (no Origin) are allowed
      if (!requestOrigin) {
        callback(null, true);
        return;
      }
      if (webOrigins.includes(requestOrigin)) {
        callback(null, requestOrigin);
        return;
      }
      log.warn(`CORS blocked origin: ${requestOrigin}`);
      callback(null, false);
    },
    credentials: true,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Accept',
      'Authorization',
      'X-CSRF-Token',
      'X-Client',
      'Idempotency-Key',
      'If-Match',
      'X-Request-Id',
    ],
    exposedHeaders: ['X-Request-Id'],
    optionsSuccessStatus: 204,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );
  app.useGlobalFilters(new GlobalExceptionFilter());
  app.useGlobalInterceptors(new RequestIdInterceptor());
  app.enableShutdownHooks();

  const swagger = new DocumentBuilder()
    .setTitle('Saru International API')
    .setDescription(
      'Central backend for Saru International medical supply, import, tender & inventory platform',
    )
    .setVersion('0.1.0')
    .addBearerAuth()
    .addCookieAuth(config.get<string>('SESSION_COOKIE_NAME', 'saru_session'))
    .build();
  SwaggerModule.setup('docs', app, SwaggerModule.createDocument(app, swagger));

  const port = Number(config.get('PORT', 3000));
  await app.listen(port, '0.0.0.0');
  log.log(`Saru API listening on http://0.0.0.0:${port}/api`);
  log.log(`OpenAPI docs at http://0.0.0.0:${port}/docs`);
  log.log(`Realtime Socket.IO at path /socket.io namespace /realtime`);
  log.log(
    `CORS origins: ${webOrigins.length ? webOrigins.join(', ') : '(none)'}`,
  );
}

void bootstrap().catch((err: unknown) => {
  // eslint-disable-next-line no-console
  console.error('[saru] FATAL bootstrap failed', err);
  process.exit(1);
});
