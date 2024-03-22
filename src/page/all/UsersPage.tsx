/* eslint-disable @typescript-eslint/no-explicit-any */
import { useRef } from "react";
import Table from "../../components/Table";
import Upload from "../../components/Upload";
import { deleteEmptyField, openModal } from "../../utils";
import { Col, Row } from "antd";
import db from "../../db";

export default function UsersPage() {
  const fileData = useRef<any[]>([]);
  const table = useRef<any>();

  const columns = [
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
      title: "手机",
      dataIndex: "mobile",
    },
    {
      title: "邮箱",
      dataIndex: "email",
    },
    {
      title: "备注",
      dataIndex: "description",
    },
    {
      title: "操作",
      width: "60px",
      render: (_: any, record: any) => {
        return (
          <Row gutter={10}>
            <Col>
              <a onClick={() => update(record)}>修改</a>
            </Col>
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
    {
      label: "导入",
      click: () => upload(),
    },
  ];

  // const headSearch = [
  //   {
  //     label: "姓名",
  //     key: "name",
  //   },
  // ];

  const update = (item?: any) => {
    openModal({
      title: item ? "修改信息" : "添加人员",
      form: {
        config: [
          {
            type: "INPUT",
            label: "姓名",
            name: "name",
            rules: [{ required: true, message: "请输入姓名" }],
            defaultValue: item?.name,
          },
          {
            type: "INPUT",
            label: "身份证号",
            name: "idcard",
            rules: [{ required: true, message: "请输入身份证号" }],
            defaultValue: item?.idcard,
          },
          {
            type: "INPUT",
            label: "银行卡号",
            name: "bankid",
            defaultValue: item?.bankid,
          },
          {
            type: "INPUT",
            label: "手机",
            name: "mobile",
            defaultValue: item?.mobile,
          },
          {
            type: "INPUT",
            label: "邮箱",
            name: "email",
            defaultValue: item?.email,
          },
          {
            type: "TEXTAREA",
            label: "备注",
            name: "description",
            defaultValue: item?.description,
          },
        ],
      },
      async ok(data) {
        if (item) {
          data.uid = item.uid;
        }
        db.updateDB({ dbName: "user", data: [data] }).then(() => {
          table.current?.refresh();
        });
      },
    });
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
              身份证号: "idcard",
              开户卡号: "bankid",
              备注: "description",
            }}
          />
        </div>
      ),
      ok() {
        if (fileData.current.length) {
          const data = fileData.current.map((item) => deleteEmptyField(item));
          db.updateDB({
            dbName: "user",
            data,
            key: ["idcard"],
          }).then(async () => {
            const projects = await db.cursorGetData("project");
            const uobj = data.reduce((pre, cur) => {
              pre[cur.idcard] = cur;
              return pre;
            }, {});

            projects.forEach((p: any) => {
              if (Array.isArray(p.users)) {
                p.users = p.users.map((u: any) =>
                  Object.assign({}, u, uobj[u.idcard] || {})
                );

                db.updateDB({
                  dbName: "project",
                  data: [p],
                });
              }
            });

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
    const f = data[0];
    if (f && f?.name && f?.idcard && f?.bankid) {
      setArea("获取人员信息表，解析数据完成");
      fileData.current = data;

      console.log(data);
    }
  };

  return (
    <Table
      ref={table}
      rkey="uid"
      dbName="user"
      columns={columns}
      headButtons={headButtons}
      // search={headSearch}
    />
  );
}
