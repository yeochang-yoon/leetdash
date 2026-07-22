import { describe, expect, it } from "vitest";

import {
  getLeetCodeLangSlug,
  normalizeQuestionData,
  parseSubmissionSolutionPath,
  resolveCatalogProblem,
} from "../scripts/opencode-review-core.mjs";

const catalog = {
  lists: [{ key: "top-interview-easy", items: [{ submissionKey: "1", slug: "two-sum" }] }],
  problems: [{ leetcodeId: 1, slug: "two-sum", title: "Two Sum", difficulty: "easy" }],
};

describe("submission problem resolution", () => {
  it("resolves a solution path through list item and canonical problem", () => {
    expect(resolveCatalogProblem("submissions/ada/top-interview-easy/1/Solution.java", catalog)).toMatchObject({
      user: "ada",
      sourceKey: "top-interview-easy",
      submissionKey: "1",
      extension: "java",
      slug: "two-sum",
      problem: catalog.problems[0],
    });
  });

  it.each([
    ["submissions/ada/top-interview-easy/1/meta.json", "CATALOG_MAPPING_FAILED"],
    ["submissions/ada/missing/1/Solution.java", "CATALOG_MAPPING_FAILED"],
    ["submissions/ada/top-interview-easy/2/Solution.java", "CATALOG_MAPPING_FAILED"],
  ])("fails closed for %s", (path, reason) => {
    expect(() => resolveCatalogProblem(path, catalog)).toThrowError(
      expect.objectContaining({ stage: "catalog-resolve", reason }),
    );
  });

  it("parses only the canonical five-segment solution path", () => {
    expect(parseSubmissionSolutionPath("submissions/ada/top-interview-easy/1/Solution.java")).toEqual({
      path: "submissions/ada/top-interview-easy/1/Solution.java",
      user: "ada",
      sourceKey: "top-interview-easy",
      submissionKey: "1",
      filename: "Solution.java",
      extension: "java",
    });
  });
});

const rawQuestion = {
  content: "<p>Find two numbers.</p>",
  exampleTestcases: "[2,7,11,15]\n9",
  metaData: JSON.stringify({ name: "twoSum", params: [{ name: "nums", type: "integer[]" }] }),
  codeSnippets: [
    { lang: "Java", langSlug: "java", code: "class Solution { public int[] twoSum(int[] nums, int target) {} }" },
    { lang: "Python3", langSlug: "python3", code: "class Solution:\n    def twoSum(self, nums, target):" },
  ],
  topicTags: [{ name: "Array", slug: "array" }, { name: "Hash Table", slug: "hash-table" }],
};

describe("LeetCode question normalization", () => {
  it.each([
    ["c", "c"],
    ["cc", "cpp"],
    ["cpp", "cpp"],
    ["cs", "csharp"],
    ["dart", "dart"],
    ["go", "golang"],
    ["java", "java"],
    ["js", "javascript"],
    ["kt", "kotlin"],
    ["php", "php"],
    ["py", "python3"],
    ["rb", "ruby"],
    ["rs", "rust"],
    ["scala", "scala"],
    ["sql", "mysql"],
    ["swift", "swift"],
    ["ts", "typescript"],
  ])("maps %s to LeetCode %s", (extension, slug) => {
    expect(getLeetCodeLangSlug(extension)).toBe(slug);
  });

  it("normalizes valid live question data for the submission language", () => {
    expect(normalizeQuestionData(rawQuestion, "java")).toEqual({
      content: rawQuestion.content,
      exampleTestcases: rawQuestion.exampleTestcases,
      metadata: { name: "twoSum", params: [{ name: "nums", type: "integer[]" }] },
      codeTemplate: rawQuestion.codeSnippets[0].code,
      topicTags: rawQuestion.topicTags,
    });
  });

  it.each([
    ["an unsupported extension", () => normalizeQuestionData(rawQuestion, "zig"), "제출 언어를 LeetCode 공식 template에 매핑하지 못했습니다."],
    ["missing content", () => normalizeQuestionData({ ...rawQuestion, content: "" }, "java"), "LeetCode 문제 본문이 비어 있습니다."],
    ["blank examples", () => normalizeQuestionData({ ...rawQuestion, exampleTestcases: "  " }, "java"), "LeetCode 예제 테스트 케이스가 비어 있습니다."],
    ["invalid metadata", () => normalizeQuestionData({ ...rawQuestion, metaData: "[]" }, "java"), "LeetCode judge metadata가 유효하지 않습니다."],
    ["missing matching snippet", () => normalizeQuestionData({ ...rawQuestion, codeSnippets: [] }, "java"), "제출 언어의 LeetCode 공식 코드 template을 찾지 못했습니다."],
  ])("fails safely for %s", (_description, normalize, detail) => {
    expect(normalize).toThrowError(
      expect.objectContaining({ stage: "problem-parse", reason: "PROBLEM_DATA_INVALID", detail, retryable: false }),
    );
  });

  it("fails safely for an unsupported language mapping", () => {
    expect(() => getLeetCodeLangSlug("zig")).toThrowError(
      expect.objectContaining({
        stage: "problem-parse",
        reason: "PROBLEM_DATA_INVALID",
        detail: "제출 언어를 LeetCode 공식 template에 매핑하지 못했습니다.",
        retryable: false,
      }),
    );
  });
});
