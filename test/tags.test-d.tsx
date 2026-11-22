import { describe, expectTypeOf, it } from 'vitest';
import { registerDefaultTag, registerTag } from 'jsx-object';
import type { Children } from 'jsx-object';

// 'test-box' is declared in namespace.test-d.tsx as { color?: string }

describe('registerTag', () => {
  it('types the handler props from JSX.IntrinsicElements', () => {
    registerTag('test-box', (props) => {
      expectTypeOf(props).toEqualTypeOf<{ color?: string }>();
      return { type: 'box', color: props.color };
    });
  });

  it('accepts async handlers and handlers returning null', () => {
    registerTag('test-box', async () => ({ type: 'box' }));
    registerTag('test-box', () => null);
  });

  it('rejects undeclared tags', () => {
    // @ts-expect-error the tag must be declared in JSX.IntrinsicElements
    registerTag('test-unknown', () => ({}));
  });

  it('rejects handlers returning primitives', () => {
    // @ts-expect-error tags must produce objects, like components
    registerTag('test-box', () => 'text');
  });

  it('returns an unregister function', () => {
    expectTypeOf(registerTag('test-box', () => ({}))).toEqualTypeOf<() => void>();
  });
});

describe('registerDefaultTag', () => {
  it('receives the tag name and props', () => {
    registerDefaultTag((name, props) => {
      expectTypeOf(name).toEqualTypeOf<string>();
      expectTypeOf(props.children).toEqualTypeOf<Children | undefined>();
      return { type: name, ...props };
    });
  });

  it('can pass the children through', () => {
    registerDefaultTag((_name, props) => props.children);
  });
});
