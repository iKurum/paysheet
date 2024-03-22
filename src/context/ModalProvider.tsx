import React, { createContext, useState } from "react";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const ModalContext = createContext<{ form: any; setForm: any }>({
  form: null,
  setForm: null,
});

export default function ModalProvider(props: { children: React.ReactNode }) {
  const [form, setForm] =
    useState<() => Promise<{ [x: string]: never } | boolean>>();
  return (
    <ModalContext.Provider value={{ form, setForm }}>
      {props.children}
    </ModalContext.Provider>
  );
}
