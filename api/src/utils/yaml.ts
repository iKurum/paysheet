import { Logger } from '@nestjs/common';
import * as yaml from 'js-yaml';
import * as fs from 'node:fs';

export const manifest_fn = (data: string[]) => {
  const tobj = get_manifest();
  data.forEach((item) => {
    const [date, key] = item.replace(/\.json/g, '').split('_');
    if (!tobj[key]) {
      tobj[key] = [];
    }
    if (!tobj[key].includes(date)) {
      tobj[key].push(date);
    }
  });

  Object.values(tobj).forEach((item) => {
    item.sort((a, b) => {
      const a_date = new Date(a);
      const b_date = new Date(b);
      return a_date.getTime() - b_date.getTime();
    });
  });

  write_manifest(tobj);
};

export const get_manifest = (): { [x: string]: string[] } => {
  let manifest: string = '';
  try {
    manifest = fs.readFileSync('./email/manifest.yaml', 'utf8');
  } catch (e) {
    fs.writeFileSync('./email/manifest.yaml', '');
    get_manifest();
  }
  return (yaml.load(manifest) || {}) as any;
};

export const get_yaml = (key: string) => {
  const data = get_manifest();
  return data[key] || [];
};

const write_manifest = (data: any) => {
  Logger.log('更新 manifest');
  fs.writeFileSync('./email/manifest.yaml', yaml.dump(data), 'utf8');
};
