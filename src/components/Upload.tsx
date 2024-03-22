/* eslint-disable @typescript-eslint/no-explicit-any */
import { InboxOutlined } from "@ant-design/icons";
import type { UploadFile, UploadProps as AntdUploadProps } from "antd";
import { message, Upload as AntdUpload, Input } from "antd";
import { useState } from "react";
import { parsingExcel } from "../utils/excel";

const { Dragger } = AntdUpload;

export default function Upload({ onloadFile, mapping }: UploadProps) {
  const [area, setArea] = useState("");
  const [fileList, setFileList] = useState<UploadFile[]>([]);

  let areaStr: string = "";

  const props: AntdUploadProps = {
    fileList,
    name: "file",
    accept: ".xls,.xlsx",
    multiple: false,
    onChange(info) {
      if (info.fileList.length) {
        let _tb = false;

        let newFileList = [info.file];
        newFileList = newFileList.map((file: any) => {
          file._name = file._name || file.name;
          file._type = file._name.split(".").pop();
          if (file._type === "xls" || file._type === "xlsx") {
            _tb = true;
          }
          if (file.response) {
            file.url = file.response.url;
          }
          return file;
        });

        if (_tb) {
          _setArea(`获取文件：${info.file.name}`);
          setFileList(newFileList);
          loadFile(newFileList[0] as any);
        } else {
          message.error("请上传正确的文件格式");
        }
      }
    },
    onRemove: (file: any) => {
      setFileList([]);
      _setArea(`删除文件：${file._name}`, true);
    },
    beforeUpload: () => {
      return false;
    },
  };

  const loadFile = async (file: File) => {
    let res = (await parsingExcel(file)) as any[];
    _setArea(`获取数据${res.length}条`);

    if (mapping) {
      res = res.map((item: any) => {
        const obj: any = {};
        Object.keys(mapping).forEach((key: string) => {
          if (typeof mapping[key] === "string") {
            const _v: string = item[key] || item[`${key}*`] || "";
            obj[mapping[key] as string] = _v.trim() + "";
          }
        });
        return obj;
      });
    }

    typeof onloadFile === "function" && onloadFile(res, _setArea);
  };

  const _setArea = (str: string, clear?: boolean) => {
    areaStr += str + "\r\n";
    if (clear) {
      areaStr = "";
    }
    setArea(areaStr);
  };

  return (
    <div>
      <Dragger {...props}>
        <p className="ant-upload-drag-icon">
          <InboxOutlined />
        </p>
        <p className="ant-upload-text">点击或拖拽文件到此区域上传</p>
      </Dragger>
      <br />
      <Input.TextArea
        autoSize={{ minRows: 6 }}
        disabled
        value={area}
        placeholder="请上传文件"
        style={{
          color: "#000",
          cursor: "default",
        }}
      />
    </div>
  );
}

interface UploadProps {
  onloadFile?: (
    res: any[],
    setArea: (str: string, clear?: boolean) => void
  ) => void;
  mapping?: { [x: string]: string | [string, string] };
}
