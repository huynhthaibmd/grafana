import { parse } from 'ini';
import { readFileSync, existsSync } from 'node:fs';
import path from 'path';

const initialValue: Record<`frontend_dev_${string}`, unknown> = {};

export const getEnvConfig = () => {
  const grafanaRoot = path.join(__dirname, '../..');
  const defaultSettings = readFileSync(`${grafanaRoot}/conf/defaults.ini`, {
    encoding: 'utf-8',
  });

  const customSettings = existsSync(`${grafanaRoot}/conf/custom.ini`)
    ? readFileSync(`${grafanaRoot}/conf/custom.ini`, {
        encoding: 'utf-8',
      })
    : '';

  const defaults = parse(defaultSettings);
  const custom = parse(customSettings);

  const merged = { ...defaults.frontend_dev, ...custom.frontend_dev };
  // Take all frontend keys from the ini file and prefix with `frontend_dev_`,
  // so they can be added to `process.env` elsewhere
  return Object.entries(merged).reduce((acc, [key, value]) => {
    return {
      ...acc,
      [`frontend_dev_${key}`]: value,
    };
  }, initialValue);
};
