/** @jsxRuntime classic */
/** @jsx createElement */
/** @jsxFrag Fragment */
import { describe, expectTypeOf, it } from 'vitest';
import { createElement, Fragment } from 'jsx-object';
import type { JSX } from 'jsx-object';

// 'test-box' is declared in namespace.test-d.tsx as { color?: string }

describe('classic JSX runtime', () => {
  it('reads the JSX types from createElement', () => {
    expectTypeOf<createElement.JSX.IntrinsicElements>().toEqualTypeOf<JSX.IntrinsicElements>();
    expectTypeOf<createElement.JSX.Element>().toBeAny();
  });

  it('checks declared tags and their props', () => {
    <test-box color="red" />;

    // @ts-expect-error the augmented props are checked
    <test-box color={1} />;

    // @ts-expect-error undeclared tags are rejected
    <test-unknown />;
  });

  it('validates components', () => {
    const Text = (props: { children: string }) => ({ type: 'text', text: props.children });
    const Bad = () => 'text';

    <Text>Hello</Text>;
    <>
      <Text>Hello</Text>
    </>;

    // @ts-expect-error components must return objects
    <Bad />;

    // @ts-expect-error the props are checked
    <Text>{1}</Text>;
  });
});
