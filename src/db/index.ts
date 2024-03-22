/* eslint-disable @typescript-eslint/no-explicit-any */
import { nowTimeFu, time } from "../utils";
import { upgrad } from "../db/upgrad";
import {
  CursorPageProps,
  DBProps,
  DBUpdateProps,
  IndexDateProps,
  Query,
  TableDataResProps,
} from "../types";

let timering = new Date().getTime();
const debug = false;

class IndexDB {
  static #instance: IndexDB;

  name: string;

  constructor(name: string) {
    this.name = name;
    this.openDB({ name });
  }

  static get Instance() {
    if (!this.#instance) {
      this.#instance = new IndexDB("pay_sheet");
    }
    return this.#instance;
  }

  /**
   * 打开数据库
   * @param {DBProps}
   * @returns Promise<any>
   */
  async openDB({ name = this.name, dbName }: DBProps = {}): Promise<any> {
    timering = new Date().getTime();
    debug &&
      console.log(
        `========== 开始时间 ${time({ format: "mm:ss:SSS" })} ==========`
      );

    //  兼容浏览器
    if (!window.indexedDB) {
      throw new Error("数据库打开报错");
    }

    const indexedDB = window.indexedDB;

    return new Promise((resolve) => {
      // 打开数据库，若没有则会创建
      const request = indexedDB.open(name, 1);

      // 数据库打开成功回调
      request.onsuccess = (e: any) => {
        const db = e.target["result"]; // 数据库对象
        debug && console.log("数据库打开成功" + ` ${dbName || ""}`);

        // 针对此数据库请求的所有错误的通用错误处理器！
        db.onerror = (event: any) => {
          debug && console.error(`数据库错误：${event.target.errorCode}`);
          this.closeDB(db);
        };

        resolve(db);
      };

      // 数据库打开失败的回调
      request.onerror = () => {
        throw new Error("数据库打开报错");
      };

      // 数据库有更新时候的回调
      request.onupgradeneeded = function (event: any) {
        // 数据库创建或升级的时候会触发
        const db = event.target.result;

        Object.keys(upgrad).forEach((u: string) => {
          const { key, field = [] } = upgrad[u];

          // 创建存储库
          const objectStore = db.createObjectStore(u, {
            keyPath: key, // 这是主键
            autoIncrement: true, // 实现自增
          });

          // 创建索引，在后面查询数据的时候可以根据索引查
          field.forEach((i) => {
            objectStore.createIndex(i.name, i.key, {
              unique: false,
            });
          });
        });
      };
    });
  }

  /**
   * 关闭数据库
   * @param db
   */
  closeDB(db: any) {
    const timerstep = new Date().getTime() - timering;
    db?.close();
    debug && console.log("数据库已关闭");
    debug &&
      console.log(`========== 结束耗时 ${nowTimeFu(timerstep)} ==========`);
  }

  /**
   * 更新数据
   * @param {DBUpdateProps}
   * @returns Promise<any>
   */
  async updateDB({ dbName, data, key }: DBUpdateProps): Promise<any> {
    const db = await this.openDB({ dbName }),
      transaction = db.transaction(dbName, "readwrite"), // 事务对象 指定表格名称和操作模式（"只读"或"读写"）
      objectStore = transaction.objectStore(dbName); // 仓库对象

    data.forEach(async (d: any) => {
      if (key && key.length) {
        const value = this.clearParams(
          key.reduce((r: any, l: string) => {
            r[l] = d[l];
            return r;
          }, {})
        );
        const request = objectStore.index(value[0]).get(value[1]);

        request.onsuccess = function (e: any) {
          const _d = e.target.result;
          if (_d) {
            d = { ..._d, ...d };
            objectStore.put(d).onsuccess = function () {
              debug && console.log("更新数据:", d);
            };
          } else {
            objectStore.add(d).onsuccess = function () {
              debug && console.log("新增数据:", d);
            };
          }
        };
      } else {
        objectStore.put(d).onsuccess = function () {
          debug && console.log("更新数据:", d);
        };
      }
    });

    return new Promise((resolve) => {
      transaction.oncomplete = () => {
        debug && console.log("更新数据写入成功");
        this.closeDB(db);
        resolve(data);
      };
    });
  }

  /**
   * 通过游标读取所有数据
   * @param dbName
   * @returns Promise<any>
   */
  async cursorGetData(dbName: string): Promise<any> {
    const db = await this.openDB({ dbName });
    const list: any[] = [];

    return new Promise((resolve) => {
      db
        .transaction(dbName) // 事务
        .objectStore(dbName) // 仓库对象
        .openCursor().onsuccess = // 指针对象
        (e: any) => {
          // 游标开启成功，逐行读数据
          const cursor = e.target.result;
          if (cursor) {
            // 必须要检查
            list.push(cursor.value);
            cursor.continue(); // 遍历了存储对象中的所有内容
          } else {
            debug && console.log("游标读取的数据：", list);
            this.closeDB(db);
            resolve(list);
          }
        };
    });
  }

