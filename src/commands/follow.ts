import { Octokit } from "@octokit/rest";
import { getConfig } from "../lib/config.js";
import {
  createClient,
  getFollowing,
  setFollowing,
  getProfile,
  REPO_NAME,
} from "../lib/github.js";
import chalk from "chalk";

async function userHasSocialRepo(octokit: Octokit, username: string): Promise<boolean> {
  try {
    await octokit.repos.get({ owner: username, repo: REPO_NAME });
    return true;
  } catch {
    return false;
  }
}

export async function follow(target: string): Promise<void> {
  const config = getConfig();
  const octokit = createClient(config);

  if (target === config.username) {
    console.error(chalk.red("You cannot follow yourself."));
    process.exit(1);
  }

  // Verify target has a social repo
  if (!(await userHasSocialRepo(octokit, target))) {
    console.error(chalk.red(`User @${target} does not have a social repo.`));
    process.exit(1);
  }

  const list = await getFollowing(octokit, config.username);
  if (list.includes(target)) {
    console.log(chalk.yellow(`Already following @${target}.`));
    return;
  }

  list.push(target);
  await setFollowing(octokit, config.username, list);
  console.log(chalk.green(`✓ Following @${target}`));
}

export async function unfollow(target: string): Promise<void> {
  const config = getConfig();
  const octokit = createClient(config);

  const list = await getFollowing(octokit, config.username);
  const next = list.filter((u) => u !== target);

  if (next.length === list.length) {
    console.log(chalk.yellow(`You are not following @${target}.`));
    return;
  }

  await setFollowing(octokit, config.username, next);
  console.log(chalk.green(`✓ Unfollowed @${target}`));
}

export async function following(): Promise<void> {
  const config = getConfig();
  const octokit = createClient(config);

  const list = await getFollowing(octokit, config.username);
  if (list.length === 0) {
    console.log(chalk.yellow("Not following anyone yet."));
    return;
  }

  const profiles = await Promise.allSettled(
    list.map(async (u) => ({ username: u, profile: await getProfile(octokit, u) }))
  );

  console.log(chalk.bold(`Following (${list.length}):`));
  for (const r of profiles) {
    if (r.status === "fulfilled") {
      const { username, profile } = r.value;
      const name = profile?.display_name ?? username;
      const bio = profile?.bio ? chalk.dim(` · ${profile.bio}`) : "";
      console.log(`  ${chalk.cyan("@" + username)} ${name}${bio}`);
    }
  }
}
