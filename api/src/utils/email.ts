import { UEmail } from 'src/@types';
import * as fs from 'node:fs';
import { get_yaml } from './yaml';
import { Logger } from '@nestjs/common';

export const merchants_bank = (params: UEmail) => {
  const { title, date } = params;

  switch (title) {
    case '每日信用管家':
      const yaml = get_yaml('每日信用管家');
      if (!yaml.includes(date.format('YYYY-MM-DD'))) {
        daily_credit_manager(params);
      }
      break;
    case '一卡通账户变动通知':
      one_card_changes(params);
      break;
    default:
      break;
  }
};

// 一卡通账户变动通知
const one_card_changes = (params: UEmail) => {
  const { title, date: fdate, content: data } = params;

  if (!data) return;

  const reg = {
    pay: '您账户(\\d{4})于.*日([0-9:]+)在【(.*)】快捷支付([0-9\\.?]+)',
    accounting:
      '您账户(\\d{4})于.*日([0-9:]+)银联(入账)人民币([0-9\\.?]+).*\\（(.*)\\）',
    salary: '您账户(\\d{4})于.*日([0-9:]+)入账(工资)，人民币([0-9\\.?]+)',
  };

  let r: string[] = [];
  let model: number = 0;

  {
    if (data.includes('快捷支付')) {
      model = 1;
      r = new RegExp(reg.pay, 'g').exec(data)?.slice(1) || [];
    }

    if (data.includes('银联入账')) {
      model = 2;
      r = new RegExp(reg.accounting, 'g').exec(data)?.slice(1) || [];
    }

    if (data.includes('入账工资')) {
      model = 3;
      r = new RegExp(reg.salary, 'g').exec(data)?.slice(1) || [];
    }
  }
  const [card, time, type, money, ...rest] = r;

  if (r.length) {
    const date = fdate.format('YYYY-MM-DD');
    const m = model > 1 ? +money : -money;
    const old = check_json(date, title);

    if (old) {
      write_json({
        date,
        detail: [
          ...(old.detail || []),
          {
            time,
            currency: 'CNY',
            price: m,
            type,
            card,
          },
        ],
        title,
        money: old.money.add(m),
      });
    } else {
      write_json({
        date,
        detail: [
          {
            time,
            currency: 'CNY',
            price: m,
            type,
            card,
          },
        ],
        title,
        money: m,
      });
    }
  }
};

// 招商每日信用管家
const daily_credit_manager = (params: UEmail) => {
  const { title, content: data } = params;
  const reg = {
    date: '([0-9\\/]*)&nbsp;您的消费明细如下',
    time: '<font face="Awesome Font" style="font-size:12px;line-height:120%;">([0-9:]+)<\\/font>',
    money:
      '<font face="Awesome Font" style="font-size:16px;line-height:120%;">([A-Z]+)&nbsp;([0-9\\-?\\.?]+)<\\/font>',
    desc: '<font face="Awesome Font" style="font-size:12px;line-height:120%;">尾号(\\d{4})&nbsp;(.+)&nbsp;(.+)-(.+)<\\/font>',
  };
  if (!data) return;

  let date: string, time: string[], desc: string[], money: string[];
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

        detail.push({
          card: _d[0],
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

  const m =
    -1 *
    detail
      .map(({ price }: any) => +price)
      .reduce((a: number, b: number) => a + b, 0);

  write_json({
    path: '/' + title,
    date,
    detail,
    title,
    money: m,
  });
};

const write_json = ({ date, card, detail, title, money }: any) => {
  if (date) {
    const path = mkdir(title);
    const params = {
      title,
      card,
      date,
      detail,
      money,
    };

    try {
      fs.writeFileSync(
        `${path}${date}_${title}.json`,
        JSON.stringify(params, null, '\t'),
        'utf8',
      );
      Logger.log(`${date}_${title}.josn 文件写入成功`);
    } catch (error) {
      Logger.error(error);
    }
  }
};

const mkdir = (title: string) => {
  try {
    fs.accessSync(`./email/${title ?? ''}`, fs.constants.F_OK);
  } catch (e) {
    fs.mkdirSync(`./email/${title ?? ''}`);
  }

  return `./email/${title ? `${title}/` : ''}`;
};

const check_json = (date: string, title: string) => {
  try {
    const path = `./email/${title}/${date}_${title}.json`;
    fs.accessSync(path, fs.constants.F_OK);
    return JSON.parse(fs.readFileSync(path, 'utf8'));
  } catch (e) {
    return false;
  }
};
