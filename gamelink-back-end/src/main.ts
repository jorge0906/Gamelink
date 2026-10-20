import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors();

  app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
      }),
  );

  app.setGlobalPrefix('/api/v1/gamelink');

  const config = new DocumentBuilder()
      .setTitle('API de Reseñas de Videojuegos')
      .setDescription('API para la aplicación de reseñas de videojuegos')
      .setVersion('1.0')
      .addBearerAuth()
      .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('/api/v1/gamelink/docs', app, document);

  await app.listen(process.env.PORT || 3000);
}
bootstrap();
