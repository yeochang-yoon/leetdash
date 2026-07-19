import { describe, expect, it } from "vitest";
import { buildRecentSolvedSubmissions } from "@/lib/progress";
import { SubmissionStatus, type Submission } from "@/lib/types";

function submission(overrides: Partial<Submission>): Submission {
  return {
    id: `ada:${overrides.problemSlug}`,
    userId: "ada",
    problemSlug: "two-sum",
    sourceKey: "top-interview-easy",
    submissionKey: "546",
    status: SubmissionStatus.SOLVED,
    source: "solution-file",
    generatedAt: "2024-01-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("dashboard progress helpers", () => {
  it("returns the five most recent solved submissions with user and problem labels", () => {
    const rows = [
      {
        id: "ada",
        displayName: "Ada Lovelace",
        githubUsername: "ada",
        submissions: [
          submission({
            problemSlug: "two-sum",
            sourceKey: "top-interview-easy",
            submissionKey: "546",
            submittedAt: "2024-01-06T00:00:00.000Z",
          }),
          submission({
            problemSlug: "valid-parentheses",
            sourceKey: "top-interview-easy",
            submissionKey: "721",
            submittedAt: "2024-01-02T00:00:00.000Z",
          }),
          submission({
            problemSlug: "merge-strings-alternately",
            sourceKey: "leetcode-75",
            submissionKey: "1768",
            status: SubmissionStatus.REVIEWING,
            submittedAt: "2024-01-07T00:00:00.000Z",
          }),
        ],
      },
      {
        id: "grace",
        displayName: "Grace Hopper",
        githubUsername: "grace",
        submissions: [
          submission({
            id: "grace:merge-sorted-array",
            userId: "grace",
            problemSlug: "merge-sorted-array",
            sourceKey: "top-interview-150",
            submissionKey: "88",
            submittedAt: "2024-01-05T00:00:00.000Z",
          }),
          submission({
            id: "grace:remove-duplicates-from-sorted-array",
            userId: "grace",
            problemSlug: "remove-duplicates-from-sorted-array",
            sourceKey: "top-interview-150",
            submissionKey: "26",
            submittedAt: "2024-01-04T00:00:00.000Z",
          }),
          submission({
            id: "grace:search-insert-position",
            userId: "grace",
            problemSlug: "search-insert-position",
            sourceKey: "top-interview-easy",
            submissionKey: "697",
            submittedAt: "2024-01-03T00:00:00.000Z",
          }),
          submission({
            id: "grace:plus-one",
            userId: "grace",
            problemSlug: "plus-one",
            sourceKey: "top-interview-easy",
            submissionKey: "559",
            submittedAt: "2024-01-01T00:00:00.000Z",
          }),
        ],
      },
    ];

    expect(buildRecentSolvedSubmissions(rows, 5)).toEqual([
      expect.objectContaining({
        displayName: "Ada Lovelace",
        problemTitle: "Two Sum",
        problemSlug: "two-sum",
        submittedAt: "2024-01-06T00:00:00.000Z",
      }),
      expect.objectContaining({
        displayName: "Grace Hopper",
        problemTitle: "Merge Sorted Array",
        problemSlug: "merge-sorted-array",
        submittedAt: "2024-01-05T00:00:00.000Z",
      }),
      expect.objectContaining({ problemSlug: "remove-duplicates-from-sorted-array" }),
      expect.objectContaining({ problemSlug: "search-insert-position" }),
      expect.objectContaining({ problemSlug: "valid-parentheses" }),
    ]);
  });
});
