import valoo from 'valoo';

export function bind(target: any, property: string) {
  target[property] = 'bound';
}
