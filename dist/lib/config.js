"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getConfig = getConfig;
exports.saveConfig = saveConfig;
exports.configExists = configExists;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const os_1 = __importDefault(require("os"));
const CONFIG_DIR = path_1.default.join(os_1.default.homedir(), ".gi");
const CONFIG_FILE = path_1.default.join(CONFIG_DIR, "config.json");
function getConfig() {
    if (!fs_1.default.existsSync(CONFIG_FILE)) {
        console.error('Not authenticated. Run "gi auth <github_token>" to set up your credentials.');
        process.exit(1);
    }
    const raw = fs_1.default.readFileSync(CONFIG_FILE, "utf-8");
    return JSON.parse(raw);
}
function saveConfig(config) {
    if (!fs_1.default.existsSync(CONFIG_DIR)) {
        fs_1.default.mkdirSync(CONFIG_DIR, { recursive: true });
    }
    fs_1.default.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
}
function configExists() {
    return fs_1.default.existsSync(CONFIG_FILE);
}
