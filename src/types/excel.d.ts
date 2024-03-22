/* global XLSX */
export interface IdictDataSer {
  dict_code?: number;
  dict_name?: string;
  dict_sort?: number;
  dict_label?: string;
  dict_value?: string;
  dict_type?: string;
  css_class?: string;
  list_class?: string;
  is_default?: string;
  status?: string;
  createBy?: string;
  updateBy?: string;
  update_by?: string;
  remark?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface headerType {
  title: string;
  dataIndex: string;
  width?: number;
}

export interface dictMapType {
  [key: string]: {
    [key: string]: string;
  };
}

export interface dictMapListType {
  [key: string]: IdictDataSer[];
}

export interface excelParamsType {
  headerColumns: headerType[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  tableData: any;
  sheetName: string;
  fileName?: string;
  style?: Partial<XLSX.Style>;
  dicts?: dictMapListType;
  frozen?: { x: number; y: number } | boolean;
  moneyColumn?: number;
}
