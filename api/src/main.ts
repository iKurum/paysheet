import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { config } from 'dotenv';
import * as fs from 'node:fs';
import { connect } from './utils';

import './extensions/index';

config();

async function bootstrap() {
  // 初始化
  try {
    fs.mkdirSync('./email');
  } catch (e) {}
  connect({
    user: process.env.user || '',
    password: process.env.password || '',
  });

  const app = await NestFactory.create(AppModule);
  await app.listen(1268);
}
bootstrap();
