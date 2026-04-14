import fs from "fs";
import path from "path";
import { getConfig } from "../lib/config.js";
import { createClient, publishPost, uploadMedia } from "../lib/github.js";
import type { PostMeta } from "../lib/types.js";
import chalk from "chalk";

function generateId(): { id: string; timestamp: string } {
  const now = new Date();
  const yyyy = now.getUTCFullYear();
  const mm = String(now.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(now.getUTCDate()).padStart(2, "0");
  const hh = String(now.getUTCHours()).padStart(2, "0");
  const min = String(now.getUTCMinutes()).padStart(2, "0");
  const ss = String(now.getUTCSeconds()).padStart(2, "0");
  return {
    id: `${yyyy}${mm}${dd}-${hh}${min}${ss}`,
    timestamp: now.toISOString(),
  };
}

export async function post(
  content: string,
  options: {
    tags?: string;
    replyTo?: string;
    visibility?: string;
    media?: string;
  }
): Promise<void> {
  if (!content.trim()) {
    console.error(chalk.red("Post content cannot be empty."));
    process.exit(1);
  }

  const config = getConfig();
  const octokit = createClient(config);
  const { id, timestamp } = generateId();

  const tags = options.tags
    ? options.tags.split(",").map((t) => t.trim()).filter(Boolean)
    : [];

  const visibility = (options.visibility ?? "public") as PostMeta["visibility"];

  // Resolve and validate media files before posting
  const mediaPaths = options.media
    ? options.media.split(",").map((p) => p.trim()).filter(Boolean)
    : [];

  for (const p of mediaPaths) {
    if (!fs.existsSync(p)) {
      console.error(chalk.red(`Media file not found: ${p}`));
      process.exit(1);
    }
  }

  // Build post directory path (mirrors publishPost logic so media lands in the right place)
  const d = new Date(timestamp);
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd2 = String(d.getUTCDate()).padStart(2, "0");
  const ts = id.split("-")[1];
  const slug = content
    .slice(0, 30)
    .replace(/\s+/g, "-")
    .replace(/[^a-zA-Z0-9\u4e00-\u9fff-]/g, "")
    .toLowerCase();
  const dir = `posts/${yyyy}/${mm}/${dd2}/${ts}-${slug}`;

  const meta: PostMeta = {
    id,
    created_at: timestamp,
    type: options.replyTo ? "reply" : "post",
    reply_to: options.replyTo ?? null,
    tags,
    media: [],
    visibility,
  };

  console.log(`Publishing post ${chalk.dim(id)}...`);

  // Upload media files first (before the post commit so the path is known)
  if (mediaPaths.length > 0) {
    console.log(`Uploading ${mediaPaths.length} media file(s)...`);
    for (const filePath of mediaPaths) {
      const filename = path.basename(filePath);
      const buffer = fs.readFileSync(filePath);
      const url = await uploadMedia(octokit, config.username, dir, filename, buffer);
      meta.media.push(`media/${filename}`);
      console.log(chalk.dim(`  ✓ ${filename} → ${url}`));
    }
  }

  await publishPost(octokit, config.username, content.trim(), meta);

  console.log(chalk.green(`✓ Posted`));
  console.log(chalk.dim(`  path: ${dir}`));
  console.log(chalk.dim(`  tags: ${tags.length ? tags.join(", ") : "none"}`));
  if (meta.media.length > 0) {
    console.log(chalk.dim(`  media: ${meta.media.length} file(s) attached`));
  }
}
