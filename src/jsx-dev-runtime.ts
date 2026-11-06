import type { Children } from './index.js'
import { jsx, jsxs } from './jsx-runtime.js'

export { Fragment, jsx, jsxs } from './jsx-runtime.js'

/**
 * Generates an object from an attribute name of component and it's props.
 *
 * This function is meant to be used by the jsx runtime and should not be called directly.
 *
 * @param name The name of the element to create or another component function
 * @param attributes The props to apply to the component
 * @param key The element key, which is ignored
 * @param isStaticChildren Whether the children are a static array, as passed to {@linkcode jsxs}
 * @retuns The generated object or a promise that resolves to the generated object
 */
export function jsxDEV(
  this: void,
  name: string | Function,
  attributes: { children?: Children; [k: string]: any },
  key?: unknown,
  isStaticChildren?: boolean
): JSX.Element {
  if (isStaticChildren && Array.isArray(attributes.children)) {
    return jsxs(name, attributes as { children: Children[]; [k: string]: any })
  }

  return jsx(name, attributes)
}
