import type { Edge } from "edge.js";

export class ComponentTagCompiler {
  constructor(private edge: Edge) {}

  static make(edge: Edge) {
    return new ComponentTagCompiler(edge);
  }

  compile(value: string): string {
    value = this.compileSlots(value);
    return this.compileTags(value);
  }

  compileSlots(value: string): string {
    const pattern =
      /<x-slot(?::(\w*))?(?<attributes>(?:\s+[:@]?[\w-:.]+(?:=(?:"[^"]*"|'[^']*'|\{\{[^}]*\}\}|[^'"=<>\s]+))?)*)\s*>/g;

    value = value.replace(pattern, (_match, slotName, attributeString) => {
      const attributes = this.getAttributesFromAttributeString(
        attributeString || "",
      );

      const name = slotName ? `"${slotName}"` : attributes.name;

      if (attributes.props) {
        return `@slot(${name}, ${JSON.parse(attributes.props)})\n`;
      }

      return `@slot(${name})\n`;
    });

    return value.replaceAll(/<\/\s*x[-:]slot[^>]*>/g, "\n@end");
  }

  compileTags(value: string): string {
    value = this.compileSelfClosingTags(value);
    value = this.compileOpeningTags(value);
    value = this.compileClosingTags(value);

    return value;
  }

  private compileSelfClosingTags(value: string): string {
    const pattern =
      /<\s*x[-:]([\w-:.]*)\s*(?<attributes>(?:\s+[:@]?[\w-:.]+(?:=(?:"[^"]*"|'[^']*'|\{\{[^}]*\}\}|[^'"=<>\s]+))?)*)\s*\/>/g;
    value = value.replace(pattern, (_match, tagName, attributeString) => {
      const attributes = this.getAttributesFromAttributeString(attributeString);
      return this.componentString(tagName, attributes) + "\n@end\n";
    });

    return value;
  }

  private compileOpeningTags(value: string): string {
    const pattern =
      /<\s*x[-:]([\w-:.]*)\s*(?<attributes>(?:\s+[:@]?[\w-:.]+(?:=(?:"[^"]*"|'[^']*'|\{\{[^}]*\}\}|[^'"=<>\s]+))?)*)\s*>/g;

    value = value.replace(pattern, (_match, tagName, attributeString) => {
      const attributes = this.getAttributesFromAttributeString(attributeString);
      return this.componentString(tagName, attributes) + "\n";
    });

    return value;
  }

  private compileClosingTags(value: string): string {
    return value.replace(/<\/\s*x[-:][\w\-:.]*\s*>/g, "\n@end\n");
  }

  protected getEdgeComponents(diskName?: string) {
    return (
      this.edge.loader
        .listComponents()
        .find((l) =>
          diskName
            ? l.diskName === diskName
            : !l.diskName || l.diskName === "default",
        )
        ?.components.map((c) => c.componentName) || []
    );
  }

  protected componentString(
    tagName: string,
    attributes: Record<string, any> = {},
  ): string {
    const [_, diskName, componentName] =
      tagName.match(/^(?:(\w+)::)?([\w\-:.]*)$/) || [];
    if (!componentName) {
      throw new Error(`Invalid component tag: ${tagName}`);
    }

    const prefix = diskName ? `${diskName}::` : "";

    const components = this.getEdgeComponents(diskName);
    let componentPath = componentName.replace(/\./g, "/");

    if (components.includes(prefix + componentPath)) {
      componentPath = prefix + componentName.replace(/\./g, "/");
    } else if (components.includes(prefix + `components/${componentPath}`)) {
      componentPath = prefix + `components/${componentPath}`;
    } else if (components.includes(prefix + `${componentPath}/index`)) {
      componentPath = prefix + `${componentPath}/index`;
    } else if (
      components.includes(prefix + `components/${componentPath}/index`)
    ) {
      componentPath = prefix + `components/${componentPath}/index`;
    }

    return `\n@component("${componentPath}", { ${this.attributesToString(attributes)} })`;
  }

  protected attributesToString(attributes: Record<string, any>) {
    return Object.entries(attributes)
      .map(([key, value]) => `"${key}": ${value}`)
      .join(", ");
  }

  private getAttributesFromAttributeString(attributeString: string) {
    if (!attributeString) return {};

    const attributes: Record<string, any> = {};

    const attrPattern =
      /\s([:@]?[\w-:.]+)(?:=(?:"([^"]*)"|'([^']*)'|([^'"=<>\s]+)))?/g;
    let attrMatch;

    while ((attrMatch = attrPattern.exec(" " + attributeString)) !== null) {
      let attrName = attrMatch[1];
      if (!attrName) continue;

      const attrValue = attrMatch[2] || attrMatch[3] || attrMatch[4];
      const isBound = attrName.startsWith(":") && !attrName.startsWith("::");
      const escapeAttrRendering = attrName.startsWith("::");

      if (isBound || escapeAttrRendering) {
        attrName = attrName.slice(1);
      }

      if (isBound) {
        attributes[attrName] = attrValue;
      } else if (attrValue) {
        const isCurly = attrValue.match(/(\\)?{{(.*?)}}/);

        attributes[attrName] = isCurly
          ? "`" + attrValue.replace(/{{\s*([^}]+)\s*}}/g, "${$1}") + "`"
          : `"${attrValue}"`;
      } else {
        attributes[attrName] = `true`;
      }
    }

    return attributes;
  }
}
