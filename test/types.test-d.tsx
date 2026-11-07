import { describe, expectTypeOf, it } from 'vitest';
import type {
  Children,
  Component,
  FC,
  FunctionComponent,
  ObjectElement,
  ObjectOf,
} from '../src/index.js';

interface TextObject {
  type: 'text';
  text: string;
}

interface CardObject {
  type: 'card';
  items: ObjectElement<TextObject>[];
}

const Text = (props: { children: string }): TextObject => ({ type: 'text', text: props.children });

const AsyncText: Component<{ id: number }, TextObject> = async (props) => ({
  type: 'text',
  text: `#${props.id}`,
});

const Card = (props: { children: ObjectElement<TextObject>[] }): ObjectElement<CardObject> => ({
  type: 'card',
  items: props.children,
});

const Page = (): ObjectElement<CardObject> => (
  <Card>
    <Text>Hello</Text>
    <AsyncText id={1} />
  </Card>
);

describe('ObjectElement', () => {
  it('is the object or a promise of it', () => {
    expectTypeOf<ObjectElement<TextObject>>().toEqualTypeOf<TextObject | Promise<TextObject>>();
  });

  it('defaults to any object', () => {
    expectTypeOf<ObjectElement>().toExtend<object | Promise<object>>();
    expectTypeOf<object | Promise<object>>().toExtend<ObjectElement>();
  });

  it('only accepts object types', () => {
    // @ts-expect-error strings are not objects
    expectTypeOf<ObjectElement<string>>();
  });

  it('can annotate a JSX expression', () => {
    const page: ObjectElement<CardObject> = <Page />;

    expectTypeOf(page).toEqualTypeOf<CardObject | Promise<CardObject>>();
  });
});

describe('ObjectOf', () => {
  it('is the return type of a sync component', () => {
    expectTypeOf<ObjectOf<typeof Text>>().toEqualTypeOf<TextObject>();
  });

  it('unwraps the promise of an async component', () => {
    expectTypeOf<ObjectOf<typeof AsyncText>>().toEqualTypeOf<TextObject>();
  });

  it('unwraps a component that may be async', () => {
    expectTypeOf<ObjectOf<typeof Page>>().toEqualTypeOf<CardObject>();
  });

  it('gives typed access to an awaited JSX expression', async () => {
    const page: ObjectOf<typeof Page> = await <Page />;

    expectTypeOf(page.type).toEqualTypeOf<'card'>();
    // @ts-expect-error typos are caught once the result is annotated
    page.titel;
  });
});

describe('Component', () => {
  it('declares props and result types', () => {
    expectTypeOf(AsyncText).parameter(0).toEqualTypeOf<{ id: number }>();
    expectTypeOf(AsyncText).returns.toEqualTypeOf<ObjectElement<TextObject>>();
  });

  it('defaults the result to any object', () => {
    expectTypeOf<ReturnType<Component>>().toEqualTypeOf<ObjectElement>();
  });
});

describe('FunctionComponent', () => {
  const Title: FunctionComponent<{ text: string, children?: Children }, TextObject> = (props) => ({
    type: 'text',
    text: props.text,
  });

  it('infers props from the annotation', () => {
    expectTypeOf(Title).parameter(0).toEqualTypeOf<{ children?: Children, text: string }>();
  });

  it('checks the result type', () => {
    // @ts-expect-error the result must be a TextObject
    const Wrong: FunctionComponent<{}, TextObject> = () => ({ type: 'card' });
  });

  it('accepts async components', () => {
    const AsyncTitle: FunctionComponent<{ text: string }, TextObject> = async (props) => ({
      type: 'text',
      text: props.text,
    });

    expectTypeOf<ObjectOf<typeof AsyncTitle>>().toEqualTypeOf<TextObject>();
  });

  it('can be used in JSX', () => {
    const title: ObjectOf<typeof Title> = <Title text="Hello" />;

    expectTypeOf(title.text).toBeString();
    // @ts-expect-error missing required prop
    expectTypeOf(<Title />);
  });

  it('is the same type as FC and Component', () => {
    expectTypeOf<FC<{ text: string }, TextObject>>().toEqualTypeOf<
      FunctionComponent<{ text: string }, TextObject>
    >();
    expectTypeOf<Component<{ text: string }, TextObject>>().toEqualTypeOf<
      FunctionComponent<{ text: string }, TextObject>
    >();
    expectTypeOf<FC>().toEqualTypeOf<FunctionComponent>();
  });
});

describe('JSX.ElementType', () => {
  it('accepts components returning objects, arrays, null, promises or JSX', () => {
    const Obj = () => ({ a: 1 });
    const Arr = () => [{ a: 1 }];
    const Nul = () => null;
    const Async = async () => ({ a: 1 });
    const Wraps = () => <Obj />;

    expectTypeOf([<Obj />, <Arr />, <Nul />, <Async />, <Wraps />]).toBeArray();
  });

  it('rejects components returning primitives', () => {
    const Str = () => 'text';
    const Num = () => 1;

    // @ts-expect-error strings are rejected
    expectTypeOf(<Str />);
    // @ts-expect-error numbers are rejected
    expectTypeOf(<Num />);
  });

  it('checks plain children against the children prop', () => {
    // @ts-expect-error a non-JSX child of the wrong type is rejected
    expectTypeOf(<Card>{[{ type: 'nope' }]}</Card>);
  });
});
