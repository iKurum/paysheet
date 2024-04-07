export interface IMail {
  first: string;
  last: string;
  money: number;
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
  date: string;
};
