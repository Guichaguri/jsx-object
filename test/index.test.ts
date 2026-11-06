import { describe, expect, it } from 'vitest';
import { Fragment } from '../src/index.js';

describe('Fragment', () => {
  it('returns its children', () => {
    const children = [{ id: 1 }, { id: 2 }];

    expect(Fragment({ children })).toBe(children);
  });

  it('returns a single child as-is', () => {
    const child = { id: 1 };

    expect(Fragment({ children: child })).toBe(child);
  });

  it('returns an empty array when there are no children', () => {
    expect(Fragment({})).toEqual([]);
  });

  it('returns an empty array when children are null', () => {
    expect(Fragment({ children: null })).toEqual([]);
  });
});
