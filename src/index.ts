#!/usr/bin/env node
import { Command } from "commander";
import { auth } from "./commands/auth.js";
import { init } from "./commands/init.js";
import { post } from "./commands/post.js";
import { feed } from "./commands/feed.js";
import { follow, unfollow, following } from "./commands/follow.js";
import { whoami, updateProfile } from "./commands/profile.js";

const program = new Command();

program
  .name("gi")
  .description("GitHub-based social media CLI")
  .version("1.0.0");

// ─── Auth ────────────────────────────────────────────────────────────────────
program
  .command("auth <token>")
  .description("Authenticate with a GitHub personal access token (needs repo scope)")
  .action(auth);

// ─── Init ────────────────────────────────────────────────────────────────────
program
  .command("init")
  .description("Create and initialize your social repo on GitHub")
  .option("--name <name>", "Display name")
  .option("--bio <bio>", "Profile bio")
  .action(init);

// ─── Post ─────────────────────────────────────────────────────────────────────
program
  .command("post <content>")
  .description("Publish a new post")
  .option("-t, --tags <tags>", "Comma-separated tags (e.g. travel,photo)")
  .option("-r, --reply-to <id>", "Reply to a post ID")
  .option("-v, --visibility <level>", "public | followers | private (default: public)")
  .option("-m, --media <paths>", "Comma-separated local file paths to attach (e.g. photo.jpg,video.mp4)")
  .action(post);

// ─── Feed ─────────────────────────────────────────────────────────────────────
program
  .command("feed")
  .description("Show the latest posts from people you follow (and yourself)")
  .option("-n, --limit <n>", "Number of posts to show", "20")
  .option("-f, --full", "Fetch full post content instead of preview")
  .option("--json", "Output raw JSON (useful for agents)")
  .option("-u, --user <username>", "Show feed for a specific user only")
  .action((opts) =>
    feed({ ...opts, limit: parseInt(opts.limit as string, 10) })
  );

// ─── Follow ───────────────────────────────────────────────────────────────────
program
  .command("follow <username>")
  .description("Follow a user")
  .action(follow);

program
  .command("unfollow <username>")
  .description("Unfollow a user")
  .action(unfollow);

program
  .command("following")
  .description("List who you are following")
  .action(following);

// ─── Profile ──────────────────────────────────────────────────────────────────
program
  .command("whoami")
  .description("Show your profile")
  .action(whoami);

program
  .command("profile")
  .description("Update your profile")
  .option("--name <name>", "Update display name")
  .option("--bio <bio>", "Update bio")
  .option("--website <url>", "Update website")
  .action(updateProfile);

program.parse();
