import './jsx.js';

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

export type Children =
  | null
  | undefined
  | ObjectElement
  | Promise<Children>
  | Children[]

export type PropsWithChildren<T = {}> = { children?: Children } & T

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

/**
 * Alias of {@linkcode FunctionComponent}.
 */
export type Component<T = {}, R extends object = object & JSX.ComponentObject> = FunctionComponent<T, R>

export function Fragment(
  props: PropsWithChildren
): JSX.Element {
  return props.children ?? [];
}
