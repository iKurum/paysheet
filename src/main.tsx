import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import { ConfigProvider } from "antd";
import zhCN from "antd/locale/zh_CN";
import { BrowserRouter } from "react-router-dom";
import dayjs from "dayjs";
import "dayjs/locale/zh-cn";

dayjs.locale('zh-cn') // 使用本地化语言

ReactDOM.createRoot(document.getElementById("root")!).render(
  <ConfigProvider
    locale={zhCN}
    theme={{
      cssVar: true,
      hashed: false,
      components: {
        Layout: {
          colorPrimary: "#fff",
          algorithm: true, // 启用算法
        },
      },
    }}
  >
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </ConfigProvider>
);
