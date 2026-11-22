/** @jsxRuntime classic */
/** @jsx createElement */
/** @jsxFrag Fragment */
import { describe, expect, it, vi } from 'vitest';
import { createElement, Fragment, registerTag } from '../src/index.js';

const delay = (ms = 0) => new Promise((resolve) => setTimeout(resolve, ms));

function Text(props: { variant?: string; children: string }) {
  return { type: 'text', variant: props.variant, text: props.children };
}

function Stack(props: { children?: unknown }) {
  return { type: 'stack', children: props.children };
}

describe('classic JSX runtime', () => {
  it('renders components through createElement', () => {
    expect(<Text variant="title">Hello</Text>).toEqual({ type: 'text', variant: 'title', text: 'Hello' });
  });

  it('normalizes children like the automatic runtime', () => {
    const show = false as boolean;

    expect(
      <Stack>
        <Text>One</Text>
        {show && <Text>Hidden</Text>}
        {['a', 'b'].map((t) => <Text>{t}</Text>)}
      </Stack>,
    ).toEqual({
      type: 'stack',
      children: [
        { type: 'text', variant: undefined, text: 'One' },
        { type: 'text', variant: undefined, text: 'a' },
        { type: 'text', variant: undefined, text: 'b' },
      ],
    });
  });

  it('renders fragments', () => {
    expect(
      <>
        <Text>One</Text>
        <Text>Two</Text>
      </>,
    ).toEqual([
      { type: 'text', variant: undefined, text: 'One' },
      { type: 'text', variant: undefined, text: 'Two' },
    ]);
  });

  it('resolves async components', async () => {
    async function AsyncText() {
      await delay();
      return <Text>Loaded</Text>;
    }

    await expect(
      <Stack>
        <AsyncText />
      </Stack>,
    ).resolves.toEqual({ type: 'stack', children: { type: 'text', variant: undefined, text: 'Loaded' } });
  });

  it('renders registered tags', () => {
    const unregister = registerTag('test-box', (props) => ({ type: 'box', color: props.color }));

    try {
      expect(<test-box color="red" />).toEqual({ type: 'box', color: 'red' });
    } finally {
      unregister();
    }
  });

  it('does not pass the key to components', () => {
    const Spy = vi.fn((props: { name: string }) => ({ ...props }));

    // @ts-ignore - key is intentionally typed as never
    expect(<Spy key="k" name="spy" />).toEqual({ name: 'spy' });
  });
});
