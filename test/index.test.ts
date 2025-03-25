import { describe, expect, it } from "vitest";
import { edgeTags } from "../src";
import edge from "edge.js";
import type { Edge } from "edge.js";
import { ComponentTagCompiler } from "../src/component-tag-compiler";

edge.use(edgeTags);

edge.registerTemplate("button", {
  template: `<button {{ $props.toAttrs() }}>{{ $slots.main() }}</button>`,
});

edge.registerTemplate("diskName::button", {
  template: `<button {{ $props.toAttrs() }}>{{ $slots.main() }}</button>`,
});

edge.registerTemplate("card", {
  template: `<div {{ $props.toAttrs() }}>
  @if($slots.header)
  <div class="card-header">{{ $slots.header() }}</div>
  @endif

  <div class="card-body">{{ $slots.main() }}</div>

  @if($slots.footer)
  <div class="card-footer">Footer</div>
  @endif
</div>`,
});

class FakeCompiler extends ComponentTagCompiler {
  components: string[];

  constructor(edge: Edge, components: string[]) {
    super(edge);
    this.components = components;
  }

  protected override getEdgeComponents(): string[] {
    return this.components;
  }
}

const compiler = FakeCompiler.make(edge);

describe("edge-tags", () => {
  it("slots can be compiled", () => {
    const result = compiler.compileSlots(`<x-slot name="foo">
Foo
</x-slot>`);
    const expected = `@slot("foo")\n\nFoo\n\n@end`;

    expect(result.trim()).toBe(expected);
  });

  it("slots can access shared state", () => {
    const result =
      compiler.compileSlots(`<x-slot name="foo" props="componentState">
Foo
</x-slot>`);
    const expected = `@slot("foo", componentState)\n\nFoo\n\n@end`;

    expect(result.trim()).toBe(expected);
  });

  it("self closing tag", () => {
    const result = compiler.compileTags(`<x-button />`);
    const expected = `@component("button", {  })\n@end`;

    expect(result.trim()).toBe(expected);
  });

  it("self closing tag with attributes", () => {
    const result = compiler.compileTags(
      `<x-button type="submit" :color="red" size="{{ size }}" />`,
    );
    const expected = `@component("button", { "type": "submit", "color": red, "size": \`\${size }\` })\n@end`;

    expect(result.trim()).toBe(expected);
  });

  it("self closing tag with attributes and end tag", () => {
    const result = compiler.compileTags(
      `<x-button type="submit" :color="red" size="{{ size }}" />`,
    );
    const expected = `@component("button", { "type": "submit", "color": red, "size": \`\${size }\` })\n@end`;

    expect(result.trim()).toBe(expected);
  });

  it("nested default component", () => {
    const result = compiler.compileTags(`<div><x-card /></div>`);
    const expected = `<div>\n@component("card", {  })\n@end\n</div>`;

    expect(result.trim()).toBe(expected);
  });

  it("opening tag", () => {
    const result = compiler.compileTags(
      `<x-button type="submit" :color="red" size="{{ size }}">Hello</x-button>`,
    );
    const expected = `@component("button", { "type": "submit", "color": red, "size": \`\${size }\` })
Hello
@end`;

    expect(result.trim()).toBe(expected);
  });

  it("edge", () => {
    const result = edge.renderRawSync(
      `<x-button class="text-white">Submit</x-button>`,
    );
    const expected = `<button class="text-white">Submit</button>`;

    expect(result.trim()).toBe(expected);
  });

  it("edge 2", () => {
    const result = edge.renderRawSync(
      `<x-card class="shadow-md">
<x-slot name="header">
Header
</x-slot>

Body

<x-slot name="footer">
Footer
</x-slot>
</x-card>`,
    );
    const expected = `<div class="shadow-md">
  <div class="card-header">
Header
</div>

  <div class="card-body">

Body

</div>

  <div class="card-footer">Footer</div>
</div>`;

    expect(result.trim()).toBe(expected);
  });

  it("edge 3", () => {
    const result = edge.renderRawSync(
      `<x-button class="{{ !dark ? 'text-white' : 'text-black' }}" :size="size" readonly>Submit</x-button>`,
      {
        dark: false,
        size: "lg",
      },
    );
    const expected = `<button class="text-white" size="lg" readonly>Submit</button>`;

    expect(result.trim()).toBe(expected);
  });

  it("edge 4", () => {
    const result = edge.renderRawSync(
      `<x-button class="{{ !dark ? 'text-white' : 'text-black' }}" :size="size" readonly>Submit</x-button>`,
      {
        dark: true,
        size: "lg",
      },
    );
    const expected = `<button class="text-black" size="lg" readonly>Submit</button>`;

    expect(result.trim()).toBe(expected);
  });

  it("disks - self closed", async () => {
    const compiler = new FakeCompiler(edge, ["diskName::button"]);

    const input = compiler.compileTags("<x-diskName::button />");
    const expected = `@component("diskName::button", {  })\n@end`;

    expect(input.trim()).toBe(expected);
  });

  it("disks", async () => {
    const compiler = new FakeCompiler(edge, ["diskName::button"]);

    const input = compiler.compileTags(
      "<x-diskName::button> Test </x-diskName::button>",
    );
    const expected = `@component("diskName::button", {  })\n Test \n@end`;

    expect(input.trim()).toBe(expected);
  });

  it("whitespace", async () => {
    const input = compiler.compileTags("<x-button> Test </x-button>");
    const expected = `@component("button", {  })\n Test \n@end`;
    expect(input.trim()).toBe(expected);

    const input2 = compiler.compileTags("a<x-button> Test </x-button>");
    const expected2 = `a\n@component("button", {  })\n Test \n@end`;

    expect(input2.trim()).toBe(expected2);

    const input3 = compiler.compileTags("<x-button> Test </x-button>a");
    const expected3 = `@component("button", {  })\n Test \n@end\na`;
    expect(input3.trim()).toBe(expected3);

    const input4 = compiler.compileTags("a<x-button> Test </x-button>a");
    const expected4 = `a\n@component("button", {  })\n Test \n@end\na`;
    expect(input4.trim()).toBe(expected4);

    const input5 = compiler.compileTags("a<x-button />b");
    const expected5 = `a\n@component("button", {  })\n@end\nb`;
    expect(input5.trim()).toBe(expected5);
  });

  it("escape attribute binding", async () => {
    const input = compiler.compileTags(`<x-input ::class="bg-red-500" />`);
    const expected = `@component("input", { ":class": "bg-red-500" })\n@end`;
    expect(input.trim()).toBe(expected);

    const input2 = compiler.compileTags(`<x-input ::class="{{ 'foo' }}" />`);
    const expected2 = `@component("input", { ":class": \`\${'foo' }\` })\n@end`;
    expect(input2.trim()).toBe(expected2);
  });
});
