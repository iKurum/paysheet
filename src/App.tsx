import "./App.less";
import { FloatButton, Layout, theme } from "antd";
import { useRoutes } from "react-router-dom";
import Sider from "./components/Sider";
import router from "./router";
import Modal from "./components/Modal";
import { useRef } from "react";
import Drawer from "./components/Drawer";
import Notification from "./components/Notification";
import Header from "./components/Header";

const { Content } = Layout;

export default function App() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const main = useRef<any>();
  const {
    token: { colorBgContainer },
  } = theme.useToken();

  return (
    <Notification>
      <Layout style={{ minHeight: "100vh" }}>
        <Header></Header>
        <Layout>
          <Sider></Sider>
          <Content
            ref={main}
            style={{
              height: "calc(100vh - 60px)",
              padding: "16px",
              overflowX: "hidden",
              overflowY: "auto",
            }}
          >
            <div
              style={{
                padding: "16px",
                background: colorBgContainer,
                borderRadius: 20,
              }}
            >
              {useRoutes(router)}
            </div>
            <FloatButton.BackTop
              target={() => main.current}
              visibilityHeight={200}
            />
          </Content>
        </Layout>
        <Modal></Modal>
        <Drawer></Drawer>
      </Layout>
    </Notification>
  );
}
