const path = require('path');
const fs = require('fs-extra');

const builtinDependencies = {
  eventemitter3: '^4.0.7',
};

const extractDep = (dsl) => {
  const mergedDependencies = {};
  const { cells = [] } = dsl;
  cells
    .filter((cell) => cell.shape !== 'edge')
    .forEach((cell) => {
      const { dependencies } = cell.data || {};
      try {
        const json = JSON.parse(dependencies);
        Object.keys(json).forEach((key) => (mergedDependencies[key] = json[key]));
      } catch (error) {
        console.log('extract dependencies failed, the error is:', error.message);
      }
    });
  return mergedDependencies;
};

const setup = async (dsl, projectRootPath) => {
  // 拿到项目package.json
  const pkgPath = path.join(projectRootPath, './package.json');
  const pkgFile = await fs.readFile(pkgPath);
  const pkgJson = JSON.parse(pkgFile);

  // 拿到流程图依赖
  const dslDependencies = extractDep(dsl);

  // 注入合并依赖
  if (!pkgJson.dependencies) {
    pkgJson.dependencies = dslDependencies;
  } else {
    Object.keys(dslDependencies).forEach((key) => {
      pkgJson.dependencies[key] = dslDependencies[key];
    });
    Object.keys(builtinDependencies).forEach((key) => {
      pkgJson.dependencies[key] = builtinDependencies[key];
    });
  }

  // 写入文件
  await fs.writeFile(pkgPath, JSON.stringify(pkgJson, null, 2));
};

module.exports = setup;
