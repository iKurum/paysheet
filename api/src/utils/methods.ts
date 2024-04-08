import { manifest_fn } from './yaml';
import { merchants_bank } from './email';
import { Request } from 'express';
import { Buffer } from 'node:buffer';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { spawn } from 'node:child_process';
import { Logger } from '@nestjs/common';
import * as fs from 'node:fs';
import { IMail, UEmail } from 'src/@types';
import { read_dataset, write_dataset } from './imap';

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
  Logger.log(`runCmd:{ cmd: ${cmd}, args: ${args} }`);
  const child = spawn(cmd, args);
  let res = '';

  child.stdout.on('data', function (buffer) {
    res += buffer.toString();
  });
  child.stdout.on('end', function () {
    callback(res);
  });
};

export const save_email = (params: UEmail) => {
  merchants_bank(params);
};

export const re_data = () => {
  Logger.log('re_data');
  let {
    first = '2024-01-01',
    last = '2024-01-01',
    // eslint-disable-next-line prefer-const
    data = [],
  } = read_dataset() as IMail;

  const file_name: string[] = [];
  const m: any = {};

  data.forEach((r) => {
    m[r.date] = r.item;
  });

  function f(path: string) {
    const pa = fs.readdirSync(path);
    pa.forEach((item) => {
      const stat = fs.lstatSync(path + '/' + item);
      if (stat.isDirectory()) {
        f(path + '/' + item);
      } else if (item.endsWith('.json') && !item.startsWith('dataset')) {
        let r: any = fs.readFileSync(path + '/' + item, 'utf-8');
        if (r) {
          r = JSON.parse(r);

          if (first > r.date) {
            first = r.date;
          }
          if (last < r.date) {
            last = r.date;
          }

          if (!data.some((d) => d.date === r.date)) {
            (m[r.date] ??= []).push(item);
            file_name.push(item);
            data.push({
              date: r.date,
              card: r.card,
              money: r.money,
              detail: r.detail,
              item: (m[r.date] ??= []),
            });
          } else if (!m[r.date]?.includes(item)) {
            (m[r.date] ??= []).push(item);
            const index = data.findIndex((d) => d.date === r.date);
            file_name.push(item);
            data[index] = {
              ...data[index],
              detail: [...data[index].detail, ...r.detail],
              money: data[index].money.add(r.money),
              item: (m[r.date] ??= []),
            };
          }
        }
      }
    });
  }

  f('./email');
  manifest_fn(file_name);

  const params = {
    first,
    last,
    money: data.map((r) => r.money).reduce((a, b) => a.add(b)),
    data: data.sort((a, b) => (a.date > b.date ? 1 : -1)),
    total: data.length,
  };
  write_dataset(params);

  return params;
};
