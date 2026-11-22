import type { JSX } from './index.js';
import { jsx } from './jsx-runtime.js';

/**
 * Generates an object from an element name or component, its props and children, like React's
 * `createElement`.
 *
 * The JSX transform calls this instead of `jsx` when a `key` comes after a spread, such as
 * `<Item {...props} key="a" />`, importing it from the package root. It can also be called directly
 * where JSX isn't available.
 *
 * The `key` prop is removed, as it is with JSX, along with the `__self` and `__source` debug props
 * that development builds of the JSX transform add. Children given as arguments replace
 * `props.children`: a single one is passed as-is, and several are passed as an array.
 *
 * @example
 * const card = createElement(Card, { title: 'Hello' }, createElement(Text, null, 'World'));
 *
 * @param type The name of the element to create or a component function
 * @param props The props to pass to the component, or `null` for none
 * @param children The children to pass to the component
 * @returns The generated object or a promise that resolves to the generated object
 */
export function createElement(
  this: void,
  type: string | Function,
  props?: { [key: string]: any } | null,
  ...children: unknown[]
): JSX.Element {
  const attributes: { children?: any; [key: string]: any } = { ...props };

  // Development builds of the JSX transform also add `__self` and `__source` debug props here
  delete attributes.key;
  delete attributes.__self;
  delete attributes.__source;

  if (children.length === 1) {
    attributes.children = children[0];
  } else if (children.length > 1) {
    attributes.children = children;
  }

  return jsx(type, attributes);
}
