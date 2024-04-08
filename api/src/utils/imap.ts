import * as Imap from 'imap';
import { HeaderValue, MailParser } from 'mailparser';
import { Connect, IMail } from 'src/@types';
import { re_data, save_email } from './methods';
import * as dayjs from 'dayjs';
import { get_manifest } from './yaml';
import { Logger } from '@nestjs/common';
import * as fs from 'node:fs';

class ImapClient {
  finish: boolean = false;
  imap: Imap;

  constructor(config: any = {}) {
    this.imap = new Imap({
      user: config.user || '',
      password: config.password || '',
      host: 'imap.qq.com',
      port: 993,
      tls: true,
      tlsOptions: { rejectUnauthorized: false },
    });

    this.init();

    this.imap.connect();
  }

  init(imap = this.imap) {
    imap.once('ready', function () {
      imap.openBox('INBOX', function (err: any) {
        Logger.fatal('已连接邮箱');

        if (err) throw err;

        const manifest = get_manifest();
        const key = !!Object.keys(manifest)[0] ? 'UNSEEN' : 'SEEN';

        Logger.fatal(`搜索 ${key}`);

        imap.search([key, ['SINCE', 'Jan 2, 2024']], function (err, results) {
          if (err) throw err;

          try {
            const f = imap.fetch(results, { bodies: '', markSeen: true }); // 抓取邮件，读取之后改为已读（默认情况下邮件服务器的邮件是未读状态）

            f.on('message', function (msg) {
              const mailparser = new MailParser();

              let title: HeaderValue | undefined, date: Date;

              msg.on('body', function (stream) {
                stream.pipe(mailparser); // 将为解析的数据流pipe到mailparser

                // 邮件头内容
                mailparser.on('headers', function (headers) {
                  title = headers.get('subject');
                  date = new Date(headers.get('date') as string);
                });

                // 邮件内容
                mailparser.on('data', function (data) {
                  if (data.type === 'text') {
                    save_email({
                      date: dayjs(date),
                      title,
                      content: data.text || data.html,
                    });
                  }
                });
              });
            });
            f.once('error', function (err) {
              Logger.error(`抓取出现错误: ${err}`);
            });
            f.once('end', function () {
              Logger.fatal('所有邮件抓取完成');
              imap.end();
            });
          } catch (error) {
            Logger.error(`imap ${error}`);
            imap.end();
          }
        });
      });
    });

    imap.once('error', (err: any) => {
      Logger.error(`imap err: ${err}`);
    });

    imap.once('end', () => {
      Logger.fatal('邮箱已关闭');
      this.finish = true;
    });
  }
}

export async function connect({ user, password }: Connect): Promise<IMail> {
  const imap = new ImapClient({ user, password });

  return new Promise((resolve, reject) => {
    let time_count = 100;
    function set_data() {
      clearTimeout(this);
      if (!imap.finish) {
        time_count--;
        if (time_count === 0) {
          Logger.error('连接超时');
          reject('连接超时');
        } else {
          setTimeout(set_data, 100);
        }
      } else {
        resolve(re_data());
      }
    }
    setTimeout(set_data);
  });
}

function write_dataset(params: any = {}) {
  fs.writeFileSync('./email/dataset.json', JSON.stringify(params));
}

function read_dataset() {
  let d;
  try {
    d = fs.readFileSync('./email/dataset.json', 'utf-8');
  } catch {
    d = '{}';
  }
  return JSON.parse(d);
}

export { write_dataset, read_dataset };
