/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  Button,
  Row,
  Space,
  TableProps as AntdTableProps,
  Table as AntdTable,
  Col,
  Input,
  Form,
  Select,
  Spin,
  DatePicker,
  Dropdown,
  Popconfirm,
} from "antd";
import type { GetRef, InputRef } from "antd";
import { ButtonType } from "antd/es/button";
import {
  createContext,
  forwardRef,
  useCallback,
  useContext,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { deleteEmptyField } from "../utils";
import db from "../db";
import { Dayjs } from "dayjs";
import { TableDataResProps } from "../types";

type FormInstance<T> = GetRef<typeof Form<T>>;
interface EditableRowProps {
  index: number;
}

const EditableContext = createContext<FormInstance<any> | null>(null);

const EditableRow: React.FC<EditableRowProps> = ({ index, ...props }) => {
  const [form] = Form.useForm();
  return (
    <Form form={form} component={false}>
      <EditableContext.Provider value={form}>
        <tr {...props} />
      </EditableContext.Provider>
    </Form>
  );
};

interface EditableCellProps {
  title: React.ReactNode;
  editable: boolean;
  children: React.ReactNode;
  dataIndex: string;
  record: any;
  handleSave: (record: any) => void;
}

const EditableCell: React.FC<EditableCellProps> = ({
  title,
  editable,
  children,
  dataIndex,
  record,
  handleSave,
  ...restProps
}) => {
  const [editing, setEditing] = useState(false);
  const inputRef = useRef<InputRef>(null);
  const form = useContext(EditableContext)!;

  useEffect(() => {
    if (editing) {
      inputRef.current!.focus();
    }
  }, [editing]);

  const toggleEdit = () => {
    setEditing(!editing);
    form.setFieldsValue({ [dataIndex]: record[dataIndex] });
  };

  const save = async () => {
    try {
      const values = await form.validateFields();

      toggleEdit();
      handleSave({ ...record, ...values });
    } catch (errInfo) {
      console.log("Save failed:", errInfo);
    }
  };

  let childNode = children;

  if (editable) {
    childNode = editing ? (
      <Form.Item style={{ margin: 0 }} name={dataIndex}>
        <Input ref={inputRef} onPressEnter={save} onBlur={save} />
      </Form.Item>
    ) : (
      <div
        className="editable-cell-value-wrap"
        style={{ paddingRight: 24, minHeight: 24 }}
        onClick={toggleEdit}
      >
        {children}
      </div>
    );
  }

  return <td {...restProps}>{childNode}</td>;
};

function _Table(params: TableProps, ref: any) {
  const [loading, setLoading] = useState<boolean>(false);
  const [dataSource, setDataSource] = useState<any>([]);
  const [selectedRows, setSelectedRows] = useState<any>([]);
  const [form] = Form.useForm();
  const data = useRef<any>([]);
  const columns = useRef<any>([]);
  const total = useRef<number>(0);
  const pager = useRef<{ page: number; size: number }>({ page: 1, size: 10 });

  const components = {
    body: {
      row: EditableRow,
      cell: EditableCell,
    },
  };

  const dataFn = useCallback(
    async (res: TableDataResProps, query: any) => {
      if (params.beforeData) {
        res = await params.beforeData(res, query);
      }

      total.current = res.total;
      data.current = res.data || [];
      setSelectedRows([]);
      setDataSource(data.current);
      setLoading(false);
    },
    [params]
  );

  const search = useCallback(
    ({
      page,
      size,
      data,
    }: { page?: number; size?: number; data?: any[] } = {}) => {
      setLoading(true);

      pager.current = {
        page: page || pager.current.page,
        size: size || pager.current.size,
      };

      const query = deleteEmptyField(
        Object.assign({}, params.query, form.getFieldsValue())
      );

      if (params.dbName) {
        if (params.noPagination) {
          db.getDataByIndex({
            dbName: params.dbName,
            query,
          }).then((res) => {
            dataFn(res, query);
          });
        } else {
          db.cursorGetDataByIndexAndPage({
            dbName: params.dbName,
            query,
            page: pager.current.page,
            size: pager.current.size,
          }).then((res) => {
            dataFn(res, query);
          });
        }
      } else {
        const _d: any = data || params.dataSource || [];
        dataFn({ data: _d, total: _d.length }, query);
      }
    },
    [
      params.query,
      params.dbName,
      params.noPagination,
      params.dataSource,
      form,
      dataFn,
    ]
  );

  const handleSave = useCallback(
    (row: any) => {
      const newData = [...data.current];
      const index = newData.findIndex(
        (item) => row[params.rkey] === item[params.rkey]
      );
      const item = newData[index];

      newData.splice(index, 1, {
        ...item,
        ...row,
      });

      params.editSave && params.editSave(row);

      data.current = newData;
      setDataSource(data.current);
    },
    [params]
  );

  useEffect(() => {
    columns.current = (params.columns || [])
      .map((col: any) => {
        if (col.show === false) {
          return false;
        }
        if (!col.editable) {
          return col;
        }
        return {
          ...col,
          onCell: (record: any) => ({
            record,
            editable: col.editable,
            dataIndex: col.dataIndex,
            title: col.title,
            handleSave,
          }),
        };
      })
      .filter(Boolean);

    search();
  }, [params, search, handleSave]);

  const onPageChange = (page: number, size: number) => {
    search({ page, size });
  };

  useImperativeHandle(ref, () => ({
    refresh: (data?: any[]) => search({ data }),
    query: () =>
      deleteEmptyField(Object.assign({}, params.query, form.getFieldsValue())),
    selectedRows: () => selectedRows || [],
  }));

  return (
    <Spin delay={100} spinning={loading} tip="加载中...">
      <Space direction="vertical" size="small" style={{ display: "flex" }}>
        <Form
          form={form}
          autoComplete="off"
          initialValues={(() => {
            const _value = params.search
              ? params.search
                  .map((item) => {
                    return {
                      [item.key]: item.defaultValue || "",
                    };
                  })
                  .reduce((pre, cur) => {
                    return { ...pre, ...cur };
                  }, {})
              : {};
            return _value;
          })()}
        >
          {params.search && (
            <Row gutter={12}>
              {params.search.map((item) => (
                <Col key={item.key} span={item.span || 6}>
                  <Form.Item
                    label={item.label}
                    name={`${item.fuzzy ? "fuzzy_" : ""}` + item.key}
                  >
                    {(() => {
                      switch (item.type) {
                        case "select":
                          return (
                            <Select
                              showSearch
                              allowClear={item.allowClear ?? true}
                              placeholder={item.label}
                              options={item.options || []}
                            ></Select>
                          );
                        case "date":
                          return (
                            <DatePicker
                              picker="month"
                              allowClear={item.allowClear ?? true}
                            />
                          );
                        default:
                          return (
                            <Input
                              placeholder={item.label}
                              allowClear={item.allowClear ?? true}
                            />
                          );
                      }
                    })()}
                  </Form.Item>
                </Col>
              ))}
              <Col>
                <Button type="primary" onClick={() => search({ page: 1 })}>
                  查询
                </Button>
              </Col>
            </Row>
          )}
        </Form>
        {params.headButtons && (
          <Row gutter={12}>
            {params.headButtons.map((item, index) => {
              if (item.children) {
                return (
                  <Col key={item.label || index}>
                    <Dropdown
                      key={item.label || index}
                      menu={{
                        items: item.children.map((i, index) => ({
                          key: index + "",
                          label: (
                            <a onClick={() => i.click && i.click(selectedRows)}>
                              {i.label}
                            </a>
                          ),
                        })),
                      }}
                      placement="bottom"
                    >
                      <Button
                        type={item.type || "primary"}
                        disabled={item.auth && !selectedRows.length}
                      >
                        {item.label}
                      </Button>
                    </Dropdown>
                  </Col>
                );
              } else {
                return (
                  <Col key={item.label || index}>
                    {item.confirm ? (
                      <Popconfirm
                        title={item.label}
                        description={item.confirm}
                        onConfirm={() => item.click && item.click(selectedRows)}
                      >
                        <Button
                          type={item.type || "primary"}
                          disabled={item.auth && !selectedRows.length}
                        >
                          {item.label}
                        </Button>
                      </Popconfirm>
                    ) : (
                      <Button
                        type={item.type || "primary"}
                        onClick={() => item.click && item.click(selectedRows)}
                        disabled={item.auth && !selectedRows.length}
                      >
                        {item.label}
                      </Button>
                    )}
                  </Col>
                );
              }
            })}
          </Row>
        )}
        <AntdTable
          {...params}
          rowSelection={
            params.selectionType && {
              ...params.rowSelection,
              fixed: true,
              type: params.selectionType,
              onChange: (_: React.Key[], rows: any[]) => {
                setSelectedRows(rows);
              },
            }
          }
          dataSource={dataSource}
          rowKey={params.rkey}
          components={components}
          columns={columns.current}
          pagination={{
            total: total.current,
            onChange: onPageChange,
            ...(params.pagination || {}),
            showSizeChanger: true,
          }}
        />
      </Space>
    </Spin>
  );
}

const Table = forwardRef(_Table);

export default Table;

type headButton = {
  label: string;
  click?: (checkedRows: any[]) => void;
  type?: ButtonType;
  auth?: boolean;
  confirm?: string | React.ReactNode;
  children?: headButton[];
};

export interface TableProps extends AntdTableProps {
  noPagination?: boolean;
  dbName?: string;
  rkey: string;
  selectionType?: "checkbox" | "radio";
  selectedRowKeys?: string;
  query?: { [name: string]: any };
  headButtons?: headButton[];
  search?: {
    label: string;
    key: string;
    type?: "input" | "select" | "date";
    options?: {
      label: string;
      value: string;
    }[];
    defaultValue?: string | Dayjs;
    fuzzy?: boolean; // 是否模糊查询
    allowClear?: boolean;
    span?: number;
  }[];
  editSave?: (data: any) => void;
  beforeData?: (
    res: TableDataResProps,
    query: any
  ) => Promise<TableDataResProps>;
}
