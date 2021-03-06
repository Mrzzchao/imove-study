import React, { ReactElement } from 'react';

import 'antd/es/tooltip/style';
import styles from '../index.module.less';

import { Tooltip } from 'antd';
import { Graph } from '@antv/x6';

interface IOptions {
  tooltip: string;
  getIcon: (flowChart: Graph) => ReactElement;
  handler: (flowChart: Graph) => void;
  disabled?: (flowChart: Graph) => boolean;
  selected?: (flowChart: Graph) => boolean;
}

interface IBtnWidgetProps {
  flowChart: Graph;
}

/**
 * 根据配置生成插件按钮
 * 1. 禁用和选中方法逻辑处理
 * 2. 点击事件逻辑处理，并触发强制更新
 * 3. 按配置获取图标、提示等
 * @param options 插件配置
 * @returns 
 */
const makeBtnWidget = (options: IOptions) => {
  const Widget: React.FC<IBtnWidgetProps> = (props) => {
    const { flowChart } = props;
    const { tooltip, getIcon, handler } = options;
    const iconWrapperCls = [styles.btnWidget];
    let { disabled = false, selected = false } = options;
    if (typeof disabled === 'function') {
      disabled = disabled(flowChart);
      disabled && iconWrapperCls.push(styles.disabled);
    }
    if (typeof selected === 'function') {
      selected = selected(flowChart);
      selected && iconWrapperCls.push(styles.selected);
    }
    const onClick = (): void => {
      if (disabled) return;
      handler(flowChart);
      flowChart.trigger('toolBar:forceUpdate');
    };
    return (
      <Tooltip title={tooltip}>
        <div className={iconWrapperCls.join(' ')} onClick={onClick}>
          {getIcon(flowChart)}
        </div>
      </Tooltip>
    );
  };
  return Widget;
};

export default makeBtnWidget;
