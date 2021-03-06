import React, {
  useRef,
  useState,
  useEffect,
  useCallback,
  ChangeEvent
} from 'react';

import styles from './index.module.less';

import {
  InfoCircleOutlined,
  WarningOutlined,
  BugOutlined,
  CloseCircleOutlined,
  ClearOutlined,
  FilterOutlined
} from '@ant-design/icons';
import { Button, Input, Select, Tabs } from 'antd';

interface ILog {
  type: string;
  data: any[];
  strVal: string;
}

const Helper = {
  isPlainObject(value: any): boolean {
    return typeof value === 'object' && value !== null;
  },
  getArgsToString(args: any[]): string {
    return args.map(o => {
      if (Helper.isPlainObject(o)) {
        return JSON.stringify(o);
      } else {
        return o;
      }
    }).join(' ');
  }
}

const hijackMap: { [key: string]: any } = {
  log: {
    bgColor: '#272823',
    textColor: '#ffffff',
    borderColor: 'rgba(128, 128, 128, 0.35)',
    icon: <div className={styles.logIcon} />,
    originMethod: console.log
  },
  info: {
    bgColor: '#272823',
    textColor: '#ffffff',
    borderColor: 'rgba(128, 128, 128, 0.35)',
    icon: <InfoCircleOutlined className={styles.logIcon} />,
    originMethod: console.info
  },
  warn: {
    bgColor: 'rgb(51, 42, 0)',
    textColor: 'rgb(245, 211, 150)',
    borderColor: 'rgb(102, 85, 0)',
    icon: <WarningOutlined className={styles.logIcon} />,
    originMethod: console.warn
  },
  debug: {
    bgColor: '#272823',
    textColor: 'rgb(77, 136, 255)',
    borderColor: 'rgba(128, 128, 128, 0.35)',
    icon: <BugOutlined className={styles.logIcon} />,
    originMethod: console.debug
  },
  error: {
    bgColor: 'rgb(40, 0, 0)',
    textColor: 'rgb(254, 127, 127)',
    borderColor: 'rgb(91, 0, 0)',
    icon: <CloseCircleOutlined className={styles.logIcon} />,
    originMethod: console.error
  }
}

const MyConsole: React.FC = () => {
  const [filter, setFilter] = useState('');
  const [level, setLevel] = useState('all');
  const [logList, setLogList] = useState<ILog[]>([]);
  const cache = useRef<{ allLogs: ILog[] }>({ allLogs: [] });

  useEffect(() => {
    hijackConsole();
    return () => {
      resetConsole();
    };
  }, []);

  useEffect(() => {
    const filteredLogs = cache.current.allLogs
      .filter(log => {
        if (level === 'all') {
          return true;
        } else {
          return log.type === level;
        }
      })
      .filter(log => {
        return log.strVal.indexOf(filter) > -1;
      });
    setLogList(filteredLogs);
  }, [filter, level]);

  const hijackConsole = () => {
    Object.keys(hijackMap).forEach(method => {
      // @ts-ignore
      window.console[method] = (...args: any[]) => {
        hijackMap[method].originMethod(...args);
        cache.current.allLogs = cache.current.allLogs.concat({
          type: method,
          data: args,
          strVal: Helper.getArgsToString(args)
        });
        setLogList(cache.current.allLogs);
      };
    });
  }

  const resetConsole = () => {
    Object.keys(hijackMap).forEach(method => {
      // @ts-ignore
      window.console[method] = hijackMap[method].originMethod;
    });
  };

  const onChangeFilter = useCallback((evt: ChangeEvent<HTMLInputElement>) => {
    setFilter(evt.target.value);
  }, []);

  const onChangeLevel = useCallback((level: string) => {
    setLevel(level);
  }, []);

  const onClickClear = useCallback(() => {
    setLogList([]);
    cache.current.allLogs = [];
  }, []);

  const renderToolBar = () => {
    return (
      <div className={styles.toolBar}>
        <Input
          allowClear={true}
          placeholder={'??????'}
          prefix={<FilterOutlined />}
          onChange={onChangeFilter}
        />
        <Select className={styles.levels} defaultValue={'all'} onChange={onChangeLevel}>
          {['all', 'info', 'warn', 'error', 'debug'].map(method => (
            <Select.Option key={method} value={method}>
              {method}
            </Select.Option>
          ))}
        </Select>
        <Button type={'link'} onClick={onClickClear}>
          <ClearOutlined /> ??????
        </Button>
      </div>
    );
  };

  const renderLogPanel = (logList: ILog[]) => {
    return (
      <div className={styles.logPanel}>
        {logList.map((log: ILog, index: number) => {
          const { icon, textColor, bgColor, borderColor } = hijackMap[log.type];
          const logLineStyle = {
            color: textColor,
            backgroundColor: bgColor,
            borderTopColor: borderColor,
            borderBottomColor: borderColor
          };
          // TODO: use react-json-view to render object
          return (
            <div key={index} className={styles.logLine} style={logLineStyle}>
              {icon}
              <div className={styles.logText}>
                {log.strVal}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className={styles.container}>
      <Tabs type={'card'} tabBarExtraContent={renderToolBar()}>
        <Tabs.TabPane tab={'?????????'} key={'log'}>
          {renderLogPanel(logList)}
        </Tabs.TabPane>
      </Tabs>
    </div>
  );
};

export default MyConsole;
