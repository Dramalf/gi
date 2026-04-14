import { Octokit } from "@octokit/rest";
import { getConfig } from "../lib/config.js";
import {
  createClient,
  REPO_NAME,
  PROFILE_BRANCH,
  POSTS_BRANCH,
  putFile,
} from "../lib/github.js";
import type { Profile, PostIndex } from "../lib/types.js";
import chalk from "chalk";

async function branchExists(
  octokit: Octokit,
  owner: string,
  branch: string
): Promise<boolean> {
  try {
    await octokit.repos.getBranch({ owner, repo: REPO_NAME, branch });
    return true;
  } catch {
    return false;
  }
}

async function createBranchFromMain(
  octokit: Octokit,
  owner: string,
  newBranch: string
): Promise<void> {
  const { data: mainRef } = await octokit.git.getRef({
    owner,
    repo: REPO_NAME,
    ref: `heads/${PROFILE_BRANCH}`,
  });
  await octokit.git.createRef({
    owner,
    repo: REPO_NAME,
    ref: `refs/heads/${newBranch}`,
    sha: mainRef.object.sha,
  });
}

export async function init(options: {
  name?: string;
  bio?: string;
}): Promise<void> {
  const config = getConfig();
  const octokit = createClient(config);
  const owner = config.username;

  // 1. Create repo if it doesn't exist
  let repoExists = false;
  try {
    await octokit.repos.get({ owner, repo: REPO_NAME });
    repoExists = true;
    console.log(chalk.yellow(`Repo ${owner}/${REPO_NAME} already exists, checking branches...`));
  } catch {
    // repo doesn't exist, create it
  }

  if (!repoExists) {
    console.log(`Creating repo ${chalk.bold(`${owner}/${REPO_NAME}`)}...`);
    await octokit.repos.createForAuthenticatedUser({
      name: REPO_NAME,
      description: "My gi social profile",
      private: false,
      auto_init: true, // creates main branch with README
    });
    // Wait briefly for GitHub to finish initializing
    await new Promise((r) => setTimeout(r, 1500));
  }

  // 2. Set up main (profile) branch
  const mainExists = await branchExists(octokit, owner, PROFILE_BRANCH);
  if (!mainExists) {
    console.error(chalk.red("main branch not found even after repo creation."));
    process.exit(1);
  }

  // 3. Write profile.json on main
  const { data: ghUser } = await octokit.users.getAuthenticated();
  const profile: Profile = {
    display_name: options.name ?? ghUser.name ?? owner,
    bio: options.bio ?? ghUser.bio ?? "",
    avatar: ghUser.avatar_url,
    website: ghUser.blog ?? "",
    created_at: new Date().toISOString(),
  };

  await putFile(
    octokit,
    owner,
    "profile.json",
    JSON.stringify(profile, null, 2),
    "chore: init profile",
    PROFILE_BRANCH
  );
  console.log(chalk.green("✓ profile.json written to main"));

  // 4. Write following.json on main
  await putFile(
    octokit,
    owner,
    "following.json",
    JSON.stringify([], null, 2),
    "chore: init following list",
    PROFILE_BRANCH
  );
  console.log(chalk.green("✓ following.json written to main"));

  // 5. Set up posts branch
  const postsExists = await branchExists(octokit, owner, POSTS_BRANCH);
  if (!postsExists) {
    await createBranchFromMain(octokit, owner, POSTS_BRANCH);
    console.log(chalk.green("✓ posts branch created"));
  } else {
    console.log(chalk.yellow("posts branch already exists, skipping"));
  }

  // 6. Write initial index.json on posts branch
  const initialIndex: PostIndex = {
    total: 0,
    last_updated: new Date().toISOString(),
    posts: [],
  };
  await putFile(
    octokit,
    owner,
    "index.json",
    JSON.stringify(initialIndex, null, 2),
    "chore: init post index",
    POSTS_BRANCH
  );
  console.log(chalk.green("✓ index.json written to posts branch"));

  console.log(
    chalk.bold.green(`\nDone! Your social repo is ready at https://github.com/${owner}/${REPO_NAME}`)
  );
}
