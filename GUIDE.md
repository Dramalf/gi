# gi — GitHub Social CLI: Agent Guide

`gi` is a CLI tool that uses GitHub as a social media backend.
Each user owns a GitHub repo named `social` with two permanent branches:
- `master` — static profile data (rarely changes)
- `posts` — all posts + index (append-only)

The CLI binary is `gi`. Run commands with `npx tsx /Users/bytedance/code/gi/src/index.ts <command>`
or with the installed binary `gi <command>` after `npm run build && npm link`.

---

## Authentication

Before any command, credentials must exist at `~/.gi/config.json`.
If missing, authenticate first:

```bash
gi auth <GITHUB_PERSONAL_ACCESS_TOKEN>
```

The token needs `repo` scope (to create/write to the `social` repo).

---

## Initialize a new social repo

Run once per account to create the GitHub repo and branch structure:

```bash
gi init
gi init --name "Alice" --bio "Building things on the internet"
```

This creates:
- `github.com/<username>/social` (public repo)
- `main` branch with `profile.json` and `following.json`
- `posts` branch with an empty `index.json`

---

## Publishing a post

```bash
gi post "Content of the post goes here"
gi post "Just shipped something cool" --tags "dev,shipping"
gi post "Replying to your thought" --reply-to "20240115-143022"
gi post "Private note to self" --visibility private
```

Options:
- `--tags <tags>` — comma-separated tags, no spaces (e.g. `travel,photo,food`)
- `--reply-to <id>` — reply to a post by its ID (format: `YYYYMMDD-HHmmss`)
- `--visibility <level>` — `public` (default) | `followers` | `private`
- `--media <paths>` — comma-separated local file paths to attach (e.g. `photo.jpg` or `/tmp/img.png,/tmp/clip.mp4`)

Media files are committed to the `posts` branch under `<post-dir>/media/` and accessible via:
`https://raw.githubusercontent.com/<username>/social/posts/<post-dir>/media/<filename>`

GitHub enforces a 100 MB per-file limit for API uploads. For larger videos use GitHub Releases instead.

A post creates two files on the `posts` branch and updates `index.json`:
```
posts/YYYY/MM/DD/HHmmss-<slug>/content.md   ← the text
posts/YYYY/MM/DD/HHmmss-<slug>/post.json    ← metadata (id, tags, visibility…)
index.json                                   ← updated with new entry at top
```

Post IDs have the format `YYYYMMDD-HHmmss` (UTC). Keep this if you need to reference a post.

---

## Reading the feed

```bash
gi feed                        # latest 20 posts from self + following
gi feed --limit 10             # limit number of posts
gi feed --full                 # fetch full content (not just 100-char preview)
gi feed --json                 # output raw JSON (best for agent processing)
gi feed --user alice           # show only alice's posts
```

JSON output shape (one object per post):
```json
{
  "author": "alice",
  "id": "20240115-143022",
  "path": "posts/2024/01/15/143022-just-shipped",
  "preview": "Just shipped something cool",
  "tags": ["dev", "shipping"],
  "has_media": false,
  "created_at": "2024-01-15T14:30:22Z",
  "content": "..."           // only present when --full is used
}
```

---

## Following / unfollowing

```bash
gi follow alice
gi unfollow alice
gi following                   # list everyone you follow
```

Follow state is stored in `following.json` on the `main` branch of your own repo.
Target user must have a `social` repo — otherwise the command will fail.

---

## Profile management

```bash
gi whoami                      # display your current profile
gi profile --name "Alice"      # update display name
gi profile --bio "New bio"     # update bio
gi profile --website "https://alice.dev"
```

---

## Data layout reference

### `main` branch (profile layer)

| File | Description |
|------|-------------|
| `profile.json` | Display name, bio, avatar URL, website, created_at |
| `following.json` | Array of GitHub usernames being followed |

### `posts` branch (content layer)

| File | Description |
|------|-------------|
| `index.json` | Full post index — read this first to understand a user's content |
| `posts/YYYY/MM/DD/HHmmss-<slug>/content.md` | Post body (plain markdown) |
| `posts/YYYY/MM/DD/HHmmss-<slug>/post.json` | Post metadata |

### `post.json` schema
```json
{
  "id": "20240115-143022",
  "created_at": "2024-01-15T14:30:22Z",
  "type": "post",
  "reply_to": null,
  "tags": ["dev"],
  "media": [],
  "visibility": "public"
}
```

### `index.json` schema
```json
{
  "total": 42,
  "last_updated": "2024-01-15T18:00:00Z",
  "posts": [
    {
      "id": "20240115-180000",
      "path": "posts/2024/01/15/180000-sunset",
      "preview": "First 100 chars of content...",
      "tags": ["travel"],
      "has_media": false,
      "created_at": "2024-01-15T18:00:00Z"
    }
  ]
}
```

---

## Common agent workflows

**Post on behalf of the user:**
```bash
gi post "Your message here" --tags "tag1,tag2"
```

**Check what the user has posted recently:**
```bash
gi feed --user <username> --limit 5 --json
```

**Check the full feed in machine-readable form:**
```bash
gi feed --json --limit 10
```

**Look up a specific user's profile:**
```bash
# GitHub API directly — no gi command needed
curl https://raw.githubusercontent.com/<username>/social/main/profile.json
curl https://raw.githubusercontent.com/<username>/social/posts/index.json
```
