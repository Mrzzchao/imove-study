#!/usr/bin/env node
const path = require('path');
const cmds = require('./src/cmd');
const program = require('commander');
const getConfig = require('./src/utils/getConfig');
const pkg = require(path.join(__dirname, './package.json'));

// https://github.com/tj/commander.js/blob/HEAD/Readme_zh-CN.md
// 设置选项，之后终端调用相应命令后，program[cmd]就会返回true
program
  .version(pkg.version)
  .option('-d, --dev', '本地开发')
  .option('-i, --init', '初始化配置文件')
  .parse(process.argv);

Object.keys(cmds).forEach((cmd) => {
  const CmdCtor = cmds[cmd];
  if(program[cmd]) {
    // 用imove.config.js和默认配置合并后的配置进行指令初始化
    // 配置包括项目名称，导出路径等
    const cmdInst = new CmdCtor({config: getConfig()});

    cmdInst.run();
  }
});
