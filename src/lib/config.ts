import fs from "fs";
import path from "path";
import os from "os";
import type { Config } from "./types.js";

const CONFIG_DIR = path.join(os.homedir(), ".gi");
const CONFIG_FILE = path.join(CONFIG_DIR, "config.json");

export function getConfig(): Config {
  if (!fs.existsSync(CONFIG_FILE)) {
    console.error(
      'Not authenticated. Run "gi auth <github_token>" to set up your credentials.'
    );
    process.exit(1);
  }
  const raw = fs.readFileSync(CONFIG_FILE, "utf-8");
  return JSON.parse(raw) as Config;
}

export function saveConfig(config: Config): void {
  if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR, { recursive: true });
  }
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
}

export function configExists(): boolean {
  return fs.existsSync(CONFIG_FILE);
}
