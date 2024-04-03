import * as Imap from 'imap';
import { HeaderValue, MailParser } from 'mailparser';
import { Connect } from 'src/@types';
import { save_email } from './methods';
import * as dayjs from 'dayjs';

class ImapClient {
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
        console.log('打开邮箱');

        if (err) throw err;

        imap.search(
          ['UNSEEN', ['SINCE', 'Jan 1, 2024']],
          function (err, results) {
            if (err) throw err;

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
                      date: dayjs(date).format('YYYY-MM-DD'),
                      title,
                      content: data.html,
                    });
                  }
                });
              });
            });
            f.once('error', function (err) {
              console.log('抓取出现错误: ' + err);
            });
            f.once('end', function () {
              console.log('所有邮件抓取完成!');
              imap.end();
            });
          },
        );
      });
    });

    imap.once('error', function (err: any) {
      console.log(err);
    });

    imap.once('end', function () {
      console.log('关闭邮箱');
    });
  }
}

export function connect({ user, password }: Connect) {
  new ImapClient({ user, password });
}
