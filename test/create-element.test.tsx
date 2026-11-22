import { describe, expect, it, vi } from 'vitest';
import { createElement, Fragment } from '../src/index.js';

const delay = (ms = 0) => new Promise((resolve) => setTimeout(resolve, ms));

describe('createElement', () => {
  it('calls a component with its props', () => {
    const component = vi.fn((props: object) => ({ type: 'box', ...props }));

    expect(createElement(component, { title: 'Hello' })).toEqual({ type: 'box', title: 'Hello' });
    expect(component).toHaveBeenCalledWith({ title: 'Hello' });
  });

  it('accepts null and missing props', () => {
    const component = vi.fn(() => ({}));

    createElement(component, null);
    createElement(component);

    expect(component).toHaveBeenNthCalledWith(1, {});
    expect(component).toHaveBeenNthCalledWith(2, {});
  });

  it('passes a single child argument as-is', () => {
    expect(createElement((props: object) => props, null, { id: 1 })).toEqual({ children: { id: 1 } });
  });

  it('passes several child arguments as an array, normalized', () => {
    const result = createElement((props: object) => props, null, { id: 1 }, null, [{ id: 2 }], false);

    expect(result).toEqual({ children: [{ id: 1 }, { id: 2 }] });
  });

  it('replaces props.children with the child arguments', () => {
    const result = createElement((props: object) => props, { children: { id: 1 } }, { id: 2 });

    expect(result).toEqual({ children: { id: 2 } });
  });

  it('keeps props.children when there are no child arguments', () => {
    const result = createElement((props: object) => props, { children: { id: 1 } });

    expect(result).toEqual({ children: { id: 1 } });
  });

  it('removes the key prop', () => {
    const component = vi.fn((props: object) => props);

    createElement(component, { key: 'k', name: 'item' });

    expect(component).toHaveBeenCalledWith({ name: 'item' });
  });

  it('removes the __self and __source debug props', () => {
    const component = vi.fn((props: object) => props);

    createElement(component, { name: 'item', __self: {}, __source: { fileName: 'a.tsx' } });

    expect(component).toHaveBeenCalledWith({ name: 'item' });
  });

  it('does not mutate the props object', () => {
    const props = { key: 'k', name: 'item' };

    createElement((p: object) => p, props, { id: 1 });

    expect(props).toEqual({ key: 'k', name: 'item' });
  });

  it('awaits async children', async () => {
    async function Child() {
      await delay();
      return { type: 'child' };
    }

    const result = createElement((props: object) => props, null, createElement(Child), { id: 2 });

    await expect(result).resolves.toEqual({ children: [{ type: 'child' }, { id: 2 }] });
  });

  it('renders fragments', () => {
    expect(createElement(Fragment, null, { id: 1 }, { id: 2 })).toEqual([{ id: 1 }, { id: 2 }]);
  });

  it('is used by JSX when a key comes after a spread', () => {
    const Item = vi.fn((props: { name: string; children?: unknown }) => ({ type: 'item', ...props }));
    const props = { name: 'spread' };

    // @ts-ignore - key is intentionally typed as never
    const result = <Item {...props} key="k">{{ id: 1 }}{{ id: 2 }}</Item>;

    expect(Item).toHaveBeenCalledWith({ name: 'spread', children: [{ id: 1 }, { id: 2 }] });
    expect(result).toEqual({ type: 'item', name: 'spread', children: [{ id: 1 }, { id: 2 }] });
  });
});
