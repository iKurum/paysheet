import { Request } from 'express';
import { Buffer } from 'node:buffer';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { spawn } from 'node:child_process';
import { Logger } from '@nestjs/common';
import { HeaderValue } from 'mailparser';
import * as fs from 'node:fs';

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

export const save_email = (params: {
  title: HeaderValue | undefined;
  content: string;
  date: string;
}) => {
  const { title, content: data, date: fdate } = params;
  const ts = ['每日信用管家'];
  const reg = {
    date: '([0-9\\/]*)&nbsp;您的消费明细如下',
    time: '<font face="Awesome Font" style="font-size:12px;line-height:120%;">([0-9:]+)<\\/font>',
    money:
      '<font face="Awesome Font" style="font-size:16px;line-height:120%;">([A-Z]+)&nbsp;([0-9\\-?\\.?]+)<\\/font>',
    desc: '<font face="Awesome Font" style="font-size:12px;line-height:120%;">(尾号\\d{4})&nbsp;(.+)&nbsp;(.+)-(.+)<\\/font>',
  };
  if (!title || !ts.includes(title?.toString()) || !data) return;

  let date: string,
    time: string[],
    desc: string[],
    money: string[],
    card: string = '';
  const detail: any[] = [];

  // 招商每日信用管家
  {
    date =
      data
        .match(new RegExp(reg.date))?.[0]
        ?.replace(/&nbsp;您的消费明细如下/, '')
        ?.replace(/\//g, '-') || '';
    time = data.match(new RegExp(reg.time, 'g')) || [];
    money = data.match(new RegExp(reg.money, 'g')) || [];
    desc = data.match(new RegExp(reg.desc, 'g')) || [];

    if (time.length == money.length && desc.length == time.length) {
      for (let i = 0; i < money.length; i++) {
        const _m = new RegExp(reg.money).exec(money[i])?.slice(1, 3) || [];
        const _t = new RegExp(reg.time).exec(time[i])?.slice(1, 2) || [];
        const _d = new RegExp(reg.desc).exec(desc[i])?.slice(1, 5) || [];

        card = _d[0];
        detail.push({
          time: _t[0],
          currency: _m[0],
          price: +_m[1],
          type: _d[1],
          pay: _d[2],
          business: _d[3],
        });
      }
    } else {
      throw '解析错误';
    }
  }

  if (date) {
    fs.writeFile(
      `./src/email/${fdate}_${title}.json`,
      JSON.stringify(
        {
          title,
          card,
          date,
          money: detail.map(({ price }) => +price).reduce((a, b) => a + b, 0),
          detail,
        },
        null,
        '\t',
      ),
      'utf8',
      (err) => {
        if (err) {
          console.error(err);
        } else {
          console.log(`${fdate}_${title}.josn 文件写入成功`);
        }
      },
    );
  }
};
