"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.init = init;
const config_js_1 = require("../lib/config.js");
const github_js_1 = require("../lib/github.js");
const chalk_1 = __importDefault(require("chalk"));
async function branchExists(octokit, owner, branch) {
    try {
        await octokit.repos.getBranch({ owner, repo: github_js_1.REPO_NAME, branch });
        return true;
    }
    catch {
        return false;
    }
}
async function createBranchFromMain(octokit, owner, newBranch) {
    const { data: mainRef } = await octokit.git.getRef({
        owner,
        repo: github_js_1.REPO_NAME,
        ref: `heads/${github_js_1.PROFILE_BRANCH}`,
    });
    await octokit.git.createRef({
        owner,
        repo: github_js_1.REPO_NAME,
        ref: `refs/heads/${newBranch}`,
        sha: mainRef.object.sha,
    });
}
async function init(options) {
    const config = (0, config_js_1.getConfig)();
    const octokit = (0, github_js_1.createClient)(config);
    const owner = config.username;
    // 1. Create repo if it doesn't exist
    let repoExists = false;
    try {
        await octokit.repos.get({ owner, repo: github_js_1.REPO_NAME });
        repoExists = true;
        console.log(chalk_1.default.yellow(`Repo ${owner}/${github_js_1.REPO_NAME} already exists, checking branches...`));
    }
    catch {
        // repo doesn't exist, create it
    }
    if (!repoExists) {
        console.log(`Creating repo ${chalk_1.default.bold(`${owner}/${github_js_1.REPO_NAME}`)}...`);
        await octokit.repos.createForAuthenticatedUser({
            name: github_js_1.REPO_NAME,
            description: "My gi social profile",
            private: false,
            auto_init: true, // creates main branch with README
        });
        // Wait briefly for GitHub to finish initializing
        await new Promise((r) => setTimeout(r, 1500));
    }
    // 2. Set up main (profile) branch
    const mainExists = await branchExists(octokit, owner, github_js_1.PROFILE_BRANCH);
    if (!mainExists) {
        console.error(chalk_1.default.red("main branch not found even after repo creation."));
        process.exit(1);
    }
    // 3. Write profile.json on main
    const { data: ghUser } = await octokit.users.getAuthenticated();
    const profile = {
        display_name: options.name ?? ghUser.name ?? owner,
        bio: options.bio ?? ghUser.bio ?? "",
        avatar: ghUser.avatar_url,
        website: ghUser.blog ?? "",
        created_at: new Date().toISOString(),
    };
    await (0, github_js_1.putFile)(octokit, owner, "profile.json", JSON.stringify(profile, null, 2), "chore: init profile", github_js_1.PROFILE_BRANCH);
    console.log(chalk_1.default.green("✓ profile.json written to main"));
    // 4. Write following.json on main
    await (0, github_js_1.putFile)(octokit, owner, "following.json", JSON.stringify([], null, 2), "chore: init following list", github_js_1.PROFILE_BRANCH);
    console.log(chalk_1.default.green("✓ following.json written to main"));
    // 5. Set up posts branch
    const postsExists = await branchExists(octokit, owner, github_js_1.POSTS_BRANCH);
    if (!postsExists) {
        await createBranchFromMain(octokit, owner, github_js_1.POSTS_BRANCH);
        console.log(chalk_1.default.green("✓ posts branch created"));
    }
    else {
        console.log(chalk_1.default.yellow("posts branch already exists, skipping"));
    }
    // 6. Write initial index.json on posts branch
    const initialIndex = {
        total: 0,
        last_updated: new Date().toISOString(),
        posts: [],
    };
    await (0, github_js_1.putFile)(octokit, owner, "index.json", JSON.stringify(initialIndex, null, 2), "chore: init post index", github_js_1.POSTS_BRANCH);
    console.log(chalk_1.default.green("✓ index.json written to posts branch"));
    console.log(chalk_1.default.bold.green(`\nDone! Your social repo is ready at https://github.com/${owner}/${github_js_1.REPO_NAME}`));
}
