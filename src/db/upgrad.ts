export const upgrad: { [x: string]: UpgradProps } = {
  project: {
    key: "pid",
    field: [
      {
        name: "name",
        key: "name",
      },
      {
        name: "default",
        key: "default",
      },
    ],
  },
  user: {
    key: "uid",
    field: [
      {
        name: "name",
        key: "name",
      },
      {
        name: "idcard",
        key: "idcard",
      },
    ],
  },
  attendance: {
    key: "aid",
    field: [
      {
        name: "name",
        key: "name",
      },
      {
        name: "project",
        key: "project",
      },
      {
        name: "nameANDproject",
        key: ["name", "project"],
      },
      {
        name: "nameANDtime",
        key: ["name", "time"],
      },
      {
        name: "projectANDtime",
        key: ["project", "time"],
      },
      {
        name: "nameANDprojectANDtime",
        key: ["name", "project", "time"],
      },
    ],
  },
  pay: {
    key: "id",
    field: [
      {
        name: "name",
        key: "name",
      },
      {
        name: "idcard",
        key: "idcard",
      },
      {
        name: "project",
        key: "project",
      },
      {
        name: "date",
        key: "date",
      },
      {
        name: "nameANDprojectANDdate",
        key: ["name", "project", "date"],
      },
      {
        name: "nameANDproject",
        key: ["name", "project"],
      },
      {
        name: "nameANDdate",
        key: ["name", "date"],
      },
      {
        name: "projectANDdate",
        key: ["project", "date"],
      },
    ],
  },
};

interface UpgradProps {
  key: string;
  field?: { name: string; key: string | string[] }[];
}
