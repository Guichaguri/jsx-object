import type { Children } from './index.js';

const processResult = (name: string | Function, props: object, children: Children) => {
  if (typeof name === 'function') {
    return name({ ...props, children });
  }

  return children;
}

const isPromise = (value: any): value is Promise<any> => {
  return value && typeof value === 'object' && typeof value.then === 'function';
}

/**
 * Checks whether the children are a promise or contain one, at any array depth.
 * Mapped children (e.g. `{items.map(...)}`) are nested arrays inside the children array.
 */
const hasPromise = (children: any): boolean => {
  return isPromise(children) || (Array.isArray(children) && children.some(hasPromise));
}

/**
 * Resolves every promise in the children, keeping nested arrays in place.
 */
const resolveChildren = (children: any): Promise<any> => {
  if (Array.isArray(children)) {
    return Promise.all(children.map(resolveChildren));
  }

  return Promise.resolve(children);
}

export function jsx(
  this: void,
  name: string | Function,
  attributes: { children?: Children; [k: string]: any }
): JSX.Element {
  if (hasPromise(attributes.children)) {
    return resolveChildren(attributes.children).then(children => {
      return processResult(name, attributes, children);
    });
  }

  return processResult(name, attributes, attributes.children);
}

export function jsxs(
  this: void,
  name: string | Function,
  attributes: { children: Children[]; [k: string]: any }
): JSX.Element {
  return jsx(name, attributes);
}

export { Fragment } from './index.js'
