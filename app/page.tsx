import { fetchProfile, fetchFeaturedRepos, type GitHubRepo } from "@/lib/github";
import PageContent from "./PageContent";

export default async function Home() {
  let avatarUrl = "https://avatars.githubusercontent.com/u/84281538?v=4";
  let repoCount = 57;
  let contributions = 2299;
  let repos: GitHubRepo[] = [];

  try {
    const [profile, featuredRepos] = await Promise.all([
      fetchProfile(),
      fetchFeaturedRepos(),
    ]);
    avatarUrl = profile.avatar_url;
    repoCount = profile.public_repos;
    repos = featuredRepos;
  } catch {
    // Fallback to static data if API fails
  }

  return (
    <PageContent
      avatarUrl={avatarUrl}
      repoCount={repoCount}
      contributions={contributions}
      repos={repos}
    />
  );
}
