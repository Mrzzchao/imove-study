import React, { useEffect, useReducer } from 'react';

import 'antd/es/tooltip/style';
import styles from './index.module.less';

import { Graph } from '@antv/x6';
import widgets from './widgets';
import ModifyStatus from './widgets/modifyStatus';

interface IProps {
  flowChart: Graph;
}

const ToolBar: React.FC<IProps> = (props) => {
  const { flowChart } = props;
  const forceUpdate = useReducer((n) => n + 1, 0)[1];

  useEffect(() => {

    // 监听强制更新事件，是为了点击工具栏插件时执行，更新工具栏
    flowChart.on('toolBar:forceUpdate', forceUpdate);

    // 组件卸载时 清除事件监听
    return () => {
      flowChart.off('toolBar:forceUpdate');
    };
  }, []);

  return (
    <div className={styles.container}>
      {widgets.map((group, index) => (
        <div key={index} className={styles.group}>
          {group.map((ToolItem, index) => {
            return <ToolItem key={index} flowChart={flowChart} />;
          })}
        </div>
      ))}
      <ModifyStatus flowChart={flowChart} />
    </div>
  );
};

export default ToolBar;
