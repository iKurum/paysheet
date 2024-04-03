export interface IMail {
  last: string;
}

export class ImapClient {
  imap: Imap;

  connect: (arg: { user: string; password: string }) => void;

  init() {}
}

export type Connect = {
  user: string;
  password: string;
};
