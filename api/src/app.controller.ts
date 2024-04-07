import { Controller, Get, Post, Req } from '@nestjs/common';
import { AppService } from './app.service';
import { Request } from 'express';
import { IMail } from './@types';

@Controller('v1')
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Post('github')
  postGithub(@Req() request: Request): unknown {
    return this.appService.postGithub(request);
  }

  @Get('mail')
  async getMail(): Promise<IMail> {
    return await this.appService.getMail();
  }
}
