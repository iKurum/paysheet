/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useRef } from "react";
import Table from "../../components/Table";
import db from "../../db";
import { openDrawer, openModal, openNotification } from "../../utils";
import {
  Col,
  DatePicker,
  Descriptions,
  DescriptionsProps,
  Divider,
  Input,
  Popconfirm,
  Row,
  Space,
  Typography,
} from "antd";
import dayjs, { Dayjs } from "dayjs";

const { Text } = Typography;

export default function ProjectsPage() {
  const table = useRef<any>();
  const userTable = useRef<any>();
  const drawerTable = useRef<any>();
  const nowInfo = useRef<any>();
  const user = useRef<any[]>([]);

  const columns = [
    {
      title: "项目名称",
      dataIndex: "name",
      render: (text: any, record: any) => {
        return (
          <span
            style={{
              color: record.default ? "green" : "var(--ant-color-text)",
            }}
          >
            {text}
          </span>
        );
      },
    },
    {
      title: "开始时间",
      dataIndex: "time",
    },
    {
      title: "月资表关联人员",
      dataIndex: "users",
      render: (text: any) => {
        return text?.length || "";
      },
    },
    {
      title: "备注",
      dataIndex: "description",
    },
    {
      title: "操作",
      width: "120px",
      render: (_: any, record: any) => {
        return (
          <Row gutter={10}>
            <Col>
              <a onClick={() => update(record)}>修改</a>
            </Col>
            <Col>
              <Popconfirm
                title="删除"
                description="是否删除该项目?"
                onConfirm={() => deleteProject(record)}
              >
                <a>删除</a>
              </Popconfirm>
            </Col>
            {!record.default && (
              <Col>
                <Popconfirm
                  title="设置"
                  description="是否设置该项目为默认项目?"
                  onConfirm={() => updateDefault(record)}
                >
                  <a>设为默认项目</a>
                </Popconfirm>
              </Col>
            )}
          </Row>
        );
      },
    },
  ];

  const headButtons = [
    {
      label: "添加",
      click: () => update(),
    },
  ];

  const editSave = (data: any = {}) => {
    if (!nowInfo.current.users) {
      nowInfo.current.users = [];
    }

    Object.keys(data).forEach((key) => {
      switch (key) {
        case "money":
          (nowInfo.current.users || []).forEach((item: any) => {
            if (item.uid === data[key].uid) {
              item.money = data[key].money;
            }
          });
          break;
        case "adduser":
          Array.isArray(data[key]) &&
            data[key].forEach((item: any) => {
              if (!nowInfo.current.users.some((u: any) => u.uid === item.uid)) {
                nowInfo.current.users.push(item);
              }
            });
          break;
        case "deluser":
          Array.isArray(data[key]) &&
            data[key].forEach((item: any) => {
              const index = nowInfo.current.users.findIndex(
                (u: any) => u.uid === item.uid
              );
              if (index !== -1) {
                nowInfo.current.users.splice(index, 1);
              }
            });
          break;
        default:
          nowInfo.current[key] = data[key];
      }
    });
    db.updateDB({ dbName: "project", data: [nowInfo.current] }).then((data) => {
      refresh(data);
    });
  };

  const update = (item?: any) => {
    if (item) {
      const items: DescriptionsProps["items"] = [
        {
          key: "1",
          label: "项目名称",
          children: <p>{item.name}</p>,
        },
        {
          key: "2",
          label: "开始时间",
          children: (
            <DatePicker
              allowClear
              defaultValue={item.time ? dayjs(item.time) : null}
              onChange={(_: Dayjs, dateString: string | string[]) => {
                editSave({ time: dateString });
              }}
            />
          ),
        },
        {
          key: "3",
          label: "备注",
          span: 2,
          children: (
            <Input.TextArea
              allowClear
              showCount
              placeholder="项目备注..."
              autoSize={{ minRows: 2, maxRows: 6 }}
              maxLength={200}
              defaultValue={item.description}
              onBlur={(e) => {
                editSave({ description: e.target.value });
              }}
            />
          ),
        },
      ];

      nowInfo.current = item;

      openDrawer({
        title: "项目信息",
        width: 800,
        content: (
          <Space direction="vertical" size="middle" style={{ display: "flex" }}>
            <Descriptions bordered colon={false} column={2} items={items} />
            <Divider orientation="left">
              <Text>月资表关联人员</Text>
            </Divider>
            <Table
              ref={drawerTable}
              rkey="uid"
              selectionType="checkbox"
              columns={
                [
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
                  {
                    title: "默认月资",
                    dataIndex: "money",
                    editable: true,
                    width: 200,
                  },
                ] as any
              }
              headButtons={[
                {
                  label: "添加",
                  click: () => addUser(item.users || []),
                },
                {
                  label: "删除",
                  type: "default",
                  auth: true,
                  confirm: "是否确认删除？",
                  click: (rows: any[]) => {
                    editSave({ deluser: rows });
                  },
                },
              ]}
              dataSource={item.users || []}
              editSave={(data) => editSave({ money: data })}
              noPagination={true}
            />
          </Space>
        ),
      });
    } else {
      openModal({
        title: "添加项目",
        form: {
          config: [
            {
              type: "INPUT",
              label: "项目名称",
              name: "name",
              rules: [{ required: true, message: "请输入项目名称" }],
            },
            {
              type: "DATE",
              label: "项目开始时间",
              name: "time",
            },
            // {
            //   type: "SELECT",
            //   label: "关联人员",
            //   name: "users",
            //   rules: [{ required: true, message: "请选择项目关联人员" }],
            //   options: user.current
            //     .map((item: any) => ({
            //       label: item.name,
            //       value: item.uid,
            //     }))
            //     .sort((a: any, b: any) => a.label.localeCompare(b.label)),
            //   multiple: true,
            // },
            {
              type: "TEXTAREA",
              label: "项目描述",
              name: "description",
            },
          ],
        },
        async ok(data) {
          data = {
            ...data,
            default: 0,
            users: [],
          };
          if (data.time) {
            data.time = data.time.format("YYYY-MM-DD");
          }
          db.updateDB({ dbName: "project", data: [data] }).then(() => {
            table.current?.refresh();
          });
        },
      });
    }
  };

  const updateDefault = async (item: any) => {
    const { data } = await db.getDataByIndex({
      dbName: "project",
      query: { default: 1 },
    });

    if (data.length) {
      db.updateDB({ dbName: "project", data: [{ ...data[1], default: 0 }] });
    }

    db.updateDB({ dbName: "project", data: [{ ...item, default: 1 }] }).then(
      () => {
        table.current?.refresh();
      }
    );
  };

  const addUser = (users: any[]) => {
    const beforeData = async (res: any) => {
      const _data = res.data.filter((item: any) => {
        return !users.some((user) => user.uid === item.uid);
      });

      return {
        data: _data,
        total: _data.length,
      };
    };

    openModal({
      title: "添加人员",
      content: (
        <Table
          ref={userTable}
          dataSource={user.current}
          rkey="uid"
          selectionType="checkbox"
          beforeData={beforeData}
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
      ),
      ok() {
        const rows: any[] = userTable.current?.selectedRows();

        if (rows.length) {
          editSave({ adduser: users.concat(rows) });
        }
      },
    });
  };

  const deleteProject = (data: any) => {
    db.getDataByIndex({
      dbName: "attendance",
      query: { project: data.name },
    }).then((res) => {
      if (res.total === 0) {
        db.deleteDataByIndex({
          dbName: "project",
          key: data.pid,
        }).then(() => {
          table.current?.refresh();
        });
      } else {
        openNotification({
          type: "error",
          message: "该项目下存在考勤记录，无法删除",
        });
      }
    });
  };

  useEffect(() => {
    db.cursorGetData("user").then((data) => {
      user.current = data;
    });
  }, []);

  const refresh = (data: any[]) => {
    table.current?.refresh();
    drawerTable.current?.refresh(Object.assign([], data[0]?.users || []));
    nowInfo.current = data[0];
  };

  return (
    <Table
      ref={table}
      rkey="pid"
      dbName="project"
      columns={columns}
      headButtons={headButtons}
    />
  );
}
