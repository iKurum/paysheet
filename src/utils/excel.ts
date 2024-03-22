/* eslint-disable @typescript-eslint/no-explicit-any */
import * as xlsx from "xlsx";
import * as cpexcel from "xlsx/dist/cpexcel.js";
import * as XLSX from "exceljs";
import { excelParamsType } from "../types";
// import { flatten } from ".";
import db from "../db";

/**
 * 导入使用 xlsx (读取.xls)
 * 导出使用 exceljs (设置样式)
 */

xlsx.set_cptable(cpexcel);

/**
 * excel 导出
 * style:excel表的样式配置
 * tableData:表的数据内容
 * headerColumns:表头配置
 * sheetName：工作表名
 */
export const exportExcelFile = async (options: excelParamsType) => {
  const {
    fileName = "新建 Microsoft Excel 工作表.xlsx",
    sheetName = "工作表1",
    style = {
      alignment: { horizontal: "center", vertical: "middle" },
      border: {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      },
    },
    headerColumns,
    tableData,
    frozen,
    moneyColumn,
  } = options;

  if (!fileName.endsWith(".xlsx")) {
    options.fileName = `${fileName}.xlsx`;
  }

  // 创建工作簿
  const workbook = new XLSX.Workbook();
  workbook.creator = "ikurum.cn";
  workbook.created = new Date();

  // 添加工作表
  const worksheet = workbook.addWorksheet(sheetName, {
    pageSetup: { paperSize: 9, orientation: "landscape" },
    properties: {
      defaultRowHeight: 24,
      defaultColWidth: 20,
    },
  });

  if (frozen) {
    let f = frozen;
    if (typeof f === "boolean") {
      f = { x: 1, y: 1 };
    }
    worksheet.views = [
      {
        state: "frozen",
        xSplit: f.x,
        ySplit: f.y,
      },
    ];
  }

  {
    // 之后调整页面设置配置
    worksheet.pageSetup.margins = {
      left: 0.7,
      right: 0.7,
      top: 0.75,
      bottom: 0.75,
      header: 0.3,
      footer: 0.3,
    };

    // 设置工作表的打印区域
    // worksheet.pageSetup.printArea = "A1:G20";

    // 通过使用 `&&` 分隔打印区域来设置多个打印区域
    // worksheet.pageSetup.printArea = "A1:G10&&A11:G20";

    // 在每个打印页面上重复特定的行
    // worksheet.pageSetup.printTitlesRow = "1:3";

    // 在每个打印页面上重复特定列
    // worksheet.pageSetup.printTitlesColumn = "A:C";
  }

  if (headerColumns.length > 0) {
    // 设置列头
    const columnsData = headerColumns.map((column) => {
      return {
        header: column.title,
        key: column.dataIndex,
        width: column.width || 20,
      };
    });
    worksheet.columns = columnsData;
    // 设置表头样式
    const headerRow = worksheet.getRow(1);
    headerRow.eachCell((cell) => {
      cell.style = style as Partial<XLSX.Style>;
      cell.font = {
        name: "宋体",
        family: 2,
        size: 11,
        bold: isNaN(cell.value as any) ? true : false,
      };

      const text = cell.value?.toString() || "";
      if (text.endsWith("*")) {
        cell.value = {
          richText: [
            {
              text: text.replace("*", ""),
            },
            {
              font: {
                color: { argb: "FFFF6600" },
              },
              text: "*",
            },
          ],
        };
      }
    });
  }

  // 设置行数据
  if (tableData.length > 0) {
    // 将传入的数据格式化为exceljs可使用的数据格式
    const data: any[] = [];
    tableData.forEach((table: any) => {
      const obj: any = {};
      const tableFlat = { ...table };
      // const tableFlat = flatten(table);

      headerColumns.forEach((header) => {
        obj[header.dataIndex] = tableFlat[header.dataIndex];
      });
      data.push(obj);
    });
    // 添加行
    if (data) worksheet.addRows(data);

    // 获取每列数据，依次对齐
    worksheet.columns.forEach((column) => {
      column.alignment = style.alignment as Partial<XLSX.Alignment>;
    });
    // 设置每行的边框
    const dataLength = data.length as number;
    const tabeRows = worksheet.getRows(2, dataLength + 1);
    tabeRows?.forEach((row) => {
      row.eachCell({ includeEmpty: true }, (cell) => {
        cell.border = style.border as Partial<XLSX.Borders>;

        if (cell.value?.toString() === "true") {
          cell.value = "";
          cell.fill = {
            type: "pattern",
            pattern: "darkDown",
            fgColor: { argb: "008000" },
          };
        }
      });
    });
  }

  if (moneyColumn) {
    worksheet.getColumn(moneyColumn).numFmt = "0.0000";
  }

  // 下载文件
  {
    const buf = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buf], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=utf-8",
    }) as any;
    const url = URL.createObjectURL(blob);
    const aLink = document.createElement("a");
    aLink.setAttribute("download", fileName);
    aLink.setAttribute("href", url);
    document.body.appendChild(aLink);
    aLink.click();
    document.body.removeChild(aLink);
    URL.revokeObjectURL(blob);
  }
};

// EXCEL 解析上传文件
export const parsingExcel = async (file: File) => {
  const reader = new FileReader();

  return new Promise((resolve, reject) => {
    reader.onload = async (e) => {
      const data = e.target?.result as ArrayBuffer;
      const workbook = xlsx.read(data, { type: "buffer" });
      // 找到第一张表
      const sheetNames = workbook.SheetNames;
      const sheet1 = workbook.Sheets[sheetNames[0]];
      // 读取内容
      resolve(xlsx.utils.sheet_to_json(sheet1));
    };
    reader.onerror = (e) => {
      reject(e);
    };
    reader.readAsArrayBuffer(file);
  });
};

// 考勤文件数据
export const cleanExcelData = (
  data: any[],
  setArea: (str: string, clear?: boolean) => void
) => {
  const f = data[0];
  if (f && f?.type && f?.name && f?.date) {
    setArea("获取考勤信息表，解析数据 ...");
    setArea(`考勤项目: ${f?.project}`);
    setArea(`考勤时间: ${f?.date.slice(0, 7)}`);

    // 更新项目表
    db.updateDB({
      dbName: "project",
      data: [{ name: f?.project }],
      key: ["name"],
    });

    let robj: any = {},
      user: any = {};
    data.forEach((item) => {
      user[item.idcard] = { name: item.name, idcard: item.idcard };

      const date = item.date.slice(0, 7);
      robj[item.idcard] = {
        ...(robj[item.idcard] || {}),
        name: item.name,
        project: item.project,
        date: date,
        idcard: item.idcard,
      };

      if (robj[item.idcard]?.attend) {
        robj[item.idcard].attend.push({ [item.time]: item.type });
      } else {
        robj[item.idcard].attend = [{ [item.time]: item.type }];
      }
    });
    robj = Object.values(robj);
    user = Object.values(user);

    setArea(`打卡人数: ${robj.length}`);
    // 更新用户表
    db.updateDB({ dbName: "user", data: user, key: ["idcard"] });

    // 更新资表
    db.updateDB({
      dbName: "pay",
      data: robj,
      key: ["name", "project", "date"],
    });

    return data;
  }
  return [];
};
