
const INSERT_IMPORT_PLUGINS_COMMENT = '// import plugins here';
const INSERT_USE_PLUGINS_COMMENT = '// use plugins here';

const addPlugins = (originalCode: string = '', plugins: string[] = []): string => {
  const modifiedContent: string = originalCode
    // 替换导入逻辑插槽
    .replace(new RegExp(INSERT_IMPORT_PLUGINS_COMMENT), () => {
      return plugins.map((plugin, index) => `import plugin${index} from '${plugin}';`).join('\n');
    })
    // 替换使用逻辑插槽
    .replace(new RegExp(INSERT_USE_PLUGINS_COMMENT), () => {
      return plugins.map((_, index) => `logic.use(plugin${index});`).join('\n');
    });
  return modifiedContent;
};

export default addPlugins;
