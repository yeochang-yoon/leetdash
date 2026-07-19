export function getGithubProfileUrl(username: string) {
  const normalized = username.trim().replace(/^@+/, "");
  return `https://github.com/${encodeURIComponent(normalized)}`;
}
