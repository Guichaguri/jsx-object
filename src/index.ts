import type { JSX } from './jsx.js';

export type { JSX } from './jsx.js';
export { createElement } from './create-element.js';
export { registerDefaultTag, registerTag } from './tags.js';
export type { DefaultTagHandler, TagHandler } from './tags.js';

/**
 * The result of a JSX element: the object `T`, or a promise of it when the tree contains an async
 * component.
 *
 * @example
 * const card: ObjectElement<CardObject> = <Card />;
 */
export type ObjectElement<T extends object = object & JSX.ComponentObject> = T | Promise<T>

/**
 * The object a component produces, unwrapped from its promise if the component is async.
 *
 * @example
 * const card: ObjectOf<typeof Card> = await <Card />;
 */
export type ObjectOf<C extends (props: any) => any> = Awaited<ReturnType<C>>

/**
 * Anything that can be passed as children.
 *
 * Nested arrays are flattened, and `null`, `undefined` and booleans are dropped before the
 * children reach the component, so conditionals such as `{show && <Item />}` can be used freely.
 */
export type Children =
  | null
  | undefined
  | boolean
  | ObjectElement
  | Promise<Children>
  | Children[]

export type PropsWithChildren<T = {}> = { children?: Children } & T

/**
 * Text children, such as `Hello {name}!`, which arrive as an array of parts. Use it as the type of
 * a `children` prop and convert it with {@linkcode toText}.
 *
 * @example
 * const Text = (props: { children: TextChildren }) => {
 *   return { type: 'text', text: toText(props.children) };
 * };
 */
export type TextChildren =
  | string
  | number
  | bigint
  | null
  | undefined
  | boolean
  | readonly TextChildren[]

/**
 * Converts text children into a single string.
 *
 * Parts are joined without a separator, numbers and bigints are converted to strings, and `null`,
 * `undefined` and booleans are left out.
 *
 * @example
 * toText(['Hello ', 'Ana', ', you have ', 3, ' messages']); // 'Hello Ana, you have 3 messages'
 *
 * @throws {TypeError} If a part is not text, such as an object, which would otherwise become
 * `'[object Object]'`.
 */
export function toText(children: TextChildren): string {
  if (Array.isArray(children)) {
    let text = '';

    for (const child of children) {
      text += toText(child);
    }

    return text;
  }

  if (children === null || children === undefined || typeof children === 'boolean') {
    return '';
  }

  if (typeof children === 'string' || typeof children === 'number' || typeof children === 'bigint') {
    return String(children);
  }

  throw new TypeError(`Text children can only contain strings and numbers, received ${typeof children}`);
}

/**
 * A function component that receives the props `T` plus children, and produces the object `R`.
 *
 * @example
 * const Card: FunctionComponent<{ title: string }, CardObject> = (props) => {
 *   return { type: 'card', title: props.title, items: props.children };
 * };
 */
export interface FunctionComponent<T = {}, R extends object = object & JSX.ComponentObject> {
  (this: void, props: T): ObjectElement<R>
}

/**
 * Shorthand for {@linkcode FunctionComponent}.
 */
export type FC<T = {}, R extends object = object & JSX.ComponentObject> = FunctionComponent<T, R>

export function Fragment(
  props: PropsWithChildren
): JSX.Element {
  return props.children ?? [];
}
