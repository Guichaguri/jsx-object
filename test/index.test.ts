import { describe, expect, it } from 'vitest';
import { Fragment, toText } from '../src/index.js';

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

describe('toText', () => {
  it('returns a single string as-is', () => {
    expect(toText('Hello')).toBe('Hello');
  });

  it('joins parts without a separator', () => {
    expect(toText(['Hello ', 'Ana', '!'])).toBe('Hello Ana!');
  });

  it('converts numbers to strings', () => {
    expect(toText(['You have ', 3, ' messages'])).toBe('You have 3 messages');
    expect(toText(0)).toBe('0');
  });

  it('leaves out null, undefined and booleans', () => {
    expect(toText(['a', null, undefined, true, false, 'b'])).toBe('ab');
  });

  it('returns an empty string for empty children', () => {
    expect(toText(undefined)).toBe('');
    expect(toText(null)).toBe('');
    expect(toText(false)).toBe('');
    expect(toText([])).toBe('');
  });

  it('joins nested arrays', () => {
    expect(toText(['a', ['b', ['c', 1]]])).toBe('abc1');
  });
});
