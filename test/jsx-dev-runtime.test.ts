import { describe, expect, it, vi } from 'vitest';
import * as devRuntime from '../src/jsx-dev-runtime.js';
import * as runtime from '../src/jsx-runtime.js';

describe('jsx-dev-runtime', () => {
  it('re-exports the production runtime', () => {
    expect(devRuntime.jsx).toBe(runtime.jsx);
    expect(devRuntime.jsxs).toBe(runtime.jsxs);
    expect(devRuntime.Fragment).toBe(runtime.Fragment);
  });

  it('jsxDEV behaves like jsx for components', () => {
    const component = vi.fn((props: object) => ({ type: 'box', ...props }));

    const result = devRuntime.jsxDEV(component, { title: 'Hello', children: { id: 1 } });

    expect(component).toHaveBeenCalledWith({ title: 'Hello', children: { id: 1 } });
    expect(result).toEqual({ type: 'box', title: 'Hello', children: { id: 1 } });
  });

  it('jsxDEV returns the children of intrinsic elements', () => {
    const child = { id: 1 };

    expect(devRuntime.jsxDEV('anything', { children: child })).toBe(child);
  });

  it('jsxDEV awaits promise children', async () => {
    const result = devRuntime.jsxDEV((props: object) => props, {
      children: Promise.resolve({ id: 1 }),
    });

    await expect(result).resolves.toEqual({ children: { id: 1 } });
  });

  it('jsxDEV awaits promises in static children like jsxs', async () => {
    const result = devRuntime.jsxDEV(
      (props: object) => props,
      { children: [{ id: 1 }, Promise.resolve({ id: 2 })] },
      undefined,
      true,
    );

    await expect(result).resolves.toEqual({ children: [{ id: 1 }, { id: 2 }] });
  });

  it('jsxDEV awaits promises in dynamic children arrays, like jsx', async () => {
    const result = devRuntime.jsxDEV(
      (props: object) => props,
      { children: [{ id: 1 }, Promise.resolve({ id: 2 })] },
      undefined,
      false,
    );

    await expect(result).resolves.toEqual({ children: [{ id: 1 }, { id: 2 }] });
  });
});
