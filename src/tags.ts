import type { Children, JSX } from './index.js';

/**
 * Builds the result of a lowercase tag, such as `<box>`, from its props.
 *
 * It receives the props like a component does: children normalized, and awaited if they contain
 * async components. It can return anything a component can, or a promise of it.
 */
export type TagHandler<P = any> = (this: void, props: P) => Children

/**
 * Builds the result of any lowercase tag without its own handler, from the tag name and props.
 */
export type DefaultTagHandler = (
  this: void,
  name: string,
  props: { children?: Children; [key: string]: any },
) => Children

interface TagRegistry {
  tags: Map<string, TagHandler>;
  fallback: DefaultTagHandler | undefined;
}

/**
 * The registry is stored on `globalThis` under `Symbol.for`, so it's shared by every copy of
 * jsx-object loaded in the process, such as its ESM and CommonJS builds. Otherwise, a tag
 * registered through one copy would be missing from elements created by the other.
 *
 * `globalThis` is from ES2020, so environments without it, such as Node 10 and Safari before 12.1,
 * get a registry of their own for each copy instead.
 */
const root: any = typeof globalThis !== 'undefined' ? globalThis : {};

const registry: TagRegistry =
  (root[Symbol.for('jsx-object.tags')] ??= { tags: new Map(), fallback: undefined });

const assertHandler = (handler: unknown) => {
  if (typeof handler !== 'function') {
    throw new TypeError('The tag handler must be a function');
  }
}

/**
 * Registers the handler of a lowercase tag, so `<box>` calls `handler(props)`.
 *
 * The tag must be declared in `JSX.IntrinsicElements`, which types the handler's props. A tag can
 * only be registered once: registering it again throws, to catch two libraries using the same
 * name. Call the returned function to unregister it.
 *
 * @example
 * registerTag('box', (props) => ({ type: 'box', ...props }));
 *
 * @returns A function that removes the handler.
 */
export function registerTag<K extends keyof JSX.IntrinsicElements & string>(
  name: K,
  handler: TagHandler<JSX.IntrinsicElements[K]>,
): () => void {
  if (typeof name !== 'string' || (name as string) === '') {
    throw new TypeError('The tag name must be a non-empty string');
  }

  assertHandler(handler);

  if (registry.tags.has(name)) {
    throw new Error(`The tag <${name}> is already registered`);
  }

  registry.tags.set(name, handler);

  return () => {
    if (registry.tags.get(name) === handler) {
      registry.tags.delete(name);
    }
  };
}

/**
 * Sets the handler of every lowercase tag that has no handler of its own.
 *
 * Without one, rendering such a tag throws, since jsx-object doesn't assume what the object should
 * look like. Setting it again replaces the previous handler. It's meant to be set by the app, not
 * by libraries, which should register their own tags with {@linkcode registerTag} instead.
 *
 * @example
 * registerDefaultTag((name, props) => ({ type: name, ...props }));
 *
 * @returns A function that restores the previous default handler, if this one is still set.
 */
export function registerDefaultTag(handler: DefaultTagHandler): () => void {
  assertHandler(handler);

  const previous = registry.fallback;
  registry.fallback = handler;

  return () => {
    if (registry.fallback === handler) {
      registry.fallback = previous;
    }
  };
}

/**
 * Renders a lowercase tag with its registered handler, the default handler, or throws.
 */
export const renderTag = (name: string, props: { children?: Children; [key: string]: any }): any => {
  const handler = registry.tags.get(name);

  if (handler) {
    return handler(props);
  }

  if (registry.fallback) {
    return registry.fallback(name, props);
  }

  throw new Error(
    `No handler for <${name}>. Register one with registerTag('${name}', ...) or registerDefaultTag(...)`,
  );
}
