import React, { useMemo } from "react";
import { notification } from "antd";
import { ArgsProps } from "antd/es/notification";

const Context = React.createContext({ name: "Default" });

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let n: any;
export default function Notification({
  children,
}: {
  children?: React.ReactNode;
}) {
  const [api, contextHolder] = notification.useNotification();

  const contextValue = useMemo(() => ({ name: "Ant Design" }), []);

  n = (params: ArgsProps) => {
    api[params.type || "info"]({
      ...params,
      placement: "topRight",
    });
  };

  return (
    <Context.Provider value={contextValue}>
      {contextHolder}
      {children}
    </Context.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export const openN = (placement: ArgsProps) => {
  if (n) {
    n(placement);
  }
};
