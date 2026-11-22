import { afterEach, describe, expect, it, vi } from 'vitest';
import { registerDefaultTag, registerTag } from '../src/index.js';
import type { Children } from '../src/index.js';
import { jsx } from '../src/jsx-runtime.js';

declare module 'jsx-object' {
  namespace JSX {
    interface IntrinsicElements {
      'tag-box': { color?: string; children?: Children };
      'tag-other': {};
    }
  }
}

const delay = (ms = 0) => new Promise((resolve) => setTimeout(resolve, ms));

const cleanups: (() => void)[] = [];

/** Undoes a registration after the test. */
const scoped = (unregister: () => void) => {
  cleanups.push(unregister);
  return unregister;
};

afterEach(() => {
  // Undo in reverse order, so default handlers are restored correctly
  while (cleanups.length) cleanups.pop()!();
});

describe('lowercase tags', () => {
  it('throw when no handler is registered', () => {
    expect(() => <tag-box />).toThrow(
      "No handler for <tag-box>. Register one with registerTag('tag-box', ...) or registerDefaultTag(...)",
    );
  });

  it('reject when no handler is registered and the children are async', async () => {
    async function Child() {
      await delay();
      return { type: 'child' };
    }

    await expect(
      <tag-box>
        <Child />
      </tag-box>,
    ).rejects.toThrow('No handler for <tag-box>');
  });

  it('do not affect fragments', () => {
    expect(<>{{ id: 1 }}</>).toEqual({ id: 1 });
  });
});

describe('registerTag', () => {
  it('renders the tag with its handler', () => {
    const handler = vi.fn((props: object) => ({ type: 'box', ...props }));
    scoped(registerTag('tag-box', handler));

    const result = <tag-box color="red">{{ id: 1 }}</tag-box>;

    expect(handler).toHaveBeenCalledWith({ color: 'red', children: { id: 1 } });
    expect(result).toEqual({ type: 'box', color: 'red', children: { id: 1 } });
  });

  it('passes normalized children to the handler', () => {
    const handler = vi.fn((props: object) => props);
    scoped(registerTag('tag-box', handler));

    <tag-box>
      {false}
      {[{ id: 1 }, [{ id: 2 }]]}
      {null}
    </tag-box>;

    expect(handler).toHaveBeenCalledWith({ children: [{ id: 1 }, { id: 2 }] });
  });

  it('awaits async children before calling the handler', async () => {
    const handler = vi.fn((props: object) => ({ type: 'box', ...props }));
    scoped(registerTag('tag-box', handler));

    async function Child() {
      await delay();
      return { type: 'child' };
    }

    const result = (
      <tag-box>
        <Child />
      </tag-box>
    );

    expect(handler).not.toHaveBeenCalled();
    await expect(result).resolves.toEqual({ type: 'box', children: { type: 'child' } });
  });

  it('supports async handlers', async () => {
    scoped(
      registerTag('tag-box', async (props) => {
        await delay();
        return { type: 'box', color: props.color };
      }),
    );

    await expect(<tag-box color="blue" />).resolves.toEqual({ type: 'box', color: 'blue' });
  });

  it('renders tags nested inside components and other tags', () => {
    scoped(registerTag('tag-box', (props) => ({ type: 'box', children: props.children })));
    scoped(registerTag('tag-other', () => ({ type: 'other' })));

    function Card() {
      return (
        <tag-box>
          <tag-other />
        </tag-box>
      );
    }

    expect(<Card />).toEqual({ type: 'box', children: { type: 'other' } });
  });

  it('takes precedence over the default handler', () => {
    const fallback = vi.fn(() => ({ type: 'default' }));
    scoped(registerDefaultTag(fallback));
    scoped(registerTag('tag-box', () => ({ type: 'box' })));

    expect(<tag-box />).toEqual({ type: 'box' });
    expect(fallback).not.toHaveBeenCalled();
  });

  it('throws when the tag is already registered', () => {
    scoped(registerTag('tag-box', () => ({})));

    expect(() => registerTag('tag-box', () => ({}))).toThrow('The tag <tag-box> is already registered');
  });

  it('can register the tag again after unregistering it', () => {
    const unregister = registerTag('tag-box', () => ({ type: 'first' }));
    unregister();

    scoped(registerTag('tag-box', () => ({ type: 'second' })));

    expect(<tag-box />).toEqual({ type: 'second' });
  });

  it('does not remove a newer handler when unregistering twice', () => {
    const unregister = registerTag('tag-box', () => ({ type: 'first' }));
    unregister();
    scoped(registerTag('tag-box', () => ({ type: 'second' })));

    unregister();

    expect(<tag-box />).toEqual({ type: 'second' });
  });

  it('rejects invalid names and handlers', () => {
    expect(() => registerTag('' as any, () => ({}))).toThrow(TypeError);
    expect(() => registerTag('tag-box', 'nope' as any)).toThrow(TypeError);
  });

  it('is shared through a global registry', () => {
    const handler = () => ({});
    scoped(registerTag('tag-box', handler));

    const registry = (globalThis as any)[Symbol.for('jsx-object.tags')];

    expect(registry.tags.get('tag-box')).toBe(handler);
  });

  it('can be called through the runtime directly', () => {
    scoped(registerTag('tag-box', (props) => ({ type: 'box', ...props })));

    expect(jsx('tag-box', { color: 'red' })).toEqual({ type: 'box', color: 'red' });
  });
});

describe('registerDefaultTag', () => {
  it('renders unregistered tags with the tag name and props', () => {
    const fallback = vi.fn((name: string, props: object) => ({ type: name, ...props }));
    scoped(registerDefaultTag(fallback));

    const result = <tag-box color="red">{{ id: 1 }}</tag-box>;

    expect(fallback).toHaveBeenCalledWith('tag-box', { color: 'red', children: { id: 1 } });
    expect(result).toEqual({ type: 'tag-box', color: 'red', children: { id: 1 } });
  });

  it('can pass the children through', () => {
    scoped(registerDefaultTag((_name, props) => props.children));

    expect(
      <tag-box>
        {{ id: 1 }}
        {{ id: 2 }}
      </tag-box>,
    ).toEqual([{ id: 1 }, { id: 2 }]);
  });

  it('replaces the previous default handler', () => {
    scoped(registerDefaultTag(() => ({ type: 'first' })));
    scoped(registerDefaultTag(() => ({ type: 'second' })));

    expect(<tag-box />).toEqual({ type: 'second' });
  });

  it('restores the previous default handler', () => {
    scoped(registerDefaultTag(() => ({ type: 'first' })));
    const restore = registerDefaultTag(() => ({ type: 'second' }));

    restore();

    expect(<tag-box />).toEqual({ type: 'first' });
  });

  it('throws again once the default handler is removed', () => {
    const restore = registerDefaultTag(() => ({}));
    restore();

    expect(() => <tag-box />).toThrow('No handler for <tag-box>');
  });

  it('does not restore when another handler was set since', () => {
    const restoreFirst = scoped(registerDefaultTag(() => ({ type: 'first' })));
    scoped(registerDefaultTag(() => ({ type: 'second' })));

    restoreFirst();

    expect(<tag-box />).toEqual({ type: 'second' });
  });

  it('rejects a handler that is not a function', () => {
    expect(() => registerDefaultTag(null as any)).toThrow(TypeError);
  });
});
