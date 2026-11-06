import { describe, expect, it, vi } from 'vitest';
import type { Children } from '../src/index.js';

interface TextProps {
  variant?: 'title' | 'body';
  children: string;
}

function Text(props: TextProps): JSX.ComponentObject {
  return { type: 'text', variant: props.variant, text: props.children };
}

interface StackProps {
  children?: Children;
}

function Stack(props: StackProps): JSX.ComponentObject {
  return { type: 'stack', children: props.children };
}

const delay = (ms = 0) => new Promise((resolve) => setTimeout(resolve, ms));

describe('JSX syntax', () => {
  it('renders a component to its object', () => {
    expect(<Text variant="title">Hello</Text>).toEqual({
      type: 'text',
      variant: 'title',
      text: 'Hello',
    });
  });

  it('renders nested components synchronously', () => {
    const tree = (
      <Stack>
        <Text>One</Text>
        <Text>Two</Text>
      </Stack>
    );

    expect(tree).not.toBeInstanceOf(Promise);
    expect(tree).toEqual({
      type: 'stack',
      children: [
        { type: 'text', variant: undefined, text: 'One' },
        { type: 'text', variant: undefined, text: 'Two' },
      ],
    });
  });

  it('renders mapped children', () => {
    const items = ['a', 'b', 'c'];

    expect(<Stack>{items.map((item) => <Text>{item}</Text>)}</Stack>).toEqual({
      type: 'stack',
      children: items.map((text) => ({ type: 'text', variant: undefined, text })),
    });
  });

  it('does not pass the key attribute to components', () => {
    const Spy = vi.fn((props: { name: string }) => ({ ...props }));

    // @ts-ignore - key is intentionally typed as never
    const result = <Spy key="k" name="spy" />;

    expect(result).toEqual({ name: 'spy', children: undefined });
  });

  it('renders a fragment to its children', () => {
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

  it('renders an empty fragment to an empty array', () => {
    expect(<></>).toEqual([]);
  });

  it('resolves an async component', async () => {
    async function AsyncText() {
      await delay();
      return <Text>Loaded</Text>;
    }

    const result = <AsyncText />;

    expect(result).toBeInstanceOf(Promise);
    await expect(result).resolves.toEqual({ type: 'text', variant: undefined, text: 'Loaded' });
  });

  it('propagates an async child up through its parents', async () => {
    async function AsyncText() {
      await delay();
      return <Text>Loaded</Text>;
    }

    const tree = (
      <Stack>
        <Stack>
          <AsyncText />
        </Stack>
      </Stack>
    );

    expect(tree).toBeInstanceOf(Promise);
    await expect(tree).resolves.toEqual({
      type: 'stack',
      children: {
        type: 'stack',
        children: { type: 'text', variant: undefined, text: 'Loaded' },
      },
    });
  });

  it('resolves a mix of sync and async siblings in order', async () => {
    async function Slow() {
      await delay(20);
      return <Text>Slow</Text>;
    }

    async function Fast() {
      await delay(0);
      return <Text>Fast</Text>;
    }

    const tree = (
      <Stack>
        <Slow />
        <Text>Sync</Text>
        <Fast />
      </Stack>
    );

    await expect(tree).resolves.toEqual({
      type: 'stack',
      children: [
        { type: 'text', variant: undefined, text: 'Slow' },
        { type: 'text', variant: undefined, text: 'Sync' },
        { type: 'text', variant: undefined, text: 'Fast' },
      ],
    });
  });

  it('does not call a parent until its async children resolve', async () => {
    const order: string[] = [];

    function Parent(props: StackProps) {
      order.push('parent');
      return { type: 'parent', children: props.children };
    }

    async function Child() {
      await delay();
      order.push('child');
      return { type: 'child' };
    }

    await (
      <Parent>
        <Child />
      </Parent>
    );

    expect(order).toEqual(['child', 'parent']);
  });

  it('resolves async components inside fragments', async () => {
    async function AsyncText() {
      await delay();
      return <Text>Loaded</Text>;
    }

    const tree = (
      <>
        <Stack>
          <AsyncText />
        </Stack>
      </>
    );

    await expect(tree).resolves.toEqual({
      type: 'stack',
      children: { type: 'text', variant: undefined, text: 'Loaded' },
    });
  });

  it('renders the sample-style async tree', async () => {
    function List(props: { items: string[] }) {
      return <Stack>{props.items.map((item) => <Text variant="body">{item}</Text>)}</Stack>;
    }

    async function AsyncList() {
      await delay();
      return <List items={['Item 1', 'Item 2']} />;
    }

    async function Page() {
      await delay();
      return (
        <>
          <Stack>
            <AsyncList />
          </Stack>
        </>
      );
    }

    await expect(<Page />).resolves.toEqual({
      type: 'stack',
      children: {
        type: 'stack',
        children: [
          { type: 'text', variant: 'body', text: 'Item 1' },
          { type: 'text', variant: 'body', text: 'Item 2' },
        ],
      },
    });
  });

  it('propagates errors thrown by async children', async () => {
    async function Broken(): Promise<JSX.ComponentObject> {
      await delay();
      throw new Error('boom');
    }

    await expect(
      <Stack>
        <Broken />
      </Stack>,
    ).rejects.toThrow('boom');
  });

  it('resolves mapped async children as the only child', async () => {
    async function AsyncText(props: { children: string }) {
      await delay();
      return <Text>{props.children}</Text>;
    }

    await expect(<Stack>{['a', 'b'].map((t) => <AsyncText>{t}</AsyncText>)}</Stack>).resolves.toEqual({
      type: 'stack',
      children: [
        { type: 'text', variant: undefined, text: 'a' },
        { type: 'text', variant: undefined, text: 'b' },
      ],
    });
  });

  it('resolves mapped async children next to other children', async () => {
    async function AsyncText(props: { children: string }) {
      await delay();
      return <Text>{props.children}</Text>;
    }

    const tree = (
      <Stack>
        <Text>Title</Text>
        {['a', 'b'].map((t) => <AsyncText>{t}</AsyncText>)}
      </Stack>
    );

    await expect(tree).resolves.toEqual({
      type: 'stack',
      children: [
        { type: 'text', variant: undefined, text: 'Title' },
        [
          { type: 'text', variant: undefined, text: 'a' },
          { type: 'text', variant: undefined, text: 'b' },
        ],
      ],
    });
  });
});
