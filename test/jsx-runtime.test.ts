import { describe, expect, it, vi } from 'vitest';
import { Fragment, jsx, jsxs } from '../src/jsx-runtime.js';

describe('jsx', () => {
  it('calls a component function with its props and children', () => {
    const component = vi.fn((props: object) => ({ type: 'box', ...props }));

    const result = jsx(component, { title: 'Hello', children: { type: 'child' } });

    expect(component).toHaveBeenCalledOnce();
    expect(component).toHaveBeenCalledWith({ title: 'Hello', children: { type: 'child' } });
    expect(result).toEqual({ type: 'box', title: 'Hello', children: { type: 'child' } });
  });

  it('passes undefined children when none are given', () => {
    const component = vi.fn(() => ({}));

    jsx(component, { title: 'Hello' });

    expect(component).toHaveBeenCalledWith({ title: 'Hello', children: undefined });
  });

  it('does not mutate the attributes object', () => {
    const attributes = { title: 'Hello', children: { type: 'child' } };
    const snapshot = structuredClone(attributes);

    jsx((props: object) => props, attributes);

    expect(attributes).toEqual(snapshot);
  });

  it('returns the children of an intrinsic (string) element', () => {
    const child = { type: 'child' };

    expect(jsx('anything', { children: child })).toBe(child);
  });

  it('returns undefined for an intrinsic element without children', () => {
    expect(jsx('anything', {})).toBeUndefined();
  });

  it('returns synchronously when children are not a promise', () => {
    const result = jsx((props: object) => ({ props }), { children: { type: 'child' } });

    expect(result).not.toBeInstanceOf(Promise);
  });

  it('awaits a promise child before calling the component', async () => {
    const component = vi.fn((props: { children?: unknown }) => ({ wrapped: props.children }));
    const child = Promise.resolve({ type: 'child' });

    const result = jsx(component, { children: child });

    expect(result).toBeInstanceOf(Promise);
    expect(component).not.toHaveBeenCalled();
    await expect(result).resolves.toEqual({ wrapped: { type: 'child' } });
    expect(component).toHaveBeenCalledWith({ children: { type: 'child' } });
  });

  it('keeps the other props when awaiting a promise child', async () => {
    const result = jsx((props: object) => props, {
      title: 'Hello',
      children: Promise.resolve({ type: 'child' }),
    });

    await expect(result).resolves.toEqual({ title: 'Hello', children: { type: 'child' } });
  });

  it('resolves to the awaited children of an intrinsic element', async () => {
    const result = jsx('anything', { children: Promise.resolve({ type: 'child' }) });

    await expect(result).resolves.toEqual({ type: 'child' });
  });

  it('propagates a rejected promise child', async () => {
    const component = vi.fn(() => ({}));
    const error = new Error('boom');

    await expect(jsx(component, { children: Promise.reject(error) })).rejects.toBe(error);
    expect(component).not.toHaveBeenCalled();
  });

  it('supports thenable children', async () => {
    const thenable = { then: (resolve: (value: object) => void) => resolve({ type: 'child' }) };

    const result = jsx((props: object) => props, { children: thenable as any });

    await expect(result).resolves.toEqual({ children: { type: 'child' } });
  });
});

describe('jsxs', () => {
  it('calls a component with an array of children', () => {
    const children = [{ id: 1 }, { id: 2 }];
    const component = vi.fn((props: object) => props);

    const result = jsxs(component, { title: 'List', children });

    expect(result).not.toBeInstanceOf(Promise);
    expect(component).toHaveBeenCalledWith({ title: 'List', children });
    expect(result).toEqual({ title: 'List', children });
  });

  it('handles an empty children array synchronously', () => {
    const result = jsxs((props: object) => props, { children: [] });

    expect(result).toEqual({ children: [] });
  });

  it('returns the children array of an intrinsic element', () => {
    const children = [{ id: 1 }, { id: 2 }];

    expect(jsxs('anything', { children })).toBe(children);
  });

  it('awaits all children when at least one is a promise', async () => {
    const component = vi.fn((props: object) => props);

    const result = jsxs(component, {
      title: 'List',
      children: [{ id: 1 }, Promise.resolve({ id: 2 }), { id: 3 }],
    });

    expect(result).toBeInstanceOf(Promise);
    expect(component).not.toHaveBeenCalled();
    await expect(result).resolves.toEqual({
      title: 'List',
      children: [{ id: 1 }, { id: 2 }, { id: 3 }],
    });
  });

  it('preserves children order regardless of resolution order', async () => {
    const delayed = <T>(value: T, ms: number) =>
      new Promise<T>((resolve) => setTimeout(() => resolve(value), ms));

    const result = jsxs('anything', {
      children: [delayed({ id: 1 }, 20), delayed({ id: 2 }, 0), delayed({ id: 3 }, 10)],
    });

    await expect(result).resolves.toEqual([{ id: 1 }, { id: 2 }, { id: 3 }]);
  });

  it('propagates a rejection from any child', async () => {
    const error = new Error('boom');
    const component = vi.fn(() => ({}));

    await expect(
      jsxs(component, { children: [{ id: 1 }, Promise.reject(error)] }),
    ).rejects.toBe(error);
    expect(component).not.toHaveBeenCalled();
  });

  it('awaits promises inside nested arrays, keeping them nested', async () => {
    const result = jsxs((props: object) => props, {
      children: [{ id: 1 }, [Promise.resolve({ id: 2 }), { id: 3 }]],
    });

    expect(result).toBeInstanceOf(Promise);
    await expect(result).resolves.toEqual({ children: [{ id: 1 }, [{ id: 2 }, { id: 3 }]] });
  });

  it('awaits promises at any array depth', async () => {
    const result = jsxs('anything', {
      children: [[[Promise.resolve({ id: 1 })]], { id: 2 }],
    });

    await expect(result).resolves.toEqual([[[{ id: 1 }]], { id: 2 }]);
  });

  it('stays synchronous when nested arrays contain no promises', () => {
    const children = [{ id: 1 }, [{ id: 2 }, [{ id: 3 }]]];

    expect(jsxs('anything', { children })).toBe(children);
  });

  it('propagates a rejection from a nested array', async () => {
    const error = new Error('boom');

    await expect(
      jsxs('anything', { children: [{ id: 1 }, [Promise.reject(error)]] }),
    ).rejects.toBe(error);
  });
});

describe('Fragment', () => {
  it('is re-exported from the runtime', async () => {
    const index = await import('../src/index.js');

    expect(Fragment).toBe(index.Fragment);
  });
});
