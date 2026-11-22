import type { Children, JSX } from './index.js';
import { renderTag } from './tags.js';

export type { JSX } from './index.js';

const processResult = (
  name: string | Function,
  props: { children?: Children; [k: string]: any },
) => {
  if (typeof name === 'function') {
    return name(props);
  }

  return renderTag(name, props);
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

/**
 * Whether a child is left out of the result: `null`, `undefined` and booleans, which come from
 * conditionals such as `{cond && <Item />}`.
 */
const isEmpty = (child: any): boolean => {
  return child === null || child === undefined || typeof child === 'boolean';
}

/**
 * Whether an array of children is already flat and has no empty children, so it can be reused.
 */
const isNormalized = (children: any[]): boolean => {
  for (const child of children) {
    if (Array.isArray(child) || isEmpty(child)) {
      return false;
    }
  }

  return true;
}

const flattenInto = (children: any[], result: any[]): any[] => {
  for (const child of children) {
    if (Array.isArray(child)) {
      flattenInto(child, result);
    } else if (!isEmpty(child)) {
      result.push(child);
    }
  }

  return result;
}

/**
 * Normalizes the children passed to a component.
 *
 * An array of children, such as several children or a mapped list, is flattened into a single
 * array, without empty children. A single child is kept as-is, or removed if it's empty.
 */
const normalizeChildren = (children: any): any => {
  if (Array.isArray(children)) {
    return isNormalized(children) ? children : flattenInto(children, []);
  }

  return isEmpty(children) ? undefined : children;
}

/**
 * Calls the component with its children normalized. The props object is only copied if the
 * children change.
 */
const render = (
  name: string | Function,
  attributes: { children?: Children; [k: string]: any },
  children: any,
) => {
  const normalized = normalizeChildren(children);

  if (normalized === attributes.children && (normalized !== undefined || !('children' in attributes))) {
    return processResult(name, attributes);
  }

  const props = { ...attributes, children: normalized };

  if (normalized === undefined) {
    delete props.children;
  }

  return processResult(name, props);
}

export function jsx(
  this: void,
  name: string | Function,
  attributes: { children?: Children; [k: string]: any }
): JSX.Element {
  if (hasPromise(attributes.children)) {
    return resolveChildren(attributes.children).then(children => {
      return render(name, attributes, children);
    });
  }

  return render(name, attributes, attributes.children);
}

export function jsxs(
  this: void,
  name: string | Function,
  attributes: { children: Children[]; [k: string]: any }
): JSX.Element {
  return jsx(name, attributes);
}

export { Fragment } from './index.js'
