import dayjs from 'dayjs';

export interface IMail {
  first: string;
  last: string;
  money: number;
  total: number;
  data: SMail[];
}

export class ImapClient {
  imap: Imap;

  connect: (arg: { user: string; password: string }) => void;

  init() {}
}

type SMail = {
  date: string;
  money: number;
  card: string;
  item: string[];
  detail: {
    time: string;
    currency: string;
    price: number;
    type: string;
    pay: string;
    business: string;
  }[];
};

export type Connect = {
  user: string;
  password: string;
};

export type UEmail = {
  title: HeaderValue | undefined;
  content: string;
  date: dayjs.Dayjs;
};
