"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.whoami = whoami;
exports.updateProfile = updateProfile;
const config_js_1 = require("../lib/config.js");
const github_js_1 = require("../lib/github.js");
const chalk_1 = __importDefault(require("chalk"));
async function whoami() {
    const config = (0, config_js_1.getConfig)();
    const octokit = (0, github_js_1.createClient)(config);
    const profile = await (0, github_js_1.getProfile)(octokit, config.username);
    if (!profile) {
        console.log(chalk_1.default.yellow(`No profile found. Run "gi init" first.`));
        return;
    }
    console.log(chalk_1.default.bold(`@${config.username}`));
    console.log(`  Name:    ${profile.display_name}`);
    console.log(`  Bio:     ${profile.bio || chalk_1.default.dim("(empty)")}`);
    console.log(`  Website: ${profile.website || chalk_1.default.dim("(empty)")}`);
    console.log(`  Avatar:  ${profile.avatar}`);
    console.log(`  Joined:  ${new Date(profile.created_at).toLocaleDateString()}`);
}
async function updateProfile(options) {
    const config = (0, config_js_1.getConfig)();
    const octokit = (0, github_js_1.createClient)(config);
    const existing = await (0, github_js_1.getProfile)(octokit, config.username);
    if (!existing) {
        console.error(chalk_1.default.red(`Profile not found. Run "gi init" first.`));
        process.exit(1);
    }
    const updated = {
        display_name: options.name ?? existing.display_name,
        bio: options.bio ?? existing.bio,
        website: options.website ?? existing.website,
        avatar: existing.avatar,
        created_at: existing.created_at,
    };
    await (0, github_js_1.setProfile)(octokit, config.username, updated);
    console.log(chalk_1.default.green("✓ Profile updated"));
}
