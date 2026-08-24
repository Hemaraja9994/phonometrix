export const PREVIEW_BRIDGE_CHANNEL = "grok-preview-bridge" as const;
export const PREVIEW_BRIDGE_VERSION = 1 as const;

export type PreviewHostBridgeOptions = {
  navigate: (path: string) => void;
  getRoutePaths: () => string[];
};

export function collectRoutePathsFromTree(tree: { children?: unknown[] } | undefined): string[] {
  const out: string[] = [];
  const walk = (node: any) => {
    if (!node) return;
    if (typeof node.fullPath === "string") out.push(node.fullPath);
    const kids = node.children ?? node._childById ?? [];
    const list = Array.isArray(kids) ? kids : Object.values(kids);
    for (const child of list) walk(child);
  };
  walk(tree);
  return out;
}

export function installPreviewHostBridge(_opts: PreviewHostBridgeOptions) {
  return () => {};
}

export function isGrokEmbedderOrigin() {
  return false;
}
