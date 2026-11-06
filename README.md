# jsx-object

[![npm version](https://img.shields.io/npm/v/jsx-object)](https://www.npmjs.com/package/jsx-object)
[![bundle size](https://img.shields.io/bundlephobia/minzip/jsx-object)](https://bundlephobia.com/package/jsx-object)
[![license](https://img.shields.io/npm/l/jsx-object)](./LICENSE)

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
> jsx-object declares a global `JSX` namespace, so it can't share a TypeScript project with other libraries that also declare one, such as `@types/react` 18.

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

Children can be either a single object or an array of objects.

```tsx
const data = (
  <Paragraph>Hello</Paragraph>
)

console.log(data);
// { type: 'paragraph', content: 'Hello', variant: undefined }
```

Use a fragment (`<>...</>`) to return several objects as an array:

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

## TypeScript

jsx-object exports a few helper types:

```tsx
import type { Children, Component, PropsWithChildren } from 'jsx-object';

// Children: anything that can be passed as children, including promises and arrays
interface CardProps {
  title: string;
  children?: Children;
}

// PropsWithChildren<T>: adds an optional `children` prop to T
type SectionProps = PropsWithChildren<{ title: string }>;

// Component<T>: a component function that receives T plus children
const Section: Component<{ title: string }> = (props) => {
  return { type: 'section', title: props.title, content: props.children };
};
```

### Typing results

TypeScript can't infer what a component returns from a JSX expression: every JSX expression has the type `JSX.Element`, which is `JSX.ComponentObject | Promise<JSX.ComponentObject>`. `JSX.ComponentObject` is a loose object type whose properties are all `any`, so reading properties from a result compiles without type checking, typos included. Cast the result to the type you expect:

```tsx
interface PostObject {
  type: 'post';
  title: string;
}

const post = <Post title="Hello World!" /> as PostObject;

// For async trees, await first
const product = (await <Product id={32} />) as ProductObject;
```

### Extending the JSX types

The `JSX` namespace is global, so `JSX.Element` and `JSX.ComponentObject` are available without an import. Extend it with a `declare global` block from any module file in your project:

```tsx
export {};

declare global {
  namespace JSX {
    // Declare custom tags, with type-checked props
    interface IntrinsicElements {
      box: { color?: string };
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

Members added to `ComponentObject` apply to every component, whether it's sync or async, or returns another component's JSX. Use optional members to allow a property without requiring it. If a member uses literal types, such as `type: 'text' | 'stack'`, components must return those values `as const`, since TypeScript otherwise widens them to `string`.

You can add members and new types, but you can't redefine existing ones: `JSX.Element` is fixed, `ComponentObject` keeps its `any` index signature, and existing interface members, such as `key`, keep their types.

## Behavior Notes

### Errors

If an async component throws or rejects, the whole tree rejects with that error, and parent components are never called.

### No built-in tags

There are no intrinsic elements such as `<div>`. A lowercase tag simply returns its children, and TypeScript rejects it unless you declare it yourself, as shown in [Extending the JSX types](#extending-the-jsx-types).

### `key` is reserved

The JSX transform strips the `key` prop before it reaches your components. If you need a similar prop, use another name such as `id`.

## Compatibility

- Ships both ESM and CommonJS builds, with type declarations for each.
- No runtime dependencies. Runs in any ES2018+ environment.
- Requires TypeScript 4.1 or later, for `jsxImportSource` support.

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
