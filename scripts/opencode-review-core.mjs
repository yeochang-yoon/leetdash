const solutionPathPattern = /^submissions\/([^/]+)\/([^/]+)\/([^/]+)\/solution\.([^.\/]+)$/i;
const leetCodeLangSlugs = Object.freeze({
  c: "c",
  cc: "cpp",
  cpp: "cpp",
  cs: "csharp",
  dart: "dart",
  go: "golang",
  java: "java",
  js: "javascript",
  kt: "kotlin",
  php: "php",
  py: "python3",
  rb: "ruby",
  rs: "rust",
  scala: "scala",
  sql: "mysql",
  swift: "swift",
  ts: "typescript",
});

class ReviewFailure extends Error {
  constructor({ stage, reason, detail, retryable = false, httpStatus, requestId }) {
    super(detail);
    this.name = "ReviewFailure";
    this.stage = stage;
    this.reason = reason;
    this.detail = detail;
    this.retryable = retryable;
    this.httpStatus = httpStatus;
    this.requestId = requestId;
  }
}

function catalogFailure(detail) {
  return new ReviewFailure({
    stage: "catalog-resolve",
    reason: "CATALOG_MAPPING_FAILED",
    detail,
  });
}

function problemFailure(detail) {
  return new ReviewFailure({
    stage: "problem-parse",
    reason: "PROBLEM_DATA_INVALID",
    detail,
  });
}

function parseSubmissionSolutionPath(path) {
  const match = solutionPathPattern.exec(path);
  if (!match) {
    throw catalogFailure("제출 solution 경로를 해석하지 못했습니다.");
  }

  const [, user, sourceKey, submissionKey, extension] = match;
  const filename = path.slice(path.lastIndexOf("/") + 1);
  return { path, user, sourceKey, submissionKey, filename, extension: extension.toLowerCase() };
}

function resolveCatalogProblem(path, catalog) {
  const parsedPath = parseSubmissionSolutionPath(path);
  const list = catalog?.lists?.find((entry) => entry.key === parsedPath.sourceKey);
  if (!list) {
    throw catalogFailure("제출 목록을 찾지 못했습니다.");
  }

  const item = list.items?.find((entry) => String(entry.submissionKey) === parsedPath.submissionKey);
  if (!item) {
    throw catalogFailure("제출 문제를 찾지 못했습니다.");
  }

  const problem = catalog?.problems?.find((entry) => entry.slug === item.slug);
  if (!problem) {
    throw catalogFailure("정식 문제 정보를 찾지 못했습니다.");
  }

  return { ...parsedPath, slug: item.slug, problem };
}

function getLeetCodeLangSlug(extension) {
  const langSlug = typeof extension === "string" ? leetCodeLangSlugs[extension.toLowerCase()] : undefined;
  if (!langSlug) {
    throw problemFailure("제출 언어를 LeetCode 공식 template에 매핑하지 못했습니다.");
  }
  return langSlug;
}

function hasText(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function normalizeQuestionData(rawQuestion, extension) {
  const langSlug = getLeetCodeLangSlug(extension);
  const content = rawQuestion?.content;
  if (!hasText(content)) {
    throw problemFailure("LeetCode 문제 본문이 비어 있습니다.");
  }

  const exampleTestcases = rawQuestion?.exampleTestcases;
  if (!hasText(exampleTestcases)) {
    throw problemFailure("LeetCode 예제 테스트 케이스가 비어 있습니다.");
  }

  let metadata;
  try {
    metadata = JSON.parse(rawQuestion?.metaData);
  } catch {
    throw problemFailure("LeetCode judge metadata가 유효하지 않습니다.");
  }
  if (!metadata || Array.isArray(metadata) || typeof metadata !== "object") {
    throw problemFailure("LeetCode judge metadata가 유효하지 않습니다.");
  }

  const snippet = Array.isArray(rawQuestion?.codeSnippets)
    ? rawQuestion.codeSnippets.find((entry) => entry?.langSlug === langSlug)
    : undefined;
  if (!hasText(snippet?.code)) {
    throw problemFailure("제출 언어의 LeetCode 공식 코드 template을 찾지 못했습니다.");
  }

  const topicTags = Array.isArray(rawQuestion?.topicTags)
    ? rawQuestion.topicTags
      .filter((tag) => typeof tag?.name === "string" && typeof tag?.slug === "string")
      .map(({ name, slug }) => ({ name, slug }))
    : [];

  return { content, exampleTestcases, metadata, codeTemplate: snippet.code, topicTags };
}

export {
  ReviewFailure,
  getLeetCodeLangSlug,
  normalizeQuestionData,
  parseSubmissionSolutionPath,
  resolveCatalogProblem,
};
