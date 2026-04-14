"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.follow = follow;
exports.unfollow = unfollow;
exports.following = following;
const config_js_1 = require("../lib/config.js");
const github_js_1 = require("../lib/github.js");
const chalk_1 = __importDefault(require("chalk"));
async function userHasSocialRepo(octokit, username) {
    try {
        await octokit.repos.get({ owner: username, repo: github_js_1.REPO_NAME });
        return true;
    }
    catch {
        return false;
    }
}
async function follow(target) {
    const config = (0, config_js_1.getConfig)();
    const octokit = (0, github_js_1.createClient)(config);
    if (target === config.username) {
        console.error(chalk_1.default.red("You cannot follow yourself."));
        process.exit(1);
    }
    // Verify target has a social repo
    if (!(await userHasSocialRepo(octokit, target))) {
        console.error(chalk_1.default.red(`User @${target} does not have a social repo.`));
        process.exit(1);
    }
    const list = await (0, github_js_1.getFollowing)(octokit, config.username);
    if (list.includes(target)) {
        console.log(chalk_1.default.yellow(`Already following @${target}.`));
        return;
    }
    list.push(target);
    await (0, github_js_1.setFollowing)(octokit, config.username, list);
    console.log(chalk_1.default.green(`✓ Following @${target}`));
}
async function unfollow(target) {
    const config = (0, config_js_1.getConfig)();
    const octokit = (0, github_js_1.createClient)(config);
    const list = await (0, github_js_1.getFollowing)(octokit, config.username);
    const next = list.filter((u) => u !== target);
    if (next.length === list.length) {
        console.log(chalk_1.default.yellow(`You are not following @${target}.`));
        return;
    }
    await (0, github_js_1.setFollowing)(octokit, config.username, next);
    console.log(chalk_1.default.green(`✓ Unfollowed @${target}`));
}
async function following() {
    const config = (0, config_js_1.getConfig)();
    const octokit = (0, github_js_1.createClient)(config);
    const list = await (0, github_js_1.getFollowing)(octokit, config.username);
    if (list.length === 0) {
        console.log(chalk_1.default.yellow("Not following anyone yet."));
        return;
    }
    const profiles = await Promise.allSettled(list.map(async (u) => ({ username: u, profile: await (0, github_js_1.getProfile)(octokit, u) })));
    console.log(chalk_1.default.bold(`Following (${list.length}):`));
    for (const r of profiles) {
        if (r.status === "fulfilled") {
            const { username, profile } = r.value;
            const name = profile?.display_name ?? username;
            const bio = profile?.bio ? chalk_1.default.dim(` · ${profile.bio}`) : "";
            console.log(`  ${chalk_1.default.cyan("@" + username)} ${name}${bio}`);
        }
    }
}
