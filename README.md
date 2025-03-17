# edge-tags

[![npm version](https://img.shields.io/npm/v/edge-tags?color=yellow)](https://npmjs.com/package/edge-tags)
[![npm downloads](https://img.shields.io/npm/dm/edge-tags?color=yellow)](https://npm.chart.dev/edge-tags)

Seamlessly transpile HTML-like tag syntax `<x-badge color="primary" />` into native Edge.js components.

## Installation & Setup

Install the package using your preferred package manager:

```sh
pnpm install edge-tags
# or
npm install edge-tags
# or
yarn add edge-tags
```

Register the plugin with your Edge.js instance:

```js
import { Edge } from "edge.js";
import { edgeTags } from "edge-tags";

const edge = Edge.create();

/**
 * Register the edge-tags plugin
 */
edge.use(edgeTags);
```

## How It Works

### Example Transformation

When you write HTML-style custom elements:

```edge
<x-button class="bg-white" a="b" :foo="bar" baz="{{ 1 + 2 }}">
  Hello
</x-button>

<x-card>
    <x-card.title>
        Hello
    </x-card.title>

    <x-card.body>
        World
    </x-card.body>

    <x-slot name="footer">
        Footer Content
    </x-slot>
</x-card>

<x-diskName::avatar  />
```

Edge-tags automatically converts it to Edge.js component syntax:

```edge
@component('button', { class: 'bg-white', a: 'b', foo: bar, baz: `${1 + 2}` })
  Hello
@end

@component('card')
    @component('card/title')
        Hello
    @end

    @component('card/body')
        World
    @end

    @slot('footer')
        Footer Content
    @end
@end

@component('diskName::avatar')
@end
```

### Intelligent Component Resolution

Edge-tags smartly resolves your component paths based on file structure:

- `button.edge` → References as "button"
- `components/button.edge` → References as "components/button"
- `components/button/index.edge` → References as "components/button/index"

This automatic resolution eliminates path management headaches and ensures your components are always correctly referenced.

## Development

<details>

<summary>Local Development Guide</summary>

- Clone this repository
- Install latest LTS version of [Node.js](https://nodejs.org/en/)
- Enable [Corepack](https://github.com/nodejs/corepack) using `corepack enable`
- Install dependencies using `pnpm install`
- Run interactive tests using `pnpm dev`

</details>

## License

Published under the [MIT](https://github.com/KABBOUCHI/edge-tags/blob/main/LICENSE) license.
Made by [community](https://github.com/KABBOUCHI/edge-tags/graphs/contributors) 💛
<br><br>
<a href="https://github.com/KABBOUCHI/edge-tags/graphs/contributors">
<img src="https://contrib.rocks/image?repo=KABBOUCHI/edge-tags" />
</a>
