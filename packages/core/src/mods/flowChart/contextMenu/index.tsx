import React, {
  useRef,
  useCallback
} from 'react';

import styles from '../index.module.less';

import { Menu } from 'antd';
import { Graph } from '@antv/x6';
import useClickAway from '../../../hooks/useClickAway';
import { nodeMenuConfig, blankMenuConfig } from './menuConfig';

interface IProps {
  x: number;
  y: number;
  scene: string;
  visible: boolean;
  flowChart: Graph;
}

interface IMenuConfig {
  key: string;
  title: string;
  icon?: React.ReactElement;
  children?: IMenuConfig[];
  showDividerBehind?: boolean;
  disabled?: boolean | ((flowChart: Graph) => boolean);
  handler: (flowChart: Graph) => void;
}

const menuConfigMap: { [scene: string]: IMenuConfig[] } = {
  node: nodeMenuConfig,
  blank: blankMenuConfig
};

const FlowChartContextMenu: React.FC<IProps> = props => {
  const menuRef = useRef(null);
  const { x, y, scene, visible, flowChart } = props;
  const menuConfig = menuConfigMap[scene];

  useClickAway(() => onClickAway(), menuRef);

  // 监听点击菜单外事件 触发关闭右菜单
  const onClickAway = useCallback(() => flowChart.trigger('graph:hideContextMenu'), [flowChart]);
  
  // 执行菜单项
  const onClickMenu = useCallback(({ key }) => {
    // 获取执行器map
    const handlerMap = Helper.makeMenuHandlerMap(menuConfig);

    // 如果执行器存在，关闭右键菜单，执行
    const handler = handlerMap[key];
    if (handler) {
      onClickAway();
      handler(flowChart);
    }
  }, [flowChart, menuConfig]);

  return !visible ? null : (
    <div
      ref={menuRef}
      className={styles.contextMenu}
      style={{ left: x, top: y }}
    >
      <Menu
        mode={'vertical'}
        selectable={false}
        onClick={onClickMenu}
      >
        {Helper.makeMenuContent(flowChart, menuConfig)}
      </Menu>
    </div>
  );
};

const Helper = {
  // 将右菜单配置打平，然后生成执行器map
  makeMenuHandlerMap(config: IMenuConfig[]) {
    const queue = config.slice(0);
    const handlerMap: { [key: string]: (flowChart: Graph) => void } = {};
    while (queue.length > 0) {
      const { key, handler, children } = queue.pop() as IMenuConfig;
      if (children && children.length > 0) {
        queue.push(...children);
      } else {
        handlerMap[key] = handler;
      }
    }
    return handlerMap;
  },

  // 循环生成菜单内容
  makeMenuContent(flowChart: Graph, menuConfig: IMenuConfig[]) {
    const loop = (config: IMenuConfig[]) => {
      return config.map(item => {
        let content = null;
        let { key, title, icon, children, disabled = false, showDividerBehind } = item;
        if (typeof disabled === 'function') {
          disabled = disabled(flowChart);
        }
        if (children && children.length > 0) {
          content = (
            <Menu.SubMenu key={key} icon={icon} title={title} disabled={disabled}>
              {loop(children)}
            </Menu.SubMenu>
          );
        } else {
          content = (
            <Menu.Item key={key} icon={icon} disabled={disabled}>
              {title}
            </Menu.Item>
          );
        }
        return [
          content,
          showDividerBehind && <Menu.Divider />
        ];
      });
    };
    return loop(menuConfig);
  }
};

export default FlowChartContextMenu;
