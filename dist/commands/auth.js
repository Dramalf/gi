"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.auth = auth;
const rest_1 = require("@octokit/rest");
const config_js_1 = require("../lib/config.js");
const chalk_1 = __importDefault(require("chalk"));
async function auth(token) {
    console.log("Verifying token...");
    const octokit = new rest_1.Octokit({ auth: token });
    let username;
    try {
        const { data } = await octokit.users.getAuthenticated();
        username = data.login;
    }
    catch {
        console.error(chalk_1.default.red("Invalid token or no network access."));
        process.exit(1);
        return; // unreachable but satisfies TypeScript
    }
    (0, config_js_1.saveConfig)({ token, username });
    console.log(chalk_1.default.green(`Authenticated as ${chalk_1.default.bold(username)}`));
}
