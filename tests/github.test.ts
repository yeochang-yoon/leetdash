import { describe, expect, it } from "vitest";
import { getGithubProfileUrl } from "@/lib/github";

describe("github links", () => {
  it("builds a profile URL from a github username", () => {
    expect(getGithubProfileUrl("whoisyourbias")).toBe("https://github.com/whoisyourbias");
  });

  it("trims whitespace and a leading at sign", () => {
    expect(getGithubProfileUrl(" @octocat ")).toBe("https://github.com/octocat");
  });
});
