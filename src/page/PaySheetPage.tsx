/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useRef, useState } from "react";
import Table, { TableProps } from "../components/Table";
import {
  Table as AntdTable,
  Descriptions,
  DescriptionsProps,
  Divider,
  Popover,
  Space,
  Statistic,
  Typography,
} from "antd";
import db from "../db";
import dayjs from "dayjs";
import { exportExcelFile } from "../utils/excel";
import { formatMoney, openDrawer, openModal } from "../utils";
import Calendar, { CalendarProps } from "../components/Calendar";
import { TableDataResProps, excelParamsType } from "../types";

const { Text } = Typography;

export default function PaySheetPage() {
  const [headSearch, setHeadSearch] = useState<TableProps["search"]>();
  const data = useRef<any[]>([]);
  const table = useRef<any>();
  const user = useRef<any>();
  const project = useRef<any>();
  const _query = useRef<any>({});
  const userTable = useRef<any>();

  const headButtons = [
    {
      label: "设置当月人员",
      click: () => addUser(),
    },
    {
      label: "设置当月总工资",
      click: () => addMoney(),
    },
    {
      label: "导出月资表",
      click: () => download(),
    },
  ];

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
      title: "卡户卡号",
      dataIndex: "bankid",
      file: "卡户卡号",
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
    {
      title: "应发工资（元）",
      dataIndex: "money",
      editable: true,
      width: 200,
      file: "应发工资（元）*",
      fileWidth: 18.38,
    },
    {
      title: "签字",
      dataIndex: "sign",
      file: "签字",
      fileWidth: 21.25,
      show: false,
    },
    {
      title: "备注",
      dataIndex: "description",
      editable: true,
      width: 200,
      file: "备注",
      fileWidth: 8.38,
    },
  ];

  useEffect(() => {
    db.cursorGetData("project").then((project: any) => {
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

      setHeadSearch([
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
    });
  }, []);

  const editSave = (data: any) => {
    db.updateDB({ dbName: "pay", data: [data] });

    const p = Object.assign({}, project.current);
    if (p) {
      project.current = {
        ...p,
        users: {
          ...(p.users || {}),
          [data.date]: (p.users?.[data.date] || []).map((item: any) => {
            if (item.uid === data.uid) {
              console.log(data);
              return data;
            }
            return item;
          }),
        },
      };
      db.updateDB({
        dbName: "project",
        data: [project.current],
      });
    }
  };

  const download = () => {
    if (!data.current.length) {
      return;
    }

    exportExcelFile({
      tableData: data.current,
      fileName: `${data.current[0].date}月资表（劳资员）`,
      sheetName: "工程月工资明细",
      moneyColumn: 4,
      headerColumns: columns
        .filter((x) => x.file)
        .map((item) => ({
          ...item,
          title: item.file,
          width: item.fileWidth || 0,
        })) as excelParamsType["headerColumns"],
    });
  };

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
      {
        key: "3",
        label: "卡户卡号",
        children: <p>{item.bankid}</p>,
        span: 2,
      },
      {
        key: "4",
        label: "应发工资（元）",
        children: <p>{item.money}</p>,
        span: 2,
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

  const beforeData = async (res: TableDataResProps, query: any) => {
    let all = 0;

    user.current = Object.assign([], res.data || []);
    _query.current = Object.assign({}, query);

    const obj = res.data.reduce((pre, cur) => {
      pre[cur.idcard + ""] = cur;
      return pre;
    }, {});

    if (query?.project && query?.date) {
      const { data: _data } = await db.getDataByIndex({
        dbName: "project",
        query: { name: query.project },
      });
      if (_data.length) {
        all = _data[0].money?.[query.date] || 0;
        project.current = _data[0];
        data.current = (_data[0].users?.[query.date] || [])
          .map((item: any) => ({ ...item, ...(obj[item.idcard] || []) }))
          .filter(Boolean);
      }
    }

    return {
      data: data.current.map((item: any) => ({ ...item, all })),
      total: data.current.length,
    };
  };

  const addUser = async () => {
    let allUser = await db.cursorGetData("user");
    allUser = (allUser || [])
      .map((item: any) => ({ [item.idcard]: item }))
      .reduce((pre: any, cur: any) => {
        return { ...pre, ...cur };
      }, {});

    if (user.current?.length) {
      user.current = user.current.map((item: any) => {
        const { idcard, ...rest } = item;
        if (allUser[idcard]) {
          return {
            ...rest,
            ...allUser[idcard],
          };
        }
        return item;
      });

      db.updateDB({ dbName: "pay", data: user.current });
    }

    let content = (
      <Table
        ref={userTable}
        dataSource={user.current}
        rkey="uid"
        selectionType="checkbox"
        rowSelection={{
          defaultSelectedRowKeys: (
            project.current?.users?.[_query.current.date] || []
          ).map((item: any) => item.uid),
        }}
        search={[
          {
            label: "姓名",
            key: "name",
            fuzzy: true,
          },
          {
            label: "身份证号",
            key: "idcard",
            fuzzy: true,
            span: 12,
          },
        ]}
        columns={[
          {
            title: "姓名",
            dataIndex: "name",
          },
          {
            title: "身份证号",
            dataIndex: "idcard",
          },
          {
            title: "银行卡号",
            dataIndex: "bankid",
          },
        ]}
      ></Table>
    );
    if (!user.current?.length) {
      content = (
        <Space direction="vertical">暂无考勤人员，请确认是否导入考勤表</Space>
      );
    }

    openModal({
      title:
        _query.current?.project + " (" + _query.current?.date + ") 添加人员",
      content,
      ok() {
        const rows: any[] = userTable.current?.selectedRows();

        if (rows?.length && _query.current?.date) {
          if (project.current) {
            project.current = {
              ...project.current,
              users: {
                ...(project.current?.users || {}),
                [_query.current.date]: rows,
              },
            };
            db.updateDB({
              dbName: "project",
              data: [project.current],
            }).then(() => {
              addMoney();
            });
          }
        }
      },
    });
  };

  const addMoney = async () => {
    openModal({
      title:
        _query.current?.project + " (" + _query.current?.date + ") 添加金额",
      form: {
        config: [
          {
            type: "INPUT",
            label: "总金额",
            name: "money",
            rules: [{ required: true, message: "请输入金额" }, {}],
            defaultValue: project.current?.money?.[_query.current.date],
          },
        ],
      },
      async ok(data) {
        if (project.current) {
          project.current = {
            ...project.current,
            money: {
              ...(project.current?.money || {}),
              [_query.current.date]: data.money,
            },
          };
          db.updateDB({ dbName: "project", data: [project.current] }).then(
            () => {
              table.current?.refresh();
            }
          );
        }
      },
    });
  };

  return (
    headSearch && (
      <Table
        ref={table}
        rkey="uid"
        dbName="pay"
        noPagination
        columns={columns}
        search={headSearch}
        headButtons={headButtons}
        editSave={editSave}
        beforeData={beforeData}
        summary={(pageData) => {
          let totalRepayment = 0,
            all = 0;
          const ids: number[] = [];

          pageData.forEach((d: any) => {
            totalRepayment += +(d.money || 0);
            if (!all) {
              all = +(d.all || 0);
            }
            ids.push(d.uid);
          });

          data.current.forEach((d: any) => {
            if (!ids.includes(d.uid)) {
              totalRepayment += +(d.money || 0);
            }
          });

          return pageData.length ? (
            <AntdTable.Summary.Row>
              <AntdTable.Summary.Cell index={0}></AntdTable.Summary.Cell>
              <AntdTable.Summary.Cell index={1}></AntdTable.Summary.Cell>
              <AntdTable.Summary.Cell index={2}></AntdTable.Summary.Cell>
              <AntdTable.Summary.Cell index={3}></AntdTable.Summary.Cell>
              <AntdTable.Summary.Cell index={4}>
                <Popover content={<Text>{formatMoney(totalRepayment)}</Text>}>
                  <Statistic
                    title="合计"
                    value={totalRepayment}
                    valueStyle={{
                      color: totalRepayment !== all ? "red" : "green",
                    }}
                  />
                </Popover>
              </AntdTable.Summary.Cell>
              <AntdTable.Summary.Cell index={5}>
                <Popover content={<Text>{formatMoney(all)}</Text>}>
                  <Statistic title="当月总工资" value={all} />
                </Popover>
              </AntdTable.Summary.Cell>
            </AntdTable.Summary.Row>
          ) : null;
        }}
      />
    )
  );
}
