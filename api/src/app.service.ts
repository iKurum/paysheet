import { Injectable } from '@nestjs/common';
import { Request } from 'express';
import { run_cmd, verify_signature } from './utils';

@Injectable()
export class AppService {
  getHello(): string {
    return 'api.ikurum.cn';
  }

  postGithub(request: Request): unknown {
    const {
      repository: { owner, ...rep },
      ...rest
    } = request.body;
    const event = request.headers['x-github-event']; //输出为：事件名称(push)

    if (event === 'push' && verify_signature(request)) {
      run_cmd('sh', ['./github.sh'], function (res) {
        console.log(res); // res返回的是shell命令操作后在命令行终端显示的字符串，这里是一些git操作的提示
      });
    }

    const result = {
      id: rep.id,
      node_id: rep.node_id,
      name: rep.name,
      full_name: rep.full_name,
      description: rep.description,
      url: rep.url,
      private: false,
      ...rest,
      owner,
    };

    return result;
  }
}