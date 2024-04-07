import { UEmail } from 'src/@types';
import * as fs from 'node:fs';
import { get_yaml } from './yaml';
import { Logger } from '@nestjs/common';

export const merchants_bank = (params: UEmail) => {
  const { title, date } = params;

  switch (title) {
    case '每日信用管家':
      const yaml = get_yaml('每日信用管家');
      if (!yaml.includes(date)) {
        daily_credit_manager(params);
      }
      break;
    default:
      break;
  }
};

// 招商每日信用管家
const daily_credit_manager = (params: UEmail) => {
  Logger.fatal('正则匹配邮件 ...');
  const { title, content: data, date: fdate } = params;
  const reg = {
    date: '([0-9\\/]*)&nbsp;您的消费明细如下',
    time: '<font face="Awesome Font" style="font-size:12px;line-height:120%;">([0-9:]+)<\\/font>',
    money:
      '<font face="Awesome Font" style="font-size:16px;line-height:120%;">([A-Z]+)&nbsp;([0-9\\-?\\.?]+)<\\/font>',
    desc: '<font face="Awesome Font" style="font-size:12px;line-height:120%;">(尾号\\d{4})&nbsp;(.+)&nbsp;(.+)-(.+)<\\/font>',
  };
  if (!data) return;

  let date: string,
    time: string[],
    desc: string[],
    money: string[],
    card: string = '';
  const detail: any[] = [];

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

  write_json({ path: '/每日信用管家', date, fdate, card, detail, title });
};

const write_json = ({ path, date, fdate, card, detail, title }: any) => {
  if (date) {
    try {
      fs.accessSync(`./email${path ?? ''}`, fs.constants.F_OK);
    } catch (e) {
      fs.mkdirSync(`./email${path ?? ''}`);
    }

    fs.writeFile(
      `./email${path ?? ''}/${date}_${title}.json`,
      JSON.stringify(
        {
          title,
          card,
          date,
          statistics: fdate,
          money: detail
            .map(({ price }: any) => +price)
            .reduce((a: number, b: number) => a + b, 0),
          detail,
        },
        null,
        '\t',
      ),
      'utf8',
      (err) => {
        if (err) {
          Logger.error(err);
        } else {
          Logger.log(`${fdate}_${title}.josn 文件写入成功`);
        }
      },
    );
  }
};
