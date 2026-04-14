"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.post = post;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const config_js_1 = require("../lib/config.js");
const github_js_1 = require("../lib/github.js");
const chalk_1 = __importDefault(require("chalk"));
function generateId() {
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
async function post(content, options) {
    if (!content.trim()) {
        console.error(chalk_1.default.red("Post content cannot be empty."));
        process.exit(1);
    }
    const config = (0, config_js_1.getConfig)();
    const octokit = (0, github_js_1.createClient)(config);
    const { id, timestamp } = generateId();
    const tags = options.tags
        ? options.tags.split(",").map((t) => t.trim()).filter(Boolean)
        : [];
    const visibility = (options.visibility ?? "public");
    // Resolve and validate media files before posting
    const mediaPaths = options.media
        ? options.media.split(",").map((p) => p.trim()).filter(Boolean)
        : [];
    for (const p of mediaPaths) {
        if (!fs_1.default.existsSync(p)) {
            console.error(chalk_1.default.red(`Media file not found: ${p}`));
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
    const meta = {
        id,
        created_at: timestamp,
        type: options.replyTo ? "reply" : "post",
        reply_to: options.replyTo ?? null,
        tags,
        media: [],
        visibility,
    };
    console.log(`Publishing post ${chalk_1.default.dim(id)}...`);
    // Upload media files first (before the post commit so the path is known)
    if (mediaPaths.length > 0) {
        console.log(`Uploading ${mediaPaths.length} media file(s)...`);
        for (const filePath of mediaPaths) {
            const filename = path_1.default.basename(filePath);
            const buffer = fs_1.default.readFileSync(filePath);
            const url = await (0, github_js_1.uploadMedia)(octokit, config.username, dir, filename, buffer);
            meta.media.push(`media/${filename}`);
            console.log(chalk_1.default.dim(`  ✓ ${filename} → ${url}`));
        }
    }
    await (0, github_js_1.publishPost)(octokit, config.username, content.trim(), meta);
    console.log(chalk_1.default.green(`✓ Posted`));
    console.log(chalk_1.default.dim(`  path: ${dir}`));
    console.log(chalk_1.default.dim(`  tags: ${tags.length ? tags.join(", ") : "none"}`));
    if (meta.media.length > 0) {
        console.log(chalk_1.default.dim(`  media: ${meta.media.length} file(s) attached`));
    }
}
