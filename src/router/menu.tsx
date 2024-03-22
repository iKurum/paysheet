import { MenuProps } from "antd";
import {
  DesktopOutlined,
  PieChartOutlined,
  ClusterOutlined,
  ContactsOutlined,
  SolutionOutlined,
  AccountBookOutlined,
} from "@ant-design/icons";

type MenuItem = Required<MenuProps>["items"][number];

function getItem(
  label: React.ReactNode,
  key: React.Key,
  icon?: React.ReactNode,
  children?: MenuItem[]
): MenuItem {
  return {
    key,
    icon,
    children,
    label,
  } as MenuItem;
}

export default [
  getItem("首页", "home", <PieChartOutlined />),
  getItem("考勤", "attendance", <SolutionOutlined />),
  getItem("资表", "paysheet", <AccountBookOutlined />),
  getItem("信息总览", "all", <DesktopOutlined />, [
    getItem("项目", "projects", <ClusterOutlined />),
    getItem("人员", "users", <ContactsOutlined />),
  ]),
];
