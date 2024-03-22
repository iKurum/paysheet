/* eslint-disable @typescript-eslint/no-explicit-any */
export type Query = { [name: string]: string | number | boolean };

export interface DBProps {
  name?: string;
  dbName?: string;
}

export interface DBUpdateProps {
  dbName: string;
  data: any[];
  key?: string[]; // 通过key判断是否更新
}

export interface CursorPageProps {
  dbName: string;
  query?: Query;
  page: number;
  size: number;
}

export interface IndexDateProps {
  db?: any;
  dbName: string;
  query: Query;
  all?: boolean;
}
