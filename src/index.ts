import './jsx.js';

export type Children =
  | null
  | undefined
  | JSX.Element
  | Promise<Children>
  | Children[]

export type PropsWithChildren<T = {}> = { children?: Children } & T

export type Component<T = {}> = (this: void, props: PropsWithChildren<T>) => JSX.Element

export function Fragment(
  props: PropsWithChildren
): JSX.Element {
  return props.children ?? [];
}
