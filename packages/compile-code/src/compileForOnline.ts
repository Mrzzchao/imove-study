import {Cell} from '@antv/x6';
import makeCode from './template/runOnline';
import simplifyDSL from './simplifyDSL';

interface DSL {
  cells: Cell.Properties[];
}

/**
 * Solution
 * 
 * 1. find the source node form dsl, and if it is not imove-start,
 * then insert a vitural imove-start at first.
 * 
 * 2. transform node funciton, follows should be noted:
 *    - import statement should be replaced with import('packge/from/network')
 *    - export statement should be replace with return function
 *    - each node function should be wrapped within a new function to avoid duplicate declaration global variable
 * 
 * 3. assemble Logic, Context, simplyfied dsl and nodeFns map into one file
 * 
 */

const INSERT_DSL_COMMENT = '// define dsl here';
const INSERT_NODE_FNS_COMMENT = '// define nodeFns here';
const importRegex = /import\s+([\s\S]*?)\s+from\s+(?:('[@\.\/\-\w]+')|("[@\.\/\-\w]+"))\s*;?/mg;
const virtualSourceNode = {
  id: 'virtual-imove-start',
  shape: 'imove-start',
  data: {
    trigger: 'virtual-imove-start',
    configData: {},
    code: 'export default async function(ctx) {\n  \n}'
  }
};

const findStartNode = (dsl: DSL): Cell.Properties => {

  const nodes = dsl.cells.filter(cell => cell.shape !== 'edge');
  const edges = dsl.cells.filter(cell => cell.shape === 'edge');

  if(nodes.length === 0) {
    throw new Error('Compile failed, no node is selected');
  }

  let foundEdge = null;
  let startNode = nodes[0];
  while(foundEdge = edges.find(edge => edge.target.cell === startNode.id)) {
    const newSourceId = foundEdge.source.cell;
    startNode = nodes.find(node => node.id === newSourceId) as Cell.Properties;
  }

  if(startNode.shape !== 'imove-start') {
    dsl.cells.push(
      virtualSourceNode,
      {
        shape: "edge",
        source: {
          cell: 'virtual-imove-start',
        },
        target: {
          cell: startNode.id
        }
      }
    );
    startNode = virtualSourceNode;
  }

  return startNode;
};

const getNextNode = (curNode: Cell.Properties, dsl: DSL) => {

  const nodes = dsl.cells.filter(cell => cell.shape !== 'edge');
  const edges = dsl.cells.filter(cell => cell.shape === 'edge');

  // 找到以当前节点为起始链接的边
  const foundEdge = edges.find(edge => edge.source.cell === curNode.id);
  if(foundEdge) {
    // 找到链接的下一个节点
    return nodes.find(node => node.id === foundEdge.target.cell);
  }
  return curNode
};

// 编译简化DSL成code
const compileSimplifiedDSL = (dsl: DSL): string => {
  const simplyfiedDSL = JSON.stringify(simplifyDSL(dsl), null, 2);
  return `const dsl = ${simplyfiedDSL};`;
};

/**
 * 1. 通过正则替换，将import引入的包替换成在线的https://jspm.dev/的版本
 * 2. 将export default 的导出代码替换成 return
 * 3. 将节点代码包裹一层async await逻辑，返回（为了解决所有异步情况）
 * @param node 节点
 * @returns 
 */
const compileNodeFn = (node: Cell.Properties): string => {
  const {data: {label, code}} = node;
  const newCode = code.replace(importRegex, (match: string, p1: string, p2: string, p3: string) => {
    const pkgName = (p2 || p3).replace(/('|")/g, '');
    return `const ${p1} = (await import('https://jspm.dev/${pkgName}')).default;`;
  }).replace(/export\s+default/, 'return');

  return `await (async function() {
    ${newCode}
  }())`;
};

/**
 * 1. 获取所有节点
 * 2. 循环编译节点代码
 * 3. 将编辑的节点代码组装进nodeFns map里
 * @param dsl dsl配置
 * @returns 
 */
const compileNodeFnsMap = (dsl: DSL): string => {
  const nodes = dsl.cells.filter(cell => cell.shape !== 'edge');
  const kvs = nodes.map(node => {
    const {id} = node;
    return `'${id}': ${compileNodeFn(node)}`;
  });

  return `const nodeFns = {\n  ${kvs.join(',\n  ')}\n}`;
};

/**
 * 1. 找到起始节点。如果没有用虚拟起始节点
 * 2. 获取起始节点的下一个节点
 * 3. 通过调用编译简单DSL、编译节点代码方法，生成区块代码，再通过预设的插槽，正则替换掉
 * 4. 正则替换掉触发事件代码
 * @param dsl DSL配置
 * @param mockInput mock 数据
 * @returns 
 */
const compile = (dsl: DSL, mockInput: any): string => {
  debugger
  const startNode = findStartNode(dsl);
  const mockNode = getNextNode(startNode, dsl);
  return makeCode(mockNode, mockInput)
    .replace(INSERT_DSL_COMMENT, compileSimplifiedDSL(dsl))
    .replace(INSERT_NODE_FNS_COMMENT, compileNodeFnsMap(dsl))
    .replace('$TRIGGER$', startNode.data.trigger);
};

export default compile;
