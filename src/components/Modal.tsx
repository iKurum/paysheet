import { createRef, useState } from "react";
import { Modal as AntdModal, ModalProps } from "antd";
import Form, { FormProps } from "./Form";

let m: (params: OpenModalProps) => void;
export default function Modal() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const form = createRef<any>();
  const [open, setOpen] = useState(false);
  const [config, setConfig] = useState<OpenModalProps | null>(null);

  m = (params: OpenModalProps) => {
    setConfig(params);
    setOpen(true);
  };

  const okFn = async () => {
    let c, data, datac;
    if (config?.ok) {
      if (config?.form) {
        data = await form.current.validate();
        datac = !!data;
      }
      c = (data || !config?.form) && config.ok(data);
    }
    if (c !== false && datac !== false) {
      setOpen(false);
    }
  };

  const closeFn = () => {
    if (config?.close) {
      config.close();
    }
    setOpen(false);
  };

  return (
    <AntdModal
      {...(config?.antd || {})}
      title={config?.title}
      centered
      destroyOnClose
      maskClosable={false}
      open={open}
      onOk={okFn}
      onCancel={closeFn}
      okText={config?.okText || "确定"}
      width={config?.width || 800}
    >
      {config?.content}
      {config?.form && <Form {...config.form} _ref={form} />}
    </AntdModal>
  );
}

export interface OpenModalProps {
  title?: React.ReactNode;
  width?: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ok?: (data?: any) => void | boolean | Promise<void | boolean>;
  close?: () => void;
  content?: JSX.Element;
  form?: FormProps;
  okText?: string;
  antd?: ModalProps;
}

// eslint-disable-next-line react-refresh/only-export-components
export const openM = (params: OpenModalProps) => {
  if (m) {
    m(params);
  }
};
