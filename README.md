# edge-tags

[![npm version](https://img.shields.io/npm/v/edge-tags?color=yellow)](https://npmjs.com/package/edge-tags)
[![npm downloads](https://img.shields.io/npm/dm/edge-tags?color=yellow)](https://npm.chart.dev/edge-tags)

Transpile `<x-badge color="primary" />` into Edge.js components

## Usage

Install the package:

```sh
pnpm install edge-tags
```

The next step is to register the plugin with Edge.:

```js
import { Edge } from "edge.js";
import { edgeTags } from "edge-tags";

const edge = Edge.create();

/**
 * Register the plugin
 */
edge.use(edgeTags);
```

## Example

HTML x-tags like:

```edge
<x-button color="primary">
    Submit
</x-button>
```

will transform into Edge.js component syntax:

```edge
@component('components/button', { color: 'primary' })
    Submit
@end
```

## Development

<details>

<summary>local development</summary>

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
