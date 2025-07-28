import { createFilter } from "@rollup/pluginutils";
import type { PluginCreator, Node } from "postcss";

const DEFAULT_INCLUDE = "**/*.module.css";
const DEFAULT_LAYERNAME = "components";

type ConfigItem = {
  include?: string;
  layerName?: string;
};
export type PluginOptions = ConfigItem[];

const plugin: PluginCreator<PluginOptions> = (
  configItems = [
    {
      include: DEFAULT_INCLUDE,
      layerName: DEFAULT_LAYERNAME,
    },
  ]
) => {
  const filters: { filter: (id: string) => boolean; layerName: string }[] = [];

  for (const config of configItems) {
    const filter = createFilter(config.include ?? DEFAULT_INCLUDE);
    filters.push({ filter, layerName: config.layerName ?? DEFAULT_LAYERNAME });
  }

  return {
    postcssPlugin: "postcss-assign-layers",
    Once(root, { AtRule }) {
      const inputFile = root.source?.input.file;
      const layerNames = [];

      for (const { filter, layerName } of filters) {
        if (inputFile && filter(inputFile)) {
          layerNames.push(layerName);
        }
      }

      for (const layerName of layerNames) {
        const importNodes: Node[] = [];
        const regularNodes: Node[] = [];

        for (const node of root.nodes) {
          if (node.type === "atrule" && node.name === "import") {
            importNodes.push(node);
          } else {
            regularNodes.push(node);
          }
        }

        const layer = new AtRule({
          name: "layer",
          params: layerName,
          nodes: regularNodes,
        });

        root.removeAll();
        root.append(importNodes);
        root.append(layer);
      }
    },
  };
};
plugin.postcss = true;

export default plugin;
