import React, {
  useState,
  useEffect,
  useCallback,
} from 'react';

import styles from './index.module.less';

import { Button } from 'antd';
import { Graph } from '@antv/x6';
import Console from '../console';
import InputPanel from './inputPanel';
import JsonView from 'react-json-view';
import { executeScript } from '../../utils';
import { PlayCircleFilled, LoadingOutlined } from '@ant-design/icons';
// import { compileForOnline } from '@imove/compile-code';

// debug
import { compileForOnline } from '../../../../../packages/compile-code/src/index';

import { toSelectedCellsJSON } from '../../utils/flowChartUtils';

// FIXME: https://github.com/tomkp/react-split-pane/issues/541
// @ts-ignore
import SplitPane from 'react-split-pane/lib/SplitPane';
// @ts-ignore
import Pane from 'react-split-pane/lib/Pane';

const defaultInput = {
  pipe: {},
  context: {},
  payload: {},
  config: {}
};

interface ICardProps {
  title: string;
}

const Card: React.FC<ICardProps> = (props) => {
  const { title } = props;

  return (
    <div className={styles.card}>
      <div className={styles.cardTitleText}>{title}</div>
      <div className={styles.cardBody}>
        {props.children}
      </div>
    </div>
  );
};

interface ICodeRunProps {
  flowChart: Graph;
}

const CodeRun: React.FC<ICodeRunProps> = (props) => {

  const {flowChart} = props;
  const [isRunning, setIsRunning] = useState(false);
  const [input, setInput] = useState(defaultInput);
  const [output, setOutput] = useState({});

  // 监听代码在线运行结束事件
  useEffect(() => {
    // NOTE: listen the event that iMove online exec ends
    const handler = (data: any) => {
      // 设置运行状态为否
      setIsRunning(false);

      // 设置输出
      setOutput(data.detail || {});
    };
    window.addEventListener('iMoveOnlineExecEnds', handler);
    return () => {
      window.removeEventListener('iMoveOnlineExecEnds', handler);
    };
  }, []);

  const onClickRun = useCallback(() => {
    setIsRunning(true);
    // 获取被选中的元件json串
    const selectedCelssJson = toSelectedCellsJSON(flowChart);

    // 根据元件json编译代码
    debugger;
    const compiledCode = compileForOnline(selectedCelssJson, input);

    // 生成script标签，嵌入编译代码，执行
    executeScript(compiledCode);
  }, [flowChart, input]);

  const onChangeInput = useCallback((val: any) => {
    setInput(val);
  }, []);

  return (
    <div className={styles.container}>
      <SplitPane split={'horizontal'}>
        <Pane initialSize={'380px'} minSize={'43px'}>
          <SplitPane split={'vertical'}>
            <Pane className={styles.pane} minSize={'360px'} maxSize={'660px'}>
              <div className={styles.runWrapper}>
                {isRunning ? (
                  <Button size={'large'} type={'link'}>
                    <LoadingOutlined /> 运行中...
                  </Button>
                ) : (
                  <Button size={'large'} type={'link'} onClick={onClickRun}>
                    <PlayCircleFilled /> 运行代码
                  </Button>
                )}
              </div>
              <Card title={'输入'}>
                <InputPanel
                  data={input}
                  onChange={onChangeInput}
                />
              </Card>
            </Pane>
            <Pane className={styles.pane}>
              <Card title={'输出'}>
                <JsonView
                  name={null}
                  collapsed={false}
                  enableClipboard={false}
                  displayDataTypes={false}
                  displayObjectSize={false}
                  src={output}
                />
              </Card>
            </Pane>
          </SplitPane>
        </Pane>
        <Pane className={styles.pane} minSize={'40px'}>
          <Console />
        </Pane>
      </SplitPane>
    </div>
  );
}

export default CodeRun;
