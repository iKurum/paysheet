import { Request } from 'express';
import { Buffer } from 'node:buffer';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { spawn } from 'node:child_process';
import { Logger } from '@nestjs/common';

export const verify_signature = (req: Request) => {
  const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET as string;

  Logger.fatal(`WEBHOOK_SECRET: ${WEBHOOK_SECRET}`);

  const sign = req.headers['x-hub-signature-256'];
  const signature = createHmac('sha256', WEBHOOK_SECRET)
    .update(JSON.stringify(req.body))
    .digest('hex');
  const trusted = Buffer.from(`sha256=${signature}`, 'ascii');
  const untrusted = Buffer.from(`${sign}`, 'ascii');

  Logger.fatal({ sign, signature });

  return timingSafeEqual(trusted, untrusted);
};

export const run_cmd = (
  cmd: string,
  args: string[],
  callback: (res: unknown) => void,
) => {
  console.log('runCmd:', { cmd, args });
  const child = spawn(cmd, args);
  let res = '';

  child.stdout.on('data', function (buffer) {
    res += buffer.toString();
  });
  child.stdout.on('end', function () {
    callback(res);
  });
};
