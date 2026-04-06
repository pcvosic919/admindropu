import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const port = process.env.PORT || 3001;
  // Listen on 0.0.0.0 for Docker and Cloud Run compatibility
  await app.listen(port, '0.0.0.0');
}
bootstrap();
