import { Graph } from '@antv/x6';
import merge from 'lodash.merge';
import { parseQuery } from '../../utils';
import { modifyGraph, ActionType, IModifyGraphAction } from '../../api';

const { projectId } = parseQuery();
const memQueue: IModifyGraphAction[] = [];

const validate = (type: string, data: any) => {
  if (type === 'node') {
    return true;
  } else if (type === 'edge') {
    const { source, target } = data;
    return source.cell && target.cell;
  } else {
    return false;
  }
};

/**
 * 将传入的节点缓存进缓存队列
 * 1. 按基类类型、操作类型、节点数据进行缓存
 * @param cellType 基类类型 点边
 * @param actionType 操作类型 创建 新增 删除
 * @param data 传输数据
 * @returns 
 */
const enqueue = (cellType: string, actionType: ActionType, data: any) => {
  // 验证是否是点、或者是链接上点的边
  if (!validate(cellType, data)) {
    return;
  }

  // 在缓存队列中找到匹配基类类型、操作类型、节点也匹配的元素索引
  const foundIndex = memQueue.findIndex((item) => (
    item.type === cellType &&
    item.actionType === actionType &&
    item.data.id === data.id
  ));

  // 如果匹配 删除匹配元素 和入队的数据合并 目的就是为了去重
  if (foundIndex > -1) {
    const deleted = memQueue.splice(foundIndex, 1)[0];
    merge(deleted.data, data);
  }

  // 推入节点
  memQueue.push({ type: cellType, actionType, data });
};

let modifyActionTimer: number = -1;

/**
 * 保存节点数据
 * 1. 
 * @param flowChart 流程图实例
 * @param cellType 基类类型 点 边
 * @param actionType 操作类型
 * @param data 数据
 */
const save = (flowChart: Graph, cellType: string, actionType: ActionType, data: any) => {
  enqueue(cellType, actionType, data);
  clearTimeout(modifyActionTimer);
  modifyActionTimer = window.setTimeout(() => {
    const pushedActions = memQueue.slice(0);
    if (pushedActions.length > 0) {
      flowChart.trigger('graph:change:modify');
      modifyGraph(projectId, memQueue)
        .then((res) => {
          memQueue.splice(0, pushedActions.length);
          flowChart.trigger('graph:modified', { success: true });
        })
        .catch((error) => {
          flowChart.trigger('graph:modified', { success: true, error: error });
        });
    }
  }, 100);
};

type ActionEventMap = { [key: string]: string[] };
const nodeActionEventMap: ActionEventMap = {
  [ActionType.create]: ['node:added'],
  [ActionType.remove]: ['node:removed'],
  [ActionType.update]: [
    'node:moved',
    'node:resized',
    'node:rotated',
    'node:change:ports',
    'node:change:attrs',
    'node:change:data',
    'node:change:zIndex',
  ],
};

const edgeActionEventMap: ActionEventMap = {
  [ActionType.create]: ['edge:connected'],
  [ActionType.remove]: ['edge:removed'],
  [ActionType.update]: ['edge:moved'],
};

export const registerServerStorage = (flowChart: Graph) => {
  // 对每一个事件点分别监听，触发时调用保存函数，缓存事件节点
  Object.keys(nodeActionEventMap).forEach((actionType) => {
    const events = nodeActionEventMap[actionType];

    events.forEach((event) => {
      flowChart.on(event, (args: any) => {
        save(flowChart, 'node', actionType as ActionType, args.node.toJSON());
      });
    });
  });

  // 对每一个边事件分别监听，触发时调用保存函数，缓存事件边
  Object.keys(edgeActionEventMap).forEach((actionType) => {
    const events = edgeActionEventMap[actionType];
    events.forEach((event) => {
      flowChart.on(event, (args: any) => {
        console.log('edge event:', event, 'args:', args);
        save(flowChart, 'edge', actionType as ActionType, args.edge.toJSON());
      });
    });
  });
};
