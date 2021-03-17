import shortcuts from '../../common/shortcuts';
import { Cell, Edge, Graph, Node } from '@antv/x6';
import { MIN_ZOOM, MAX_ZOOM } from '../../common/const';
import baseCellSchemaMap from '../../common/baseCell';
import previewCellSchemaMap from '../../common/previewCell';
import { getSelectedEdges } from '../../utils/flowChartUtils';
import { registerServerStorage } from './registerServerStorage';
import MiniMapSimpleNode from '../../components/miniMapSimpleNode';

// X6 register base/preview cell shape
[baseCellSchemaMap, previewCellSchemaMap].forEach((schemas) =>
  Object.values(schemas).forEach((schema) => {
    const { base, ...rest } = schema;
    base.define(rest);
  })
);

const registerEvents = (flowChart: Graph): void => {
  // 节点新增事件
  flowChart.on('node:added', (args) => {
    flowChart.cleanSelection();
    flowChart.select(args.cell);
  });

  // 集合改变事件
  flowChart.on('selection:changed', () => {
    flowChart.trigger('toolBar:forceUpdate');
    flowChart.trigger('settingBar:forceUpdate');
  });

  // 线链接完成事件
  flowChart.on('edge:connected', (args) => {
    const edge = args.edge as Edge;
    const sourceNode = edge.getSourceNode() as Node;
    if (sourceNode && sourceNode.shape === 'imove-branch') {
      const portId = edge.getSourcePortId();
      if (portId === 'right' || portId === 'bottom') {
        edge.setLabelAt(0, sourceNode.getPortProp(portId, 'attrs/text/text'));
        sourceNode.setPortProp(portId, 'attrs/text/text', '');
      }
    }
  });

  // 线选中事件
  flowChart.on('edge:selected', (args) => {
    args.edge.attr('line/stroke', '#feb663');
    args.edge.attr('line/strokeWidth', '3px');
  });

  // 线取消选中事件
  flowChart.on('edge:unselected', (args) => {
    args.edge.attr('line/stroke', '#333');
    args.edge.attr('line/strokeWidth', '2px');
  });

  flowChart.on('edge:mouseover', (args) => {
    args.edge.attr('line/stroke', '#feb663');
    args.edge.attr('line/strokeWidth', '3px');
  });
  flowChart.on('edge:mouseleave', (args) => {
    const { edge } = args;
    const selectedEdges = getSelectedEdges(flowChart);
    if (selectedEdges[0] !== edge) {
      args.edge.attr('line/stroke', '#333');
      args.edge.attr('line/strokeWidth', '2px');
    }
  });
  flowChart.on('node:dblclick', () => {
    flowChart.trigger('graph:editCode');
  });
  flowChart.on('blank:contextmenu', (args) => {
    const { e: { clientX, clientY } } = args;
    flowChart.cleanSelection();
    flowChart.trigger('graph:showContextMenu', { x: clientX, y: clientY, scene: 'blank' });
  });
  flowChart.on('node:contextmenu', (args) => {
    const { e: { clientX, clientY }, node } = args;
    // NOTE: if the clicked node is not in the selected nodes, then clear selection
    if(!flowChart.getSelectedCells().includes(node)) {
      flowChart.cleanSelection();
      flowChart.select(node);
    }
    flowChart.trigger('graph:showContextMenu', { x: clientX, y: clientY, scene: 'node' });
  });
};

const registerShortcuts = (flowChart: Graph): void => {
  Object.values(shortcuts).forEach((shortcut) => {
    const { keys, handler } = shortcut;
    flowChart.bindKey(keys, () => handler(flowChart));
  });
};

/**
 * 1. 创建流程图
 * 2. 注册相关事件
 * @param container 容器
 * @param miniMapContainer 小地图容器
 * @returns 
 */
const createFlowChart = (container: HTMLDivElement, miniMapContainer: HTMLDivElement): Graph => {
  const flowChart = new Graph({
    container,
    rotating: false,
    resizing: true,
    // https://x6.antv.vision/zh/docs/tutorial/basic/clipboard
    clipboard: {
      enabled: true,
      useLocalStorage: true,
    },
    // https://x6.antv.vision/zh/docs/tutorial/intermediate/connector
    connecting: {
      snap: true,
      dangling: true,
      highlight: true,
      anchor: 'center',
      connectionPoint: 'anchor',
      router: {
        name: 'manhattan',
      },
      // 为了避免有链接空、链接自己的情况出现
      validateConnection({ sourceView, targetView, sourceMagnet, targetMagnet }) {
        if (!sourceMagnet) {
          return false;
        } else if (!targetMagnet) {
          return false;
        } else {
          return sourceView !== targetView;
        }
      },
    },
    // https://x6.antv.vision/zh/docs/tutorial/basic/background
    background: {
      color: '#f8f9fa',
    },
    // https://x6.antv.vision/zh/docs/tutorial/basic/grid
    grid: {
      visible: true,
    },
    // https://x6.antv.vision/zh/docs/tutorial/basic/selection
    selecting: {
      enabled: true,
      multiple: true,
      rubberband: true,
      movable: true,
      strict: true,
      showNodeSelectionBox: true
    },
    // https://x6.antv.vision/zh/docs/tutorial/basic/snapline
    snapline: {
      enabled: true,
      clean: 100,
    },
    // https://x6.antv.vision/zh/docs/tutorial/basic/keyboard
    keyboard: {
      enabled: true,
      global: false,
    },
    // https://x6.antv.vision/zh/docs/tutorial/basic/history
    history: {
      enabled: true,
    },
    // https://x6.antv.vision/zh/docs/tutorial/basic/minimap
    minimap: {
      width: (150 * container.offsetWidth) / container.offsetHeight,
      height: 150,
      minScale: MIN_ZOOM,
      maxScale: MAX_ZOOM,
      enabled: true,
      scalable: false,
      container: miniMapContainer,
      graphOptions: {
        async: true,
        getCellView(cell: Cell) {
          if (cell.isNode()) {
            return MiniMapSimpleNode;
          }
        },
        createCellView(cell: Cell) {
          if (cell.isEdge()) {
            return null;
          }
        },
      },
    },
    // https://x6.antv.vision/zh/docs/tutorial/basic/scroller
    scroller: {
      enabled: true,
    },
    mousewheel: {
      enabled: true,
      minScale: MIN_ZOOM,
      maxScale: MAX_ZOOM,
      modifiers: ['ctrl', 'meta'],
    },
  });

  // 注册事件，包括点、边、空白区相关的
  registerEvents(flowChart);

  // 注册快捷键
  registerShortcuts(flowChart);

  // 注册事件触发的节点、边缓存
  registerServerStorage(flowChart);
  return flowChart;
};

export default createFlowChart;
