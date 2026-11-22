import { describe, expectTypeOf, it } from 'vitest';
import type { JSX } from 'jsx-object';

declare module 'jsx-object' {
  namespace JSX {
    interface IntrinsicElements {
      'test-box': { color?: string };
    }
  }
}

describe('JSX namespace', () => {
  it('is not declared globally', () => {
    // @ts-expect-error jsx-object doesn't declare a global JSX namespace
    type GlobalElement = globalThis.JSX.Element;

    expectTypeOf<JSX.Element>().toBeAny();
  });

  it('is exported by the runtime modules', () => {
    expectTypeOf<import('jsx-object/jsx-runtime').JSX.Element>().toBeAny();
    expectTypeOf<import('jsx-object/jsx-dev-runtime').JSX.Element>().toBeAny();
  });

  it('can be extended with module augmentation', () => {
    expectTypeOf<JSX.IntrinsicElements['test-box']>().toEqualTypeOf<{ color?: string }>();

    <test-box color="red" />;

    // @ts-expect-error the augmented props are checked
    <test-box color={1} />;

    // @ts-expect-error undeclared tags are still rejected
    <test-unknown />;
  });
});
