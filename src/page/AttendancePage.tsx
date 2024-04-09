/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useRef, useState } from "react";
import Table, { TableProps } from "../components/Table";
import { openDrawer, openModal } from "../utils";
import Upload from "../components/Upload";
import db from "../db";
import { cleanExcelData, exportExcelFile } from "../utils/excel";
import dayjs, { Dayjs } from "dayjs";
import {
  Descriptions,
  DescriptionsProps,
  Divider,
  Space,
  Typography,
} from "antd";
import Calendar, { CalendarProps } from "../components/Calendar";

const { Text } = Typography;

export default function AttendancePage() {
  const [headSearch, setHeadSearch] = useState<TableProps["search"]>();
  const users = useRef<any>({});
  const table = useRef<any>();
  const fileData = useRef<any>([]);

  const columns = [
    {
      title: "姓名",
      dataIndex: "name",
      file: "姓名*",
      fileWidth: 15.88,
    },
    {
      title: "身份证号",
      dataIndex: "idcard",
      file: "身份证号*",
      fileWidth: 24.75,
    },
    {
      title: "银行卡号",
      dataIndex: "bankid",
      render: (_: any, record: any) => {
        return users.current[record.idcard]?.bankid;
      },
      file: "银行卡号",
      fileWidth: 29.38,
    },
    {
      title: "当月考勤情况",
      dataIndex: "attend",
      render: (attend: any, record: any) => {
        const attendSet = new Set();
        (attend || []).forEach((item: any) => {
          Object.keys(item).forEach((key: any) => {
            attendSet.add(key.slice(0, 10));
          });
        });

        return Array.isArray(attend) ? (
          <a
            onClick={() =>
              drawer(record, `${attend.length}次（${attendSet.size}天）`)
            }
          >
            {attend.length}次（{attendSet.size}天）
          </a>
        ) : (
          ""
        );
      },
    },
  ];

  const headButtons = [
    {
      label: "导入",
      click: () => upload(),
    },
    {
      label: "导出",
      click: () => downloadAttend(),
    },
  ];

  const init = async () => {
    Promise.all([db.cursorGetData("user"), db.cursorGetData("project")]).then(
      ([user, project]: any) => {
        let defaultIndex = 0;
        project = (project || []).map((x: any, index: number) => {
          if (x.default) {
            defaultIndex = index;
          }
          return {
            label: x.name,
            value: x.name,
          };
        });

        users.current = user.reduce((pre: any, cur: any) => {
          pre[cur.idcard] = cur;
          return pre;
        }, {});

        setHeadSearch([
          {
            label: "姓名",
            key: "name",
            type: "select",
            options: (user || [])
              .map((x: any) => ({
                label: x.name,
                value: x.name,
              }))
              .sort((a: any, b: any) => a.label.localeCompare(b.label)),
          },
          {
            label: "项目",
            key: "project",
            type: "select",
            options: project,
            defaultValue: project[defaultIndex]?.value,
            allowClear: false,
          },
          {
            label: "日期",
            key: "date",
            type: "date",
            defaultValue: dayjs(),
            allowClear: false,
          },
        ]);
      }
    );
  };

  const upload = () => {
    openModal({
      title: "批量上传",
      okText: "导入",
      content: (
        <div>
          <Upload
            onloadFile={loadFile}
            mapping={{
              姓名: "name",
              工种: "job",
              所在项目: "project",
              班组名称: "team",
              考勤方式: "mode",
              考勤日期: "date",
              考勤时间: "time",
              考勤类型: "type",
              身份证号: "idcard",
            }}
          />
        </div>
      ),
      ok() {
        if (fileData.current.length) {
          db.updateDB({
            dbName: "attendance",
            data: fileData.current,
            key: ["name", "project", "time"],
          }).then(async () => {
            await init();
            table.current?.refresh();
          });
        }
      },
    });
  };

  const loadFile = (
    data: any[],
    setArea: (str: string, clear?: boolean) => void
  ) => {
    fileData.current = cleanExcelData(data, setArea);
  };

  useEffect(() => {
    init();
  }, []);

  const drawer = (item: any, total: string) => {
    const items: DescriptionsProps["items"] = [
      {
        key: "1",
        label: "姓名",
        children: <p>{item.name}</p>,
      },
      {
        key: "2",
        label: "身份证号",
        children: <p>{item.idcard}</p>,
      },
    ];
    const data: CalendarProps["data"] = {};
    (item.attend || []).forEach((item: any) => {
      Object.keys(item).forEach((key) => {
        if (!data[key.slice(0, 10)]) {
          data[key.slice(0, 10)] = [];
        }
        data[key.slice(0, 10)].push({
          date: key.slice(0, 10),
          time: key.slice(10).trim(),
          type: item[key],
        });
      });
    });

    openDrawer({
      title: item.name + " 考勤情况" + ` 【${total}】`,
      width: 700,
      content: (
        <Space direction="vertical" size="middle" style={{ display: "flex" }}>
          <Descriptions bordered colon={false} column={2} items={items} />
          <Divider orientation="left">
            <Text>{item.project}</Text>
            <Text>（考勤日期: {item.date}）</Text>
          </Divider>
          <Calendar data={data} date={dayjs(item.date, "YYYY-MM")}></Calendar>
        </Space>
      ),
    });
  };

  const downloadAttend = () => {
    const params = table.current?.query();
    db.getDataByIndex({ dbName: "pay", query: params }).then(({ data }) => {
      let date, project, day: Dayjs;
      const col: any = [];

      data = data.map((x: any, index) => {
        date = x.date;
        project = x.project;

        x.attend = [
          ...new Set(
            x.attend
              .map((item: any) => {
                const a: string[] = [];
                Object.keys(item).forEach((key) => {
                  a.push(key.slice(0, 10));
                });
                return a;
              })
              .flat(3)
          ),
        ];

        if (!day) {
          day = dayjs(date, "YYYY-MM");
        }

        new Array(day.daysInMonth()).fill(0).map((_, i) => {
          !index &&
            col.push({
              title: `${i + 1}`.padStart(2, "0"),
              dataIndex: `${i + 1}`.padStart(2, "0"),
              width: 3,
            });
          {
            const d = day.add(i, "day").format("YYYY-MM-DD");
            const key = d.slice(8, 10);

            if (Array.isArray(x.attend) && x.attend.includes(d)) {
              x[key] = true;
              x.count = x.count ? x.count + 1 : 1;
            }
          }
        });

        return { ...x, ...(users.current[x.idcard] || {}) };
      });

      exportExcelFile({
        tableData: data,
        fileName: `${project}_${date}月考勤表`,
        sheetName: `${date}_工程月考勤表`,
        frozen: true,
        headerColumns: [
          {
            title: "姓名",
            dataIndex: "name",
            width: 16,
          },
          {
            title: "身份证号",
            dataIndex: "idcard",
            width: 26,
          },
          {
            title: "银行卡号",
            dataIndex: "bankid",
            width: 26,
          },
          {
            title: "打卡月份",
            dataIndex: "date",
            width: 16,
          },
          {
            title: "打卡天数",
            dataIndex: "count",
            width: 16,
          },
          ...col,
        ],
      });
    });
  };

  return (
    headSearch && (
      <Table
        ref={table}
        rkey="id"
        dbName="pay"
        columns={columns}
        headButtons={headButtons}
        search={headSearch}
      />
    )
  );
}
