/* eslint-disable @typescript-eslint/no-explicit-any */
import { Modal } from "antd";
import { OpenModalProps, openM } from "../components/Modal";
import dayjs from "dayjs";
import { dictMapListType, dictMapType } from "../types";
import { DrawerProps, openD } from "../components/Drawer";
import { openN } from "../components/Notification";
import { ArgsProps } from "antd/es/notification";

export const openModal = (modal: OpenModalProps) => {
  Modal.destroyAll();
  openM(modal);
};

export const openDrawer = (params: DrawerProps) => {
  openD(params);
};

export const openNotification = (params: ArgsProps) => {
  openN(params);
};

export const time = ({
  time,
  format = "YYYY-MM-DD HH:mm:ss:SSS",
}: {
  time?: Date | number;
  format: string;
}) => {
  return dayjs(time).format(format);
};

export const nowTimeFu = (milliseconds: number) => {
  let seconds = Math.floor(milliseconds / 1000);
  let minutes = Math.floor(seconds / 60);

  milliseconds = milliseconds - seconds * 1000;
  seconds %= 60;
  minutes %= 60;

  return `${padZero(minutes)}:${padZero(seconds)}:${padZero(milliseconds, 3)}`;
};

// 函数用于在数字不足两位数时，在前面补零
const padZero = (value: number, len = 2) => {
  return String(value).padStart(len, "0");
};

/**
 * 字典数据映射
 */
export const dictMapFn = (dicts: dictMapListType): dictMapType => {
  const maps = {} as dictMapType;

  // eslint-disable-next-line guard-for-in
  for (const key in dicts) {
    maps[key] = {};
    dicts[key].forEach((dict) => {
      if (dict.dict_value) {
        (maps[key] as any)[dict.dict_value] = dict.dict_label;
      }
    });
  }

  return maps;
};

/**
 * 对象扁平化
 */
export const flatten = (obj: any[]) => {
  const result: any = {};

  const process = (key: string, value: any) => {
    // 首先判断是基础数据类型还是引用数据类型
    if (Object.prototype.toString.call(value) === "[object Object]") {
      const objArr = Object.keys(value);
      objArr.forEach((item) => {
        process(key ? `${key}.${item}` : `${item}`, value[item]);
      });
      if (objArr.length === 0 && key) {
        result[key] = {};
      }
    } else if (Array.isArray(value)) {
      // eslint-disable-next-line no-plusplus
      for (let i = 0; i < value.length; i++) {
        process(`${key}[${i}]`, value[i]);
      }
      if (value.length === 0) {
        result[key] = [];
      }
    } else if (key) {
      result[key] = value;
    }
  };
  process("", obj);
  return result;
};

// 删除对象空字段
export const deleteEmptyField = (obj: any) => {
  if (Object.prototype.toString.call(obj) === "[object Object]") {
    const result: any = {};
    Object.keys(obj).forEach((key) => {
      if (
        !(
          obj[key] === undefined ||
          obj[key] === null ||
          (typeof obj[key] === "string" && obj[key] === "")
        )
      ) {
        if (obj[key]?.$isDayjsObject && key === "date") {
          result[key] = dayjs(obj[key]).format("YYYY-MM");
        } else {
          result[key] = obj[key];
        }
      }
    });
    return result;
  } else if (Array.isArray(obj)) {
    return obj.filter(
      (item) =>
        !(
          item === undefined ||
          item === null ||
          (typeof item === "string" && item === "")
        )
    );
  } else {
    return obj;
  }
};

// 转换金额
export const formatMoney = (value: number) => {
  if (isNaN(value)) {
    return value;
  }
  const param: any = {};
  const k = 10000,
    sizes = ["", "万", "亿", "万亿"];
  let i;

  if (value < k) {
    param.value = value;
    param.unit = "";
  } else {
    i = Math.floor(Math.log(value) / Math.log(k));
    param.value = (value / Math.pow(k, i)).toFixed(2);
    param.unit = sizes[i];
  }
  return param.value + param.unit;
};
