import { Octokit } from "@octokit/rest";
import type { Config, PostIndex, PostMeta, Profile } from "./types.js";

export const REPO_NAME = "social";
export const PROFILE_BRANCH = "master";
export const POSTS_BRANCH = "posts";

export function createClient(config: Config): Octokit {
  return new Octokit({ auth: config.token });
}

// ─── Low-level helpers ───────────────────────────────────────────────────────

export async function getFile(
  octokit: Octokit,
  owner: string,
  path: string,
  ref: string
): Promise<{ content: string; sha: string } | null> {
  try {
    const res = await octokit.repos.getContent({ owner, repo: REPO_NAME, path, ref });
    const data = res.data as { content: string; sha: string };
    return {
      content: Buffer.from(data.content, "base64").toString("utf-8"),
      sha: data.sha,
    };
  } catch {
    return null;
  }
}

export async function putFile(
  octokit: Octokit,
  owner: string,
  filePath: string,
  content: string,
  message: string,
  branch: string,
  sha?: string
): Promise<void> {
  await octokit.repos.createOrUpdateFileContents({
    owner,
    repo: REPO_NAME,
    path: filePath,
    message,
    content: Buffer.from(content).toString("base64"),
    branch,
    ...(sha ? { sha } : {}),
  });
}

// ─── Profile ─────────────────────────────────────────────────────────────────

export async function getProfile(
  octokit: Octokit,
  username: string
): Promise<Profile | null> {
  const file = await getFile(octokit, username, "profile.json", PROFILE_BRANCH);
  if (!file) return null;
  return JSON.parse(file.content) as Profile;
}

export async function setProfile(
  octokit: Octokit,
  owner: string,
  profile: Profile
): Promise<void> {
  const existing = await getFile(octokit, owner, "profile.json", PROFILE_BRANCH);
  await putFile(
    octokit,
    owner,
    "profile.json",
    JSON.stringify(profile, null, 2),
    "chore: update profile",
    PROFILE_BRANCH,
    existing?.sha
  );
}

// ─── Following ───────────────────────────────────────────────────────────────

export async function getFollowing(
  octokit: Octokit,
  username: string
): Promise<string[]> {
  const file = await getFile(octokit, username, "following.json", PROFILE_BRANCH);
  if (!file) return [];
  return JSON.parse(file.content) as string[];
}

export async function setFollowing(
  octokit: Octokit,
  owner: string,
  list: string[]
): Promise<void> {
  const existing = await getFile(octokit, owner, "following.json", PROFILE_BRANCH);
  await putFile(
    octokit,
    owner,
    "following.json",
    JSON.stringify(list, null, 2),
    `chore: update following list`,
    PROFILE_BRANCH,
    existing?.sha
  );
}

// ─── Post index ──────────────────────────────────────────────────────────────

export async function getPostIndex(
  octokit: Octokit,
  username: string
): Promise<{ index: PostIndex; sha: string | undefined }> {
  const file = await getFile(octokit, username, "index.json", POSTS_BRANCH);
  if (!file) {
    return {
      index: { total: 0, last_updated: new Date().toISOString(), posts: [] },
      sha: undefined,
    };
  }
  return { index: JSON.parse(file.content) as PostIndex, sha: file.sha };
}

// ─── Media upload ────────────────────────────────────────────────────────────

export async function uploadMedia(
  octokit: Octokit,
  owner: string,
  dir: string,
  filename: string,
  fileBuffer: Buffer
): Promise<string> {
  const filePath = `${dir}/media/${filename}`;
  await octokit.repos.createOrUpdateFileContents({
    owner,
    repo: REPO_NAME,
    path: filePath,
    message: `media: ${filename}`,
    content: fileBuffer.toString("base64"),
    branch: POSTS_BRANCH,
  });
  return `https://raw.githubusercontent.com/${owner}/${REPO_NAME}/${POSTS_BRANCH}/${filePath}`;
}

// ─── Publish post ─────────────────────────────────────────────────────────────

export async function publishPost(
  octokit: Octokit,
  owner: string,
  content: string,
  meta: PostMeta
): Promise<string> {
  const d = new Date(meta.created_at);
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  const ts = meta.id.split("-")[1]; // hhmmss part
  const slug = content
    .slice(0, 30)
    .replace(/\s+/g, "-")
    .replace(/[^a-zA-Z0-9\u4e00-\u9fff-]/g, "")
    .toLowerCase();
  const dir = `posts/${yyyy}/${mm}/${dd}/${ts}-${slug}`;

  // 1. Write content.md
  await putFile(
    octokit,
    owner,
    `${dir}/content.md`,
    content,
    `post: ${content.slice(0, 60)}`,
    POSTS_BRANCH
  );

  // 2. Write post.json
  await putFile(
    octokit,
    owner,
    `${dir}/post.json`,
    JSON.stringify(meta, null, 2),
    `meta: ${meta.id}`,
    POSTS_BRANCH
  );

  // 3. Update index.json
  const { index, sha } = await getPostIndex(octokit, owner);
  const entry = {
    id: meta.id,
    path: dir,
    preview: content.slice(0, 100),
    tags: meta.tags,
    has_media: meta.media.length > 0,
    created_at: meta.created_at,
  };
  index.posts.unshift(entry);
  index.total = index.posts.length;
  index.last_updated = new Date().toISOString();

  await putFile(
    octokit,
    owner,
    "index.json",
    JSON.stringify(index, null, 2),
    `index: add ${meta.id}`,
    POSTS_BRANCH,
    sha
  );

  return dir;
}

// ─── Read post ───────────────────────────────────────────────────────────────

export async function readPost(
  octokit: Octokit,
  username: string,
  postPath: string
): Promise<{ content: string; meta: PostMeta } | null> {
  const [contentFile, metaFile] = await Promise.all([
    getFile(octokit, username, `${postPath}/content.md`, POSTS_BRANCH),
    getFile(octokit, username, `${postPath}/post.json`, POSTS_BRANCH),
  ]);
  if (!contentFile || !metaFile) return null;
  return {
    content: contentFile.content,
    meta: JSON.parse(metaFile.content) as PostMeta,
  };
}
