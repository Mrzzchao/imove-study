import React, { useState, useEffect, useRef } from 'react';

import 'antd/es/collapse/style';
import styles from './index.module.less';

import { Collapse } from 'antd';
import { Addon, Events, Graph, Node } from '@antv/x6';
import previewCellSchemaMap from '../../common/previewCell';

// 拖拽组件 https://x6.antv.vision/zh/docs/tutorial/basic/dnd
// 后面可以考虑用Stencil来改造。增加多节点分组模式
const { Dnd } = Addon;
const { Panel } = Collapse;
const CELL_SIZE = 80;
const CELL_SCALE = 0.7;

// 组件配置
const GENERAL_GROUP = {
  key: 'general',
  name: '通用元件',
  cells: ['imove-start-preview', 'imove-branch-preview', 'imove-behavior-preview'],
};

// 自定义组件配置
const CUSTOM_GROUP = {
  key: 'custom',
  name: '自定义元件',
  cells: ['imove-start-preview', 'imove-branch-preview', 'imove-behavior-preview'],
};


const SHAPE_REFLECT_MAP: { [key: string]: string } = {
  'imove-start-preview': 'imove-start',
  'imove-branch-preview': 'imove-branch',
  'imove-behavior-preview': 'imove-behavior',
};

interface IGroupItem {
  key: string;
  name: string;
  cells: string[];
}

interface ISideBarProps {
  flowChart: Graph;
}

const SideBar: React.FC<ISideBarProps> = (props) => {
  const { flowChart } = props;
  const [dnd, setDnd] = useState<Addon.Dnd>();
  const [groups, setGroups] = useState<IGroupItem[]>([]);

  // life
  useEffect(() => {
    // TODO: fetch to get custom group data
    setGroups([GENERAL_GROUP, CUSTOM_GROUP]);
    // 目标画布设置为流程图编辑组件
    setDnd(new Dnd({ target: flowChart, scaled: true }));
  }, []);

  return (
    <div className={styles.container}>
      {dnd && (
        <Collapse className={styles.collapse} defaultActiveKey={['general', 'custom']}>
          {groups.map((group) => (
            <Panel key={group.key} header={group.name}>
              <PanelContent dnd={dnd} cells={group.cells} />
            </Panel>
          ))}
        </Collapse>
      )}
    </div>
  );
};

interface IPanelContentProps {
  dnd: Addon.Dnd;
  cells: string[];
}

const PanelContent: React.FC<IPanelContentProps> = (props) => {
  const { dnd, cells } = props;
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (ref.current) {
      /**
       * 画布初始化
       * 左边侧边栏的折叠框就是一个画布
       * https://x6.antv.vision/zh/docs/api/graph/graph
       */
      const graph = new Graph({
        container: ref.current,
        width: ref.current.offsetWidth,
        height: Math.ceil(cells.length / 3) * CELL_SIZE * CELL_SCALE,
        interacting: false,
        preventDefaultBlankAction: false,
      });


      cells.forEach((cell: any, index: number) => {
        const rowIdx = Math.floor(index / 3);
        const colIdx = index % 3;
        const { top } = previewCellSchemaMap[cell] || {};
        debugger
        // 渲染节点
        graph.addNode({
          shape: cell,
          x: colIdx * (CELL_SIZE + 16 / CELL_SCALE),
          y: rowIdx * (CELL_SIZE + 16 / CELL_SCALE) + top,
        });
      });
      graph.scale(CELL_SCALE, CELL_SCALE);

      // 监控鼠标点击事件，如果点击了，新建一个元件，开始拖拽
      graph.on('cell:mousedown', (args: Events.EventArgs['cell:mousedown']) => {
        debugger
        const { node, e } = args;
        let newNode = node;
        if (SHAPE_REFLECT_MAP[node.shape]) {
          // 新建一个节点
          newNode = Node.create({ shape: SHAPE_REFLECT_MAP[node.shape] });
        }

        // 开始拖拽新节点
        dnd.start(newNode, e);
      });
    }
  }, []);
  return <div className={styles.chart} ref={ref} />;
};

export default SideBar;
