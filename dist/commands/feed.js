"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.feed = feed;
const config_js_1 = require("../lib/config.js");
const github_js_1 = require("../lib/github.js");
const chalk_1 = __importDefault(require("chalk"));
async function feed(options) {
    const config = (0, config_js_1.getConfig)();
    const octokit = (0, github_js_1.createClient)(config);
    const limit = options.limit ?? 20;
    // Determine which users to fetch
    let users;
    if (options.user) {
        users = [options.user];
    }
    else {
        const following = await (0, github_js_1.getFollowing)(octokit, config.username);
        // Always include self
        users = [config.username, ...following];
    }
    if (users.length === 0) {
        console.log(chalk_1.default.yellow("You are not following anyone yet. Use `gi follow <username>` to follow someone."));
        return;
    }
    // Fetch index.json from all users in parallel
    const results = await Promise.allSettled(users.map(async (username) => {
        const { index } = await (0, github_js_1.getPostIndex)(octokit, username);
        return index.posts.slice(0, limit).map((p) => ({
            ...p,
            author: username,
        }));
    }));
    // Flatten and sort by created_at desc
    const entries = [];
    for (const r of results) {
        if (r.status === "fulfilled") {
            entries.push(...r.value);
        }
    }
    entries.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    const feed = entries.slice(0, limit);
    if (feed.length === 0) {
        console.log(chalk_1.default.yellow("No posts found."));
        return;
    }
    // Optionally fetch full content
    if (options.full) {
        const withContent = await Promise.all(feed.map(async (entry) => {
            const post = await (0, github_js_1.readPost)(octokit, entry.author, entry.path);
            return { ...entry, content: post?.content ?? entry.preview };
        }));
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
function printPost(entry, full) {
    const date = new Date(entry.created_at).toLocaleString();
    const tags = entry.tags.length ? chalk_1.default.cyan(entry.tags.map((t) => `#${t}`).join(" ")) : "";
    console.log(chalk_1.default.bold(`@${entry.author}`) + chalk_1.default.dim(` · ${date}`));
    if (tags)
        console.log(tags);
    console.log(full ? (entry.content ?? entry.preview) : entry.preview);
    if (entry.has_media)
        console.log(chalk_1.default.dim("[media attached]"));
    console.log(chalk_1.default.dim(`─`.repeat(60)));
}
