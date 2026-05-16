import ts from "typescript";
import { describe, expect, it } from "vitest";
import { jsdocOf, narrativeFromDoc, semanticTagsFromDoc } from "../packages/adapters/src/jsdoc";

describe("semantic JSDoc extraction", () => {
  it("extracts Galaxy Graph narrative and semantic tags", () => {
    const sf = ts.createSourceFile("demo.ts", `/**
 * Human description.
 * @summary Short summary.
 * @why The reason.
 * @flow A -> B.
 * @story User-visible test story.
 * @category contract
 */
export const demo = 1;`, ts.ScriptTarget.Latest, true);
    const stmt = sf.statements[0];
    const doc = jsdocOf(stmt);
    expect(narrativeFromDoc(doc)).toMatchObject({ description: "Human description.", summary: "Short summary.", why: "The reason.", flow: "A -> B." });
    expect(semanticTagsFromDoc(doc)).toMatchObject({ story: "User-visible test story.", category: "contract" });
  });
});
