import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { connect } from './utils';

@Injectable()
export class TaskService {
  @Cron('0 */10 6-20 * * *')
  handleCron() {
    connect({
      user: process.env.user || '',
      password: process.env.password || '',
    });
  }
}