  /**
   * 通过索引和游标分页查询记录
   * @param {CursorPageProps}
   * @returns Promise<TableDataResProps>
   */
  async cursorGetDataByIndexAndPage(
    cursor: CursorPageProps
  ): Promise<TableDataResProps> {
    const { dbName, query = {}, page, size } = cursor;

    const reslut = (e: any, resolve: any) => {
      let cursor = e.target.result;
      if (page > 1 && advanced) {
        advanced = false;
        cursor.advance((page - 1) * size); // 跳过多少条
        return;
      }
      if (cursor) {
        // 必须要检查
        res.data.push(cursor.value);
        counter++;
        if (counter < size) {
          cursor.continue(); // 遍历了存储对象中的所有内容
        } else {
          cursor = null;
          debug && console.log("查询结果: ", res);
          this.closeDB(db);
          resolve(res);
        }
      } else {
        debug && console.log("查询结果: ", res);
        this.closeDB(db);
        resolve(res);
      }
    };

    const db = await this.openDB({ dbName });

    const res: any = {
      data: [],
      total: 0,
      page,
      size,
    };
    let counter = 0; // 计数器
    let advanced = true; // 是否跳过多少条查询
    const store = db.transaction(dbName).objectStore(dbName); // 仓库对象

    debug && console.log("查询参数：", { ...query, page, size });

    if (query && Object.keys(query).length) {
      const value = this.clearParams(query);
      const request = store.index(value[0]); // 索引对象

      return new Promise((resolve) => {
        const _countRequest = request.count(IDBKeyRange.only(value[1]));
        _countRequest.onsuccess = () => {
          res.total = _countRequest.result;
          request.openCursor(IDBKeyRange.only(value[1])).onsuccess = (e: any) =>
            reslut(e, resolve); // 指针对象
        };
      });
    } else {
      return new Promise((resolve) => {
        const countRequest = store.count();

        countRequest.onsuccess = () => {
          res.total = countRequest.result;
          store.openCursor().onsuccess = (e: any) => reslut(e, resolve); // 指针对象
        };
      });
    }
  }

  /**
   * 通过索引读取数据
   * @param {IndexDateProps}
   * @returns Promise<TableDataResProps>
   */
  async getDataByIndex({
    db,
    dbName,
    query,
    all = true,
  }: IndexDateProps): Promise<TableDataResProps> {
    const value = this.clearParams(query);

    if (!value[0]) return Promise.reject("索引名称不能为空");

    if (!db) {
      db = await this.openDB({ dbName });
    }
    debug && console.log("查询参数:", { [value[0]]: value[1] });

    const store = db.transaction(dbName, "readwrite").objectStore(dbName);
    const res: any = {
      data: [],
      total: 0,
    };

    return new Promise((resolve) => {
      if (all) {
        const request = store.index(value[0]).getAll(value[1]);
        request.onsuccess = (e: any) => {
          res.data = e.target.result;
          res.total = res.data.length;
          this.closeDB(db);
          resolve(res);
        };
      } else {
        const request = store.index(value[0]).get(value[1]);
        request.onsuccess = (e: any) => {
          res.data = e.target.result;
          res.total = 1;
          this.closeDB(db);
          resolve(res);
        };
      }
    });
  }

  /**
   * 清洗索引查询参数
   * @param {Query}
   * @returns [string, any[] | string]
   */
  clearParams(query: Query): [string, any[] | string] {
    const value: any = ["", []];
    Object.keys(query).forEach((key) => {
      value[0] = value[0].length ? `${value[0]}AND${key}` : key;
      if (value[0].includes("AND")) {
        if (Array.isArray(value[1])) {
          value[1].push(query[key]);
        } else {
          value[1] = [value[1], query[key]];
        }
      } else {
        value[1] = query[key];
      }
    });

    return value;
  }

  /**
   * 删除指定主键的记录
   *
   */
  async deleteDataByIndex({
    dbName,
    key,
  }: {
    dbName: string;
    key: number;
  }): Promise<number> {
    const db = await this.openDB({ dbName });
    const store = db.transaction(dbName, "readwrite").objectStore(dbName);
    return new Promise((resolve) => {
      store.delete(key).onsuccess = function () {
        debug && console.log("删除数据 id:", key);
        resolve(key);
      };
    });
  }
}

export default IndexDB.Instance;
