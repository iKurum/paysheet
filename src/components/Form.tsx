/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  FormProps as AntdFormProps,
  Form as AntdForm,
  Input,
  Select,
  DatePicker,
} from "antd";
import { Rule } from "antd/es/form";
import { FormInstance } from "antd/lib";
import dayjs from "dayjs";
import React, { RefObject, useEffect, useImperativeHandle } from "react";

export default function Form(props: FormProps) {
  const [form] = AntdForm.useForm();

  useEffect(() => {
    const defaultValues = props.config
      .map((item) => {
        if (item.defaultValue) {
          if (item.type === "DATE") {
            return { [item.name]: dayjs(item.defaultValue) };
          }
          return { [item.name]: item.defaultValue };
        }
        return null;
      })
      .reduce((a, b) => {
        if (b) {
          return { ...a, ...b };
        }
        return a;
      }, {});

    form.setFieldsValue(defaultValues);
  }, [props.config, form]);

  useImperativeHandle(props._ref, () => {
    return {
      validate: () =>
        form
          .validateFields()
          .then((values) => values)
          .catch((err: unknown) => {
            console.log(err);
          }),
    };
  });

  const onFinish: AntdFormProps<FieldType>["onFinish"] = (values) => {
    if (props.finished) {
      props.finished(values);
    }

    return values;
  };

  const onFinishFailed: AntdFormProps<FieldType>["onFinishFailed"] = (
    errorInfo
  ) => {
    if (props.errored) {
      props.errored(errorInfo as never);
    }
  };

  return (
    <AntdForm
      form={form}
      labelCol={{ span: 8 }}
      wrapperCol={{ span: 16 }}
      style={{ maxWidth: 600 }}
      initialValues={{ remember: true }}
      onFinish={onFinish}
      onFinishFailed={onFinishFailed}
      autoComplete="off"
    >
      {props.config.map((item, index) => (
        <AntdForm.Item
          key={item.label || index}
          label={item.label}
          name={item.name}
          rules={item.rules}
        >
          {(() => {
            switch (item.type) {
              case "INPUT":
                return <Input maxLength={100} />;
              case "TEXTAREA":
                return (
                  <Input.TextArea
                    autoSize={{ minRows: 3 }}
                    showCount
                    maxLength={200}
                  />
                );
              case "SELECT":
                console.log(item);

                return item.multiple ? (
                  <Select
                    options={item.options || []}
                    mode="multiple"
                    showSearch
                  />
                ) : (
                  <Select showSearch options={item.options || []} />
                );
              case "DATE":
                return <DatePicker />;
            }
          })()}
        </AntdForm.Item>
      ))}
    </AntdForm>
  );
}

type FieldType = {
  username?: string;
  password?: string;
  remember?: string;
};

type FormItemType = "INPUT" | "SELECT" | "TEXTAREA" | "DATE";

export type FormRef = React.LegacyRef<FormInstance<FieldType>>;
export interface FormProps extends AntdFormProps {
  config: {
    type: FormItemType;
    name: string;
    label?: string;
    rules?: Rule[];
    options?: {
      value: string | number | boolean;
      label: string | React.ReactNode;
    }[];
    multiple?: boolean;
    defaultValue?: any;
  }[];
  _ref?: RefObject<unknown>;
  finished?: (values: FieldType) => void;
  errored?: (errorInfo: never) => void;
}
