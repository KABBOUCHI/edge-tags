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

  protected componentString(
    tagName: string,
    attributes: Record<string, any> = {},
  ): string {
    const diskName = tagName.match(/^(?:(\w+)::)?([\w\-:.]*)$/)?.[1];
    const prefix = diskName ? `${diskName}::` : "";

    const components =
      this.edge.loader
        .listComponents()
        .find((l) =>
          diskName
            ? l.diskName === diskName
            : !l.diskName || l.diskName === "default",
        )
        ?.components.map((c) => c.componentName) || [];

    let componentPath = tagName.replace(/\./g, "/");

    if (components.includes(prefix + componentPath)) {
      componentPath = tagName.replace(/\./g, "/");
    } else if (components.includes(prefix + `components/${componentPath}`)) {
      componentPath = `components/${componentPath}`;
    } else if (components.includes(prefix + `${componentPath}/index`)) {
      componentPath = `${componentPath}/index`;
    } else if (
      components.includes(prefix + `components/${componentPath}/index`)
    ) {
      componentPath = `components/${componentPath}/index`;
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
      const attrName = attrMatch[1];
      if (!attrName) continue;

      const attrValue = attrMatch[2] || attrMatch[3] || attrMatch[4];
      const isBound = attrName.startsWith(":");

      if (isBound) {
        attributes[attrName.slice(1)] = attrValue;
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
