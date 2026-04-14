import { Octokit } from "@octokit/rest";
import { saveConfig } from "../lib/config.js";
import chalk from "chalk";

export async function auth(token: string): Promise<void> {
  console.log("Verifying token...");

  const octokit = new Octokit({ auth: token });
  let username: string;

  try {
    const { data } = await octokit.users.getAuthenticated();
    username = data.login;
  } catch {
    console.error(chalk.red("Invalid token or no network access."));
    process.exit(1);
    return; // unreachable but satisfies TypeScript
  }

  saveConfig({ token, username });
  console.log(chalk.green(`Authenticated as ${chalk.bold(username)}`));
}
