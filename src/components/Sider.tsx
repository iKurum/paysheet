import { Layout, Menu } from "antd";
import { useLocation, useNavigate } from "react-router-dom";
import menu from "../router/menu";

const { Sider: AntdSider } = Layout;

export default function Sider() {
  const navigate = useNavigate();
  const location = useLocation();

  const onSelect = (keyPath: string[]) => {
    navigate(keyPath.shift() || "/");
  };

  return (
    <AntdSider>
      <Menu
        theme="light"
        defaultSelectedKeys={[location.pathname?.slice(1) || "home"]}
        mode="inline"
        items={menu}
        onSelect={({ keyPath }) => onSelect(keyPath)}
      />
    </AntdSider>
  );
}
