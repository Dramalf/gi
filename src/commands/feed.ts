import { getConfig } from "../lib/config.js";
import {
  createClient,
  getFollowing,
  getPostIndex,
  readPost,
} from "../lib/github.js";
import type { FeedEntry } from "../lib/types.js";
import chalk from "chalk";

export async function feed(options: {
  limit?: number;
  full?: boolean;
  json?: boolean;
  user?: string;
}): Promise<void> {
  const config = getConfig();
  const octokit = createClient(config);
  const limit = options.limit ?? 20;

  // Determine which users to fetch
  let users: string[];
  if (options.user) {
    users = [options.user];
  } else {
    const following = await getFollowing(octokit, config.username);
    // Always include self
    users = [config.username, ...following];
  }

  if (users.length === 0) {
    console.log(chalk.yellow("You are not following anyone yet. Use `gi follow <username>` to follow someone."));
    return;
  }

  // Fetch index.json from all users in parallel
  const results = await Promise.allSettled(
    users.map(async (username) => {
      const { index } = await getPostIndex(octokit, username);
      return index.posts.slice(0, limit).map((p) => ({
        ...p,
        author: username,
      }));
    })
  );

  // Flatten and sort by created_at desc
  const entries: FeedEntry[] = [];
  for (const r of results) {
    if (r.status === "fulfilled") {
      entries.push(...r.value);
    }
  }
  entries.sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
  const feed = entries.slice(0, limit);

  if (feed.length === 0) {
    console.log(chalk.yellow("No posts found."));
    return;
  }

  // Optionally fetch full content
  if (options.full) {
    const withContent = await Promise.all(
      feed.map(async (entry) => {
        const post = await readPost(octokit, entry.author, entry.path);
        return { ...entry, content: post?.content ?? entry.preview };
      })
    );

    if (options.json) {
      console.log(JSON.stringify(withContent, null, 2));
      return;
    }

    for (const entry of withContent) {
      printPost(entry, true);
    }
    return;
  }

  if (options.json) {
    console.log(JSON.stringify(feed, null, 2));
    return;
  }

  for (const entry of feed) {
    printPost(entry, false);
  }
}

function printPost(entry: FeedEntry, full: boolean): void {
  const date = new Date(entry.created_at).toLocaleString();
  const tags = entry.tags.length ? chalk.cyan(entry.tags.map((t) => `#${t}`).join(" ")) : "";

  console.log(chalk.bold(`@${entry.author}`) + chalk.dim(` · ${date}`));
  if (tags) console.log(tags);
  console.log(full ? (entry.content ?? entry.preview) : entry.preview);
  if (entry.has_media) console.log(chalk.dim("[media attached]"));
  console.log(chalk.dim(`─`.repeat(60)));
}
