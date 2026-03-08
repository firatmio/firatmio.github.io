export interface GitHubProfile {
  name: string;
  login: string;
  bio: string;
  avatar_url: string;
  html_url: string;
  public_repos: number;
  followers: number;
  following: number;
  location: string;
  blog: string;
  company: string | null;
}

export interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  html_url: string;
  homepage: string | null;
  language: string | null;
  stargazers_count: number;
  forks_count: number;
  topics: string[];
  created_at: string;
  updated_at: string;
}

const GITHUB_USERNAME = "firatmio";
const API_BASE = "https://api.github.com";

export async function fetchProfile(): Promise<GitHubProfile> {
  const res = await fetch(`${API_BASE}/users/${GITHUB_USERNAME}`, {
    next: { revalidate: 3600 },
    headers: { Accept: "application/vnd.github.v3+json" },
  });
  if (!res.ok) throw new Error("Failed to fetch GitHub profile");
  return res.json();
}

export async function fetchRepos(): Promise<GitHubRepo[]> {
  const res = await fetch(
    `${API_BASE}/users/${GITHUB_USERNAME}/repos?per_page=100&sort=updated`,
    {
      next: { revalidate: 3600 },
      headers: { Accept: "application/vnd.github.mercy-preview+json" },
    }
  );
  if (!res.ok) throw new Error("Failed to fetch GitHub repos");
  return res.json();
}

const FEATURED_REPOS = [
  "cardioguard-mg",
  "filmbox-promo",
  "omni-sketch",
  "codessa",
  "lynq-desktop",
  "lofi-pomodoro",
  "db-viewer",
  "reveal-animation",
];

export async function fetchFeaturedRepos(): Promise<GitHubRepo[]> {
  const allRepos = await fetchRepos();
  const featured = FEATURED_REPOS.map((name) =>
    allRepos.find((r) => r.name === name)
  ).filter((r): r is GitHubRepo => r !== undefined);

  if (featured.length < FEATURED_REPOS.length) {
    const remaining = allRepos
      .filter((r) => !FEATURED_REPOS.includes(r.name))
      .sort((a, b) => b.stargazers_count - a.stargazers_count)
      .slice(0, FEATURED_REPOS.length - featured.length);
    return [...featured, ...remaining];
  }
  return featured;
}
