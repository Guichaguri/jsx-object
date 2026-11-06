declare global {
  namespace JSX {
    interface ComponentObject {
      [key: string]: any;
    }

    /**
     * A `JSX.Element` is always the component object, unless one of their children is a Promise,
     * which makes it also be a Promise
     */
    type Element = ComponentObject | Promise<ComponentObject>

    interface IntrinsicAttributes {
      /**
       * In `react-jsx`, the `'key'` attribute serves as a reserved attribute name.
       * Consequently, the `'key'` attribute is not included in the properties parameter
       * of any component or element.
       *
       * **If you intend to utilize a similar property, please opt for an alternate
       * name.**
       *
       * @see https://github.com/reactjs/rfcs/pull/107
       */
      key?: undefined | never
    }

    interface ElementChildrenAttribute {
      children?: undefined | import('./index.js').Children
    }

    /**
     * No intrinsic elements are defined in this JSX namespace.
     *
     * This is intentional, as the JSX namespace is designed to be extended by other libraries or
     * frameworks that define their own intrinsic elements.
     */
    interface IntrinsicElements {}
  }
}
