import { Divider, Dropdown, Layout, MenuProps, theme } from "antd";
import { UserOutlined } from "@ant-design/icons";
import React from "react";
import { openModal } from "../utils";

const { Header: AntdHeader } = Layout;

export default function Header() {
  const {
    token: {
      colorBgContainer,
      colorBgElevated,
      borderRadiusLG,
      boxShadowSecondary,
    },
  } = theme.useToken();

  const contentStyle: React.CSSProperties = {
    backgroundColor: colorBgElevated,
    borderRadius: borderRadiusLG,
    boxShadow: boxShadowSecondary,
  };

  const menuStyle: React.CSSProperties = {
    boxShadow: "none",
  };

  const items: MenuProps["items"] = [
    {
      key: "1",
      label: (
        <a target="_blank" rel="noopener noreferrer">
          登陆
        </a>
      ),
    },
  ];

  const about = () => {
    openModal({
      title: "关于",
      width: 400,
      antd: { footer: null },
      content: (
        <div>
          <p>author：iKurum</p>
          <p>
            github：
            <a
              target="_blank"
              rel="noopener noreferrer"
              href="https://github.com/iKurum/paysheet"
            >
              https://github.com/iKurum/paysheet
            </a>
          </p>
        </div>
      ),
    });
  };

  return (
    <AntdHeader
      style={{
        padding: "0 12px",
        textAlign: "right",
        background: colorBgContainer,
      }}
    >
      <Dropdown
        destroyPopupOnHide
        menu={{ items }}
        placement="bottomRight"
        arrow={{ pointAtCenter: true }}
        dropdownRender={(menu) => {
          return (
            <div style={contentStyle}>
              {React.cloneElement(menu as React.ReactElement, {
                style: menuStyle,
              })}
              <Divider style={{ margin: 0 }} />
              <div
                style={{
                  padding: "var(--ant-padding-xxs)",
                }}
              >
                <span
                  className="dropdown-menu-item"
                  style={{
                    display: "block",
                    textAlign: "center",
                    padding:
                      "var(--ant-dropdown-padding-block) var(--ant-control-padding-horizontal)",
                  }}
                >
                  <a
                    style={{
                      color: "inherit",
                      transition: "all var(--ant-motion-duration-mid)",
                    }}
                    onClick={about}
                  >
                    关于网站
                  </a>
                </span>
              </div>
            </div>
          );
        }}
      >
        <UserOutlined style={{ fontSize: "20px" }} />
      </Dropdown>
    </AntdHeader>
  );
}
