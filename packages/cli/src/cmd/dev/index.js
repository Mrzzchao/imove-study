const path = require('path');
const fs = require('fs-extra');
const Base = require('../base');
const mergePkg = require('./mergePkg');
const { compileForProject } = require('@imove/compile-code');
const { createServer } = require('../../utils/server');

const noop = () => {};
const CACHE_PATH = path.join(process.cwd(), './.cache');
const CACHE_DSL_FILE = path.join(CACHE_PATH, 'imove.dsl.json');

class Dev extends Base {

  async writeOutputIntoFiles(curPath, output) {
    for(let key in output) {
      const newPath = path.join(curPath, key);
      if(path.extname(newPath)) {
        await fs.writeFile(newPath, output[key]);
      } else {
        await fs.ensureDir(newPath);
        await this.writeOutputIntoFiles(newPath, output[key]);
      }
    }
  }

  // 保存配置成本地代码
  async save(req, res) {
    const { outputPath, plugins = [] } = this.config;

    // 检查目录存在
    await fs.ensureDir(outputPath);

    // 检查dsl是否存在
    if (!req.body || !req.body.dsl) {
      res.status(500).json({ isCompiled: false }).end();
      return;
    }

    // 编译
    try {
      const { dsl } = req.body;
      const output = compileForProject(dsl, plugins);
      await this.writeOutputIntoFiles(outputPath, output);

      // dsl依赖合并进项目依赖
      await mergePkg(dsl, this.projectPath);

      // 缓存当前DSL成文件
      await fs.outputFile(CACHE_DSL_FILE, JSON.stringify(dsl, null, 2));

      // 响应接口
      res.status(200).json({ isCompiled: true }).end();
      console.log('compile successfully!');
    } catch (err) {
      res.status(500).json({ isCompiled: false }).end();
      console.log('compile failed! the error is:', err);
    }
  }

  // 链接后读取缓存
  async connect(req, res) {
    const { projectName } = this.config;

    // 读取缓存
    const dsl = await fs.readJson(CACHE_DSL_FILE).catch(noop);

    // 响应
    res.status(200).json({ projectName, dsl }).end();
  }

  run() {
    // 建立一个http服务
    const app = createServer();

    // 保存接口
    app.post('/api/save', this.save.bind(this));

    // 链接接口
    app.get('/api/connect', this.connect.bind(this));
  }
}

module.exports = Dev;
