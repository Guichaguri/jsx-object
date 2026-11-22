# jsx-object

[![npm version](https://img.shields.io/npm/v/jsx-object)](https://www.npmjs.com/package/jsx-object)
[![bundle size](https://img.shields.io/bundlephobia/minzip/jsx-object)](https://bundlephobia.com/package/jsx-object)
[![license](https://img.shields.io/npm/l/jsx-object)](/LICENSE)

A tiny, dependency-free JSX runtime that turns JSX into plain JavaScript objects.

```tsx
// Write React-like components that return an object
const Post = (props: PostProps) => {
  return { type: 'post', title: props.title };
}

// Use JSX to build the object
console.log(<Post title="Hello World!" />)
// { type: 'post', title: 'Hello World!' }
```

There is no virtual DOM, no rendering step and no reconciliation: a JSX expression evaluates directly to whatever your components return.

- [Why?](#why)
- [Getting Started](#getting-started)
- [Examples](#examples)
- [TypeScript](#typescript)
- [Behavior Notes](#behavior-notes)
- [Upgrading from 1.x](#upgrading-from-1x)
- [Compatibility](#compatibility)
- [Contributing](#contributing)

## Why?

JSX is a great syntax for describing trees, and trees aren't only HTML. Use jsx-object when you want to build structured data with composable components, for example:

- **Server-driven UI**: build the JSON payloads your mobile or web clients render.
- **CMS and JSON templates**: assemble documents from reusable, typed pieces.
- **Configuration DSLs**: describe pipelines, forms or workflows declaratively.

Compared to similar tools:

- **React** renders elements into a UI. jsx-object has no rendering step: the result *is* the data.
- **[Kita Html](https://html.kitajs.org/)** turns JSX into HTML strings. jsx-object turns JSX into objects.

## Getting Started

First, install the library:

```shell
npm install jsx-object
```

Then add the following JSX configuration to your `tsconfig.json`:

```json
{
  "compilerOptions": {
    "jsx": "react-jsx",
    "jsxImportSource": "jsx-object"
  }
}
```

### Other build tools

Tools that read `tsconfig.json`, such as Vite, esbuild, tsx and Bun, pick this up automatically. Otherwise, configure the automatic JSX runtime with `jsx-object` as the import source:

<details>
<summary>esbuild</summary>

```shell
esbuild app.tsx --jsx=automatic --jsx-import-source=jsx-object
```

</details>

<details>
<summary>Babel</summary>

```json
{
  "plugins": [
    ["@babel/plugin-transform-react-jsx", { "runtime": "automatic", "importSource": "jsx-object" }]
  ]
}
```

</details>

<details>
<summary>SWC</summary>

```json
{
  "jsc": {
    "transform": {
      "react": { "runtime": "automatic", "importSource": "jsx-object" }
    }
  }
}
```

</details>

To use jsx-object in only some files, add this comment to the top of each file instead:

```tsx
/** @jsxImportSource jsx-object */
```

> [!NOTE]
> jsx-object doesn't declare a global `JSX` namespace, so it can share a TypeScript project with React or other JSX libraries. Each file uses the JSX types of its own `jsxImportSource`.

#### Classic runtime

Tools that only support the classic JSX runtime, which compiles JSX to `createElement` calls, can use [`createElement`](#createelement) and `Fragment` as the factories:

```json
{
  "compilerOptions": {
    "jsx": "react",
    "jsxFactory": "createElement",
    "jsxFragmentFactory": "Fragment"
  }
}
```

Each file then imports them, since the compiled code calls them directly:

```tsx
import { createElement, Fragment } from 'jsx-object';
```

TypeScript reads the JSX types from `createElement.JSX`, which forwards to the exported `JSX` namespace, so [extensions](#extending-the-jsx-types) apply in both runtimes. With Babel, set `"runtime": "classic"`, `"pragma": "createElement"` and `"pragmaFrag": "Fragment"`, or use `/** @jsx createElement */` and `/** @jsxFrag Fragment */` comments in each file.

## Examples

### Components

Compose any number of components together.

```tsx
const Paragraph = (props: ParagraphProps) => {
  return { type: 'paragraph', content: props.children, variant: props.variant };
}

const Card = (props: CardProps) => {
  return { type: 'card', paragraphs: props.children };
}

const Post = (props: PostProps) => {
  return (
    <Card>
      <Paragraph variant="h1">{props.title}</Paragraph>
      <Paragraph>{props.description}</Paragraph>
      <Paragraph>Share</Paragraph>
    </Card>
  );
}

console.log(<Post title="Hello World!" description="Lorem Ipsum" />);
// {
//    type: 'card',
//    paragraphs: [
//      { type: 'paragraph', content: 'Hello World!', variant: 'h1' },
//      { type: 'paragraph', content: 'Lorem Ipsum', variant: undefined },
//      { type: 'paragraph', content: 'Share', variant: undefined },
//    ]
// }
```

### Async Components

Components can be async. If any component in the tree is async, the whole result becomes a Promise.

```tsx
const Product = async (props: { id: number }) => {
  const product = await fetchProduct(props.id);

  return <Paragraph>{product.name}</Paragraph>;
};

// The await is necessary here
console.log(await <Product id={32} />)
```

Async siblings are resolved in parallel, and the result keeps their original order.

Mapped lists of async components are awaited too, wherever they appear among the children:

```tsx
<List>
  <Paragraph>Products</Paragraph>
  {ids.map((id) => <Product id={id} />)}
</List>
```

### Children

Children can be either a single object or an array of objects. Components can also accept text children, as shown in [Text](#text).

Before children reach a component, they're cleaned up so they can go straight into your JSON:

- Nested arrays, such as mapped lists or components that return a fragment, are flattened into a single array.
- `null`, `undefined`, `true` and `false` are dropped, so conditionals like `{show && <Badge />}` leave nothing behind. Other values, such as `0` and `''`, are kept.
- A single child that's empty, such as `{show && <Badge />}` when `show` is false, is removed, so `children` is `undefined`.

```tsx
const data = (
  <List>
    <Paragraph>Products</Paragraph>
    {ids.map((id) => <Product id={id} />)}
    {isAdmin && <Paragraph>Edit</Paragraph>}
  </List>
)

// children: [Paragraph, Product, Product, ...], with no nested array and no `false`
```

A single child stays as-is, not wrapped in an array:

```tsx
const data = (
  <Paragraph>Hello</Paragraph>
)

console.log(data);
// { type: 'paragraph', content: 'Hello', variant: undefined }
```

A fragment (`<>...</>`) returns its children, following the same rules, so several children become an array:

```tsx
const data = (
  <>
    <Paragraph>Hello</Paragraph>
    <Paragraph>World</Paragraph>
  </>
)

console.log(data);
// [
//   { type: 'paragraph', content: 'Hello', variant: undefined },
//   { type: 'paragraph', content: 'World', variant: undefined },
// ]
```

Like a component's children, a fragment with a single child returns that child as-is, and an empty fragment returns an empty array. The shape follows the children you write, not how many are left after empty ones are dropped: `<><A />{show && <B />}</>` is an array even when `show` is false. If you always need an array, write one directly, as in `[<A />]`.

### Lowercase Tags

Lowercase tags, such as `<box>`, have no meaning of their own: jsx-object doesn't know what object you want them to become, so rendering one throws until you register a handler for it. A tag handler works like a component, receiving the props with normalized and awaited children:

```tsx
import { registerTag } from 'jsx-object';

registerTag('box', (props) => ({ type: 'box', color: props.color, children: props.children }));

const data = (
  <box color="red">
    <Paragraph>Hello</Paragraph>
  </box>
)

console.log(data);
// { type: 'box', color: 'red', children: { type: 'paragraph', content: 'Hello', variant: undefined } }
```

To handle every tag that has no handler of its own, register a default handler, which also receives the tag name:

```tsx
import { registerDefaultTag } from 'jsx-object';

registerDefaultTag((name, props) => ({ type: name, ...props }));
```

A few rules keep the registry predictable:

- Tags must be declared in `JSX.IntrinsicElements`, as shown in [Extending the JSX types](#extending-the-jsx-types), which also types the handler's props.
- A tag can only be registered once. Registering it again throws, so two libraries can't silently replace each other's tags.
- Setting the default handler again replaces the previous one. It's meant to be set by the app; libraries should only register their own tags.
- Both functions return a function that undoes the registration, which is useful in tests. Undoing a default handler restores the previous one.
- The registry is shared by every copy of jsx-object in the process, including its ESM and CommonJS builds. Register handlers before rendering, since elements are evaluated as soon as they're created.

### Text

Text with interpolated values, such as `Hello {name}!`, reaches the component as an array of parts: `['Hello ', 'Ana', '!']`. Type the `children` prop as `TextChildren` and convert it with `toText`:

```tsx
import { toText, type TextChildren } from 'jsx-object';

const Label = (props: { children: TextChildren }) => {
  return { type: 'label', text: toText(props.children) };
};

console.log(<Label>Hello {name}, you have {count} messages</Label>);
// { type: 'label', text: 'Hello Ana, you have 3 messages' }
```

`toText` joins the parts without a separator, converts numbers and bigints to strings, and leaves out `null`, `undefined` and booleans, so conditionals such as `{isVip && ' (VIP)'}` work too. Any other value, such as an object, throws a `TypeError` instead of becoming `'[object Object]'`.

Children are never joined automatically, because an array of strings can also be data, such as a list of tags. Only components that call `toText` get a single string.

## TypeScript

jsx-object exports a few helper types:

```tsx
import type { Children, FC, JSX, ObjectElement, ObjectOf, PropsWithChildren, TextChildren } from 'jsx-object';

// ObjectElement<T>: the result of a JSX element, the object T or a promise of it
const card: ObjectElement<CardObject> = <Card />;

// ObjectOf<typeof C>: the object a component produces, unwrapped if it's async
const product: ObjectOf<typeof Product> = await <Product id={32} />;

// Children: anything that can be passed as children, including promises, arrays and conditionals
interface CardProps {
  title: string;
  children?: Children;
}

// TextChildren: text, numbers and conditionals, to be joined with toText (see Text)
interface LabelProps {
  children: TextChildren;
}

// PropsWithChildren<T>: adds an optional `children` prop to T
type SectionProps = PropsWithChildren<{ title: string }>;

// FC<T, R>: a function component that receives T plus children, and produces R
const Section: FC<{ title: string, children: Children }, SectionObject> = (props) => {
  return { type: 'section', title: props.title, content: props.children };
};
```

`FC` is shorthand for `FunctionComponent`, so use whichever name you prefer. Like React's, `FunctionComponent` is an interface, so you can extend it with `declare module 'jsx-object'`.

### Typing results

TypeScript gives every JSX expression the same type, `JSX.Element`, no matter which component it renders, so it can't infer that `<Post />` produces a `PostObject`. Like React's `ReactElement<P>`, jsx-object solves this with annotations: `JSX.Element` is intentionally `any`, and you declare the type you expect.

```tsx
interface PostObject {
  type: 'post';
  title: string;
}

// Annotate with the object type
const post: PostObject = <Post title="Hello World!" />;

// Or derive it from the component, so it stays in sync with what the component returns
const derived: ObjectOf<typeof Post> = <Post title="Hello World!" />;

// Await async trees first, or use ObjectElement<T> to keep the promise
const product: ObjectOf<typeof Product> = await <Product id={32} />;
const pending: ObjectElement<ProductObject> = <Product id={32} />;
```

Once annotated, the result is fully typed: `post.title` is a `string`, and typos such as `post.titel` are errors.

Annotate component return types and `children` props the same way:

```tsx
interface CardProps {
  children: ObjectElement<TextObject>[];
}

const Card = (props: CardProps): ObjectElement<CardObject> => {
  return { type: 'card', items: props.children };
};

const Page = (): ObjectElement<CardObject> => (
  <Card>
    <Text>Hello</Text>
    <Text>World</Text>
  </Card>
);
```

A single JSX child is passed as-is, not wrapped in an array. If a component accepts one or many children, type the prop as `ObjectElement<T> | ObjectElement<T>[]`.

> [!WARNING]
> Annotations are not checked against the component. TypeScript accepts `const post: ProductObject = <Post />`, reading properties from an unannotated result, and reading properties from an async tree without awaiting it. `ObjectOf<typeof Component>` avoids picking the wrong type by hand. To catch unannotated results, enable typescript-eslint's [`no-unsafe-member-access`](https://typescript-eslint.io/rules/no-unsafe-member-access/) rule.

### Validating components

With TypeScript 5.1 or later, every component is checked through `JSX.ElementType`: it must return an object, an array, `null`, a promise of one of those, or JSX. Components returning strings or numbers are rejected.

### Extending the JSX types

The `JSX` namespace is exported by `jsx-object`, not declared globally. Import it to use its types:

```tsx
import type { JSX } from 'jsx-object';

const result: JSX.ComponentObject = <Post title="Hello World!" />;
```

Extend it with a `declare module` block from any module file in your project:

```tsx
import type { Children } from 'jsx-object';

declare module 'jsx-object' {
  namespace JSX {
    // Declare custom tags, with type-checked props
    interface IntrinsicElements {
      box: { color?: string; children?: Children };
    }

    // Accept an extra prop on every component
    interface IntrinsicAttributes {
      testId?: string;
    }

    // Require every component to return an object with a `type`
    interface ComponentObject {
      type: string;
    }
  }
}
```

`ComponentObject` is empty by default. Members added to it apply to every component, whether it's sync or async, or returns another component's JSX. They also become the default of `ObjectElement` and `FunctionComponent`. Use optional members to allow a property without requiring it. If a member uses literal types, such as `type: 'text' | 'stack'`, components must return those values `as const`, since TypeScript otherwise widens them to `string`.

You can add members and new types, but you can't redefine existing ones: `JSX.Element` and `JSX.ElementType` are fixed, and existing interface members, such as `key`, keep their types.

## Behavior Notes

### Errors

If an async component throws or rejects, the whole tree rejects with that error, and parent components are never called.

### No built-in tags

There are no intrinsic elements such as `<div>`. Rendering a lowercase tag throws unless you [register a handler](#lowercase-tags) for it, and TypeScript rejects it unless you declare it yourself, as shown in [Extending the JSX types](#extending-the-jsx-types).

### `key` is reserved

The JSX transform strips the `key` prop before it reaches your components. If you need a similar prop, use another name such as `id`.

### `createElement`

When a `key` comes after a spread, as in `<Item {...props} key="a" />`, the JSX transform calls `createElement` from `jsx-object` instead of the runtime. It's exported for that case and for the [classic runtime](#classic-runtime), and works like React's, so you can also use it to build elements without JSX:

```tsx
import { createElement } from 'jsx-object';

const data = createElement(Paragraph, { variant: 'title' }, 'Hello');
// same as <Paragraph variant="title">Hello</Paragraph>
```

Children passed as arguments replace `props.children`: a single child is passed as-is, and several are passed as an array. The `key` prop is removed, like with JSX.

## Upgrading from 1.x

### Children are flattened

Children used to reach components exactly as written. They're now [normalized](#children): nested arrays are flattened, and `null`, `undefined` and booleans are dropped. This changes the output of any tree that mixes mapped lists with other children, uses conditionals, or contains components returning fragments or `null`. A component that relied on the nested structure, such as treating each mapped list as a group, should now take the list as a regular prop instead. The `Children` type also accepts booleans now.

### Lowercase tags throw by default

A lowercase tag used to return its children. It now throws unless a handler is [registered](#lowercase-tags) for it. To keep the old behavior, register a default handler that passes the children through:

```tsx
registerDefaultTag((name, props) => props.children);
```

### `JSX` is no longer global

In 1.x, jsx-object declared `JSX` as a global namespace. It's now exported from the package, which changes two things:

1. **Extensions move from `declare global` to `declare module 'jsx-object'`.** The block inside stays the same. A leftover `declare global { namespace JSX { ... } }` still compiles, but no longer affects jsx-object. Custom tags become type errors, and `ComponentObject` members stop being enforced without any error, so search your project for `declare global` when upgrading.
2. **`JSX.Element`, `JSX.ComponentObject` and other `JSX` types need an import:** `import type { JSX } from 'jsx-object'`. Without it, TypeScript reports "Cannot find namespace 'JSX'". If the project also has `@types/react` 18 installed, the bare name resolves to React's global `JSX` instead, without an error.

Components, props, `ObjectElement`, `ObjectOf` and the other exported types are not affected by this change.

### `Component` is removed

The `Component` type was an alias of `FunctionComponent`. Replace it with `FunctionComponent` or its shorthand `FC`, which take the same type parameters.

## Compatibility

- Ships both ESM and CommonJS builds, with type declarations for each.
- No runtime dependencies. Runs in any ES2018+ environment.
- Requires TypeScript 4.1 or later, for `jsxImportSource` support. Component validation requires TypeScript 5.1 or later.

## Contributing

```shell
npm install
npm test        # run the unit tests
npm run build   # build the package into dist/
```

## Credits

This library was based on the concept of [Kita Html](https://html.kitajs.org/).

## License

[MIT](./LICENSE)
