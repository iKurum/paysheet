/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Dayjs } from "dayjs";
import type { CalendarProps as AntdCalendarProps } from "antd";
import {
  Calendar as AntdCalendar,
  Col,
  ConfigProvider,
  Popover,
  Row,
  Timeline,
  Typography,
} from "antd";
import dayjs from "dayjs";

export default function Calendar(params: CalendarProps) {
  const getListData = (value: Dayjs) => {
    const year = value.year();
    const month = (value.month() + 1 + "").padStart(2, "0");
    const date = (value.date() + "").padStart(2, "0");
    const key = `${year}-${month}-${date}`;
    const item = (params.data ??= {})[key];

    const _obj: any = {};
    (item || []).forEach(({ time, type }: any) => {
      if (_obj[type]) {
        switch (type) {
          case "进场":
            if (_obj[type] > time) {
              _obj[type] = time;
            }
            break;
          case "出场":
            if (_obj[type] < time) {
              _obj[type] = time;
            }
            break;
        }
      } else {
        _obj[type] = time;
      }
    });

    return {
      listData: Object.keys(_obj).map((key) => ({
        type: key,
        time: _obj[key],
      })),
      itemData: item,
    };
  };

  const dateCellRender = (value: Dayjs) => {
    const { listData, itemData } = getListData(value);

    if (params.content) {
      return params.content(listData, itemData);
    }
    return calenderContent(listData, itemData);
  };

  const cellRender: AntdCalendarProps<Dayjs>["cellRender"] = (
    current,
    info
  ) => {
    if (info.type === "date") return dateCellRender(current);
    return info.originNode;
  };

  const headerRender = () => {
    return <></>;
  };

  const disabledDate = (currentDate: Dayjs) => {
    return (
      dayjs(params.date).month() !== currentDate.month() ||
      (dayjs(params.date).month() === dayjs().month() &&
        dayjs().date() < currentDate.date())
    );
  };

  return (
    <AntdCalendar
      value={params.date ?? dayjs()}
      cellRender={cellRender}
      headerRender={headerRender}
      disabledDate={disabledDate}
    />
  );
}

export type Timobj = { date: string; time: string; type: string };

export interface CalendarProps extends AntdCalendarProps<Dayjs> {
  data?: { [date: string]: Timobj[] };
  date?: Dayjs;
  content?: (
    listData: { time: string; type: string }[],
    itemData: Timobj[]
  ) => React.ReactNode;
}

const { Text } = Typography;

// eslint-disable-next-line react-refresh/only-export-components
export const calenderContent = (
  listData: { time: string; type: string }[],
  itemData: Timobj[]
) => {
  return listData.length ? (
    <ConfigProvider
      theme={{
        components: {
          Popover: {
            titleMinWidth: 140,
          },
        },
      }}
    >
      <Popover
        title={"打卡时间 " + itemData[0].date}
        content={
          <div
            style={{
              padding: '10px 0',
              maxHeight: 200,
              overflowX: "hidden",
              overflowY: "auto",
            }}
          >
            <Timeline
              mode="left"
              items={itemData.map(({ time, type }) => ({
                label: time,
                children: type,
              }))}
            />
          </div>
        }
      >
        <Row style={{ height: "100%", position: "relative" }}>
          {listData.map((d) => (
            <Col
              key={d.time}
              span={24}
              style={{
                position: "absolute",
                height: "calc(50% - 2px)",
                width: "100%",
                top: d.type === "进场" ? 0 : "calc(50% + 2px)",
                backgroundColor: "rgba(0, 128, 0, 0.2)",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  color: "var(--ant-color-text-description)",
                  transform: "scale(0.8)",
                  textAlign: "left",
                  position: "absolute",
                }}
              >
                {d.type}
              </div>
              <Text
                style={{
                  display: "block",
                  marginTop: "18px",
                }}
              >
                {d.time}
              </Text>
            </Col>
          ))}
        </Row>
      </Popover>
    </ConfigProvider>
  ) : (
    <></>
  );
};
