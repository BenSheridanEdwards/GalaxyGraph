import ts from "typescript";
import type { NodeNarrative } from "@galaxy-graph/core";
import type { SemanticDocTags } from "./types.js";

export function jsdocText(comment: string | ts.NodeArray<ts.JSDocComment> | undefined): string {
  if (!comment) return "";
  if (typeof comment === "string") return comment;
  return comment.map((part: any) => part.text ?? "").join("");
}

export function jsdocOf(node: ts.Node): { description: string; tags: Record<string, string> } | null {
  let cur: any = node;
  while (cur && !cur.jsDoc) cur = cur.parent;
  if (!cur?.jsDoc?.length) return null;
  const doc = cur.jsDoc[cur.jsDoc.length - 1];
  if (doc.kind !== ts.SyntaxKind.JSDoc) return null;
  const description = jsdocText(doc.comment as any).trim();
  const tags: Record<string, string> = {};
  for (const tag of doc.tags ?? []) {
    tags[tag.tagName.text] = jsdocText((tag as any).comment).trim();
  }
  return { description, tags };
}

export function narrativeFromDoc(doc: ReturnType<typeof jsdocOf>): NodeNarrative | undefined {
  if (!doc) return undefined;
  const out: NodeNarrative = {
    ...(doc.description ? { description: doc.description } : {}),
    ...(doc.tags.summary ? { summary: doc.tags.summary } : {}),
    ...(doc.tags.why ? { why: doc.tags.why } : {}),
    ...(doc.tags.flow ? { flow: doc.tags.flow } : {}),
    ...(doc.tags.since ? { since: doc.tags.since } : {}),
  };
  return Object.keys(out).length ? out : undefined;
}

export function semanticTagsFromDoc(doc: ReturnType<typeof jsdocOf>): SemanticDocTags | undefined {
  if (!doc) return undefined;
  return {
    ...(narrativeFromDoc(doc) ?? {}),
    ...(doc.tags.story ? { story: doc.tags.story } : {}),
    ...(doc.tags.category ? { category: doc.tags.category } : {}),
  };
}

/** Human/AI authoring convention Galaxy Graph expects in backend code. */
export const GALAXY_JSDOC_SPEC = {
  service: ["@summary", "@why", "@flow", "@since"],
  endpoint: ["@summary", "@why", "@flow"],
  contract: ["@summary", "@why", "@flow"],
  test: ["@story", "@category"],
  topic: ["@summary", "@why"],
} as const;
