import { Drawer as AntdDrawer, DrawerProps as AntdDrawerProps } from "antd";
import { useState } from "react";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let d: any;
export default function _Drawer() {
  const [open, setOpen] = useState(false);
  const [config, setConfig] = useState<DrawerProps | null>(null);

  d = (params: DrawerProps) => {
    params = {
      width: 600,
      ...params,
      onClose: () => setOpen(false),
    };

    setConfig(params);
    setOpen(true);
  };

  return (
    <AntdDrawer {...config} open={open} destroyOnClose>
      {config?.content}
    </AntdDrawer>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export const openD = (params: DrawerProps) => {
  if (d) {
    d(params);
  }
};

export interface DrawerProps extends AntdDrawerProps {
  title?: string;
  onClose?: () => void;
  content?: React.ReactNode;
}
