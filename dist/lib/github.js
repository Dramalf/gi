"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.POSTS_BRANCH = exports.PROFILE_BRANCH = exports.REPO_NAME = void 0;
exports.createClient = createClient;
exports.getFile = getFile;
exports.putFile = putFile;
exports.getProfile = getProfile;
exports.setProfile = setProfile;
exports.getFollowing = getFollowing;
exports.setFollowing = setFollowing;
exports.getPostIndex = getPostIndex;
exports.uploadMedia = uploadMedia;
exports.publishPost = publishPost;
exports.readPost = readPost;
const rest_1 = require("@octokit/rest");
exports.REPO_NAME = "social";
exports.PROFILE_BRANCH = "master";
exports.POSTS_BRANCH = "posts";
function createClient(config) {
    return new rest_1.Octokit({ auth: config.token });
}
// ─── Low-level helpers ───────────────────────────────────────────────────────
async function getFile(octokit, owner, path, ref) {
    try {
        const res = await octokit.repos.getContent({ owner, repo: exports.REPO_NAME, path, ref });
        const data = res.data;
        return {
            content: Buffer.from(data.content, "base64").toString("utf-8"),
            sha: data.sha,
        };
    }
    catch {
        return null;
    }
}
async function putFile(octokit, owner, filePath, content, message, branch, sha) {
    await octokit.repos.createOrUpdateFileContents({
        owner,
        repo: exports.REPO_NAME,
        path: filePath,
        message,
        content: Buffer.from(content).toString("base64"),
        branch,
        ...(sha ? { sha } : {}),
    });
}
// ─── Profile ─────────────────────────────────────────────────────────────────
async function getProfile(octokit, username) {
    const file = await getFile(octokit, username, "profile.json", exports.PROFILE_BRANCH);
    if (!file)
        return null;
    return JSON.parse(file.content);
}
async function setProfile(octokit, owner, profile) {
    const existing = await getFile(octokit, owner, "profile.json", exports.PROFILE_BRANCH);
    await putFile(octokit, owner, "profile.json", JSON.stringify(profile, null, 2), "chore: update profile", exports.PROFILE_BRANCH, existing?.sha);
}
// ─── Following ───────────────────────────────────────────────────────────────
async function getFollowing(octokit, username) {
    const file = await getFile(octokit, username, "following.json", exports.PROFILE_BRANCH);
    if (!file)
        return [];
    return JSON.parse(file.content);
}
async function setFollowing(octokit, owner, list) {
    const existing = await getFile(octokit, owner, "following.json", exports.PROFILE_BRANCH);
    await putFile(octokit, owner, "following.json", JSON.stringify(list, null, 2), `chore: update following list`, exports.PROFILE_BRANCH, existing?.sha);
}
// ─── Post index ──────────────────────────────────────────────────────────────
async function getPostIndex(octokit, username) {
    const file = await getFile(octokit, username, "index.json", exports.POSTS_BRANCH);
    if (!file) {
        return {
            index: { total: 0, last_updated: new Date().toISOString(), posts: [] },
            sha: undefined,
        };
    }
    return { index: JSON.parse(file.content), sha: file.sha };
}
// ─── Media upload ────────────────────────────────────────────────────────────
async function uploadMedia(octokit, owner, dir, filename, fileBuffer) {
    const filePath = `${dir}/media/${filename}`;
    await octokit.repos.createOrUpdateFileContents({
        owner,
        repo: exports.REPO_NAME,
        path: filePath,
        message: `media: ${filename}`,
        content: fileBuffer.toString("base64"),
        branch: exports.POSTS_BRANCH,
    });
    return `https://raw.githubusercontent.com/${owner}/${exports.REPO_NAME}/${exports.POSTS_BRANCH}/${filePath}`;
}
// ─── Publish post ─────────────────────────────────────────────────────────────
async function publishPost(octokit, owner, content, meta) {
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
    await putFile(octokit, owner, `${dir}/content.md`, content, `post: ${content.slice(0, 60)}`, exports.POSTS_BRANCH);
    // 2. Write post.json
    await putFile(octokit, owner, `${dir}/post.json`, JSON.stringify(meta, null, 2), `meta: ${meta.id}`, exports.POSTS_BRANCH);
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
    await putFile(octokit, owner, "index.json", JSON.stringify(index, null, 2), `index: add ${meta.id}`, exports.POSTS_BRANCH, sha);
    return dir;
}
// ─── Read post ───────────────────────────────────────────────────────────────
async function readPost(octokit, username, postPath) {
    const [contentFile, metaFile] = await Promise.all([
        getFile(octokit, username, `${postPath}/content.md`, exports.POSTS_BRANCH),
        getFile(octokit, username, `${postPath}/post.json`, exports.POSTS_BRANCH),
    ]);
    if (!contentFile || !metaFile)
        return null;
    return {
        content: contentFile.content,
        meta: JSON.parse(metaFile.content),
    };
}
