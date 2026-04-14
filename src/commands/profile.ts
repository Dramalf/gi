import { getConfig } from "../lib/config.js";
import { createClient, getProfile, setProfile } from "../lib/github.js";
import type { Profile } from "../lib/types.js";
import chalk from "chalk";

export async function whoami(): Promise<void> {
  const config = getConfig();
  const octokit = createClient(config);

  const profile = await getProfile(octokit, config.username);
  if (!profile) {
    console.log(chalk.yellow(`No profile found. Run "gi init" first.`));
    return;
  }

  console.log(chalk.bold(`@${config.username}`));
  console.log(`  Name:    ${profile.display_name}`);
  console.log(`  Bio:     ${profile.bio || chalk.dim("(empty)")}`);
  console.log(`  Website: ${profile.website || chalk.dim("(empty)")}`);
  console.log(`  Avatar:  ${profile.avatar}`);
  console.log(`  Joined:  ${new Date(profile.created_at).toLocaleDateString()}`);
}

export async function updateProfile(options: {
  name?: string;
  bio?: string;
  website?: string;
}): Promise<void> {
  const config = getConfig();
  const octokit = createClient(config);

  const existing = await getProfile(octokit, config.username);
  if (!existing) {
    console.error(chalk.red(`Profile not found. Run "gi init" first.`));
    process.exit(1);
  }

  const updated: Profile = {
    display_name: options.name ?? existing.display_name,
    bio: options.bio ?? existing.bio,
    website: options.website ?? existing.website,
    avatar: existing.avatar,
    created_at: existing.created_at,
  };

  await setProfile(octokit, config.username, updated);
  console.log(chalk.green("✓ Profile updated"));
}
