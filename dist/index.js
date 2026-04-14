#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const auth_js_1 = require("./commands/auth.js");
const init_js_1 = require("./commands/init.js");
const post_js_1 = require("./commands/post.js");
const feed_js_1 = require("./commands/feed.js");
const follow_js_1 = require("./commands/follow.js");
const profile_js_1 = require("./commands/profile.js");
const program = new commander_1.Command();
program
    .name("gi")
    .description("GitHub-based social media CLI")
    .version("1.0.0");
// ─── Auth ────────────────────────────────────────────────────────────────────
program
    .command("auth <token>")
    .description("Authenticate with a GitHub personal access token (needs repo scope)")
    .action(auth_js_1.auth);
// ─── Init ────────────────────────────────────────────────────────────────────
program
    .command("init")
    .description("Create and initialize your social repo on GitHub")
    .option("--name <name>", "Display name")
    .option("--bio <bio>", "Profile bio")
    .action(init_js_1.init);
// ─── Post ─────────────────────────────────────────────────────────────────────
program
    .command("post <content>")
    .description("Publish a new post")
    .option("-t, --tags <tags>", "Comma-separated tags (e.g. travel,photo)")
    .option("-r, --reply-to <id>", "Reply to a post ID")
    .option("-v, --visibility <level>", "public | followers | private (default: public)")
    .option("-m, --media <paths>", "Comma-separated local file paths to attach (e.g. photo.jpg,video.mp4)")
    .action(post_js_1.post);
// ─── Feed ─────────────────────────────────────────────────────────────────────
program
    .command("feed")
    .description("Show the latest posts from people you follow (and yourself)")
    .option("-n, --limit <n>", "Number of posts to show", "20")
    .option("-f, --full", "Fetch full post content instead of preview")
    .option("--json", "Output raw JSON (useful for agents)")
    .option("-u, --user <username>", "Show feed for a specific user only")
    .action((opts) => (0, feed_js_1.feed)({ ...opts, limit: parseInt(opts.limit, 10) }));
// ─── Follow ───────────────────────────────────────────────────────────────────
program
    .command("follow <username>")
    .description("Follow a user")
    .action(follow_js_1.follow);
program
    .command("unfollow <username>")
    .description("Unfollow a user")
    .action(follow_js_1.unfollow);
program
    .command("following")
    .description("List who you are following")
    .action(follow_js_1.following);
// ─── Profile ──────────────────────────────────────────────────────────────────
program
    .command("whoami")
    .description("Show your profile")
    .action(profile_js_1.whoami);
program
    .command("profile")
    .description("Update your profile")
    .option("--name <name>", "Update display name")
    .option("--bio <bio>", "Update bio")
    .option("--website <url>", "Update website")
    .action(profile_js_1.updateProfile);
program.parse();
