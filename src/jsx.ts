declare global {
  namespace JSX {
    /**
     * The constraint every component's result must satisfy.
     *
     * It's empty by default, so any object is accepted. Extend it to require members on the result
     * of every component, such as a `type` discriminator.
     */
    interface ComponentObject {}

    /**
     * The type of every JSX expression.
     *
     * TypeScript gives all JSX expressions this same type, regardless of the component, so it's
     * intentionally loose: annotate the result with `ObjectElement<T>` or `ObjectOf<typeof C>` to
     * get a typed object.
     *
     * @see https://github.com/microsoft/TypeScript/issues/14729
     */
    type Element = any

    /**
     * Validates components (TypeScript 5.1+): every component must return an object satisfying
     * {@linkcode ComponentObject}, a promise of one, or JSX.
     */
    type ElementType = string | ((props: any) => import('./index.js').ObjectElement | null | undefined)

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
