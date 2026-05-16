import type { GalaxyGraphDataset, NodeNarrative } from "@galaxy-graph/core";

export interface AdapterContext {
  /** Absolute or cwd-relative backend repository root. */
  rootDir: string;
}

export interface GalaxyGraphAdapter {
  name: string;
  generate(context: AdapterContext): Promise<Partial<GalaxyGraphDataset>>;
}

export interface SemanticDocTags extends NodeNarrative {
  story?: string;
  category?: string;
}

export interface AnnotationWarning {
  file: string;
  message: string;
}
