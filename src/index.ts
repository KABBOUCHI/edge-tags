import type { PluginFn } from "edge.js/types";
import { ComponentTagCompiler } from "./component-tag-compiler";

export const edgeTags: PluginFn<any> = (edge) => {
  const initialized = edge.globals["edgeTagsInitialized"];

  if (initialized) {
    return;
  }

  edge.global("edgeTagsInitialized", true);

  edge.processor.process("raw", (value) => {
    const compiled = ComponentTagCompiler.make(edge).compile(value.raw);

    return compiled;
  });
};
